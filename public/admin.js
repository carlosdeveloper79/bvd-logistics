const logoutBtn = document.getElementById("logoutBtn");
const navMenu = document.getElementById("navMenu");
const globalStatus = document.getElementById("globalStatus");

// ── Modal helpers ─────────────────────────────────────────
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = "flex";
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = "none";
}
// Close on overlay click or X button
document.addEventListener("click", (e) => {
  const x = e.target.closest("[data-close-modal]");
  if (x) { closeModal(x.dataset.closeModal); return; }
  if (e.target.classList.contains("ap-modal-overlay")) {
    closeModal(e.target.id);
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document.querySelectorAll(".ap-modal-overlay").forEach((m) => {
      if (m.style.display !== "none") closeModal(m.id);
    });
  }
});

const loginGate = document.getElementById("loginGate");
const adminCard = document.getElementById("adminCard");
const adminLoginForm = document.getElementById("adminLoginForm");
const adminLoginStatus = document.getElementById("adminLoginStatus");
const adminLoginBtn = document.getElementById("adminLoginBtn");

function showGate() {
  loginGate.classList.remove("is-hidden");
  adminCard.classList.add("is-hidden");
}

function showDashboard() {
  loginGate.classList.add("is-hidden");
  adminCard.classList.remove("is-hidden");
}

function setLoginStatus(msg, isError = true) {
  if (!msg) { adminLoginStatus.className = "notification is-hidden"; return; }
  adminLoginStatus.textContent = msg;
  adminLoginStatus.className = `notification ${isError ? "is-danger" : "is-success"}`;
}

adminLoginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("adminLoginEmail").value.trim();
  const password = document.getElementById("adminLoginPassword").value;
  adminLoginBtn.disabled = true;
  adminLoginBtn.textContent = "Signing in…";
  setLoginStatus("");
  try {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Invalid credentials.");
    setToken(data.token);
    adminLoginForm.reset();
    showDashboard();
    await refreshAll();
  } catch (err) {
    setLoginStatus(err.message || "Sign in failed.");
  } finally {
    adminLoginBtn.disabled = false;
    adminLoginBtn.textContent = "Sign In";
  }
});

const profileFormDrivers = document.getElementById("profileFormDrivers");
const profileFormHelpers = document.getElementById("profileFormHelpers");
const inviteResultDrivers = document.getElementById("inviteResultDrivers");
const inviteResultHelpers = document.getElementById("inviteResultHelpers");
const inviteUrlDrivers = document.getElementById("inviteUrlDrivers");
const inviteUrlHelpers = document.getElementById("inviteUrlHelpers");

const driversTableBody = document.getElementById("driversTableBody");
const helpersTableBody = document.getElementById("helpersTableBody");
const statusTableBody = document.getElementById("statusTableBody");
const teamsTableBody = document.getElementById("teamsTableBody");
const statsCards = document.getElementById("statsCards");

const teamForm = document.getElementById("teamForm");
const teamDriverSelect = document.getElementById("teamDriverSelect");
const teamHelperSelect = document.getElementById("teamHelperSelect");

const TOKEN_KEY = "bvd_admin_token";

function setNotification(el, message, type = "is-danger") {
  if (!message) {
    el.textContent = "";
    el.className = "notification is-hidden";
    return;
  }
  el.textContent = message;
  el.className = `notification ${type}`;
}

