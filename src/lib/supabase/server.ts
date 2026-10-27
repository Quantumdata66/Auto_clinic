import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

export const PROTECTED_PRODUCTION_PROJECT_REF = "obloaeuzdoohdxryaoei";

export class ProductionWriteGuardError extends Error {
  public readonly code = "PRODUCTION_WRITE_BLOCKED";
  constructor(message: string) {
    super(message);
    this.name = "ProductionWriteGuardError";
  }
}

export interface WriteSafetyEvaluation {
  allowed: boolean;
  projectRef: string | null;
  reason?: string;
}

export interface WriteSafetyParams {
  supabaseUrl?: string | null;
  appEnv?: string | null;
  nodeEnv?: string | null;
  siteUrl?: string | null;
  vercelEnv?: string | null;
}

/**
 * Safely extracts the project reference string from a Supabase project URL.
 * Returns null if the URL is missing, invalid, a placeholder, or cannot be safely identified.
 */
export function extractSupabaseProjectRef(url?: string | null): string | null {
  if (!url || typeof url !== "string") {
    return null;
  }
  const trimmed = url.trim();
  if (!trimmed || trimmed.includes("placeholder")) {
    return null;
  }
  try {
    const parsed = new URL(trimmed);
    const hostname = parsed.hostname.toLowerCase();

    // Standard Supabase hostname: <project-ref>.supabase.<tld>
    const hostParts = hostname.split(".");
    if (hostParts.length >= 3 && hostParts[hostParts.length - 2] === "supabase") {
      const ref = hostParts[0].trim();
      // Valid Supabase project references are alphanumeric strings
      if (/^[a-z0-9_-]+$/.test(ref) && ref !== "placeholder") {
        return ref;
      }
    }

    // Custom domains or non-standard hostnames cannot be safely mapped to a verified
    // Supabase project identity. Fail closed to prevent accidental writes or unauthorized routing.
    return null;
  } catch {
    return null;
  }
}

/**
 * Pure evaluator for privileged database write safety.
 * Validates that local development and staging environments cannot perform privileged
 * writes against the protected production Supabase project (obloaeuzdoohdxryaoei).
 * Fails closed if the target project URL is missing, malformed, or unidentifiable.
 */
export function evaluatePrivilegedWriteSafety(params?: WriteSafetyParams): WriteSafetyEvaluation {
  const url = params?.supabaseUrl !== undefined ? params.supabaseUrl : process.env.NEXT_PUBLIC_SUPABASE_URL;
  const appEnv = (
    params?.appEnv !== undefined
      ? params.appEnv
      : process.env.NEXT_PUBLIC_APP_ENV || process.env.APP_ENV || ""
  )?.trim().toLowerCase() || "";
  const nodeEnv = (
    params?.nodeEnv !== undefined
      ? params.nodeEnv
      : process.env.NODE_ENV || "development"
  )?.trim().toLowerCase() || "development";
  const siteUrl = (
    params?.siteUrl !== undefined
      ? params.siteUrl
      : process.env.NEXT_PUBLIC_SITE_URL || ""
  )?.trim().toLowerCase() || "";
  const vercelEnv = (
    params?.vercelEnv !== undefined
      ? params.vercelEnv
      : process.env.VERCEL_ENV || ""
  )?.trim().toLowerCase() || "";

  const projectRef = extractSupabaseProjectRef(url);

  // 1. Fail closed if the project identity cannot be safely verified
  if (!projectRef) {
    return {
      allowed: false,
      projectRef: null,
      reason:
        "Privileged write rejected: Supabase project URL is missing, malformed, or unidentifiable. Project identity cannot be established.",
    };
  }

  // 2. Check if the target is the protected production project
  const isProtectedProduction = projectRef === PROTECTED_PRODUCTION_PROJECT_REF;

  if (isProtectedProduction) {
    const isNonProdSite =
      siteUrl.includes("localhost") ||
      siteUrl.includes("127.0.0.1") ||
      siteUrl.includes("staging") ||
      siteUrl.includes("preview");

    const isExplicitNonProd =
      appEnv === "development" ||
      appEnv === "staging" ||
      vercelEnv === "preview" ||
      vercelEnv === "development" ||
      nodeEnv === "development" ||
      nodeEnv === "test" ||
      isNonProdSite;

    const isLegitimateProduction =
      (appEnv === "production" || vercelEnv === "production") &&
      nodeEnv === "production" &&
      !isExplicitNonProd;

    if (!isLegitimateProduction) {
      const currentContext = appEnv || vercelEnv || nodeEnv || "non-production";
      return {
        allowed: false,
        projectRef,
        reason: `Privileged write rejected: Database writes to protected production project '${PROTECTED_PRODUCTION_PROJECT_REF}' are blocked from '${currentContext}' environment.`,
      };
    }
  }

  // 3. Separate staging project or verified legitimate production write
  return {
    allowed: true,
    projectRef,
  };
}

