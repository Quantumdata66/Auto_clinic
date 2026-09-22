import React from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import styles from "./CartTrigger.module.css";

export interface CartTriggerProps {
  itemCount?: number;
  className?: string;
}

export const CartTrigger: React.FC<CartTriggerProps> = ({
  itemCount = 0,
  className = "",
}) => {
  return (
    <Link
      href="/cart"
      className={`${styles.trigger} ${className}`}
      aria-label={`Shopping cart with ${itemCount} items`}
    >
      <div className={styles.iconWrapper}>
        <ShoppingCart size={20} className={styles.icon} />
        {itemCount > 0 && <span className={styles.badge}>{itemCount}</span>}
      </div>
      <span className={styles.label}>Cart</span>
    </Link>
  );
};
