"use server";

import { cookies } from "next/headers";
import {
  createAdminClient,
  createServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import {
  DiagnosticEnquiry,
  DiagnosticEnquiryStatus,
  Order,
  OrderStatus,
  AdminRole,
} from "@/types";
import { MOCK_PRODUCTS } from "@/data/mockData";

export interface StaffSession {
  userId: string;
  email: string;
  name: string;
  role: AdminRole;
  token?: string;
  expiresAt: number;
}

export interface StaffMetadata {
  userId: string;
  email: string;
  name: string;
  role: AdminRole;
}

export interface StaffDashboardResult {
  success: boolean;
  data?: StaffDashboardData;
  staff?: StaffMetadata;
  error?: string;
}

export interface StaffLoginResult {
  success: boolean;
  session?: StaffSession;
  error?: string;
}

export interface StaffDashboardData {
  enquiries: DiagnosticEnquiry[];
  orders: Order[];
  inventoryAlerts: {
    productId: string;
    productName: string;
    sku: string;
    stockQuantity: number;
    lowStockThreshold: number;
    allowBackorder: boolean;
  }[];
  metrics: {
    totalEnquiries: number;
    pendingEnquiries: number;
    totalOrders: number;
    pendingOrders: number;
    lowStockCount: number;
  };
}

/**
 * Validates a staff session using Supabase Auth and queries the admin_roles table
 * for active RBAC authorization (SUPERADMIN, STAFF, TECHNICIAN).
 * Fails closed if token is invalid, user is not found, or role is inactive.
 */
export async function verifyStaffSession(token?: string): Promise<StaffSession | null> {
  let authToken = token;
  if (!authToken) {
    try {
      const cookieStore = await cookies();
      authToken = cookieStore.get("ac_staff_token")?.value;
    } catch {
      // In non-request context (e.g. tests) cookies() may be unavailable
    }
  }

  if (!authToken) {
    return null;
  }

  if (!isSupabaseConfigured()) {
    // Fail closed: Supabase configuration is required for authoritative staff verification
    return null;
  }

  try {
    const supabase = createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authToken);

    if (authError || !user) {
      return null;
    }

    // Verify active role assignment against database admin_roles table
    const adminSupabase = createAdminClient();
    const { data: roleRow, error: roleError } = await (adminSupabase as any)
      .from("admin_roles")
      .select("role, is_active")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (roleError || !roleRow || roleRow.is_active !== true) {
      return null;
    }

    const role = roleRow.role as AdminRole;
    if (!["SUPERADMIN", "STAFF", "TECHNICIAN"].includes(role)) {
      return null;
    }

    const name =
      user.user_metadata?.full_name ||
      (user.email ? user.email.split("@")[0].toUpperCase() + " (Staff)" : "Staff Member");

    return {
      userId: user.id,
      email: user.email || "",
      name,
      role,
      token: authToken,
      expiresAt: Date.now() + 3600 * 1000,
    };
  } catch (err) {
    console.error("Error in verifyStaffSession:", err);
    return null;
  }
}

/**
 * Server Action: Staff Authentication Login using Supabase Auth.
 * Authenticates user credentials with Supabase, verifies active status in admin_roles,
 * and sets a secure HTTP-only session cookie.
 */
export async function staffLoginAction(
  email: string,
  passcode: string
): Promise<StaffLoginResult> {
  if (!email || !passcode) {
    return { success: false, error: "Staff email and password credentials are required." };
  }

  if (!isSupabaseConfigured()) {
    return {
      success: false,
      error:
        "Staff authentication is unavailable: Supabase environment variables are missing or unconfigured. Please configure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    };
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    const supabase = createServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: passcode,
    });

    if (error || !data.session || !data.user) {
      return {
        success: false,
        error: "Invalid staff credentials or authentication failed.",
      };
    }

    // Authoritative verification against admin_roles table
    const adminSupabase = createAdminClient();
    const { data: roleRow, error: roleError } = await (adminSupabase as any)
      .from("admin_roles")
      .select("role, is_active")
      .eq("auth_user_id", data.user.id)
      .maybeSingle();

    if (roleError || !roleRow) {
      return {
        success: false,
        error: "Access denied: This account is not enrolled as an authorized staff member.",
      };
    }

    if (roleRow.is_active !== true) {
      return {
        success: false,
        error: "Access denied: Staff account is currently marked inactive. Please contact system superadmin.",
      };
    }

    const role = roleRow.role as AdminRole;
    if (!["SUPERADMIN", "STAFF", "TECHNICIAN"].includes(role)) {
      return {
        success: false,
        error: "Access denied: Unrecognized staff role configuration.",
      };
    }

    // Set secure HTTP-only cookie
    try {
      const cookieStore = await cookies();
      cookieStore.set("ac_staff_token", data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: data.session.expires_in || 3600,
      });
    } catch (cookieErr) {
      console.warn("Notice setting staff session cookie:", cookieErr);
    }

    const name =
      data.user.user_metadata?.full_name ||
      cleanEmail.split("@")[0].toUpperCase() + " (Staff)";

    return {
      success: true,
      session: {
        userId: data.user.id,
        email: cleanEmail,
        name,
        role,
        expiresAt: Date.now() + (data.session.expires_in || 3600) * 1000,
      },
    };
  } catch (err: any) {
    console.error("Staff login unexpected error:", err);
    return {
      success: false,
      error: "An unexpected error occurred during staff authentication.",
    };
  }
}

