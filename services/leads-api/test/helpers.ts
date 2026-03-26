import type { Lead, LeadChannel } from '../src/domain/lead';

export function makeLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: 'a1b2c3d4',
    receivedAt: new Date('2026-10-19T09:00:00Z'),
    site: 'repair',
    locale: 'ru',
    name: 'Ирина <Ким>',
    phone: '+79123456789',
    message: '',
    context: { area: '54 м²', scope: 'Капитальный' },
    page: 'https://otves.example/',
    consent: true,
    ...overrides,
  };
}

export class RecordingChannel implements LeadChannel {
  readonly delivered: Lead[] = [];
  constructor(
    readonly name: string,
    private readonly fail = false,
  ) {}

  deliver(lead: Lead): Promise<void> {
    if (this.fail) return Promise.reject(new Error(`${this.name} is down`));
    this.delivered.push(lead);
    return Promise.resolve();
  }
}

export interface RecordedCall {
  url: string;
  headers: Record<string, string>;
  body: unknown;
}

/** fetch stub that answers with queued JSON bodies and records requests. */
export function fakeFetch(responses: { status?: number; body: unknown }[]) {
  const calls: RecordedCall[] = [];
  const fn = ((input: string | URL | Request, init?: RequestInit) => {
    calls.push({
      url: String(input),
      headers: Object.fromEntries(new Headers(init?.headers).entries()),
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    });
    const next = responses.shift() ?? { body: {} };
    return Promise.resolve(new Response(JSON.stringify(next.body), { status: next.status ?? 200 }));
  }) as typeof fetch;
  return { fn, calls };
}
