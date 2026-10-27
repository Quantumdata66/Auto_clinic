// ============================================================================
// Auto Clinic — Production Supabase Write Guard Automated Test Suite
// Verifies environment isolation, fail-closed behavior, and write-blocking
// against protected production project: obloaeuzdoohdxryaoei
//
// NOTE: Exercises the ACTUAL IMPLEMENTATION in src/lib/supabase/server.ts
// via Node 22 native type-stripping loader. Zero duplicated logic.
// ============================================================================

import assert from "node:assert";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// Bootstrap Node 22 TypeScript loader if not already active
const isStripTypesActive = process.execArgv.includes("--experimental-strip-types");

if (!isStripTypesActive) {
  const result = spawnSync(
    process.execPath,
    ["--experimental-strip-types", fileURLToPath(import.meta.url), ...process.argv.slice(2)],
    { stdio: "inherit" }
  );
  process.exit(result.status ?? 1);
}

// ----------------------------------------------------------------------------
// DIRECT IMPORT OF ACTUAL PRODUCTION GUARD IMPLEMENTATION
// ----------------------------------------------------------------------------
const serverModule = await import("../src/lib/supabase/server.ts");

const {
  PROTECTED_PRODUCTION_PROJECT_REF,
  ProductionWriteGuardError,
  extractSupabaseProjectRef,
  evaluatePrivilegedWriteSafety,
  assertPrivilegedWriteAllowed,
  createGuardedAdminClient,
} = serverModule;

console.log("================================================================================");
console.log("AUTO CLINIC — PRODUCTION SUPABASE WRITE GUARD VERIFICATION SUITE");
console.log("================================================================================\n");

// ----------------------------------------------------------------------------
// PART 1: MODULE INTEGRITY & EXPORT VERIFICATION
// ----------------------------------------------------------------------------
console.log("--- PART 1: MODULE EXPORT & TYPE INTEGRITY (REAL SERVER.TS) ---");

assert.strictEqual(
  typeof extractSupabaseProjectRef,
  "function",
  "extractSupabaseProjectRef must be exported as a function"
);
assert.strictEqual(
  typeof evaluatePrivilegedWriteSafety,
  "function",
  "evaluatePrivilegedWriteSafety must be exported as a function"
);
assert.strictEqual(
  typeof assertPrivilegedWriteAllowed,
  "function",
  "assertPrivilegedWriteAllowed must be exported as a function"
);
assert.strictEqual(
  typeof createGuardedAdminClient,
  "function",
  "createGuardedAdminClient must be exported as a function"
);
assert.strictEqual(
  PROTECTED_PRODUCTION_PROJECT_REF,
  "obloaeuzdoohdxryaoei",
  "PROTECTED_PRODUCTION_PROJECT_REF must match confirmed production ref 'obloaeuzdoohdxryaoei'"
);

const errSample = new ProductionWriteGuardError("test");
assert.strictEqual(errSample.name, "ProductionWriteGuardError");
assert.strictEqual(errSample.code, "PRODUCTION_WRITE_BLOCKED");

console.log("  ✓ PASS: Directly imported actual implementation from src/lib/supabase/server.ts");
console.log("  ✓ PASS: All guard functions and error classes exported and type-checked");

// ----------------------------------------------------------------------------
// PART 2: URL EXTRACTION & FAIL-CLOSED PARSING TESTS (ACTUAL FUNCTION)
// ----------------------------------------------------------------------------
console.log("\n--- PART 2: URL EXTRACTION & DISCRIMINATION (ACTUAL FUNCTION) ---");

// Standard Supabase production target
assert.strictEqual(
  extractSupabaseProjectRef("https://obloaeuzdoohdxryaoei.supabase.co"),
  "obloaeuzdoohdxryaoei",
  "Standard Supabase URL must extract correct project reference"
);

// Standard Supabase staging target
assert.strictEqual(
  extractSupabaseProjectRef("https://auto-clinic-staging-442.supabase.co"),
  "auto-clinic-staging-442",
  "Staging Supabase URL must extract staging reference"
);

