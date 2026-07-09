import path from "path";

export const PORT = Number(process.env.PORT || 3000);
export const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB || 10);
const uploadDir = process.env.UPLOAD_DIR || "data/uploads";
export const UPLOAD_ROOT = path.isAbsolute(uploadDir) ? uploadDir : path.join(process.cwd(), uploadDir);
export const TMP_UPLOAD_DIR = path.join(UPLOAD_ROOT, "tmp");
export const APP_BASE_URL = String(process.env.APP_BASE_URL || `http://localhost:${PORT}`).replace(/\/$/, "");

export const ADMIN_SESSION_SECRET = String(process.env.ADMIN_SESSION_SECRET || "change-me-in-production");
export const DEFAULT_INVITE_DAYS = Number(process.env.DEFAULT_INVITE_DAYS || 7);

export const SUPABASE_URL = process.env.SUPABASE_URL;
export const SUPABASE_KEY =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY;
export const SUPABASE_PUBLISHABLE_KEY =
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_KEY;