function setGlobalStatus(message, isError = true) {
  setNotification(globalStatus, message, isError ? "is-danger" : "is-success");
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function setView(viewName) {
  Array.from(document.querySelectorAll(".view-panel")).forEach((panel) => {
    panel.classList.toggle("is-hidden", panel.id !== `view-${viewName}`);
  });

  Array.from(navMenu.querySelectorAll("a[data-view]"))
    .forEach((link) => link.classList.toggle("is-active", link.dataset.view === viewName));
}

async function api(path, options = {}) {
  const token = getToken();
  const headers = {
    ...(options.headers || {}),
    "Content-Type": "application/json"
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(path, {
    ...options,
    headers
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
  }

  return payload;
}

const STATUS_COLORS = { invited: "#e8f1fa;color:#1a4a72", submitted: "#fff7e0;color:#7a5500", reviewed: "#e8f7ee;color:#1a5c34" };

function statusBadge(status) {
  const style = STATUS_COLORS[status] || "#f0f0f0;color:#333";
  const [bg, fg] = style.split(";");
  return `<span style="display:inline-block;padding:0.22rem 0.65rem;border-radius:999px;font-size:0.72rem;font-weight:700;background:${bg};${fg};letter-spacing:0.04em;text-transform:uppercase">${status}</span>`;
}

// In-memory profile cache keyed by id
const profilesCache = new Map();

function profileRow(profile) {
  profilesCache.set(profile.id, profile);
  return `
    <tr data-id="${profile.id}">
      <td style="font-weight:600">${profile.first_name} ${profile.last_name}</td>
      <td>${profile.email}</td>
      <td>${profile.phone}</td>
      <td>${statusBadge(profile.status)}</td>
      <td><button class="button is-small is-link view-profile-btn" type="button">View Details</button></td>
    </tr>
  `;
}

function onboardingStatusRow(profile) {
  return `
    <tr data-id="${profile.id}">
      <td>${profile.first_name} ${profile.last_name}</td>
      <td>${profile.role}</td>
      <td>${profile.email}</td>
      <td>${statusBadge(profile.status)}</td>
      <td>${new Date(profile.created_at).toLocaleDateString()}</td>
      <td><button class="button is-small is-link save-status-btn" type="button">Mark Reviewed</button></td>
    </tr>
  `;
}

function teamRow(team) {
  const driverName = team.driver ? `${team.driver.first_name} ${team.driver.last_name}` : "Unknown";
  const helperName = team.helper ? `${team.helper.first_name} ${team.helper.last_name}` : "Unknown";
  const nextStatus = team.status === "active" ? "inactive" : "active";
  const btnStyle = team.status === "active"
    ? "background:#fff3e0;color:#8a4000;border:1px solid #f5cba0"
    : "background:#e8f7ee;color:#1a5c34;border:1px solid #a6d9b8";

  return `
    <tr data-id="${team.id}">
      <td>${driverName}</td>
      <td>${helperName}</td>
      <td>${statusBadge(team.status)}</td>
      <td>${new Date(team.created_at).toLocaleDateString()}</td>
      <td><button class="button is-small toggle-team-btn" style="${btnStyle};border-radius:6px;font-weight:600" type="button" data-next-status="${nextStatus}">Set ${nextStatus}</button></td>
    </tr>
  `;
}

function populateTeamSelect(selectEl, profiles, placeholder) {
  const options = [`<option value="">${placeholder}</option>`]
    .concat(profiles.map((p) => `<option value="${p.id}">${p.first_name} ${p.last_name} (${p.email})</option>`));
  selectEl.innerHTML = options.join("");
}

function renderStats(stats) {
  const cards = [
    ["Total People", stats.totalPeople, "#e8f1fa", "#0c2d4a"],
    ["Drivers", stats.drivers, "#e8f7ee", "#1a5c34"],
    ["Helpers", stats.helpers, "#f0ecfa", "#4a1a8a"],
    ["Invited", stats.invited, "#fff7e0", "#7a5500"],
    ["Submitted", stats.submitted, "#fff0e8", "#7a2e00"],
    ["Reviewed", stats.reviewed, "#e8f7ee", "#1a5c34"],
    ["Teams Active", stats.teamsActive, "#e8f1fa", "#0c2d4a"],
    ["Teams Inactive", stats.teamsInactive, "#f5f5f5", "#4a5568"]
  ];

  statsCards.innerHTML = cards
    .map(([label, value, bg, fg]) => `
      <div style="background:${bg};border-radius:12px;padding:1.25rem 1.4rem">
        <p style="font-size:0.72rem;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;color:${fg};opacity:0.75;margin-bottom:0.4rem">${label}</p>
        <p style="font-family:Sora,sans-serif;font-size:2rem;font-weight:800;color:${fg};line-height:1">${value}</p>
      </div>
    `)
    .join("");
}

async function loadDashboard() {
  const stats = await api("/api/admin/dashboard");
  renderStats(stats);
}

async function loadProfiles() {
  const [driversRes, helpersRes] = await Promise.all([
    api("/api/admin/profiles?role=driver"),
    api("/api/admin/profiles?role=helper")
  ]);

  // profileRow also populates profilesCache
  driversTableBody.innerHTML = (driversRes.profiles || []).map(profileRow).join("");
  helpersTableBody.innerHTML = (helpersRes.profiles || []).map(profileRow).join("");

  populateTeamSelect(teamDriverSelect, driversRes.profiles || [], "Select Driver");
  populateTeamSelect(teamHelperSelect, helpersRes.profiles || [], "Select Helper");
}

async function loadOnboardingStatus() {
  const res = await api("/api/admin/onboarding-status");
  statusTableBody.innerHTML = (res.rows || []).map(onboardingStatusRow).join("");
}

async function loadTeams() {
  const res = await api("/api/admin/teams");
  teamsTableBody.innerHTML = (res.teams || []).map(teamRow).join("");
}

async function refreshAll() {
  await Promise.all([loadDashboard(), loadProfiles(), loadOnboardingStatus(), loadTeams()]);
}

async function createProfile(formEl, role, inviteResultEl, inviteUrlEl) {
  const formData = new FormData(formEl);
  const payload = {
    firstName: String(formData.get("firstName") || "").trim(),
    lastName: String(formData.get("lastName") || "").trim(),
    role,
    email: String(formData.get("email") || "").trim().toLowerCase(),
    phone: String(formData.get("phone") || "").trim(),
    expiresInDays: Number(formData.get("expiresInDays") || 7)
  };

  if (!payload.firstName || !payload.lastName || !payload.email || !payload.phone) {
    throw new Error("All profile fields are required.");
  }

  const res = await api("/api/admin/profiles", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  inviteUrlEl.value = res.onboardingUrl;
  inviteResultEl.classList.remove("is-hidden");
  formEl.reset();
}

logoutBtn.addEventListener("click", () => {
  clearToken();
  inviteResultDrivers.classList.add("is-hidden");
  inviteResultHelpers.classList.add("is-hidden");
  showGate();
});

document.getElementById("addDriverBtn")?.addEventListener("click", () => {
  inviteResultDrivers.classList.add("is-hidden");
  openModal("modal-add-driver");
});
document.getElementById("addHelperBtn")?.addEventListener("click", () => {
  inviteResultHelpers.classList.add("is-hidden");
  openModal("modal-add-helper");
});
document.getElementById("assignTeamBtn")?.addEventListener("click", () => openModal("modal-assign-team"));

navMenu.addEventListener("click", async (event) => {
  const link = event.target.closest("a[data-view]");
  if (!link) {
    return;
  }
  event.preventDefault();
  setView(link.dataset.view);
});

profileFormDrivers.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await createProfile(profileFormDrivers, "driver", inviteResultDrivers, inviteUrlDrivers);
    await refreshAll();
    setGlobalStatus("Driver profile created and link generated.", false);
    // Keep modal open so admin can copy the invite link
  } catch (err) {
    setGlobalStatus(err.message || "Unable to create driver.");
  }
});

profileFormHelpers.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await createProfile(profileFormHelpers, "helper", inviteResultHelpers, inviteUrlHelpers);
    await refreshAll();
    setGlobalStatus("Helper profile created and link generated.", false);
    // Keep modal open so admin can copy the invite link
  } catch (err) {
    setGlobalStatus(err.message || "Unable to create helper.");
  }
});

