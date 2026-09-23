"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShoppingCart, MessageCircle, Plus, Minus, Check, ArrowRight } from "lucide-react";
import { Product } from "@/types";
import { useCart } from "@/context/CartContext";
import { generateProductWhatsAppUrl } from "@/lib/utils/whatsapp";
import { Button } from "../ui/Button";
import styles from "./ProductPurchasePanel.module.css";

export interface ProductPurchasePanelProps {
  product: Product;
}

export const ProductPurchasePanel: React.FC<ProductPurchasePanelProps> = ({
  product,
}) => {
  const { addItem, getItemQuantity } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [showFeedback, setShowFeedback] = useState(false);

  const isOutOfStock = product.stockStatus === "OUT_OF_STOCK";
  const maxAllowed = product.allowBackorder
    ? 99
    : Math.max(1, product.stockQuantity || 1);

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.min(maxAllowed, Math.max(1, prev + delta)));
  };

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addItem(product, quantity);
    setShowFeedback(true);
    setTimeout(() => {
      setShowFeedback(false);
    }, 4000);
  };

  const whatsappUrl = generateProductWhatsAppUrl(product, quantity);

  return (
    <div className={styles.purchasePanel}>
      <div className={styles.quantityRow}>
        <span className={styles.quantityLabel}>ORDER QUANTITY:</span>
        <div className={styles.quantityStepper}>
          <button
            type="button"
            className={styles.stepperBtn}
            onClick={() => handleQuantityChange(-1)}
            disabled={quantity <= 1 || isOutOfStock}
            aria-label="Decrease quantity"
          >
            <Minus size={14} />
          </button>
          <span className={styles.quantityValue}>{quantity}</span>
          <button
            type="button"
            className={styles.stepperBtn}
            onClick={() => handleQuantityChange(1)}
            disabled={quantity >= maxAllowed || isOutOfStock}
            aria-label="Increase quantity"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      <div className={styles.actionButtons}>
        <Button
          variant="primary"
          size="lg"
          leftIcon={<ShoppingCart size={18} />}
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className={styles.actionBtn}
        >
          {isOutOfStock ? "Out of Stock" : `Add to Cart (${quantity})`}
        </Button>
        <Button
          variant="whatsapp"
          size="lg"
          href={whatsappUrl}
          isExternal
          leftIcon={<MessageCircle size={18} />}
          className={styles.actionBtn}
        >
          Instant Order on WhatsApp
        </Button>
      </div>

      {showFeedback && (
        <div className={styles.feedbackAlert}>
          <div className={styles.feedbackLeft}>
            <Check size={16} className={styles.checkIcon} />
            <span>
              Added <strong>{quantity} × {product.name}</strong> to your cart.
            </span>
          </div>
          <Link href="/cart" className={styles.viewCartLink}>
            <span>View Cart</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      )}
    </div>
  );
};
