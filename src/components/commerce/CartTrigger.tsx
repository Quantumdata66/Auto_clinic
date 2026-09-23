"use client";

import React from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import styles from "./CartTrigger.module.css";

export interface CartTriggerProps {
  className?: string;
}

export const CartTrigger: React.FC<CartTriggerProps> = ({
  className = "",
}) => {
  const { itemCount, isHydrated } = useCart();
  const displayCount = isHydrated ? itemCount : 0;

  return (
    <Link
      href="/cart"
      className={`${styles.trigger} ${className}`}
      aria-label={`Shopping cart with ${displayCount} items`}
    >
      <div className={styles.iconWrapper}>
        <ShoppingCart size={20} className={styles.icon} />
        {displayCount > 0 && <span className={styles.badge}>{displayCount}</span>}
      </div>
      <span className={styles.label}>Cart</span>
    </Link>
  );
};
