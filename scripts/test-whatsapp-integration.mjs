// ============================================================================
// AUTO CLINIC — WHATSAPP CLICK-TO-CHAT & PREFILLED MESSAGE INTEGRATION TESTS
// Tests phone number validation, URL-encoding, customer-initiated handoffs,
// prefilled message builders, and security/privacy invariants.
// ============================================================================

import assert from "node:assert";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// Bootstrap Node with experimental strip-types and alias loader if not already active
const isStripTypesActive = process.execArgv.includes("--experimental-strip-types");

if (!isStripTypesActive) {
  const result = spawnSync(
    process.execPath,
    [
      "--experimental-strip-types",
      "--loader",
      "./scripts/alias-loader.mjs",
      fileURLToPath(import.meta.url),
      ...process.argv.slice(2),
    ],
    { stdio: "inherit" }
  );
  process.exit(result.status ?? 1);
}

// ----------------------------------------------------------------------------
// DIRECT IMPORT OF WHATSAPP UTILITIES
// ----------------------------------------------------------------------------
const {
  getCleanWhatsAppNumber,
  isWhatsAppConfigured,
  buildWhatsAppUrl,
  generateGeneralEnquiryWhatsAppUrl,
  generateDiagnosticWhatsAppUrl,
  generateOrderConfirmationWhatsAppUrl,
  generateOrderFollowUpWhatsAppUrl,
  generateCartWhatsAppUrl,
  generateProductWhatsAppUrl,
  formatNaira,
  PLACEHOLDER_WHATSAPP_NUMBER,
} = await import("../src/lib/utils/whatsapp.ts");

console.log("================================================================================");
console.log("AUTO CLINIC — WHATSAPP CLICK-TO-CHAT & PREFILLED PAYLOAD AUDIT");
console.log("================================================================================\n");

let passed = 0;
let failed = 0;

function runTest(description, fn) {
  try {
    fn();
    console.log(`  ✓ PASS: ${description}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${description}`);
    console.error("   ", err.message || err);
    failed++;
  }
}

// ============================================================================
// SECTION 1: BUSINESS PHONE NUMBER VALIDATION & CANONICAL NORMALIZATION
// ============================================================================
console.log("--- Section 1: Business Phone Number Validation & Canonical Normalization ---");

runTest("1.1: Returns null when phone number is undefined or null", () => {
  assert.strictEqual(getCleanWhatsAppNumber(undefined), null);
  assert.strictEqual(getCleanWhatsAppNumber(null), null);
});

runTest("1.2: Returns null for empty or whitespace-only inputs", () => {
  assert.strictEqual(getCleanWhatsAppNumber(""), null);
  assert.strictEqual(getCleanWhatsAppNumber("   "), null);
});

runTest("1.3: Rejects placeholder numbers (2340000000000, placeholder string, your_...)", () => {
  assert.strictEqual(getCleanWhatsAppNumber(PLACEHOLDER_WHATSAPP_NUMBER), null);
  assert.strictEqual(getCleanWhatsAppNumber("2340000000000"), null);
  assert.strictEqual(getCleanWhatsAppNumber("placeholder_number"), null);
  assert.strictEqual(getCleanWhatsAppNumber("your_whatsapp_number_here"), null);
});

runTest("1.4: Normalizes and extracts digits from valid international formats", () => {
  assert.strictEqual(getCleanWhatsAppNumber("2348031234567"), "2348031234567");
  assert.strictEqual(getCleanWhatsAppNumber("+2348031234567"), "2348031234567");
  assert.strictEqual(getCleanWhatsAppNumber("+234 803 123 4567"), "2348031234567");
  assert.strictEqual(getCleanWhatsAppNumber("234-803-123-4567"), "2348031234567");
  assert.strictEqual(getCleanWhatsAppNumber("+234 (803) 123-4567"), "2348031234567");
});

runTest("1.5: Rejects numbers with invalid digit counts (<10 or >15 digits)", () => {
  assert.strictEqual(getCleanWhatsAppNumber("123456789"), null); // 9 digits
  assert.strictEqual(getCleanWhatsAppNumber("1234567890123456"), null); // 16 digits
});

runTest("1.6: Rejects repeating single dummy digits (e.g. 0000000000, 1111111111)", () => {
  assert.strictEqual(getCleanWhatsAppNumber("0000000000"), null);
  assert.strictEqual(getCleanWhatsAppNumber("111111111111"), null);
  assert.strictEqual(getCleanWhatsAppNumber("999999999999"), null);
});

runTest("1.7: isWhatsAppConfigured() reflects real vs unconfigured numbers", () => {
  assert.strictEqual(isWhatsAppConfigured("2340000000000"), false);
  assert.strictEqual(isWhatsAppConfigured(""), false);
  assert.strictEqual(isWhatsAppConfigured("2348031234567"), true);
});

