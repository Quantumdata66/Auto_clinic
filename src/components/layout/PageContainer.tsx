import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { BreadcrumbItem } from "@/types";
import styles from "./PageContainer.module.css";

export interface PageContainerProps {
  title?: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: "narrow" | "default" | "wide";
  className?: string;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  title,
  subtitle,
  breadcrumbs,
  actions,
  children,
  maxWidth = "default",
  className = "",
}) => {
  return (
    <div className={`${styles.page} ${className}`}>
      {(breadcrumbs || title) && (
        <div className={styles.headerSection}>
          <div className={`ac-container ${maxWidth === "wide" ? "ac-container-wide" : maxWidth === "narrow" ? "ac-container-narrow" : ""}`}>
            {breadcrumbs && breadcrumbs.length > 0 && (
              <nav aria-label="Breadcrumb" className={styles.breadcrumbNav}>
                <ol className={styles.breadcrumbList}>
                  <li className={styles.breadcrumbItem}>
                    <Link href="/" className={styles.breadcrumbLink}>
                      Home
                    </Link>
                  </li>
                  {breadcrumbs.map((item, index) => {
                    const isLast = index === breadcrumbs.length - 1;
                    return (
                      <li key={`${item.label}-${index}`} className={styles.breadcrumbItem}>
                        <ChevronRight size={12} className={styles.breadcrumbSeparator} aria-hidden="true" />
                        {isLast || !item.href ? (
                          <span className={styles.breadcrumbCurrent} aria-current="page">
                            {item.label}
                          </span>
                        ) : (
                          <Link href={item.href} className={styles.breadcrumbLink}>
                            {item.label}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </nav>
            )}

            {title && (
              <div className={styles.titleRow}>
                <div className={styles.titleBlock}>
                  <h1 className={styles.title}>{title}</h1>
                  {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
                </div>
                {actions && <div className={styles.actions}>{actions}</div>}
              </div>
            )}
          </div>
        </div>
      )}

      <main className={`ac-container ${maxWidth === "wide" ? "ac-container-wide" : maxWidth === "narrow" ? "ac-container-narrow" : ""} ${styles.mainContent}`}>
        {children}
      </main>
    </div>
  );
};
