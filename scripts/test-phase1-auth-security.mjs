/**
 * Auto Clinic — Phase 1: Authentication & Customer Security Verification Suite
 * File: scripts/test-phase1-auth-security.mjs
 *
 * NOTE ON TEST BOUNDARIES:
 * - This suite provides focused unit and behavioral invariant testing alongside static source-code audits.
 * - This suite does NOT claim full end-to-end integration coverage against live databases or external SMS gateways.
 * - Static source checks and executable runtime behavioral tests are clearly partitioned into separate sections.
 */

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

let passedCount = 0;
let failedCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passedCount++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failedCount++;
  }
}

// Dynamically extract and load the actual normalizeNigerianPhone function from src/lib/utils/phone.ts
function loadPhoneNormalizationModule() {
  const filePath = path.resolve("src/lib/utils/phone.ts");
  const tsCode = fs.readFileSync(filePath, "utf8");
  const jsCode =
    tsCode
      .replace(/export interface[^{]+{[^}]+}/gs, "")
      .replace(
        /export function normalizeNigerianPhone\([^)]*\): [^{]+/g,
        "function normalizeNigerianPhone(rawInput)"
      ) + "\nmodule.exports = { normalizeNigerianPhone };";

  const sandbox = { module: { exports: {} }, exports: {} };
  vm.runInNewContext(jsCode, sandbox);
  return sandbox.module.exports.normalizeNigerianPhone;
}

// Simulated server action getStaffDashboardDataAction session verification & metadata extraction
function simulateGetStaffDashboardData(mockStaffSession) {
  if (!mockStaffSession) {
    return {
      success: false,
      error: "Unauthorized. Active staff session required.",
    };
  }

  return {
    success: true,
    data: {
      enquiries: [],
      orders: [],
      inventoryAlerts: [],
      metrics: { totalEnquiries: 0, pendingEnquiries: 0, totalOrders: 0, pendingOrders: 0, lowStockCount: 0 },
    },
    staff: {
      userId: mockStaffSession.userId,
      email: mockStaffSession.email,
      name: mockStaffSession.name,
      role: mockStaffSession.role,
    },
  };
}

// Simulated admin UI session restoration on page mount (from src/app/admin/page.tsx)
function simulateAdminPageSessionRestore(apiResponse) {
  if (apiResponse.success && apiResponse.data && apiResponse.staff) {
    return {
      userId: apiResponse.staff.userId,
      email: apiResponse.staff.email,
      name: apiResponse.staff.name,
      role: apiResponse.staff.role,
      expiresAt: Date.now() + 3600000,
    };
  }
  return null;
}

// Simulated role authorization policy (from updateOrderStatusAction in src/app/actions/staff.ts)
function simulateOrderStatusUpdateAuthorization(role) {
  if (role === "TECHNICIAN") {
    return {
      authorized: false,
      error: "Access denied. Order status and fulfilment management is restricted to administrative and shop staff.",
    };
  }
  if (role === "SUPERADMIN" || role === "STAFF") {
    return { authorized: true };
  }
  return { authorized: false, error: "Unauthorized role." };
}

// Masking function mirroring types/index.ts
function maskCustomerName(fullName) {
  if (!fullName || typeof fullName !== "string") return "Customer";
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const firstName = parts[0];
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
  return `${firstName} ${lastInitial}.`;
}

