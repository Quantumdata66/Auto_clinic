"use server";

import { createAdminClient, createServerClient } from "@/lib/supabase/server";
import {
  DiagnosticEnquiry,
  DiagnosticEnquiryStatus,
  ContactMethod,
  VehicleEnquiryFormValues,
} from "@/types";

export interface CreateDiagnosticEnquiryInput {
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  vehicleRegOrVin?: string;
  symptoms: string;
  requestedServiceId?: string;
  customerName: string;
  customerPhone: string;
  customerWhatsapp?: string;
  customerEmail?: string;
  preferredContactMethod: ContactMethod;
}

export interface CreateDiagnosticEnquiryResult {
  success: boolean;
  referenceCode?: string;
  enquiry?: DiagnosticEnquiry;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export interface LookupDiagnosticResult {
  found: boolean;
  enquiry?: DiagnosticEnquiry;
  error?: string;
}

// In-Memory Dev Store for enquiries when Supabase is running with mock/dev setup
const DEV_ENQUIRIES_STORE = new Map<string, DiagnosticEnquiry>();

/**
 * Checks if Supabase connection is active with non-placeholder credentials.
 */
function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
    key &&
    !url.includes("placeholder") &&
    !key.includes("placeholder")
  );
}

/**
 * Generates an authoritative 6-digit reference code for diagnostic enquiries.
 * Format: AC-ENQ-XXXXXX (e.g. AC-ENQ-748192)
 */
function generateEnquiryReference(): string {
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `AC-ENQ-${randomNum}`;
}

/**
 * Server Action: Submit vehicle diagnostic enquiry for workshop technician review.
 * Strictly adheres to enquiry-first workflow (no instant calendar slot booking).
 */
export async function createDiagnosticEnquiryAction(
  input: CreateDiagnosticEnquiryInput
): Promise<CreateDiagnosticEnquiryResult> {
  try {
    const fieldErrors: Record<string, string> = {};

    if (!input.vehicleMake || input.vehicleMake.trim().length === 0) {
      fieldErrors["vehicleMake"] = "Vehicle make is required (e.g. Toyota, Mercedes)";
    }
    if (!input.vehicleModel || input.vehicleModel.trim().length === 0) {
      fieldErrors["vehicleModel"] = "Vehicle model is required (e.g. Camry, E350)";
    }
    if (!input.vehicleYear || input.vehicleYear.trim().length === 0) {
      fieldErrors["vehicleYear"] = "Vehicle year of manufacture is required";
    }
    if (!input.symptoms || input.symptoms.trim().length < 10) {
      fieldErrors["symptoms"] = "Please provide detailed symptoms (minimum 10 characters)";
    }
    if (!input.customerName || input.customerName.trim().length === 0) {
      fieldErrors["customerName"] = "Customer name is required";
    }
    if (!input.customerPhone || input.customerPhone.trim().length < 8) {
      fieldErrors["customerPhone"] = "A valid phone number is required";
    }

    if (Object.keys(fieldErrors).length > 0) {
      return {
        success: false,
        error: "Please complete all required vehicle diagnostic fields.",
        fieldErrors,
      };
    }

    const referenceCode = generateEnquiryReference();
    const nowIso = new Date().toISOString();

    const enquiry: DiagnosticEnquiry = {
      id: crypto.randomUUID(),
      referenceCode,
      customerName: input.customerName.trim(),
      customerEmail: input.customerEmail?.trim() || undefined,
      customerPhone: input.customerPhone.trim(),
      customerWhatsapp: input.customerWhatsapp?.trim() || input.customerPhone.trim(),
      vehicleMake: input.vehicleMake.trim(),
      vehicleModel: input.vehicleModel.trim(),
      vehicleYear: input.vehicleYear.trim(),
      vehicleRegOrVin: input.vehicleRegOrVin?.trim() || undefined,
      symptoms: input.symptoms.trim(),
      requestedServiceId: input.requestedServiceId || undefined,
      preferredContactMethod: input.preferredContactMethod || "WHATSAPP",
      status: "PENDING_REVIEW",
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // Save to database if Supabase service role is configured
    if (isSupabaseConfigured() && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const adminSupabase = createAdminClient();
        const { error } = await adminSupabase.from("diagnostic_enquiries" as any).insert({
          id: enquiry.id,
          reference_code: enquiry.referenceCode,
          customer_name: enquiry.customerName,
          customer_email: enquiry.customerEmail || null,
          customer_phone: enquiry.customerPhone,
          customer_whatsapp: enquiry.customerWhatsapp || null,
          vehicle_make: enquiry.vehicleMake,
          vehicle_model: enquiry.vehicleModel,
          vehicle_year: enquiry.vehicleYear,
          vehicle_reg_or_vin: enquiry.vehicleRegOrVin || null,
          symptoms: enquiry.symptoms,
          requested_service_id: enquiry.requestedServiceId || null,
          preferred_contact_method: enquiry.preferredContactMethod,
          status: enquiry.status,
        } as any);

        if (error) {
          console.error("Database enquiry insertion error:", error);
        }
      } catch (dbErr) {
        console.error("Database error saving diagnostic enquiry:", dbErr);
      }
    }

    DEV_ENQUIRIES_STORE.set(enquiry.referenceCode, enquiry);

    return {
      success: true,
      referenceCode: enquiry.referenceCode,
      enquiry,
    };
  } catch (err) {
    console.error("Unexpected error in createDiagnosticEnquiryAction:", err);
    return {
      success: false,
      error: "An unexpected error occurred while submitting your enquiry.",
    };
  }
}

