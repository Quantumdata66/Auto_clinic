import React from "react";
import styles from "./SectionWrapper.module.css";

export interface SectionWrapperProps {
  id?: string;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  hazardBorderTop?: boolean;
  background?: "base" | "surface" | "elevated";
  className?: string;
}

export const SectionWrapper: React.FC<SectionWrapperProps> = ({
  id,
  eyebrow,
  title,
  subtitle,
  actions,
  children,
  hazardBorderTop = false,
  background = "base",
  className = "",
}) => {
  return (
    <section
      id={id}
      className={`${styles.section} ${styles[background]} ${
        hazardBorderTop ? styles.hazardTop : ""
      } ${className}`}
    >
      <div className="ac-container">
        {(eyebrow || title || actions) && (
          <div className={styles.header}>
            <div className={styles.titleArea}>
              {eyebrow && <span className="ac-eyebrow">{eyebrow}</span>}
              {title && <h2 className={styles.title}>{title}</h2>}
              {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
            </div>
            {actions && <div className={styles.actions}>{actions}</div>}
          </div>
        )}
        <div className={styles.content}>{children}</div>
      </div>
    </section>
  );
};
