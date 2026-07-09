require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");
const { v4: uuidv4 } = require("uuid");

const app = express();

const PORT = Number(process.env.PORT || 3000);
const TRUST_PROXY = Number(process.env.TRUST_PROXY || 0);
const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB || 10);
const UPLOAD_ROOT = path.resolve(process.env.UPLOAD_DIR || "./data/uploads");
const TMP_UPLOAD_DIR = path.join(UPLOAD_ROOT, "tmp");
const APP_BASE_URL = String(process.env.APP_BASE_URL || `http://localhost:${PORT}`).replace(/\/$/, "");
const ADMIN_EMAIL = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const ADMIN_PASSWORD = String(process.env.ADMIN_PASSWORD || "");
const ADMIN_SESSION_SECRET = String(process.env.ADMIN_SESSION_SECRET || "change-me-in-production");
const DEFAULT_INVITE_DAYS = Number(process.env.DEFAULT_INVITE_DAYS || 7);

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error("SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY are required.");
}

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required.");
}

if (process.env.SUPABASE_PUBLISHABLE_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  // eslint-disable-next-line no-console
  console.warn("Using SUPABASE_PUBLISHABLE_KEY. This requires RLS policies that allow anon role operations.");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

if (!fs.existsSync(TMP_UPLOAD_DIR)) {
  fs.mkdirSync(TMP_UPLOAD_DIR, { recursive: true });
}

if (TRUST_PROXY) {
  app.set("trust proxy", TRUST_PROXY);
}

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "same-site" }
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
});
app.use("/api", limiter);

function monthsBetween(startDate, endDate) {
  const years = endDate.getFullYear() - startDate.getFullYear();
  const months = endDate.getMonth() - startDate.getMonth();
  let total = years * 12 + months;

  if (endDate.getDate() < startDate.getDate()) {
    total -= 1;
  }

  return Math.max(0, total);
}

function parseBool(input) {
  return String(input).toLowerCase() === "true";
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function getInviteValidationError(invite) {
  if (!invite) {
    return "Invalid invite link.";
  }

  if (invite.usedAt) {
    return "This invite link has already been used.";
  }

  if (new Date(invite.expiresAt) < new Date()) {
    return "This invite link has expired.";
  }

  return null;
}

function buildAdminToken(email) {
  const payload = {
    email,
    exp: Date.now() + 12 * 60 * 60 * 1000
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = crypto.createHmac("sha256", ADMIN_SESSION_SECRET).update(encodedPayload).digest("base64url");
  return `${encodedPayload}.${signature}`;
}

function verifyAdminToken(token) {
  if (!token || !token.includes(".")) {
    return { ok: false };
  }

  const [encodedPayload, signature] = token.split(".");
  const expected = crypto.createHmac("sha256", ADMIN_SESSION_SECRET).update(encodedPayload).digest("base64url");

  if (signature.length !== expected.length) {
    return { ok: false };
  }

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    return { ok: false };
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
    if (!payload?.email || payload.exp < Date.now()) {
      return { ok: false };
    }
    return { ok: true, email: String(payload.email).toLowerCase() };
  } catch (_err) {
    return { ok: false };
  }
}

function requireAdmin(req, res, next) {
  const authHeader = String(req.headers.authorization || "");
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  const verified = verifyAdminToken(token);

  if (!verified.ok || verified.email !== ADMIN_EMAIL) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  req.adminEmail = verified.email;
  return next();
}

function isValidRole(role) {
  return role === "driver" || role === "helper";
}

function isValidStatus(status) {
  return status === "invited" || status === "submitted" || status === "reviewed";
}

async function findInviteByToken(token) {
  const tokenHash = hashToken(token);
  const { data, error } = await supabase
    .from("driver_invites")
    .select("id, profile_id, email, token_hash, expires_at, used_at")
    .eq("token_hash", tokenHash)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    profileId: data.profile_id,
    email: data.email,
    expiresAt: data.expires_at,
    usedAt: data.used_at
  };
}

function safeUnlink(filePath) {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

function cleanupTempFiles(filesByField) {
  if (!filesByField) {
    return;
  }

  Object.values(filesByField).forEach((fileList) => {
    fileList.forEach((file) => safeUnlink(file.path));
  });
}

function validateAddressHistory(addresses) {
  if (!Array.isArray(addresses) || addresses.length === 0) {
    return { ok: false, message: "At least one address is required." };
  }

  const now = new Date();
  let totalMonths = 0;

  for (const addr of addresses) {
    if (!addr.street || !addr.city || !addr.state || !addr.zip || !addr.moveInDate) {
      return { ok: false, message: "Each address must include full location and move-in date." };
    }

    const moveIn = new Date(addr.moveInDate);
    const moveOut = addr.current ? now : new Date(addr.moveOutDate);

    if (Number.isNaN(moveIn.getTime()) || Number.isNaN(moveOut.getTime())) {
      return { ok: false, message: "Address dates are invalid." };
    }

    if (moveOut < moveIn) {
      return { ok: false, message: "Address move-out date cannot be earlier than move-in date." };
    }

    totalMonths += monthsBetween(moveIn, moveOut);
  }

  if (totalMonths < 36) {
    return { ok: false, message: "Address history must cover at least the past 3 years." };
  }

  return { ok: true };
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, TMP_UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
    cb(null, `${file.fieldname}-${unique}${ext}`);
  }
});

