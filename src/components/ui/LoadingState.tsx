import React from "react";
import styles from "./LoadingState.module.css";

export interface LoadingStateProps {
  label?: string;
  size?: "sm" | "md" | "lg";
  fullPage?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  label = "INITIALIZING DIAGNOSTIC TELEMETRY...",
  size = "md",
  fullPage = false,
}) => {
  return (
    <div
      className={`${styles.container} ${fullPage ? styles.fullPage : ""}`}
      role="status"
      aria-live="polite"
    >
      <div className={`${styles.scannerRing} ${styles[size]}`}>
        <div className={styles.innerCore} />
      </div>
      <p className={styles.label}>{label}</p>
    </div>
  );
};
