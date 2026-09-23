"use server";

import { createAdminClient, createServerClient } from "@/lib/supabase/server";
import {
  DiagnosticEnquiry,
  DiagnosticEnquiryStatus,
  Order,
  OrderStatus,
  AdminRole,
  InventoryRecord,
} from "@/types";
import { MOCK_PRODUCTS, MOCK_CATEGORIES } from "@/data/mockData";

export interface StaffSession {
  userId: string;
  email: string;
  name: string;
  role: AdminRole;
  token: string;
  expiresAt: number;
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

// In-Memory Dev Staff Sessions
const DEV_STAFF_SESSIONS = new Map<string, StaffSession>();
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

// Mock data fixtures for dev mode triage when Supabase is not connected
const DEV_STAFF_ENQUIRIES: DiagnosticEnquiry[] = [
  {
    id: "e1000000-0000-0000-0000-000000000001",
    referenceCode: "AC-ENQ-492011",
    customerName: "Bamidele Kolawole",
    customerEmail: "bamidele.k@example.com",
    customerPhone: "08031234567",
    customerWhatsapp: "08031234567",
    vehicleMake: "Toyota",
    vehicleModel: "Camry",
    vehicleYear: "2017",
    vehicleRegOrVin: "LAG-782-AB",
    symptoms: "Check Engine light illuminated, harsh downshift from 3rd to 2nd gear when hot.",
    preferredContactMethod: "WHATSAPP",
    status: "PENDING_REVIEW",
    staffNotes: "ECU scan required. Possible solenoid B pressure sensor fault.",
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: "e1000000-0000-0000-0000-000000000002",
    referenceCode: "AC-ENQ-492012",
    customerName: "Emeka Nnamdi",
    customerEmail: "emeka.n@example.com",
    customerPhone: "08129876543",
    customerWhatsapp: "08129876543",
    vehicleMake: "Mercedes-Benz",
    vehicleModel: "C300",
    vehicleYear: "2019",
    vehicleRegOrVin: "ABJ-319-XY",
    symptoms: "Battery dying overnight. Keyless-Go module staying awake.",
    preferredContactMethod: "PHONE",
    status: "CONTACTED",
    staffNotes: "Spoke with customer. Scheduled for parasitic drain testing at workshop bay 2.",
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
];

const DEV_STAFF_ORDERS: Order[] = [
  {
    id: "o1000000-0000-0000-0000-000000000001",
    orderNumber: "AC-ORD-20260923-88F1",
    customerName: "Tunde Bakare",
    customerEmail: "tunde.bakare@example.com",
    customerPhone: "08023456789",
    channel: "ONLINE_CHECKOUT",
    fulfilmentType: "DELIVERY",
    currency: "NGN",
    subtotalCents: 4850000,
    shippingCents: 0,
    taxCents: 0,
    totalCents: 4850000,
    shippingAddress: {
      street: "22 Adeola Odeku St",
      city: "Victoria Island",
      state: "Lagos State",
    },
    orderStatus: "PENDING",
    paymentStatus: "UNPAID",
    customerNotes: "Please test scanner before dispatch.",
    items: [
      {
        id: "oi-1",
        orderId: "o1000000-0000-0000-0000-000000000001",
        productId: "p1000000-0000-0000-0000-000000000001",
        skuSnapshot: "AC-DEV-OBD802",
        productNameSnapshot: "Auto Clinic Pro-Scan V2 OBD2 Scanner",
        unitPriceCentsSnapshot: 4850000,
        quantity: 1,
        lineTotalCents: 4850000,
        createdAt: new Date().toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
];

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
    key &&
    !url.includes("placeholder") &&
    !key.includes("placeholder")
  );
}

/**
 * Validates a staff session token.
 */
export async function verifyStaffSession(token?: string): Promise<StaffSession | null> {
  if (!token) return null;

  const session = DEV_STAFF_SESSIONS.get(token);
  if (!session) return null;

  if (Date.now() > session.expiresAt) {
    DEV_STAFF_SESSIONS.delete(token);
    return null;
  }

  return session;
}

/**
 * Server Action: Staff Authentication Login.
 */
export async function staffLoginAction(
  email: string,
  passcode: string
): Promise<StaffLoginResult> {
  if (!email || !passcode) {
    return { success: false, error: "Staff email and access credentials are required." };
  }

  const cleanEmail = email.trim().toLowerCase();

  const isAuthorizedStaffEmail =
    cleanEmail.endsWith("@autoclinic.ng") ||
    cleanEmail === "staff@autoclinic.ng" ||
    cleanEmail === "admin@autoclinic.ng" ||
    cleanEmail === "technician@autoclinic.ng";

  const isCorrectPasscode = passcode === "AutoClinic2026!Staff";

  if (!isAuthorizedStaffEmail || !isCorrectPasscode) {
    return {
      success: false,
      error: "Invalid staff credentials or unauthorized account.",
    };
  }

  let role: AdminRole = "STAFF";
  if (cleanEmail.includes("admin")) role = "SUPERADMIN";
  if (cleanEmail.includes("tech")) role = "TECHNICIAN";

  const sessionToken = "ac_staff_" + crypto.randomUUID();
  const session: StaffSession = {
    userId: crypto.randomUUID(),
    email: cleanEmail,
    name: cleanEmail.split("@")[0].toUpperCase() + " (Staff)",
    role,
    token: sessionToken,
    expiresAt: Date.now() + SESSION_TTL_MS,
  };

  DEV_STAFF_SESSIONS.set(sessionToken, session);

  return {
    success: true,
    session,
  };
}

/**
 * Server Action: Retrieve Protected Staff Dashboard Data.
 */
export async function getStaffDashboardDataAction(
  token?: string
): Promise<{ success: boolean; data?: StaffDashboardData; error?: string }> {
  const staff = await verifyStaffSession(token);
  if (!staff) {
    return { success: false, error: "Unauthorized. Active staff session required." };
  }

  let enquiries: DiagnosticEnquiry[] = [...DEV_STAFF_ENQUIRIES];
  let orders: Order[] = [...DEV_STAFF_ORDERS];

  if (isSupabaseConfigured() && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const adminSupabase = createAdminClient();

      const [enqRes, ordRes] = await Promise.all([
        (adminSupabase as any).from("diagnostic_enquiries").select("*").order("created_at", { ascending: false }),
        (adminSupabase as any).from("orders").select("*, order_items(*)").order("created_at", { ascending: false }),
      ]);

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
    } catch (err) {
      console.warn("Notice reading database in getStaffDashboardDataAction:", err);
    }
  }

  // Inventory Alerts: Products where stockQuantity <= 5
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
  };
}

/**
 * Server Action: Update Diagnostic Enquiry Status and Staff Internal Notes.
 */
export async function updateDiagnosticEnquiryAction(
  token: string,
  enquiryId: string,
  newStatus: DiagnosticEnquiryStatus,
  staffNotes?: string
): Promise<{ success: boolean; error?: string }> {
  const staff = await verifyStaffSession(token);
  if (!staff) {
    return { success: false, error: "Unauthorized. Staff session required." };
  }

  // Validate allowed status transitions
  const validStatuses: DiagnosticEnquiryStatus[] = [
    "PENDING_REVIEW",
    "CONTACTED",
    "APPOINTMENT_SCHEDULED",
    "COMPLETED",
    "CANCELLED",
  ];
  if (!validStatuses.includes(newStatus)) {
    return { success: false, error: "Invalid diagnostic enquiry status." };
  }

  // Update in memory dev store
  const enq = DEV_STAFF_ENQUIRIES.find((e) => e.id === enquiryId || e.referenceCode === enquiryId);
  if (enq) {
    enq.status = newStatus;
    if (staffNotes !== undefined) {
      enq.staffNotes = staffNotes.trim();
    }
    enq.updatedAt = new Date().toISOString();
  }

  if (isSupabaseConfigured() && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const adminSupabase = createAdminClient();
      await (adminSupabase as any)
        .from("diagnostic_enquiries")
        .update({
          status: newStatus,
          staff_notes: staffNotes !== undefined ? staffNotes.trim() : null,
          updated_at: new Date().toISOString(),
        })
        .or(`id.eq.${enquiryId},reference_code.eq.${enquiryId}`);
    } catch (err) {
      console.error("Database update error in updateDiagnosticEnquiryAction:", err);
    }
  }

  return { success: true };
}

/**
 * Server Action: Update Order Status & Fulfilment Stage.
 */
export async function updateOrderStatusAction(
  token: string,
  orderId: string,
  newStatus: OrderStatus
): Promise<{ success: boolean; error?: string }> {
  const staff = await verifyStaffSession(token);
  if (!staff) {
    return { success: false, error: "Unauthorized. Staff session required." };
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

  // Update in memory dev store
  const order = DEV_STAFF_ORDERS.find((o) => o.id === orderId || o.orderNumber === orderId);
  if (order) {
    order.orderStatus = newStatus;
    order.updatedAt = new Date().toISOString();
  }

  if (isSupabaseConfigured() && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const adminSupabase = createAdminClient();
      await (adminSupabase as any)
        .from("orders")
        .update({
          order_status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .or(`id.eq.${orderId},order_number.eq.${orderId}`);
    } catch (err) {
      console.error("Database update error in updateOrderStatusAction:", err);
    }
  }

  return { success: true };
}
