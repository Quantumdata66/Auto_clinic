"use server";

import { cookies } from "next/headers";
import {
  createAdminClient,
  createServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import {
  PublicOrderTrackingView,
  PublicDiagnosticTrackingView,
  maskCustomerName,
} from "@/types";
import { normalizeNigerianPhone } from "@/lib/utils/phone";

export interface CustomerPortalLookupResult {
  success: boolean;
  customerContact?: string;
  orders: PublicOrderTrackingView[];
  enquiries: PublicDiagnosticTrackingView[];
  error?: string;
}

export interface CustomerOtpRequestResult {
  success: boolean;
  message?: string;
  error?: string;
}

export interface CustomerOtpVerifyResult {
  success: boolean;
  verifiedIdentity?: string;
  error?: string;
}

/**
 * Server Action: Dispatch a One-Time Passcode (OTP) to the customer's email or phone
 * via Supabase Auth.
 */
export async function requestCustomerOtpAction(
  identifier: string,
  channel: "email" | "sms"
): Promise<CustomerOtpRequestResult> {
  if (!identifier || identifier.trim().length === 0) {
    return {
      success: false,
      error: "Please provide a valid contact address or phone number.",
    };
  }

  if (!isSupabaseConfigured()) {
    return {
      success: false,
      error:
        "Customer authentication is unavailable: Supabase environment variables are missing or unconfigured. Real Supabase Auth credentials must be configured.",
    };
  }

  const cleanIdentifier = identifier.trim();

  try {
    const supabase = createServerClient();

    if (channel === "email") {
      const cleanEmail = cleanIdentifier.toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return { success: false, error: "Please enter a valid email address." };
      }

      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) {
        console.error("Supabase email OTP error:", error);
        return {
          success: false,
          error: "Failed to dispatch email verification passcode. Please try again.",
        };
      }

      return {
        success: true,
        message: `A 6-digit verification code has been dispatched to ${cleanEmail}.`,
      };
    } else {
      // SMS channel with canonical Nigerian number normalization
      const normalized = normalizeNigerianPhone(cleanIdentifier);
      if (!normalized) {
        return {
          success: false,
          error: "Please enter a valid Nigerian telephone number (e.g. 0803 123 4567 or +234...).",
        };
      }

      const { error } = await supabase.auth.signInWithOtp({
        phone: normalized.e164,
        options: {
          channel: "sms",
          shouldCreateUser: true,
        },
      });

      if (error) {
        console.error("Supabase phone OTP error:", error);
        return {
          success: false,
          error: "Failed to dispatch SMS verification passcode. Please verify your phone format.",
        };
      }

      return {
        success: true,
        message: `A verification code has been sent via SMS to ${normalized.local} (${normalized.e164}).`,
      };
    }
  } catch (err: any) {
    console.error("Customer OTP request exception:", err);
    return {
      success: false,
      error: "An unexpected error occurred while requesting your verification code.",
    };
  }
}

/**
 * Server Action: Verify customer-submitted OTP against Supabase Auth.
 * Upon successful server-side verification, establishes a secure HTTP-only cookie.
 */
