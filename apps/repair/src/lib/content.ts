import { typografDeep } from '@landings/ui/lib/typograf';
import { getEntry } from 'astro:content';

export async function getPage() {
  const entry = await getEntry('page', 'ru');
  if (!entry) throw new Error('src/content/ru.yaml is missing');
  return typografDeep(entry.data);
}

export type Page = Awaited<ReturnType<typeof getPage>>;

/** "+7 (843) 211-47-90" -> "tel:+78432114790" */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}
