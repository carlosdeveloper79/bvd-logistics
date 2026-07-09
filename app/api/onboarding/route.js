import { json } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import {
  cleanupStorageFiles,
  getInviteValidationError,
  hashToken,
  newApplicationId,
  uploadDocumentToStorage,
  validateAddressHistory
} from "@/lib/onboarding";

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

export async function POST(request) {
  const uploadedPaths = [];

  try {
    const formData = await request.formData();
    const firstName = String(formData.get("firstName") || "").trim();
    const lastName = String(formData.get("lastName") || "").trim();
    const dob = String(formData.get("dob") || "").trim();
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const phone = String(formData.get("phone") || "").trim();
    const backgroundConsent = !!formData.get("backgroundConsent"); // checkbox posts "on" when checked
    const consentName = String(formData.get("consentName") || "").trim();
    const consentDate = String(formData.get("consentDate") || "").trim();
    const inviteToken = String(formData.get("inviteToken") || "").trim();

    if (!inviteToken) {
      return json({ error: "Invite token is required." }, 400);
    }

    const invite = await findInviteByToken(inviteToken);
    const inviteError = getInviteValidationError(invite);
    if (inviteError) {
      return json({ error: inviteError }, 400);
    }

    if (!firstName || !lastName || !dob || !email || !phone) {
      return json({ error: "Missing required personal information." }, 400);
    }

    if (email !== String(invite.email).trim().toLowerCase()) {
      return json({ error: "This onboarding link is only valid for the invited email." }, 400);
    }

    if (!backgroundConsent || !consentName || !consentDate) {
      return json({ error: "Background check consent is required." }, 400);
    }

    let addresses = [];
    try {
      addresses = JSON.parse(String(formData.get("addresses") || "[]"));
    } catch (_err) {
      return json({ error: "Address history format is invalid." }, 400);
    }

    const addressValidation = validateAddressHistory(addresses);
    if (!addressValidation.ok) {
      return json({ error: addressValidation.message }, 400);
    }

    const applicationId = newApplicationId();

    // Upload all four documents to Supabase private Storage.
    // If any upload fails the catch block removes already-uploaded files.
    const [licenseFrontPath, licenseBackPath, ssnImagePath, headshotPath] = await Promise.all([
      uploadDocumentToStorage(supabase, formData.get("licenseFront"), applicationId, "licenseFront"),
      uploadDocumentToStorage(supabase, formData.get("licenseBack"),  applicationId, "licenseBack"),
      uploadDocumentToStorage(supabase, formData.get("ssnImage"),     applicationId, "ssnImage"),
      uploadDocumentToStorage(supabase, formData.get("headshot"),     applicationId, "headshot"),
    ]);

    if (!licenseFrontPath || !licenseBackPath || !ssnImagePath || !headshotPath) {
      await cleanupStorageFiles(supabase, [licenseFrontPath, licenseBackPath, ssnImagePath, headshotPath]);
      return json({ error: "All required document images must be uploaded." }, 400);
    }

    uploadedPaths.push(licenseFrontPath, licenseBackPath, ssnImagePath, headshotPath);

    const documentPaths = {
      licenseFront: licenseFrontPath,
      licenseBack:  licenseBackPath,
      ssnImage:     ssnImagePath,
      headshot:     headshotPath,
    };

    const usedAt = new Date().toISOString();

    const { error: appInsertError } = await supabase.from("driver_applications").insert({
      id: applicationId,
      profile_id: invite.profileId,
      invite_id: invite.id,
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      dob,
      addresses,
      consent_name: consentName,
      consent_date: consentDate,
      submitted_at: usedAt,
      document_path: JSON.stringify(documentPaths)
    });

    if (appInsertError) {
      return json({ error: appInsertError.message }, 500);
    }

    const { error: inviteUpdateError } = await supabase
      .from("driver_invites")
      .update({ used_at: usedAt })
      .eq("id", invite.id)
      .is("used_at", null);

    if (inviteUpdateError) {
      return json({ error: inviteUpdateError.message }, 500);
    }

    const { error: profileUpdateError } = await supabase
      .from("driver_profiles")
      .update({ status: "submitted" })
      .eq("id", invite.profileId);

    if (profileUpdateError) {
      return json({ error: profileUpdateError.message }, 500);
    }

    return json({ message: "Application submitted successfully.", applicationId }, 201);
  } catch (error) {
    await cleanupStorageFiles(supabase, uploadedPaths);
    return json({ error: error.message || "Server error." }, 500);
  }
}