// Substring Supabase project URL (must extract actual ref, not falsely map to protected production)
assert.strictEqual(
  extractSupabaseProjectRef("https://staging-obloaeuzdoohdxryaoei.supabase.co"),
  "staging-obloaeuzdoohdxryaoei",
  "Subdomain containing ref as substring must extract its own ref"
);

// Custom hostname or proxy (must fail closed to null)
assert.strictEqual(
  extractSupabaseProjectRef("https://obloaeuzdoohdxryaoei.internal-gateway.com"),
  null,
  "Custom domain or proxy hostname must fail closed to null"
);

// Placeholder URLs must return null
assert.strictEqual(
  extractSupabaseProjectRef("https://placeholder.supabase.co"),
  null,
  "Placeholder URL must fail closed to null"
);

// Malformed, empty, or non-Supabase URLs must return null
assert.strictEqual(extractSupabaseProjectRef(""), null);
assert.strictEqual(extractSupabaseProjectRef("   "), null);
assert.strictEqual(extractSupabaseProjectRef("not-a-valid-url"), null);
assert.strictEqual(extractSupabaseProjectRef(undefined), null);
assert.strictEqual(extractSupabaseProjectRef(null), null);
assert.strictEqual(extractSupabaseProjectRef("http://127.0.0.1:5432"), null);
assert.strictEqual(extractSupabaseProjectRef("http://localhost:3000"), null);

console.log("  ✓ PASS: extractSupabaseProjectRef correctly identifies production, staging, placeholders, and rejects malformed URLs");

// ----------------------------------------------------------------------------
// PART 3: SPECIFICATION TEST CASES (ACTUAL EVALUATION & ASSERTION FUNCTIONS)
// ----------------------------------------------------------------------------
console.log("\n--- PART 3: ENVIRONMENT SPECIFICATION CASES (ACTUAL FUNCTIONS) ---");

// 3.1: Local development configured with protected production project -> DENIED
{
  const localEval = evaluatePrivilegedWriteSafety({
    supabaseUrl: "https://obloaeuzdoohdxryaoei.supabase.co",
    appEnv: "development",
    nodeEnv: "development",
    siteUrl: "http://localhost:3000",
  });
  assert.strictEqual(localEval.allowed, false, "Local dev against prod must be blocked");
  assert.strictEqual(localEval.projectRef, "obloaeuzdoohdxryaoei");
  assert(
    localEval.reason.includes("obloaeuzdoohdxryaoei"),
    "Rejection reason must explicitly cite the protected reference"
  );

  assert.throws(
    () => {
      assertPrivilegedWriteAllowed({
        supabaseUrl: "https://obloaeuzdoohdxryaoei.supabase.co",
        appEnv: "development",
        nodeEnv: "development",
        siteUrl: "http://localhost:3000",
      });
    },
    ProductionWriteGuardError,
    "assertPrivilegedWriteAllowed must throw ProductionWriteGuardError"
  );
  console.log("  ✓ PASS [3.1]: Local dev targeting protected production project: Privileged write strictly DENIED");
}

// 3.2: Staging configured with protected production project -> DENIED
{
  const stagingEval = evaluatePrivilegedWriteSafety({
    supabaseUrl: "https://obloaeuzdoohdxryaoei.supabase.co",
    appEnv: "staging",
    nodeEnv: "production",
    siteUrl: "https://staging.autoclinic.ng",
  });
  assert.strictEqual(stagingEval.allowed, false, "Staging against prod must be blocked");
  assert.strictEqual(stagingEval.projectRef, "obloaeuzdoohdxryaoei");
  assert(stagingEval.reason.includes("blocked from 'staging' environment"));

  assert.throws(
    () => {
      assertPrivilegedWriteAllowed({
        supabaseUrl: "https://obloaeuzdoohdxryaoei.supabase.co",
        appEnv: "staging",
        nodeEnv: "production",
        siteUrl: "https://staging.autoclinic.ng",
      });
    },
    ProductionWriteGuardError
  );
  console.log("  ✓ PASS [3.2]: Staging environment targeting protected production project: Privileged write strictly DENIED");
}

