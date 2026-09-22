"use client";

import React, { useState } from "react";
import { Search, Package, Wrench, CheckCircle2, Clock, Truck, Store } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { RadioGroup } from "@/components/ui/Radio";

export default function TrackPage() {
  const [trackType, setTrackType] = useState<"ORDER" | "DIAGNOSTIC">("ORDER");
  const [refNumber, setRefNumber] = useState("");
  const [contact, setContact] = useState("");
  const [result, setResult] = useState<boolean>(false);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (refNumber) {
      setResult(true);
    }
  };

  return (
    <PageContainer
      title="Track Order & Diagnostic Status"
      subtitle="Lookup real-time fulfilment status for store orders or diagnostic enquiry progress for workshop appointments."
      breadcrumbs={[{ label: "Status Tracker" }]}
      maxWidth="default"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--ac-space-8)" }}>
        {/* Lookup Form */}
        <Card hazardStripe title="STATUS LOOKUP MATRIX" subtitle="Enter your tracking identifier">
          <form onSubmit={handleLookup} style={{ display: "flex", flexDirection: "column", gap: "var(--ac-space-4)" }}>
            <RadioGroup
              name="trackType"
              label="Select Tracking Category"
              selectedValue={trackType}
              onChange={(val) => {
                setTrackType(val as "ORDER" | "DIAGNOSTIC");
                setResult(false);
              }}
              options={[
                {
                  value: "ORDER",
                  label: "Automotive Store Order",
                  description: "Track shipment dispatch, delivery courier, or workshop collection readiness.",
                },
                {
                  value: "DIAGNOSTIC",
                  label: "Workshop Diagnostic Enquiry",
                  description: "Track technician review status, triage evaluation, and scheduled arrival bay slot.",
                },
              ]}
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--ac-space-3)" }}>
              <Input
                label={trackType === "ORDER" ? "Order Number" : "Diagnostic Reference Code"}
                placeholder={trackType === "ORDER" ? "e.g. AC-ORD-2026-001" : "e.g. AC-ENQ-829104"}
                value={refNumber}
                onChange={(e) => setRefNumber(e.target.value)}
                isMonospace
                required
              />
              <Input
                label="Registered Phone or Email"
                placeholder="e.g. 08012345678 or email"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                required
              />
            </div>

            <Button type="submit" variant="primary" size="md" leftIcon={<Search size={16} />}>
              Lookup Current Status
            </Button>
          </form>
        </Card>

        {/* Demo Result Display */}
        {result && (
          <Card
            accentBorder
            title={trackType === "ORDER" ? `ORDER STATUS: ${refNumber.toUpperCase()}` : `DIAGNOSTIC ENQUIRY: ${refNumber.toUpperCase()}`}
            subtitle="Authoritative server status snapshot"
            headerAction={<Badge variant="amber" isMonospace size="sm">IN REVIEW</Badge>}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--ac-space-4)" }}>
              <div className="ac-panel" style={{ backgroundColor: "var(--ac-bg-base)", padding: "var(--ac-space-3)" }}>
                <span className="ac-mono" style={{ fontSize: "11px", color: "var(--ac-accent-amber)", display: "block", marginBottom: "4px" }}>
                  CURRENT OPERATIONAL STAGE:
                </span>
                <p style={{ fontSize: "var(--ac-text-sm)", color: "var(--ac-text-primary)", margin: 0 }}>
                  {trackType === "ORDER"
                    ? "Order received and validated. Items are being packed for courier dispatch / workshop collection."
                    : "Vehicle symptoms profile logged. Lead workshop technician is reviewing diagnostic scope prior to WhatsApp/phone appointment confirmation."}
                </p>
              </div>

              {/* Status Timeline */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--ac-space-3)", marginTop: "var(--ac-space-2)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px", borderTop: "2px solid var(--ac-status-success)", paddingTop: "var(--ac-space-2)" }}>
                  <span className="ac-mono" style={{ fontSize: "10px", color: "var(--ac-status-success)", fontWeight: 700 }}>01. SUBMITTED</span>
                  <span style={{ fontSize: "11px", color: "var(--ac-text-secondary)" }}>Logged in system</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px", borderTop: "2px solid var(--ac-accent-amber)", paddingTop: "var(--ac-space-2)" }}>
                  <span className="ac-mono" style={{ fontSize: "10px", color: "var(--ac-accent-amber)", fontWeight: 700 }}>02. PROCESSING</span>
                  <span style={{ fontSize: "11px", color: "var(--ac-text-primary)", fontWeight: 600 }}>Active Triage</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px", borderTop: "2px solid var(--ac-border-default)", paddingTop: "var(--ac-space-2)" }}>
                  <span className="ac-mono" style={{ fontSize: "10px", color: "var(--ac-text-muted)", fontWeight: 700 }}>03. FULFILLED</span>
                  <span style={{ fontSize: "11px", color: "var(--ac-text-muted)" }}>Completed</span>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
