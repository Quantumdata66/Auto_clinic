"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Truck,
  Store,
  CreditCard,
  MessageCircle,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Package,
  RefreshCw,
} from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Input } from "@/components/ui/Input";
import { RadioGroup } from "@/components/ui/Radio";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PriceDisplay } from "@/components/commerce/PriceDisplay";
import { Toast } from "@/components/ui/Toast";
import { Badge } from "@/components/ui/Badge";
import { useCart } from "@/context/CartContext";
import { createOrderAction } from "@/app/actions/orders";
import { generateOrderConfirmationWhatsAppUrl } from "@/lib/utils/whatsapp";
import { Order, FulfilmentType } from "@/types";

export default function CheckoutPage() {
  const { items, subtotalCents, clearCart, isHydrated } = useCart();

  // Form State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");

  const [fulfilmentType, setFulfilmentType] = useState<FulfilmentType>("DELIVERY");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  const [paymentMethod, setPaymentMethod] = useState<"ONLINE_GATEWAY" | "WHATSAPP_CONFIRM">("ONLINE_GATEWAY");
  const [customerNotes, setCustomerNotes] = useState("");

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string>("");

  // Initialize unique idempotency key for this checkout session
  useEffect(() => {
    setIdempotencyKey(crypto.randomUUID());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    if (items.length === 0) {
      setErrorMessage("Your cart is empty. Please add items before placing an order.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        idempotencyKey,
        items: items.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
        })),
        customer: {
          firstName,
          lastName,
          email,
          phone,
          whatsappNumber: whatsappNumber || phone,
        },
        fulfilmentType,
        shippingAddress:
          fulfilmentType === "DELIVERY"
            ? { street, city, state }
            : undefined,
        paymentMethod,
        customerNotes,
      };

      const result = await createOrderAction(payload);

      if (!result.success || !result.order) {
        setErrorMessage(result.error || "Failed to place order. Please review your entries.");
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        setIsSubmitting(false);
        return;
      }

      // Order created successfully
      setCompletedOrder(result.order);
      clearCart();
    } catch (err: any) {
      console.error("Order submission error:", err);
      setErrorMessage("A network error occurred while submitting your order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isHydrated) {
    return (
      <PageContainer
        title="Secure Order Checkout"
        subtitle="Complete your order for delivery across Nigeria or workshop collection."
        breadcrumbs={[{ label: "Shopping Cart", href: "/cart" }, { label: "Checkout" }]}
        maxWidth="wide"
      >
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "240px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--ac-space-3)", color: "var(--ac-text-muted)" }}>
            <RefreshCw size={20} className="ac-spin" />
            <span className="ac-mono" style={{ fontSize: "var(--ac-text-sm)" }}>
              PREPARING CHECKOUT SECURE CONTEXT...
            </span>
          </div>
        </div>
      </PageContainer>
    );
  }

  // If order was successfully completed
  if (completedOrder) {
    const whatsappFollowupUrl = generateOrderConfirmationWhatsAppUrl(
      completedOrder.orderNumber,
      (completedOrder.items || []).map((i) => ({
        sku: i.skuSnapshot,
        name: i.productNameSnapshot,
        quantity: i.quantity,
        unitPriceCents: i.unitPriceCentsSnapshot,
      })),
      completedOrder.totalCents,
      completedOrder.customerName
    );

    return (
      <PageContainer
        title="Order Placement Confirmation"
        subtitle="Your order has been recorded authoritatively in the Auto Clinic system."
        breadcrumbs={[{ label: "Store", href: "/shop" }, { label: "Order Receipt" }]}
        maxWidth="default"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--ac-space-6)" }}>
          <Toast
            type="success"
            title="ORDER PLACED SUCCESSFULLY"
            message={`Order Reference: ${completedOrder.orderNumber}. We have recorded your items and customer details.`}
          />

          {/* Unpaid Order Notice */}
          <div
            style={{
              backgroundColor: "rgba(255, 179, 0, 0.08)",
              border: "1px solid var(--ac-accent-amber)",
              padding: "var(--ac-space-4)",
              display: "flex",
              gap: "var(--ac-space-3)",
              alignItems: "flex-start",
            }}
          >
            <AlertCircle size={20} style={{ color: "var(--ac-accent-amber)", flexShrink: 0, marginTop: "2px" }} />
            <div style={{ fontSize: "var(--ac-text-xs)", color: "var(--ac-text-primary)", lineHeight: 1.5 }}>
              <strong>Payment Status: {completedOrder.paymentStatus} (Pending Gateway Selection)</strong>
              <p style={{ margin: "4px 0 0 0", color: "var(--ac-text-secondary)" }}>
                Online payment provider integration remains undecided. Your order is registered in our system and stock has been reserved. Auto Clinic staff will contact you via WhatsApp or phone with invoice and direct Nigerian bank transfer instructions before dispatch or collection.
              </p>
            </div>
          </div>

          {/* Order Summary Receipt */}
          <Card
            hazardStripe
            title={`ORDER DETAILS — ${completedOrder.orderNumber}`}
            subtitle={`Placed on ${new Date(completedOrder.createdAt).toLocaleString("en-NG")}`}
            headerAction={
              <Badge variant="amber" isMonospace size="sm">
                STATUS: {completedOrder.orderStatus}
              </Badge>
            }
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--ac-space-4)" }}>
              {/* Customer & Fulfilment Meta */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--ac-space-4)", borderBottom: "1px solid var(--ac-border-subtle)", paddingBottom: "var(--ac-space-4)" }}>
                <div>
                  <span className="ac-mono" style={{ fontSize: "10px", color: "var(--ac-text-muted)", display: "block" }}>
                    CUSTOMER
                  </span>
                  <strong style={{ fontSize: "var(--ac-text-sm)", color: "var(--ac-text-primary)" }}>
                    {completedOrder.customerName}
                  </strong>
                  <span style={{ fontSize: "var(--ac-text-xs)", color: "var(--ac-text-secondary)", display: "block" }}>
                    {completedOrder.customerPhone}
                  </span>
                  <span style={{ fontSize: "var(--ac-text-xs)", color: "var(--ac-text-secondary)", display: "block" }}>
                    {completedOrder.customerEmail}
                  </span>
                </div>

                <div>
                  <span className="ac-mono" style={{ fontSize: "10px", color: "var(--ac-text-muted)", display: "block" }}>
                    FULFILMENT METHOD
                  </span>
                  <strong style={{ fontSize: "var(--ac-text-sm)", color: "var(--ac-text-primary)" }}>
                    {completedOrder.fulfilmentType === "WORKSHOP_PICKUP" ? "Workshop Collection" : "Courier Delivery (Nigeria)"}
                  </strong>
                  {completedOrder.shippingAddress && (
                    <span style={{ fontSize: "var(--ac-text-xs)", color: "var(--ac-text-secondary)", display: "block" }}>
                      {(completedOrder.shippingAddress as any).street}, {(completedOrder.shippingAddress as any).city}, {(completedOrder.shippingAddress as any).state}
                    </span>
                  )}
                </div>
              </div>

              {/* Immutable Purchased Items Table */}
              <div>
                <span className="ac-mono" style={{ fontSize: "11px", color: "var(--ac-accent-amber)", fontWeight: 700, display: "block", marginBottom: "var(--ac-space-2)" }}>
                  PURCHASED ITEMS (AUTHORITATIVE PRICE SNAPSHOT):
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--ac-space-2)" }}>
                  {(completedOrder.items || []).map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "var(--ac-space-2) var(--ac-space-3)",
                        backgroundColor: "var(--ac-bg-base)",
                        border: "1px solid var(--ac-border-subtle)",
                        fontSize: "var(--ac-text-xs)",
                      }}
                    >
                      <div>
                        <span className="ac-mono" style={{ fontSize: "10px", color: "var(--ac-accent-amber)", display: "block" }}>
                          SKU: {item.skuSnapshot}
                        </span>
                        <span style={{ fontWeight: 600, color: "var(--ac-text-primary)" }}>
                          {item.productNameSnapshot}
                        </span>
                        <span style={{ color: "var(--ac-text-muted)", marginLeft: "var(--ac-space-2)" }}>
                          (Qty: {item.quantity} × ₦{(item.unitPriceCentsSnapshot / 100).toLocaleString()})
                        </span>
                      </div>
                      <PriceDisplay priceCents={item.lineTotalCents} size="sm" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderTop: "1px solid var(--ac-border-subtle)", paddingTop: "var(--ac-space-3)" }}>
                <span style={{ fontWeight: 700, fontSize: "var(--ac-text-base)" }}>Authoritative Total (NGN):</span>
                <PriceDisplay priceCents={completedOrder.totalCents} size="xl" />
              </div>

              {/* Actions */}
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--ac-space-2)", marginTop: "var(--ac-space-4)" }}>
                <Button
                  href={whatsappFollowupUrl}
                  isExternal
                  variant="whatsapp"
                  size="lg"
                  leftIcon={<MessageCircle size={18} />}
                >
                  Confirm Payment &amp; Dispatch on WhatsApp
                </Button>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--ac-space-2)" }}>
                  <Button href="/track" variant="outline" size="md">
                    Track Order Status
                  </Button>
                  <Button href="/shop" variant="primary" size="md">
                    Return to Store Catalog
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </PageContainer>
    );
  }

  // If cart is empty
  if (items.length === 0) {
    return (
      <PageContainer
        title="Secure Order Checkout"
        subtitle="Complete your order for delivery across Nigeria or workshop collection."
        breadcrumbs={[{ label: "Shopping Cart", href: "/cart" }, { label: "Checkout" }]}
        maxWidth="wide"
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--ac-space-12) var(--ac-space-4)",
            textAlign: "center",
            backgroundColor: "var(--ac-bg-panel)",
            border: "1px dashed var(--ac-border-default)",
            gap: "var(--ac-space-4)",
          }}
        >
          <AlertCircle size={36} style={{ color: "var(--ac-accent-amber)" }} />
          <div>
            <h2 style={{ fontSize: "var(--ac-text-lg)", fontWeight: 700, margin: "0 0 var(--ac-space-1) 0" }}>
              CANNOT CHECKOUT: CART IS EMPTY
            </h2>
            <p style={{ fontSize: "var(--ac-text-sm)", color: "var(--ac-text-secondary)", margin: 0 }}>
              Please add automotive diagnostic tools or accessories to your cart before proceeding to checkout.
            </p>
          </div>
          <Button href="/shop" variant="primary" size="md">
            Browse Store Catalog
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Secure Order Checkout"
      subtitle="Complete your order for delivery across Nigeria or workshop collection."
      breadcrumbs={[
        { label: "Shopping Cart", href: "/cart" },
        { label: "Checkout" },
      ]}
      maxWidth="wide"
    >
      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "var(--ac-space-8)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "var(--ac-space-8)" }}>
            {/* Form Section */}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--ac-space-6)" }}>
              {errorMessage && (
                <Toast
                  type="error"
                  title="ORDER VALIDATION ERROR"
                  message={errorMessage}
                />
              )}

              {/* Customer Info */}
              <Card title="1. CUSTOMER INFORMATION" subtitle="Guest checkout (No registration required)">
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--ac-space-3)" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--ac-space-3)" }}>
                    <Input
                      label="First Name"
                      placeholder="e.g. Chinedu"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      error={fieldErrors["customer.firstName"]}
                      required
                    />
                    <Input
                      label="Last Name"
                      placeholder="e.g. Okafor"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      error={fieldErrors["customer.lastName"]}
                      required
                    />
                  </div>
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="e.g. chinedu@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={fieldErrors["customer.email"]}
                    required
                  />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--ac-space-3)" }}>
                    <Input
                      label="Phone Number (Nigeria)"
                      placeholder="e.g. 0803 123 4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      error={fieldErrors["customer.phone"]}
                      isMonospace
                      required
                    />
                    <Input
                      label="WhatsApp Number (Optional)"
                      placeholder="e.g. 0803 123 4567"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      isMonospace
                    />
                  </div>
                </div>
              </Card>

              {/* Fulfilment Selector */}
              <Card title="2. FULFILMENT METHOD" subtitle="Select delivery or workshop pickup">
                <RadioGroup
                  name="fulfilment"
                  selectedValue={fulfilmentType}
                  onChange={(val) => setFulfilmentType(val as FulfilmentType)}
                  options={[
                    {
                      value: "DELIVERY",
                      label: "Courier Delivery (Across Nigeria)",
                      description: "Direct dispatch to your designated home, garage, or workshop address across Nigeria.",
                    },
                    {
                      value: "WORKSHOP_PICKUP",
                      label: "Physical Workshop Collection (Free)",
                      description: "Collect your equipment directly in person at our workshop facility.",
                    },
                  ]}
                />

                {fulfilmentType === "DELIVERY" && (
                  <div style={{ marginTop: "var(--ac-space-4)", display: "flex", flexDirection: "column", gap: "var(--ac-space-3)" }}>
                    <Input
                      label="Delivery Street Address"
                      placeholder="e.g. 14 Industrial Avenue, Off Commercial Way"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      error={fieldErrors["shippingAddress.street"]}
                      required
                    />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--ac-space-3)" }}>
                      <Input
                        label="City / Town"
                        placeholder="e.g. Ikeja / Port Harcourt / Abuja"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        error={fieldErrors["shippingAddress.city"]}
                        required
                      />
                      <Input
                        label="State"
                        placeholder="e.g. Lagos State / Rivers State"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        error={fieldErrors["shippingAddress.state"]}
                        required
                      />
                    </div>
                  </div>
                )}
              </Card>

              {/* Payment Method Selector */}
              <Card title="3. PAYMENT CHANNEL" subtitle="Unresolved provider placeholder">
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--ac-space-3)" }}>
                  <RadioGroup
                    name="payment"
                    selectedValue={paymentMethod}
                    onChange={(val) => setPaymentMethod(val as any)}
                    options={[
                      {
                        value: "ONLINE_GATEWAY",
                        label: "Card / Bank Transfer (Online Payment)",
                        description: "Standard secure electronic checkout via approved Nigerian payment gateway.",
                      },
                      {
                        value: "WHATSAPP_CONFIRM",
                        label: "WhatsApp Order & Bank Transfer Invoice",
                        description: "Submit order and finalize bank payment / direct invoice with staff over WhatsApp.",
                      },
                    ]}
                  />
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--ac-space-2)", fontSize: "11px", color: "var(--ac-text-muted)", marginTop: "var(--ac-space-2)" }}>
                    <AlertCircle size={14} style={{ color: "var(--ac-accent-amber)", flexShrink: 0 }} />
                    <span>Payment provider selection is deliberately open; gateway integration will occur in a later phase. All orders are marked UNPAID upon placement.</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Sidebar Summary */}
            <div>
              <Card hazardStripe title="ORDER REVIEW" subtitle={`${items.length} Product(s)`}>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--ac-space-4)" }}>
                  {/* Item Rows */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--ac-space-2)", maxHeight: "240px", overflowY: "auto" }}>
                    {items.map((item) => (
                      <div key={item.product.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--ac-text-xs)" }}>
                        <span style={{ color: "var(--ac-text-secondary)" }}>
                          {item.product.name} (x{item.quantity})
                        </span>
                        <PriceDisplay priceCents={item.product.priceCents * item.quantity} size="sm" />
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--ac-text-xs)", color: "var(--ac-text-muted)" }}>
                    <span>Fulfilment ({fulfilmentType}):</span>
                    <span>To be calculated on review</span>
                  </div>

                  <div style={{ height: "1px", backgroundColor: "var(--ac-border-subtle)" }} />

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ fontWeight: 700, fontSize: "var(--ac-text-base)" }}>Order Total (NGN):</span>
                    <PriceDisplay priceCents={subtotalCents} size="lg" />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={isSubmitting}
                    style={{ width: "100%", marginTop: "var(--ac-space-2)" }}
                  >
                    {isSubmitting ? "Validating & Placing Order..." : "Place Order (Secure Checkout)"}
                  </Button>

                  <div style={{ display: "flex", alignItems: "center", gap: "var(--ac-space-2)", fontSize: "11px", color: "var(--ac-text-muted)" }}>
                    <ShieldCheck size={14} style={{ color: "var(--ac-status-success)", flexShrink: 0 }} />
                    <span>Authoritative server-side price &amp; stock verification enforced.</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </form>
    </PageContainer>
  );
}
