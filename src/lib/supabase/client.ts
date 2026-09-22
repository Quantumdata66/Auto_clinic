import { createClient } from "@supabase/supabase-js";
import { Database } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

/**
 * Public browser-safe Supabase client configured with anonymous public key.
 * Enforces Row Level Security (RLS) policies on all client queries.
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
