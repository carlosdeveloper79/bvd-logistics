import { v4 as uuidv4 } from "uuid";
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
      .from("team_assignments")
      .select(
        "id, status, created_at, driver_profile_id, helper_profile_id, driver:driver_profile_id(id, first_name, last_name, email), helper:helper_profile_id(id, first_name, last_name, email)"
      )
      .order("created_at", { ascending: false });

    if (error) {
      return json({ error: error.message }, 500);
    }

    return json({ teams: data || [] });
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
    const driverProfileId = String(body.driverProfileId || "").trim();
    const helperProfileId = String(body.helperProfileId || "").trim();
    const status = String(body.status || "active").trim().toLowerCase();

    if (!driverProfileId || !helperProfileId) {
      return json({ error: "Driver and helper are required." }, 400);
    }

    if (driverProfileId === helperProfileId) {
      return json({ error: "Driver and helper must be different people." }, 400);
    }

    if (status !== "active" && status !== "inactive") {
      return json({ error: "Team status must be active or inactive." }, 400);
    }

    const { data: members, error: memberError } = await supabase
      .from("driver_profiles")
      .select("id, role")
      .in("id", [driverProfileId, helperProfileId]);

    if (memberError) {
      return json({ error: memberError.message }, 500);
    }

    const driver = (members || []).find((m) => m.id === driverProfileId);
    const helper = (members || []).find((m) => m.id === helperProfileId);
    if (!driver || !helper) {
      return json({ error: "Selected profiles were not found." }, 400);
    }

    if (driver.role !== "driver" || helper.role !== "helper") {
      return json({ error: "Team must use a driver profile and a helper profile." }, 400);
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
      return json({ error: error.message }, 500);
    }

    return json({ team: data }, 201);
  } catch (error) {
    return json({ error: error.message || "Server error." }, 500);
  }
}