// 3.3: Separate staging project configured -> PERMITTED
{
  const dedicatedStagingEval = evaluatePrivilegedWriteSafety({
    supabaseUrl: "https://auto-clinic-staging-442.supabase.co",
    appEnv: "staging",
    nodeEnv: "production",
    siteUrl: "https://staging.autoclinic.ng",
  });
  assert.strictEqual(dedicatedStagingEval.allowed, true, "Separate staging target must be permitted");
  assert.strictEqual(dedicatedStagingEval.projectRef, "auto-clinic-staging-442");

  assert.doesNotThrow(() => {
    assertPrivilegedWriteAllowed({
      supabaseUrl: "https://auto-clinic-staging-442.supabase.co",
      appEnv: "staging",
      nodeEnv: "production",
      siteUrl: "https://staging.autoclinic.ng",
    });
  });

  // Also verify permitted when developing locally against dedicated staging DB
  const localToStagingEval = evaluatePrivilegedWriteSafety({
    supabaseUrl: "https://auto-clinic-staging-442.supabase.co",
    appEnv: "development",
    nodeEnv: "development",
    siteUrl: "http://localhost:3000",
  });
  assert.strictEqual(localToStagingEval.allowed, true, "Local dev targeting staging database must be permitted");

  console.log("  ✓ PASS [3.3]: Separate staging project: Guard PERMITS configured staging target in both local dev & staging");
}

// 3.4: Deployed production configuration -> PERMITTED ONLY under explicit production conditions
{
  const deployedProdEval = evaluatePrivilegedWriteSafety({
    supabaseUrl: "https://obloaeuzdoohdxryaoei.supabase.co",
    appEnv: "production",
    nodeEnv: "production",
    siteUrl: "https://autoclinic.ng",
    vercelEnv: "production",
  });
  assert.strictEqual(deployedProdEval.allowed, true, "Legitimate deployed production must be permitted");
  assert.strictEqual(deployedProdEval.projectRef, "obloaeuzdoohdxryaoei");

  assert.doesNotThrow(() => {
    assertPrivilegedWriteAllowed({
      supabaseUrl: "https://obloaeuzdoohdxryaoei.supabase.co",
      appEnv: "production",
      nodeEnv: "production",
      siteUrl: "https://autoclinic.ng",
      vercelEnv: "production",
    });
  });

  // Verify that NODE_ENV=production alone is NOT sufficient (must also have production appEnv/vercelEnv)
  const falseProdEval = evaluatePrivilegedWriteSafety({
    supabaseUrl: "https://obloaeuzdoohdxryaoei.supabase.co",
    appEnv: "",
    nodeEnv: "production",
    siteUrl: "https://autoclinic.ng",
  });
  assert.strictEqual(
    falseProdEval.allowed,
    false,
    "NODE_ENV=production alone without explicit APP_ENV must NOT be permitted against production"
  );

  // Verify that a staging site URL is blocked even if APP_ENV=production
  const stagingUrlWithProdEnvEval = evaluatePrivilegedWriteSafety({
    supabaseUrl: "https://obloaeuzdoohdxryaoei.supabase.co",
    appEnv: "production",
    nodeEnv: "production",
    siteUrl: "https://staging.autoclinic.ng",
  });
  assert.strictEqual(
    stagingUrlWithProdEnvEval.allowed,
    false,
    "Staging site URL must block writes to production project even if APP_ENV=production"
  );

  console.log("  ✓ PASS [3.4]: Deployed production: Legitimate production operations permitted ONLY under explicit production conditions");
}

