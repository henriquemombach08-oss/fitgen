import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client-side client (anon key)
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Server-side client (service role key — never expose to the browser)
export const supabaseServer = createClient(supabaseUrl, supabaseServiceRoleKey);
