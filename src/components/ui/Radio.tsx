import React, { forwardRef } from "react";
import styles from "./Radio.module.css";

export interface RadioOption {
  value: string;
  label: React.ReactNode;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name: string;
  label?: string;
  options: RadioOption[];
  selectedValue?: string;
  onChange?: (value: string) => void;
  error?: string;
  className?: string;
  disabled?: boolean;
}

export const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ name, label, options, selectedValue, onChange, error, className = "", disabled }, ref) => {
    return (
      <div ref={ref} className={`${styles.container} ${className}`} role="radiogroup" aria-label={label}>
        {label && <span className={styles.groupLabel}>{label}</span>}
        <div className={styles.optionsList}>
          {options.map((option) => {
            const isChecked = selectedValue === option.value;
            const isOptionDisabled = disabled || option.disabled;
            const optionId = `${name}-${option.value}`;

            return (
              <label
                key={option.value}
                htmlFor={optionId}
                className={`${styles.radioCard} ${isChecked ? styles.selected : ""} ${
                  isOptionDisabled ? styles.disabled : ""
                }`}
              >
                <input
                  id={optionId}
                  type="radio"
                  name={name}
                  value={option.value}
                  checked={isChecked}
                  disabled={isOptionDisabled}
                  onChange={() => onChange && onChange(option.value)}
                  className={styles.nativeRadio}
                />
                <span className={styles.customRadio} aria-hidden="true" />
                <div className={styles.content}>
                  <span className={styles.optionLabel}>{option.label}</span>
                  {option.description && <span className={styles.optionDesc}>{option.description}</span>}
                </div>
              </label>
            );
          })}
        </div>
        {error && <p className={styles.errorText} role="alert">{error}</p>}
      </div>
    );
  }
);

RadioGroup.displayName = "RadioGroup";