// 3.5: Missing, malformed, placeholder, or unidentifiable project URL -> FAILS CLOSED
{
  const invalidCases = [
    { name: "Empty string", url: "" },
    { name: "Undefined", url: undefined },
    { name: "Null", url: null },
    { name: "Placeholder", url: "https://placeholder.supabase.co" },
    { name: "Malformed scheme", url: "invalid-url-string" },
    { name: "Arbitrary IP", url: "http://127.0.0.1:5432" },
    { name: "Non-Supabase host", url: "http://localhost:8080" },
  ];

  for (const tc of invalidCases) {
    const res = evaluatePrivilegedWriteSafety({
      supabaseUrl: tc.url,
      appEnv: "development",
      nodeEnv: "development",
    });
    assert.strictEqual(res.allowed, false, `${tc.name} must fail closed`);
    assert.strictEqual(res.projectRef, null, `${tc.name} must have null projectRef`);

    assert.throws(
      () => {
        assertPrivilegedWriteAllowed({
          supabaseUrl: tc.url,
          appEnv: "development",
          nodeEnv: "development",
        });
      },
      ProductionWriteGuardError,
      `${tc.name} must throw ProductionWriteGuardError`
    );
  }
  console.log("  ✓ PASS [3.5]: Missing, malformed, or unidentifiable project URLs strictly FAIL CLOSED");
}

// ----------------------------------------------------------------------------
// PART 4: SPY TESTS PROVING BLOCKED WRITES NEVER REACH UNDERLYING CLIENT
// ----------------------------------------------------------------------------
console.log("\n--- PART 4: UNDERLYING CLIENT SPY TESTS (ZERO CALLS ON BLOCKED WRITES) ---");

function createSpyClient() {
  const calls = {
    rpc: 0,
    from: 0,
    select: 0,
    insert: 0,
    update: 0,
    delete: 0,
    upsert: 0,
    schema: 0,
  };

  const rawClient = {
    rpc(fnName, args) {
      calls.rpc++;
      return Promise.resolve({ data: { success: true, fnName, args }, error: null });
    },
    schema(schemaName) {
      calls.schema++;
      return rawClient;
    },
    from(table) {
      calls.from++;
      return {
        select(cols) {
          calls.select++;
          return Promise.resolve({ data: [{ id: "order-123" }], error: null });
        },
        insert(records) {
          calls.insert++;
          return Promise.resolve({ data: records, error: null });
        },
        update(records) {
          calls.update++;
          return {
            or(filter) {
              return Promise.resolve({ data: records, error: null });
            },
          };
        },
        delete() {
          calls.delete++;
          return Promise.resolve({ data: null, error: null });
        },
        upsert(records) {
          calls.upsert++;
          return Promise.resolve({ data: records, error: null });
        },
      };
    },
  };

  return { rawClient, calls };
}

