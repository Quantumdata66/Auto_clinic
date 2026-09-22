import React from "react";
import Link from "next/link";
import { Clock, CheckCircle, ArrowRight } from "lucide-react";
import { DiagnosticService } from "@/types";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import styles from "./DiagnosticServiceCard.module.css";

export interface DiagnosticServiceCardProps {
  service: DiagnosticService;
  className?: string;
}

export const DiagnosticServiceCard: React.FC<DiagnosticServiceCardProps> = ({
  service,
  className = "",
}) => {
  return (
    <div className={`${styles.card} ${className}`}>
      <div className={styles.header}>
        <div className={styles.topMeta}>
          <Badge variant="amber" isMonospace size="sm">
            {service.code}
          </Badge>
          <span className={styles.duration}>
            <Clock size={12} />
            {service.estimatedDuration}
          </span>
        </div>
        <h3 className={styles.title}>{service.name}</h3>
      </div>

      <div className={styles.body}>
        <p className={styles.summary}>{service.shortSummary}</p>

        <div className={styles.recommendationBox}>
          <span className={styles.boxLabel}>INDICATED WHEN:</span>
          <p className={styles.boxText}>{service.recommendedWhen}</p>
        </div>

        <div className={styles.systemsSection}>
          <span className={styles.systemsLabel}>TARGET VEHICLE SYSTEMS:</span>
          <div className={styles.systemTags}>
            {service.targetSystems.map((sys) => (
              <span key={sys} className={styles.systemTag}>
                <CheckCircle size={10} className={styles.checkIcon} />
                {sys}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.feeInfo}>
          <span className={styles.feeLabel}>WORKSHOP ESTIMATE</span>
          <span className={styles.feeValue}>{service.indicativeFee}</span>
        </div>

        <Button
          href={`/diagnostics?service=${service.slug}`}
          variant="primary"
          size="sm"
          rightIcon={<ArrowRight size={14} />}
        >
          Enquire
        </Button>
      </div>
    </div>
  );
};
