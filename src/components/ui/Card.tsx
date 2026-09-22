import React from "react";
import styles from "./Card.module.css";

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  hazardStripe?: boolean;
  accentBorder?: boolean;
  headerAction?: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  footer?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  hazardStripe = false,
  accentBorder = false,
  headerAction,
  title,
  subtitle,
  footer,
  className = "",
  ...props
}) => {
  return (
    <div
      className={`${styles.card} ${hazardStripe ? styles.hazardTop : ""} ${
        accentBorder ? styles.accentBorder : ""
      } ${className}`}
      {...props}
    >
      {(title || headerAction || subtitle) && (
        <div className={styles.header}>
          <div className={styles.titleWrapper}>
            {title && <h3 className={styles.title}>{title}</h3>}
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          {headerAction && <div className={styles.action}>{headerAction}</div>}
        </div>
      )}
      <div className={styles.body}>{children}</div>
      {footer && <div className={styles.footer}>{footer}</div>}
    </div>
  );
};
