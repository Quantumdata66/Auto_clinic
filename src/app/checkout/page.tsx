"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShieldCheck, Truck, Store, CreditCard, MessageCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Input } from "@/components/ui/Input";
import { RadioGroup } from "@/components/ui/Radio";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PriceDisplay } from "@/components/commerce/PriceDisplay";
import { Toast } from "@/components/ui/Toast";

export default function CheckoutPage() {
  const [fulfilmentType, setFulfilmentType] = useState("DELIVERY");
  const [paymentMethod, setPaymentMethod] = useState("ONLINE_GATEWAY");
  const [isSubmitted, setIsSubmitted] = useState(false);

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
      {isSubmitted ? (
        <div style={{ maxWidth: "600px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "var(--ac-space-6)" }}>
          <Toast
            type="success"
            title="ORDER PROCESSED (PHASE 2 SCAFFOLD)"
            message="This is a demonstration of the Auto Clinic checkout flow. Full server-side transactional processing and payment gateway integration will be attached in subsequent phases."
          />
          <Card title="ORDER DETAILS" subtitle="Reference: AC-DEMO-2026-0922">
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--ac-space-3)", fontSize: "var(--ac-text-sm)" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--ac-text-secondary)" }}>Fulfilment Option:</span>
                <span style={{ fontWeight: 600 }}>{fulfilmentType === "DELIVERY" ? "Courier Delivery (Nigeria)" : "Workshop Collection"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--ac-text-secondary)" }}>Selected Payment Channel:</span>
                <span style={{ fontWeight: 600 }}>{paymentMethod}</span>
              </div>
            </div>
          </Card>
          <Button href="/shop" variant="primary" size="lg">
            Return to Store Catalog
          </Button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "var(--ac-space-8)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "var(--ac-space-8)" }}>
            {/* Form Section */}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--ac-space-6)" }}>
              {/* Customer Info */}
              <Card title="1. CUSTOMER INFORMATION" subtitle="Guest checkout or account">
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--ac-space-3)" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--ac-space-3)" }}>
                    <Input label="First Name" placeholder="e.g. Chinedu" required />
                    <Input label="Last Name" placeholder="e.g. Okafor" required />
                  </div>
                  <Input label="Email Address" type="email" placeholder="e.g. chinedu@example.com" required />
                  <Input label="Phone / WhatsApp Number (Nigeria)" placeholder="e.g. 0803 123 4567" isMonospace required />
                </div>
              </Card>

              {/* Fulfilment Selector */}
              <Card title="2. FULFILMENT METHOD" subtitle="Select delivery or workshop pickup">
                <RadioGroup
                  name="fulfilment"
                  selectedValue={fulfilmentType}
                  onChange={(val) => setFulfilmentType(val)}
                  options={[
                    {
                      value: "DELIVERY",
                      label: "Courier Delivery (Nigeria)",
                      description: "Direct dispatch to your designated home, business, or workshop address in Nigeria.",
                    },
                    {
                      value: "WORKSHOP_PICKUP",
                      label: "Physical Workshop Collection (Free)",
                      description: "Collect your equipment in-person directly from our workshop facility.",
                    },
                  ]}
                />

                {fulfilmentType === "DELIVERY" && (
                  <div style={{ marginTop: "var(--ac-space-4)", display: "flex", flexDirection: "column", gap: "var(--ac-space-3)" }}>
                    <Input label="Delivery Street Address" placeholder="e.g. 14 Industrial Avenue" required />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--ac-space-3)" }}>
                      <Input label="City / Town" placeholder="e.g. Lagos / Abuja / Port Harcourt" required />
                      <Input label="State" placeholder="e.g. Lagos State" required />
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
                    onChange={(val) => setPaymentMethod(val)}
                    options={[
                      {
                        value: "ONLINE_GATEWAY",
                        label: "Card / Bank Transfer (Online Payment)",
                        description: "Standard secure electronic checkout via approved Nigerian payment gateway.",
                      },
                      {
                        value: "WHATSAPP_CONFIRM",
                        label: "WhatsApp Order & Bank Transfer",
                        description: "Submit order and finalize payment / invoice details with staff over WhatsApp.",
                      },
                    ]}
                  />
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--ac-space-2)", fontSize: "11px", color: "var(--ac-text-muted)", marginTop: "var(--ac-space-2)" }}>
                    <AlertCircle size={14} style={{ color: "var(--ac-accent-amber)" }} />
                    <span>Payment provider selection is deliberately open; gateway integration will occur in later phase.</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Sidebar Summary */}
            <div>
              <Card hazardStripe title="ORDER REVIEW" subtitle="1 Item">
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--ac-space-4)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--ac-text-xs)" }}>
                    <span style={{ color: "var(--ac-text-secondary)" }}>Auto Clinic Pro-Scan V2 OBD2 Scanner (x1)</span>
                    <PriceDisplay priceCents={4850000} size="sm" />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--ac-text-xs)", color: "var(--ac-text-muted)" }}>
                    <span>Fulfilment ({fulfilmentType}):</span>
                    <span>To be calculated</span>
                  </div>
                  <div style={{ height: "1px", backgroundColor: "var(--ac-border-subtle)" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ fontWeight: 700, fontSize: "var(--ac-text-base)" }}>Order Total (NGN):</span>
                    <PriceDisplay priceCents={4850000} size="lg" />
                  </div>

                  <Button
                    onClick={() => setIsSubmitted(true)}
                    variant="primary"
                    size="lg"
                    style={{ width: "100%", marginTop: "var(--ac-space-2)" }}
                  >
                    Place Demonstration Order
                  </Button>

                  <div style={{ display: "flex", alignItems: "center", gap: "var(--ac-space-2)", fontSize: "11px", color: "var(--ac-text-muted)" }}>
                    <ShieldCheck size={14} style={{ color: "var(--ac-status-success)" }} />
                    <span>Authoritative server-side pricing enforced</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
