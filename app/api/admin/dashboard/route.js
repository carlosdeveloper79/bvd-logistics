import { json, requireAdmin } from "@/lib/api";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(request) {
  const auth = requireAdmin(request);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const { data: profiles, error: profileError } = await supabase.from("driver_profiles").select("id, role, status");
    if (profileError) {
      return json({ error: profileError.message }, 500);
    }

    const { data: teams, error: teamError } = await supabase.from("team_assignments").select("id, status");
    if (teamError) {
      return json({ error: teamError.message }, 500);
    }

    const safeProfiles = profiles || [];
    const safeTeams = teams || [];

    return json({
      totalPeople: safeProfiles.length,
      drivers: safeProfiles.filter((p) => p.role === "driver").length,
      helpers: safeProfiles.filter((p) => p.role === "helper").length,
      invited: safeProfiles.filter((p) => p.status === "invited").length,
      submitted: safeProfiles.filter((p) => p.status === "submitted").length,
      reviewed: safeProfiles.filter((p) => p.status === "reviewed").length,
      teamsActive: safeTeams.filter((t) => t.status === "active").length,
      teamsInactive: safeTeams.filter((t) => t.status === "inactive").length
    });
  } catch (error) {
    return json({ error: error.message || "Server error." }, 500);
  }
}