/**
 * Server Action: Look up diagnostic enquiry status by reference code and customer contact.
 */
export async function lookupDiagnosticStatusAction(
  referenceCode: string,
  contact: string
): Promise<LookupDiagnosticResult> {
  if (!referenceCode || !contact) {
    return { found: false, error: "Diagnostic reference code and contact number are required." };
  }

  const cleanRef = referenceCode.trim().toUpperCase();
  const cleanContact = contact.trim().toLowerCase();

  // In-memory dev check
  const devEnquiry = DEV_ENQUIRIES_STORE.get(cleanRef);
  if (devEnquiry) {
    const contactMatches =
      devEnquiry.customerPhone.replace(/[^0-9]/g, "") === cleanContact.replace(/[^0-9]/g, "") ||
      (devEnquiry.customerEmail && devEnquiry.customerEmail.toLowerCase() === cleanContact);

    if (contactMatches) {
      return { found: true, enquiry: devEnquiry };
    } else {
      return {
        found: false,
        error: "Verification contact does not match the registered enquiry record.",
      };
    }
  }

  if (!isSupabaseConfigured()) {
    return { found: false, error: "No matching diagnostic enquiry found." };
  }

  try {
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
      .from("diagnostic_enquiries")
      .select("*")
      .eq("reference_code", cleanRef)
      .maybeSingle();

    if (error || !data) {
      return { found: false, error: "Diagnostic reference not found." };
    }

    const row = data as any;
    const phoneMatch =
      row.customer_phone?.replace(/[^0-9]/g, "") === cleanContact.replace(/[^0-9]/g, "");
    const emailMatch = row.customer_email?.toLowerCase() === cleanContact;

    if (!phoneMatch && !emailMatch) {
      return {
        found: false,
        error: "Verification contact does not match the registered enquiry record.",
      };
    }

    const enquiry: DiagnosticEnquiry = {
      id: row.id,
      referenceCode: row.reference_code,
      customerName: row.customer_name,
      customerEmail: row.customer_email,
      customerPhone: row.customer_phone,
      customerWhatsapp: row.customer_whatsapp,
      vehicleMake: row.vehicle_make,
      vehicleModel: row.vehicle_model,
      vehicleYear: row.vehicle_year,
      vehicleRegOrVin: row.vehicle_reg_or_vin,
      symptoms: row.symptoms,
      requestedServiceId: row.requested_service_id,
      preferredContactMethod: row.preferred_contact_method as ContactMethod,
      status: row.status as DiagnosticEnquiryStatus,
      staffNotes: row.staff_notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    return { found: true, enquiry };
  } catch (err) {
    console.error("Database error in lookupDiagnosticStatusAction:", err);
    return { found: false, error: "Error looking up diagnostic enquiry." };
  }
}