export async function verifyCustomerOtpAction(
  identifier: string,
  channel: "email" | "sms",
  token: string
): Promise<CustomerOtpVerifyResult> {
  if (!identifier || !token) {
    return { success: false, error: "Contact identifier and verification token are required." };
  }

  if (!isSupabaseConfigured()) {
    return {
      success: false,
      error: "Customer authentication is unavailable: Supabase is unconfigured.",
    };
  }

  const cleanIdentifier = identifier.trim();
  const cleanToken = token.trim();

  try {
    const supabase = createServerClient();

    let authResult;
    if (channel === "email") {
      authResult = await supabase.auth.verifyOtp({
        email: cleanIdentifier.toLowerCase(),
        token: cleanToken,
        type: "email",
      });
    } else {
      const normalized = normalizeNigerianPhone(cleanIdentifier);
      if (!normalized) {
        return {
          success: false,
          error: "Please enter a valid Nigerian telephone number (e.g. 0803 123 4567 or +234...).",
        };
      }
      authResult = await supabase.auth.verifyOtp({
        phone: normalized.e164,
        token: cleanToken,
        type: "sms",
      });
    }

    const { data, error } = authResult;

    if (error || !data.session || !data.user) {
      return {
        success: false,
        error: "Invalid or expired verification code. Please check and try again.",
      };
    }

    // Set secure HTTP-only customer session cookie
    try {
      const cookieStore = await cookies();
      cookieStore.set("ac_customer_token", data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: data.session.expires_in || 3600,
      });
    } catch (cookieErr) {
      console.warn("Notice setting customer session cookie:", cookieErr);
    }

    const verifiedIdentity = data.user.email || data.user.phone || cleanIdentifier;

    return {
      success: true,
      verifiedIdentity,
    };
  } catch (err: any) {
    console.error("Customer OTP verification exception:", err);
    return {
      success: false,
      error: "An unexpected error occurred during code verification.",
    };
  }
}

/**
 * Server Action: Customer Sign-Out.
 * Hardened Session Revocation:
 * 1. Retrieves current session token and attempts authoritative server-side session
 *    revocation on the Supabase Auth server (terminating refresh tokens & remote session).
 * 2. Guaranteed Cookie Cleanup: Always deletes the HTTP-only cookie regardless of whether
 *    server revocation succeeds, fails, or throws.
 * 3. Information Disclosure Protection: Absorbs errors and always returns { success: true }
 *    without leaking tokens, user IDs, or configuration status.
 */
export async function customerLogoutAction(): Promise<{ success: boolean }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("ac_customer_token")?.value;

    if (token && isSupabaseConfigured()) {
      try {
        const adminSupabase = createAdminClient();
        await adminSupabase.auth.admin.signOut(token);
      } catch {
        // Intentionally absorb server revocation errors (e.g. network partition,
        // missing service key, or already-revoked session) to prevent information
        // disclosure and ensure client cookie removal always executes.
      }
    }

    try {
      cookieStore.delete("ac_customer_token");
    } catch (cookieErr) {
      console.warn("Notice clearing customer session cookie:", cookieErr);
    }
  } catch (err) {
    console.warn("Notice in customer logout handler:", err);
  }

  return { success: true };
}

/**
 * Server Action: Authenticated Customer Portal lookup.
 * ENFORCEMENT INVARIANT:
 * Strictly verifies customer session via Supabase Auth token (cookie or argument).
 * Binds lookups authoritatively to the verified identity (email/phone) and only returns
 * records matching that identity. Rejects unauthenticated queries and excludes mock fallbacks.
 */
