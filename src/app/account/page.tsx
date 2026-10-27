"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  User,
  Shield,
  Package,
  Wrench,
  KeyRound,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  LogOut,
  Mail,
  Smartphone,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { RadioGroup } from "@/components/ui/Radio";
import {
  requestCustomerOtpAction,
  verifyCustomerOtpAction,
  lookupCustomerPortalAction,
  customerLogoutAction,
  CustomerPortalLookupResult,
} from "@/app/actions/customer";

export default function AccountPage() {
  const [step, setStep] = useState<"REQUEST_OTP" | "VERIFY_OTP" | "PORTAL">("REQUEST_OTP");
  const [channel, setChannel] = useState<"email" | "sms">("email");
  const [identifier, setIdentifier] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [portalData, setPortalData] = useState<CustomerPortalLookupResult | null>(null);
  const [infoMsg, setInfoMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Supplementary client-side resend cooldown timer
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const interval = setInterval(() => {
      setCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownSeconds]);

  // Check for active session cookie on mount
  useEffect(() => {
    const checkActiveSession = async () => {
      setLoading(true);
      try {
        const res = await lookupCustomerPortalAction();
        if (res.success) {
          setPortalData(res);
          setStep("PORTAL");
        }
      } catch (err) {
        console.warn("No active customer session cookie found:", err);
      } finally {
        setLoading(false);
      }
    };
    checkActiveSession();
  }, []);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMsg(
        channel === "email"
          ? "Please enter your email address."
          : "Please enter your mobile phone number."
      );
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setInfoMsg("");

    try {
      const res = await requestCustomerOtpAction(identifier.trim(), channel);
      if (res.success) {
        setInfoMsg(res.message || "A 6-digit verification code has been dispatched.");
        setCooldownSeconds(60);
        setStep("VERIFY_OTP");
      } else {
        setErrorMsg(res.error || "Failed to dispatch verification code.");
      }
    } catch {
      setErrorMsg("An unexpected network error occurred while sending code.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpToken.trim()) {
      setErrorMsg("Please enter the 6-digit verification code.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setInfoMsg("");

    try {
      const verifyRes = await verifyCustomerOtpAction(identifier.trim(), channel, otpToken.trim());
      if (!verifyRes.success) {
        setErrorMsg(verifyRes.error || "Verification failed. Invalid or expired code.");
        setLoading(false);
        return;
      }

      // Load authenticated customer portal data
      const portalRes = await lookupCustomerPortalAction();
      if (portalRes.success) {
        setPortalData(portalRes);
        setStep("PORTAL");
      } else {
        setErrorMsg(portalRes.error || "Could not retrieve records for this account.");
      }
    } catch {
      setErrorMsg("An unexpected error occurred during OTP verification.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await customerLogoutAction();
    setPortalData(null);
    setIdentifier("");
    setOtpToken("");
    setStep("REQUEST_OTP");
    setErrorMsg("");
    setInfoMsg("");
  };

  const formatNgn = (cents: number) => {
    return (
      "₦" +
      (cents / 100).toLocaleString("en-NG", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
    );
  };

  return (
    <PageContainer
      title="Customer Portal & Activity History"
      subtitle="Verify your contact details to review placed equipment orders, vehicle diagnostic triage history, and workshop appointment updates."
      breadcrumbs={[{ label: "Customer Portal" }]}
      maxWidth="wide"
      actions={
        step === "PORTAL" ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            style={{ display: "flex", alignItems: "center", gap: "4px" }}
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </Button>
        ) : undefined
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--ac-space-8)" }}>
        {/* Step 1: Request OTP */}
        {step === "REQUEST_OTP" && (
          <div style={{ maxWidth: "560px", margin: "0 auto", width: "100%" }}>
            <Card
              hazardStripe
              title="VERIFY CUSTOMER IDENTITY"
              subtitle="Passwordless authentication via One-Time Passcode (OTP)"
            >
              <form
                onSubmit={handleRequestOtp}
                style={{ display: "flex", flexDirection: "column", gap: "var(--ac-space-4)" }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--ac-space-2)",
                    padding: "var(--ac-space-3)",
                    backgroundColor: "var(--ac-bg-base)",
                    border: "1px solid var(--ac-border-subtle)",
                    fontSize: "12px",
                    color: "var(--ac-text-secondary)",
                  }}
                >
                  <KeyRound size={16} style={{ color: "var(--ac-accent-amber)", flexShrink: 0 }} />
                  <span>
                    To protect customer privacy, vehicle diagnostic records and order histories are
                    only accessible after verifying ownership of your registered contact.
                  </span>
                </div>

                <RadioGroup
                  name="channel"
                  label="Verification Method"
                  selectedValue={channel}
                  onChange={(val) => {
                    setChannel(val as "email" | "sms");
                    setErrorMsg("");
                    setInfoMsg("");
                  }}
                  options={[
                    {
                      value: "email",
                      label: "Email Passcode (OTP)",
                      description: "Receive a 6-digit access code to your registered email address.",
                    },
                    {
                      value: "sms",
                      label: "SMS Passcode (OTP)",
                      description: "Receive a 6-digit text message to your verified mobile number.",
                    },
                  ]}
                />

                <Input
                  label={channel === "email" ? "Registered Email Address" : "Registered Phone Number"}
                  type={channel === "email" ? "email" : "tel"}
                  placeholder={
                    channel === "email" ? "e.g. babajide.s@example.com" : "e.g. +2348031234567"
                  }
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                />

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
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={loading || cooldownSeconds > 0}
                  style={{ width: "100%" }}
                >
                  {cooldownSeconds > 0
                    ? `Resend Available in ${cooldownSeconds}s`
                    : loading
                    ? "Dispatching Code..."
                    : "Send Verification Passcode"}
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
                  <strong>Guest Order Tracking:</strong> If you only need to check a single order or
                  booking, you can also use our direct reference lookup on the{" "}
                  <Link href="/track" style={{ color: "var(--ac-accent-amber)", textDecoration: "underline" }}>
                    Public Status Tracker
                  </Link>{" "}
                  without requesting an OTP.
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* Step 2: Verify OTP */}
        {step === "VERIFY_OTP" && (
          <div style={{ maxWidth: "560px", margin: "0 auto", width: "100%" }}>
            <Card
              hazardStripe
              title="ENTER ONE-TIME PASSCODE"
              subtitle={`Code sent to ${identifier} via ${channel.toUpperCase()}`}
            >
              <form
                onSubmit={handleVerifyOtp}
                style={{ display: "flex", flexDirection: "column", gap: "var(--ac-space-4)" }}
              >
                {infoMsg && (
                  <div
                    style={{
                      padding: "var(--ac-space-3)",
                      backgroundColor: "rgba(59, 130, 246, 0.1)",
                      border: "1px solid var(--ac-status-info)",
                      color: "var(--ac-status-info)",
                      fontSize: "var(--ac-text-xs)",
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--ac-space-2)",
                    }}
                  >
                    <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                    <span>{infoMsg}</span>
                  </div>
                )}

                <Input
                  label="6-Digit Verification Code"
                  type="text"
                  placeholder="e.g. 123456"
                  value={otpToken}
                  onChange={(e) => setOtpToken(e.target.value.replace(/[^0-9]/g, "").slice(0, 8))}
                  maxLength={8}
                  isMonospace
                  required
                />

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
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={loading}
                  style={{ width: "100%" }}
                >
                  {loading ? "Verifying Passcode..." : "Verify & Open Customer Portal"}
                </Button>

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "var(--ac-space-2)" }}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setStep("REQUEST_OTP");
                      setErrorMsg("");
                      setInfoMsg("");
                    }}
                    style={{ display: "flex", alignItems: "center", gap: "4px" }}
                  >
                    <RotateCcw size={12} />
                    <span>Change Contact Address</span>
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* Step 3: Authenticated Customer Portal Results */}
        {step === "PORTAL" && portalData && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--ac-space-6)" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid var(--ac-border-subtle)",
                paddingBottom: "var(--ac-space-3)",
                flexWrap: "wrap",
                gap: "var(--ac-space-3)",
              }}
            >
              <div>
                <span className="ac-eyebrow">AUTHENTICATED CUSTOMER IDENTITY</span>
                <h2
                  style={{
                    fontSize: "var(--ac-text-lg)",
                    fontWeight: 700,
                    color: "var(--ac-text-primary)",
                    margin: 0,
                  }}
                >
                  Activity for{" "}
                  <span className="ac-mono" style={{ color: "var(--ac-accent-amber)" }}>
                    {portalData.customerContact}
                  </span>
                </h2>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--ac-space-2)" }}>
                <Badge variant="green" isMonospace size="sm">
                  VERIFIED IDENTITY
                </Badge>
                <Badge variant="blue" isMonospace size="sm">
                  {portalData.orders.length} Orders • {portalData.enquiries.length} Enquiries
                </Badge>
              </div>
            </div>

            {/* Orders Section */}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--ac-space-4)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--ac-space-2)" }}>
                <Package size={18} style={{ color: "var(--ac-accent-amber)" }} />
                <h3
                  style={{
                    fontSize: "var(--ac-text-base)",
                    fontWeight: 700,
                    color: "var(--ac-text-primary)",
                    margin: 0,
                  }}
                >
                  Order History &amp; Dispatch Status
                </h3>
              </div>

              {portalData.orders.length === 0 ? (
                <div
                  className="ac-panel"
                  style={{
                    textAlign: "center",
                    padding: "var(--ac-space-6)",
                    color: "var(--ac-text-muted)",
                    fontSize: "var(--ac-text-xs)",
                  }}
                >
                  No equipment orders currently on record for this verified identity.
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
                          <span
                            className="ac-mono"
                            style={{
                              fontSize: "var(--ac-text-sm)",
                              fontWeight: 800,
                              color: "var(--ac-accent-amber)",
                            }}
                          >
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
                          Placed on: {new Date(ord.createdAt).toLocaleDateString()} • {ord.items.length}{" "}
                          Item(s) • Total:{" "}
                          <strong style={{ color: "var(--ac-text-primary)" }}>
                            {formatNgn(ord.totalCents)}
                          </strong>
                        </span>
                      </div>

                      <Link href={`/track?type=order&ref=${ord.orderNumber}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          style={{ display: "flex", alignItems: "center", gap: "var(--ac-space-1)" }}
                        >
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
                <h3
                  style={{
                    fontSize: "var(--ac-text-base)",
                    fontWeight: 700,
                    color: "var(--ac-text-primary)",
                    margin: 0,
                  }}
                >
                  Workshop Diagnostic Enquiries
                </h3>
              </div>

              {portalData.enquiries.length === 0 ? (
                <div
                  className="ac-panel"
                  style={{
                    textAlign: "center",
                    padding: "var(--ac-space-6)",
                    color: "var(--ac-text-muted)",
                    fontSize: "var(--ac-text-xs)",
                  }}
                >
                  No vehicle diagnostic enquiries on record for this verified identity.
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
                          <span
                            className="ac-mono"
                            style={{
                              fontSize: "var(--ac-text-sm)",
                              fontWeight: 800,
                              color: "var(--ac-accent-amber)",
                            }}
                          >
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
                        <span
                          style={{
                            fontSize: "var(--ac-text-xs)",
                            fontWeight: 600,
                            color: "var(--ac-text-primary)",
                          }}
                        >
                          {enq.vehicleYear} {enq.vehicleMake} {enq.vehicleModel}
                        </span>
                        <span style={{ fontSize: "11px", color: "var(--ac-text-secondary)" }}>
                          Symptoms: {enq.symptoms}
                        </span>
                      </div>

                      <Link href={`/track?type=diagnostic&ref=${enq.referenceCode}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          style={{ display: "flex", alignItems: "center", gap: "var(--ac-space-1)" }}
                        >
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
