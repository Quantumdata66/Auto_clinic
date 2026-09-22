"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Wrench, Menu, MessageCircle, User, Shield } from "lucide-react";
import { Navigation } from "./Navigation";
import { MobileNavigation } from "./MobileNavigation";
import { CartTrigger } from "../commerce/CartTrigger";
import { Button } from "../ui/Button";
import styles from "./Header.module.css";

export const Header: React.FC = () => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "2340000000000";
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    "Hello Auto Clinic, I would like to enquire about workshop diagnostics & automotive tools."
  )}`;

  return (
    <header className={styles.header}>
      {/* Top Industrial Hazard Stripe */}
      <div className={styles.hazardStripe} aria-hidden="true" />

      {/* Top Notification / Telemetry Utility Bar */}
      <div className={styles.topBar}>
        <div className="ac-container">
          <div className={styles.topBarInner}>
            <div className={styles.topNotice}>
              <span className={styles.liveIndicator} aria-hidden="true" />
              <span className={styles.topNoticeText}>
                WORKSHOP &amp; STORE: In-Person Diagnostics &amp; Direct Tool Ordering across Nigeria (NGN)
              </span>
            </div>
            <div className={styles.topUtilities}>
              <Link href="/account" className={styles.topUtilLink}>
                <User size={12} />
                <span>Customer Portal</span>
              </Link>
              <span className={styles.divider} aria-hidden="true">|</span>
              <Link href="/admin" className={styles.topUtilLink}>
                <Shield size={12} />
                <span>Staff Access</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className={styles.mainNav}>
        <div className="ac-container">
          <div className={styles.mainNavInner}>
            {/* Logo / Brand Emblem */}
            <Link href="/" className={styles.logoLink} aria-label="Auto Clinic Home">
              <div className={styles.logoEmblem}>
                <Wrench size={22} className={styles.logoIcon} />
              </div>
              <div className={styles.brandTextBlock}>
                <span className={styles.brandName}>AUTO CLINIC</span>
                <span className={styles.brandTagline}>DIAGNOSTICS &amp; AUTOMOTIVE GEAR</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className={styles.desktopNavWrapper}>
              <Navigation />
            </div>

            {/* Right Action Icons & Buttons */}
            <div className={styles.rightActions}>
              <Button
                href={whatsappUrl}
                isExternal
                variant="whatsapp"
                size="sm"
                leftIcon={<MessageCircle size={14} />}
                className={styles.desktopWhatsAppBtn}
              >
                WhatsApp
              </Button>

              <CartTrigger itemCount={0} />

              <button
                type="button"
                className={styles.mobileMenuToggle}
                onClick={() => setIsMobileNavOpen(true)}
                aria-label="Open mobile menu"
                aria-expanded={isMobileNavOpen}
              >
                <Menu size={22} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Off-canvas Mobile Drawer */}
      <MobileNavigation
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
      />
    </header>
  );
};
