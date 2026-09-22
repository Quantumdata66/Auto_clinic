import React from "react";
import { Wrench, Cpu, CheckCircle2, Shield, Target, Activity } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function AboutPage() {
  return (
    <PageContainer
      title="About Auto Clinic"
      subtitle="Bridging practical automotive workshop diagnostics and professional diagnostic equipment retail in Nigeria."
      breadcrumbs={[{ label: "About Auto Clinic" }]}
      maxWidth="default"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--ac-space-8)" }}>
        {/* Core Mission Panel */}
        <div className="ac-panel-technical" style={{ padding: "var(--ac-space-8)" }}>
          <span className="ac-eyebrow">OUR MANDATE</span>
          <h2 style={{ fontSize: "var(--ac-text-2xl)", fontWeight: 800, color: "var(--ac-text-primary)", textTransform: "uppercase", margin: "var(--ac-space-2) 0 var(--ac-space-4) 0" }}>
            PRACTICAL DIAGNOSTICS &amp; FIELD-TESTED AUTOMOTIVE GEAR
          </h2>
          <p style={{ color: "var(--ac-text-secondary)", fontSize: "var(--ac-text-sm)", lineHeight: "var(--ac-leading-relaxed)", margin: 0 }}>
            Modern vehicles are complex distributed networks of electronic control units (ECUs), sensors, and electromechanical actuators. 
            Auto Clinic was established to address the critical gap in precision automotive triage in Nigeria. 
            We provide motorists with transparent in-person fault diagnostics at our workshop, and equip professional technicians, fleet operators, and enthusiast DIYers with verified, commercial-grade tools.
          </p>
        </div>

        {/* Operating Pillars */}
        <div className="ac-grid ac-grid-2">
          <Card accentBorder title="1. Physical Diagnostic Workshop" subtitle="IN-BAY TRIAGE">
            <p style={{ fontSize: "var(--ac-text-xs)", color: "var(--ac-text-secondary)", lineHeight: "var(--ac-leading-normal)", margin: 0 }}>
              Rather than replacing parts blindly, our workshop applies protocol-driven diagnostic routines (OBD2 data stream monitoring, oscilloscope wave analysis, compression and smoke testing) to pinpoint exact failure roots. Appointments are organized via structured enquiries and scheduled consultations.
            </p>
          </Card>

          <Card accentBorder title="2. Verified Automotive Store" subtitle="DIRECT HARDWARE SUPPLY">
            <p style={{ fontSize: "var(--ac-text-xs)", color: "var(--ac-text-secondary)", lineHeight: "var(--ac-leading-normal)", margin: 0 }}>
              We curate diagnostic scanners, battery analyzers, torque tools, and safety gear with full technical transparency. Every item includes verified voltage tolerances, supported vehicle communication protocols, and honest capabilities.
            </p>
          </Card>
        </div>

        {/* Commitment to Transparency */}
        <div className="ac-panel">
          <h3 style={{ fontSize: "var(--ac-text-lg)", fontWeight: 700, color: "var(--ac-text-primary)", marginBottom: "var(--ac-space-3)" }}>
            Our Operational Standards
          </h3>
          <ul style={{ display: "flex", flexDirection: "column", gap: "var(--ac-space-2)", listStyle: "none" }}>
            <li style={{ display: "flex", alignItems: "flex-start", gap: "var(--ac-space-2)", fontSize: "var(--ac-text-xs)", color: "var(--ac-text-secondary)" }}>
              <CheckCircle2 size={16} style={{ color: "var(--ac-status-success)", flexShrink: 0, marginTop: "2px" }} />
              <span><strong>Transparent Pricing:</strong> All catalog prices are stated clearly in Nigerian Naira (NGN) without hidden checkout markups.</span>
            </li>
            <li style={{ display: "flex", alignItems: "flex-start", gap: "var(--ac-space-2)", fontSize: "var(--ac-text-xs)", color: "var(--ac-text-secondary)" }}>
              <CheckCircle2 size={16} style={{ color: "var(--ac-status-success)", flexShrink: 0, marginTop: "2px" }} />
              <span><strong>Dual-Channel Accessibility:</strong> Customers can transact via traditional secure web checkout or chat directly with support on WhatsApp.</span>
            </li>
            <li style={{ display: "flex", alignItems: "flex-start", gap: "var(--ac-space-2)", fontSize: "var(--ac-text-xs)", color: "var(--ac-text-secondary)" }}>
              <CheckCircle2 size={16} style={{ color: "var(--ac-status-success)", flexShrink: 0, marginTop: "2px" }} />
              <span><strong>Pre-Screened Appointments:</strong> Diagnostic bay slots are assigned after reviewing vehicle symptoms, ensuring technicians have necessary tooling ready upon arrival.</span>
            </li>
          </ul>
        </div>

        {/* Action Prompt */}
        <div style={{ display: "flex", justifyContent: "center", gap: "var(--ac-space-4)", paddingTop: "var(--ac-space-4)" }}>
          <Button href="/shop" variant="primary" size="lg">
            Explore Store Catalog
          </Button>
          <Button href="/diagnostics" variant="outline" size="lg">
            Request Diagnostic Consultation
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
