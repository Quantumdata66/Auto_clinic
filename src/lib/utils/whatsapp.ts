import type { Product } from "@/types";
import type { CartItemState } from "@/context/CartContext";

/**
 * AUTO CLINIC — WHATSAPP ORDER & ENQUIRY PAYLOAD GENERATOR
 * Generates formatted, URL-encoded WhatsApp messages for customer-initiated handoffs:
 * - General enquiries & workshop consultations
 * - Diagnostic symptom enquiries & bay arrival coordination
 * - Order follow-up & bank transfer payment confirmations
 * - Cart & individual product enquiries
 *
 * SAFETY INVARIANTS:
 * 1. Customer-initiated handoff only: constructs wa.me links; never sends automatic messages.
 * 2. Unconfigured safety: If NEXT_PUBLIC_WHATSAPP_NUMBER is missing, placeholder ("2340000000000"),
 *    or invalid, isWhatsAppConfigured() evaluates to false and buildWhatsAppUrl() returns undefined.
 *    No fake, placeholder, or invented phone numbers are ever dispatched to external services.
 * 3. Privacy & Security: URLs contain only customer-approved reference codes, masked/provided names,
 *    and order item summaries. No database internal IDs, auth tokens, secrets, or payment credentials
 *    are ever placed in WhatsApp payloads.
 */

export const PLACEHOLDER_WHATSAPP_NUMBER = "2340000000000";

export const DEFAULT_WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || PLACEHOLDER_WHATSAPP_NUMBER;

/**
 * Validates and normalizes an international digits-only WhatsApp business number.
 * Conforms to ITU-T E.164 digits-only format without '+' (typically 10-15 digits).
 * Returns the cleaned digits if valid, or null if unconfigured, placeholder, or malformed.
 */
export function getCleanWhatsAppNumber(rawNumber?: string | null): string | null {
  const num = rawNumber !== undefined ? rawNumber : process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  if (!num || typeof num !== "string") {
    return null;
  }

  const trimmed = num.trim();
  if (
    !trimmed ||
    trimmed === PLACEHOLDER_WHATSAPP_NUMBER ||
    trimmed.toLowerCase().includes("placeholder") ||
    trimmed.toLowerCase().includes("your_")
  ) {
    return null;
  }

  // Strip all non-digit characters
  const digits = trimmed.replace(/\D/g, "");

  // International phone numbers must have between 10 and 15 digits
  if (digits.length < 10 || digits.length > 15) {
    return null;
  }

  // Reject repeating single digits (e.g., 000000000000, 111111111111)
  if (/^(\d)\1+$/.test(digits)) {
    return null;
  }

  return digits;
}

/**
 * Detects if a real, verified business WhatsApp number has been configured.
 */
export function isWhatsAppConfigured(phoneNumber?: string): boolean {
  return getCleanWhatsAppNumber(phoneNumber) !== null;
}

/**
 * Returns a human-readable notice for WhatsApp configuration state.
 */
export function getWhatsAppNotice(): string {
  if (isWhatsAppConfigured()) {
    return "Official Auto Clinic WhatsApp business channel active.";
  }
  return "Notice: Auto Clinic official WhatsApp business channel is pending configuration for staging. Direct messaging will be active once official line credentials are connected.";
}

/**
 * Formats lowest currency units (cents/kobo) to Nigerian Naira string (e.g. ₦48,500.00).
 */
