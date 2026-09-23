"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShoppingCart, MessageCircle, Wrench, Check } from "lucide-react";
import { Product } from "@/types";
import { useCart } from "@/context/CartContext";
import { generateProductWhatsAppUrl } from "@/lib/utils/whatsapp";
import { PriceDisplay } from "./PriceDisplay";
import { StockBadge } from "./StockBadge";
import { Button } from "../ui/Button";
import styles from "./ProductCard.module.css";

export interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  className = "",
}) => {
  const { addItem } = useCart();
  const [isJustAdded, setIsJustAdded] = useState(false);

  const whatsappUrl = generateProductWhatsAppUrl(product, 1);

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(product);
    } else {
      addItem(product, 1);
    }
    setIsJustAdded(true);
    setTimeout(() => {
      setIsJustAdded(false);
    }, 1600);
  };

  return (
    <div className={`${styles.card} ${className}`}>
      {/* Product Image / Technical Graphic Area */}
      <Link href={`/shop/product/${product.slug}`} className={styles.imageLink} tabIndex={-1} aria-hidden="true">
        <div className={styles.imagePlaceholder}>
          <div className={styles.brandEmblem}>
            <Wrench size={32} className={styles.emblemIcon} />
          </div>
          <div className={styles.skuOverlay}>
            <span className={styles.skuText}>{product.sku}</span>
          </div>
        </div>
      </Link>

      {/* Main Content */}
      <div className={styles.content}>
        <div className={styles.metaRow}>
          <span className={styles.categoryName}>{product.categoryName}</span>
          <StockBadge status={product.stockStatus} quantity={product.stockQuantity} />
        </div>

        <h3 className={styles.title}>
          <Link href={`/shop/product/${product.slug}`} className={styles.titleLink}>
            {product.name}
          </Link>
        </h3>

        <p className={styles.shortDescription}>{product.shortDescription}</p>

        {/* Technical Specification Snippets */}
        {product.specs && product.specs.length > 0 && (
          <div className={styles.specsSnippet}>
            {product.specs.slice(0, 2).map((spec) => (
              <div key={spec.label} className={styles.specItem}>
                <span className={styles.specLabel}>{spec.label}:</span>
                <span className={`${styles.specVal} ${spec.isMonospace ? styles.mono : ""}`}>
                  {spec.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Price & Action Row */}
        <div className={styles.footer}>
          <div className={styles.priceWrapper}>
            <span className={styles.priceLabel}>PRICE (NGN)</span>
            <PriceDisplay
              priceCents={product.priceCents}
              compareAtPriceCents={product.compareAtPriceCents}
              size="md"
            />
          </div>

          <div className={styles.buttonStack}>
            <Button
              size="sm"
              variant={isJustAdded ? "secondary" : "primary"}
              leftIcon={isJustAdded ? <Check size={14} style={{ color: "var(--ac-status-success)" }} /> : <ShoppingCart size={14} />}
              onClick={handleAddToCart}
              disabled={product.stockStatus === "OUT_OF_STOCK"}
            >
              {isJustAdded ? "Added to Cart" : "Add to Cart"}
            </Button>
            <Button
              size="sm"
              variant="whatsapp"
              href={whatsappUrl}
              isExternal
              leftIcon={<MessageCircle size={14} />}
            >
              WhatsApp Order
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
