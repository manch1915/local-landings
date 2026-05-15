import { typografDeep } from '@landings/ui/lib/typograf';
import { getEntry } from 'astro:content';

export async function getPage() {
  const entry = await getEntry('page', 'ru');
  if (!entry) throw new Error('src/content/ru.yaml is missing');
  return typografDeep(entry.data);
}

export type Page = Awaited<ReturnType<typeof getPage>>;

export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

export function rub(value: number): string {
  return `${value.toLocaleString('ru-RU')} ₽`;
}
