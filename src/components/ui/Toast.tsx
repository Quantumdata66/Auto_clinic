import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";
import styles from "./Toast.module.css";

export type ToastType = "success" | "warning" | "danger" | "error" | "info";

export interface ToastProps {
  type?: ToastType;
  title: string;
  message?: string;
  onDismiss?: () => void;
  className?: string;
}

export const Toast: React.FC<ToastProps> = ({
  type = "info",
  title,
  message,
  onDismiss,
  className = "",
}) => {
  const normalizedType = type === "error" ? "danger" : type;

  const icons = {
    success: <CheckCircle2 size={20} className={styles.successIcon} />,
    warning: <AlertTriangle size={20} className={styles.warningIcon} />,
    danger: <XCircle size={20} className={styles.dangerIcon} />,
    error: <XCircle size={20} className={styles.dangerIcon} />,
    info: <Info size={20} className={styles.infoIcon} />,
  };

  return (
    <div className={`${styles.toast} ${styles[normalizedType]} ${className}`} role="status">
      <div className={styles.iconWrapper}>{icons[type]}</div>
      <div className={styles.content}>
        <h4 className={styles.title}>{title}</h4>
        {message && <p className={styles.message}>{message}</p>}
      </div>
      {onDismiss && (
        <button
          type="button"
          className={styles.dismissBtn}
          onClick={onDismiss}
          aria-label="Dismiss notification"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};
