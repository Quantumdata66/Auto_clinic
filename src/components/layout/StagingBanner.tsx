"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import styles from "./StagingBanner.module.css";

export const StagingBanner: React.FC = () => {
  const showBanner = process.env.NEXT_PUBLIC_SHOW_STAGING_BANNER === "true";

  if (!showBanner) {
    return null;
  }

  return (
    <aside className={styles.banner} aria-label="Staging Environment and Demonstration Mode Notice">
      <div className="ac-container">
        <div className={styles.inner}>
          <div className={styles.iconWrap} aria-hidden="true">
            <AlertTriangle size={15} />
          </div>
          <div className={styles.content}>
            <strong className={styles.title}>STAGING PREVIEW &amp; DEMO MODE:</strong>{" "}
            <span>
              This website is an internal staging review build. Catalogue products, pricing, and workshop appointments are currently in demonstration mode. Online payment processing is disabled (orders are registered as unpaid test reservations), and physical workshop walk-in service is not available without prior confirmed triage.
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
