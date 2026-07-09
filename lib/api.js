import { NextResponse } from "next/server";
import { getBearerToken, verifyAdminToken } from "./auth";

export function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

export function requireAdmin(request) {
  const token = getBearerToken(request);
  const verified = verifyAdminToken(token);
  if (!verified.ok) {
    return { ok: false, response: json({ error: "Unauthorized." }, 401) };
  }
  return { ok: true, email: verified.email };
}

export function isValidRole(role) {
  return role === "driver" || role === "helper";
}

export function isValidStatus(status) {
  return status === "invited" || status === "submitted" || status === "reviewed";
}
