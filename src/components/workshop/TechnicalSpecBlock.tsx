import React from "react";
import { ProductSpec } from "@/types";
import styles from "./TechnicalSpecBlock.module.css";

export interface TechnicalSpecBlockProps {
  title?: string;
  specs: ProductSpec[];
  className?: string;
}

export const TechnicalSpecBlock: React.FC<TechnicalSpecBlockProps> = ({
  title = "TECHNICAL DATA & SPECIFICATIONS",
  specs,
  className = "",
}) => {
  return (
    <div className={`${styles.container} ${className}`}>
      {title && (
        <div className={styles.header}>
          <span className={styles.headerIndicator} aria-hidden="true" />
          <h4 className={styles.title}>{title}</h4>
        </div>
      )}
      <table className={styles.table}>
        <tbody>
          {specs.map((spec, index) => (
            <tr key={`${spec.label}-${index}`} className={styles.row}>
              <th scope="row" className={styles.labelCell}>
                {spec.label}
              </th>
              <td className={`${styles.valueCell} ${spec.isMonospace ? styles.mono : ""}`}>
                {spec.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
