"use client";

import React, { useState } from "react";
import { Wrench, Shield, CheckCircle2, MessageSquare, PhoneCall, AlertTriangle, Send } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { DiagnosticServiceCard } from "@/components/workshop/DiagnosticServiceCard";
import { VehicleInfoFieldGroup } from "@/components/workshop/VehicleInfoFieldGroup";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { RadioGroup } from "@/components/ui/Radio";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Toast } from "@/components/ui/Toast";
import { MOCK_DIAGNOSTIC_SERVICES } from "@/data/mockData";
import styles from "./Diagnostics.module.css";

export default function DiagnosticsPage() {
  const [vehicle, setVehicle] = useState({
    make: "",
    model: "",
    year: "",
    regOrVin: "",
  });

  const [symptoms, setSymptoms] = useState("");
  const [contactMethod, setContactMethod] = useState("WHATSAPP");
  const [name, setName] = useState("");
  const [phoneOrWhatsapp, setPhoneOrWhatsapp] = useState("");
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  const handleVehicleChange = (field: string, value: string) => {
    setVehicle((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate generation of tracking reference code for enquiry
    const generatedRef = `AC-ENQ-${Math.floor(100000 + Math.random() * 900000)}`;
    setSubmittedRef(generatedRef);
  };

  return (
    <PageContainer
      title="Workshop Diagnostics & Vehicle Triage"
      subtitle="In-person electronic fault scanning, parasitic drain testing, and mechanical health assessments at our physical workshop in Nigeria."
      breadcrumbs={[{ label: "Workshop Diagnostics" }]}
      maxWidth="wide"
    >
      <div className={styles.diagLayout}>
        {/* Left Column: Diagnostic Service Offerings */}
        <div className={styles.servicesColumn}>
          <div className={styles.sectionHeader}>
            <span className="ac-eyebrow">DIAGNOSTIC PROTOCOLS</span>
            <h2 className={styles.columnTitle}>WORKSHOP DIAGNOSTIC CAPABILITIES</h2>
            <p className={styles.columnDesc}>
              Select a service profile below to review scope, or complete the enquiry form to have our technicians analyze your specific symptoms.
            </p>
          </div>

          <div className="ac-grid ac-grid-1">
            {MOCK_DIAGNOSTIC_SERVICES.map((service) => (
              <DiagnosticServiceCard key={service.id} service={service} />
            ))}
          </div>
        </div>

        {/* Right Column: Diagnostic Enquiry Form */}
        <div className={styles.formColumn}>
          <div className={styles.stickyFormWrapper}>
            <Card
              hazardStripe
              title="SUBMIT DIAGNOSTIC ENQUIRY"
              subtitle="Technicians review symptoms prior to booking appointment"
            >
              {submittedRef ? (
                <div className={styles.successState}>
                  <Toast
                    type="success"
                    title="DIAGNOSTIC ENQUIRY SUBMITTED"
                    message={`Reference Code: ${submittedRef}. Our workshop technician will review your vehicle symptoms and reach out via ${contactMethod} to arrange your arrival slot.`}
                  />
                  <div className={styles.nextStepsBox}>
                    <span className={styles.nextStepsTitle}>WHAT HAPPENS NEXT:</span>
                    <ol className={styles.nextStepsList}>
                      <li>Technician analyzes your vehicle issue profile.</li>
                      <li>We message/call you to confirm workshop availability.</li>
                      <li>You arrive at the workshop bay for scheduled testing.</li>
                    </ol>
                  </div>
                  <Button
                    onClick={() => setSubmittedRef(null)}
                    variant="outline"
                    className={styles.resetBtn}
                  >
                    Submit Another Vehicle Enquiry
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className={styles.enquiryForm}>
                  {/* Workflow Clarification Notice */}
                  <div className={styles.workflowNotice}>
                    <AlertTriangle size={16} className={styles.noticeIcon} />
                    <div className={styles.noticeContent}>
                      <strong>Asynchronous Appointment Scheduling:</strong>
                      <span>
                        Submitting this enquiry does not instantly book a calendar bay. Our lead technician will review the symptoms first and contact you directly to schedule the physical workshop arrival.
                      </span>
                    </div>
                  </div>

                  {/* Vehicle Details */}
                  <VehicleInfoFieldGroup
                    make={vehicle.make}
                    model={vehicle.model}
                    year={vehicle.year}
                    regOrVin={vehicle.regOrVin}
                    onChange={handleVehicleChange}
                  />

                  {/* Symptoms & Faults */}
                  <Textarea
                    label="Observed Symptoms & Fault Warnings"
                    placeholder="Describe dash warning lights (e.g. Check Engine, ABS), strange noises, rough idling, transmission slipping, or starting issues..."
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    required
                    rows={3}
                    helperText="Please be as specific as possible regarding when the fault occurs."
                  />

                  {/* Customer Contact Details */}
                  <div className={styles.contactRow}>
                    <Input
                      label="Customer Full Name"
                      placeholder="e.g. Adeola Johnson"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                    <Input
                      label="Phone / WhatsApp Number (Nigeria)"
                      placeholder="e.g. 0801 234 5678"
                      value={phoneOrWhatsapp}
                      onChange={(e) => setPhoneOrWhatsapp(e.target.value)}
                      isMonospace
                      required
                    />
                  </div>

                  {/* Preferred Contact Channel */}
                  <RadioGroup
                    name="contactMethod"
                    label="Preferred Follow-up Contact Channel"
                    selectedValue={contactMethod}
                    onChange={(val) => setContactMethod(val)}
                    options={[
                      {
                        value: "WHATSAPP",
                        label: "WhatsApp Message (Fastest)",
                        description: "Receive immediate triage queries and slot options directly on WhatsApp.",
                      },
                      {
                        value: "PHONE",
                        label: "Phone Call",
                        description: "Direct voice consultation with workshop manager.",
                      },
                    ]}
                  />

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    rightIcon={<Send size={16} />}
                    className={styles.submitBtn}
                  >
                    Submit Vehicle Enquiry
                  </Button>
                </form>
              )}
            </Card>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