function imageFileFilter(_req, file, cb) {
  const allowed = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
  if (!allowed.includes(file.mimetype)) {
    cb(new Error("Only image files are allowed (JPG, PNG, WEBP)."));
    return;
  }
  cb(null, true);
}

const upload = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024 },
  fileFilter: imageFileFilter
});

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/admin", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.get("/onboarding", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "onboarding.html"));
});

app.post("/api/admin/login", (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Invalid admin credentials." });
  }

  const token = buildAdminToken(email);
  return res.status(200).json({ token });
});

app.post("/api/admin/profiles", requireAdmin, async (req, res) => {
  try {
    const firstName = String(req.body.firstName || "").trim();
    const lastName = String(req.body.lastName || "").trim();
    const role = String(req.body.role || "driver").trim().toLowerCase();
    const email = String(req.body.email || "").trim().toLowerCase();
    const phone = String(req.body.phone || "").trim();
    const expiresInDays = Number(req.body.expiresInDays || DEFAULT_INVITE_DAYS);

    if (!firstName || !lastName || !email || !phone) {
      return res.status(400).json({ error: "Missing required profile fields." });
    }

    if (!isValidRole(role)) {
      return res.status(400).json({ error: "Role must be either driver or helper." });
    }

    if (!Number.isFinite(expiresInDays) || expiresInDays < 1 || expiresInDays > 30) {
      return res.status(400).json({ error: "Expiry days must be between 1 and 30." });
    }

    const { data: profile, error: profileError } = await supabase
      .from("driver_profiles")
      .upsert(
        {
          first_name: firstName,
          last_name: lastName,
          role,
          email,
          phone
        },
        { onConflict: "email" }
      )
      .select("id, email, role")
      .single();

    if (profileError) {
      return res.status(500).json({ error: profileError.message });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();

    const { error: inviteError } = await supabase.from("driver_invites").insert({
      id: uuidv4(),
      profile_id: profile.id,
      email,
      token_hash: tokenHash,
      expires_at: expiresAt,
      created_by: req.adminEmail
    });

    if (inviteError) {
      return res.status(500).json({ error: inviteError.message });
    }

    return res.status(201).json({
      profileId: profile.id,
      email,
      role: profile.role,
      onboardingUrl: `${APP_BASE_URL}/onboarding?invite=${rawToken}`,
      expiresAt
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Server error." });
  }
});

app.get("/api/admin/dashboard", requireAdmin, async (_req, res) => {
  try {
    const { data: profiles, error: profileError } = await supabase
      .from("driver_profiles")
      .select("id, role, status");

    if (profileError) {
      return res.status(500).json({ error: profileError.message });
    }

    const { data: teams, error: teamError } = await supabase.from("team_assignments").select("id, status");
    if (teamError) {
      return res.status(500).json({ error: teamError.message });
    }

    const safeProfiles = profiles || [];
    const safeTeams = teams || [];

    return res.status(200).json({
      totalPeople: safeProfiles.length,
      drivers: safeProfiles.filter((p) => p.role === "driver").length,
      helpers: safeProfiles.filter((p) => p.role === "helper").length,
      invited: safeProfiles.filter((p) => p.status === "invited").length,
      submitted: safeProfiles.filter((p) => p.status === "submitted").length,
      reviewed: safeProfiles.filter((p) => p.status === "reviewed").length,
      teamsActive: safeTeams.filter((t) => t.status === "active").length,
      teamsInactive: safeTeams.filter((t) => t.status === "inactive").length
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Server error." });
  }
});

app.get("/api/admin/profiles", requireAdmin, async (req, res) => {
  try {
    const role = String(req.query.role || "").trim().toLowerCase();
    let query = supabase
      .from("driver_profiles")
      .select("id, first_name, last_name, role, email, phone, status, created_at")
      .order("created_at", { ascending: false });

    if (role) {
      if (!isValidRole(role)) {
        return res.status(400).json({ error: "Invalid role filter." });
      }
      query = query.eq("role", role);
    }

    const { data, error } = await query;
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ profiles: data || [] });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Server error." });
  }
});

app.patch("/api/admin/profiles/:id", requireAdmin, async (req, res) => {
  try {
    const id = String(req.params.id || "").trim();
    const updates = {};

    if (req.body.firstName !== undefined) {
      const firstName = String(req.body.firstName).trim();
      if (!firstName) {
        return res.status(400).json({ error: "First name cannot be empty." });
      }
      updates.first_name = firstName;
    }

    if (req.body.lastName !== undefined) {
      const lastName = String(req.body.lastName).trim();
      if (!lastName) {
        return res.status(400).json({ error: "Last name cannot be empty." });
      }
      updates.last_name = lastName;
    }

    if (req.body.email !== undefined) {
      const email = String(req.body.email).trim().toLowerCase();
      if (!email) {
        return res.status(400).json({ error: "Email cannot be empty." });
      }
      updates.email = email;
    }

    if (req.body.phone !== undefined) {
      const phone = String(req.body.phone).trim();
      if (!phone) {
        return res.status(400).json({ error: "Phone cannot be empty." });
      }
      updates.phone = phone;
    }

    if (req.body.role !== undefined) {
      const role = String(req.body.role).trim().toLowerCase();
      if (!isValidRole(role)) {
        return res.status(400).json({ error: "Role must be driver or helper." });
      }
      updates.role = role;
    }

    if (req.body.status !== undefined) {
      const status = String(req.body.status).trim().toLowerCase();
      if (!isValidStatus(status)) {
        return res.status(400).json({ error: "Status must be invited, submitted, or reviewed." });
      }
      updates.status = status;
    }

    if (!Object.keys(updates).length) {
      return res.status(400).json({ error: "No updates were provided." });
    }

    const { data, error } = await supabase
      .from("driver_profiles")
      .update(updates)
      .eq("id", id)
      .select("id, first_name, last_name, role, email, phone, status, created_at")
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ profile: data });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Server error." });
  }
});

app.get("/api/admin/onboarding-status", requireAdmin, async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("driver_profiles")
      .select("id, first_name, last_name, role, email, status, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ rows: data || [] });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Server error." });
  }
});

