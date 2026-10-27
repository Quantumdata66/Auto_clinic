"use server";

import { createAdminClient, createServerClient } from "@/lib/supabase/server";
import {
  DiagnosticEnquiry,
  DiagnosticEnquiryStatus,
  ContactMethod,
  PublicDiagnosticTrackingView,
  maskCustomerName,
} from "@/types";
import { normalizeNigerianPhone } from "@/lib/utils/phone";

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

export interface SubmitContactEnquiryInput {
  name: string;
  phone: string;
  email?: string;
  subject: string;
  message: string;
}

export interface SubmitContactEnquiryResult {
  success: boolean;
  referenceCode?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export interface LookupDiagnosticResult {
  found: boolean;
  enquiry?: PublicDiagnosticTrackingView;
  error?: string;
}

// In-Memory Dev Store for enquiries when Supabase is running with mock/dev setup
const DEV_ENQUIRIES_STORE = new Map<string, DiagnosticEnquiry>([
  [
    "AC-ENQ-492011",
    {
      id: "e1000000-0000-0000-0000-000000000001",
      referenceCode: "AC-ENQ-492011",
      customerName: "Bamidele Kolawole",
      customerEmail: "bamidele.k@example.com",
      customerPhone: "08031234567",
      customerWhatsapp: "08031234567",
      vehicleMake: "Toyota",
      vehicleModel: "Camry",
      vehicleYear: "2017",
      vehicleRegOrVin: "LAG-782-AB",
      symptoms: "Check Engine light illuminated, harsh downshift from 3rd to 2nd gear when hot.",
      preferredContactMethod: "WHATSAPP",
      status: "PENDING_REVIEW",
      staffNotes: "ECU scan required. Possible solenoid B pressure sensor fault.",
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
  ],
  [
    "AC-ENQ-492012",
    {
      id: "e1000000-0000-0000-0000-000000000002",
      referenceCode: "AC-ENQ-492012",
      customerName: "Emeka Nnamdi",
      customerEmail: "emeka.n@example.com",
      customerPhone: "08129876543",
      customerWhatsapp: "08129876543",
      vehicleMake: "Mercedes-Benz",
      vehicleModel: "C300",
      vehicleYear: "2019",
      vehicleRegOrVin: "ABJ-319-XY",
      symptoms: "Battery dying overnight. Keyless-Go module staying awake.",
      preferredContactMethod: "PHONE",
      status: "CONTACTED",
      staffNotes: "Spoke with customer. Scheduled for parasitic drain testing at workshop bay 2.",
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
  ],
]);

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
 * Helper to build sanitized public tracking projection.
 * STRICT SECURITY INVARIANT:
 * Omits internal staff_notes, internal UUIDs, and unmasked customer personal contact details.
 */
function toPublicDiagnosticProjection(
  enquiry: DiagnosticEnquiry
): PublicDiagnosticTrackingView {
  return {
    referenceCode: enquiry.referenceCode,
    customerNameMasked: maskCustomerName(enquiry.customerName),
    vehicleMake: enquiry.vehicleMake,
    vehicleModel: enquiry.vehicleModel,
    vehicleYear: enquiry.vehicleYear,
    symptoms: enquiry.symptoms,
    preferredContactMethod: enquiry.preferredContactMethod,
    status: enquiry.status,
    createdAt: enquiry.createdAt,
  };
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
    const normalizedPhone = normalizeNigerianPhone(input.customerPhone);
    if (!normalizedPhone) {
      fieldErrors["customerPhone"] =
        "A valid Nigerian phone number is required (e.g. 0803 123 4567 or +234...)";
    }

    let normalizedWhatsapp: string | undefined = undefined;
    if (input.customerWhatsapp && input.customerWhatsapp.trim().length > 0) {
      const parsedWhatsapp = normalizeNigerianPhone(input.customerWhatsapp);
      if (!parsedWhatsapp) {
        fieldErrors["customerWhatsapp"] =
          "Please enter a valid Nigerian WhatsApp number (e.g. 0803 123 4567) or leave blank";
      } else {
        normalizedWhatsapp = parsedWhatsapp.e164;
      }
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
      customerPhone: normalizedPhone ? normalizedPhone.e164 : input.customerPhone.trim(),
      customerWhatsapp: normalizedWhatsapp || (normalizedPhone ? normalizedPhone.e164 : input.customerPhone.trim()),
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
        const { error } = await (adminSupabase as any).from("diagnostic_enquiries").insert({
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
        });

        if (error) {
          console.error("Database enquiry insertion error:", error);
          return {
            success: false,
            error: "Failed to record enquiry in database. Please contact us via WhatsApp.",
          };
        }
      } catch (dbErr) {
        console.error("Database error saving diagnostic enquiry:", dbErr);
        return {
          success: false,
          error: "Database service error while recording enquiry.",
        };
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
 * STRICT SECURITY INVARIANT:
 * Omits internal staff_notes, internal UUIDs, and unmasked customer personal contact details.
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
    const normDevPhone = normalizeNigerianPhone(devEnquiry.customerPhone);
    const normInputPhone = normalizeNigerianPhone(cleanContact);
    const contactMatches =
      (normDevPhone && normInputPhone && normDevPhone.e164 === normInputPhone.e164) ||
      devEnquiry.customerPhone.replace(/[^0-9]/g, "") === cleanContact.replace(/[^0-9]/g, "") ||
      (devEnquiry.customerEmail && devEnquiry.customerEmail.toLowerCase() === cleanContact);

    if (contactMatches) {
      return { found: true, enquiry: toPublicDiagnosticProjection(devEnquiry) };
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
    const { data, error } = await (adminSupabase as any)
      .from("diagnostic_enquiries")
      .select("*")
      .eq("reference_code", cleanRef)
      .maybeSingle();

    if (error) {
      console.error("Database query error in lookupDiagnosticStatusAction:", error);
      return { found: false, error: "Database error while looking up enquiry. Please try again." };
    }

    if (!data) {
      return { found: false, error: "Diagnostic reference not found." };
    }

    const row = data as any;
    const normRowPhone = normalizeNigerianPhone(row.customer_phone);
    const normInputPhone = normalizeNigerianPhone(cleanContact);
    const phoneMatch =
      (normRowPhone && normInputPhone && normRowPhone.e164 === normInputPhone.e164) ||
      row.customer_phone?.replace(/[^0-9]/g, "") === cleanContact.replace(/[^0-9]/g, "");
    const emailMatch = row.customer_email?.toLowerCase() === cleanContact;

    if (!phoneMatch && !emailMatch) {
      return {
        found: false,
        error: "Verification contact does not match the registered enquiry record.",
      };
    }

    const reconstructedEnquiry: DiagnosticEnquiry = {
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

    return { found: true, enquiry: toPublicDiagnosticProjection(reconstructedEnquiry) };
  } catch (err) {
    console.error("Database error in lookupDiagnosticStatusAction:", err);
    return { found: false, error: "Error looking up diagnostic enquiry." };
  }
}

/**
 * Server Action: Submit general contact message or equipment compatibility enquiry.
 * Persists directly into the diagnostic_enquiries table (or DEV_ENQUIRIES_STORE)
 * and generates an authoritative tracking reference code (AC-ENQ-XXXXXX) for the customer.
 */
export async function submitContactEnquiryAction(
  input: SubmitContactEnquiryInput
): Promise<SubmitContactEnquiryResult> {
  try {
    const fieldErrors: Record<string, string> = {};

    if (!input.name || input.name.trim().length === 0) {
      fieldErrors["name"] = "Your name is required.";
    }
    const normalizedPhone = normalizeNigerianPhone(input.phone);
    if (!normalizedPhone) {
      fieldErrors["phone"] = "A valid Nigerian telephone number is required (e.g. 0803 123 4567 or +234...).";
    }
    if (input.email && input.email.trim().length > 0) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
        fieldErrors["email"] = "Please enter a valid email address or leave blank.";
      }
    }
    if (!input.subject || input.subject.trim().length === 0) {
      fieldErrors["subject"] = "Enquiry subject is required.";
    }
    if (!input.message || input.message.trim().length < 10) {
      fieldErrors["message"] = "Please provide enquiry details (minimum 10 characters).";
    }

    if (Object.keys(fieldErrors).length > 0) {
      return {
        success: false,
        error: "Please complete all required fields correctly.",
        fieldErrors,
      };
    }

    const referenceCode = generateEnquiryReference();
    const nowIso = new Date().toISOString();

    const enquiry: DiagnosticEnquiry = {
      id: crypto.randomUUID(),
      referenceCode,
      customerName: input.name.trim(),
      customerEmail: input.email ? input.email.trim().toLowerCase() : undefined,
      customerPhone: normalizedPhone!.e164,
      customerWhatsapp: normalizedPhone!.e164,
      vehicleMake: "General / Product Enquiry",
      vehicleModel: input.subject.trim(),
      vehicleYear: "N/A",
      symptoms: input.message.trim(),
      preferredContactMethod: input.email ? "EMAIL" : "WHATSAPP",
      status: "PENDING_REVIEW",
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    if (isSupabaseConfigured() && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const adminSupabase = createAdminClient();
        const { error: dbError } = await (adminSupabase as any).from("diagnostic_enquiries").insert({
          id: enquiry.id,
          reference_code: enquiry.referenceCode,
          customer_name: enquiry.customerName,
          customer_email: enquiry.customerEmail || null,
          customer_phone: enquiry.customerPhone,
          customer_whatsapp: enquiry.customerWhatsapp,
          vehicle_make: enquiry.vehicleMake,
          vehicle_model: enquiry.vehicleModel,
          vehicle_year: enquiry.vehicleYear,
          vehicle_reg_or_vin: null,
          symptoms: enquiry.symptoms,
          requested_service_id: null,
          preferred_contact_method: enquiry.preferredContactMethod,
          status: enquiry.status,
          created_at: enquiry.createdAt,
          updated_at: enquiry.updatedAt,
        });

        if (dbError) {
          console.error("Database insert error in submitContactEnquiryAction:", dbError);
          return {
            success: false,
            error: "Failed to record enquiry in database. Please contact us via WhatsApp.",
          };
        }
      } catch (dbEx) {
        console.error("Database exception in submitContactEnquiryAction:", dbEx);
        return {
          success: false,
          error: "Database service error while recording enquiry.",
        };
      }
    }
    // Always keep in DEV_ENQUIRIES_STORE for dev/in-memory fallback lookup
    DEV_ENQUIRIES_STORE.set(enquiry.referenceCode, enquiry);

    return {
      success: true,
      referenceCode,
    };
  } catch (err: any) {
    console.error("Unexpected error in submitContactEnquiryAction:", err);
    return {
      success: false,
      error: "An unexpected system error occurred while submitting your enquiry.",
    };
  }
}