document.body.addEventListener("click", async (event) => {
  const copyBtn = event.target.closest(".copy-btn");
  if (copyBtn) {
    const targetId = copyBtn.dataset.copyTarget;
    const input = document.getElementById(targetId);
    if (input?.value) {
      try {
        await navigator.clipboard.writeText(input.value);
        setGlobalStatus("Onboarding link copied.", false);
      } catch (_err) {
        setGlobalStatus("Copy failed. You can copy manually.");
      }
    }
    return;
  }

  const viewProfileBtn = event.target.closest(".view-profile-btn");
  if (viewProfileBtn) {
    const row = viewProfileBtn.closest("tr");
    window.location.href = `/admin/profile/${row.dataset.id}`;
    return;
  }

  const saveStatusBtn = event.target.closest(".save-status-btn");
  if (saveStatusBtn) {
    const row = saveStatusBtn.closest("tr");
    const id = row.dataset.id;

    try {
      await api(`/api/admin/profiles/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "reviewed" })
      });
      await refreshAll();
      setGlobalStatus("Onboarding status set to reviewed.", false);
    } catch (err) {
      setGlobalStatus(err.message || "Unable to update onboarding status.");
    }
    return;
  }

  const toggleTeamBtn = event.target.closest(".toggle-team-btn");
  if (toggleTeamBtn) {
    const row = toggleTeamBtn.closest("tr");
    const id = row.dataset.id;
    const nextStatus = toggleTeamBtn.dataset.nextStatus;

    try {
      await api(`/api/admin/teams/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus })
      });
      await refreshAll();
      setGlobalStatus("Team status updated.", false);
    } catch (err) {
      setGlobalStatus(err.message || "Unable to update team.");
    }
  }
});

teamForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const driverProfileId = teamDriverSelect.value;
  const helperProfileId = teamHelperSelect.value;

  if (!driverProfileId || !helperProfileId) {
    setGlobalStatus("Select both a driver and helper.");
    return;
  }

  try {
    await api("/api/admin/teams", {
      method: "POST",
      body: JSON.stringify({ driverProfileId, helperProfileId, status: "active" })
    });
    await refreshAll();
    setGlobalStatus("Team assignment created.", false);
    teamForm.reset();
    closeModal("modal-assign-team");
  } catch (err) {
    setGlobalStatus(err.message || "Unable to create team assignment.");
  }
});

// ── Profile detail panel ─────────────────────────────────────
const profileBackBtn    = document.getElementById("profileBackBtn");
const profileDetailForm = document.getElementById("profileDetailForm");
const profileViewTitle  = document.getElementById("profileViewTitle");
const pdFirstName       = document.getElementById("pd-firstName");
const pdLastName        = document.getElementById("pd-lastName");
const pdEmail           = document.getElementById("pd-email");
const pdPhone           = document.getElementById("pd-phone");
const pdStatus          = document.getElementById("pd-status");
const pdAppSection      = document.getElementById("pd-app-section");
const pdAppBody         = document.getElementById("pd-app-body");

let activeProfileId  = null;
let profileReturnView = "drivers";

function openProfile(id, returnView) {
  const profile = profilesCache.get(id);
  if (!profile) { setGlobalStatus("Profile data not loaded yet."); return; }

  activeProfileId   = id;
  profileReturnView = returnView;

  profileViewTitle.textContent = `${profile.first_name} ${profile.last_name}`;
  pdFirstName.value = profile.first_name;
  pdLastName.value  = profile.last_name;
  pdEmail.value     = profile.email;
  pdPhone.value     = profile.phone;
  pdStatus.value    = profile.status;

  // Show application info if submitted or reviewed
  if (profile.status === "submitted" || profile.status === "reviewed") {
    pdAppSection.classList.remove("is-hidden");
    pdAppBody.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;font-size:0.88rem">
        <div><span style="font-weight:700;color:#4a6478">Role</span><br>${profile.role}</div>
        <div><span style="font-weight:700;color:#4a6478">Status</span><br>${statusBadge(profile.status)}</div>
        <div><span style="font-weight:700;color:#4a6478">Email</span><br>${profile.email}</div>
        <div><span style="font-weight:700;color:#4a6478">Phone</span><br>${profile.phone}</div>
      </div>`;
  } else {
    pdAppSection.classList.add("is-hidden");
    pdAppBody.innerHTML = "";
  }

  openModal("modal-edit-profile");
}

profileBackBtn?.addEventListener("click", () => setView(profileReturnView));

profileDetailForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!activeProfileId) return;
  try {
    await api(`/api/admin/profiles/${activeProfileId}`, {
      method: "PATCH",
      body: JSON.stringify({
        firstName: pdFirstName.value.trim(),
        lastName:  pdLastName.value.trim(),
        email:     pdEmail.value.trim().toLowerCase(),
        phone:     pdPhone.value.trim(),
        status:    pdStatus.value
      })
    });
    await refreshAll();
    setGlobalStatus("Profile updated successfully.", false);
    closeModal("modal-edit-profile");
  } catch (err) {
    setGlobalStatus(err.message || "Unable to update profile.");
  }
});

async function init() {
  if (!getToken()) {
    showGate();
    return;
  }

  try {
    showDashboard();
    // Restore view from ?view= query param (e.g. when navigating back from employee file)
    const viewParam = new URLSearchParams(window.location.search).get("view");
    setView(viewParam || "dashboard");
    await refreshAll();
  } catch (err) {
    if (err.message === "Unauthorized.") {
      // Only log out on genuine auth failure
      clearToken();
      showGate();
    } else {
      // Network hiccup / server error — stay logged in, show message
      setGlobalStatus(err.message || "Failed to load data. Please refresh.");
    }
  }
}

init();
