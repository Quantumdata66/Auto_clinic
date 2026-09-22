-- ============================================================================
-- AUTO CLINIC — INITIAL SUPABASE POSTGRESQL SCHEMA (PHASE 3)
-- Relational schema with Row Level Security (RLS) for Automotive Store & Workshop
-- ============================================================================

-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. CATEGORIES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  icon_name VARCHAR(100),
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);

-- ----------------------------------------------------------------------------
-- 2. PRODUCTS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  short_description TEXT NOT NULL,
  full_description TEXT,
  price_cents BIGINT NOT NULL CHECK (price_cents >= 0),
  compare_at_price_cents BIGINT CHECK (compare_at_price_cents IS NULL OR compare_at_price_cents >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  specs JSONB NOT NULL DEFAULT '[]'::jsonb,
  compatibility JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);

-- ----------------------------------------------------------------------------
-- 3. PRODUCT IMAGES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text VARCHAR(255) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_sort_order ON product_images(sort_order);

-- ----------------------------------------------------------------------------
-- 4. INVENTORY TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
  quantity_on_hand INTEGER NOT NULL DEFAULT 0 CHECK (quantity_on_hand >= 0),
  quantity_reserved INTEGER NOT NULL DEFAULT 0 CHECK (quantity_reserved >= 0),
  low_stock_threshold INTEGER NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0),
  allow_backorder BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON inventory(product_id);

-- ----------------------------------------------------------------------------
-- 5. DIAGNOSTIC SERVICES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS diagnostic_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  short_summary TEXT NOT NULL,
  full_description TEXT,
  estimated_duration VARCHAR(100) NOT NULL,
  indicative_fee VARCHAR(100) NOT NULL DEFAULT 'Enquire for quote',
  target_systems JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommended_when TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_diagnostic_services_slug ON diagnostic_services(slug);
CREATE INDEX IF NOT EXISTS idx_diagnostic_services_is_active ON diagnostic_services(is_active);

-- ----------------------------------------------------------------------------
-- 6. CUSTOMERS TABLE (Guest & Optional Account Workflow)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE, -- Reserved for future Supabase Auth linking
  email VARCHAR(255),
  phone VARCHAR(50),
  whatsapp_number VARCHAR(50),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  is_guest BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_auth_user_id ON customers(auth_user_id);

-- ----------------------------------------------------------------------------
-- 7. ORDERS TABLE (Foundation Schema)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(100) NOT NULL UNIQUE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  channel VARCHAR(50) NOT NULL DEFAULT 'ONLINE_CHECKOUT', -- ONLINE_CHECKOUT, WHATSAPP, IN_STORE
  fulfilment_type VARCHAR(50) NOT NULL DEFAULT 'DELIVERY', -- DELIVERY, WORKSHOP_PICKUP
  currency VARCHAR(10) NOT NULL DEFAULT 'NGN',
  subtotal_cents BIGINT NOT NULL CHECK (subtotal_cents >= 0),
  shipping_cents BIGINT NOT NULL DEFAULT 0 CHECK (shipping_cents >= 0),
  tax_cents BIGINT NOT NULL DEFAULT 0 CHECK (tax_cents >= 0),
  total_cents BIGINT NOT NULL CHECK (total_cents >= 0),
  shipping_address JSONB,
  order_status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, PROCESSING, READY_FOR_COLLECTION, DISPATCHED, COMPLETED, CANCELLED
  payment_status VARCHAR(50) NOT NULL DEFAULT 'UNPAID', -- UNPAID, PAYMENT_RECEIVED, REFUNDED
  payment_reference VARCHAR(255),
  customer_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- ----------------------------------------------------------------------------
-- 8. ORDER ITEMS TABLE (Immutable Purchase Snapshots)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  sku_snapshot VARCHAR(100) NOT NULL,
  product_name_snapshot VARCHAR(255) NOT NULL,
  unit_price_cents_snapshot BIGINT NOT NULL CHECK (unit_price_cents_snapshot >= 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  line_total_cents BIGINT NOT NULL CHECK (line_total_cents >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- ----------------------------------------------------------------------------
-- 9. DIAGNOSTIC ENQUIRIES TABLE (Enquiry-First Workflow)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS diagnostic_enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code VARCHAR(100) NOT NULL UNIQUE,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50) NOT NULL,
  customer_whatsapp VARCHAR(50),
  vehicle_make VARCHAR(100) NOT NULL,
  vehicle_model VARCHAR(100) NOT NULL,
  vehicle_year VARCHAR(10) NOT NULL,
  vehicle_reg_or_vin VARCHAR(100),
  symptoms TEXT NOT NULL,
  requested_service_id UUID REFERENCES diagnostic_services(id) ON DELETE SET NULL,
  preferred_contact_method VARCHAR(50) NOT NULL DEFAULT 'WHATSAPP', -- WHATSAPP, PHONE, EMAIL
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING_REVIEW', -- PENDING_REVIEW, CONTACTED, APPOINTMENT_SCHEDULED, COMPLETED, CANCELLED
  staff_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_diagnostic_enquiries_ref ON diagnostic_enquiries(reference_code);
CREATE INDEX IF NOT EXISTS idx_diagnostic_enquiries_status ON diagnostic_enquiries(status);
CREATE INDEX IF NOT EXISTS idx_diagnostic_enquiries_created ON diagnostic_enquiries(created_at);

-- ----------------------------------------------------------------------------
-- 10. ADMIN ROLES TABLE (Application-Level RBAC without custom password store)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL UNIQUE,
  role VARCHAR(50) NOT NULL DEFAULT 'STAFF', -- SUPERADMIN, STAFF, TECHNICIAN
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_roles_auth_user ON admin_roles(auth_user_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;

-- 1. Public Read Policies (Published Storefront Data Only)
CREATE POLICY "Public can view active categories"
  ON categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Public can view active products"
  ON products FOR SELECT
  USING (is_active = true);

CREATE POLICY "Public can view images for active products"
  ON product_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_images.product_id
      AND p.is_active = true
    )
  );

CREATE POLICY "Public can view inventory for active products"
  ON inventory FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = inventory.product_id
      AND p.is_active = true
    )
  );

CREATE POLICY "Public can view active diagnostic services"
  ON diagnostic_services FOR SELECT
  USING (is_active = true);

-- 2. Sensitive Tables (No Anon Public SELECT Access)
-- Customers, Orders, Order Items, Diagnostic Enquiries, and Admin Roles
-- are inaccessible to anon SELECT queries by default.
-- Elevated reads/writes occur strictly via Server Actions/Service Role backend layer.
