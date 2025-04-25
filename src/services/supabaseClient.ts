import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: localStorage,
  },
});

console.log("Supabase URL:", supabaseUrl ? "Set" : "Missing");
console.log(
  "Supabase Key:",
  supabaseKey ? "Set (first 5 chars):" + supabaseKey.substring(0, 5) : "Missing"
);
export default supabase;
