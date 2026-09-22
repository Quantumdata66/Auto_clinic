import React from "react";
import { AlertOctagon, RotateCcw } from "lucide-react";
import { Button } from "./Button";
import styles from "./ErrorState.module.css";

export interface ErrorStateProps {
  title?: string;
  message: string;
  retryLabel?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "SYSTEM FAULT DETECTED",
  message,
  retryLabel = "RETRY OPERATION",
  onRetry,
  className = "",
}) => {
  return (
    <div className={`${styles.container} ${className}`} role="alert">
      <div className={styles.iconCircle}>
        <AlertOctagon size={36} className={styles.icon} />
      </div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.message}>{message}</p>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          leftIcon={<RotateCcw size={16} />}
        >
          {retryLabel}
        </Button>
      )}
    </div>
  );
};
