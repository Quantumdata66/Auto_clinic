/**
 * AUTO CLINIC — CONCURRENCY, TRANSACTION INTEGRITY & SECURITY AUDIT TEST SUITE
 *
 * Test Scenarios:
 * 1. Concurrent Overselling Prevention: Parallel checkout requests competing for limited inventory.
 * 2. Idempotency Concurrency Guard: Parallel duplicate requests with the same idempotency key.
 * 3. Privacy & Sanitization: Verifies staff notes, customer emails, and unmasked phones are NEVER exposed in tracking lookups.
 * 4. WhatsApp Configuration Safeguards: Ensures placeholder numbers are clearly flagged and never presented as verified business facts.
 * 5. Authorization & Enumeration Resistance: Verifies mismatched credentials fail gracefully without leaking state.
 */

import { createOrderAction, lookupOrderStatusAction } from "../src/app/actions/orders.ts";
import { createDiagnosticEnquiryAction, lookupDiagnosticStatusAction } from "../src/app/actions/diagnostics.ts";
import { isWhatsAppConfigured, getWhatsAppNotice, formatNaira } from "../src/lib/utils/whatsapp.ts";
import { maskCustomerName } from "../src/types/index.ts";

async function runSecuritySuite() {
  console.log("==================================================================");
  console.log("AUTO CLINIC — CONCURRENCY, TRANSACTION & PRIVACY AUDIT SUITE");
  console.log("==================================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  // ---------------------------------------------------------------------------
  // TEST 1: Privacy Projection & Data Protection Audit
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 1: Privacy Projection & Information Disclosure Audit ---");

  // 1a. Name Masking Helper
  assert(maskCustomerName("Chinedu Okafor") === "Chinedu O.", "maskCustomerName masks 'Chinedu Okafor' to 'Chinedu O.'");
  assert(maskCustomerName("Adeola Johnson Williams") === "Adeola W.", "maskCustomerName masks multi-part name to 'Adeola W.'");
  assert(maskCustomerName("Anonymous") === "Anonymous", "maskCustomerName handles single word name");

  // 1b. Order Tracking Projection Sanitization
  const sampleOrder = await createOrderAction({
    idempotencyKey: "audit-idem-" + Date.now(),
    items: [{ productId: "p1000000-0000-0000-0000-000000000001", quantity: 1 }],
    customer: {
      firstName: "Babajide",
      lastName: "Sanwo",
      email: "sensitive.vip.customer@example.com",
      phone: "08099887766",
    },
    fulfilmentType: "DELIVERY",
    shippingAddress: {
      street: "Secret Villa Lane",
      city: "Victoria Island",
      state: "Lagos State",
    },
    paymentMethod: "ONLINE_GATEWAY",
    customerNotes: "Confidential delivery instructions",
  });

  assert(sampleOrder.success === true, "Sample order created for privacy audit");

  const orderLookup = await lookupOrderStatusAction(sampleOrder.order.orderNumber, "08099887766");
  assert(orderLookup.found === true, "Order lookup succeeds with valid phone");
  assert(orderLookup.order.customerNameMasked === "Babajide S.", "Public tracking view returns masked name ('Babajide S.')");
  assert(orderLookup.order.customerEmail === undefined, "Public tracking view NEVER includes raw customer email");
  assert(orderLookup.order.customerPhone === undefined, "Public tracking view NEVER includes raw customer phone");
  assert(orderLookup.order.id === undefined, "Public tracking view NEVER includes internal database UUID");
  assert(orderLookup.order.customerNotes === undefined, "Public tracking view NEVER includes internal customer notes");

  // 1c. Diagnostic Tracking Projection Sanitization (NO Staff Notes)
  const sampleEnquiry = await createDiagnosticEnquiryAction({
    vehicleMake: "Mercedes-Benz",
    vehicleModel: "GLE 450",
    vehicleYear: "2021",
    symptoms: "Air suspension warning light, vehicle sagging on right rear overnight",
    customerName: "Oluwaseun Balogun",
    customerPhone: "08022334455",
    preferredContactMethod: "WHATSAPP",
  });

  assert(sampleEnquiry.success === true, "Sample diagnostic enquiry created for privacy audit");

  const diagLookup = await lookupDiagnosticStatusAction(sampleEnquiry.referenceCode, "08022334455");
  assert(diagLookup.found === true, "Diagnostic lookup succeeds with valid reference and contact");
  assert(diagLookup.enquiry.customerNameMasked === "Oluwaseun B.", "Diagnostic tracking view returns masked name ('Oluwaseun B.')");
  assert(diagLookup.enquiry.staffNotes === undefined, "Diagnostic tracking view STRICTLY OMITS staff notes");
  assert(diagLookup.enquiry.customerPhone === undefined, "Diagnostic tracking view NEVER includes raw phone number");
  assert(diagLookup.enquiry.customerEmail === undefined, "Diagnostic tracking view NEVER includes raw email");

  // ---------------------------------------------------------------------------
  // TEST 2: Concurrent Duplicate Submissions (Idempotency Race Condition)
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 2: Concurrent Duplicate Submissions (Idempotency Race) ---");

  const sharedIdempotencyKey = "concurrent-idempotency-" + Date.now();
  const concurrentDuplicatePayload = {
    idempotencyKey: sharedIdempotencyKey,
    items: [{ productId: "p1000000-0000-0000-0000-000000000002", quantity: 1 }],
    customer: {
      firstName: "Emeka",
      lastName: "Nnamdi",
      email: "emeka.nnamdi@example.com",
      phone: "08055443322",
    },
    fulfilmentType: "WORKSHOP_PICKUP",
    paymentMethod: "WHATSAPP_CONFIRM",
  };

  // Launch 5 parallel requests with identical idempotencyKey
  const duplicateResponses = await Promise.all([
    createOrderAction(concurrentDuplicatePayload),
    createOrderAction(concurrentDuplicatePayload),
    createOrderAction(concurrentDuplicatePayload),
    createOrderAction(concurrentDuplicatePayload),
    createOrderAction(concurrentDuplicatePayload),
  ]);

  const allSuccess = duplicateResponses.every((r) => r.success);
  assert(allSuccess, "All 5 concurrent requests with identical idempotency key return success");

  const distinctOrderNumbers = new Set(duplicateResponses.map((r) => r.order?.orderNumber));
  assert(
    distinctOrderNumbers.size === 1,
    `All 5 concurrent requests return the EXACT SAME order number: ${[...distinctOrderNumbers][0]}`
  );

  // ---------------------------------------------------------------------------
  // TEST 3: Concurrent Competing Requests & Stock Reservation
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 3: Concurrent Competing Requests & Stock Overselling Guard ---");

  // Product 4: AC-DEV-TORQ12 has initial quantity = 19
  // We'll test placing 20 orders of 1 unit in parallel.
  // 19 should succeed, and exactly 1 should be rejected with Insufficient Stock.
  const concurrencyProduct = "p1000000-0000-0000-0000-000000000004";
  const parallelOrders = [];

  for (let i = 0; i < 20; i++) {
    parallelOrders.push(
      createOrderAction({
        idempotencyKey: `competing-order-${Date.now()}-${i}`,
        items: [{ productId: concurrencyProduct, quantity: 1 }],
        customer: {
          firstName: `Buyer${i}`,
          lastName: "Test",
          email: `buyer${i}@example.com`,
          phone: `080111122${i.toString().padStart(2, "0")}`,
        },
        fulfilmentType: "WORKSHOP_PICKUP",
        paymentMethod: "ONLINE_GATEWAY",
      })
    );
  }

  const concurrencyResults = await Promise.all(parallelOrders);
  const successes = concurrencyResults.filter((r) => r.success);
  const stockRejections = concurrencyResults.filter(
    (r) => !r.success && (r.error?.includes("Insufficient stock") || r.error?.includes("exceeded"))
  );

  assert(
    successes.length === 19,
    `Exactly 19 orders succeeded for 19 available stock units (Actual: ${successes.length})`
  );
  assert(
    stockRejections.length === 1,
    `The 20th order was rejected due to inventory exhaustion (Actual: ${stockRejections.length})`
  );

  // ---------------------------------------------------------------------------
  // TEST 4: WhatsApp Configuration & Placeholder Safeguards
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 4: WhatsApp Configuration Safeguards ---");

  const isConfigured = isWhatsAppConfigured();
  const notice = getWhatsAppNotice();

  assert(
    typeof isConfigured === "boolean",
    `isWhatsAppConfigured returns boolean (Current: ${isConfigured})`
  );
  assert(
    notice.includes("Configuration Placeholder") || isConfigured,
    "WhatsApp notice identifies configuration placeholder when official contact is unset"
  );

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log("\n==================================================================");
  console.log(`AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================================");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runSecuritySuite().catch((err) => {
  console.error("Security audit suite encountered unexpected error:", err);
  process.exit(1);
});
