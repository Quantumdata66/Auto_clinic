import { Product } from "@/types";
import { CartItemState } from "@/context/CartContext";

/**
 * AUTO CLINIC — WHATSAPP ORDER & ENQUIRY PAYLOAD GENERATOR
 * Generates formatted, URL-encoded WhatsApp messages for carts, individual items,
 * and diagnostic enquiries.
 *
 * NOTE: The business WhatsApp number uses a clearly designated configuration placeholder
 * (NEXT_PUBLIC_WHATSAPP_NUMBER or default "2340000000000") until verified business
 * contact details are formally supplied.
 */

export const DEFAULT_WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "2340000000000";

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
 * Constructs a wa.me URL with phone number and encoded message.
 */
export function buildWhatsAppUrl(
  message: string,
  phoneNumber: string = DEFAULT_WHATSAPP_NUMBER
): string {
  const cleanNumber = phoneNumber.replace(/[^0-9]/g, "");
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}

/**
 * Generates an itemized, structured WhatsApp order message for the current cart contents.
 */
export function generateCartWhatsAppUrl(
  items: CartItemState[],
  subtotalCents: number,
  fulfilmentType: string = "DELIVERY",
  customerNotes?: string
): string {
  if (!items || items.length === 0) {
    const emptyMsg =
      `*AUTO CLINIC — STORE ENQUIRY*\n\n` +
      `Hello Auto Clinic, I would like to enquire about your automotive tools, scanners, and workshop diagnostic services.`;
    return buildWhatsAppUrl(emptyMsg);
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

  msg +=
    `_Note: Order submitted via Auto Clinic web store. Please confirm equipment availability, delivery quote, and bank invoice details._`;

  return buildWhatsAppUrl(msg);
}

/**
 * Generates an order message for a single product from product detail or card.
 */
export function generateProductWhatsAppUrl(
  product: Product,
  quantity: number = 1
): string {
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

/**
 * Generates a WhatsApp follow-up link for an already placed web order.
 */
export function generateOrderConfirmationWhatsAppUrl(
  orderNumber: string,
  items: { sku: string; name: string; quantity: number; unitPriceCents: number }[],
  totalCents: number,
  customerName: string
): string {
  const itemsSummary = items
    .map((i) => `• ${i.name} (SKU: ${i.sku}) × ${i.quantity}`)
    .join("\n");

  const msg =
    `*AUTO CLINIC — ORDER CONFIRMATION FOLLOW-UP*\n` +
    `========================================\n\n` +
    `*Order Reference:* ${orderNumber}\n` +
    `*Customer Name:* ${customerName}\n` +
    `*Total (NGN):* ${formatNaira(totalCents)}\n` +
    `*Payment Status:* UNPAID (Awaiting bank transfer / invoice)\n\n` +
    `*Items:*\n${itemsSummary}\n\n` +
    `Hello Auto Clinic team, I have placed web order ${orderNumber}. Please provide payment/transfer details and delivery arrangements.`;

  return buildWhatsAppUrl(msg);
}

/**
 * Generates a WhatsApp message for a diagnostic enquiry follow-up.
 */
export function generateDiagnosticWhatsAppUrl(
  enquiryRef: string,
  vehicle: { make: string; model: string; year: string },
  symptoms: string,
  customerName: string
): string {
  const msg =
    `*AUTO CLINIC — WORKSHOP DIAGNOSTIC ENQUIRY*\n` +
    `========================================\n\n` +
    `*Reference Code:* ${enquiryRef}\n` +
    `*Customer:* ${customerName}\n` +
    `*Vehicle:* ${vehicle.year} ${vehicle.make} ${vehicle.model}\n` +
    `*Reported Symptoms:* ${symptoms}\n\n` +
    `Hello Auto Clinic technicians, I have submitted diagnostic enquiry ${enquiryRef}. I would like to discuss the symptoms and arrange a suitable workshop bay arrival slot.`;

  return buildWhatsAppUrl(msg);
}
