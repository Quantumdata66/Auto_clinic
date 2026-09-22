import React from "react";
import styles from "./PriceDisplay.module.css";

export interface PriceDisplayProps {
  priceCents: number;
  compareAtPriceCents?: number;
  currency?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export const formatNgnPrice = (cents: number): string => {
  const naira = cents / 100;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(naira);
};

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  priceCents,
  compareAtPriceCents,
  currency = "NGN",
  size = "md",
  className = "",
}) => {
  const formattedPrice = formatNgnPrice(priceCents);
  const formattedCompareAt = compareAtPriceCents ? formatNgnPrice(compareAtPriceCents) : null;
  const discountPercent =
    compareAtPriceCents && compareAtPriceCents > priceCents
      ? Math.round(((compareAtPriceCents - priceCents) / compareAtPriceCents) * 100)
      : null;

  return (
    <div className={`${styles.container} ${styles[size]} ${className}`}>
      <span className={styles.currentPrice} aria-label={`Price: ${formattedPrice}`}>
        {formattedPrice}
      </span>
      {formattedCompareAt && (
        <span className={styles.compareAtPrice} aria-label={`Original price: ${formattedCompareAt}`}>
          {formattedCompareAt}
        </span>
      )}
      {discountPercent && (
        <span className={styles.discountBadge}>
          -{discountPercent}%
        </span>
      )}
    </div>
  );
};
