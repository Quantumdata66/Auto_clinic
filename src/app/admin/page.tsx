import React from "react";
import Link from "next/link";
import { Shield, Package, Wrench, AlertTriangle, Users, Activity, CheckCircle2, ArrowRight } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MOCK_PRODUCTS, MOCK_DIAGNOSTIC_SERVICES } from "@/data/mockData";

export default function AdminDashboardPage() {
  return (
    <PageContainer
      title="Admin & Workshop Staff Portal"
      subtitle="Operational telemetry, inventory controls, and diagnostic appointment queue."
      breadcrumbs={[{ label: "Admin Portal" }]}
      maxWidth="wide"
      actions={
        <Badge variant="amber" isMonospace size="md">
          STAFF ACCESS ONLY
        </Badge>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--ac-space-8)" }}>
        {/* Metric Cards */}
        <div className="ac-grid ac-grid-4">
          <Card accentBorder title="ACTIVE INVENTORY" subtitle="CATALOG ITEMS">
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
              <span className="ac-mono" style={{ fontSize: "var(--ac-text-3xl)", fontWeight: 800, color: "var(--ac-text-primary)" }}>
                {MOCK_PRODUCTS.length}
              </span>
              <span style={{ fontSize: "11px", color: "var(--ac-status-success)" }}>● All Synchronized</span>
            </div>
          </Card>

          <Card accentBorder title="DIAGNOSTIC ENQUIRIES" subtitle="WORKSHOP QUEUE">
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
              <span className="ac-mono" style={{ fontSize: "var(--ac-text-3xl)", fontWeight: 800, color: "var(--ac-accent-amber)" }}>
                3
              </span>
              <span style={{ fontSize: "11px", color: "var(--ac-accent-amber)" }}>Awaiting Phone/WA Call</span>
            </div>
          </Card>

          <Card accentBorder title="LOW STOCK ALERTS" subtitle="RE-ORDER THRESHOLD">
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
              <span className="ac-mono" style={{ fontSize: "var(--ac-text-3xl)", fontWeight: 800, color: "var(--ac-status-danger)" }}>
                2
              </span>
              <span style={{ fontSize: "11px", color: "var(--ac-status-danger)" }}>Action Needed</span>
            </div>
          </Card>

          <Card accentBorder title="SECURITY BOUNDARY" subtitle="AUTHORIZATION RBAC">
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
              <span className="ac-mono" style={{ fontSize: "var(--ac-text-base)", fontWeight: 700, color: "var(--ac-text-primary)" }}>
                ISOLATED
              </span>
              <span style={{ fontSize: "11px", color: "var(--ac-status-success)" }}>Phase 2 Scaffold</span>
            </div>
          </Card>
        </div>

        {/* Diagnostic Queue Preview */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "var(--ac-space-8)" }}>
          <Card
            hazardStripe
            title="PENDING WORKSHOP DIAGNOSTIC ENQUIRIES"
            subtitle="Triage submissions requiring customer contact and bay scheduling"
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--ac-space-3)" }}>
              <div className="ac-panel" style={{ backgroundColor: "var(--ac-bg-base)", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--ac-space-3)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--ac-space-2)" }}>
                    <span className="ac-mono" style={{ fontSize: "11px", fontWeight: 700, color: "var(--ac-accent-amber)" }}>
                      AC-ENQ-492011
                    </span>
                    <Badge variant="amber" isMonospace size="sm">PENDING CONTACT</Badge>
                  </div>
                  <span style={{ fontSize: "var(--ac-text-xs)", color: "var(--ac-text-primary)", fontWeight: 600 }}>
                    2017 Toyota Camry — Check Engine Light + Transmission Harsh Shift
                  </span>
                  <span style={{ fontSize: "11px", color: "var(--ac-text-muted)" }}>
                    Customer: Bamidele K. (WhatsApp: 0803xxxxxxx) • Target: ECU Scan &amp; Live Data
                  </span>
                </div>
                <Button variant="whatsapp" size="sm">
                  Contact on WhatsApp
                </Button>
              </div>

              <div className="ac-panel" style={{ backgroundColor: "var(--ac-bg-base)", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--ac-space-3)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--ac-space-2)" }}>
                    <span className="ac-mono" style={{ fontSize: "11px", fontWeight: 700, color: "var(--ac-accent-amber)" }}>
                      AC-ENQ-492012
                    </span>
                    <Badge variant="blue" isMonospace size="sm">IN REVIEW</Badge>
                  </div>
                  <span style={{ fontSize: "var(--ac-text-xs)", color: "var(--ac-text-primary)", fontWeight: 600 }}>
                    2019 Mercedes-Benz C300 — Battery Drain overnight / Parasitic Draw
                  </span>
                  <span style={{ fontSize: "11px", color: "var(--ac-text-muted)" }}>
                    Customer: Emeka N. (Phone: 0812xxxxxxx) • Target: Electrical System Triage
                  </span>
                </div>
                <Button variant="outline" size="sm">
                  Assign Mechanic Bay
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