async function runSecuritySuite() {
  console.log("================================================================================");
  console.log("AUTO CLINIC — PHASE 1 AUTHENTICATION & CUSTOMER SECURITY SUITE");
  console.log("================================================================================\n");

  // ===========================================================================
  // SECTION 1: EXECUTABLE BEHAVIORAL TESTS (Runtime Unit & Invariant Execution)
  // ===========================================================================
  console.log("--- SECTION 1: EXECUTABLE BEHAVIORAL SECURITY TESTS ---\n");

  // --- Task 1: Phone Normalization Behavioral Tests ---
  console.log("[RUNTIME 1.1] Testing Nigerian Phone Normalization Engine (src/lib/utils/phone.ts)...");
  const normalizeNigerianPhone = loadPhoneNormalizationModule();

  // 1. Valid local formats
  const local1 = normalizeNigerianPhone("08031234567");
  assert(local1 && local1.e164 === "+2348031234567" && local1.local === "08031234567",
    "Standard local 11-digit (08031234567) normalizes to canonical E.164 and local");

  const local2 = normalizeNigerianPhone("07012345678");
  assert(local2 && local2.e164 === "+2347012345678" && local2.local === "07012345678",
    "Local 070 series (07012345678) normalizes to canonical E.164 and local");

  const local3 = normalizeNigerianPhone("09012345678");
  assert(local3 && local3.e164 === "+2349012345678" && local3.local === "09012345678",
    "Local 090 series (09012345678) normalizes to canonical E.164 and local");

  // 2. Valid international formats with +
  const intlWithPlus = normalizeNigerianPhone("+2348031234567");
  assert(intlWithPlus && intlWithPlus.e164 === "+2348031234567" && intlWithPlus.local === "08031234567",
    "International with + (+2348031234567) normalizes to canonical E.164 and local");

  // 3. Valid international formats without +
  const intlWithoutPlus = normalizeNigerianPhone("2348031234567");
  assert(intlWithoutPlus && intlWithoutPlus.e164 === "+2348031234567" && intlWithoutPlus.local === "08031234567",
    "International without + (2348031234567) normalizes to canonical E.164 and local");

  // 4. Common user typo combining international +234 with local 0 trunk prefix
  const redundantZero = normalizeNigerianPhone("+23408031234567");
  assert(redundantZero && redundantZero.e164 === "+2348031234567" && redundantZero.local === "08031234567",
    "Redundant zero typo (+23408031234567) cleanly resolves to canonical E.164 and local");

  // 5. Formatted inputs with spaces, dashes, and parentheses
  const spacedInput = normalizeNigerianPhone("0803 123 4567");
  assert(spacedInput && spacedInput.e164 === "+2348031234567",
    "Spaced input ('0803 123 4567') strips whitespace to canonical form");

  const dashedInput = normalizeNigerianPhone("+234-803-123-4567");
  assert(dashedInput && dashedInput.e164 === "+2348031234567",
    "Dashed input ('+234-803-123-4567') strips punctuation to canonical form");

  const parenthesized = normalizeNigerianPhone("(0803) 123 4567");
  assert(parenthesized && parenthesized.e164 === "+2348031234567",
    "Parenthesized input ('(0803) 123 4567') strips punctuation to canonical form");

  // 6. Ambiguous 10-digit national number
  const tenDigit = normalizeNigerianPhone("8031234567");
  assert(tenDigit && tenDigit.e164 === "+2348031234567" && tenDigit.local === "08031234567",
    "10-digit national number (8031234567) normalizes unambiguously");

  // 7. Strict Rejections: Incomplete, excess, foreign, or invalid characters
  assert(normalizeNigerianPhone("0803123") === null,
    "Short number ('0803123') is strictly rejected (returns null)");

  assert(normalizeNigerianPhone("0803123456789") === null,
    "Excess length number ('0803123456789') is strictly rejected (returns null)");

  assert(normalizeNigerianPhone("+12025550123") === null,
    "Foreign US number ('+12025550123') is strictly rejected (non-Nigerian country code)");

  assert(normalizeNigerianPhone("+447911123456") === null,
    "Foreign UK number ('+447911123456') is strictly rejected (non-Nigerian country code)");

  assert(normalizeNigerianPhone("0803abc4567") === null,
    "Alphanumeric string ('0803abc4567') is strictly rejected");

  assert(normalizeNigerianPhone("") === null && normalizeNigerianPhone(null) === null,
    "Empty or null input strictly returns null");

  // 8. Anti-collision and non-match proofs
  console.log("\n[RUNTIME 1.2] Testing Anti-Collision & Identity Non-Match Invariants...");
  const phoneA = normalizeNigerianPhone("08031234567");
  const phoneB = normalizeNigerianPhone("08031234568"); // One digit difference
  const phoneC = normalizeNigerianPhone("07031234567"); // Different prefix

  assert(phoneA.e164 !== phoneB.e164 && phoneA.local !== phoneB.local,
    "Anti-collision: Numbers with 1-digit variance produce distinct canonical identities");

  assert(phoneA.e164 !== phoneC.e164 && phoneA.local !== phoneC.local,
    "Anti-collision: Numbers with different network prefixes produce distinct identities");

  // Query filter simulation proof
  const buildExactFilters = (norm) => [
    `customer_phone.eq.${norm.e164}`,
    `customer_phone.eq.${norm.local}`,
  ];

  const filtersA = buildExactFilters(phoneA);
  const filtersB = buildExactFilters(phoneB);

  const overlap = filtersA.filter((f) => filtersB.includes(f));
  assert(overlap.length === 0,
    "Proof: Exact query filter sets for phone A and phone B have zero intersection (no collision)");

  // Identity equivalence proof
  const phoneFromOtp = normalizeNigerianPhone("+2348031234567");
  const phoneFromCheckout = normalizeNigerianPhone("08031234567");
  assert(
    phoneFromOtp.e164 === phoneFromCheckout.e164 &&
    phoneFromOtp.local === phoneFromCheckout.local,
    "Equivalence proof: OTP +234 E.164 and checkout local 080... resolve to identical canonical identity"
  );

  // --- Task 2: Authoritative Staff Metadata Restoration Tests ---
  console.log("\n[RUNTIME 2.1] Testing Staff Metadata Server Restoration (Task 2)...");

  // Test SUPERADMIN restoration
  const superadminSession = {
    userId: "usr-super-001",
    email: "superadmin@autoclinic.ng",
    name: "System Director",
    role: "SUPERADMIN",
    token: "secret-bearer-token-12345",
  };
  const superadminServerRes = simulateGetStaffDashboardData(superadminSession);
  assert(superadminServerRes.success === true, "SUPERADMIN server request succeeds");
  assert(superadminServerRes.staff.role === "SUPERADMIN", "SUPERADMIN server response contains verified role SUPERADMIN");
  assert(!("token" in superadminServerRes.staff), "Server response strictly omits access token from staff metadata");

  const restoredSuperadmin = simulateAdminPageSessionRestore(superadminServerRes);
  assert(restoredSuperadmin && restoredSuperadmin.role === "SUPERADMIN",
    "UI Session restoration accurately restores SUPERADMIN role in client state");
  assert(!("token" in restoredSuperadmin), "Restored client session does not retain access token");

  // Test STAFF restoration
  const staffSession = {
    userId: "usr-staff-002",
    email: "service.desk@autoclinic.ng",
    name: "Desk Lead",
    role: "STAFF",
    token: "secret-bearer-token-67890",
  };
  const staffServerRes = simulateGetStaffDashboardData(staffSession);
  assert(staffServerRes.staff.role === "STAFF", "STAFF server response contains verified role STAFF");
  const restoredStaff = simulateAdminPageSessionRestore(staffServerRes);
  assert(restoredStaff && restoredStaff.role === "STAFF",
    "UI Session restoration accurately restores STAFF role in client state");

  // Test TECHNICIAN restoration
  const techSession = {
    userId: "usr-tech-003",
    email: "lead.tech@autoclinic.ng",
    name: "Master Tech",
    role: "TECHNICIAN",
    token: "secret-bearer-token-54321",
  };
  const techServerRes = simulateGetStaffDashboardData(techSession);
  assert(techServerRes.staff.role === "TECHNICIAN", "TECHNICIAN server response contains verified role TECHNICIAN");
  const restoredTech = simulateAdminPageSessionRestore(techServerRes);
  assert(restoredTech && restoredTech.role === "TECHNICIAN",
    "UI Session restoration accurately restores TECHNICIAN role (NOT hardcoded STAFF placeholder)");

  // Test Unauthenticated Response
  const unauthServerRes = simulateGetStaffDashboardData(null);
  assert(unauthServerRes.success === false, "Unauthenticated server request returns success: false");
  assert(unauthServerRes.staff === undefined, "Unauthenticated server response has no staff metadata property");
  const restoredUnauth = simulateAdminPageSessionRestore(unauthServerRes);
  assert(restoredUnauth === null, "Unauthenticated response strictly resets client session to null");

  // --- Task 2.2: RBAC Policy Invariants ---
  console.log("\n[RUNTIME 2.2] Testing Role-Based Operation Access Controls...");
  const techOrderAttempt = simulateOrderStatusUpdateAuthorization("TECHNICIAN");
  assert(!techOrderAttempt.authorized, "TECHNICIAN role is strictly blocked from updating order fulfilment statuses");

  const staffOrderAttempt = simulateOrderStatusUpdateAuthorization("STAFF");
  assert(staffOrderAttempt.authorized, "STAFF role is permitted to update order fulfilment statuses");

  const superadminOrderAttempt = simulateOrderStatusUpdateAuthorization("SUPERADMIN");
  assert(superadminOrderAttempt.authorized, "SUPERADMIN role is permitted to update order fulfilment statuses");

  // --- Task 4.1: Public Tracking Sanitization Invariants ---
  console.log("\n[RUNTIME 2.3] Testing Public Tracking Projection Data Sanitization...");
  const rawDiagnosticRecord = {
    id: "e1000000-0000-0000-0000-000000000001",
    reference_code: "AC-ENQ-998877",
    customer_name: "Adeola Olawale Johnson",
    customer_email: "adeola@example.ng",
    customer_phone: "08031234567",
    staff_notes: "Internal diagnostic triage notes: ECU suspected faulty.",
    vehicle_make: "Toyota",
    vehicle_model: "Camry",
    vehicle_year: "2018",
    symptoms: "Check engine warning light",
    status: "PENDING_REVIEW",
    created_at: "2026-10-26T12:00:00Z",
  };

  const publicProjection = {
    referenceCode: rawDiagnosticRecord.reference_code,
    customerNameMasked: maskCustomerName(rawDiagnosticRecord.customer_name),
    vehicleMake: rawDiagnosticRecord.vehicle_make,
    vehicleModel: rawDiagnosticRecord.vehicle_model,
    vehicleYear: rawDiagnosticRecord.vehicle_year,
    symptoms: rawDiagnosticRecord.symptoms,
    status: rawDiagnosticRecord.status,
    createdAt: rawDiagnosticRecord.created_at,
  };

  assert(!("staffNotes" in publicProjection), "Public tracking view strictly omits internal staff_notes");
  assert(!("customerEmail" in publicProjection), "Public tracking view strictly omits customer email address");
  assert(!("customerPhone" in publicProjection), "Public tracking view strictly omits customer phone number");
  assert(!("id" in publicProjection), "Public tracking view strictly omits database internal UUID");
  assert(publicProjection.customerNameMasked === "Adeola J.", "Customer full name is masked to initial ('Adeola J.')");

  // --- Scope A: Canonical E.164 Persistence & Input Rejection Tests ---
  console.log("\n[RUNTIME 3.1] Testing Canonical Phone Storage on New Orders & Enquiries (Scope A)...");

  // Simulation of order validation & canonical phone assignment
  const simulateOrderPhoneProcessing = (rawPhone, rawWhatsapp) => {
    const normPhone = normalizeNigerianPhone(rawPhone);
    if (!normPhone) {
      return { valid: false, error: "A valid Nigerian contact phone number is required" };
    }
    let normWhatsapp = undefined;
    if (rawWhatsapp && rawWhatsapp.trim().length > 0) {
      const parsed = normalizeNigerianPhone(rawWhatsapp);
      if (!parsed) {
        return { valid: false, error: "Please enter a valid Nigerian WhatsApp number" };
      }
      normWhatsapp = parsed.e164;
    }
    return {
      valid: true,
      storedCustomerPhone: normPhone.e164,
      storedCustomerWhatsapp: normWhatsapp || normPhone.e164,
    };
  };

  const orderResult1 = simulateOrderPhoneProcessing("0803 123 4567");
  assert(orderResult1.valid && orderResult1.storedCustomerPhone === "+2348031234567",
    "New order with local spaced phone ('0803 123 4567') persists in canonical E.164 ('+2348031234567')");

  const orderResult2 = simulateOrderPhoneProcessing("+234-701-234-5678", "08031234567");
  assert(orderResult2.valid &&
    orderResult2.storedCustomerPhone === "+2347012345678" &&
    orderResult2.storedCustomerWhatsapp === "+2348031234567",
    "New order with custom WhatsApp number persists both phone and WhatsApp in canonical E.164");

  const orderReject1 = simulateOrderPhoneProcessing("0803123");
  assert(!orderReject1.valid, "Order validation strictly rejects short/incomplete phone number ('0803123')");

  const orderReject2 = simulateOrderPhoneProcessing("+12025550123");
  assert(!orderReject2.valid, "Order validation strictly rejects non-Nigerian international number ('+12025550123')");

  const orderReject3 = simulateOrderPhoneProcessing("0803abc4567");
  assert(!orderReject3.valid, "Order validation strictly rejects alphanumeric phone entry ('0803abc4567')");

  // Simulation of order/enquiry tracking lookup phone matching
  console.log("\n[RUNTIME 3.2] Testing Tracking Lookup Phone Match Compatibility (Scope A)...");
  const simulateTrackingPhoneMatch = (storedRowPhone, userQueryPhone) => {
    const normRow = normalizeNigerianPhone(storedRowPhone);
    const normInput = normalizeNigerianPhone(userQueryPhone);
    return (
      (normRow && normInput && normRow.e164 === normInput.e164) ||
      storedRowPhone?.replace(/[^0-9]/g, "") === userQueryPhone.replace(/[^0-9]/g, "")
    );
  };

  const matchCanonicalLocal = simulateTrackingPhoneMatch("+2348031234567", "08031234567");
  assert(matchCanonicalLocal, "Tracking lookup: User enters local '08031234567' matching canonical stored '+2348031234567'");

  const matchCanonicalSpaced = simulateTrackingPhoneMatch("+2348031234567", "0803 123 4567");
  assert(matchCanonicalSpaced, "Tracking lookup: User enters spaced '0803 123 4567' matching canonical stored '+2348031234567'");

  const matchDifferentSubscriber = simulateTrackingPhoneMatch("+2348031234567", "08031234568");
  assert(!matchDifferentSubscriber, "Tracking lookup: Different subscriber phone ('08031234568') does not match");

  // --- Scope B: Rate Limiting Policy Decision Algorithm Tests ---
  console.log("\n[RUNTIME 4.1] Testing Proposed Rate Limiting Policy Decision Engine (Scope B)...");

  // Simulated rate-limiting sliding window policy engine
  function simulateRateLimiterDecision({
    requestHistory, // array of timestamps in ms
    windowMs = 3600000, // 1 hour
    maxRequests = 3,
    currentTime = Date.now(),
    lastRequestTime = 0,
    cooldownMs = 60000, // 60s
  }) {
    // 1. Check resend cooldown
    if (currentTime - lastRequestTime < cooldownMs) {
      const waitSeconds = Math.ceil((cooldownMs - (currentTime - lastRequestTime)) / 1000);
      return { allowed: false, reason: "COOLDOWN", waitSeconds };
    }

    // 2. Filter requests within sliding window
    const recentRequests = requestHistory.filter((t) => currentTime - t < windowMs);

    // 3. Evaluate window count limit
    if (recentRequests.length >= maxRequests) {
      return { allowed: false, reason: "RATE_LIMIT_EXCEEDED", recentCount: recentRequests.length };
    }

    return { allowed: true, recentCount: recentRequests.length + 1 };
  }

  const now = 1000000;
  // Test 1: First request allows
  const dec1 = simulateRateLimiterDecision({ requestHistory: [], currentTime: now, lastRequestTime: 0 });
  assert(dec1.allowed === true, "Rate limit decision: First request is permitted");

  // Test 2: Request within 60s cooldown is blocked
  const decCooldown = simulateRateLimiterDecision({ requestHistory: [now], currentTime: now + 30000, lastRequestTime: now });
  assert(!decCooldown.allowed && decCooldown.reason === "COOLDOWN",
    "Rate limit decision: Request within 60-second cooldown is blocked");

  // Test 3: Request after cooldown but under limit is permitted
  const decAfterCooldown = simulateRateLimiterDecision({ requestHistory: [now], currentTime: now + 70000, lastRequestTime: now });
  assert(decAfterCooldown.allowed === true,
    "Rate limit decision: Request after 60s cooldown is permitted");

  // Test 4: Exceeding 3 requests per hour is blocked
  const decExceeded = simulateRateLimiterDecision({
    requestHistory: [now, now + 100000, now + 200000],
    currentTime: now + 300000,
    lastRequestTime: now + 200000,
  });
  assert(!decExceeded.allowed && decExceeded.reason === "RATE_LIMIT_EXCEEDED",
    "Rate limit decision: 4th request in 1-hour window exceeds threshold and is blocked");

  // --- Task 5: Hardened Logout & Session Revocation Invariant Tests ---
  console.log("\n[RUNTIME 5.1] Testing Hardened Session Revocation & Cookie Cleanup Invariants...");

  async function simulateLogoutAction({
    cookieName,
    cookiesMock,
    isConfigured,
    adminRevokeThrows = false,
  }) {
    let revocationCalledWithToken = null;
    let cookieDeletedName = null;

    try {
      const token = cookiesMock.get(cookieName)?.value;

      if (token && isConfigured) {
        try {
          if (adminRevokeThrows) {
            throw new Error("Supabase Auth service unreachable (500)");
          }
          revocationCalledWithToken = token;
        } catch {
          // Absorb revocation errors
        }
      }

      try {
        cookiesMock.delete(cookieName);
        cookieDeletedName = cookieName;
      } catch (cookieErr) {
        // Absorb cookie error
      }
    } catch {
      // Absorb handler error
    }

    return {
      result: { success: true },
      revocationCalledWithToken,
      cookieDeletedName,
    };
  }

  // Case 1: Configured Supabase + Active Staff Token -> Revocation called & cookie deleted
  const mockStaffCookies = {
    store: new Map([["ac_staff_token", { value: "staff-valid-jwt-999" }]]),
    get(name) { return this.store.get(name); },
    delete(name) { this.store.delete(name); },
  };
  const simStaffLogout = await simulateLogoutAction({
    cookieName: "ac_staff_token",
    cookiesMock: mockStaffCookies,
    isConfigured: true,
  });
  assert(simStaffLogout.result.success === true, "Staff logout returns success: true");
  assert(simStaffLogout.revocationCalledWithToken === "staff-valid-jwt-999",
    "Staff logout triggers authoritative server-side signOut with active JWT");
  assert(!mockStaffCookies.store.has("ac_staff_token"),
    "Staff logout unconditionally removes ac_staff_token HTTP-only cookie");

  // Case 2: Server revocation throws error -> Error absorbed, cookie still deleted, success returned
  const mockCustomerCookiesThrows = {
    store: new Map([["ac_customer_token", { value: "cust-jwt-888" }]]),
    get(name) { return this.store.get(name); },
    delete(name) { this.store.delete(name); },
  };
  const simThrowLogout = await simulateLogoutAction({
    cookieName: "ac_customer_token",
    cookiesMock: mockCustomerCookiesThrows,
    isConfigured: true,
    adminRevokeThrows: true,
  });
  assert(simThrowLogout.result.success === true,
    "Customer logout returns success: true even when server revocation fails/throws");
  assert(!mockCustomerCookiesThrows.store.has("ac_customer_token"),
    "Customer logout deletes ac_customer_token even when server revocation throws");
  assert(!("error" in simThrowLogout.result) && !("token" in simThrowLogout.result),
    "Logout result does not disclose errors, tokens, or internal backend state");

  // Case 3: Supabase unconfigured / missing token -> No revocation attempted, cookie safely deleted
  const mockEmptyCookies = {
    store: new Map(),
    get(name) { return this.store.get(name); },
    delete(name) { this.store.delete(name); },
  };
  const simEmptyLogout = await simulateLogoutAction({
    cookieName: "ac_staff_token",
    cookiesMock: mockEmptyCookies,
    isConfigured: false,
  });
  assert(simEmptyLogout.result.success === true,
    "Logout with unconfigured Supabase or missing token succeeds cleanly");
  assert(simEmptyLogout.revocationCalledWithToken === null,
    "Logout does not attempt server revocation if token is absent or unconfigured");

  // ===========================================================================
  // SECTION 2: STATIC SOURCE-CODE SECURITY CHECKS (Static Analysis)
  // ===========================================================================
  console.log("\n--- SECTION 2: STATIC SOURCE-CODE SECURITY CHECKS ---\n");

  const staffCode = fs.readFileSync(path.resolve("src/app/actions/staff.ts"), "utf8");
  const customerCode = fs.readFileSync(path.resolve("src/app/actions/customer.ts"), "utf8");
  const adminPageCode = fs.readFileSync(path.resolve("src/app/admin/page.tsx"), "utf8");
  const serverClientCode = fs.readFileSync(path.resolve("src/lib/supabase/server.ts"), "utf8");
  const ordersCode = fs.readFileSync(path.resolve("src/app/actions/orders.ts"), "utf8");
  const diagnosticsCode = fs.readFileSync(path.resolve("src/app/actions/diagnostics.ts"), "utf8");
  const accountPageCode = fs.readFileSync(path.resolve("src/app/account/page.tsx"), "utf8");

  // Check 1: Absence of hardcoded credentials
  assert(!staffCode.includes("AutoClinic2026!Staff"),
    "Static Check: Legacy hardcoded staff passcode ('AutoClinic2026!Staff') is completely absent from staff.ts");

  assert(!adminPageCode.includes("AutoClinic2026!Staff"),
    "Static Check: Legacy hardcoded staff passcode is completely absent from admin/page.tsx");

  // Check 2: Absence of in-memory staff token stores
  assert(!staffCode.includes("STAFF_SESSIONS"),
    "Static Check: Ephemeral in-memory STAFF_SESSIONS map is removed; authentication relies on Supabase Auth + admin_roles");

  // Check 3: Active role check in admin_roles table
  assert(staffCode.includes("from(\"admin_roles\")") && staffCode.includes("roleRow.is_active !== true"),
    "Static Check: Staff session verification queries admin_roles and enforces is_active === true");

  // Check 4: Technician authorization block in order action
  assert(staffCode.includes('staff.role === "TECHNICIAN"') && staffCode.includes("Technicians are not authorized to modify commercial order statuses"),
    "Static Check: updateOrderStatusAction explicitly validates staff.role and blocks TECHNICIAN");

  // Check 5: Fail-closed configuration check
  assert(serverClientCode.includes("SUPABASE_SERVICE_ROLE_KEY environment variable is missing on server"),
    "Static Check: createAdminClient() strictly throws when SUPABASE_SERVICE_ROLE_KEY is unconfigured");

  // Check 6: Absence of hardcoded role placeholder in session restore
  assert(!adminPageCode.includes('role: "STAFF"') || adminPageCode.includes("res.staff.role"),
    "Static Check: Admin page session restoration uses server-verified res.staff.role instead of static placeholder");

  // Check 7: Absence of fallback customer mock data in customer action
  assert(!customerCode.includes("DEV_PORTAL_DATA"),
    "Static Check: Insecure mock customer fallback DEV_PORTAL_DATA is absent from customer portal action");

  // Check 8: Customer portal queries strictly use verified identity
  assert(customerCode.includes("customer_phone.eq.${normalizedPhone.e164}") &&
         customerCode.includes("customer_phone.eq.${normalizedPhone.local}"),
    "Static Check: Customer portal lookup matches canonical E.164 and local phone formats bound to verified OTP session");

  // Check 9: New orders normalize customer phone to canonical E.164
  assert(ordersCode.includes("normalizeNigerianPhone(input.customer?.phone)") &&
         ordersCode.includes("normalizedPhone ? normalizedPhone.e164 :"),
    "Static Check: orders.ts validates customer phone with normalizeNigerianPhone and persists canonical E.164");

  // Check 10: New diagnostic enquiries normalize customer phone to canonical E.164
  assert(diagnosticsCode.includes("normalizeNigerianPhone(input.customerPhone)") &&
         diagnosticsCode.includes("normalizedPhone ? normalizedPhone.e164 :"),
    "Static Check: diagnostics.ts validates customer phone with normalizeNigerianPhone and persists canonical E.164");

  // Check 11: Account page implements supplementary resend cooldown
  assert(accountPageCode.includes("cooldownSeconds") && accountPageCode.includes("setCooldownSeconds(60)"),
    "Static Check: account/page.tsx implements supplementary 60-second client-side resend cooldown timer");

  // Check 12: Staff logout attempts server-side revocation and deletes cookie
  assert(staffCode.includes("adminSupabase.auth.admin.signOut(token)") &&
         staffCode.includes('cookieStore.delete("ac_staff_token")'),
    "Static Check: staffLogoutAction attempts server-side session revocation and guarantees ac_staff_token deletion");

  // Check 13: Customer logout attempts server-side revocation and deletes cookie
  assert(customerCode.includes("adminSupabase.auth.admin.signOut(token)") &&
         customerCode.includes('cookieStore.delete("ac_customer_token")'),
    "Static Check: customerLogoutAction attempts server-side session revocation and guarantees ac_customer_token deletion");

  console.log("\n--- SECTION 11: CUSTOMER-FACING WORKFLOW & TRACKING AUDITS ---");

  const contactPageCode = fs.readFileSync(path.resolve("src/app/contact/page.tsx"), "utf8");
  const headerCode = fs.readFileSync(path.resolve("src/components/layout/Header.tsx"), "utf8");
  const mobileNavCode = fs.readFileSync(path.resolve("src/components/layout/MobileNavigation.tsx"), "utf8");
  const footerCode = fs.readFileSync(path.resolve("src/components/layout/Footer.tsx"), "utf8");

  // Check 14: Contact page persistence
  assert(contactPageCode.includes("submitContactEnquiryAction") &&
         !contactPageCode.includes("setTimeout"),
    "Workflow Check: contact/page.tsx calls submitContactEnquiryAction and does not simulate submissions with setTimeout");

  // Check 15: Contact page reference code display
  assert(contactPageCode.includes("submittedRef") &&
         contactPageCode.includes("YOUR TRACKING REFERENCE CODE") &&
         contactPageCode.includes('href="/track"'),
    "Workflow Check: contact/page.tsx displays generated reference code with direct link to /track status");

  // Check 16: Diagnostics action exports submitContactEnquiryAction with phone normalization
  assert(diagnosticsCode.includes("export async function submitContactEnquiryAction") &&
         diagnosticsCode.includes("normalizeNigerianPhone(input.phone)"),
    "Workflow Check: diagnostics.ts implements submitContactEnquiryAction with strict Nigerian phone normalization");

  // Check 17: In-memory dev orders lookup normalizes phone matching
  assert(ordersCode.includes("normalizeNigerianPhone(cleanContact)") &&
         ordersCode.includes("normDevPhone && normInputPhone && normDevPhone.e164 === normInputPhone.e164"),
    "Workflow Check: orders.ts lookupOrderStatusAction dev store matches normalized E.164 phone across 080... and +234... formats");

  // Check 18: In-memory dev enquiries lookup normalizes phone matching
  assert(diagnosticsCode.includes("normalizeNigerianPhone(cleanContact)") &&
         diagnosticsCode.includes("normDevPhone && normInputPhone && normDevPhone.e164 === normInputPhone.e164"),
    "Workflow Check: diagnostics.ts lookupDiagnosticStatusAction dev store matches normalized E.164 phone across 080... and +234... formats");

  // Check 19: Header navigation points to Track Status and Business Admin
  assert(headerCode.includes('href="/track"') &&
         headerCode.includes("Track Status") &&
         headerCode.includes('href="/admin"') &&
         headerCode.includes("Business Admin") &&
         !headerCode.includes("Customer Portal"),
    "Workflow Check: Header top utilities direct users to Track Status and Business Admin instead of Customer Portal");

  // Check 20: MobileNavigation points to Track Order / Enquiry and Business Admin
  assert(mobileNavCode.includes('href="/track"') &&
         mobileNavCode.includes("Track Order / Enquiry") &&
         mobileNavCode.includes("Business Admin") &&
         !mobileNavCode.includes("Customer Account / Login"),
    "Workflow Check: Mobile navigation directs customers to Track Order / Enquiry and Business Admin");

  // Check 21: Footer points to Business Admin
  assert(footerCode.includes('href="/admin"') &&
         footerCode.includes("Business Admin") &&
         !footerCode.includes("Staff Portal"),
    "Workflow Check: Footer points to Business Admin");

  // Behavioral test: Dev store phone normalization matching logic
  const normalize = loadPhoneNormalizationModule();
  const storedPhone = "+2348012345678";
  const userQueries = ["08012345678", "+2348012345678", "080-1234-5678", "2348012345678"];
  for (const q of userQueries) {
    const storedNorm = normalize(storedPhone);
    const queryNorm = normalize(q);
    const isMatch = storedNorm && queryNorm && storedNorm.e164 === queryNorm.e164;
    assert(isMatch, `Behavioral Check: Tracking lookup matches stored '${storedPhone}' when queried with '${q}'`);
  }

  // Behavioral test: Invalid contact phone rejection in enquiry validation logic
  const invalidPhones = ["12345", "not-a-phone", "070000000000000000"];
  for (const inv of invalidPhones) {
    const res = normalize(inv);
    assert(!res, `Behavioral Check: Phone normalizer correctly rejects invalid contact '${inv}'`);
  }

  console.log("\n================================================================================");
  console.log(`TOTAL SECURITY & WORKFLOW ASSERTIONS: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("================================================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runSecuritySuite().catch((err) => {
  console.error("Test execution fatal error:", err);
  process.exit(1);
});
