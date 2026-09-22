import React from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { DiagnosticServiceCard } from "@/components/workshop/DiagnosticServiceCard";
import { DiagnosticEnquiryForm } from "@/components/workshop/DiagnosticEnquiryForm";
import { getDiagnosticServices } from "@/lib/services/catalogue";
import styles from "./Diagnostics.module.css";

export default async function DiagnosticsPage() {
  const services = await getDiagnosticServices({ activeOnly: true });

  return (
    <PageContainer
      title="Workshop Diagnostics & Vehicle Triage"
      subtitle="In-person electronic fault scanning, parasitic drain testing, and mechanical health assessments at our physical workshop in Nigeria."
      breadcrumbs={[{ label: "Workshop Diagnostics" }]}
      maxWidth="wide"
    >
      <div className={styles.diagLayout}>
        {/* Left Column: Diagnostic Service Offerings */}
        <div className={styles.servicesColumn}>
          <div className={styles.sectionHeader}>
            <span className="ac-eyebrow">DIAGNOSTIC PROTOCOLS</span>
            <h2 className={styles.columnTitle}>WORKSHOP DIAGNOSTIC CAPABILITIES</h2>
            <p className={styles.columnDesc}>
              Select a service profile below to review scope, or complete the enquiry form to have our technicians analyze your specific symptoms.
            </p>
          </div>

          <div className="ac-grid ac-grid-1">
            {services.map((service) => (
              <DiagnosticServiceCard key={service.id} service={service} />
            ))}
          </div>
        </div>

        {/* Right Column: Diagnostic Enquiry Form */}
        <div className={styles.formColumn}>
          <div className={styles.stickyFormWrapper}>
            <DiagnosticEnquiryForm />
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
