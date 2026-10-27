"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Wrench, MessageCircle, ShieldCheck, ShoppingBag } from "lucide-react";
import { NAV_ITEMS } from "./Navigation";
import { Button } from "../ui/Button";
import styles from "./MobileNavigation.module.css";

import { generateGeneralEnquiryWhatsAppUrl } from "@/lib/utils/whatsapp";

export interface MobileNavigationProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on route change
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  if (!isOpen) return null;

  const whatsappUrl = generateGeneralEnquiryWhatsAppUrl();

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={styles.drawer}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <div className={styles.logoBlock}>
            <div className={styles.emblem}>
              <Wrench size={18} className={styles.emblemIcon} />
            </div>
            <span className={styles.brandTitle}>AUTO CLINIC</span>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className={styles.body}>
          <span className={styles.menuHeading}>PORTAL NAVIGATION</span>
          <nav className={styles.nav}>
            <ul className={styles.list}>
              {NAV_ITEMS.map((item) => {
                const isActive =
                  item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`${styles.link} ${isActive ? styles.activeLink : ""}`}
                      onClick={onClose}
                    >
                      <span>{item.label}</span>
                      {item.isBadge && <span className={styles.badge}>{item.isBadge}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className={styles.quickLinks}>
            <span className={styles.menuHeading}>CUSTOMER UTILITIES</span>
            <div className={styles.utilLinks}>
              <Link href="/track" className={styles.utilLink} onClick={onClose}>
                <ShoppingBag size={16} />
                <span>Track Order / Enquiry</span>
              </Link>
              <Link href="/admin" className={styles.utilLink} onClick={onClose}>
                <ShieldCheck size={16} />
                <span>Business Admin</span>
              </Link>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <Button
            href={whatsappUrl}
            isExternal={Boolean(whatsappUrl)}
            variant="whatsapp"
            size="md"
            leftIcon={<MessageCircle size={16} />}
            className={styles.fullWidthBtn}
            aria-label="Contact Auto Clinic on WhatsApp"
          >
            Chat on WhatsApp
          </Button>
          <p className={styles.disclaimer}>
            Nigeria Automotive Workshop &amp; Tools Store
          </p>
        </div>
      </div>
    </div>
  );
};
