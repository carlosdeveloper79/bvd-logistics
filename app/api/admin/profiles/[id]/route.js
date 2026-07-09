import { isValidRole, isValidStatus, json, requireAdmin } from "@/lib/api";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(request, { params }) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const { data: profile, error: profileError } = await supabase
    .from("driver_profiles")
    .select("id, first_name, last_name, role, email, phone, status, created_at")
    .eq("id", id)
    .maybeSingle();

  if (profileError) return json({ error: profileError.message }, 500);
  if (!profile) return json({ error: "Profile not found." }, 404);

  const { data: application } = await supabase
    .from("driver_applications")
    .select("id, first_name, last_name, email, phone, dob, addresses, consent_name, consent_date, submitted_at, document_path")
    .eq("profile_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return json({ profile, application: application || null });
}

export async function PATCH(request, { params }) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const updates = {};

    if (body.firstName !== undefined) {
      const firstName = String(body.firstName).trim();
      if (!firstName) {
        return json({ error: "First name cannot be empty." }, 400);
      }
      updates.first_name = firstName;
    }

    if (body.lastName !== undefined) {
      const lastName = String(body.lastName).trim();
      if (!lastName) {
        return json({ error: "Last name cannot be empty." }, 400);
      }
      updates.last_name = lastName;
    }

    if (body.email !== undefined) {
      const email = String(body.email).trim().toLowerCase();
      if (!email) {
        return json({ error: "Email cannot be empty." }, 400);
      }
      updates.email = email;
    }

    if (body.phone !== undefined) {
      const phone = String(body.phone).trim();
      if (!phone) {
        return json({ error: "Phone cannot be empty." }, 400);
      }
      updates.phone = phone;
    }

    if (body.role !== undefined) {
      const role = String(body.role).trim().toLowerCase();
      if (!isValidRole(role)) {
        return json({ error: "Role must be driver or helper." }, 400);
      }
      updates.role = role;
    }

    if (body.status !== undefined) {
      const status = String(body.status).trim().toLowerCase();
      if (!isValidStatus(status)) {
        return json({ error: "Status must be invited, submitted, or reviewed." }, 400);
      }
      updates.status = status;
    }

    if (!Object.keys(updates).length) {
      return json({ error: "No updates were provided." }, 400);
    }

    const { data, error } = await supabase
      .from("driver_profiles")
      .update(updates)
      .eq("id", id)
      .select("id, first_name, last_name, role, email, phone, status, created_at")
      .single();

    if (error) {
      return json({ error: error.message }, 500);
    }

    return json({ profile: data });
  } catch (error) {
    return json({ error: error.message || "Server error." }, 500);
  }
}
