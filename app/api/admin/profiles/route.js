import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import { APP_BASE_URL, DEFAULT_INVITE_DAYS } from "@/lib/app-config";
import { json, isValidRole, requireAdmin } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { hashToken } from "@/lib/onboarding";

export const runtime = "nodejs";

export async function GET(request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const role = String(new URL(request.url).searchParams.get("role") || "").trim().toLowerCase();
    let query = supabase
      .from("driver_profiles")
      .select("id, first_name, last_name, role, email, phone, status, created_at")
      .order("created_at", { ascending: false });

    if (role) {
      if (!isValidRole(role)) {
        return json({ error: "Invalid role filter." }, 400);
      }
      query = query.eq("role", role);
    }

    const { data, error } = await query;
    if (error) {
      return json({ error: error.message }, 500);
    }

    return json({ profiles: data || [] });
  } catch (error) {
    return json({ error: error.message || "Server error." }, 500);
  }
}

export async function POST(request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const body = await request.json();
    const firstName = String(body.firstName || "").trim();
    const lastName = String(body.lastName || "").trim();
    const role = String(body.role || "driver").trim().toLowerCase();
    const email = String(body.email || "").trim().toLowerCase();
    const phone = String(body.phone || "").trim();
    const expiresInDays = Number(body.expiresInDays || DEFAULT_INVITE_DAYS);

    if (!firstName || !lastName || !email || !phone) {
      return json({ error: "Missing required profile fields." }, 400);
    }

    if (!isValidRole(role)) {
      return json({ error: "Role must be either driver or helper." }, 400);
    }

    if (!Number.isFinite(expiresInDays) || expiresInDays < 1 || expiresInDays > 30) {
      return json({ error: "Expiry days must be between 1 and 30." }, 400);
    }

    const { data: profile, error: profileError } = await supabase
      .from("driver_profiles")
      .upsert({ first_name: firstName, last_name: lastName, role, email, phone }, { onConflict: "email" })
      .select("id, email, role")
      .single();

    if (profileError) {
      return json({ error: profileError.message }, 500);
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
      created_by: auth.email
    });

    if (inviteError) {
      console.error("[admin/profiles] invite insert failed:", inviteError.message);
      return json({ error: inviteError.message }, 500);
    }

    console.log("[admin/profiles] invite created for", email, "token_hash:", tokenHash);

    return json(
      {
        profileId: profile.id,
        email,
        role: profile.role,
        onboardingUrl: `${APP_BASE_URL}/onboarding?invite=${rawToken}`,
        expiresAt
      },
      201
    );
  } catch (error) {
    return json({ error: error.message || "Server error." }, 500);
  }
}
