import { buildAdminToken } from "@/lib/auth";
import { json } from "@/lib/api";
import { supabase, supabaseAuth } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return json({ error: "Email and password are required." }, 400);
    }

    // 1. Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData?.user) {
      return json({ error: "Invalid credentials." }, 401);
    }

    // 2. Check the email is in the admins allowlist
    const { data: adminRow } = await supabase
      .from("admins")
      .select("email")
      .eq("email", email)
      .maybeSingle();

    if (!adminRow) {
      return json({ error: "Not authorized as admin." }, 403);
    }

    // 3. Issue app session token
    return json({ token: buildAdminToken(email) });
  } catch (error) {
    return json({ error: error.message || "Server error." }, 500);
  }
}
