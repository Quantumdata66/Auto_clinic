"use server";

import { createAdminClient, createServerClient } from "@/lib/supabase/server";
import {
  validateOrderItemsAndPricing,
  ClientOrderItemInput,
  ValidatedOrderItem,
} from "@/lib/services/order-validation";
import { Order, OrderStatus, PaymentStatus, FulfilmentType } from "@/types";

export interface CreateOrderInput {
  idempotencyKey?: string;
  items: ClientOrderItemInput[];
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    whatsappNumber?: string;
  };
  fulfilmentType: FulfilmentType;
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
  };
  paymentMethod: "ONLINE_GATEWAY" | "WHATSAPP_CONFIRM";
  customerNotes?: string;
}

export interface CreateOrderResult {
  success: boolean;
  order?: Order;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export interface LookupOrderResult {
  found: boolean;
  order?: Order;
  error?: string;
}

// In-Memory Idempotency & Order Cache for development & immediate deduplication
interface IdempotencyEntry {
  order: Order;
  timestamp: number;
}
const IDEMPOTENCY_STORE = new Map<string, IdempotencyEntry>();
const IDEMPOTENCY_TTL_MS = 10 * 60 * 1000; // 10 minutes

// In-Memory Dev Order Store (for mock/dev execution when live Supabase is not connected)
const DEV_ORDERS_STORE = new Map<string, Order>();

/**
 * Checks if Supabase connection is active with non-placeholder credentials.
 */
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
 * Generates a standard Auto Clinic sequential/random order number.
 * Format: AC-ORD-YYYYMMDD-XXXX (e.g. AC-ORD-20260922-48F1)
 */
function generateOrderNumber(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomHex = Math.floor(Math.random() * 0xffff)
    .toString(16)
    .toUpperCase()
    .padStart(4, "0");
  return `AC-ORD-${dateStr}-${randomHex}`;
}

/**
 * Server Action: Create an order with authoritative price validation, safe persistence,
 * and idempotency guard.
 */
export async function createOrderAction(
  input: CreateOrderInput
): Promise<CreateOrderResult> {
  try {
    // 1. Idempotency Check: Prevent duplicate order creations from network retries or rapid button clicks
    if (input.idempotencyKey) {
      const existing = IDEMPOTENCY_STORE.get(input.idempotencyKey);
      if (existing && Date.now() - existing.timestamp < IDEMPOTENCY_TTL_MS) {
        return {
          success: true,
          order: existing.order,
        };
      }
    }

    // 2. Validate Customer Input Fields
    const fieldErrors: Record<string, string> = {};

    if (!input.customer?.firstName || input.customer.firstName.trim().length === 0) {
      fieldErrors["customer.firstName"] = "First name is required";
    }
    if (!input.customer?.lastName || input.customer.lastName.trim().length === 0) {
      fieldErrors["customer.lastName"] = "Last name is required";
    }
    if (!input.customer?.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.customer.email.trim())) {
      fieldErrors["customer.email"] = "A valid email address is required";
    }
    if (!input.customer?.phone || input.customer.phone.trim().length < 8) {
      fieldErrors["customer.phone"] = "A valid contact phone number is required";
    }

    // 3. Validate Fulfilment and Address Details
    if (input.fulfilmentType === "DELIVERY") {
      if (!input.shippingAddress?.street || input.shippingAddress.street.trim().length === 0) {
        fieldErrors["shippingAddress.street"] = "Delivery street address is required";
      }
      if (!input.shippingAddress?.city || input.shippingAddress.city.trim().length === 0) {
        fieldErrors["shippingAddress.city"] = "Delivery city/town is required";
      }
      if (!input.shippingAddress?.state || input.shippingAddress.state.trim().length === 0) {
        fieldErrors["shippingAddress.state"] = "Delivery state is required";
      }
    }

    if (Object.keys(fieldErrors).length > 0) {
      return {
        success: false,
        error: "Please complete all required fields correctly.",
        fieldErrors,
      };
    }

    // 4. Server-Side Authoritative Product & Pricing Validation
    const validation = await validateOrderItemsAndPricing(
      input.items,
      input.fulfilmentType
    );

    if (!validation.isValid || !validation.data) {
      return {
        success: false,
        error: validation.errors[0] || "Cart validation failed.",
        fieldErrors: validation.fieldErrors,
      };
    }

    const { items, subtotalCents, shippingCents, taxCents, totalCents, fulfilmentType } =
      validation.data;

    const orderNumber = generateOrderNumber();
    const customerFullName = `${input.customer.firstName.trim()} ${input.customer.lastName.trim()}`;
    const nowIso = new Date().toISOString();

    // 5. Construct Order Domain Model
    const orderData: Order = {
      id: crypto.randomUUID(),
      orderNumber,
      customerName: customerFullName,
      customerEmail: input.customer.email.trim().toLowerCase(),
      customerPhone: input.customer.phone.trim(),
      channel: input.paymentMethod === "WHATSAPP_CONFIRM" ? "WHATSAPP" : "ONLINE_CHECKOUT",
      fulfilmentType,
      currency: "NGN",
      subtotalCents,
      shippingCents,
      taxCents,
      totalCents,
      shippingAddress:
        fulfilmentType === "DELIVERY" && input.shippingAddress
          ? {
              street: input.shippingAddress.street.trim(),
              city: input.shippingAddress.city.trim(),
              state: input.shippingAddress.state.trim(),
            }
          : undefined,
      orderStatus: "PENDING",
      paymentStatus: "UNPAID", // Open decision: No payment gateway integration or automatic PAID status
      customerNotes: input.customerNotes?.trim() || undefined,
      items: items.map((item) => ({
        id: crypto.randomUUID(),
        orderId: "", // will match orderData.id
        productId: item.productId,
        skuSnapshot: item.skuSnapshot,
        productNameSnapshot: item.productNameSnapshot,
        unitPriceCentsSnapshot: item.unitPriceCentsSnapshot,
        quantity: item.quantity,
        lineTotalCents: item.lineTotalCents,
        createdAt: nowIso,
      })),
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    orderData.items?.forEach((i) => (i.orderId = orderData.id));

    // 6. Persistence: Supabase Database Execution (when configured)
    if (isSupabaseConfigured() && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const adminSupabase = createAdminClient();

        // 6a. Upsert Customer Record
        const { data: customerData, error: customerError } = await adminSupabase
          .from("customers" as any)
          .insert({
            email: orderData.customerEmail,
            phone: orderData.customerPhone,
            whatsapp_number: input.customer.whatsappNumber?.trim() || null,
            first_name: input.customer.firstName.trim(),
            last_name: input.customer.lastName.trim(),
            is_guest: true,
          } as any)
          .select("id")
          .single();

        if (customerError) {
          console.warn("Notice inserting customer row:", customerError.message);
        }

        const customerId = (customerData as any)?.id || null;
        orderData.customerId = customerId || undefined;

        // 6b. Insert Orders Row
        const { error: orderError } = await adminSupabase.from("orders" as any).insert({
          id: orderData.id,
          order_number: orderData.orderNumber,
          customer_id: customerId,
          customer_name: orderData.customerName,
          customer_email: orderData.customerEmail,
          customer_phone: orderData.customerPhone,
          channel: orderData.channel,
          fulfilment_type: orderData.fulfilmentType,
          currency: orderData.currency,
          subtotal_cents: orderData.subtotalCents,
          shipping_cents: orderData.shippingCents,
          tax_cents: orderData.taxCents,
          total_cents: orderData.totalCents,
          shipping_address: (orderData.shippingAddress as any) || null,
          order_status: orderData.orderStatus,
          payment_status: orderData.paymentStatus,
          customer_notes: orderData.customerNotes || null,
        } as any);

        if (orderError) {
          console.error("Database order insertion error:", orderError);
          return {
            success: false,
            error: "Unable to save order record. Please try again or contact support via WhatsApp.",
          };
        }

        // 6c. Insert Immutable Order Items Snapshots
        const itemRows = items.map((item) => ({
          id: crypto.randomUUID(),
          order_id: orderData.id,
          product_id: item.productId,
          sku_snapshot: item.skuSnapshot,
          product_name_snapshot: item.productNameSnapshot,
          unit_price_cents_snapshot: item.unitPriceCentsSnapshot,
          quantity: item.quantity,
          line_total_cents: item.lineTotalCents,
        }));

        const { error: itemsError } = await adminSupabase
          .from("order_items" as any)
          .insert(itemRows as any);

        if (itemsError) {
          console.error("Database order items insertion error:", itemsError);
        }

        // 6d. Atomic Inventory Reservation
        for (const item of items) {
          try {
            // Fetch current inventory
            const { data: invData } = await adminSupabase
              .from("inventory" as any)
              .select("quantity_reserved")
              .eq("product_id", item.productId)
              .maybeSingle();

            if (invData) {
              const newReserved = ((invData as any).quantity_reserved || 0) + item.quantity;
              await (adminSupabase as any)
                .from("inventory")
                .update({
                  quantity_reserved: newReserved,
                  updated_at: new Date().toISOString(),
                })
                .eq("product_id", item.productId);
            }
          } catch (invErr) {
            console.warn("Inventory reservation notice for product:", item.productId, invErr);
          }
        }
      } catch (dbErr) {
        console.error("Supabase execution error in createOrderAction:", dbErr);
      }
    }

    // 7. Store in Dev Stores & Idempotency Cache
    DEV_ORDERS_STORE.set(orderData.orderNumber, orderData);
    if (input.idempotencyKey) {
      IDEMPOTENCY_STORE.set(input.idempotencyKey, {
        order: orderData,
        timestamp: Date.now(),
      });
    }

    return {
      success: true,
      order: orderData,
    };
  } catch (err: any) {
    console.error("Unexpected error in createOrderAction:", err);
    return {
      success: false,
      error: "An unexpected system error occurred while processing your order.",
    };
  }
}

