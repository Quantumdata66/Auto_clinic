import React, { forwardRef } from "react";
import styles from "./Select.module.css";

export interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options: Option[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      helperText,
      error,
      options,
      id,
      className = "",
      required,
      disabled,
      ...props
    },
    ref
  ) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className={`${styles.container} ${className}`}>
        {label && (
          <label htmlFor={selectId} className={styles.label}>
            {label}
            {required && <span className={styles.required}>*</span>}
          </label>
        )}
        <div className={`${styles.selectWrapper} ${error ? styles.hasError : ""} ${disabled ? styles.isDisabled : ""}`}>
          <select
            ref={ref}
            id={selectId}
            className={styles.select}
            disabled={disabled}
            required={required}
            aria-invalid={!!error}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          <span className={styles.arrow} aria-hidden="true">
            ▼
          </span>
        </div>
        {error && (
          <p className={styles.errorText} role="alert">
            {error}
          </p>
        )}
        {!error && helperText && <p className={styles.helperText}>{helperText}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
