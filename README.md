# Auto Clinic 🔧

> **Production-Grade Automotive Commerce & Workshop Operations Platform**  
> Built with Next.js 16 (App Router), TypeScript, PostgreSQL (Supabase), and atomic database transactions. Features server-side authoritative pricing, idempotency guards, staff role-based access control (RBAC), and concurrency-tested order pipelines.

[![Framework](https://img.shields.io/badge/Framework-Next.js%2016%20%28App%20Router%29-black?style=flat&logo=next.js)](https://nextjs.org/)
[![Language](https://img.shields.io/badge/Language-TypeScript%205-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%20%2F%20Supabase-3ECF8E?style=flat&logo=supabase)](https://supabase.com/)
[![React](https://img.shields.io/badge/Frontend-React%2019-61DAFB?style=flat&logo=react)](https://react.dev/)
[![Styling](https://img.shields.io/badge/Styling-CSS%20Modules%20%2B%20Design%20Tokens-38B2AC)](src/styles/tokens.css)

---

## 1. Project Overview

**Auto Clinic** is a full-stack automotive workshop and diagnostic equipment platform. It bridges consumer-facing e-commerce with operational workshop triage.

Unlike standard e-commerce templates, Auto Clinic is engineered around **transactional integrity, concurrency safety, and privacy boundaries**:
- **Diagnostic Enquiry Pipeline:** Vehicle-first diagnostic booking flow capturing make, model, year, VIN, and symptoms with authoritative reference generation (`AC-ENQ-XXXXXX`).
- **Transactional Parts Store:** Authoritative server-side price recalculation, stock reservation invariants, and atomic order placement (`AC-ORD-YYYYMMDD-XXXX`).
- **Staff Operations Portal (`/admin`):** Protected staff dashboard with Role-Based Access Control (RBAC) for triage management, order tracking, and private technician notes.
- **Privacy-Preserving Public Tracking:** Zero-leakage tracking lookup for orders and diagnostic appointments that strictly omits PII and confidential internal staff notes.

---

## 2. Problem Being Solved

Auto Clinic is designed to address common challenges in transactional automotive commerce systems, including:
1. **Duplicate Submissions:** Network retries and rapid button clicks creating duplicate orders or double-booked diagnostic appointments.
2. **Inventory Race Conditions:** Concurrent checkout requests competing for scarce high-value diagnostic scanners or spare parts without database-level concurrency locks.
3. **Client-Side Price Manipulation:** Unreliable client cart payloads submitting tampered pricing or discount structures.
4. **Unnecessary Exposure of Customer Information:** Public order and booking status lookups inadvertently leaking full customer emails, phone numbers, or private internal mechanic notes to unauthenticated users.

Auto Clinic addresses these challenges directly at the application architecture and database layers.

---

## 3. Key Features

### 🛒 E-Commerce & Parts Catalogue
- **Server-Side Authoritative Pricing:** Client-provided prices are ignored; prices and stock are validated directly against PostgreSQL.
- **Integer Currency Storage:** All prices stored as integer cents/kobo (`BIGINT`) to prevent IEEE 754 floating-point rounding errors.
- **WhatsApp Integration:** Cleanly formatted order and enquiry payloads encoded into WhatsApp links with authoritative pricing and order numbers.

### 🔍 Diagnostic Booking & Service Workflow
- **Diagnostic Packages:** Interactive selection of ECU scans, electrical diagnostics, mechanical inspection, and AC servicing.
- **Vehicle Data Capture:** Structured vehicle metadata validation (Make, Model, Year, VIN/Plate, Symptoms).
- **Public Tracking Portal:** Lookup by reference code and verified contact method with masked name projections (e.g. `"Babajide S."`).

### 🛡️ Operational Staff Portal (`/admin`)
- **Staff Authentication:** Role-gated session management (`SUPERADMIN`, `STAFF`, `TECHNICIAN`).
- **Enquiry Triage Queue:** Filter, review, and transition diagnostic bookings (`PENDING_REVIEW` $\rightarrow$ `CONTACTED` $\rightarrow$ `APPOINTMENT_SCHEDULED` $\rightarrow$ `COMPLETED`).
- **Confidential Technician Notes:** Internal staff notes protected by Row-Level Security (RLS), accessible only to active staff members.
- **Inventory Alerts:** Real-time low-stock telemetry based on configurable thresholds.

---

## 4. System Architecture

Auto Clinic utilizes Next.js App Router with Server Actions to maintain a strict security perimeter:

```text
  ┌────────────────────────────────────────────────────────────────────────┐
  │                         BROWSER / CLIENT LAYER                         │
  │  React 19 Components • Cart Context • CSS Modules & Industrial Tokens  │
  └───────────────────┬────────────────────────────────┬───────────────────┘
                      │ Server Actions (POST)          │ Public Read (SSR)
                      ▼                                ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │                         NEXT.JS SERVER ACTIONS                         │
  │  • orders.ts: Server-side validation, idempotency guard, atomic order  │
  │  • staff.ts: Session authentication, RBAC authorization, triage queue   │
  │  • diagnostics.ts: Reference generation, input validation              │
  │  • customer.ts: Privacy-safe tracking projections                      │
  └───────────────────┬────────────────────────────────────────────────────┘
                      │ Service Role / Stored Procedures
                      ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │                   SUPABASE POSTGRESQL DATABASE LAYER                   │
  │  • Stored Procedure: place_order_atomic() (Row-Level Locking)          │
  │  • Helper Function: is_active_staff() (RLS Security)                   │
  │  • Strict Foreign Keys, Check Constraints & Composite Indexes          │
  └────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Technology Stack

- **Framework:** Next.js 16 (App Router)
- **Frontend:** React 19, Lucide React
- **Language:** TypeScript 5 (Strict Mode)
- **Database:** Supabase / PostgreSQL
- **Security:** PostgreSQL Row-Level Security (RLS) & Stored Procedures
- **Styling:** Vanilla CSS Modules with centralized Design Tokens ([`src/styles/tokens.css`](src/styles/tokens.css))
- **Deployment:** Vercel (Edge CDN & Serverless Actions)

---

## 6. Database Architecture & Schema

The relational schema is managed through versioned SQL migrations in [`supabase/migrations/`](supabase/migrations/):

```text
  categories ────────────< products ──────────< inventory
                                │
                                ├─────────────< product_images
                                │
                                └─────────────< order_items >─────────── orders
                                                                           │
  customers >──────────────────────────────────────────────────────────────┘
      │
      └───────────────────< diagnostic_enquiries

  admin_roles (auth_user_id, role, is_active)
```

### Key Schema Design Decisions:
1. **[`20260922000001_initial_schema.sql`](supabase/migrations/20260922000001_initial_schema.sql):**
   - `categories`, `products`, `product_images`, `inventory`, `diagnostic_services`, `customers`, `diagnostic_enquiries`, `orders`, `order_items`.
   - Explicit `CHECK (price_cents >= 0)` and `CHECK (quantity_on_hand >= 0)` constraints.
2. **[`20260923000001_atomic_order_and_idempotency.sql`](supabase/migrations/20260923000001_atomic_order_and_idempotency.sql):**
   - Adds `idempotency_key VARCHAR(100) UNIQUE` to `orders`.
   - Creates the `place_order_atomic()` PL/pgSQL stored procedure.
3. **[`20260923000002_staff_rbac_and_notes.sql`](supabase/migrations/20260923000002_staff_rbac_and_notes.sql):**
   - Implements `is_active_staff()` helper.
   - Enforces staff-only RLS policies on `diagnostic_enquiries.staff_notes`, order management, and administrative metrics.

---

## 7. Security, Privacy & Role-Based Access Control (RBAC)

### Staff RBAC Roles
- **`SUPERADMIN`:** Full access to manage staff roles, system configuration, inventory, and orders.
- **`STAFF`:** Access to enquiry triage, order processing, and customer communications.
- **`TECHNICIAN`:** Read-write access to vehicle diagnostics and internal technical notes.

### Privacy-Preserving Public Tracking Invariant
Public tracking lookups (`lookupOrderStatusAction` and `lookupDiagnosticStatusAction`) enforce strict data redaction:
- Customer names are masked (e.g., `"Chinedu Okafor"` $\rightarrow$ `"Chinedu O."`).
- Raw email addresses, phone numbers, and internal database UUIDs are **strictly omitted**.
- **Internal technician notes (`staff_notes`) are never exposed in public tracking endpoints.**

---

## 8. Transaction & Idempotency Design

### The `place_order_atomic` Stored Procedure
To ensure the order workflow executes as a single ACID transaction and prevent partial-write states, order creation executes inside a single database transaction:

```sql
-- 1. Check Idempotency Key
SELECT * INTO v_existing_order FROM orders WHERE idempotency_key = p_idempotency_key;
IF FOUND THEN
  RETURN jsonb_build_object('success', true, 'order_id', v_existing_order.id, 'is_idempotent_replay', true);
END IF;

-- 2. Lock Inventory Rows Deterministically
FOR v_item IN SELECT value FROM jsonb_array_elements(p_items) ORDER BY (value->>'productId') LOOP
  SELECT quantity_on_hand, quantity_reserved INTO v_inv_on_hand, v_inv_reserved
  FROM inventory WHERE product_id = v_product_id FOR UPDATE;

  -- 3. Stock Invariant Check
  IF (v_inv_on_hand - v_inv_reserved) < v_qty AND v_allow_backorder IS NOT TRUE THEN
    RAISE EXCEPTION 'INSUFFICIENT_STOCK: Insufficient stock for product %', v_product_id;
  END IF;
END LOOP;

-- 4. Atomic Insert of Customer, Order, Order Items & Stock Decrement
```

### Idempotency Replay Safety
If a user rapidly clicks "Place Order" or a network retry resends the payload with the same `idempotencyKey`, the server detects the key, skips re-insertion, and returns the existing order details safely without duplicate charges or duplicate stock deductions.

---

## 9. Concurrency Considerations & Deadlock Prevention

1. **Deterministic Lock Ordering:** In `place_order_atomic()`, inventory rows are locked using `ORDER BY productId`. This eliminates deadlocks when two concurrent checkouts contain the same products in different sequences.
2. **Row-Level `SELECT ... FOR UPDATE`:** Prevents concurrent race conditions where two simultaneous transactions both observe stock available before either commits.
3. **In-Memory Concurrency Mutex (`devTransactionLock`):** Serializes development-mode simulated transactions when executing without an active Supabase instance.

---

## 10. Testing & Automated Verification Suites

Auto Clinic includes three automated test suites in [`scripts/`](scripts/):

```bash
# 1. Verify Phase 4: Server Price Validation & WhatsApp Payloads
node scripts/verify-phase4.mjs

# 2. Verify Phase 5: RBAC, Staff Triage & Privacy Projections
node scripts/test-phase5.mjs

# 3. Verify Concurrency, Idempotency & Security Invariants
node scripts/test-concurrency-and-security.mjs
```

### Test Coverage Highlights:
- **Concurrency & Overselling:** Launches 5 simultaneous checkout requests competing for inventory to verify zero overselling.
- **Idempotency Races:** Sends 5 parallel requests with identical `idempotencyKey` to confirm all return identical successful order references with only 1 database insert.
- **Privacy Sanitization:** Asserts that customer emails, phones, and technician notes are completely absent from public tracking queries.
- **RBAC Enforcement:** Verifies that unauthenticated or tampered staff tokens are rejected with HTTP 401/403 equivalents.

---

## 11. Local Setup & Installation

### Prerequisites
- **Node.js** 18+ (Node 20 or 22 recommended)
- **npm**

### 1. Clone Repository
```bash
git clone https://github.com/Quantumdata66/Auto_clinic.git
cd Auto_clinic
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy the example environment template:
```bash
cp .env.example .env.local
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

### 5. Run Verification Scripts
```bash
npm run typecheck
node scripts/test-concurrency-and-security.mjs
```

---

## 12. Environment Variables Reference

See [`.env.example`](.env.example) for the complete list:

| Variable | Scope | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SITE_URL` | Public | Base canonical URL of the application. |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project REST API endpoint. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase anonymous public key (restricted by RLS). |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server Only** | Supabase service role secret (bypasses RLS for migrations/atomic orders). |
| `ADMIN_JWT_SECRET` | **Server Only** | Secret key for staff session signing and authentication. |

---

## 13. Deployment Guide

### Vercel Deployment
1. Connect your repository to [Vercel](https://vercel.com/).
2. In Project Settings $\rightarrow$ Environment Variables, configure:
   - `NEXT_PUBLIC_SITE_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_JWT_SECRET`
3. Deploy! Vercel will execute `npm run build` and route server actions seamlessly.

### Database Setup
Execute the migration scripts in order in your Supabase SQL Editor:
1. `supabase/migrations/20260922000001_initial_schema.sql`
2. `supabase/migrations/20260923000001_atomic_order_and_idempotency.sql`
3. `supabase/migrations/20260923000002_staff_rbac_and_notes.sql`
4. *(Optional)* `supabase/seed.sql` for initial product and diagnostic package data.

---

## 14. Key User Routes & Pages

- 🏠 **Home (`/`):** Workshop overview, featured diagnostic tools, and booking CTA.
- 🛍️ **Shop (`/shop`, `/shop/[category]`, `/shop/product/[slug]`):** Catalogue with category filtering, specifications, stock badges, and cart triggers.
- 🩺 **Diagnostics (`/diagnostics`):** Interactive diagnostic service selector and vehicle symptom submission form.
- 📦 **Cart & Checkout (`/cart`, `/checkout`):** Authoritative price calculator, delivery selection, and idempotency-guarded checkout.
- 🔍 **Tracking Portal (`/track`):** Unified tracking interface for order status and diagnostic bookings.
- 🔐 **Staff Operations Portal (`/admin`):** Authenticated operational dashboard for enquiry triage, order fulfillment, and low-stock telemetry.

---

## 15. Future Improvements

- **Integrated Payment Gateways:** Direct webhook integration for Paystack / Stripe alongside WhatsApp confirmation workflows.
- **Automated SMS/Email Notifications:** Real-time customer status updates via Twilio or Resend when enquiry triage status advances.
- **Multi-Branch Inventory Routing:** Inventory reservation routing across distinct regional physical workshop locations.

---

## 16. Project Structure

```text
auto-clinic/
├── public/                             # Static SVG icons and assets
├── scripts/                            # Verification and security test suites
│   ├── test-concurrency-and-security.mjs # Concurrency & privacy audit tests
│   ├── test-phase5.mjs                 # Staff RBAC & triage queue tests
│   └── verify-phase4.mjs               # Authoritative pricing & WhatsApp tests
├── src/
│   ├── app/                            # Next.js App Router pages & server actions
│   │   ├── actions/                    # Server Actions (orders, staff, diagnostics, customer)
│   │   ├── admin/                      # Staff operations portal
│   │   ├── cart/                       # Cart page
│   │   ├── checkout/                   # Checkout flow
│   │   ├── diagnostics/                # Diagnostics booking page
│   │   ├── shop/                       # E-commerce store & category pages
│   │   ├── track/                      # Public tracking portal
│   │   ├── layout.tsx                  # Root layout with Cart Provider
│   │   └── page.tsx                    # Landing page
│   ├── components/                     # Modular UI & domain components
│   │   ├── commerce/                   # Cart triggers, product cards, stock badges
│   │   ├── layout/                     # Header, footer, navigation
│   │   ├── ui/                         # Buttons, badges, modals, inputs
│   │   └── workshop/                   # Diagnostic forms, vehicle info fields
│   ├── context/                        # React Context providers (CartContext)
│   ├── data/                           # Mock product & diagnostic service fixtures
│   ├── lib/
│   │   ├── services/                   # Catalogue & order validation services
│   │   ├── supabase/                   # Client & Server Supabase factories, types
│   │   └── utils/                      # WhatsApp URL generator, currency formatters
│   ├── styles/                         # Centralized design tokens (tokens.css)
│   └── types/                          # Strict TypeScript domain interfaces
├── supabase/
│   ├── migrations/                     # Versioned PostgreSQL DDL & stored procedures
│   └── seed.sql                        # Initial catalog & diagnostic fixtures
├── .env.example                        # Environment variables template
├── next.config.ts                      # Next.js configuration
├── package.json                        # Project dependencies and scripts
└── tsconfig.json                       # TypeScript compiler configuration
```
