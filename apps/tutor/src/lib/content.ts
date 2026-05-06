import { typografDeep } from '@landings/ui/lib/typograf';
import { getEntry } from 'astro:content';

export type Locale = 'ru' | 'en';

export async function getPage(locale: Locale) {
  const entry = await getEntry('page', locale);
  if (!entry) throw new Error(`src/content/${locale}.yaml is missing`);
  return typografDeep(entry.data);
}

export type Page = Awaited<ReturnType<typeof getPage>>;

export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

export function money(value: number, currency: Page['currency'], locale: Locale): string {
  return new Intl.NumberFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

/** Root-relative link that respects BASE_PATH and the locale prefix. */
export function href(locale: Locale, path = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const prefix = locale === 'en' ? '/en' : '';
  return `${base}${prefix}/${path}`.replace(/\/{2,}/g, '/');
}
