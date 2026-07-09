import crypto from "crypto";
import { ADMIN_SESSION_SECRET } from "./app-config";

export function buildAdminToken(email) {
  const payload = {
    email,
    exp: Date.now() + 12 * 60 * 60 * 1000
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = crypto.createHmac("sha256", ADMIN_SESSION_SECRET).update(encodedPayload).digest("base64url");
  return `${encodedPayload}.${signature}`;
}

export function verifyAdminToken(token) {
  if (!token || !token.includes(".")) {
    return { ok: false };
  }

  const [encodedPayload, signature] = token.split(".");
  const expected = crypto.createHmac("sha256", ADMIN_SESSION_SECRET).update(encodedPayload).digest("base64url");

  if (signature.length !== expected.length) {
    return { ok: false };
  }

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return { ok: false };
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
    if (!payload?.email || payload.exp < Date.now()) {
      return { ok: false };
    }

    return { ok: true, email: String(payload.email).toLowerCase() };
  } catch (_err) {
    return { ok: false };
  }
}

export function getBearerToken(request) {
  const authHeader = String(request.headers.get("authorization") || "");
  return authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
}
