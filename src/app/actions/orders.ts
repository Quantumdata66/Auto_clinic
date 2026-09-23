"use server";

import { createAdminClient, createServerClient } from "@/lib/supabase/server";
import {
  validateOrderItemsAndPricing,
  ClientOrderItemInput,
  ValidatedOrderItem,
} from "@/lib/services/order-validation";
import {
  Order,
  OrderStatus,
  PaymentStatus,
  FulfilmentType,
  PublicOrderTrackingView,
  maskCustomerName,
} from "@/types";
import { MOCK_PRODUCTS } from "@/data/mockData";

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
  order?: PublicOrderTrackingView;
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

// In-Memory Dev Inventory Lock Store (tracks live reservations across requests in dev mode)
const DEV_INVENTORY_RESERVATIONS = new Map<string, number>();

// Concurrency mutex lock for simulated transactional execution
let devTransactionLock = Promise.resolve();

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

    // 4. Server-Side Authoritative Product & Pricing Pre-Validation
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
    const orderId = crypto.randomUUID();

    // 5. Construct Order Domain Model
    const orderData: Order = {
      id: orderId,
      orderNumber,
      idempotencyKey: input.idempotencyKey,
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
        orderId: orderId,
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

    // 6. Persistence: Supabase Database Execution (via Atomic Transaction Stored Procedure)
    if (isSupabaseConfigured() && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const adminSupabase = createAdminClient();

        // Call atomic stored procedure: place_order_atomic
        const { data: rpcData, error: rpcError } = await (adminSupabase as any).rpc(
          "place_order_atomic",
          {
            p_order_id: orderData.id,
            p_order_number: orderData.orderNumber,
            p_idempotency_key: input.idempotencyKey || null,
            p_customer_first_name: input.customer.firstName.trim(),
            p_customer_last_name: input.customer.lastName.trim(),
            p_customer_email: orderData.customerEmail,
            p_customer_phone: orderData.customerPhone,
            p_customer_whatsapp: input.customer.whatsappNumber?.trim() || null,
            p_channel: orderData.channel,
            p_fulfilment_type: orderData.fulfilmentType,
            p_currency: orderData.currency,
            p_subtotal_cents: orderData.subtotalCents,
            p_shipping_cents: orderData.shippingCents,
            p_tax_cents: orderData.taxCents,
            p_total_cents: orderData.totalCents,
            p_shipping_address: orderData.shippingAddress || null,
            p_customer_notes: orderData.customerNotes || null,
            p_items: items.map((item) => ({
              productId: item.productId,
              skuSnapshot: item.skuSnapshot,
              productNameSnapshot: item.productNameSnapshot,
              unitPriceCentsSnapshot: item.unitPriceCentsSnapshot,
              quantity: item.quantity,
              lineTotalCents: item.lineTotalCents,
            })),
          }
        );

        if (rpcError) {
          console.error("Atomic order placement RPC error:", rpcError);
          const msg = rpcError.message || "";
          if (msg.includes("INSUFFICIENT_STOCK")) {
            return {
              success: false,
              error: "One or more items in your cart exceeded available inventory during checkout. Please review cart quantities.",
            };
          }
          return {
            success: false,
            error: "Unable to process order transaction. Please try again or reach out on WhatsApp.",
          };
        }
      } catch (dbErr: any) {
        console.error("Supabase execution error in createOrderAction:", dbErr);
        return {
          success: false,
          error: "An unexpected database transaction error occurred.",
        };
      }
    } else {
      // Dev mode serialized execution mutex to simulate transactional row locking
      let releaseMutex: () => void;
      const nextLock = new Promise<void>((resolve) => {
        releaseMutex = resolve;
      });
      const prevLock = devTransactionLock;
      devTransactionLock = nextLock;

      await prevLock;
      try {
        // Atomic Idempotency Check inside locked section
        if (input.idempotencyKey) {
          const existing = IDEMPOTENCY_STORE.get(input.idempotencyKey);
          if (existing && Date.now() - existing.timestamp < IDEMPOTENCY_TTL_MS) {
            return {
              success: true,
              order: existing.order,
            };
          }
        }

        // Re-check inventory with live reservations
        for (const item of items) {
          const mock = MOCK_PRODUCTS.find((p) => p.id === item.productId);
          if (mock) {
            const currentReserved = DEV_INVENTORY_RESERVATIONS.get(item.productId) || 0;
            const available = mock.stockQuantity - currentReserved;
            if (available < item.quantity && !mock.allowBackorder) {
              return {
                success: false,
                error: `Insufficient stock for "${mock.name}". Requested: ${item.quantity}, Remaining available: ${Math.max(0, available)}.`,
              };
            }
          }
        }

        // Apply reservations atomically
        for (const item of items) {
          const currentReserved = DEV_INVENTORY_RESERVATIONS.get(item.productId) || 0;
          DEV_INVENTORY_RESERVATIONS.set(item.productId, currentReserved + item.quantity);
        }

        // Store in Dev Stores & Idempotency Cache before unlocking
        DEV_ORDERS_STORE.set(orderData.orderNumber, orderData);
        if (input.idempotencyKey) {
          IDEMPOTENCY_STORE.set(input.idempotencyKey, {
            order: orderData,
            timestamp: Date.now(),
          });
        }
      } finally {
        releaseMutex!();
      }
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
 * STRICT PRIVACY & DATA PROTECTION INVARIANT:
 * Returns a sanitized PublicOrderTrackingView with masked customer name and NO raw emails/tokens.
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

  // Helper to construct sanitized public projection
  const toPublicProjection = (order: Order): PublicOrderTrackingView => {
    const address = order.shippingAddress as Record<string, string> | undefined;
    const cityOrState = address?.city
      ? `${address.city}${address.state ? `, ${address.state}` : ""}`
      : undefined;

    return {
      orderNumber: order.orderNumber,
      customerNameMasked: maskCustomerName(order.customerName),
      fulfilmentType: order.fulfilmentType,
      currency: order.currency,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      totalCents: order.totalCents,
      createdAt: order.createdAt,
      shippingCityOrState: cityOrState,
      items: (order.items || []).map((item) => ({
        skuSnapshot: item.skuSnapshot,
        productNameSnapshot: item.productNameSnapshot,
        quantity: item.quantity,
        unitPriceCentsSnapshot: item.unitPriceCentsSnapshot,
        lineTotalCents: item.lineTotalCents,
      })),
    };
  };

  // Check in-memory dev store first
  const devOrder = DEV_ORDERS_STORE.get(cleanOrderNum);
  if (devOrder) {
    const contactMatches =
      devOrder.customerEmail.toLowerCase() === cleanContact ||
      devOrder.customerPhone.replace(/[^0-9]/g, "") === cleanContact.replace(/[^0-9]/g, "");

    if (contactMatches) {
      return { found: true, order: toPublicProjection(devOrder) };
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
    const { data, error } = await (adminSupabase as any)
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

    const reconstructedOrder: Order = {
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

    return { found: true, order: toPublicProjection(reconstructedOrder) };
  } catch (err) {
    console.error("Database error in lookupOrderStatusAction:", err);
    return { found: false, error: "Error looking up order record." };
  }
}
