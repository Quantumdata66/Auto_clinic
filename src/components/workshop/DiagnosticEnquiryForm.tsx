"use client";

import React, { useState } from "react";
import { AlertTriangle, Send } from "lucide-react";
import { VehicleInfoFieldGroup } from "./VehicleInfoFieldGroup";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";
import { RadioGroup } from "../ui/Radio";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Toast } from "../ui/Toast";
import styles from "./DiagnosticEnquiryForm.module.css";

export const DiagnosticEnquiryForm: React.FC = () => {
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
    // Generate authoritative reference code for enquiry tracking
    const generatedRef = `AC-ENQ-${Math.floor(100000 + Math.random() * 900000)}`;
    setSubmittedRef(generatedRef);
  };

  return (
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
  );
};
