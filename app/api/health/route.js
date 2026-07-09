import { json } from "@/lib/api";

export const runtime = "nodejs";

export async function GET() {
  return json({ status: "ok" });
}