app.get("/api/admin/teams", requireAdmin, async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("team_assignments")
      .select(
        "id, status, created_at, driver_profile_id, helper_profile_id, driver:driver_profile_id(id, first_name, last_name, email), helper:helper_profile_id(id, first_name, last_name, email)"
      )
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ teams: data || [] });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Server error." });
  }
});

app.post("/api/admin/teams", requireAdmin, async (req, res) => {
  try {
    const driverProfileId = String(req.body.driverProfileId || "").trim();
    const helperProfileId = String(req.body.helperProfileId || "").trim();
    const status = String(req.body.status || "active").trim().toLowerCase();

    if (!driverProfileId || !helperProfileId) {
      return res.status(400).json({ error: "Driver and helper are required." });
    }

    if (driverProfileId === helperProfileId) {
      return res.status(400).json({ error: "Driver and helper must be different people." });
    }

    if (status !== "active" && status !== "inactive") {
      return res.status(400).json({ error: "Team status must be active or inactive." });
    }

    const { data: members, error: memberError } = await supabase
      .from("driver_profiles")
      .select("id, role")
      .in("id", [driverProfileId, helperProfileId]);

    if (memberError) {
      return res.status(500).json({ error: memberError.message });
    }

    const driver = (members || []).find((m) => m.id === driverProfileId);
    const helper = (members || []).find((m) => m.id === helperProfileId);
    if (!driver || !helper) {
      return res.status(400).json({ error: "Selected profiles were not found." });
    }

    if (driver.role !== "driver" || helper.role !== "helper") {
      return res.status(400).json({ error: "Team must use a driver profile and a helper profile." });
    }

    const { data, error } = await supabase
      .from("team_assignments")
      .insert({
        id: uuidv4(),
        driver_profile_id: driverProfileId,
        helper_profile_id: helperProfileId,
        status
      })
      .select(
        "id, status, created_at, driver_profile_id, helper_profile_id, driver:driver_profile_id(id, first_name, last_name, email), helper:helper_profile_id(id, first_name, last_name, email)"
      )
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json({ team: data });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Server error." });
  }
});

app.patch("/api/admin/teams/:id", requireAdmin, async (req, res) => {
  try {
    const id = String(req.params.id || "").trim();
    const status = String(req.body.status || "").trim().toLowerCase();

    if (status !== "active" && status !== "inactive") {
      return res.status(400).json({ error: "Status must be active or inactive." });
    }

    const { data, error } = await supabase
      .from("team_assignments")
      .update({ status })
      .eq("id", id)
      .select("id, status, created_at, driver_profile_id, helper_profile_id")
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ team: data });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Server error." });
  }
});

