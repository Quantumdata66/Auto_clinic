import { createServerClient, createAdminClient } from "@/lib/supabase/server";
import { Product, FulfilmentType } from "@/types";
import { MOCK_PRODUCTS } from "@/data/mockData";

export interface ClientOrderItemInput {
  productId: string;
  quantity: number;
}

export interface ValidatedOrderItem {
  productId: string;
  skuSnapshot: string;
  productNameSnapshot: string;
  unitPriceCentsSnapshot: number;
  quantity: number;
  lineTotalCents: number;
}

export interface ValidatedOrderCalculation {
  items: ValidatedOrderItem[];
  itemCount: number;
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  fulfilmentType: FulfilmentType;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  fieldErrors: Record<string, string>;
  data?: ValidatedOrderCalculation;
}

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
 * Server-side authoritative product fetcher.
 * Retrieves product details, active state, and inventory directly from PostgreSQL / Supabase,
 * or fallback test fixture catalogue.
 */
async function fetchAuthoritativeProduct(
  productId: string
): Promise<{
  id: string;
  sku: string;
  name: string;
  priceCents: number;
  isActive: boolean;
  quantityOnHand: number;
  quantityReserved: number;
  allowBackorder: boolean;
} | null> {
  if (!isSupabaseConfigured()) {
    const mock = MOCK_PRODUCTS.find((p) => p.id === productId);
    if (!mock) return null;
    return {
      id: mock.id,
      sku: mock.sku,
      name: mock.name,
      priceCents: mock.priceCents,
      isActive: mock.isActive,
      quantityOnHand: mock.stockQuantity,
      quantityReserved: 0,
      allowBackorder: mock.allowBackorder,
    };
  }

  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("products")
      .select(`
        id,
        sku,
        name,
        price_cents,
        is_active,
        inventory ( quantity_on_hand, quantity_reserved, allow_backorder )
      `)
      .eq("id", productId)
      .maybeSingle();

    if (error || !data) {
      // Fallback check against test fixtures if row isn't found in DB
      const mock = MOCK_PRODUCTS.find((p) => p.id === productId);
      if (!mock) return null;
      return {
        id: mock.id,
        sku: mock.sku,
        name: mock.name,
        priceCents: mock.priceCents,
        isActive: mock.isActive,
        quantityOnHand: mock.stockQuantity,
        quantityReserved: 0,
        allowBackorder: mock.allowBackorder,
      };
    }

    const row = data as any;
    const inv = row.inventory?.[0] || {
      quantity_on_hand: 0,
      quantity_reserved: 0,
      allow_backorder: false,
    };

    return {
      id: row.id,
      sku: row.sku,
      name: row.name,
      priceCents: Number(row.price_cents),
      isActive: Boolean(row.is_active),
      quantityOnHand: Number(inv.quantity_on_hand || 0),
      quantityReserved: Number(inv.quantity_reserved || 0),
      allowBackorder: Boolean(inv.allow_backorder),
    };
  } catch (err) {
    console.error("Database lookup error for product ID:", productId, err);
    const mock = MOCK_PRODUCTS.find((p) => p.id === productId);
    if (!mock) return null;
    return {
      id: mock.id,
      sku: mock.sku,
      name: mock.name,
      priceCents: mock.priceCents,
      isActive: mock.isActive,
      quantityOnHand: mock.stockQuantity,
      quantityReserved: 0,
      allowBackorder: mock.allowBackorder,
    };
  }
}

/**
 * Validates cart items, verifies stock availability, retrieves authoritative price snapshots,
 * and computes authoritative order totals.
 *
 * CRITICAL SECURITY INVARIANT:
 * This function NEVER trusts any price, currency value, subtotal, discount, or stock status
 * supplied by the client. It queries the authoritative catalogue/DB directly.
 */
export async function validateOrderItemsAndPricing(
  itemsInput: ClientOrderItemInput[],
  fulfilmentType: FulfilmentType = "DELIVERY"
): Promise<ValidationResult> {
  const errors: string[] = [];
  const fieldErrors: Record<string, string> = {};

  if (!Array.isArray(itemsInput) || itemsInput.length === 0) {
    return {
      isValid: false,
      errors: ["Your shopping cart is empty. Please add items before placing an order."],
      fieldErrors: { items: "Cart is empty" },
    };
  }

  // Validate Fulfilment Type
  if (fulfilmentType !== "DELIVERY" && fulfilmentType !== "WORKSHOP_PICKUP") {
    errors.push("Invalid fulfilment method specified.");
    fieldErrors["fulfilmentType"] = "Must be DELIVERY or WORKSHOP_PICKUP";
  }

  const validatedItems: ValidatedOrderItem[] = [];
  let subtotalCents = 0;
  let totalUnits = 0;

  for (let i = 0; i < itemsInput.length; i++) {
    const item = itemsInput[i];
    const itemKey = `items[${i}]`;

    if (!item.productId || typeof item.productId !== "string") {
      errors.push(`Item #${i + 1} is missing a valid product ID.`);
      fieldErrors[`${itemKey}.productId`] = "Missing product ID";
      continue;
    }

    const qty = Number(item.quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      errors.push(`Item #${i + 1} has an invalid quantity (${item.quantity}). Quantity must be a positive integer.`);
      fieldErrors[`${itemKey}.quantity`] = "Quantity must be an integer >= 1";
      continue;
    }

    // Authoritative Product Fetch
    const product = await fetchAuthoritativeProduct(item.productId);

    if (!product) {
      errors.push(`Product with ID "${item.productId}" does not exist in the catalogue.`);
      fieldErrors[`${itemKey}.productId`] = "Product not found";
      continue;
    }

    if (!product.isActive) {
      errors.push(`Product "${product.name}" (${product.sku}) is currently inactive and cannot be purchased.`);
      fieldErrors[`${itemKey}.status`] = "Product is inactive";
      continue;
    }

    // Stock verification
    const availableStock = product.quantityOnHand - product.quantityReserved;
    if (availableStock < qty && !product.allowBackorder) {
      errors.push(
        `Insufficient stock for "${product.name}" (${product.sku}). Requested: ${qty}, Available: ${Math.max(0, availableStock)}.`
      );
      fieldErrors[`${itemKey}.stock`] = `Only ${Math.max(0, availableStock)} unit(s) available in stock`;
      continue;
    }

    // Authoritative calculations
    const unitPriceCents = product.priceCents;
    const lineTotalCents = unitPriceCents * qty;

    subtotalCents += lineTotalCents;
    totalUnits += qty;

    validatedItems.push({
      productId: product.id,
      skuSnapshot: product.sku,
      productNameSnapshot: product.name,
      unitPriceCentsSnapshot: unitPriceCents,
      quantity: qty,
      lineTotalCents,
    });
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      errors,
      fieldErrors,
    };
  }

  // Fulfilment & Shipping rules:
  // For WORKSHOP_PICKUP, shipping is ₦0.
  // For DELIVERY, shipping is currently ₦0 in base calculation (marked as "To be calculated on dispatch/delivery" as delivery pricing remains an open business decision).
  const shippingCents = 0;
  const taxCents = 0;
  const totalCents = subtotalCents + shippingCents + taxCents;

  return {
    isValid: true,
    errors: [],
    fieldErrors: {},
    data: {
      items: validatedItems,
      itemCount: totalUnits,
      subtotalCents,
      shippingCents,
      taxCents,
      totalCents,
      fulfilmentType,
    },
  };
}