/**
 * Server Action: Staff Sign-Out.
 * Hardened Session Revocation:
 * 1. Retrieves current session token and attempts authoritative server-side session
 *    revocation on the Supabase Auth server (terminating refresh tokens & remote session).
 * 2. Guaranteed Cookie Cleanup: Always deletes the HTTP-only cookie regardless of whether
 *    server revocation succeeds, fails, or throws.
 * 3. Information Disclosure Protection: Absorbs errors and always returns { success: true }
 *    without leaking tokens, user IDs, or configuration status.
 */
export async function staffLogoutAction(): Promise<{ success: boolean }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("ac_staff_token")?.value;

    if (token && isSupabaseConfigured()) {
      try {
        const adminSupabase = createAdminClient();
        await adminSupabase.auth.admin.signOut(token);
      } catch {
        // Intentionally absorb server revocation errors (e.g. network partition,
        // missing service key, or already-revoked session) to prevent information
        // disclosure and ensure client cookie removal always executes.
      }
    }

    try {
      cookieStore.delete("ac_staff_token");
    } catch (cookieErr) {
      console.warn("Notice clearing staff session cookie:", cookieErr);
    }
  } catch (err) {
    console.warn("Notice in staff logout handler:", err);
  }

  return { success: true };
}

/**
 * Server Action: Retrieve Protected Staff Dashboard Data.
 * Requires active staff authentication verified against admin_roles.
 */
