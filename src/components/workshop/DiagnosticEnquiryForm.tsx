"use client";

import React, { useState } from "react";
import { AlertTriangle, Send, MessageCircle, RefreshCw } from "lucide-react";
import { VehicleInfoFieldGroup } from "./VehicleInfoFieldGroup";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";
import { RadioGroup } from "../ui/Radio";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Toast } from "../ui/Toast";
import { createDiagnosticEnquiryAction } from "@/app/actions/diagnostics";
import { generateDiagnosticWhatsAppUrl } from "@/lib/utils/whatsapp";
import { ContactMethod } from "@/types";
import styles from "./DiagnosticEnquiryForm.module.css";

export const DiagnosticEnquiryForm: React.FC = () => {
  const [vehicle, setVehicle] = useState({
    make: "",
    model: "",
    year: "",
    regOrVin: "",
  });

  const [symptoms, setSymptoms] = useState("");
  const [contactMethod, setContactMethod] = useState<ContactMethod>("WHATSAPP");
  const [name, setName] = useState("");
  const [phoneOrWhatsapp, setPhoneOrWhatsapp] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleVehicleChange = (field: string, value: string) => {
    setVehicle((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const result = await createDiagnosticEnquiryAction({
        vehicleMake: vehicle.make,
        vehicleModel: vehicle.model,
        vehicleYear: vehicle.year,
        vehicleRegOrVin: vehicle.regOrVin,
        symptoms,
        customerName: name,
        customerPhone: phoneOrWhatsapp,
        customerWhatsapp: phoneOrWhatsapp,
        preferredContactMethod: contactMethod,
      });

      if (!result.success || !result.referenceCode) {
        setErrorMessage(result.error || "Failed to submit enquiry. Please review the inputs.");
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        setIsSubmitting(false);
        return;
      }

      setSubmittedRef(result.referenceCode);
    } catch (err) {
      console.error("Diagnostic enquiry submission error:", err);
      setErrorMessage("An unexpected network error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubmittedRef(null);
    setVehicle({ make: "", model: "", year: "", regOrVin: "" });
    setSymptoms("");
    setName("");
    setPhoneOrWhatsapp("");
    setErrorMessage(null);
    setFieldErrors({});
  };

  const whatsappFollowupUrl = submittedRef
    ? generateDiagnosticWhatsAppUrl(
        submittedRef,
        { make: vehicle.make, model: vehicle.model, year: vehicle.year },
        symptoms,
        name
      )
    : "";

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
            message={`Reference Code: ${submittedRef}. Our lead workshop technician will review your vehicle symptoms and reach out via ${contactMethod} to arrange your arrival slot.`}
          />
          <div className={styles.nextStepsBox}>
            <span className={styles.nextStepsTitle}>WHAT HAPPENS NEXT:</span>
            <ol className={styles.nextStepsList}>
              <li>Technician analyzes your vehicle symptom profile.</li>
              <li>We message or call you to discuss preliminary triage and workshop availability.</li>
              <li>You bring your vehicle to the workshop bay at the agreed time for testing.</li>
            </ol>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--ac-space-2)", marginTop: "var(--ac-space-4)" }}>
            <Button
              href={whatsappFollowupUrl}
              isExternal
              variant="whatsapp"
              size="md"
              leftIcon={<MessageCircle size={16} />}
            >
              Message Technician on WhatsApp ({submittedRef})
            </Button>
            <Button
              onClick={resetForm}
              variant="outline"
              className={styles.resetBtn}
            >
              Submit Another Vehicle Enquiry
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={styles.enquiryForm}>
          {errorMessage && (
            <Toast
              type="error"
              title="ENQUIRY VALIDATION ERROR"
              message={errorMessage}
            />
          )}

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
            error={fieldErrors["symptoms"]}
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
              error={fieldErrors["customerName"]}
              required
            />
            <Input
              label="Phone / WhatsApp Number (Nigeria)"
              placeholder="e.g. 0801 234 5678"
              value={phoneOrWhatsapp}
              onChange={(e) => setPhoneOrWhatsapp(e.target.value)}
              error={fieldErrors["customerPhone"]}
              isMonospace
              required
            />
          </div>

          {/* Preferred Contact Channel */}
          <RadioGroup
            name="contactMethod"
            label="Preferred Follow-up Contact Channel"
            selectedValue={contactMethod}
            onChange={(val) => setContactMethod(val as ContactMethod)}
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
            disabled={isSubmitting}
            rightIcon={isSubmitting ? <RefreshCw size={16} className="ac-spin" /> : <Send size={16} />}
            className={styles.submitBtn}
          >
            {isSubmitting ? "Submitting Diagnostic Enquiry..." : "Submit Vehicle Enquiry"}
          </Button>
        </form>
      )}
    </Card>
  );
};
