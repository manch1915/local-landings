import { randomUUID } from 'node:crypto';
import { HONEYPOT_FIELD, leadInputSchema, type LeadResponse } from '@landings/leads';
import type { Lead, LeadChannel, RateLimiter } from '../domain/lead';

export interface LeadServiceOptions {
  channels: LeadChannel[];
  rateLimiter: RateLimiter;
  /** Cap per site, so a botnet can't flood the manager's Telegram. */
  siteRateLimiter?: RateLimiter;
  minFillMs: number;
  now?: () => Date;
  newId?: () => string;
  log?: (message: string, extra?: Record<string, unknown>) => void;
}

export interface SubmitMeta {
  clientKey: string;
}

export interface SubmitResult {
  status: number;
  body: LeadResponse;
}

export class LeadService {
  private readonly now: () => Date;
  private readonly newId: () => string;
  private readonly log: NonNullable<LeadServiceOptions['log']>;

  constructor(private readonly options: LeadServiceOptions) {
    this.now = options.now ?? (() => new Date());
    this.newId = options.newId ?? (() => randomUUID().slice(0, 8));
    this.log = options.log ?? (() => {});
  }

  async submit(payload: unknown, meta: SubmitMeta): Promise<SubmitResult> {
    const now = this.now();

    const parsed = leadInputSchema.safeParse(payload);
    if (!parsed.success) {
      const fields: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? 'form');
        fields[key] ??= issue.message;
      }
      return { status: 422, body: { ok: false, error: 'validation', fields } };
    }

    // Counted after validation so a person fixing a typo doesn't burn the limit.
    const retryAfterSec =
      this.options.rateLimiter.hit(meta.clientKey, now.getTime()) ||
      (this.options.siteRateLimiter?.hit(parsed.data.site, now.getTime()) ?? 0);
    if (retryAfterSec > 0) {
      return { status: 429, body: { ok: false, error: 'rate_limited', retryAfterSec } };
    }

    const { [HONEYPOT_FIELD]: trap, elapsedMs, ...data } = parsed.data;
    const lead: Lead = { ...data, id: this.newId(), receivedAt: now };

    // Bots get the same success answer, so they have nothing to tune against.
    // Our form always reports elapsedMs; a request without it was not sent by the page.
    if (trap !== '' || elapsedMs === undefined || elapsedMs < this.options.minFillMs) {
      this.log('lead dropped as spam', { site: lead.site, trap: trap !== '', elapsedMs });
      return { status: 200, body: { ok: true, id: lead.id } };
    }

    const results = await Promise.allSettled(
      this.options.channels.map((channel) => channel.deliver(lead)),
    );
    const failed = results.flatMap((result, index) =>
      result.status === 'rejected' ? [this.options.channels[index]?.name ?? String(index)] : [],
    );
    for (const [index, result] of results.entries()) {
      if (result.status === 'rejected') {
        this.log('channel failed', {
          channel: this.options.channels[index]?.name,
          error: String(result.reason),
          lead: lead.id,
        });
      }
    }

    // One working channel is enough: the manager will see the lead.
    if (this.options.channels.length > 0 && failed.length === this.options.channels.length) {
      return { status: 502, body: { ok: false, error: 'delivery_failed' } };
    }

    this.log('lead accepted', { site: lead.site, lead: lead.id, failed });
    return { status: 201, body: { ok: true, id: lead.id } };
  }
}
