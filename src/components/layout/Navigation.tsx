"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Navigation.module.css";

export interface NavItem {
  label: string;
  href: string;
  isBadge?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Shop Products", href: "/shop" },
  { label: "Workshop Diagnostics", href: "/diagnostics", isBadge: "Workshop" },
  { label: "Track Status", href: "/track" },
  { label: "About Clinic", href: "/about" },
  { label: "Contact / Location", href: "/contact" },
];

export const Navigation: React.FC = () => {
  const pathname = usePathname();

  return (
    <nav className={styles.nav} aria-label="Main Navigation">
      <ul className={styles.list}>
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
            <li key={item.href} className={styles.item}>
              <Link
                href={item.href}
                className={`${styles.link} ${isActive ? styles.active : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                {item.label}
                {item.isBadge && <span className={styles.badge}>{item.isBadge}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
