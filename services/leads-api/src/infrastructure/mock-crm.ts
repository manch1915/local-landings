import type { Lead, LeadChannel } from '../domain/lead';
import { formatCrmNote, leadTitle } from '../services/format';

export interface MockDeal {
  id: number;
  title: string;
  phone: string;
  note: string;
  createdAt: string;
}

/** Demo stand-in for a CRM: keeps the last deals in memory and logs them. */
export class MockCrmChannel implements LeadChannel {
  readonly name = 'crm-mock';
  private readonly deals: MockDeal[] = [];
  private nextId = 1001;

  constructor(private readonly log: (message: string, extra?: Record<string, unknown>) => void) {}

  deliver(lead: Lead): Promise<void> {
    const deal: MockDeal = {
      id: this.nextId++,
      title: leadTitle(lead),
      phone: lead.phone,
      note: formatCrmNote(lead),
      createdAt: lead.receivedAt.toISOString(),
    };
    this.deals.unshift(deal);
    this.deals.length = Math.min(this.deals.length, 50);
    this.log('mock crm deal created', { deal: deal.id, lead: lead.id });
    return Promise.resolve();
  }

  recent(): readonly MockDeal[] {
    return this.deals;
  }
}
