// ============================================================================
// AUTO CLINIC — DUPLICATE PRODUCT ORDER INTEGRITY & INVENTORY SUITE
// Tests server-side protection against duplicate product ID overselling,
// quantity aggregation limits, stock invariants, and rollback semantics.
// ============================================================================

import assert from "node:assert";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// Bootstrap Node 22 with experimental strip-types and alias loader if not already active
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
// DIRECT IMPORT OF APPLICATION MODULES
// ----------------------------------------------------------------------------
const { validateOrderItemsAndPricing, MAX_QUANTITY_PER_PRODUCT } = await import(
  "../src/lib/services/order-validation.ts"
);
const { createOrderAction } = await import("../src/app/actions/orders.ts");
const { getDevInventoryReservation, resetDevInventoryStore } = await import(
  "../src/lib/services/dev-order-store.ts"
);

console.log("================================================================================");
console.log("AUTO CLINIC — DUPLICATE PRODUCT INTEGRITY & STOCK PROTECTION AUDIT");
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

async function runAsyncTest(description, fn) {
  try {
    await fn();
    console.log(`  ✓ PASS: ${description}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${description}`);
    console.error("   ", err.message || err);
    failed++;
  }
}

// Reset stores before running
resetDevInventoryStore();

// ----------------------------------------------------------------------------
// TEST GROUP 1: Duplicate product IDs exceeding available stock
// ----------------------------------------------------------------------------
console.log("--- TEST GROUP 1: Duplicate Product IDs Exceeding Available Stock ---");

// Product 3 (Industrial 150 PSI Dual-Cylinder Tyre Inflator): stockQuantity = 3
const P3_ID = "a1000000-0000-0000-0000-000000000003";

await runAsyncTest("validateOrderItemsAndPricing rejects duplicate items whose combined quantity exceeds stock", async () => {
  const result = await validateOrderItemsAndPricing([
    { productId: P3_ID, quantity: 2 },
    { productId: P3_ID, quantity: 2 },
  ]);

  assert.strictEqual(result.isValid, false, "Validation must fail");
  assert.ok(
    result.errors.some((e) => e.includes("Insufficient stock") && e.includes("Requested: 4") && e.includes("Available: 3")),
    `Expected Insufficient stock error with Requested: 4, Available: 3. Got: ${JSON.stringify(result.errors)}`
  );
  assert.ok(result.fieldErrors["items[0].stock"], "Field error for stock must be populated");
});

await runAsyncTest("createOrderAction rejects order with duplicate items exceeding stock", async () => {
  resetDevInventoryStore();
  const res = await createOrderAction({
    idempotencyKey: "dup-oversell-" + Date.now(),
    items: [
      { productId: P3_ID, quantity: 2 },
      { productId: P3_ID, quantity: 2 },
    ],
    customer: {
      firstName: "Chidi",
      lastName: "Madu",
      email: "chidi.madu@example.com",
      phone: "08031234567",
    },
    fulfilmentType: "WORKSHOP_PICKUP",
    paymentMethod: "ONLINE_GATEWAY",
  });

  assert.strictEqual(res.success, false, "createOrderAction must reject overselling order");
  assert.ok(
    res.error.includes("cart exceeded available inventory") || res.error.includes("Insufficient stock"),
    `Expected inventory error. Got: ${res.error}`
  );
  // Verify zero inventory reserved
  assert.strictEqual(
    getDevInventoryReservation(P3_ID),
    0,
    "No inventory must be reserved after rejected order"
  );
});

// ----------------------------------------------------------------------------
// TEST GROUP 2: Duplicate product IDs within available stock
// ----------------------------------------------------------------------------
console.log("\n--- TEST GROUP 2: Duplicate Product IDs Within Available Stock ---");

// Product 1 (Auto Clinic Pro-Scan V2 OBD2 Scanner): stockQuantity = 14, price_cents = 4850000
const P1_ID = "a1000000-0000-0000-0000-000000000001";