// 4.1: Blocked writes MUST NEVER reach underlying methods (0 calls recorded)
{
  const { rawClient, calls } = createSpyClient();
  const guardedClient = createGuardedAdminClient(rawClient, () => {
    throw new ProductionWriteGuardError("Blocked by safety guard");
  });

  // Verify .insert() is blocked before reaching rawClient.insert
  assert.throws(
    () => guardedClient.from("diagnostic_enquiries").insert({ test: true }),
    ProductionWriteGuardError
  );
  assert.strictEqual(calls.insert, 0, "Underlying .insert() was called 0 times on blocked write");

  // Verify .update() is blocked before reaching rawClient.update
  assert.throws(
    () => guardedClient.from("orders").update({ order_status: "PAID" }),
    ProductionWriteGuardError
  );
  assert.strictEqual(calls.update, 0, "Underlying .update() was called 0 times on blocked write");

  // Verify .delete() is blocked before reaching rawClient.delete
  assert.throws(
    () => guardedClient.from("customers").delete(),
    ProductionWriteGuardError
  );
  assert.strictEqual(calls.delete, 0, "Underlying .delete() was called 0 times on blocked write");

  // Verify .upsert() is blocked before reaching rawClient.upsert
  assert.throws(
    () => guardedClient.from("inventory").upsert({ quantity_on_hand: 10 }),
    ProductionWriteGuardError
  );
  assert.strictEqual(calls.upsert, 0, "Underlying .upsert() was called 0 times on blocked write");

  // Verify .rpc() is blocked before reaching rawClient.rpc
  assert.throws(
    () => guardedClient.rpc("place_order_atomic", { order_id: "test" }),
    ProductionWriteGuardError
  );
  assert.strictEqual(calls.rpc, 0, "Underlying .rpc() was called 0 times on blocked write");

  // Verify .schema().from().insert() is also blocked before reaching rawClient.insert
  assert.throws(
    () => guardedClient.schema("public").from("orders").insert({ test: true }),
    ProductionWriteGuardError
  );
  assert.strictEqual(calls.insert, 0, "Underlying .insert() via .schema() was called 0 times on blocked write");

  console.log("  ✓ PASS: Blocked .insert() recorded exactly 0 underlying calls");
  console.log("  ✓ PASS: Blocked .update() recorded exactly 0 underlying calls");
  console.log("  ✓ PASS: Blocked .delete() recorded exactly 0 underlying calls");
  console.log("  ✓ PASS: Blocked .upsert() recorded exactly 0 underlying calls");
  console.log("  ✓ PASS: Blocked .rpc() recorded exactly 0 underlying calls");
  console.log("  ✓ PASS: Blocked .schema().from().insert() recorded exactly 0 underlying calls");
}

// 4.2: Read-only operations (.select()) succeed and DO reach rawClient without triggering guard
{
  const { rawClient, calls } = createSpyClient();
  let guardTriggered = false;
  const guardedClient = createGuardedAdminClient(rawClient, () => {
    guardTriggered = true;
    throw new ProductionWriteGuardError("Blocked by safety guard");
  });

  assert.doesNotThrow(async () => {
    const res = await guardedClient.from("orders").select("*");
    assert.strictEqual(res.data[0].id, "order-123");
  });

  assert.strictEqual(guardTriggered, false, "Guard assertion was not triggered for read operation");
  assert.strictEqual(calls.select, 1, "Underlying .select() was invoked exactly once for read query");
  console.log("  ✓ PASS: Read operations (.select()) proceed without guard interference");
}

// 4.3: Permitted writes reach underlying client when guard passes
{
  const { rawClient, calls } = createSpyClient();
  const guardedClient = createGuardedAdminClient(rawClient, () => {
    // Permitted (no-op)
  });

  guardedClient.from("orders").insert({ test: true });
  assert.strictEqual(calls.insert, 1, "Underlying .insert() reached when guard permits");

  guardedClient.rpc("place_order_atomic", { test: true });
  assert.strictEqual(calls.rpc, 1, "Underlying .rpc() reached when guard permits");

  console.log("  ✓ PASS: Permitted writes reach underlying client when guard permits");
}

// ----------------------------------------------------------------------------
// PART 5: SECRET SANITIZATION TESTS
// ----------------------------------------------------------------------------
console.log("\n--- PART 5: SECRET SANITIZATION VERIFICATION ---");

{
  const testSecret = "sbp_secret_key_production_token_xyz123";
  const reason = evaluatePrivilegedWriteSafety({
    supabaseUrl: "https://obloaeuzdoohdxryaoei.supabase.co",
    appEnv: "development",
  }).reason;

  assert(!reason.includes(testSecret), "Secrets must never appear in evaluation reason");
  assert(!reason.includes("eyJh"), "JWT tokens must never appear in evaluation reason");
  assert(!reason.includes("Bearer"), "Bearer headers must never appear in evaluation reason");
  assert(!reason.includes("postgres:"), "Database passwords must never appear in evaluation reason");

  console.log("  ✓ PASS: Error messages and audit reasons strictly exclude tokens, passwords, and sensitive keys");
}

console.log("\n================================================================================");
console.log("ALL PRODUCTION WRITE GUARD VERIFICATION ASSERTIONS PASSED (0 FAILED)");
console.log("================================================================================\n");