export function formatNaira(priceCents: number): string {
  const naira = priceCents / 100;
  return `₦${naira.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Constructs a wa.me URL with phone number and URL-encoded prefilled message.
 * If number is unconfigured or placeholder, returns undefined so UI can render
 * accessible disabled/informational states instead of navigating to an invalid recipient.
 */
export function buildWhatsAppUrl(
  message: string,
  phoneNumber?: string
): string | undefined {
  const cleanNumber = getCleanWhatsAppNumber(phoneNumber);
  if (!cleanNumber) {
    return undefined;
  }
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}

export interface GeneralEnquiryPayload {
  subject?: string;
  referenceCode?: string;
  customerName?: string;
}

/**
 * Generates a prefilled WhatsApp message for general enquiries and workshop consultations.
 */
export function generateGeneralEnquiryWhatsAppUrl(
  payload?: GeneralEnquiryPayload
): string | undefined {
  let msg = `*AUTO CLINIC — WORKSHOP & STORE ENQUIRY*\n========================================\n\n`;

  if (payload?.referenceCode) {
    msg += `*Reference Code:* ${payload.referenceCode.trim()}\n`;
  }
  if (payload?.customerName) {
    msg += `*Customer:* ${payload.customerName.trim()}\n`;
  }
  if (payload?.subject) {
    msg += `*Subject:* ${payload.subject.trim()}\n\n`;
  } else {
    msg += `*Subject:* General Enquiry & Technical Consultation\n\n`;
  }

  msg += `Hello Auto Clinic, I would like to enquire about your automotive diagnostic services, workshop bookings, and store equipment.`;

  return buildWhatsAppUrl(msg);
}

export interface DiagnosticVehicleInfo {
  make?: string;
  model?: string;
  year?: string;
}

/**
 * Generates a prefilled WhatsApp message for diagnostic enquiries and triage coordination.
 */
export function generateDiagnosticWhatsAppUrl(
  enquiryRef: string,
  vehicle?: DiagnosticVehicleInfo,
  symptoms?: string,
  customerName?: string
): string | undefined {
  let msg =
    `*AUTO CLINIC — WORKSHOP DIAGNOSTIC ENQUIRY*\n` +
    `========================================\n\n` +
    `*Reference Code:* ${enquiryRef.trim()}\n`;

  if (customerName && customerName.trim()) {
    msg += `*Customer:* ${customerName.trim()}\n`;
  }

  const hasVehicle =
    vehicle &&
    vehicle.make &&
    vehicle.make !== "N/A" &&
    vehicle.model &&
    vehicle.model !== "N/A";

  if (hasVehicle) {
    const yearPart = vehicle.year && vehicle.year !== "N/A" ? `${vehicle.year} ` : "";
    msg += `*Vehicle:* ${yearPart}${vehicle.make} ${vehicle.model}\n`;
  }

  if (symptoms && symptoms.trim()) {
    const cleanSymptoms = symptoms.trim();
    // Keep symptom summary concise and URL-friendly (max 200 characters)
    const truncatedSymptoms =
      cleanSymptoms.length > 200 ? `${cleanSymptoms.slice(0, 197)}...` : cleanSymptoms;
    msg += `*Reported Symptoms:* ${truncatedSymptoms}\n`;
  }

  msg += `\nHello Auto Clinic technicians, I have submitted diagnostic enquiry ${enquiryRef.trim()}. I would like to discuss preliminary fault diagnosis and schedule a workshop arrival slot.`;

  return buildWhatsAppUrl(msg);
}

export interface OrderItemSummary {
  sku: string;
  name: string;
  quantity: number;
  unitPriceCents?: number;
}

/**
 * Generates an order confirmation / follow-up message for a placed order.
 */
export function generateOrderConfirmationWhatsAppUrl(
  orderNumber: string,
  items: OrderItemSummary[],
  totalCents: number,
  customerName: string
): string | undefined {
  const itemsSummary =
    items && items.length > 0
      ? items.map((i) => `• ${i.name} (SKU: ${i.sku}) × ${i.quantity}`).join("\n")
      : "• Automotive tools / equipment";

  const msg =
    `*AUTO CLINIC — ORDER FOLLOW-UP*\n` +
    `========================================\n\n` +
    `*Order Reference:* ${orderNumber.trim()}\n` +
    `*Customer:* ${customerName.trim()}\n` +
    `*Total (NGN):* ${formatNaira(totalCents)}\n` +
    `*Payment Status:* UNPAID (Awaiting bank transfer invoice / confirmation)\n\n` +
    `*Items:*\n${itemsSummary}\n\n` +
    `Hello Auto Clinic team, I have placed web order ${orderNumber.trim()}. Please provide payment transfer details and delivery/pickup arrangements.`;

  return buildWhatsAppUrl(msg);
}

/**
 * Reusable alias for order follow-up.
 */
export const generateOrderFollowUpWhatsAppUrl = generateOrderConfirmationWhatsAppUrl;

/**
 * Generates an itemized, structured WhatsApp order message for the current cart contents.
 */
export function generateCartWhatsAppUrl(
  items: CartItemState[],
  subtotalCents: number,
  fulfilmentType: string = "DELIVERY",
  customerNotes?: string
): string | undefined {
  if (!items || items.length === 0) {
    return generateGeneralEnquiryWhatsAppUrl();
  }

  const fulfilmentLabel =
    fulfilmentType === "WORKSHOP_PICKUP"
      ? "Workshop Collection (In-Person Pickup)"
      : "Courier Delivery (Across Nigeria)";

  const itemsList = items
    .map((item, index) => {
      const lineTotal = item.product.priceCents * item.quantity;
      return (
        `${index + 1}. *${item.product.name}*\n` +
        `   • SKU: ${item.product.sku}\n` +
        `   • Qty: ${item.quantity} × ${formatNaira(item.product.priceCents)}\n` +
        `   • Line Total: ${formatNaira(lineTotal)}`
      );
    })
    .join("\n\n");

  let msg =
    `*AUTO CLINIC — DIRECT STORE ORDER ENQUIRY*\n` +
    `========================================\n\n` +
    `*ORDER ITEMS (${items.reduce((acc, i) => acc + i.quantity, 0)} Total Units):*\n\n` +
    `${itemsList}\n\n` +
    `========================================\n` +
    `*ESTIMATED SUBTOTAL:* ${formatNaira(subtotalCents)}\n` +
    `*FULFILMENT CHOICE:* ${fulfilmentLabel}\n` +
    `*DELIVERY FEE:* To be calculated / confirmed by staff\n\n`;

  if (customerNotes && customerNotes.trim()) {
    msg += `*CUSTOMER NOTES:* ${customerNotes.trim()}\n\n`;
  }

  msg += `_Note: Customer-initiated enquiry via Auto Clinic web store._`;

  return buildWhatsAppUrl(msg);
}

/**
 * Generates an order message for a single product from product detail or card.
 */
export function generateProductWhatsAppUrl(
  product: Product,
  quantity: number = 1
): string | undefined {
  const lineTotal = product.priceCents * quantity;
  const msg =
    `*AUTO CLINIC — PRODUCT ENQUIRY & ORDER*\n` +
    `========================================\n\n` +
    `*Product:* ${product.name}\n` +
    `*SKU:* ${product.sku}\n` +
    `*Category:* ${product.categoryName}\n` +
    `*Quantity:* ${quantity}\n` +
    `*Unit Price:* ${formatNaira(product.priceCents)}\n` +
    `*Estimated Total:* ${formatNaira(lineTotal)}\n\n` +
    `*Stock Status:* ${product.stockStatus.replace(/_/g, " ")}\n\n` +
    `Hello Auto Clinic, I would like to purchase/enquire about this item. Please advise on stock availability and fulfilment options across Nigeria.`;

  return buildWhatsAppUrl(msg);
}
