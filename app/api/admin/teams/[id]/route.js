import { json, requireAdmin } from "@/lib/api";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

export async function PATCH(request, { params }) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const status = String(body.status || "").trim().toLowerCase();

    if (status !== "active" && status !== "inactive") {
      return json({ error: "Status must be active or inactive." }, 400);
    }

    const { data, error } = await supabase
      .from("team_assignments")
      .update({ status })
      .eq("id", id)
      .select("id, status, created_at, driver_profile_id, helper_profile_id")
      .single();

    if (error) {
      return json({ error: error.message }, 500);
    }

    return json({ team: data });
  } catch (error) {
    return json({ error: error.message || "Server error." }, 500);
  }
}
