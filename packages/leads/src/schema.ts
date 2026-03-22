import { z } from 'zod';
import { normalizePhone } from './phone';

export const SITES = ['tutor', 'repair', 'fitness'] as const;
export type SiteId = (typeof SITES)[number];

export const LOCALES = ['ru', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

/** Field the form hides from people. Bots fill every input they see. */
export const HONEYPOT_FIELD = 'website';

const contextValue = z.string().trim().max(200);

export const leadInputSchema = z
  .object({
    site: z.enum(SITES),
    locale: z.enum(LOCALES).default('ru'),
    name: z.string().trim().min(2, 'name_short').max(80, 'name_long'),
    phone: z.string().trim().min(5, 'phone_invalid').max(32, 'phone_invalid'),
    message: z.string().trim().max(1000, 'message_long').optional().default(''),
    // Extra answers from a quiz, calculator or the chosen class.
    context: z.record(z.string().max(40), contextValue).optional().default({}),
    consent: z.literal(true, { error: 'consent_required' }),
    [HONEYPOT_FIELD]: z.string().max(200).optional().default(''),
    // Milliseconds between the form becoming visible and the submit.
    elapsedMs: z.number().int().nonnegative().optional(),
    page: z.string().max(300).optional(),
  })
  .transform((input, ctx) => {
    const phone = normalizePhone(input.phone, input.locale === 'ru' ? 'ru' : 'intl');
    if (!phone) {
      ctx.addIssue({ code: 'custom', path: ['phone'], message: 'phone_invalid' });
      return z.NEVER;
    }
    return { ...input, phone };
  });

export type LeadInput = z.input<typeof leadInputSchema>;
export type ValidLead = z.output<typeof leadInputSchema>;

export type FieldErrorCode =
  'name_short' | 'name_long' | 'phone_invalid' | 'message_long' | 'consent_required';

export type LeadResponse =
  | { ok: true; id: string }
  | { ok: false; error: 'validation'; fields: Record<string, string> }
  | { ok: false; error: 'rate_limited'; retryAfterSec: number }
  | { ok: false; error: 'delivery_failed' };
