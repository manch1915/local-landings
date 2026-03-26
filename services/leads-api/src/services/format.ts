import { SITE_TITLES, type Lead } from '../domain/lead';

const CONTEXT_LABELS: Record<string, string> = {
  goal: 'Цель',
  level: 'Уровень',
  format: 'Формат',
  course: 'Подобранный курс',
  area: 'Площадь',
  property: 'Жильё',
  scope: 'Вид ремонта',
  extras: 'Дополнительно',
  estimate: 'Оценка',
  class: 'Занятие',
  plan: 'Абонемент',
  source: 'Форма',
};

export function contextLines(lead: Lead): string[] {
  return Object.entries(lead.context).map(
    ([key, value]) => `${CONTEXT_LABELS[key] ?? key}: ${value}`,
  );
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function leadTitle(lead: Lead): string {
  return `Заявка с сайта «${SITE_TITLES[lead.site]}»: ${lead.name}`;
}

/** Telegram message in HTML parse mode. */
export function formatTelegramMessage(lead: Lead): string {
  const lines = [
    `<b>Новая заявка</b>`,
    escapeHtml(SITE_TITLES[lead.site]),
    '',
    `Имя: ${escapeHtml(lead.name)}`,
    `Телефон: <a href="tel:${lead.phone}">${lead.phone}</a>`,
    ...contextLines(lead).map(escapeHtml),
  ];
  if (lead.message) lines.push('', `Комментарий: ${escapeHtml(lead.message)}`);
  if (lead.locale !== 'ru') lines.push(`Язык страницы: ${lead.locale.toUpperCase()}`);
  lines.push('', `<i>№ ${lead.id}</i>`);
  return lines.join('\n');
}

/** Plain text note for a CRM card. */
export function formatCrmNote(lead: Lead): string {
  const lines = [...contextLines(lead)];
  if (lead.message) lines.push(`Комментарий: ${lead.message}`);
  if (lead.page) lines.push(`Страница: ${lead.page}`);
  lines.push(`Заявка № ${lead.id}`);
  return lines.join('\n');
}
