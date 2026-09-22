/**
 * AUTO CLINIC — CORE TYPE DEFINITIONS
 * Frontend data contracts for Phase 2 scaffold and future backend integration.
 */

export type CurrencyCode = "NGN";

export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "BACKORDER";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  itemCount?: number;
  iconName?: string;
}

export interface ProductSpec {
  label: string;
  value: string;
  isMonospace?: boolean;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  categorySlug: string;
  categoryName: string;
  shortDescription: string;
  priceCents: number; // in lowest currency unit (Kobo / Cents)
  compareAtPriceCents?: number;
  stockStatus: StockStatus;
  stockQuantity?: number;
  featured?: boolean;
  specs: ProductSpec[];
  compatibility?: string[];
  imageUrl?: string;
}

export interface DiagnosticService {
  id: string;
  code: string; // e.g. "DIAG-01"
  name: string;
  slug: string;
  shortSummary: string;
  estimatedDuration: string;
  indicativeFee: string; // "From ₦15,000" or "Custom Quote"
  targetSystems: string[];
  recommendedWhen: string;
}

export interface VehicleEnquiry {
  make: string;
  model: string;
  year: string;
  regOrVin?: string;
  symptoms: string;
  preferredContactMethod: "WHATSAPP" | "PHONE" | "EMAIL";
  customerName: string;
  customerContact: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}
