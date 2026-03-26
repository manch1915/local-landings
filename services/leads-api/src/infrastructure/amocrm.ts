import type { Lead, LeadChannel } from '../domain/lead';
import { formatCrmNote, leadTitle } from '../services/format';
import { ChannelError, postJson, type FetchLike } from './http-json';

type ComplexResponse = { id: number; contact_id: number | null }[];

/**
 * Creates a deal with a contact in one call (POST /api/v4/leads/complex),
 * then attaches quiz or calculator answers as a note.
 */
export class AmoCrmChannel implements LeadChannel {
  readonly name = 'amocrm';
  private readonly baseUrl: string;

  constructor(
    subdomain: string,
    private readonly token: string,
    private readonly pipelineId?: number,
    private readonly fetchFn: FetchLike = fetch,
  ) {
    this.baseUrl = `https://${subdomain}.amocrm.ru/api/v4`;
  }

  async deliver(lead: Lead): Promise<void> {
    const headers = { authorization: `Bearer ${this.token}` };
    const deal = {
      name: leadTitle(lead),
      ...(this.pipelineId ? { pipeline_id: this.pipelineId } : {}),
      _embedded: {
        tags: [{ name: lead.site }, { name: 'сайт' }],
        contacts: [
          {
            first_name: lead.name,
            custom_fields_values: [
              { field_code: 'PHONE', values: [{ enum_code: 'MOB', value: lead.phone }] },
            ],
          },
        ],
      },
    };

    const created = await postJson<ComplexResponse>(
      this.fetchFn,
      this.name,
      `${this.baseUrl}/leads/complex`,
      [deal],
      headers,
    );
    const dealId = created[0]?.id;
    if (!dealId) throw new ChannelError(this.name, 'no deal id in response');

    await postJson(
      this.fetchFn,
      this.name,
      `${this.baseUrl}/leads/${dealId}/notes`,
      [{ note_type: 'common', params: { text: formatCrmNote(lead) } }],
      headers,
    );
  }
}
