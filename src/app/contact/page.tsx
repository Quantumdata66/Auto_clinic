"use client";

import React, { useState } from "react";
import {
  MapPin,
  Clock,
  AlertCircle,
  Wrench,
  CheckCircle2,
  MessageCircle,
  Search,
  RefreshCw,
  Send,
} from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Toast } from "@/components/ui/Toast";
import { submitContactEnquiryAction } from "@/app/actions/diagnostics";
import {
  generateGeneralEnquiryWhatsAppUrl,
  isWhatsAppConfigured,
} from "@/lib/utils/whatsapp";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  const whatsappUrl = generateGeneralEnquiryWhatsAppUrl();
  const hasWhatsApp = isWhatsAppConfigured();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});
    setLoading(true);

    try {
      const res = await submitContactEnquiryAction({
        name: formData.name,
        phone: formData.phone,
        email: formData.email ? formData.email : undefined,
        subject: formData.subject,
        message: formData.message,
      });

      if (res.success && res.referenceCode) {
        setSubmittedRef(res.referenceCode);
      } else {
        setErrorMessage(res.error || "Failed to submit enquiry. Please review the highlighted fields.");
        if (res.fieldErrors) {
          setFieldErrors(res.fieldErrors);
        }
      }
    } catch (err) {
      console.error("Enquiry submission error:", err);
      setErrorMessage("A network or system error occurred while submitting your enquiry. Please try again or reach out on WhatsApp.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSubmittedRef(null);
    setErrorMessage(null);
    setFieldErrors({});
    setFormData({
      name: "",
      phone: "",
      email: "",
      subject: "",
      message: "",
    });
  };

  return (
    <PageContainer
      title="Workshop Location & Contact"
      subtitle="Connect with Auto Clinic regarding vehicle diagnostics, order status, or tool technical specifications."
      breadcrumbs={[{ label: "Contact & Location" }]}
      maxWidth="default"
    >
      <div className="ac-grid ac-grid-1" style={{ gap: "var(--ac-space-8)" }}>
        {/* Workshop Facility Status Notice */}
        <div className="ac-panel" style={{ borderLeft: "3px solid var(--ac-accent-amber)", backgroundColor: "rgba(255, 184, 0, 0.05)" }}>
          <div style={{ display: "flex", gap: "var(--ac-space-3)", alignItems: "flex-start" }}>
            <AlertCircle size={20} style={{ color: "var(--ac-accent-amber)", flexShrink: 0, marginTop: "2px" }} />
            <div>
              <strong style={{ display: "block", color: "var(--ac-text-primary)", fontSize: "var(--ac-text-sm)", marginBottom: "4px" }}>
                Physical Workshop Establishment Status — Staging Review:
              </strong>
              <p style={{ color: "var(--ac-text-secondary)", fontSize: "var(--ac-text-xs)", lineHeight: "var(--ac-leading-normal)", margin: 0 }}>
                Auto Clinic is establishing its primary automotive workshop facility in Nigeria. Specific street address, bay coordinates, and official opening hours are under review and will be confirmed prior to public service inauguration. <strong>Walk-in service is currently not available without prior confirmed triage.</strong> Please submit an online diagnostic enquiry or contact us via web forms for assistance.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Info Cards */}
        <div className="ac-grid ac-grid-2">
          <Card accentBorder title="Workshop Operations" subtitle="APPOINTMENT & TRIAGE ONLY">
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--ac-space-3)" }}>
              <div style={{ display: "flex", gap: "var(--ac-space-2)", alignItems: "center", fontSize: "var(--ac-text-xs)", color: "var(--ac-text-secondary)" }}>
                <MapPin size={16} style={{ color: "var(--ac-accent-amber)" }} />
                <span>Physical Workshop Bay: Nigeria (Establishment in progress)</span>
              </div>
              <div style={{ display: "flex", gap: "var(--ac-space-2)", alignItems: "center", fontSize: "var(--ac-text-xs)", color: "var(--ac-text-secondary)" }}>
                <Clock size={16} style={{ color: "var(--ac-accent-amber)" }} />
                <span>Operating Schedule: By confirmed appointment only</span>
              </div>
              <div style={{ display: "flex", gap: "var(--ac-space-2)", alignItems: "center", fontSize: "var(--ac-text-xs)", color: "var(--ac-text-secondary)" }}>
                <Wrench size={16} style={{ color: "var(--ac-accent-amber)" }} />
                <span>Walk-In Policy: Unannounced walk-ins not accepted</span>
              </div>
            </div>
          </Card>

          <Card accentBorder title="Direct Messaging Channels" subtitle="TECHNICAL ASSISTANCE">
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--ac-space-3)" }}>
              <p style={{ fontSize: "var(--ac-text-xs)", color: "var(--ac-text-secondary)", margin: 0, lineHeight: "var(--ac-leading-normal)" }}>
                {hasWhatsApp
                  ? "For quick stock enquiries, diagnostic triage consultations, or order dispatch updates, communicate directly via WhatsApp."
                  : "Official Auto Clinic WhatsApp business channel is pending configuration for staging. Click below for staging assistance notice."}
              </p>
              <Button
                href={whatsappUrl}
                isExternal={Boolean(whatsappUrl)}
                variant="whatsapp"
                size="md"
                leftIcon={<MessageCircle size={16} />}
                aria-label="Chat with Auto Clinic on WhatsApp"
              >
                {hasWhatsApp ? "Chat on WhatsApp" : "WhatsApp (Pending Line Setup)"}
              </Button>
            </div>
          </Card>
        </div>

        {/* General Message Form */}
        <Card title="SEND GENERAL ENQUIRY" subtitle="Message support team directly">
          {submittedRef ? (
            <div
              style={{
                padding: "var(--ac-space-6)",
                backgroundColor: "rgba(34, 197, 94, 0.08)",
                border: "1px solid var(--ac-status-success)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "var(--ac-space-4)",
                textAlign: "center",
              }}
            >
              <CheckCircle2 size={36} style={{ color: "var(--ac-status-success)" }} />
              <div>
                <strong style={{ display: "block", color: "var(--ac-text-primary)", fontSize: "var(--ac-text-base)", marginBottom: "6px" }}>
                  Enquiry Successfully Recorded
                </strong>
                <p style={{ fontSize: "var(--ac-text-xs)", color: "var(--ac-text-secondary)", margin: "0 auto var(--ac-space-3)", maxWidth: "520px" }}>
                  Thank you, <strong>{formData.name}</strong>. Your enquiry regarding &quot;{formData.subject || "General Consultation"}&quot; has been logged into our workshop triage system. We will contact you at <strong>{formData.phone}</strong>.
                </p>
              </div>

              {/* Reference Box */}
              <div
                className="ac-panel"
                style={{
                  backgroundColor: "var(--ac-bg-base)",
                  border: "1px dashed var(--ac-border-subtle)",
                  padding: "var(--ac-space-4)",
                  width: "100%",
                  maxWidth: "420px",
                }}
              >
                <span className="ac-mono" style={{ fontSize: "11px", color: "var(--ac-accent-amber)", display: "block", marginBottom: "4px" }}>
                  YOUR TRACKING REFERENCE CODE:
                </span>
                <span
                  className="ac-mono"
                  style={{
                    fontSize: "var(--ac-text-lg)",
                    fontWeight: 700,
                    letterSpacing: "1px",
                    color: "var(--ac-text-primary)",
                    display: "block",
                  }}
                >
                  {submittedRef}
                </span>
                <span style={{ fontSize: "11px", color: "var(--ac-text-muted)", display: "block", marginTop: "4px" }}>
                  Use this reference code and your phone number anytime on our Status Tracker to view updates.
                </span>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--ac-space-3)", justifyContent: "center" }}>
                <Button
                  href="/track"
                  variant="primary"
                  size="md"
                  leftIcon={<Search size={16} />}
                >
                  Track Status Online
                </Button>

                {hasWhatsApp && (
                  <Button
                    href={generateGeneralEnquiryWhatsAppUrl({
                      referenceCode: submittedRef,
                      subject: formData.subject,
                      customerName: formData.name,
                    })}
                    isExternal
                    variant="whatsapp"
                    size="md"
                    leftIcon={<MessageCircle size={16} />}
                    aria-label={`Follow up on enquiry ${submittedRef} on WhatsApp`}
                  >
                    Follow Up on WhatsApp
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="md"
                  onClick={handleReset}
                >
                  Send Another Message
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--ac-space-4)" }}>
              {errorMessage && (
                <Toast
                  type="error"
                  title="SUBMISSION ERROR"
                  message={errorMessage}
                />
              )}

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "var(--ac-space-3)" }}>
                <Input
                  label="Your Full Name"
                  placeholder="e.g. Samuel Ade"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  error={fieldErrors["name"]}
                  required
                />
                <Input
                  label="Phone Number (Nigerian Mobile)"
                  placeholder="e.g. 08012345678 or +234..."
                  helperText="Required for tracking and triage updates"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  error={fieldErrors["phone"]}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "var(--ac-space-3)" }}>
                <Input
                  label="Email Address (Optional)"
                  type="email"
                  placeholder="e.g. samuel@example.com"
                  helperText="Optional for email correspondence"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  error={fieldErrors["email"]}
                />
                <Input
                  label="Subject"
                  placeholder="e.g. Diagnostic Scanner Compatibility / Fault Triage"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  error={fieldErrors["subject"]}
                  required
                />
              </div>

              <Textarea
                label="Message Details"
                placeholder="Describe your equipment question, vehicle symptoms, or workshop query..."
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                error={fieldErrors["message"]}
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={loading}
                leftIcon={loading ? <RefreshCw size={16} className="ac-spin" /> : <Send size={16} />}
              >
                {loading ? "Submitting Enquiry..." : "Send Enquiry Message"}
              </Button>
            </form>
          )}
        </Card>
      </div>
    </PageContainer>
  );
}