await runAsyncTest("validateOrderItemsAndPricing consolidates duplicate items within stock into single line item", async () => {
  const result = await validateOrderItemsAndPricing([
    { productId: P1_ID, quantity: 1 },
    { productId: P1_ID, quantity: 2 },
  ]);

  assert.strictEqual(result.isValid, true, "Validation must succeed");
  assert.strictEqual(result.data.items.length, 1, "Duplicate products must be consolidated into 1 item");
  assert.strictEqual(result.data.items[0].quantity, 3, "Consolidated quantity must be 1 + 2 = 3");
  assert.strictEqual(result.data.items[0].lineTotalCents, 4850000 * 3, "Line total must reflect 3 * unit price");
  assert.strictEqual(result.data.subtotalCents, 4850000 * 3, "Subtotal must equal consolidated line total");
  assert.strictEqual(result.data.itemCount, 3, "Total item count must be 3");
});

await runAsyncTest("createOrderAction successfully creates order with consolidated duplicate items", async () => {
  resetDevInventoryStore();
  const res = await createOrderAction({
    idempotencyKey: "dup-valid-" + Date.now(),
    items: [
      { productId: P1_ID, quantity: 1 },
      { productId: P1_ID, quantity: 2 },
    ],
    customer: {
      firstName: "Ngozi",
      lastName: "Eze",
      email: "ngozi.eze@example.com",
      phone: "08051234567",
    },
    fulfilmentType: "WORKSHOP_PICKUP",
    paymentMethod: "WHATSAPP_CONFIRM",
  });

  assert.strictEqual(res.success, true, "createOrderAction must succeed for valid consolidated items");
  assert.strictEqual(res.order.items.length, 1, "Persisted order must contain 1 consolidated item");
  assert.strictEqual(res.order.items[0].quantity, 3, "Persisted item quantity must be 3");
  assert.strictEqual(res.order.subtotalCents, 4850000 * 3, "Persisted subtotal must equal 3 units");
  assert.strictEqual(
    getDevInventoryReservation(P1_ID),
    3,
    "Exactly 3 units must be reserved in inventory"
  );
});

// ----------------------------------------------------------------------------
// TEST GROUP 3: Invalid and Excessive Aggregated Quantities
// ----------------------------------------------------------------------------
console.log("\n--- TEST GROUP 3: Invalid & Excessive Aggregated Quantities ---");

await runAsyncTest("validateOrderItemsAndPricing rejects zero quantity", async () => {
  const result = await validateOrderItemsAndPricing([
    { productId: P1_ID, quantity: 0 },
  ]);
  assert.strictEqual(result.isValid, false, "Validation must fail for quantity 0");
  assert.ok(result.errors.some((e) => e.includes("positive integer")), "Error must cite positive integer");
});

await runAsyncTest("validateOrderItemsAndPricing rejects negative quantity", async () => {
  const result = await validateOrderItemsAndPricing([
    { productId: P1_ID, quantity: -5 },
  ]);
  assert.strictEqual(result.isValid, false, "Validation must fail for negative quantity");
});

await runAsyncTest("validateOrderItemsAndPricing rejects floating point quantity", async () => {
  const result = await validateOrderItemsAndPricing([
    { productId: P1_ID, quantity: 1.5 },
  ]);
  assert.strictEqual(result.isValid, false, "Validation must fail for floating point quantity");
});

await runAsyncTest("validateOrderItemsAndPricing rejects missing or empty productId", async () => {
  const result = await validateOrderItemsAndPricing([
    { productId: "", quantity: 1 },
  ]);
  assert.strictEqual(result.isValid, false, "Validation must fail for empty productId");
});

await runAsyncTest(`validateOrderItemsAndPricing rejects aggregated quantity exceeding limit (${MAX_QUANTITY_PER_PRODUCT})`, async () => {
  const result = await validateOrderItemsAndPricing([
    { productId: P1_ID, quantity: 600 },
    { productId: P1_ID, quantity: 500 },
  ]);
  assert.strictEqual(result.isValid, false, "Validation must fail for combined quantity > 999");
  assert.ok(
    result.errors.some((e) => e.includes("exceeds maximum allowed order limit")),
    `Expected exceeds limit error. Got: ${JSON.stringify(result.errors)}`
  );
});

// ----------------------------------------------------------------------------
// TEST GROUP 4: Ordinary Single-Product and Multi-Product Orders
// ----------------------------------------------------------------------------
console.log("\n--- TEST GROUP 4: Ordinary Single-Product & Multi-Product Orders ---");

// Product 2 (Battery Analyzer): stock = 8, price = 3200000
const P2_ID = "a1000000-0000-0000-0000-000000000002";

