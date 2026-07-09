import { supabase } from "./supabase";

/**
 * Verify a Supabase access token and confirm the user is in the admins allowlist.
 * Replaces the previous HMAC-signed custom token approach.
 */
export async function verifySupabaseAdminSession(token) {
  if (!token) return { ok: false };
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return { ok: false };

    const { data: adminRow } = await supabase
      .from("admins")
      .select("email")
      .eq("email", user.email.toLowerCase())
      .maybeSingle();

    if (!adminRow) return { ok: false };
    return { ok: true, email: user.email.toLowerCase() };
  } catch {
    return { ok: false };
  }
}

export function getBearerToken(request) {
  const authHeader = String(request.headers.get("authorization") || "");
  return authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
}