// ============================================================================
// SECTION 2: URL CONSTRUCTION & SAFE CLIENT-SIDE HANDOFF
// ============================================================================
console.log("\n--- Section 2: URL Construction & Safe Client-Side Handoff ---");

runTest("2.1: buildWhatsAppUrl returns undefined if number is unconfigured or placeholder", () => {
  const urlPlaceholder = buildWhatsAppUrl("Hello", "2340000000000");
  assert.strictEqual(urlPlaceholder, undefined);

  const urlEmpty = buildWhatsAppUrl("Hello", "");
  assert.strictEqual(urlEmpty, undefined);
});

runTest("2.2: buildWhatsAppUrl constructs valid wa.me URL with clean digits and URL encoding", () => {
  const url = buildWhatsAppUrl("Hello Auto Clinic! Testing & Consultation.", "2348031234567");
  assert.ok(url);
  assert.ok(url.startsWith("https://wa.me/2348031234567?text="));

  // Verify proper URL-encoding of spaces, exclamation marks, ampersands
  const textParam = url.split("?text=")[1];
  assert.ok(textParam.includes("%20") || textParam.includes("+"));
  assert.ok(!textParam.includes(" "));
  assert.strictEqual(decodeURIComponent(textParam), "Hello Auto Clinic! Testing & Consultation.");
});

// ============================================================================
// SECTION 3: PREFILLED MESSAGES GENERATION
// ============================================================================
console.log("\n--- Section 3: Prefilled Messages Generation ---");

const TEST_NUMBER = "2348112798026";

runTest("3.1: General enquiry message generation without parameters", () => {
  const originalEnv = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = TEST_NUMBER;
  try {
    const url = generateGeneralEnquiryWhatsAppUrl();
    assert.ok(url);
    assert.ok(url.startsWith(`https://wa.me/${TEST_NUMBER}?text=`));
    const decoded = decodeURIComponent(url.split("?text=")[1]);
    assert.ok(decoded.includes("WORKSHOP & STORE ENQUIRY"));
    assert.ok(decoded.includes("General Enquiry & Technical Consultation"));
    assert.ok(decoded.includes("Hello Auto Clinic"));
  } finally {
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = originalEnv;
  }
});

runTest("3.2: General enquiry message generation with reference code and customer name", () => {
  const originalEnv = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = TEST_NUMBER;
  try {
    const url = generateGeneralEnquiryWhatsAppUrl({
      referenceCode: "AC-ENQ-829104",
      subject: "Brake Diagnostic Schedule",
      customerName: "Chidi O.",
    });
    assert.ok(url);
    const decoded = decodeURIComponent(url.split("?text=")[1]);
    assert.ok(decoded.includes("AC-ENQ-829104"));
    assert.ok(decoded.includes("Chidi O."));
    assert.ok(decoded.includes("Brake Diagnostic Schedule"));
  } finally {
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = originalEnv;
  }
});

runTest("3.3: Diagnostic enquiry message generation with vehicle, symptoms, and reference code", () => {
  const originalEnv = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = TEST_NUMBER;
  try {
    const url = generateDiagnosticWhatsAppUrl(
      "AC-DIAG-9921",
      { make: "Toyota", model: "Camry", year: "2018" },
      "Check engine light flashing with rough idle on cold start",
      "Emeka A."
    );
    assert.ok(url);
    const decoded = decodeURIComponent(url.split("?text=")[1]);
    assert.ok(decoded.includes("AC-DIAG-9921"));
    assert.ok(decoded.includes("Emeka A."));
    assert.ok(decoded.includes("2018 Toyota Camry"));
    assert.ok(decoded.includes("Check engine light flashing with rough idle on cold start"));
    assert.ok(decoded.includes("schedule a workshop arrival slot"));
  } finally {
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = originalEnv;
  }
});

runTest("3.4: Diagnostic enquiry handles general/unspecified vehicle gracefully", () => {
  const originalEnv = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = TEST_NUMBER;
  try {
    const url = generateDiagnosticWhatsAppUrl(
      "AC-DIAG-1100",
      { make: "N/A", model: "N/A", year: "N/A" },
      "General electrical inspection",
      "Amina B."
    );
    assert.ok(url);
    const decoded = decodeURIComponent(url.split("?text=")[1]);
    assert.ok(decoded.includes("AC-DIAG-1100"));
    assert.ok(!decoded.includes("N/A N/A"));
  } finally {
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = originalEnv;
  }
});

