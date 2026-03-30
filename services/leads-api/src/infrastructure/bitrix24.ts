import type { Lead, LeadChannel } from '../domain/lead';
import { formatCrmNote, leadTitle } from '../services/format';
import { ChannelError, postJson, type FetchLike } from './http-json';

/** Bitrix24 renders COMMENTS as HTML with BB codes, so user text must not carry markup. */
export function bitrixSafe(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\[/g, '(')
    .replace(/\]/g, ')');
}

interface BitrixResponse {
  result?: number;
  error?: string;
  error_description?: string;
}

/**
 * crm.lead.add through an incoming webhook. In the "simple CRM" mode
 * Bitrix24 turns the lead into a deal with a contact automatically.
 */
export class Bitrix24Channel implements LeadChannel {
  readonly name = 'bitrix24';
  private readonly endpoint: string;

  constructor(
    webhookUrl: string,
    private readonly fetchFn: FetchLike = fetch,
  ) {
    this.endpoint = `${webhookUrl.replace(/\/+$/, '')}/crm.lead.add.json`;
  }

  async deliver(lead: Lead): Promise<void> {
    const result = await postJson<BitrixResponse>(this.fetchFn, this.name, this.endpoint, {
      fields: {
        TITLE: bitrixSafe(leadTitle(lead)),
        NAME: bitrixSafe(lead.name),
        PHONE: [{ VALUE: lead.phone, VALUE_TYPE: 'MOBILE' }],
        COMMENTS: formatCrmNote(lead),
        SOURCE_ID: 'WEB',
        SOURCE_DESCRIPTION: lead.page ?? lead.site,
      },
      params: { REGISTER_SONET_EVENT: 'Y' },
    });
    if (!result.result) {
      throw new ChannelError(this.name, result.error_description ?? result.error ?? 'no lead id');
    }
  }
}