export async function getStaffDashboardDataAction(
  token?: string
): Promise<StaffDashboardResult> {
  const staff = await verifyStaffSession(token);
  if (!staff) {
    return { success: false, error: "Unauthorized. Active staff session required." };
  }

  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      success: false,
      error: "Supabase database connection is unconfigured. Real credentials are required.",
    };
  }

  try {
    const adminSupabase = createAdminClient();

    const [enqRes, ordRes] = await Promise.all([
      (adminSupabase as any)
        .from("diagnostic_enquiries")
        .select("*")
        .order("created_at", { ascending: false }),
      (adminSupabase as any)
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false }),
    ]);

    let enquiries: DiagnosticEnquiry[] = [];
    let orders: Order[] = [];

    if (enqRes.data) {
      enquiries = (enqRes.data as any[]).map((row) => ({
        id: row.id,
        referenceCode: row.reference_code,
        customerName: row.customer_name,
        customerEmail: row.customer_email,
        customerPhone: row.customer_phone,
        customerWhatsapp: row.customer_whatsapp,
        vehicleMake: row.vehicle_make,
        vehicleModel: row.vehicle_model,
        vehicleYear: row.vehicle_year,
        vehicleRegOrVin: row.vehicle_reg_or_vin,
        symptoms: row.symptoms,
        requestedServiceId: row.requested_service_id,
        preferredContactMethod: row.preferred_contact_method,
        status: row.status,
        staffNotes: row.staff_notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    }

    if (ordRes.data) {
      orders = (ordRes.data as any[]).map((row) => ({
        id: row.id,
        orderNumber: row.order_number,
        customerId: row.customer_id,
        customerName: row.customer_name,
        customerEmail: row.customer_email,
        customerPhone: row.customer_phone,
        channel: row.channel,
        fulfilmentType: row.fulfilment_type,
        currency: row.currency,
        subtotalCents: Number(row.subtotal_cents),
        shippingCents: Number(row.shipping_cents),
        taxCents: Number(row.tax_cents),
        totalCents: Number(row.total_cents),
        shippingAddress: row.shipping_address,
        orderStatus: row.order_status,
        paymentStatus: row.payment_status,
        customerNotes: row.customer_notes,
        items: (row.order_items || []).map((i: any) => ({
          id: i.id,
          orderId: i.order_id,
          productId: i.product_id,
          skuSnapshot: i.sku_snapshot,
          productNameSnapshot: i.product_name_snapshot,
          unitPriceCentsSnapshot: Number(i.unit_price_cents_snapshot),
          quantity: i.quantity,
          lineTotalCents: Number(i.line_total_cents),
          createdAt: i.created_at,
        })),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    }

    // Inventory low stock telemetry
    const inventoryAlerts = MOCK_PRODUCTS.filter((p) => p.stockQuantity <= 5).map((p) => ({
      productId: p.id,
      productName: p.name,
      sku: p.sku,
      stockQuantity: p.stockQuantity,
      lowStockThreshold: 5,
      allowBackorder: p.allowBackorder,
    }));

    const pendingEnquiries = enquiries.filter(
      (e) => e.status === "PENDING_REVIEW" || e.status === "CONTACTED"
    ).length;

    const pendingOrders = orders.filter(
      (o) => o.orderStatus === "PENDING" || o.orderStatus === "PROCESSING"
    ).length;

    return {
      success: true,
      data: {
        enquiries,
        orders,
        inventoryAlerts,
        metrics: {
          totalEnquiries: enquiries.length,
          pendingEnquiries,
          totalOrders: orders.length,
          pendingOrders,
          lowStockCount: inventoryAlerts.length,
        },
      },
      staff: {
        userId: staff.userId,
        email: staff.email,
        name: staff.name,
        role: staff.role,
      },
    };
  } catch (err: any) {
    console.error("Error reading database in getStaffDashboardDataAction:", err);
    return {
      success: false,
      error: "Failed to retrieve dashboard records from database.",
    };
  }
}

/**
 * Server Action: Update Diagnostic Enquiry Status and Staff Internal Notes.
 * Authorized for SUPERADMIN, STAFF, and TECHNICIAN roles.
 */
export async function updateDiagnosticEnquiryAction(
  token: string | undefined,
  enquiryId: string,
  newStatus: DiagnosticEnquiryStatus,
  staffNotes?: string
): Promise<{ success: boolean; error?: string }> {
  const staff = await verifyStaffSession(token);
  if (!staff) {
    return { success: false, error: "Unauthorized. Active staff session required." };
  }

  const validStatuses: DiagnosticEnquiryStatus[] = [
    "PENDING_REVIEW",
    "CONTACTED",
    "APPOINTMENT_SCHEDULED",
    "COMPLETED",
    "CANCELLED",
  ];
  if (!validStatuses.includes(newStatus)) {
    return { success: false, error: "Invalid diagnostic enquiry status value." };
  }

  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      success: false,
      error: "Supabase database service is unconfigured.",
    };
  }

  try {
    const adminSupabase = createAdminClient();
    const { error: dbError } = await (adminSupabase as any)
      .from("diagnostic_enquiries")
      .update({
        status: newStatus,
        staff_notes: staffNotes !== undefined ? staffNotes.trim() : null,
        updated_at: new Date().toISOString(),
      })
      .or(`id.eq.${enquiryId},reference_code.eq.${enquiryId}`);

    if (dbError) {
      console.error("Database error in updateDiagnosticEnquiryAction:", dbError);
      return {
        success: false,
        error: `Database update failed: ${dbError.message}`,
      };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Database update exception in updateDiagnosticEnquiryAction:", err);
    return {
      success: false,
      error: "An unexpected database transaction error occurred.",
    };
  }
}

/**
 * Server Action: Update Order Status & Fulfilment Stage.
 * Role Authorization: Strictly restricted to SUPERADMIN and STAFF roles.
 * TECHNICIAN role is denied commercial order updates.
 */
export async function updateOrderStatusAction(
  token: string | undefined,
  orderId: string,
  newStatus: OrderStatus
): Promise<{ success: boolean; error?: string }> {
  const staff = await verifyStaffSession(token);
  if (!staff) {
    return { success: false, error: "Unauthorized. Active staff session required." };
  }

  // Enforce role-based operational permissions
  if (staff.role === "TECHNICIAN") {
    return {
      success: false,
      error: "Forbidden: Technicians are not authorized to modify commercial order statuses.",
    };
  }

  const validStatuses: OrderStatus[] = [
    "PENDING",
    "PROCESSING",
    "READY_FOR_COLLECTION",
    "DISPATCHED",
    "COMPLETED",
    "CANCELLED",
  ];
  if (!validStatuses.includes(newStatus)) {
    return { success: false, error: "Invalid order status value." };
  }

  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      success: false,
      error: "Supabase database service is unconfigured.",
    };
  }

  try {
    const adminSupabase = createAdminClient();
    const { error: dbError } = await (adminSupabase as any)
      .from("orders")
      .update({
        order_status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .or(`id.eq.${orderId},order_number.eq.${orderId}`);

    if (dbError) {
      console.error("Database error in updateOrderStatusAction:", dbError);
      return {
        success: false,
        error: `Database update failed: ${dbError.message}`,
      };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Database update exception in updateOrderStatusAction:", err);
    return {
      success: false,
      error: "An unexpected database transaction error occurred.",
    };
  }
}
