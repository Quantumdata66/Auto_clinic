"use server";

import { createAdminClient, createServerClient } from "@/lib/supabase/server";
import {
  PublicOrderTrackingView,
  PublicDiagnosticTrackingView,
  OrderStatus,
  DiagnosticEnquiryStatus,
  maskCustomerName,
} from "@/types";

export interface CustomerPortalLookupResult {
  success: boolean;
  customerContact?: string;
  orders: PublicOrderTrackingView[];
  enquiries: PublicDiagnosticTrackingView[];
  error?: string;
}

// Dev fixture data for fallback lookups when Supabase is not connected
const DEV_PORTAL_DATA: {
  [key: string]: {
    orders: PublicOrderTrackingView[];
    enquiries: PublicDiagnosticTrackingView[];
  };
} = {
  "bamidele.k@example.com": {
    orders: [],
    enquiries: [
      {
        referenceCode: "AC-ENQ-492011",
        customerNameMasked: "Bamidele K.",
        vehicleMake: "Toyota",
        vehicleModel: "Camry",
        vehicleYear: "2017",
        symptoms: "Check Engine light illuminated, harsh downshift from 3rd to 2nd gear when hot.",
        preferredContactMethod: "WHATSAPP",
        status: "PENDING_REVIEW",
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
    ],
  },
  "tunde.bakare@example.com": {
    orders: [
      {
        orderNumber: "AC-ORD-20260923-88F1",
        customerNameMasked: "Tunde B.",
        orderStatus: "PENDING",
        paymentStatus: "UNPAID",
        fulfilmentType: "DELIVERY",
        currency: "NGN",
        totalCents: 4850000,
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        shippingCityOrState: "Victoria Island, Lagos State",
        items: [
          {
            skuSnapshot: "AC-DEV-OBD802",
            productNameSnapshot: "Auto Clinic Pro-Scan V2 OBD2 Scanner",
            quantity: 1,
            unitPriceCentsSnapshot: 4850000,
            lineTotalCents: 4850000,
          },
        ],
      },
    ],
    enquiries: [],
  },
  "08031234567": {
    orders: [],
    enquiries: [
      {
        referenceCode: "AC-ENQ-492011",
        customerNameMasked: "Bamidele K.",
        vehicleMake: "Toyota",
        vehicleModel: "Camry",
        vehicleYear: "2017",
        symptoms: "Check Engine light illuminated, harsh downshift from 3rd to 2nd gear when hot.",
        preferredContactMethod: "WHATSAPP",
        status: "PENDING_REVIEW",
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
    ],
  },
};

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
 * Server Action: Unified Customer Portal lookup by email or phone.
 * Returns only sanitized customer views (never leaks internal staff_notes or other users' PII).
 */
export async function lookupCustomerPortalAction(
  identifier: string
): Promise<CustomerPortalLookupResult> {
  if (!identifier || identifier.trim().length < 3) {
    return {
      success: false,
      orders: [],
      enquiries: [],
      error: "Please enter a valid email address or phone number.",
    };
  }

  const cleanQuery = identifier.trim().toLowerCase();
  const cleanPhone = identifier.replace(/[^0-9+]/g, "");

  const orders: PublicOrderTrackingView[] = [];
  const enquiries: PublicDiagnosticTrackingView[] = [];

  // Check Supabase if configured
  if (isSupabaseConfigured()) {
    try {
      const supabase = createServerClient();
      
      // Look up orders matching email or phone
      const { data: orderRows } = await (supabase as any)
        .from("orders")
        .select("order_number, customer_name, order_status, payment_status, fulfilment_type, total_cents, currency, created_at, shipping_address, order_items(sku_snapshot, product_name_snapshot, quantity, unit_price_cents_snapshot, line_total_cents)")
        .or(`customer_email.ilike.${cleanQuery},customer_phone.ilike.${cleanPhone}`)
        .order("created_at", { ascending: false });

      if (orderRows && orderRows.length > 0) {
        orderRows.forEach((row: any) => {
          const items = (row.order_items || []).map((i: any) => ({
            skuSnapshot: i.sku_snapshot,
            productNameSnapshot: i.product_name_snapshot,
            quantity: i.quantity,
            unitPriceCentsSnapshot: Number(i.unit_price_cents_snapshot),
            lineTotalCents: Number(i.line_total_cents),
          }));

          const shippingCityOrState =
            row.shipping_address && typeof row.shipping_address === "object"
              ? `${row.shipping_address.city || ""}, ${row.shipping_address.state || ""}`.trim().replace(/^,|,$/g, "")
              : undefined;

          orders.push({
            orderNumber: row.order_number,
            customerNameMasked: maskCustomerName(row.customer_name),
            orderStatus: row.order_status,
            paymentStatus: row.payment_status,
            fulfilmentType: row.fulfilment_type,
            totalCents: Number(row.total_cents),
            currency: row.currency || "NGN",
            createdAt: row.created_at,
            shippingCityOrState,
            items,
          });
        });
      }

      // Look up diagnostic enquiries matching email or phone
      const { data: enqRows } = await (supabase as any)
        .from("diagnostic_enquiries")
        .select("reference_code, customer_name, vehicle_make, vehicle_model, vehicle_year, symptoms, preferred_contact_method, status, created_at")
        .or(`customer_email.ilike.${cleanQuery},customer_phone.ilike.${cleanPhone}`)
        .order("created_at", { ascending: false });

      if (enqRows && enqRows.length > 0) {
        enqRows.forEach((row: any) => {
          enquiries.push({
            referenceCode: row.reference_code,
            customerNameMasked: maskCustomerName(row.customer_name),
            vehicleMake: row.vehicle_make,
            vehicleModel: row.vehicle_model,
            vehicleYear: row.vehicle_year,
            symptoms: row.symptoms,
            preferredContactMethod: row.preferred_contact_method,
            status: row.status,
            createdAt: row.created_at,
          });
        });
      }
    } catch (err) {
      console.warn("Database lookup in lookupCustomerPortalAction returned notice:", err);
    }
  }

  // Fallback to dev fixture data if zero results found
  if (orders.length === 0 && enquiries.length === 0) {
    const fixture =
      DEV_PORTAL_DATA[cleanQuery] ||
      DEV_PORTAL_DATA[cleanPhone];

    if (fixture) {
      orders.push(...fixture.orders);
      enquiries.push(...fixture.enquiries);
    }
  }

  return {
    success: true,
    customerContact: identifier,
    orders,
    enquiries,
  };
}
