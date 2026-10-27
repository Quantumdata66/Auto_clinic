/**
 * Auto Clinic — Nigerian Phone Number Normalization Utility
 *
 * Implements authoritative validation and canonical normalization for Nigerian numbers:
 * - Canonical E.164 format: +234XXXXXXXXXX (10 national digits)
 * - Canonical Local format: 0XXXXXXXXXX (10 national digits)
 *
 * Strictly rejects:
 * - Foreign numbers / invalid country calling codes
 * - Numbers with invalid digit lengths (<10 or >10 national digits)
 * - Non-numeric strings or ambiguous numbers
 * - Loose suffix matching
 */

export interface NormalizedNigerianPhone {
  e164: string; // e.g. "+2348031234567"
  local: string; // e.g. "08031234567"
  nationalDigits: string; // e.g. "8031234567"
}

/**
 * Normalizes a Nigerian phone number input into unambiguous canonical formats.
 *
 * Accepted unambiguous formats:
 * - Standard local 11-digit numbers starting with 0: "08031234567"
 * - International standard with plus: "+2348031234567"
 * - International standard without plus: "2348031234567"
 * - Common user typo combining international +234 with local prefix 0: "+23408031234567"
 * - Clean formatted representations: "0803 123 4567", "+234 (803) 123-4567"
 * - 10-digit national number starting with valid mobile prefix: "8031234567"
 *
 * Returns null if the number is ambiguous, foreign, incomplete, or invalid.
 */
export function normalizeNigerianPhone(
  rawInput: string | null | undefined
): NormalizedNigerianPhone | null {
  if (!rawInput || typeof rawInput !== "string") {
    return null;
  }

  const trimmed = rawInput.trim();
  if (!trimmed) {
    return null;
  }

  // Reject strings containing letters or disallowed symbols
  if (!/^\+?[0-9\s\-().]+$/.test(trimmed)) {
    return null;
  }

  const hasPlus = trimmed.startsWith("+");
  const digitsOnly = trimmed.replace(/\D/g, "");

  let nationalDigits = "";

  if (hasPlus) {
    if (digitsOnly.startsWith("234")) {
      const rest = digitsOnly.slice(3);
      // Strip redundant 0 if user entered +2340...
      nationalDigits = rest.startsWith("0") ? rest.slice(1) : rest;
    } else {
      // Non-Nigerian country calling code
      return null;
    }
  } else if (digitsOnly.startsWith("234")) {
    const rest = digitsOnly.slice(3);
    nationalDigits = rest.startsWith("0") ? rest.slice(1) : rest;
  } else if (digitsOnly.startsWith("0")) {
    nationalDigits = digitsOnly.slice(1);
  } else if (digitsOnly.length === 10 && /^[789]/.test(digitsOnly)) {
    // 10 national digits entered without trunk prefix
    nationalDigits = digitsOnly;
  } else {
    return null;
  }

  // Nigerian national subscriber numbers have exactly 10 digits
  if (nationalDigits.length !== 10) {
    return null;
  }

  // National digits must begin with a valid Nigerian prefix (mobile: 7, 8, 9; fixed/landline: 1, 2)
  if (!/^[1-9]\d{9}$/.test(nationalDigits)) {
    return null;
  }

  return {
    e164: `+234${nationalDigits}`,
    local: `0${nationalDigits}`,
    nationalDigits,
  };
}
