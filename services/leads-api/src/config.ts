import { z } from 'zod';

const optionalString = z
  .string()
  .trim()
  .transform((value) => (value === '' ? undefined : value))
  .optional();

const configSchema = z
  .object({
    PORT: z.coerce.number().int().positive().default(8787),
    TRUST_PROXY: z.stringbool().default(false),
    TELEGRAM_BOT_TOKEN: optionalString,
    TELEGRAM_CHAT_ID: optionalString,
    CRM_PROVIDER: z.enum(['mock', 'amocrm', 'bitrix24']).default('mock'),
    AMOCRM_SUBDOMAIN: optionalString,
    AMOCRM_TOKEN: optionalString,
    AMOCRM_PIPELINE_ID: z.coerce.number().int().positive().optional().catch(undefined),
    BITRIX24_WEBHOOK_URL: optionalString.pipe(z.url().optional()),
    RATE_LIMIT_PER_10_MIN: z.coerce.number().int().positive().default(5),
    SITE_LIMIT_PER_10_MIN: z.coerce.number().int().positive().default(60),
    MIN_FILL_MS: z.coerce.number().int().nonnegative().default(2500),
  })
  .superRefine((env, ctx) => {
    if (env.CRM_PROVIDER === 'amocrm' && !(env.AMOCRM_SUBDOMAIN && env.AMOCRM_TOKEN)) {
      ctx.addIssue({ code: 'custom', message: 'amocrm needs AMOCRM_SUBDOMAIN and AMOCRM_TOKEN' });
    }
    if (env.CRM_PROVIDER === 'bitrix24' && !env.BITRIX24_WEBHOOK_URL) {
      ctx.addIssue({ code: 'custom', message: 'bitrix24 needs BITRIX24_WEBHOOK_URL' });
    }
    if (Boolean(env.TELEGRAM_BOT_TOKEN) !== Boolean(env.TELEGRAM_CHAT_ID)) {
      ctx.addIssue({ code: 'custom', message: 'set both TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID' });
    }
  });

export type Config = z.output<typeof configSchema>;

export function loadConfig(env: Record<string, string | undefined> = process.env): Config {
  const result = configSchema.safeParse(env);
  if (!result.success) {
    throw new Error(`Invalid environment:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}
