import { json, requireAdmin } from "@/lib/api";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

export async function PATCH(request, { params }) {
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await request.json();
  const updates = {};

  if (body.dob !== undefined) {
    const dob = String(body.dob).trim();
    if (!dob) return json({ error: "DOB cannot be empty." }, 400);
    updates.dob = dob;
  }

  if (body.addresses !== undefined) {
    if (!Array.isArray(body.addresses) || body.addresses.length === 0)
      return json({ error: "At least one address is required." }, 400);
    updates.addresses = body.addresses;
  }

  if (!Object.keys(updates).length) return json({ error: "No updates provided." }, 400);

  const { data, error } = await supabase
    .from("driver_applications")
    .update(updates)
    .eq("id", id)
    .select("id, dob, addresses")
    .single();

  if (error) return json({ error: error.message }, 500);
  return json({ application: data });
}