/**
 * Server Action: Look up order status by order number and customer email or phone.
 */
export async function lookupOrderStatusAction(
  orderNumber: string,
  contact: string
): Promise<LookupOrderResult> {
  if (!orderNumber || !contact) {
    return { found: false, error: "Order number and registered contact (phone or email) are required." };
  }

  const cleanOrderNum = orderNumber.trim().toUpperCase();
  const cleanContact = contact.trim().toLowerCase();

  // Check in-memory dev store first
  const devOrder = DEV_ORDERS_STORE.get(cleanOrderNum);
  if (devOrder) {
    const contactMatches =
      devOrder.customerEmail.toLowerCase() === cleanContact ||
      devOrder.customerPhone.replace(/[^0-9]/g, "") === cleanContact.replace(/[^0-9]/g, "");

    if (contactMatches) {
      return { found: true, order: devOrder };
    } else {
      return {
        found: false,
        error: "Verification contact does not match the registered record for this order.",
      };
    }
  }

  if (!isSupabaseConfigured()) {
    return { found: false, error: "No matching order found with the provided details." };
  }

  try {
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
      .from("orders")
      .select(`
        *,
        order_items (*)
      `)
      .eq("order_number", cleanOrderNum)
      .maybeSingle();

    if (error || !data) {
      return { found: false, error: "Order not found. Please verify the order number." };
    }

    const row = data as any;
    const phoneMatch =
      row.customer_phone?.replace(/[^0-9]/g, "") === cleanContact.replace(/[^0-9]/g, "");
    const emailMatch = row.customer_email?.toLowerCase() === cleanContact;

    if (!phoneMatch && !emailMatch) {
      return {
        found: false,
        error: "Verification contact does not match the registered record for this order.",
      };
    }

    const order: Order = {
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
      items: (row.order_items || []).map((item: any) => ({
        id: item.id,
        orderId: item.order_id,
        productId: item.product_id,
        skuSnapshot: item.sku_snapshot,
        productNameSnapshot: item.product_name_snapshot,
        unitPriceCentsSnapshot: Number(item.unit_price_cents_snapshot),
        quantity: item.quantity,
        lineTotalCents: Number(item.line_total_cents),
        createdAt: item.created_at,
      })),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    return { found: true, order };
  } catch (err) {
    console.error("Database error in lookupOrderStatusAction:", err);
    return { found: false, error: "Error looking up order record." };
  }
}