/**
 * Throws a ProductionWriteGuardError if privileged writes are not allowed
 * in the current environment or against the configured target.
 */
export function assertPrivilegedWriteAllowed(params?: WriteSafetyParams): void {
  const result = evaluatePrivilegedWriteSafety(params);
  if (!result.allowed) {
    throw new ProductionWriteGuardError(result.reason || "Privileged database write rejected by safety guard.");
  }
}

/**
 * Wraps a SupabaseClient in a safety proxy.
 * Permits read-only queries (.select()), but intercepts mutating calls
 * (.insert(), .update(), .delete(), .upsert(), and .rpc()) to enforce assertPrivilegedWriteAllowed().
 */
export function createGuardedAdminClient<T extends SupabaseClient<Database>>(
  rawClient: T,
  writeCheckOverride?: () => void
): T {
  const checkWrite = writeCheckOverride || (() => assertPrivilegedWriteAllowed());

  return new Proxy(rawClient, {
    get(target, prop, receiver) {
      if (prop === "rpc") {
        return (fn: string, ...args: unknown[]) => {
          checkWrite();
          return (target as unknown as { rpc: (fn: string, ...args: unknown[]) => unknown }).rpc(fn, ...args);
        };
      }

      if (prop === "schema") {
        return (schemaName: string) => {
          const schemaClient = (target as unknown as { schema: (s: string) => unknown }).schema(schemaName);
          return createGuardedAdminClient(schemaClient as unknown as T, writeCheckOverride);
        };
      }

      if (prop === "from") {
        return (table: string) => {
          const queryBuilder = (target as unknown as { from: (table: string) => Record<string, unknown> }).from(table);
          return new Proxy(queryBuilder, {
            get(qbTarget, qbProp, qbReceiver) {
              if (
                qbProp === "insert" ||
                qbProp === "update" ||
                qbProp === "delete" ||
                qbProp === "upsert"
              ) {
                return (...args: unknown[]) => {
                  checkWrite();
                  const mutator = qbTarget[qbProp as string] as (...args: unknown[]) => unknown;
                  return mutator.apply(qbTarget, args);
                };
              }
              const val = Reflect.get(qbTarget, qbProp, qbReceiver);
              return typeof val === "function" ? val.bind(qbTarget) : val;
            },
          });
        };
      }

      const value = Reflect.get(target, prop, receiver);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Checks if Supabase connection is active with non-placeholder credentials.
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || supabaseUrl;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || supabaseAnonKey;
  return Boolean(
    url &&
    anonKey &&
    !url.includes("placeholder") &&
    !anonKey.includes("placeholder")
  );
}

/**
 * Server-side public Supabase client (Respects RLS).
 * Used by Server Components for SSR catalogue reading.
 */
export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || supabaseUrl;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || supabaseAnonKey;
  return createClient<Database>(url, anonKey, {
    auth: {
      persistSession: false,
    },
  });
}

/**
 * Server-side Supabase client scoped to an authenticated user's access token.
 */
export function createServerClientWithToken(token: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || supabaseUrl;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || supabaseAnonKey;
  return createClient<Database>(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
}

/**
 * Privileged server-only Supabase client (Bypasses RLS).
 * STRICT SECURITY BOUNDARY: Used ONLY in server actions / API endpoints for
 * administrative audits, inventory atomic decrements, and privileged order creation.
 * NEVER expose this or import in client components.
 *
 * Wrapped with Production Write Guard:
 * Intercepts mutating operations and enforces safety checks before execution.
 */
export function createAdminClient(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || supabaseUrl;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseServiceKey;
  if (!serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY environment variable is missing on server."
    );
  }
  const rawClient = createClient<Database>(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return createGuardedAdminClient(rawClient);
}
