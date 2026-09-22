/**
 * AUTO CLINIC — CORE TYPE DEFINITIONS & DATA CONTRACTS (PHASE 3)
 * Unified domain models connecting PostgreSQL/Supabase database entities to frontend UI.
 */

export type CurrencyCode = "NGN";

export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "BACKORDER";

export type OrderChannel = "ONLINE_CHECKOUT" | "WHATSAPP" | "IN_STORE";

export type FulfilmentType = "DELIVERY" | "WORKSHOP_PICKUP";

export type OrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "READY_FOR_COLLECTION"
  | "DISPATCHED"
  | "COMPLETED"
  | "CANCELLED";

export type PaymentStatus = "UNPAID" | "PAYMENT_RECEIVED" | "REFUNDED";

export type DiagnosticEnquiryStatus =
  | "PENDING_REVIEW"
  | "CONTACTED"
  | "APPOINTMENT_SCHEDULED"
  | "COMPLETED"
  | "CANCELLED";

export type ContactMethod = "WHATSAPP" | "PHONE" | "EMAIL";

export type AdminRole = "SUPERADMIN" | "STAFF" | "TECHNICIAN";

// -----------------------------------------------------------------------------
// 1. Category Domain Model
// -----------------------------------------------------------------------------
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  parentId?: string | null;
  iconName?: string;
  isActive: boolean;
  displayOrder: number;
  itemCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

// -----------------------------------------------------------------------------
// 2. Product & Inventory Domain Models
// -----------------------------------------------------------------------------
export interface ProductSpec {
  label: string;
  value: string;
  isMonospace?: boolean;
}

export interface ProductImage {
  id: string;
  productId: string;
  imageUrl: string;
  altText: string;
  sortOrder: number;
  isPrimary: boolean;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  shortDescription: string;
  fullDescription?: string;
  priceCents: number; // in lowest currency unit (Kobo: ₦1 = 100 Kobo)
  compareAtPriceCents?: number;
  isActive: boolean;
  isFeatured: boolean;
  stockStatus: StockStatus;
  stockQuantity: number;
  allowBackorder: boolean;
  specs: ProductSpec[];
  compatibility?: string[];
  images?: ProductImage[];
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryRecord {
  id: string;
  productId: string;
  quantityOnHand: number;
  quantityReserved: number;
  lowStockThreshold: number;
  allowBackorder: boolean;
  updatedAt: string;
}

// -----------------------------------------------------------------------------
// 3. Workshop Diagnostics Domain Models
// -----------------------------------------------------------------------------
export interface DiagnosticService {
  id: string;
  code: string; // e.g. "DIAG-ECU-01"
  name: string;
  slug: string;
  shortSummary: string;
  fullDescription?: string;
  estimatedDuration: string;
  indicativeFee: string; // "Enquire for quote"
  targetSystems: string[];
  recommendedWhen: string;
  isActive: boolean;
  displayOrder: number;
  createdAt?: string;
}

export interface DiagnosticEnquiry {
  id: string;
  referenceCode: string;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  customerWhatsapp?: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  vehicleRegOrVin?: string;
  symptoms: string;
  requestedServiceId?: string;
  preferredContactMethod: ContactMethod;
  status: DiagnosticEnquiryStatus;
  staffNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleEnquiryFormValues {
  make: string;
  model: string;
  year: string;
  regOrVin?: string;
  symptoms: string;
  preferredContactMethod: ContactMethod;
  customerName: string;
  customerContact: string;
  requestedServiceId?: string;
}

// -----------------------------------------------------------------------------
// 4. Commerce & Order Domain Models
// -----------------------------------------------------------------------------
export interface Customer {
  id: string;
  authUserId?: string;
  email?: string;
  phone?: string;
  whatsappNumber?: string;
  firstName?: string;
  lastName?: string;
  isGuest: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItemSnapshot {
  id: string;
  orderId: string;
  productId?: string;
  skuSnapshot: string;
  productNameSnapshot: string;
  unitPriceCentsSnapshot: number;
  quantity: number;
  lineTotalCents: number;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  channel: OrderChannel;
  fulfilmentType: FulfilmentType;
  currency: CurrencyCode;
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  shippingAddress?: Record<string, unknown>;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentReference?: string;
  customerNotes?: string;
  items?: OrderItemSnapshot[];
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

// -----------------------------------------------------------------------------
// Helper: Calculate stock status dynamically from inventory numbers
// -----------------------------------------------------------------------------
export function calculateStockStatus(
  quantityOnHand: number,
  quantityReserved: number,
  lowStockThreshold: number,
  allowBackorder: boolean
): StockStatus {
  const available = quantityOnHand - quantityReserved;
  if (available <= 0) {
    return allowBackorder ? "BACKORDER" : "OUT_OF_STOCK";
  }
  if (available <= lowStockThreshold) {
    return "LOW_STOCK";
  }
  return "IN_STOCK";
}
