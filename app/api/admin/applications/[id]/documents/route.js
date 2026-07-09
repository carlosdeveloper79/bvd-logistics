import { json, requireAdmin } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { getSignedDocumentUrl, uploadDocumentToStorage, cleanupStorageFiles } from "@/lib/onboarding";
import { MAX_UPLOAD_MB } from "@/lib/app-config";

export const runtime = "nodejs";

const DOCUMENT_FIELDS = ["licenseFront", "licenseBack", "ssnImage", "headshot"];
export const FIELD_LABELS = {
  licenseFront: "Driver's License (front)",
  licenseBack:  "Driver's License (back)",
  ssnImage:     "Social Security Card",
  headshot:     "Headshot Photo",
};

async function getAppPaths(id) {
  const { data: app, error } = await supabase
    .from("driver_applications").select("id, document_path").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!app) throw new Error("Application not found.");
  const paths = typeof app.document_path === "string" ? JSON.parse(app.document_path) : (app.document_path || {});
  return { app, paths };
}

export async function GET(request, { params }) {
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const field = new URL(request.url).searchParams.get("field");
  let paths;
  try { ({ paths } = await getAppPaths(id)); } catch (err) { return json({ error: err.message }, 404); }
  if (field) {
    if (!DOCUMENT_FIELDS.includes(field)) return json({ error: "Invalid field." }, 400);
    if (!paths[field]) return json({ error: "Document not found." }, 404);
    const url = await getSignedDocumentUrl(supabase, paths[field], 3600);
    return json({ field, label: FIELD_LABELS[field], url });
  }
  const urls = {};
  await Promise.all(DOCUMENT_FIELDS.map(async (f) => {
    if (paths[f]) urls[f] = await getSignedDocumentUrl(supabase, paths[f], 3600);
  }));
  return json({ applicationId: id, documents: urls });
}

export async function DELETE(request, { params }) {
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const field = new URL(request.url).searchParams.get("field");
  if (!DOCUMENT_FIELDS.includes(field)) return json({ error: "Invalid field." }, 400);
  let paths;
  try { ({ paths } = await getAppPaths(id)); } catch (err) { return json({ error: err.message }, 404); }
  if (!paths[field]) return json({ error: "Document not found." }, 404);
  await cleanupStorageFiles(supabase, [paths[field]]);
  const updated = { ...paths };
  delete updated[field];
  const { error: upErr } = await supabase.from("driver_applications")
    .update({ document_path: JSON.stringify(updated) }).eq("id", id);
  if (upErr) return json({ error: upErr.message }, 500);
  return json({ ok: true, field });
}

export async function POST(request, { params }) {
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const field = new URL(request.url).searchParams.get("field");
  if (!DOCUMENT_FIELDS.includes(field)) return json({ error: "Invalid field." }, 400);
  let paths;
  try { ({ paths } = await getAppPaths(id)); } catch (err) { return json({ error: err.message }, 404); }
  const fd = await request.formData();
  const file = fd.get("file");
  if (!file) return json({ error: "No file provided." }, 400);
  if (!["image/jpeg","image/png","image/jpg","image/webp"].includes(file.type))
    return json({ error: "Only JPG, PNG, or WEBP images allowed." }, 400);
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) return json({ error: `Max ${MAX_UPLOAD_MB} MB.` }, 400);
  if (paths[field]) await cleanupStorageFiles(supabase, [paths[field]]);
  const storagePath = await uploadDocumentToStorage(supabase, file, id, field);
  const updated = { ...paths, [field]: storagePath };
  const { error: upErr } = await supabase.from("driver_applications")
    .update({ document_path: JSON.stringify(updated) }).eq("id", id);
  if (upErr) { await cleanupStorageFiles(supabase, [storagePath]); return json({ error: upErr.message }, 500); }
  return json({ ok: true, field, storagePath });
}
