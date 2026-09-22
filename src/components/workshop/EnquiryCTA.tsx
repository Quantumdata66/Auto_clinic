import React from "react";
import Link from "next/link";
import { Wrench, PhoneCall, MessageCircle, ArrowRight } from "lucide-react";
import { Button } from "../ui/Button";
import styles from "./EnquiryCTA.module.css";

export interface EnquiryCTAProps {
  className?: string;
}

export const EnquiryCTA: React.FC<EnquiryCTAProps> = ({ className = "" }) => {
  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.inner}>
        <div className={styles.content}>
          <div className={styles.badgeRow}>
            <span className={styles.badge}>WORKSHOP DIAGNOSTICS & TRIAGE</span>
          </div>
          <h2 className={styles.title}>
            Experiencing Electrical, ECU, or Mechanical Faults?
          </h2>
          <p className={styles.description}>
            Auto Clinic provides physical workshop diagnostic sessions for pinpoint fault isolation. 
            Submit a diagnostic enquiry with your vehicle details and observed symptoms. Our technicians 
            will review the telemetry and contact you directly via phone or WhatsApp to confirm an arrival appointment slot.
          </p>
          <div className={styles.noticeBox}>
            <span className={styles.noticeTitle}>APPOINTMENT WORKFLOW:</span>
            <p className={styles.noticeText}>
              1. Submit online enquiry &nbsp;→&nbsp; 2. Technician reviews symptoms &nbsp;→&nbsp; 3. Appointment scheduled via WhatsApp / Phone
            </p>
          </div>
        </div>

        <div className={styles.actionStack}>
          <Button
            href="/diagnostics"
            variant="primary"
            size="lg"
            rightIcon={<ArrowRight size={16} />}
          >
            Submit Diagnostic Enquiry
          </Button>
          <Button
            href="/contact"
            variant="outline"
            size="md"
            leftIcon={<PhoneCall size={16} />}
          >
            Workshop Contact Details
          </Button>
        </div>
      </div>
    </div>
  );
};
