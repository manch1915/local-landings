import { normalizePhone, type PhoneRegion } from '@landings/leads/phone';

export interface FormValues {
  name: string;
  phone: string;
  message: string;
  consent: boolean;
}

export type FieldError =
  'name_short' | 'name_long' | 'phone_invalid' | 'message_long' | 'consent_required';

/**
 * Same rules as the server schema, without pulling zod into the page bundle.
 * The server stays the source of truth and re-checks everything.
 */
export function validateLead(
  values: FormValues,
  region: PhoneRegion,
): Partial<Record<keyof FormValues, FieldError>> {
  const errors: Partial<Record<keyof FormValues, FieldError>> = {};
  const name = values.name.trim();

  if (name.length < 2) errors.name = 'name_short';
  else if (name.length > 80) errors.name = 'name_long';

  if (!normalizePhone(values.phone, region)) errors.phone = 'phone_invalid';
  if (values.message.trim().length > 1000) errors.message = 'message_long';
  if (!values.consent) errors.consent = 'consent_required';

  return errors;
}
