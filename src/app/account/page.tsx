"use client";

import React, { useState } from "react";
import Link from "next/link";
import { User, Shield, Package, Wrench, Search, CheckCircle2, Clock, AlertCircle, ArrowRight, ExternalLink } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { lookupCustomerPortalAction, CustomerPortalLookupResult } from "@/app/actions/customer";
import { PublicOrderTrackingView, PublicDiagnosticTrackingView } from "@/types";

export default function AccountPage() {
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [portalData, setPortalData] = useState<CustomerPortalLookupResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMsg("Please enter an email address or phone number.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    try {
      const res = await lookupCustomerPortalAction(identifier.trim());
      if (res.success) {
        setPortalData(res);
        setSearched(true);
      } else {
        setErrorMsg(res.error || "Could not retrieve records.");
      }
    } catch {
      setErrorMsg("An unexpected error occurred during customer lookup.");
    } finally {
      setLoading(false);
    }
  };

  const formatNgn = (cents: number) => {
    return "₦" + (cents / 100).toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  return (
    <PageContainer
      title="Customer Portal & Activity Lookup"
      subtitle="Access your active order history, tracked diagnostic triage requests, and workshop vehicle notes."
      breadcrumbs={[{ label: "Customer Portal" }]}
      maxWidth="wide"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--ac-space-8)" }}>
        {/* Lookup / Access Form */}
        <div style={{ maxWidth: "600px", margin: "0 auto", width: "100%" }}>
          <Card
            hazardStripe
            title="CUSTOMER PORTAL ACCESS"
            subtitle="Look up your activity using your contact details"
          >
            <form onSubmit={handleLookup} style={{ display: "flex", flexDirection: "column", gap: "var(--ac-space-4)" }}>
              <div style={{ display: "flex", gap: "var(--ac-space-2)" }}>
                <div style={{ flex: 1 }}>
                  <Input
                    label="Email Address or Phone Number"
                    type="text"
                    placeholder="e.g. bamidele.k@example.com or 08031234567"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                  />
                </div>
              </div>

              {errorMsg && (
                <div
                  style={{
                    padding: "var(--ac-space-3)",
                    backgroundColor: "rgba(220, 38, 38, 0.1)",
                    border: "1px solid var(--ac-status-danger)",
                    color: "var(--ac-status-danger)",
                    fontSize: "var(--ac-text-xs)",
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--ac-space-2)",
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <Button type="submit" variant="primary" size="md" disabled={loading} style={{ width: "100%" }}>
                {loading ? "Verifying Records..." : "Search My Activity"}
              </Button>

              <div
                style={{
                  padding: "var(--ac-space-3)",
                  backgroundColor: "var(--ac-bg-base)",
                  border: "1px solid var(--ac-border-subtle)",
                  fontSize: "11px",
                  color: "var(--ac-text-secondary)",
                  lineHeight: 1.5,
                }}
              >
                <strong>Customer accounts are optional:</strong> Auto Clinic supports full guest checkout and independent reference code tracking. You do not need a permanent password to place orders or enquire about diagnostic appointments.
              </div>
            </form>
          </Card>
        </div>

        {/* Search Results Display */}
        {searched && portalData && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--ac-space-6)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--ac-border-subtle)", paddingBottom: "var(--ac-space-3)" }}>
              <h2 style={{ fontSize: "var(--ac-text-lg)", fontWeight: 700, color: "var(--ac-text-primary)", margin: 0 }}>
                Records for <span className="ac-mono" style={{ color: "var(--ac-accent-amber)" }}>{portalData.customerContact}</span>
              </h2>
              <Badge variant="blue" isMonospace size="sm">
                {portalData.orders.length} Orders • {portalData.enquiries.length} Enquiries
              </Badge>
            </div>

            {/* Orders Section */}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--ac-space-4)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--ac-space-2)" }}>
                <Package size={18} style={{ color: "var(--ac-accent-amber)" }} />
                <h3 style={{ fontSize: "var(--ac-text-base)", fontWeight: 700, color: "var(--ac-text-primary)", margin: 0 }}>
                  Order History &amp; Dispatch Status
                </h3>
              </div>

              {portalData.orders.length === 0 ? (
                <div className="ac-panel" style={{ textAlign: "center", padding: "var(--ac-space-6)", color: "var(--ac-text-muted)", fontSize: "var(--ac-text-xs)" }}>
                  No orders found associated with this contact identifier.
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "var(--ac-space-3)" }}>
                  {portalData.orders.map((ord) => (
                    <div
                      key={ord.orderNumber}
                      className="ac-panel"
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        backgroundColor: "var(--ac-bg-surface)",
                        padding: "var(--ac-space-4)",
                        flexWrap: "wrap",
                        gap: "var(--ac-space-3)",
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "var(--ac-space-2)" }}>
                          <span className="ac-mono" style={{ fontSize: "var(--ac-text-sm)", fontWeight: 800, color: "var(--ac-accent-amber)" }}>
                            {ord.orderNumber}
                          </span>
                          <Badge
                            variant={
                              ord.orderStatus === "COMPLETED"
                                ? "green"
                                : ord.orderStatus === "CANCELLED"
                                ? "red"
                                : "amber"
                            }
                            isMonospace
                            size="sm"
                          >
                            {ord.orderStatus}
                          </Badge>
                          <Badge variant="neutral" isMonospace size="sm">
                            {ord.fulfilmentType}
                          </Badge>
                        </div>
                        <span style={{ fontSize: "var(--ac-text-xs)", color: "var(--ac-text-secondary)" }}>
                          Placed on: {new Date(ord.createdAt).toLocaleDateString()} • {ord.items.length} Item(s) • Total: <strong style={{ color: "var(--ac-text-primary)" }}>{formatNgn(ord.totalCents)}</strong>
                        </span>
                      </div>

                      <Link href={`/track?type=order&ref=${ord.orderNumber}`}>
                        <Button variant="outline" size="sm" style={{ display: "flex", alignItems: "center", gap: "var(--ac-space-1)" }}>
                          <span>Track Order</span>
                          <ExternalLink size={12} />
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Diagnostic Enquiries Section */}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--ac-space-4)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--ac-space-2)" }}>
                <Wrench size={18} style={{ color: "var(--ac-accent-amber)" }} />
                <h3 style={{ fontSize: "var(--ac-text-base)", fontWeight: 700, color: "var(--ac-text-primary)", margin: 0 }}>
                  Workshop Diagnostic Enquiries
                </h3>
              </div>

              {portalData.enquiries.length === 0 ? (
                <div className="ac-panel" style={{ textAlign: "center", padding: "var(--ac-space-6)", color: "var(--ac-text-muted)", fontSize: "var(--ac-text-xs)" }}>
                  No diagnostic enquiries found associated with this contact identifier.
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "var(--ac-space-3)" }}>
                  {portalData.enquiries.map((enq) => (
                    <div
                      key={enq.referenceCode}
                      className="ac-panel"
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        backgroundColor: "var(--ac-bg-surface)",
                        padding: "var(--ac-space-4)",
                        flexWrap: "wrap",
                        gap: "var(--ac-space-3)",
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "var(--ac-space-2)" }}>
                          <span className="ac-mono" style={{ fontSize: "var(--ac-text-sm)", fontWeight: 800, color: "var(--ac-accent-amber)" }}>
                            {enq.referenceCode}
                          </span>
                          <Badge
                            variant={
                              enq.status === "COMPLETED"
                                ? "green"
                                : enq.status === "CANCELLED"
                                ? "red"
                                : "amber"
                            }
                            isMonospace
                            size="sm"
                          >
                            {enq.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <span style={{ fontSize: "var(--ac-text-xs)", fontWeight: 600, color: "var(--ac-text-primary)" }}>
                          {enq.vehicleYear} {enq.vehicleMake} {enq.vehicleModel}
                        </span>
                        <span style={{ fontSize: "11px", color: "var(--ac-text-secondary)" }}>
                          Symptoms: {enq.symptoms}
                        </span>
                      </div>

                      <Link href={`/track?type=diagnostic&ref=${enq.referenceCode}`}>
                        <Button variant="outline" size="sm" style={{ display: "flex", alignItems: "center", gap: "var(--ac-space-1)" }}>
                          <span>Track Enquiry</span>
                          <ExternalLink size={12} />
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
