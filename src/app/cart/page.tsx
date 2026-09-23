"use client";

import React from "react";
import Link from "next/link";
import {
  ShoppingCart,
  ArrowRight,
  MessageCircle,
  Trash2,
  ArrowLeft,
  ShieldCheck,
  Plus,
  Minus,
  Wrench,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PriceDisplay } from "@/components/commerce/PriceDisplay";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useCart } from "@/context/CartContext";
import { generateCartWhatsAppUrl } from "@/lib/utils/whatsapp";

export default function CartPage() {
  const {
    items,
    itemCount,
    subtotalCents,
    removeItem,
    updateQuantity,
    clearCart,
    isHydrated,
  } = useCart();

  const whatsappUrl = generateCartWhatsAppUrl(items, subtotalCents, "DELIVERY");

  if (!isHydrated) {
    return (
      <PageContainer
        title="Shopping Cart"
        subtitle="Review selected automotive tools, equipment, and accessories before placing order."
        breadcrumbs={[{ label: "Shopping Cart" }]}
        maxWidth="wide"
      >
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "240px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--ac-space-3)", color: "var(--ac-text-muted)" }}>
            <RefreshCw size={20} className="ac-spin" />
            <span className="ac-mono" style={{ fontSize: "var(--ac-text-sm)" }}>
              HYDRATING WORKSHOP CART...
            </span>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Shopping Cart"
      subtitle="Review selected automotive tools, equipment, and accessories before placing order."
      breadcrumbs={[{ label: "Shopping Cart" }]}
      maxWidth="wide"
    >
      {items.length === 0 ? (
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
          <div
            style={{
              width: "64px",
              height: "64px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "var(--ac-bg-base)",
              border: "1px solid var(--ac-border-default)",
              color: "var(--ac-text-muted)",
            }}
          >
            <ShoppingCart size={32} />
          </div>
          <div>
            <h2 style={{ fontSize: "var(--ac-text-lg)", fontWeight: 700, margin: "0 0 var(--ac-space-1) 0" }}>
              YOUR WORKSHOP CART IS CURRENTLY EMPTY
            </h2>
            <p style={{ fontSize: "var(--ac-text-sm)", color: "var(--ac-text-secondary)", margin: 0, maxWidth: "480px" }}>
              No automotive equipment, diagnostic tools, or accessories have been added yet. Browse our store catalogue or submit a diagnostic enquiry for vehicle triage.
            </p>
          </div>
          <div style={{ display: "flex", gap: "var(--ac-space-3)", marginTop: "var(--ac-space-2)", flexWrap: "wrap", justifyContent: "center" }}>
            <Button href="/shop" variant="primary" size="md" rightIcon={<ArrowRight size={16} />}>
              Browse Equipment Catalog
            </Button>
            <Button href="/diagnostics" variant="outline" size="md" leftIcon={<Wrench size={16} />}>
              Workshop Diagnostics
            </Button>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "var(--ac-space-8)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "var(--ac-space-8)" }}>
            {/* Left Column: Interactive Cart Items List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--ac-space-4)" }}>
              <div className="ac-panel" style={{ padding: "var(--ac-space-4)" }}>
                {/* Header Bar */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px solid var(--ac-border-subtle)",
                    paddingBottom: "var(--ac-space-3)",
                    marginBottom: "var(--ac-space-4)",
                  }}
                >
                  <span className="ac-mono" style={{ fontSize: "var(--ac-text-xs)", color: "var(--ac-accent-amber)", fontWeight: 700 }}>
                    {itemCount} {itemCount === 1 ? "ITEM" : "ITEMS"} IN CART ({items.length} {items.length === 1 ? "PRODUCT" : "PRODUCTS"})
                  </span>
                  <button
                    type="button"
                    onClick={clearCart}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--ac-text-muted)",
                      cursor: "pointer",
                      fontSize: "11px",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                    title="Remove all items from cart"
                  >
                    <Trash2 size={12} />
                    <span>Clear Cart</span>
                  </button>
                </div>

                {/* Items List */}
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--ac-space-4)" }}>
                  {items.map(({ product, quantity }) => {
                    const lineTotalCents = product.priceCents * quantity;
                    const maxAllowed = product.allowBackorder
                      ? 99
                      : Math.max(1, product.stockQuantity || 1);

                    return (
                      <div
                        key={product.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: "var(--ac-space-4)",
                          paddingBottom: "var(--ac-space-4)",
                          borderBottom: "1px solid var(--ac-border-subtle)",
                        }}
                      >
                        {/* Item Details */}
                        <div style={{ display: "flex", gap: "var(--ac-space-3)", flex: 1 }}>
                          <div
                            style={{
                              width: "48px",
                              height: "48px",
                              backgroundColor: "var(--ac-bg-base)",
                              border: "1px solid var(--ac-border-default)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                              color: "var(--ac-accent-amber)",
                            }}
                          >
                            <Wrench size={20} />
                          </div>

                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <span className="ac-mono" style={{ fontSize: "10px", color: "var(--ac-accent-amber)" }}>
                              SKU: {product.sku}
                            </span>
                            <Link
                              href={`/shop/product/${product.slug}`}
                              style={{
                                fontSize: "var(--ac-text-sm)",
                                fontWeight: 700,
                                color: "var(--ac-text-primary)",
                                textDecoration: "none",
                              }}
                            >
                              {product.name}
                            </Link>
                            <span style={{ fontSize: "var(--ac-text-xs)", color: "var(--ac-text-muted)" }}>
                              Category: {product.categoryName}
                            </span>
                            <div style={{ marginTop: "4px" }}>
                              <PriceDisplay priceCents={product.priceCents} size="sm" />
                            </div>
                          </div>
                        </div>

                        {/* Controls: Quantity Stepper & Line Total */}
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-end",
                            gap: "var(--ac-space-2)",
                          }}
                        >
                          <div style={{ display: "inline-flex", alignItems: "center", border: "1px solid var(--ac-border-strong)", backgroundColor: "var(--ac-bg-base)" }}>
                            <button
                              type="button"
                              onClick={() => updateQuantity(product.id, quantity - 1)}
                              style={{
                                background: "transparent",
                                border: "none",
                                color: "var(--ac-text-primary)",
                                width: "28px",
                                height: "28px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                              }}
                              aria-label="Decrease quantity"
                            >
                              <Minus size={12} />
                            </button>
                            <span
                              className="ac-mono"
                              style={{
                                minWidth: "28px",
                                textAlign: "center",
                                fontSize: "var(--ac-text-xs)",
                                fontWeight: 700,
                              }}
                            >
                              {quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(product.id, quantity + 1)}
                              disabled={quantity >= maxAllowed}
                              style={{
                                background: "transparent",
                                border: "none",
                                color: "var(--ac-text-primary)",
                                width: "28px",
                                height: "28px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: quantity >= maxAllowed ? "not-allowed" : "pointer",
                                opacity: quantity >= maxAllowed ? 0.3 : 1,
                              }}
                              aria-label="Increase quantity"
                            >
                              <Plus size={12} />
                            </button>
                          </div>

                          <div style={{ textAlign: "right" }}>
                            <span className="ac-mono" style={{ fontSize: "11px", color: "var(--ac-text-muted)", display: "block" }}>
                              LINE TOTAL:
                            </span>
                            <PriceDisplay priceCents={lineTotalCents} size="sm" />
                          </div>

                          <button
                            type="button"
                            onClick={() => removeItem(product.id)}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "var(--ac-status-error)",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "11px",
                              marginTop: "2px",
                            }}
                          >
                            <Trash2 size={12} />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Link
                href="/shop"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "var(--ac-space-2)",
                  fontSize: "var(--ac-text-xs)",
                  color: "var(--ac-accent-amber)",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                <ArrowLeft size={14} />
                <span>Continue Browsing Store Catalog</span>
              </Link>
            </div>

            {/* Right Column: Cart Summary & Dual Ordering Options */}
            <div>
              <Card hazardStripe title="ORDER SUMMARY" subtitle="Authoritative NGN calculations">
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--ac-space-4)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--ac-text-sm)" }}>
                    <span style={{ color: "var(--ac-text-secondary)" }}>Items Subtotal ({itemCount} units):</span>
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
                    <Button
                      href={whatsappUrl}
                      isExternal
                      variant="whatsapp"
                      size="md"
                      leftIcon={<MessageCircle size={16} />}
                    >
                      Order Cart via WhatsApp
                    </Button>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "var(--ac-space-2)", fontSize: "11px", color: "var(--ac-text-muted)", marginTop: "var(--ac-space-2)" }}>
                    <ShieldCheck size={14} style={{ color: "var(--ac-status-success)" }} />
                    <span>Guest checkout supported. Authoritative server pricing verified.</span>
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
