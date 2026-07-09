import { json, requireAdmin } from "@/lib/api";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const { data, error } = await supabase
      .from("driver_profiles")
      .select("id, first_name, last_name, role, email, status, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      return json({ error: error.message }, 500);
    }

    return json({ rows: data || [] });
  } catch (error) {
    return json({ error: error.message || "Server error." }, 500);
  }
}
