"use client";

import React, { useState } from "react";
import { MapPin, Phone, MessageCircle, Clock, Mail, AlertCircle, Wrench, CheckCircle2 } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { buildWhatsAppUrl, isWhatsAppConfigured } from "@/lib/utils/whatsapp";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const whatsappUrl = buildWhatsAppUrl("Hello Auto Clinic, I have a workshop/store enquiry.");
  const hasWhatsApp = isWhatsAppConfigured();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <PageContainer
      title="Workshop Location & Contact"
      subtitle="Connect with Auto Clinic technicians regarding vehicle diagnostics, order status, or tool technical specifications."
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
              >
                {hasWhatsApp ? "Chat on WhatsApp" : "WhatsApp (Pending Line Setup)"}
              </Button>
            </div>
          </Card>
        </div>

        {/* General Message Form */}
        <Card title="SEND GENERAL ENQUIRY" subtitle="Message support team directly">
          {submitted ? (
            <div
              style={{
                padding: "var(--ac-space-6)",
                backgroundColor: "rgba(34, 197, 94, 0.08)",
                border: "1px solid var(--ac-status-success)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "var(--ac-space-3)",
                textAlign: "center",
              }}
            >
              <CheckCircle2 size={32} style={{ color: "var(--ac-status-success)" }} />
              <div>
                <strong style={{ display: "block", color: "var(--ac-text-primary)", fontSize: "var(--ac-text-sm)", marginBottom: "4px" }}>
                  Enquiry Recorded Successfully (Staging Demo Mode)
                </strong>
                <p style={{ fontSize: "var(--ac-text-xs)", color: "var(--ac-text-secondary)", margin: 0, maxWidth: "480px" }}>
                  Thank you, <strong>{formData.name}</strong>. Your enquiry regarding &quot;{formData.subject || "General Consultation"}&quot; has been received. Our team will review your message.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSubmitted(false);
                  setFormData({ name: "", contact: "", subject: "", message: "" });
                }}
              >
                Send Another Message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--ac-space-4)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--ac-space-3)" }}>
                <Input
                  label="Your Name"
                  placeholder="e.g. Samuel Ade"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <Input
                  label="Email / Phone Number"
                  placeholder="e.g. samuel@example.com / 080..."
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  required
                />
              </div>
              <Input
                label="Subject"
                placeholder="e.g. Diagnostic Tool Compatibility / Workshop Query"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                required
              />
              <Textarea
                label="Message Details"
                placeholder="Type your questions regarding equipment or workshop services..."
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
              />
              <Button type="submit" variant="primary" size="md" disabled={loading}>
                {loading ? "Sending..." : "Send Message"}
              </Button>
            </form>
          )}
        </Card>
      </div>
    </PageContainer>
  );
}
