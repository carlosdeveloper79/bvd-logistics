import { createClient } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./app-config";

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error("SUPABASE_URL and a SUPABASE key are required.");
}

// Service-role client — used for all data operations (bypasses RLS)
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Anon/publishable client — used only for Supabase Auth sign-in on the server
export const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY || SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