app.get("/api/invite/verify", async (req, res) => {
  const token = String(req.query.token || "").trim();
  if (!token) {
    return res.status(400).json({ error: "Missing invite token." });
  }

  try {
    const invite = await findInviteByToken(token);
    const inviteError = getInviteValidationError(invite);
    if (inviteError) {
      return res.status(400).json({ error: inviteError });
    }

    return res.status(200).json({
      email: invite.email,
      expiresAt: invite.expiresAt
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Unable to verify invite." });
  }
});

app.post(
  "/api/onboarding",
  upload.fields([
    { name: "licenseFront", maxCount: 1 },
    { name: "licenseBack", maxCount: 1 },
    { name: "ssnImage", maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const files = req.files || {};
      const {
        firstName,
        lastName,
        dob,
        email,
        phone,
        backgroundConsent,
        consentName,
        consentDate,
        inviteToken
      } = req.body;

      if (!inviteToken) {
        cleanupTempFiles(files);
        return res.status(400).json({ error: "Invite token is required." });
      }

      const invite = await findInviteByToken(inviteToken);
      const inviteError = getInviteValidationError(invite);
      if (inviteError) {
        cleanupTempFiles(files);
        return res.status(400).json({ error: inviteError });
      }

      if (!firstName || !lastName || !dob || !email || !phone) {
        cleanupTempFiles(files);
        return res.status(400).json({ error: "Missing required personal information." });
      }

      if (String(email).trim().toLowerCase() !== String(invite.email).trim().toLowerCase()) {
        cleanupTempFiles(files);
        return res.status(400).json({ error: "This onboarding link is only valid for the invited email." });
      }

      if (!parseBool(backgroundConsent) || !consentName || !consentDate) {
        cleanupTempFiles(files);
        return res.status(400).json({ error: "Background check consent is required." });
      }

      if (!files.licenseFront?.[0] || !files.licenseBack?.[0] || !files.ssnImage?.[0]) {
        cleanupTempFiles(files);
        return res.status(400).json({ error: "All required document images must be uploaded." });
      }

      let addresses = [];
      try {
        addresses = JSON.parse(req.body.addresses || "[]");
      } catch (_err) {
        cleanupTempFiles(files);
        return res.status(400).json({ error: "Address history format is invalid." });
      }

      const addressValidation = validateAddressHistory(addresses);
      if (!addressValidation.ok) {
        cleanupTempFiles(files);
        return res.status(400).json({ error: addressValidation.message });
      }

      const applicationId = uuidv4();
      const applicationDir = path.join(UPLOAD_ROOT, applicationId);
      fs.mkdirSync(applicationDir, { recursive: true });

      const docMap = {
        licenseFront: files.licenseFront[0],
        licenseBack: files.licenseBack[0],
        ssnImage: files.ssnImage[0]
      };

      Object.entries(docMap).forEach(([key, file]) => {
        const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
        const dest = path.join(applicationDir, `${key}${ext}`);
        fs.renameSync(file.path, dest);
      });

      const applicationRecord = {
        id: applicationId,
        submittedAt: new Date().toISOString(),
        inviteId: invite.id,
        profileId: invite.profileId,
        personalInfo: {
          firstName,
          lastName,
          dob,
          email,
          phone
        },
        addresses,
        backgroundCheckConsent: {
          consentGiven: true,
          consentName,
          consentDate
        }
      };

      fs.writeFileSync(
        path.join(applicationDir, "application.json"),
        JSON.stringify(applicationRecord, null, 2),
        "utf8"
      );

      const usedAt = new Date().toISOString();
      const { error: appInsertError } = await supabase.from("driver_applications").insert({
        id: applicationId,
        profile_id: invite.profileId,
        invite_id: invite.id,
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        dob,
        addresses,
        consent_name: consentName,
        consent_date: consentDate,
        submitted_at: usedAt,
        document_path: applicationDir
      });

      if (appInsertError) {
        return res.status(500).json({ error: appInsertError.message });
      }

      const { error: inviteUpdateError } = await supabase
        .from("driver_invites")
        .update({ used_at: usedAt })
        .eq("id", invite.id)
        .is("used_at", null);

      if (inviteUpdateError) {
        return res.status(500).json({ error: inviteUpdateError.message });
      }

      const { error: profileUpdateError } = await supabase
        .from("driver_profiles")
        .update({ status: "submitted" })
        .eq("id", invite.profileId);

      if (profileUpdateError) {
        return res.status(500).json({ error: profileUpdateError.message });
      }

      return res.status(201).json({
        message: "Application submitted successfully.",
        applicationId
      });
    } catch (err) {
      cleanupTempFiles(req.files || {});
      return res.status(500).json({ error: err.message || "Server error." });
    }
  }
);

app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: `File too large. Max size is ${MAX_UPLOAD_MB}MB.` });
    }
    return res.status(400).json({ error: err.message });
  }

  if (err) {
    return res.status(400).json({ error: err.message || "Bad request." });
  }

  return res.status(500).json({ error: "Unexpected error." });
});

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Bella Vista onboarding app running on port ${PORT}`);
});
