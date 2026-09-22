import React from "react";
import { MapPin, Phone, MessageCircle, Clock, Mail, AlertCircle, Wrench } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

export default function ContactPage() {
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "2340000000000";
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    "Hello Auto Clinic, I have a workshop/store enquiry."
  )}`;

  return (
    <PageContainer
      title="Workshop Location & Contact"
      subtitle="Connect with Auto Clinic technicians regarding vehicle diagnostics, order status, or tool technical specifications."
      breadcrumbs={[{ label: "Contact & Location" }]}
      maxWidth="default"
    >
      <div className="ac-grid ac-grid-1" style={{ gap: "var(--ac-space-8)" }}>
        {/* Unresolved Data Notice */}
        <div className="ac-panel" style={{ borderLeft: "3px solid var(--ac-accent-amber)" }}>
          <div style={{ display: "flex", gap: "var(--ac-space-3)", alignItems: "flex-start" }}>
            <AlertCircle size={20} style={{ color: "var(--ac-accent-amber)", flexShrink: 0, marginTop: "2px" }} />
            <div>
              <strong style={{ display: "block", color: "var(--ac-text-primary)", fontSize: "var(--ac-text-sm)", marginBottom: "4px" }}>
                Physical Workshop Facility Announcement:
              </strong>
              <p style={{ color: "var(--ac-text-secondary)", fontSize: "var(--ac-text-xs)", lineHeight: "var(--ac-leading-normal)", margin: 0 }}>
                Auto Clinic is establishing its primary automotive workshop in Nigeria. Specific street address, GPS bay coordinates, and official opening hours will be confirmed prior to public service inauguration. Direct online enquiries and WhatsApp ordering channels are currently active.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Info Cards */}
        <div className="ac-grid ac-grid-2">
          <Card accentBorder title="Workshop Operations" subtitle="IN-PERSON DIAGNOSTICS">
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--ac-space-3)" }}>
              <div style={{ display: "flex", gap: "var(--ac-space-2)", alignItems: "center", fontSize: "var(--ac-text-xs)", color: "var(--ac-text-secondary)" }}>
                <MapPin size={16} style={{ color: "var(--ac-accent-amber)" }} />
                <span>Physical Workshop Bay: Location in Nigeria (To be confirmed)</span>
              </div>
              <div style={{ display: "flex", gap: "var(--ac-space-2)", alignItems: "center", fontSize: "var(--ac-text-xs)", color: "var(--ac-text-secondary)" }}>
                <Clock size={16} style={{ color: "var(--ac-accent-amber)" }} />
                <span>Operating Schedule: To be confirmed</span>
              </div>
              <div style={{ display: "flex", gap: "var(--ac-space-2)", alignItems: "center", fontSize: "var(--ac-text-xs)", color: "var(--ac-text-secondary)" }}>
                <Wrench size={16} style={{ color: "var(--ac-accent-amber)" }} />
                <span>Appointment Model: Pre-enquiry screening required</span>
              </div>
            </div>
          </Card>

          <Card accentBorder title="Direct Messaging Channels" subtitle="FASTEST RESPONSE">
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--ac-space-3)" }}>
              <p style={{ fontSize: "var(--ac-text-xs)", color: "var(--ac-text-secondary)", margin: 0, lineHeight: "var(--ac-leading-normal)" }}>
                For quick stock enquiries, diagnostic triage consultations, or order dispatch updates, communicate directly via WhatsApp.
              </p>
              <Button
                href={whatsappUrl}
                isExternal
                variant="whatsapp"
                size="md"
                leftIcon={<MessageCircle size={16} />}
              >
                Chat on WhatsApp
              </Button>
            </div>
          </Card>
        </div>

        {/* General Message Form */}
        <Card title="SEND GENERAL ENQUIRY" subtitle="Message support team directly">
          <form style={{ display: "flex", flexDirection: "column", gap: "var(--ac-space-4)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--ac-space-3)" }}>
              <Input label="Your Name" placeholder="e.g. Samuel Ade" required />
              <Input label="Email / Phone" placeholder="e.g. samuel@example.com / 080..." required />
            </div>
            <Input label="Subject" placeholder="e.g. Diagnostic Tool Compatibility / Wholesale Query" required />
            <Textarea label="Message Details" placeholder="Type your questions regarding equipment or workshop services..." rows={4} required />
            <Button type="button" variant="primary" size="md">
              Send Message
            </Button>
          </form>
        </Card>
      </div>
    </PageContainer>
  );
}
