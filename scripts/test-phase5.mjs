/**
 * Auto Clinic — Phase 5 RBAC, Staff Triage, Privacy & Customer Portal Test Suite
 * File: scripts/test-phase5.mjs
 */

import {
  staffLoginAction,
  verifyStaffSession,
  getStaffDashboardDataAction,
  updateDiagnosticEnquiryAction,
  updateOrderStatusAction,
} from "../src/app/actions/staff.ts";

import { lookupCustomerPortalAction } from "../src/app/actions/customer.ts";
import { lookupDiagnosticStatusAction } from "../src/app/actions/diagnostics.ts";
import { lookupOrderStatusAction } from "../src/app/actions/orders.ts";

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

async function runTests() {
  console.log("================================================================================");
  console.log("AUTO CLINIC — PHASE 5 VERIFICATION SUITE (RBAC, STAFF DASHBOARD & PRIVACY)");
  console.log("================================================================================\n");

  // TEST SUITE 1: STAFF AUTHENTICATION
  console.log("[1/4] Testing Staff Authentication & Session Security...");
  
  // 1.1 Valid staff login
  const loginRes = await staffLoginAction("staff@autoclinic.ng", "AutoClinic2026!Staff");
  assert(loginRes.success === true, "Valid staff login succeeds");
  assert(Boolean(loginRes.session?.token), "Staff login returns secure session token");
  assert(loginRes.session?.role === "STAFF", "Correct STAFF role assigned");
  
  // 1.2 Superadmin login role check
  const adminRes = await staffLoginAction("admin@autoclinic.ng", "AutoClinic2026!Staff");
  assert(adminRes.session?.role === "SUPERADMIN", "admin@ email assigned SUPERADMIN role");

  // 1.3 Invalid password rejected
  const badPassRes = await staffLoginAction("staff@autoclinic.ng", "WrongPassword123!");
  assert(badPassRes.success === false, "Invalid passcode is rejected");

  // 1.4 Unauthorized external email rejected
  const badUserRes = await staffLoginAction("hacker@external.com", "WrongPassword");
  assert(badUserRes.success === false, "Unauthorized external user rejected");

  const validToken = loginRes.session.token;

  // TEST SUITE 2: PROTECTED STAFF DASHBOARD & RBAC ENFORCEMENT
  console.log("\n[2/4] Testing Staff Dashboard Authorization & Data Retrieval...");

  // 2.1 Unauthorized request without token
  const unauthDash = await getStaffDashboardDataAction();
  assert(unauthDash.success === false, "Unauthenticated dashboard request rejected");

  // 2.2 Unauthorized request with bogus token
  const bogusDash = await getStaffDashboardDataAction("bogus_token_xyz");
  assert(bogusDash.success === false, "Bogus token dashboard request rejected");

  // 2.3 Authorized staff dashboard data access
  const authDash = await getStaffDashboardDataAction(validToken);
  assert(authDash.success === true, "Authorized staff can load dashboard data");
  assert(Array.isArray(authDash.data?.enquiries), "Dashboard returns diagnostic enquiries queue");
  assert(Array.isArray(authDash.data?.orders), "Dashboard returns order list");
  assert(Array.isArray(authDash.data?.inventoryAlerts), "Dashboard returns inventory alerts telemetry");
  assert(typeof authDash.data?.metrics?.totalEnquiries === "number", "Dashboard returns aggregate metrics");

  // TEST SUITE 3: OPERATIONAL STATUS TRANSITIONS & STAFF NOTES PRIVACY
  console.log("\n[3/4] Testing Operational Updates & Staff Notes Boundary...");

  // 3.1 Valid enquiry status & staff notes update
  const updateEnqRes = await updateDiagnosticEnquiryAction(
    validToken,
    "AC-ENQ-492011",
    "APPOINTMENT_SCHEDULED",
    "Bay 2 assigned for ECU scan. Customer confirmed WhatsApp slot."
  );
  assert(updateEnqRes.success === true, "Staff can update enquiry status and confidential technician notes");

  // 3.2 Unauthorized enquiry update rejected
  const unauthEnqRes = await updateDiagnosticEnquiryAction(
    "invalid_token",
    "AC-ENQ-492011",
    "COMPLETED",
    "Malicious note edit"
  );
  assert(unauthEnqRes.success === false, "Unauthorized update of enquiry is strictly rejected");

  // 3.3 Invalid enquiry status rejected
  const invalidStatusRes = await updateDiagnosticEnquiryAction(
    validToken,
    "AC-ENQ-492011",
    "NON_EXISTENT_STATUS",
    "Note"
  );
  assert(invalidStatusRes.success === false, "Invalid enquiry status value is rejected");

  // 3.4 Valid order fulfilment stage update
  const updateOrdRes = await updateOrderStatusAction(
    validToken,
    "AC-ORD-20260923-88F1",
    "PROCESSING"
  );
  assert(updateOrdRes.success === true, "Staff can update order fulfilment status");

  // 3.5 Unauthorized order update rejected
  const unauthOrdRes = await updateOrderStatusAction(
    "invalid_token",
    "AC-ORD-20260923-88F1",
    "DISPATCHED"
  );
  assert(unauthOrdRes.success === false, "Unauthorized order status update rejected");

  // 3.6 Verify Public Diagnostic Tracking strictly NEVER exposes internal staff_notes
  const publicTracking = await lookupDiagnosticStatusAction("AC-ENQ-492011", "08031234567");
  assert(publicTracking.found === true, "Public diagnostic tracking succeeds by reference code + verification contact");
  assert(publicTracking.enquiry !== undefined, "Enquiry tracking view returned");
  assert(!("staffNotes" in (publicTracking.enquiry || {})), "SECURITY: Public diagnostic tracking projection strictly excludes staff_notes");
  assert(publicTracking.enquiry?.customerNameMasked === "Bamidele K.", "Customer name is masked in public projection");

  // TEST SUITE 4: CUSTOMER PORTAL ACTIVITY LOOKUPS
  console.log("\n[4/4] Testing Customer Portal Unified Lookups & Sanitization...");

  // 4.1 Lookup by customer email
  const portalByEmail = await lookupCustomerPortalAction("bamidele.k@example.com");
  assert(portalByEmail.success === true, "Customer lookup by email succeeds");
  assert(portalByEmail.enquiries.length > 0, "Customer enquiries returned in portal");
  assert(!("staffNotes" in portalByEmail.enquiries[0]), "SECURITY: Customer portal enquiries exclude internal technician notes");

  // 4.2 Lookup by customer phone
  const portalByPhone = await lookupCustomerPortalAction("08031234567");
  assert(portalByPhone.success === true, "Customer lookup by phone number succeeds");
  assert(portalByPhone.enquiries.length > 0, "Associated enquiries found by phone");

  // 4.3 Order lookup by customer
  const portalOrders = await lookupCustomerPortalAction("tunde.bakare@example.com");
  assert(portalOrders.success === true, "Order lookup in customer portal succeeds");
  assert(portalOrders.orders.length > 0, "Orders found for customer");
  assert(portalOrders.orders[0].customerNameMasked === "Tunde B.", "Customer name masked in portal order view");

  // 4.4 Empty lookup rejected
  const emptyLookup = await lookupCustomerPortalAction("");
  assert(emptyLookup.success === false, "Empty lookup query rejected with friendly message");

  console.log("\n================================================================================");
  console.log(`PHASE 5 TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("================================================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution fatal error:", err);
  process.exit(1);
});
