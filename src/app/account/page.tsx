import React from "react";
import { User, Shield, Package, Wrench, ArrowRight } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function AccountPage() {
  return (
    <PageContainer
      title="Customer Portal"
      subtitle="Access your order history, tracked diagnostic enquiries, and saved workshop vehicles."
      breadcrumbs={[{ label: "Customer Portal" }]}
      maxWidth="narrow"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--ac-space-6)" }}>
        <Card hazardStripe title="CUSTOMER LOGIN / SIGN UP" subtitle="Optional customer accounts">
          <form style={{ display: "flex", flexDirection: "column", gap: "var(--ac-space-4)" }}>
            <Input
              label="Email Address or Phone Number"
              type="text"
              placeholder="e.g. customer@example.com or 080..."
              required
            />
            <Input
              label="Password / One-Time Passcode"
              type="password"
              placeholder="••••••••"
              required
            />
            <Button type="button" variant="primary" size="md" style={{ width: "100%" }}>
              Sign In to Account
            </Button>
            <p style={{ fontSize: "11px", color: "var(--ac-text-muted)", textAlign: "center", margin: 0 }}>
              Accounts are optional. You can always place orders and book diagnostic enquiries as a guest.
            </p>
          </form>
        </Card>

        {/* Quick Portal Overview */}
        <div className="ac-panel">
          <h4 style={{ fontSize: "var(--ac-text-sm)", fontWeight: 700, color: "var(--ac-text-primary)", marginBottom: "var(--ac-space-3)" }}>
            PORTAL CAPABILITIES (PHASE 2 PREVIEW)
          </h4>
          <ul style={{ display: "flex", flexDirection: "column", gap: "var(--ac-space-2)", listStyle: "none", fontSize: "var(--ac-text-xs)", color: "var(--ac-text-secondary)" }}>
            <li style={{ display: "flex", alignItems: "center", gap: "var(--ac-space-2)" }}>
              <Package size={14} style={{ color: "var(--ac-accent-amber)" }} />
              <span>Track recent tool shipments and courier dispatch numbers</span>
            </li>
            <li style={{ display: "flex", alignItems: "center", gap: "var(--ac-space-2)" }}>
              <Wrench size={14} style={{ color: "var(--ac-accent-amber)" }} />
              <span>Review technician fault notes and vehicle diagnostic history</span>
            </li>
          </ul>
        </div>
      </div>
    </PageContainer>
  );
}
