import React, { forwardRef } from "react";
import styles from "./Checkbox.module.css";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: React.ReactNode;
  helperText?: string;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, helperText, error, id, className = "", disabled, ...props }, ref) => {
    const checkboxId = id || (typeof label === "string" ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className={`${styles.container} ${className}`}>
        <label htmlFor={checkboxId} className={`${styles.label} ${disabled ? styles.isDisabled : ""}`}>
          <input
            ref={ref}
            id={checkboxId}
            type="checkbox"
            className={styles.input}
            disabled={disabled}
            aria-invalid={!!error}
            {...props}
          />
          <span className={styles.customCheck} aria-hidden="true" />
          <span className={styles.labelText}>{label}</span>
        </label>
        {helperText && <p className={styles.helperText}>{helperText}</p>}
        {error && <p className={styles.errorText}>{error}</p>}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";
