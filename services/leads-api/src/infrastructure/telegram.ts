import type { Lead, LeadChannel } from '../domain/lead';
import { formatTelegramMessage } from '../services/format';
import { ChannelError, postJson, type FetchLike } from './http-json';

interface TelegramResponse {
  ok: boolean;
  description?: string;
}

export class TelegramChannel implements LeadChannel {
  readonly name = 'telegram';

  constructor(
    private readonly botToken: string,
    private readonly chatId: string,
    private readonly fetchFn: FetchLike = fetch,
  ) {}

  async deliver(lead: Lead): Promise<void> {
    const result = await postJson<TelegramResponse>(
      this.fetchFn,
      this.name,
      `https://api.telegram.org/bot${this.botToken}/sendMessage`,
      {
        chat_id: this.chatId,
        text: formatTelegramMessage(lead),
        parse_mode: 'HTML',
        link_preview_options: { is_disabled: true },
      },
    );
    if (!result.ok) throw new ChannelError(this.name, result.description ?? 'not ok');
  }
}
