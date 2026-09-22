import React from "react";
import { PackageOpen } from "lucide-react";
import { Button } from "./Button";
import styles from "./EmptyState.module.css";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className = "",
}) => {
  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.iconCircle}>
        {icon || <PackageOpen size={36} className={styles.defaultIcon} />}
      </div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
      {actionLabel && (
        <div className={styles.actionWrapper}>
          {actionHref ? (
            <Button href={actionHref} variant="primary">
              {actionLabel}
            </Button>
          ) : (
            <Button onClick={onAction} variant="primary">
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
