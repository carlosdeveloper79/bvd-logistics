import crypto from "crypto";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { MAX_UPLOAD_MB } from "./app-config";

export const STORAGE_BUCKET = "onboarding-documents";

export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function monthsBetween(startDate, endDate) {
  const years = endDate.getFullYear() - startDate.getFullYear();
  const months = endDate.getMonth() - startDate.getMonth();
  let total = years * 12 + months;
  if (endDate.getDate() < startDate.getDate()) {
    total -= 1;
  }
  return Math.max(0, total);
}

export function validateAddressHistory(addresses) {
  if (!Array.isArray(addresses) || addresses.length === 0) {
    return { ok: false, message: "At least one address is required." };
  }

  const now = new Date();
  let totalMonths = 0;

  for (const addr of addresses) {
    if (!addr.street || !addr.city || !addr.state || !addr.zip || !addr.moveInDate) {
      return { ok: false, message: "Each address must include full location and move-in date." };
    }

    const moveIn = new Date(addr.moveInDate);
    const moveOut = addr.current ? now : new Date(addr.moveOutDate);

    if (Number.isNaN(moveIn.getTime()) || Number.isNaN(moveOut.getTime())) {
      return { ok: false, message: "Address dates are invalid." };
    }

    if (moveOut < moveIn) {
      return { ok: false, message: "Address move-out date cannot be earlier than move-in date." };
    }

    totalMonths += monthsBetween(moveIn, moveOut);
  }

  if (totalMonths < 36) {
    return { ok: false, message: "Address history must cover at least the past 3 years." };
  }

  return { ok: true };
}

export function getInviteValidationError(invite) {
  if (!invite) {
    return "Invalid invite link.";
  }
  if (invite.usedAt) {
    return "This invite link has already been used.";
  }
  if (new Date(invite.expiresAt) < new Date()) {
    return "This invite link has expired.";
  }
  return null;
}

/**
 * Upload a document image to Supabase Storage (private bucket).
 * Returns the storage path string, e.g. "<applicationId>/licenseFront.jpg".
 */
export async function uploadDocumentToStorage(supabaseClient, file, applicationId, fieldName) {
  if (!file) return null;

  const allowed = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
  if (!allowed.includes(file.type)) {
    throw new Error("Only image files are allowed (JPG, PNG, WEBP).");
  }

  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
    throw new Error(`File too large. Max size is ${MAX_UPLOAD_MB} MB.`);
  }

  const ext = (path.extname(file.name || "").toLowerCase()) || ".jpg";
  const storagePath = `${applicationId}/${fieldName}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabaseClient.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, buffer, { contentType: file.type, upsert: false });

  if (error) throw new Error(`Storage upload failed (${fieldName}): ${error.message}`);

  return storagePath;
}

/**
 * Remove a list of Storage paths on error/rollback.
 */
export async function cleanupStorageFiles(supabaseClient, paths = []) {
  const valid = paths.filter(Boolean);
  if (!valid.length) return;
  await supabaseClient.storage.from(STORAGE_BUCKET).remove(valid);
}

/** Generate a short-lived signed URL (admin use only). */
export async function getSignedDocumentUrl(supabaseClient, storagePath, expiresInSeconds = 3600) {
  const { data, error } = await supabaseClient.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);
  if (error) throw new Error(`Could not create signed URL: ${error.message}`);
  return data.signedUrl;
}

/** Create a new application ID (UUID v4). */
export function newApplicationId() {
  return uuidv4();
}