runTest("3.5: Diagnostic enquiry truncates excessively long symptoms to remain URL-friendly", () => {
  const originalEnv = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = TEST_NUMBER;
  try {
    const verboseSymptoms = "A".repeat(400);
    const url = generateDiagnosticWhatsAppUrl(
      "AC-DIAG-LONG",
      { make: "Honda", model: "Accord", year: "2020" },
      verboseSymptoms,
      "Tester"
    );
    assert.ok(url);
    const decoded = decodeURIComponent(url.split("?text=")[1]);
    assert.ok(decoded.includes("..."));
    // Ensure truncated symptom section is at most ~203 characters
    const symptomLine = decoded.split("\n").find((l) => l.startsWith("*Reported Symptoms:*"));
    assert.ok(symptomLine);
    assert.ok(symptomLine.length <= 230);
  } finally {
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = originalEnv;
  }
});

runTest("3.6: Order confirmation and follow-up generates accurate items, reference, and NGN total", () => {
  const originalEnv = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = TEST_NUMBER;
  try {
    const items = [
      { sku: "AC-DEV-OBD802", name: "Heavy Duty OBD2 Scanner", quantity: 2, unitPriceCents: 4850000 },
      { sku: "AC-DEV-BAT300", name: "Digital Battery Tester", quantity: 1, unitPriceCents: 1520000 },
    ];
    const totalCents = 11220000; // ₦112,200.00
    const url = generateOrderConfirmationWhatsAppUrl(
      "AC-ORD-20260922-8F12",
      items,
      totalCents,
      "Babajide O."
    );
    assert.ok(url);
    const decoded = decodeURIComponent(url.split("?text=")[1]);
    assert.ok(decoded.includes("AC-ORD-20260922-8F12"));
    assert.ok(decoded.includes("Babajide O."));
    assert.ok(decoded.includes("Heavy Duty OBD2 Scanner (SKU: AC-DEV-OBD802) × 2"));
    assert.ok(decoded.includes("Digital Battery Tester (SKU: AC-DEV-BAT300) × 1"));
    assert.ok(decoded.includes("₦112,200.00"));
    assert.ok(decoded.includes("UNPAID (Awaiting bank transfer invoice / confirmation)"));

    // Verify alias generates identical output
    const aliasUrl = generateOrderFollowUpWhatsAppUrl(
      "AC-ORD-20260922-8F12",
      items,
      totalCents,
      "Babajide O."
    );
    assert.strictEqual(aliasUrl, url);
  } finally {
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = originalEnv;
  }
});

// ============================================================================
// SECTION 4: PRIVACY, SECRETS & CLIENT-HANDOFF BOUNDARIES
// ============================================================================
console.log("\n--- Section 4: Privacy, Secrets & Handoff Boundaries ---");

runTest("4.1: Message payloads do not contain sensitive tokens, keys, passwords or internal DB IDs", () => {
  const originalEnv = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = TEST_NUMBER;
  try {
    const generalUrl = generateGeneralEnquiryWhatsAppUrl({ referenceCode: "AC-ENQ-1", subject: "Help" });
    const diagUrl = generateDiagnosticWhatsAppUrl("AC-DIAG-1", { make: "Ford", model: "Focus" }, "Knock sound", "Customer");
    const orderUrl = generateOrderConfirmationWhatsAppUrl("AC-ORD-1", [{ sku: "SKU1", name: "Scanner", quantity: 1 }], 500000, "Customer");

    for (const url of [generalUrl, diagUrl, orderUrl]) {
      const decoded = decodeURIComponent(url);
      assert.ok(!decoded.includes("eyJhbGci"), "Must not leak JWT tokens");
      assert.ok(!decoded.includes("service_role"), "Must not leak service role key");
      assert.ok(!decoded.includes("SUPABASE_"), "Must not leak Supabase env keys");
      assert.ok(!decoded.includes("password"), "Must not contain password strings");
      assert.ok(!decoded.includes("p1000000-"), "Must not contain legacy internal IDs");
      assert.ok(!decoded.includes("a1000000-"), "Must not contain database UUID keys");
    }
  } finally {
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = originalEnv;
  }
});

runTest("4.2: formatNaira converts lowest currency units (kobo/cents) to formatted Naira", () => {
  assert.strictEqual(formatNaira(4850000), "₦48,500.00");
  assert.strictEqual(formatNaira(15000), "₦150.00");
  assert.strictEqual(formatNaira(0), "₦0.00");
});

// ============================================================================
// SUMMARY REPORT
// ============================================================================
console.log("\n================================================================================");
console.log(`TEST RESULTS: ${passed} passed, ${failed} failed (Total: ${passed + failed})`);
console.log("================================================================================\n");

if (failed > 0) {
  process.exit(1);
}
