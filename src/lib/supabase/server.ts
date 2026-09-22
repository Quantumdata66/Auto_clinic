import { createClient } from "@supabase/supabase-js";
import { Database } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Server-side public Supabase client (Respects RLS).
 * Used by Server Components for SSR catalogue reading.
 */
export function createServerClient() {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
  });
}

/**
 * Privileged server-only Supabase client (Bypasses RLS).
 * STRICT SECURITY BOUNDARY: Used ONLY in server actions / API endpoints for
 * administrative audits, inventory atomic decrements, and privileged order creation.
 * NEVER expose this or import in client components.
 */
export function createAdminClient() {
  if (!supabaseServiceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY environment variable is missing on server."
    );
  }
  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
