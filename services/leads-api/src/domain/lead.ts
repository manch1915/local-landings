import type { SiteId, ValidLead } from '@landings/leads';

export interface Lead extends Omit<ValidLead, 'website' | 'elapsedMs'> {
  id: string;
  receivedAt: Date;
}

export const SITE_TITLES: Record<SiteId, string> = {
  tutor: 'Английский с Анной',
  repair: 'Отвес, ремонт квартир',
  fitness: 'Каденс, фитнес-студия',
};

/** Where a lead goes after it passes the spam checks: Telegram, a CRM, a log. */
export interface LeadChannel {
  readonly name: string;
  deliver(lead: Lead): Promise<void>;
}

export interface RateLimiter {
  /** Counts the attempt and returns seconds to wait, or 0 when allowed. */
  hit(key: string, now: number): number;
}
