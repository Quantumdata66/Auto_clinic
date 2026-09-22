import React from "react";
import styles from "./Badge.module.css";

export type BadgeVariant = "amber" | "green" | "red" | "blue" | "neutral" | "outline";
export type BadgeSize = "sm" | "md";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  isMonospace?: boolean;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "neutral",
  size = "md",
  isMonospace = false,
  dot = false,
  className = "",
  ...props
}) => {
  const classNames = [
    styles.badge,
    styles[variant],
    styles[size],
    isMonospace ? styles.mono : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classNames} {...props}>
      {dot && <span className={styles.dot} aria-hidden="true" />}
      {children}
    </span>
  );
};