await runAsyncTest("Single product order validates and calculates correctly", async () => {
  const result = await validateOrderItemsAndPricing([
    { productId: P2_ID, quantity: 2 },
  ]);
  assert.strictEqual(result.isValid, true, "Validation must succeed");
  assert.strictEqual(result.data.items.length, 1, "Must have 1 item");
  assert.strictEqual(result.data.items[0].quantity, 2, "Quantity must be 2");
  assert.strictEqual(result.data.subtotalCents, 3200000 * 2, "Subtotal must be 2 * 32,000 NGN");
});

await runAsyncTest("Multi-product order validates and calculates correctly", async () => {
  const result = await validateOrderItemsAndPricing([
    { productId: P1_ID, quantity: 1 },
    { productId: P2_ID, quantity: 2 },
  ]);
  assert.strictEqual(result.isValid, true, "Validation must succeed");
  assert.strictEqual(result.data.items.length, 2, "Must have 2 distinct items");
  assert.strictEqual(result.data.itemCount, 3, "Total item count must be 3");
  assert.strictEqual(
    result.data.subtotalCents,
    4850000 + 3200000 * 2,
    "Subtotal must be sum of both line totals"
  );
});

// ----------------------------------------------------------------------------
// TEST GROUP 5: No Duplicate or Excess Inventory Reservation After Failure
// ----------------------------------------------------------------------------
console.log("\n--- TEST GROUP 5: Inventory Rollback on Failure ---");

await runAsyncTest("Failed order causes ZERO inventory reservation", async () => {
  resetDevInventoryStore();
  const initialReservation = getDevInventoryReservation(P3_ID);
  assert.strictEqual(initialReservation, 0, "Initial reservation must be 0");

  // Attempt placing an order that exceeds P3 stock
  const failedOrder = await createOrderAction({
    idempotencyKey: "fail-order-" + Date.now(),
    items: [
      { productId: P3_ID, quantity: 5 }, // available is 3
    ],
    customer: {
      firstName: "Test",
      lastName: "User",
      email: "test.rollback@example.com",
      phone: "08039999999",
    },
    fulfilmentType: "WORKSHOP_PICKUP",
    paymentMethod: "ONLINE_GATEWAY",
  });

  assert.strictEqual(failedOrder.success, false, "Order must fail");
  assert.strictEqual(
    getDevInventoryReservation(P3_ID),
    0,
    "Reservation count must remain exactly 0 after failure"
  );
});

// ----------------------------------------------------------------------------
// TEST GROUP 6: Idempotency Under Replays
// ----------------------------------------------------------------------------
console.log("\n--- TEST GROUP 6: Idempotency Replay Behavior ---");

await runAsyncTest("Duplicate submission with same idempotencyKey returns cached order without double reservation", async () => {
  resetDevInventoryStore();
  const testKey = "idem-key-" + Date.now();

  const payload = {
    idempotencyKey: testKey,
    items: [
      { productId: P1_ID, quantity: 1 },
      { productId: P1_ID, quantity: 1 }, // duplicate entry, combined = 2
    ],
    customer: {
      firstName: "Tunde",
      lastName: "Bakare",
      email: "tunde.bakare@example.com",
      phone: "08071234567",
    },
    fulfilmentType: "WORKSHOP_PICKUP",
    paymentMethod: "ONLINE_GATEWAY",
  };

  const firstCall = await createOrderAction(payload);
  assert.strictEqual(firstCall.success, true, "First submission must succeed");
  assert.strictEqual(
    getDevInventoryReservation(P1_ID),
    2,
    "Reservation must be 2 after first submission"
  );

  const secondCall = await createOrderAction(payload);
  assert.strictEqual(secondCall.success, true, "Second submission must succeed (idempotent replay)");
  assert.strictEqual(
    secondCall.order.orderNumber,
    firstCall.order.orderNumber,
    "Second submission must return identical order number"
  );
  assert.strictEqual(
    getDevInventoryReservation(P1_ID),
    2,
    "Reservation must STILL be exactly 2 (no double reservation on replay)"
  );
});

// ----------------------------------------------------------------------------
// SUMMARY
// ----------------------------------------------------------------------------
console.log("\n================================================================================");
console.log(`TOTAL ASSERTIONS: ${passed} PASSED, ${failed} FAILED`);
console.log("================================================================================");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
