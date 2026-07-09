import { json } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { getInviteValidationError, hashToken } from "@/lib/onboarding";

export const runtime = "nodejs";

async function findInviteByToken(token) {
  const tokenHash = hashToken(token);
  const { data, error } = await supabase
    .from("driver_invites")
    .select("id, profile_id, email, expires_at, used_at")
    .eq("token_hash", tokenHash)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    profileId: data.profile_id,
    email: data.email,
    expiresAt: data.expires_at,
    usedAt: data.used_at
  };
}

export async function GET(request) {
  try {
    const token = String(new URL(request.url).searchParams.get("token") || "").trim();
    if (!token) {
      return json({ error: "Missing invite token." }, 400);
    }

    const tokenHash = hashToken(token);
    console.log("[invite/verify] token_hash lookup:", tokenHash);

    const invite = await findInviteByToken(token);
    console.log("[invite/verify] invite found:", invite ? `id=${invite.id} usedAt=${invite.usedAt} expiresAt=${invite.expiresAt}` : "null");

    const inviteError = getInviteValidationError(invite);
    if (inviteError) {
      console.log("[invite/verify] blocked:", inviteError);
      return json({ error: inviteError }, 400);
    }

    return json({ email: invite.email, expiresAt: invite.expiresAt });
  } catch (error) {
    console.error("[invite/verify] exception:", error.message);
    return json({ error: error.message || "Unable to verify invite." }, 500);
  }
}
