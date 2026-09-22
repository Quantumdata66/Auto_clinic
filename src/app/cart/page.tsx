import React from "react";
import Link from "next/link";
import { ShoppingCart, ArrowRight, MessageCircle, Trash2, ArrowLeft, ShieldCheck } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PriceDisplay } from "@/components/commerce/PriceDisplay";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MOCK_PRODUCTS } from "@/data/mockData";

export default function CartPage() {
  // Demonstration cart item from mock catalog
  const sampleItem = MOCK_PRODUCTS[0];
  const sampleQuantity = 1;
  const subtotalCents = sampleItem.priceCents * sampleQuantity;

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "2340000000000";
  const whatsappMessage = encodeURIComponent(
    `Hello Auto Clinic, I would like to checkout my cart:\n` +
    `• Item: ${sampleItem.name} (Qty: ${sampleQuantity})\n` +
    `• SKU: ${sampleItem.sku}\n` +
    `• Estimated Subtotal: ₦${(subtotalCents / 100).toLocaleString()}`
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  return (
    <PageContainer
      title="Shopping Cart"
      subtitle="Review selected automotive tools, equipment, and accessories before placing order."
      breadcrumbs={[{ label: "Shopping Cart" }]}
      maxWidth="wide"
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "var(--ac-space-8)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "var(--ac-space-8)" }}>
          {/* Cart Items List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--ac-space-4)" }}>
            <div className="ac-panel" style={{ padding: "var(--ac-space-4)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--ac-border-subtle)", paddingBottom: "var(--ac-space-3)", marginBottom: "var(--ac-space-3)" }}>
                <span className="ac-mono" style={{ fontSize: "var(--ac-text-xs)", color: "var(--ac-text-muted)" }}>
                  1 ITEM READY FOR ORDER
                </span>
                <span style={{ fontSize: "var(--ac-text-xs)", color: "var(--ac-text-secondary)" }}>
                  Demonstration Cart
                </span>
              </div>

              {/* Cart Item Row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--ac-space-4)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span className="ac-mono" style={{ fontSize: "10px", color: "var(--ac-accent-amber)" }}>
                    SKU: {sampleItem.sku}
                  </span>
                  <Link href={`/shop/product/${sampleItem.slug}`} style={{ fontSize: "var(--ac-text-sm)", fontWeight: 700, color: "var(--ac-text-primary)" }}>
                    {sampleItem.name}
                  </Link>
                  <span style={{ fontSize: "var(--ac-text-xs)", color: "var(--ac-text-muted)" }}>
                    Category: {sampleItem.categoryName}
                  </span>
                  <div style={{ marginTop: "var(--ac-space-2)" }}>
                    <PriceDisplay priceCents={sampleItem.priceCents} size="sm" />
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "var(--ac-space-2)" }}>
                  <span className="ac-mono" style={{ fontSize: "var(--ac-text-xs)", color: "var(--ac-text-secondary)" }}>
                    Qty: {sampleQuantity}
                  </span>
                  <button type="button" style={{ background: "transparent", border: "none", color: "var(--ac-text-muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "11px" }}>
                    <Trash2 size={12} />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            </div>

            <Link href="/shop" style={{ display: "inline-flex", alignItems: "center", gap: "var(--ac-space-2)", fontSize: "var(--ac-text-xs)", color: "var(--ac-accent-amber)", textDecoration: "none" }}>
              <ArrowLeft size={14} />
              <span>Continue Browsing Catalog</span>
            </Link>
          </div>

          {/* Cart Summary & Dual Checkout Card */}
          <div>
            <Card hazardStripe title="ORDER SUMMARY" subtitle="Calculated in Nigerian Naira (NGN)">
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--ac-space-4)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--ac-text-sm)" }}>
                  <span style={{ color: "var(--ac-text-secondary)" }}>Items Subtotal:</span>
                  <PriceDisplay priceCents={subtotalCents} size="sm" />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--ac-text-xs)", color: "var(--ac-text-muted)" }}>
                  <span>Fulfilment (Delivery/Pickup):</span>
                  <span>Calculated at checkout</span>
                </div>
                <div style={{ height: "1px", backgroundColor: "var(--ac-border-subtle)" }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontWeight: 700, fontSize: "var(--ac-text-base)" }}>Estimated Total:</span>
                  <PriceDisplay priceCents={subtotalCents} size="lg" />
                </div>

                {/* Dual Action Buttons */}
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--ac-space-2)", marginTop: "var(--ac-space-2)" }}>
                  <Button href="/checkout" variant="primary" size="lg" rightIcon={<ArrowRight size={16} />}>
                    Proceed to Checkout
                  </Button>
                  <Button href={whatsappUrl} isExternal variant="whatsapp" size="md" leftIcon={<MessageCircle size={16} />}>
                    Order via WhatsApp
                  </Button>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "var(--ac-space-2)", fontSize: "11px", color: "var(--ac-text-muted)", marginTop: "var(--ac-space-2)" }}>
                  <ShieldCheck size={14} style={{ color: "var(--ac-status-success)" }} />
                  <span>Guest checkout and optional customer account supported</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