export async function lookupCustomerPortalAction(
  token?: string
): Promise<CustomerPortalLookupResult> {
  let authToken = token;
  if (!authToken) {
    try {
      const cookieStore = await cookies();
      authToken = cookieStore.get("ac_customer_token")?.value;
    } catch {
      // In non-request context (e.g. tests) cookies() may be unavailable
    }
  }

  if (!authToken) {
    return {
      success: false,
      orders: [],
      enquiries: [],
      error:
        "Authentication required: Please verify ownership of your email address or phone number via OTP to access your customer history.",
    };
  }

  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      success: false,
      orders: [],
      enquiries: [],
      error:
        "Customer portal database service is unconfigured. Supabase credentials are required.",
    };
  }

  try {
    const supabase = createServerClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser(authToken);

    if (authErr || !user) {
      return {
        success: false,
        orders: [],
        enquiries: [],
        error: "Customer session is expired or invalid. Please re-authenticate via OTP.",
      };
    }

    const verifiedEmail = user.email ? user.email.toLowerCase() : null;
    const verifiedPhoneRaw = user.phone ? user.phone.replace(/[^0-9+]/g, "") : null;
    const normalizedPhone = verifiedPhoneRaw ? normalizeNigerianPhone(verifiedPhoneRaw) : null;

    if (!verifiedEmail && !normalizedPhone && !verifiedPhoneRaw) {
      return {
        success: false,
        orders: [],
        enquiries: [],
        error: "Authenticated customer record does not contain a verified contact address.",
      };
    }

    const adminSupabase = createAdminClient();
    const orders: PublicOrderTrackingView[] = [];
    const enquiries: PublicDiagnosticTrackingView[] = [];

    // Query filters bound strictly to verified identity
    const orFilterConditions: string[] = [];
    if (verifiedEmail) {
      orFilterConditions.push(`customer_email.eq.${verifiedEmail}`);
    }
    if (normalizedPhone) {
      // Unambiguously match canonical E.164 and canonical local formats for this exact customer
      orFilterConditions.push(`customer_phone.eq.${normalizedPhone.e164}`);
      orFilterConditions.push(`customer_phone.eq.${normalizedPhone.local}`);
    } else if (verifiedPhoneRaw) {
      orFilterConditions.push(`customer_phone.eq.${verifiedPhoneRaw}`);
    }
    const orFilter = orFilterConditions.join(",");

    // 1. Fetch orders matching verified identity
    const { data: orderRows, error: orderErr } = await (adminSupabase as any)
      .from("orders")
      .select(
        "order_number, customer_name, order_status, payment_status, fulfilment_type, total_cents, currency, created_at, shipping_address, order_items(sku_snapshot, product_name_snapshot, quantity, unit_price_cents_snapshot, line_total_cents)"
      )
      .or(orFilter)
      .order("created_at", { ascending: false });

    if (orderErr) {
      console.error("Database error querying customer orders:", orderErr);
    } else if (orderRows && orderRows.length > 0) {
      orderRows.forEach((row: any) => {
        const items = (row.order_items || []).map((i: any) => ({
          skuSnapshot: i.sku_snapshot,
          productNameSnapshot: i.product_name_snapshot,
          quantity: i.quantity,
          unitPriceCentsSnapshot: Number(i.unit_price_cents_snapshot),
          lineTotalCents: Number(i.line_total_cents),
        }));

        const shippingCityOrState =
          row.shipping_address && typeof row.shipping_address === "object"
            ? `${row.shipping_address.city || ""}, ${row.shipping_address.state || ""}`
                .trim()
                .replace(/^,|,$/g, "")
            : undefined;

        orders.push({
          orderNumber: row.order_number,
          customerNameMasked: maskCustomerName(row.customer_name),
          orderStatus: row.order_status,
          paymentStatus: row.payment_status,
          fulfilmentType: row.fulfilment_type,
          totalCents: Number(row.total_cents),
          currency: row.currency || "NGN",
          createdAt: row.created_at,
          shippingCityOrState,
          items,
        });
      });
    }

    // 2. Fetch diagnostic enquiries matching verified identity (strictly omit staff_notes)
    const { data: enqRows, error: enqErr } = await (adminSupabase as any)
      .from("diagnostic_enquiries")
      .select(
        "reference_code, customer_name, vehicle_make, vehicle_model, vehicle_year, symptoms, preferred_contact_method, status, created_at"
      )
      .or(orFilter)
      .order("created_at", { ascending: false });

    if (enqErr) {
      console.error("Database error querying customer enquiries:", enqErr);
    } else if (enqRows && enqRows.length > 0) {
      enqRows.forEach((row: any) => {
        enquiries.push({
          referenceCode: row.reference_code,
          customerNameMasked: maskCustomerName(row.customer_name),
          vehicleMake: row.vehicle_make,
          vehicleModel: row.vehicle_model,
          vehicleYear: row.vehicle_year,
          symptoms: row.symptoms,
          preferredContactMethod: row.preferred_contact_method,
          status: row.status,
          createdAt: row.created_at,
        });
      });
    }

    return {
      success: true,
      customerContact: verifiedEmail || normalizedPhone?.local || verifiedPhoneRaw || "Verified Customer",
      orders,
      enquiries,
    };
  } catch (err: any) {
    console.error("Customer portal lookup error:", err);
    return {
      success: false,
      orders: [],
      enquiries: [],
      error: "An unexpected error occurred while loading your customer portal records.",
    };
  }
}
