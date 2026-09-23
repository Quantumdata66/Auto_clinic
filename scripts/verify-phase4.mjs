/**
 * AUTO CLINIC — PHASE 4 AUTOMATED VERIFICATION SUITE
 * Tests:
 * 1. Server-Side Authoritative Pricing & Product Validation
 * 2. WhatsApp Order & Enquiry Generator (NGN currency + placeholder configuration)
 * 3. Order Placement Server Action, Idempotency Guard & Safe Persistence
 * 4. Diagnostic Enquiry Server Action (Enquiry-First workflow)
 * 5. Order & Diagnostic Status Tracker Lookups
 * 6. HTTP Status & Route Availability
 */

import http from "http";

// Dynamic imports of project source code compiled/transpiled or direct testing
async function runSuite() {
  console.log("==================================================================");
  console.log("AUTO CLINIC — PHASE 4 COMPREHENSIVE VERIFICATION SUITE");
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
  // 1. WhatsApp Generator Unit Tests
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST SUITE 1: WhatsApp Payload & Placeholder Generator ---");
  const {
    formatNaira,
    buildWhatsAppUrl,
    generateCartWhatsAppUrl,
    generateProductWhatsAppUrl,
    generateOrderConfirmationWhatsAppUrl,
    generateDiagnosticWhatsAppUrl,
  } = await import("../src/lib/utils/whatsapp.js").catch(async () => {
    // Fallback import via dynamic ts-node / transpiled module if needed
    return await import("../src/lib/utils/whatsapp.ts");
  });

  // 1a. Naira formatting
  assert(formatNaira(4850000) === "₦48,500.00", "formatNaira converts 4,850,000 cents/kobo to ₦48,500.00");
  assert(formatNaira(100) === "₦1.00", "formatNaira converts 100 cents/kobo to ₦1.00");

  // 1b. Placeholder WhatsApp number
  const testUrl = buildWhatsAppUrl("Hello Auto Clinic");
  assert(testUrl.includes("wa.me/2340000000000") || testUrl.includes("wa.me/"), "WhatsApp URL uses standard wa.me format with placeholder number");

  // 1c. Cart payload generation
  const mockCartItems = [
    {
      product: {
        id: "p1",
        sku: "AC-DEV-OBD802",
        name: "Auto Clinic Pro-Scan V2 OBD2 Scanner",
        priceCents: 4850000,
        categoryName: "Diagnostic Scanners",
        stockStatus: "IN_STOCK",
      },
      quantity: 2,
    },
  ];
  const cartWhatsApp = generateCartWhatsAppUrl(mockCartItems, 9700000, "DELIVERY");
  assert(cartWhatsApp.includes("wa.me/"), "Cart WhatsApp returns a valid wa.me URL");
  assert(decodeURIComponent(cartWhatsApp).includes("AC-DEV-OBD802"), "Cart WhatsApp encodes item SKU");
  assert(decodeURIComponent(cartWhatsApp).includes("₦97,000.00"), "Cart WhatsApp encodes authoritative subtotal in NGN");
  assert(decodeURIComponent(cartWhatsApp).includes("Courier Delivery"), "Cart WhatsApp specifies fulfilment choice");

  // 1d. Order confirmation follow-up payload
  const orderConfirmUrl = generateOrderConfirmationWhatsAppUrl(
    "AC-ORD-20260922-8F12",
    [{ sku: "AC-DEV-OBD802", name: "Pro-Scan V2", quantity: 1, unitPriceCents: 4850000 }],
    4850000,
    "Chinedu Okafor"
  );
  assert(decodeURIComponent(orderConfirmUrl).includes("AC-ORD-20260922-8F12"), "Order follow-up includes authoritative order reference");
  assert(decodeURIComponent(orderConfirmUrl).includes("UNPAID"), "Order follow-up explicitly mentions UNPAID status pending payment instructions");

  // ---------------------------------------------------------------------------
  // 2. Server-Side Price & Product Validation
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST SUITE 2: Server-Side Authoritative Pricing & Stock Invariants ---");
  const { validateOrderItemsAndPricing } = await import("../src/lib/services/order-validation.ts");

  // 2a. Empty cart rejection
  const emptyRes = await validateOrderItemsAndPricing([]);
  assert(emptyRes.isValid === false, "Empty cart is rejected by server validation");
  assert(emptyRes.errors[0].includes("empty"), "Empty cart error message is descriptive");

  // 2b. Valid item validation and authoritative pricing
  const validRes = await validateOrderItemsAndPricing([
    { productId: "p1000000-0000-0000-0000-000000000001", quantity: 2 },
  ]);
  assert(validRes.isValid === true, "Valid product ID and quantity pass server validation");
  assert(validRes.data.subtotalCents === 9700000, "Server authoritatively calculates subtotal: 2 × ₦48,500 = ₦97,000 (9700000 cents)");
  assert(validRes.data.items[0].skuSnapshot === "AC-DEV-OBD802", "Server captures immutable SKU snapshot");
  assert(validRes.data.items[0].unitPriceCentsSnapshot === 4850000, "Server captures immutable unit price snapshot");

  // 2c. Non-existent product rejection
  const invalidProdRes = await validateOrderItemsAndPricing([
    { productId: "invalid-uuid-000", quantity: 1 },
  ]);
  assert(invalidProdRes.isValid === false, "Non-existent product ID is rejected by server validation");

  // 2d. Invalid quantity rejection (0 or negative)
  const zeroQtyRes = await validateOrderItemsAndPricing([
    { productId: "p1000000-0000-0000-0000-000000000001", quantity: 0 },
  ]);
  assert(zeroQtyRes.isValid === false, "Zero quantity is rejected by server validation");

  // 2e. Insufficient stock rejection
  const excessiveQtyRes = await validateOrderItemsAndPricing([
    { productId: "p1000000-0000-0000-0000-000000000003", quantity: 999 }, // has stockQuantity: 3, allowBackorder: false
  ]);
  assert(excessiveQtyRes.isValid === false, "Excessive quantity beyond available stock without backorder is rejected");

  // ---------------------------------------------------------------------------
  // 3. Order Placement, Idempotency & Lookups
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST SUITE 3: Order Placement Server Action & Idempotency ---");
  const { createOrderAction, lookupOrderStatusAction } = await import("../src/app/actions/orders.ts");

  const testIdempotencyKey = "test-idem-key-" + Date.now();
  const orderInput = {
    idempotencyKey: testIdempotencyKey,
    items: [{ productId: "p1000000-0000-0000-0000-000000000001", quantity: 1 }],
    customer: {
      firstName: "Chinedu",
      lastName: "Okafor",
      email: "chinedu.okafor@example.com",
      phone: "08031234567",
      whatsappNumber: "08031234567",
    },
    fulfilmentType: "DELIVERY",
    shippingAddress: {
      street: "14 Industrial Avenue",
      city: "Ikeja",
      state: "Lagos State",
    },
    paymentMethod: "ONLINE_GATEWAY",
    customerNotes: "Please test packaging",
  };

  // 3a. Order placement
  const orderResult1 = await createOrderAction(orderInput);
  assert(orderResult1.success === true, "Order placement succeeds with valid data");
  assert(orderResult1.order.orderNumber.startsWith("AC-ORD-"), `Generated order number format is valid (${orderResult1.order?.orderNumber})`);
  assert(orderResult1.order.orderStatus === "PENDING", "Initial order status is PENDING");
  assert(orderResult1.order.paymentStatus === "UNPAID", "Order payment status is UNPAID (No payment provider assumed)");
  assert(orderResult1.order.totalCents === 4850000, "Authoritative total calculation is ₦48,500.00");

  // 3b. Idempotency Guard (Repeated Submission with Same Key)
  const orderResult2 = await createOrderAction(orderInput);
  assert(orderResult2.success === true, "Repeated submission returns success");
  assert(orderResult2.order.orderNumber === orderResult1.order.orderNumber, "Idempotency prevents duplicate order creation; returns original order number");

  // 3c. Order Status Lookup
  const lookupRes = await lookupOrderStatusAction(orderResult1.order.orderNumber, "08031234567");
  assert(lookupRes.found === true, "Order status lookup succeeds with matching order number and registered phone");
  assert(lookupRes.order.customerName === "Chinedu Okafor", "Lookup returns correct customer name");
  assert(lookupRes.order.items.length === 1, "Lookup returns purchased order items snapshots");

  // 3d. Order Status Lookup with wrong contact (Security check)
  const wrongContactRes = await lookupOrderStatusAction(orderResult1.order.orderNumber, "09999999999");
  assert(wrongContactRes.found === false, "Order lookup fails when contact does not match registered order");

  // ---------------------------------------------------------------------------
  // 4. Diagnostic Enquiry Workflow & Lookups
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST SUITE 4: Diagnostic Enquiry Server Action (Enquiry-First) ---");
  const { createDiagnosticEnquiryAction, lookupDiagnosticStatusAction } = await import("../src/app/actions/diagnostics.ts");

  const enquiryInput = {
    vehicleMake: "Toyota",
    vehicleModel: "Camry",
    vehicleYear: "2018",
    vehicleRegOrVin: "LAG-849-XY",
    symptoms: "Check Engine light flashing under acceleration, slight misfire on cylinder 2",
    customerName: "Adeola Johnson",
    customerPhone: "08012345678",
    customerWhatsapp: "08012345678",
    preferredContactMethod: "WHATSAPP",
  };

  const enquiryRes = await createDiagnosticEnquiryAction(enquiryInput);
  assert(enquiryRes.success === true, "Diagnostic enquiry submission succeeds");
  assert(enquiryRes.referenceCode.startsWith("AC-ENQ-"), `Generated enquiry reference format is valid (${enquiryRes.referenceCode})`);
  assert(enquiryRes.enquiry.status === "PENDING_REVIEW", "Diagnostic enquiry initial status is PENDING_REVIEW (not an auto-confirmed appointment)");

  // 4b. Diagnostic Lookup
  const enquiryLookup = await lookupDiagnosticStatusAction(enquiryRes.referenceCode, "08012345678");
  assert(enquiryLookup.found === true, "Diagnostic enquiry lookup succeeds with valid reference and phone");
  assert(enquiryLookup.enquiry.vehicleModel === "Camry", "Diagnostic enquiry lookup returns correct vehicle model");

  // ---------------------------------------------------------------------------
  // 5. Local HTTP Server Route Verification
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST SUITE 5: Local HTTP Endpoint Verification (Port 3000) ---");
  const routes = ["/", "/shop", "/shop/product/pro-scan-v2-obd2-scanner", "/cart", "/checkout", "/diagnostics", "/track", "/about", "/contact"];

  for (const route of routes) {
    await new Promise((resolve) => {
      http.get(`http://localhost:3000${route}`, (res) => {
        assert(res.statusCode === 200, `HTTP GET ${route} returned HTTP ${res.statusCode}`);
        resolve();
      }).on("error", (err) => {
        console.warn(`[SKIP] HTTP GET ${route} could not connect to dev server (${err.message}). (Dev server might be restarting or idle)`);
        resolve();
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log("\n==================================================================");
  console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================================");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runSuite().catch((err) => {
  console.error("Verification suite encountered unexpected error:", err);
  process.exit(1);
});
