"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  Package,
  Wrench,
  AlertTriangle,
  Users,
  Activity,
  CheckCircle2,
  Lock,
  LogOut,
  Save,
  MessageSquare,
  Phone,
  Clock,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  staffLoginAction,
  getStaffDashboardDataAction,
  updateDiagnosticEnquiryAction,
  updateOrderStatusAction,
  StaffSession,
  StaffDashboardData,
} from "@/app/actions/staff";
import { DiagnosticEnquiryStatus, OrderStatus } from "@/types";

export default function AdminDashboardPage() {
  const [session, setSession] = useState<StaffSession | null>(null);
  const [loginEmail, setLoginEmail] = useState("staff@autoclinic.ng");
  const [loginPasscode, setLoginPasscode] = useState("AutoClinic2026!Staff");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const [activeTab, setActiveTab] = useState<"enquiries" | "orders" | "inventory">("enquiries");
  const [dashboardData, setDashboardData] = useState<StaffDashboardData | null>(null);
  const [dataLoading, setDataLoading] = useState(false);

  // Status updates in progress
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editedNotes, setEditedNotes] = useState<{ [key: string]: string }>({});
  const [editedStatuses, setEditedStatuses] = useState<{ [key: string]: string }>({});
  const [updateMsg, setUpdateMsg] = useState<{ [key: string]: { success: boolean; text: string } }>({});

  useEffect(() => {
    // Check sessionStorage on client
    const saved = sessionStorage.getItem("ac_staff_session");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.expiresAt > Date.now()) {
          setSession(parsed);
        } else {
          sessionStorage.removeItem("ac_staff_session");
        }
      } catch {
        sessionStorage.removeItem("ac_staff_session");
      }
    }
  }, []);

  useEffect(() => {
    if (session) {
      loadDashboardData(session.token);
    }
  }, [session]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");

    try {
      const res = await staffLoginAction(loginEmail, loginPasscode);
      if (res.success && res.session) {
        setSession(res.session);
        sessionStorage.setItem("ac_staff_session", JSON.stringify(res.session));
      } else {
        setAuthError(res.error || "Authentication failed. Invalid credentials.");
      }
    } catch {
      setAuthError("An unexpected server error occurred.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setSession(null);
    sessionStorage.removeItem("ac_staff_session");
    setDashboardData(null);
  };

  const loadDashboardData = async (token: string) => {
    setDataLoading(true);
    try {
      const res = await getStaffDashboardDataAction(token);
      if (res.success && res.data) {
        setDashboardData(res.data);
      }
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setDataLoading(false);
    }
  };

  const handleSaveEnquiry = async (enquiryId: string, currentStatus: DiagnosticEnquiryStatus, currentNotes?: string) => {
    if (!session) return;
    setSavingId(enquiryId);
    const newStatus = (editedStatuses[enquiryId] as DiagnosticEnquiryStatus) || currentStatus;
    const notes = editedNotes[enquiryId] !== undefined ? editedNotes[enquiryId] : currentNotes;

    try {
      const res = await updateDiagnosticEnquiryAction(session.token, enquiryId, newStatus, notes);
      if (res.success) {
        setUpdateMsg((prev) => ({ ...prev, [enquiryId]: { success: true, text: "Enquiry updated successfully." } }));
        await loadDashboardData(session.token);
      } else {
        setUpdateMsg((prev) => ({ ...prev, [enquiryId]: { success: false, text: res.error || "Update failed." } }));
      }
    } catch {
      setUpdateMsg((prev) => ({ ...prev, [enquiryId]: { success: false, text: "Server error updating enquiry." } }));
    } finally {
      setSavingId(null);
      setTimeout(() => {
        setUpdateMsg((prev) => {
          const copy = { ...prev };
          delete copy[enquiryId];
          return copy;
        });
      }, 3000);
    }
  };

  const handleSaveOrderStatus = async (orderId: string, currentStatus: OrderStatus) => {
    if (!session) return;
    setSavingId(orderId);
    const newStatus = (editedStatuses[orderId] as OrderStatus) || currentStatus;

    try {
      const res = await updateOrderStatusAction(session.token, orderId, newStatus);
      if (res.success) {
        setUpdateMsg((prev) => ({ ...prev, [orderId]: { success: true, text: "Order stage updated." } }));
        await loadDashboardData(session.token);
      } else {
        setUpdateMsg((prev) => ({ ...prev, [orderId]: { success: false, text: res.error || "Update failed." } }));
      }
    } catch {
      setUpdateMsg((prev) => ({ ...prev, [orderId]: { success: false, text: "Server error updating order." } }));
    } finally {
      setSavingId(null);
      setTimeout(() => {
        setUpdateMsg((prev) => {
          const copy = { ...prev };
          delete copy[orderId];
          return copy;
        });
      }, 3000);
    }
  };

  const formatNgn = (cents: number) => {
    return "₦" + (cents / 100).toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  // If not authenticated, display Staff Login Gate
  if (!session) {
    return (
      <PageContainer
        title="Staff & Workshop Portal"
        subtitle="Restricted operational triage, order fulfilment, and technician diagnostic log."
        breadcrumbs={[{ label: "Staff Login" }]}
        maxWidth="narrow"
        actions={
          <Badge variant="amber" isMonospace size="md">
            STAFF AUTH REQUIRED
          </Badge>
        }
      >
        <div style={{ maxWidth: "480px", margin: "0 auto", width: "100%" }}>
          <Card hazardStripe title="STAFF AUTHENTICATION" subtitle="Enter your workshop credentials">
            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "var(--ac-space-4)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--ac-space-2)", padding: "var(--ac-space-3)", backgroundColor: "var(--ac-bg-base)", border: "1px solid var(--ac-border-subtle)" }}>
                <Lock size={16} style={{ color: "var(--ac-accent-amber)" }} />
                <span style={{ fontSize: "11px", color: "var(--ac-text-secondary)" }}>
                  Role-based access controls (RBAC) enforced on server.
                </span>
              </div>

              <Input
                label="Staff Email"
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="staff@autoclinic.ng"
                required
              />

              <Input
                label="Access Passcode"
                type="password"
                value={loginPasscode}
                onChange={(e) => setLoginPasscode(e.target.value)}
                placeholder="••••••••••••"
                required
              />

              {authError && (
                <div
                  style={{
                    padding: "var(--ac-space-3)",
                    backgroundColor: "rgba(220, 38, 38, 0.1)",
                    border: "1px solid var(--ac-status-danger)",
                    color: "var(--ac-status-danger)",
                    fontSize: "var(--ac-text-xs)",
                  }}
                >
                  {authError}
                </div>
              )}

              <Button type="submit" variant="primary" size="md" disabled={authLoading} style={{ width: "100%" }}>
                {authLoading ? "Authenticating..." : "Authorize Staff Session"}
              </Button>
            </form>
          </Card>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Admin & Workshop Staff Portal"
      subtitle="Operational telemetry, diagnostic appointment queue, and fulfilment controls."
      breadcrumbs={[{ label: "Admin Portal" }]}
      maxWidth="wide"
      actions={
        <div style={{ display: "flex", alignItems: "center", gap: "var(--ac-space-3)" }}>
          <Badge variant="green" isMonospace size="md">
            {session.role}: {session.email}
          </Badge>
          <Button variant="ghost" size="sm" onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <LogOut size={14} />
            <span>Logout</span>
          </Button>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--ac-space-6)" }}>
        {/* Metric Cards Banner */}
        {dashboardData && (
          <div className="ac-grid ac-grid-4">
            <Card accentBorder title="ACTIVE ORDERS" subtitle="DISPATCH QUEUE">
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                <span className="ac-mono" style={{ fontSize: "var(--ac-text-3xl)", fontWeight: 800, color: "var(--ac-text-primary)" }}>
                  {dashboardData.metrics.totalOrders}
                </span>
                <span style={{ fontSize: "11px", color: "var(--ac-accent-amber)" }}>
                  {dashboardData.metrics.pendingOrders} Processing
                </span>
              </div>
            </Card>

            <Card accentBorder title="DIAGNOSTIC ENQUIRIES" subtitle="WORKSHOP QUEUE">
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                <span className="ac-mono" style={{ fontSize: "var(--ac-text-3xl)", fontWeight: 800, color: "var(--ac-accent-amber)" }}>
                  {dashboardData.metrics.totalEnquiries}
                </span>
                <span style={{ fontSize: "11px", color: "var(--ac-accent-amber)" }}>
                  {dashboardData.metrics.pendingEnquiries} Pending Contact
                </span>
              </div>
            </Card>

            <Card accentBorder title="LOW STOCK ALERTS" subtitle="RE-ORDER THRESHOLD">
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                <span className="ac-mono" style={{ fontSize: "var(--ac-text-3xl)", fontWeight: 800, color: dashboardData.metrics.lowStockCount > 0 ? "var(--ac-status-danger)" : "var(--ac-status-success)" }}>
                  {dashboardData.metrics.lowStockCount}
                </span>
                <span style={{ fontSize: "11px", color: "var(--ac-status-danger)" }}>
                  {dashboardData.metrics.lowStockCount > 0 ? "Action Required" : "Normal"}
                </span>
              </div>
            </Card>

            <Card accentBorder title="SECURITY ENFORCEMENT" subtitle="RBAC POLICY">
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                <span className="ac-mono" style={{ fontSize: "var(--ac-text-base)", fontWeight: 700, color: "var(--ac-status-success)" }}>
                  AUTHENTICATED
                </span>
                <span style={{ fontSize: "11px", color: "var(--ac-text-muted)" }}>Server-Verified</span>
              </div>
            </Card>
          </div>
        )}

        {/* Tab Navigation */}
        <div style={{ display: "flex", gap: "var(--ac-space-2)", borderBottom: "1px solid var(--ac-border-subtle)", paddingBottom: "var(--ac-space-2)" }}>
          <Button
            variant={activeTab === "enquiries" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("enquiries")}
            style={{ display: "flex", alignItems: "center", gap: "var(--ac-space-2)" }}
          >
            <Wrench size={14} />
            <span>Diagnostic Enquiries Queue ({dashboardData?.enquiries.length || 0})</span>
          </Button>

          <Button
            variant={activeTab === "orders" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("orders")}
            style={{ display: "flex", alignItems: "center", gap: "var(--ac-space-2)" }}
          >
            <Package size={14} />
            <span>Orders Fulfilment ({dashboardData?.orders.length || 0})</span>
          </Button>

          <Button
            variant={activeTab === "inventory" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("inventory")}
            style={{ display: "flex", alignItems: "center", gap: "var(--ac-space-2)" }}
          >
            <AlertTriangle size={14} />
            <span>Inventory Telemetry ({dashboardData?.inventoryAlerts.length || 0})</span>
          </Button>
        </div>

        {/* TAB 1: DIAGNOSTIC ENQUIRIES */}
        {activeTab === "enquiries" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--ac-space-4)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "var(--ac-text-xs)", color: "var(--ac-text-secondary)" }}>
                Enquiry-First Workflow: Review reported symptoms, contact customer via WhatsApp/Phone, and record technician triage notes.
              </span>
              <Button variant="outline" size="sm" onClick={() => loadDashboardData(session.token)} disabled={dataLoading}>
                <RefreshCw size={12} className={dataLoading ? "spin" : ""} />
                <span>Refresh Queue</span>
              </Button>
            </div>

            {(!dashboardData || dashboardData.enquiries.length === 0) ? (
              <div className="ac-panel" style={{ textAlign: "center", padding: "var(--ac-space-8)", color: "var(--ac-text-muted)" }}>
                No diagnostic enquiries logged.
              </div>
            ) : (
              dashboardData.enquiries.map((enq) => {
                const isSaving = savingId === enq.id || savingId === enq.referenceCode;
                const statusVal = editedStatuses[enq.id] || enq.status;
                const notesVal = editedNotes[enq.id] !== undefined ? editedNotes[enq.id] : (enq.staffNotes || "");
                const statusFeedback = updateMsg[enq.id] || updateMsg[enq.referenceCode];

                return (
                  <Card key={enq.id} hazardStripe title={`ENQUIRY: ${enq.referenceCode}`} subtitle={`Submitted: ${new Date(enq.createdAt).toLocaleString()}`}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--ac-space-4)" }}>
                      {/* Customer and Vehicle Details Grid */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "var(--ac-space-4)", backgroundColor: "var(--ac-bg-base)", padding: "var(--ac-space-3)", border: "1px solid var(--ac-border-subtle)" }}>
                        <div>
                          <span style={{ fontSize: "11px", color: "var(--ac-text-muted)", display: "block" }}>CUSTOMER NAME &amp; CONTACT</span>
                          <span style={{ fontSize: "var(--ac-text-sm)", fontWeight: 700, color: "var(--ac-text-primary)", display: "block" }}>
                            {enq.customerName}
                          </span>
                          <span style={{ fontSize: "11px", color: "var(--ac-text-secondary)", display: "block" }}>
                            Email: {enq.customerEmail}
                          </span>
                          <span style={{ fontSize: "11px", color: "var(--ac-text-secondary)", display: "block" }}>
                            Phone: {enq.customerPhone}
                          </span>
                        </div>

                        <div>
                          <span style={{ fontSize: "11px", color: "var(--ac-text-muted)", display: "block" }}>VEHICLE SPECIFICATION</span>
                          <span style={{ fontSize: "var(--ac-text-sm)", fontWeight: 700, color: "var(--ac-accent-amber)", display: "block" }}>
                            {enq.vehicleYear} {enq.vehicleMake} {enq.vehicleModel}
                          </span>
                          <span className="ac-mono" style={{ fontSize: "11px", color: "var(--ac-text-secondary)", display: "block" }}>
                            Reg/VIN: {enq.vehicleRegOrVin || "Not Provided"}
                          </span>
                          <span style={{ fontSize: "11px", color: "var(--ac-text-secondary)", display: "block" }}>
                            Contact Pref: {enq.preferredContactMethod}
                          </span>
                        </div>

                        <div>
                          <span style={{ fontSize: "11px", color: "var(--ac-text-muted)", display: "block" }}>ACTIONS &amp; OUTREACH</span>
                          <div style={{ display: "flex", gap: "var(--ac-space-2)", marginTop: "var(--ac-space-1)" }}>
                            {enq.customerWhatsapp && (
                              <a
                                href={`https://wa.me/${enq.customerWhatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hello ${enq.customerName}, this is Auto Clinic workshop regarding your diagnostic enquiry ${enq.referenceCode} for your ${enq.vehicleYear} ${enq.vehicleMake} ${enq.vehicleModel}.`)}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <Button variant="whatsapp" size="sm" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                  <MessageSquare size={12} />
                                  <span>WhatsApp</span>
                                </Button>
                              </a>
                            )}
                            <a href={`tel:${enq.customerPhone}`}>
                              <Button variant="outline" size="sm" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                <Phone size={12} />
                                <span>Call</span>
                              </Button>
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Reported Symptoms */}
                      <div style={{ padding: "var(--ac-space-3)", backgroundColor: "rgba(255, 184, 0, 0.05)", borderLeft: "3px solid var(--ac-accent-amber)" }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--ac-accent-amber)", display: "block", marginBottom: "4px" }}>
                          REPORTED SYMPTOMS &amp; FAULT DESCRIPTION:
                        </span>
                        <p style={{ margin: 0, fontSize: "var(--ac-text-xs)", color: "var(--ac-text-primary)", lineHeight: 1.5 }}>
                          {enq.symptoms}
                        </p>
                      </div>

                      {/* Staff Operational Controls (Restricted Notes + Status) */}
                      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr auto", gap: "var(--ac-space-3)", alignItems: "end" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--ac-text-secondary)", marginBottom: "4px" }}>
                            STAGE / STATUS:
                          </label>
                          <select
                            className="ac-input ac-mono"
                            style={{ width: "100%", height: "38px", fontSize: "11px" }}
                            value={statusVal}
                            onChange={(e) => setEditedStatuses((prev) => ({ ...prev, [enq.id]: e.target.value }))}
                          >
                            <option value="PENDING_REVIEW">PENDING REVIEW</option>
                            <option value="CONTACTED">CONTACTED CUSTOMER</option>
                            <option value="APPOINTMENT_SCHEDULED">APPOINTMENT SCHEDULED</option>
                            <option value="COMPLETED">COMPLETED</option>
                            <option value="CANCELLED">CANCELLED</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--ac-text-secondary)", marginBottom: "4px" }}>
                            STAFF INTERNAL NOTES (TECHNICIAN TRIAGE LOG - CONFIDENTIAL):
                          </label>
                          <input
                            type="text"
                            className="ac-input"
                            style={{ width: "100%", height: "38px", fontSize: "12px" }}
                            placeholder="e.g. Bay 2 assigned; customer requested morning slot; ECU scanner ready."
                            value={notesVal}
                            onChange={(e) => setEditedNotes((prev) => ({ ...prev, [enq.id]: e.target.value }))}
                          />
                        </div>

                        <Button
                          variant="primary"
                          size="md"
                          disabled={isSaving}
                          onClick={() => handleSaveEnquiry(enq.id, enq.status, enq.staffNotes)}
                          style={{ display: "flex", alignItems: "center", gap: "var(--ac-space-1)", height: "38px" }}
                        >
                          <Save size={14} />
                          <span>{isSaving ? "Saving..." : "Update"}</span>
                        </Button>
                      </div>

                      {statusFeedback && (
                        <div style={{ fontSize: "11px", color: statusFeedback.success ? "var(--ac-status-success)" : "var(--ac-status-danger)", fontWeight: 600 }}>
                          {statusFeedback.text}
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: ORDERS & FULFILMENT */}
        {activeTab === "orders" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--ac-space-4)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "var(--ac-text-xs)", color: "var(--ac-text-secondary)" }}>
                Order Fulfilment: Manage warehouse packing, ready-for-collection states, and dispatch updates.
              </span>
              <Button variant="outline" size="sm" onClick={() => loadDashboardData(session.token)} disabled={dataLoading}>
                <RefreshCw size={12} className={dataLoading ? "spin" : ""} />
                <span>Refresh Orders</span>
              </Button>
            </div>

            {(!dashboardData || dashboardData.orders.length === 0) ? (
              <div className="ac-panel" style={{ textAlign: "center", padding: "var(--ac-space-8)", color: "var(--ac-text-muted)" }}>
                No active orders recorded.
              </div>
            ) : (
              dashboardData.orders.map((ord) => {
                const isSaving = savingId === ord.id || savingId === ord.orderNumber;
                const statusVal = editedStatuses[ord.id] || ord.orderStatus;
                const statusFeedback = updateMsg[ord.id] || updateMsg[ord.orderNumber];
                const addressObj = ord.shippingAddress as Record<string, any> | undefined;

                return (
                  <Card key={ord.id} accentBorder title={`ORDER: ${ord.orderNumber}`} subtitle={`Placed: ${new Date(ord.createdAt).toLocaleString()} • Channel: ${ord.channel}`}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--ac-space-4)" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "var(--ac-space-4)", backgroundColor: "var(--ac-bg-base)", padding: "var(--ac-space-3)", border: "1px solid var(--ac-border-subtle)" }}>
                        <div>
                          <span style={{ fontSize: "11px", color: "var(--ac-text-muted)", display: "block" }}>RECIPIENT &amp; CONTACT</span>
                          <span style={{ fontSize: "var(--ac-text-sm)", fontWeight: 700, color: "var(--ac-text-primary)", display: "block" }}>
                            {ord.customerName}
                          </span>
                          <span style={{ fontSize: "11px", color: "var(--ac-text-secondary)", display: "block" }}>
                            Email: {ord.customerEmail}
                          </span>
                          <span style={{ fontSize: "11px", color: "var(--ac-text-secondary)", display: "block" }}>
                            Phone: {ord.customerPhone}
                          </span>
                        </div>

                        <div>
                          <span style={{ fontSize: "11px", color: "var(--ac-text-muted)", display: "block" }}>FULFILMENT METHOD</span>
                          <span className="ac-mono" style={{ fontSize: "var(--ac-text-sm)", fontWeight: 700, color: "var(--ac-accent-amber)", display: "block" }}>
                            {ord.fulfilmentType}
                          </span>
                          {addressObj && (
                            <span style={{ fontSize: "11px", color: "var(--ac-text-secondary)", display: "block" }}>
                              {String(addressObj.street || "")}, {String(addressObj.city || "")}, {String(addressObj.state || "")}
                            </span>
                          )}
                          <span style={{ fontSize: "11px", color: "var(--ac-text-muted)", display: "block" }}>
                            Payment: {ord.paymentStatus}
                          </span>
                        </div>

                        <div>
                          <span style={{ fontSize: "11px", color: "var(--ac-text-muted)", display: "block" }}>ORDER TOTAL</span>
                          <span className="ac-mono" style={{ fontSize: "var(--ac-text-lg)", fontWeight: 800, color: "var(--ac-text-primary)", display: "block" }}>
                            {formatNgn(ord.totalCents)}
                          </span>
                          <span style={{ fontSize: "11px", color: "var(--ac-text-muted)", display: "block" }}>
                            Items: {ord.items?.length || 0} product(s)
                          </span>
                        </div>
                      </div>

                      {/* Items List */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--ac-text-secondary)" }}>ITEMS PURCHASED:</span>
                        {(ord.items || []).map((it) => (
                          <div key={it.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "4px 8px", backgroundColor: "var(--ac-bg-base)" }}>
                            <span style={{ color: "var(--ac-text-primary)" }}>
                              {it.quantity}x {it.productNameSnapshot} <span className="ac-mono" style={{ color: "var(--ac-text-muted)" }}>({it.skuSnapshot})</span>
                            </span>
                            <span className="ac-mono" style={{ fontWeight: 700, color: "var(--ac-text-primary)" }}>
                              {formatNgn(it.lineTotalCents)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Order Status Control */}
                      <div style={{ display: "flex", gap: "var(--ac-space-3)", alignItems: "end", flexWrap: "wrap" }}>
                        <div style={{ flex: 1, minWidth: "220px" }}>
                          <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--ac-text-secondary)", marginBottom: "4px" }}>
                            FULFILMENT STAGE:
                          </label>
                          <select
                            className="ac-input ac-mono"
                            style={{ width: "100%", height: "38px", fontSize: "11px" }}
                            value={statusVal}
                            onChange={(e) => setEditedStatuses((prev) => ({ ...prev, [ord.id]: e.target.value }))}
                          >
                            <option value="PENDING">PENDING</option>
                            <option value="PROCESSING">PROCESSING / PACKING</option>
                            <option value="READY_FOR_COLLECTION">READY FOR WORKSHOP COLLECTION</option>
                            <option value="DISPATCHED">DISPATCHED / WITH COURIER</option>
                            <option value="COMPLETED">COMPLETED</option>
                            <option value="CANCELLED">CANCELLED</option>
                          </select>
                        </div>

                        <Button
                          variant="primary"
                          size="md"
                          disabled={isSaving}
                          onClick={() => handleSaveOrderStatus(ord.id, ord.orderStatus)}
                          style={{ display: "flex", alignItems: "center", gap: "var(--ac-space-1)", height: "38px" }}
                        >
                          <Save size={14} />
                          <span>{isSaving ? "Updating..." : "Update Stage"}</span>
                        </Button>
                      </div>

                      {statusFeedback && (
                        <div style={{ fontSize: "11px", color: statusFeedback.success ? "var(--ac-status-success)" : "var(--ac-status-danger)", fontWeight: 600 }}>
                          {statusFeedback.text}
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {/* TAB 3: INVENTORY TELEMETRY */}
        {activeTab === "inventory" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--ac-space-4)" }}>
            <Card hazardStripe title="STOCK ALERTS &amp; WAREHOUSE TELEMETRY" subtitle="Real-time catalogue stock counts">
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--ac-text-xs)" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid var(--ac-border-subtle)", textAlign: "left" }}>
                      <th style={{ padding: "8px", color: "var(--ac-text-muted)" }}>SKU</th>
                      <th style={{ padding: "8px", color: "var(--ac-text-muted)" }}>PRODUCT NAME</th>
                      <th style={{ padding: "8px", color: "var(--ac-text-muted)" }}>STOCK</th>
                      <th style={{ padding: "8px", color: "var(--ac-text-muted)" }}>THRESHOLD</th>
                      <th style={{ padding: "8px", color: "var(--ac-text-muted)" }}>BACKORDER</th>
                      <th style={{ padding: "8px", color: "var(--ac-text-muted)" }}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(dashboardData?.inventoryAlerts || []).map((item) => (
                      <tr key={item.productId} style={{ borderBottom: "1px solid var(--ac-border-subtle)" }}>
                        <td className="ac-mono" style={{ padding: "8px", fontWeight: 700, color: "var(--ac-accent-amber)" }}>
                          {item.sku}
                        </td>
                        <td style={{ padding: "8px", color: "var(--ac-text-primary)", fontWeight: 600 }}>
                          {item.productName}
                        </td>
                        <td className="ac-mono" style={{ padding: "8px", fontWeight: 800, color: item.stockQuantity <= 2 ? "var(--ac-status-danger)" : "var(--ac-text-primary)" }}>
                          {item.stockQuantity} units
                        </td>
                        <td className="ac-mono" style={{ padding: "8px", color: "var(--ac-text-secondary)" }}>
                          {item.lowStockThreshold} units
                        </td>
                        <td style={{ padding: "8px" }}>
                          <Badge variant={item.allowBackorder ? "green" : "neutral"} isMonospace size="sm">
                            {item.allowBackorder ? "ALLOWED" : "BLOCKED"}
                          </Badge>
                        </td>
                        <td style={{ padding: "8px" }}>
                          <Badge variant={item.stockQuantity === 0 ? "red" : "amber"} isMonospace size="sm">
                            {item.stockQuantity === 0 ? "OUT OF STOCK" : "LOW STOCK"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
