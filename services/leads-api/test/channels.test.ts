import { describe, expect, it } from 'vitest';
import { AmoCrmChannel } from '../src/infrastructure/amocrm';
import { Bitrix24Channel } from '../src/infrastructure/bitrix24';
import { MockCrmChannel } from '../src/infrastructure/mock-crm';
import { TelegramChannel } from '../src/infrastructure/telegram';
import { formatTelegramMessage } from '../src/services/format';
import { fakeFetch, makeLead } from './helpers';

interface AmoDeal {
  pipeline_id?: number;
  _embedded: { contacts: { custom_fields_values: unknown[] }[] };
}

describe('TelegramChannel', () => {
  it('sends an HTML message to the configured chat', async () => {
    const { fn, calls } = fakeFetch([{ body: { ok: true } }]);
    await new TelegramChannel('123:abc', '-100500', fn).deliver(makeLead());

    expect(calls[0]?.url).toBe('https://api.telegram.org/bot123:abc/sendMessage');
    expect(calls[0]?.body).toMatchObject({ chat_id: '-100500', parse_mode: 'HTML' });
  });

  it('throws when Telegram rejects the message', async () => {
    const { fn } = fakeFetch([{ status: 400, body: { ok: false, description: 'chat not found' } }]);
    await expect(new TelegramChannel('t', 'c', fn).deliver(makeLead())).rejects.toThrow(
      /telegram: HTTP 400/,
    );
  });

  it('escapes user input in the message', () => {
    const text = formatTelegramMessage(makeLead({ message: '<script>' }));
    expect(text).toContain('Ирина &lt;Ким&gt;');
    expect(text).toContain('Комментарий: &lt;script&gt;');
    expect(text).toContain('Площадь: 54 м²');
  });
});

describe('AmoCrmChannel', () => {
  it('creates a deal with a contact and adds a note', async () => {
    const { fn, calls } = fakeFetch([{ body: [{ id: 777, contact_id: 5 }] }, { body: {} }]);
    await new AmoCrmChannel('otves', 'token', 42, fn).deliver(makeLead());

    expect(calls[0]?.url).toBe('https://otves.amocrm.ru/api/v4/leads/complex');
    expect(calls[0]?.headers.authorization).toBe('Bearer token');
    const [deal] = calls[0]?.body as AmoDeal[];
    expect(deal?.pipeline_id).toBe(42);
    expect(deal?._embedded.contacts[0]?.custom_fields_values[0]).toEqual({
      field_code: 'PHONE',
      values: [{ enum_code: 'MOB', value: '+79123456789' }],
    });
    expect(calls[1]?.url).toBe('https://otves.amocrm.ru/api/v4/leads/777/notes');
  });

  it('fails when amoCRM returns an error', async () => {
    const { fn } = fakeFetch([{ status: 401, body: { title: 'Unauthorized' } }]);
    await expect(new AmoCrmChannel('x', 'bad', undefined, fn).deliver(makeLead())).rejects.toThrow(
      /amocrm: HTTP 401/,
    );
  });
});

describe('Bitrix24Channel', () => {
  it('posts crm.lead.add to the webhook', async () => {
    const { fn, calls } = fakeFetch([{ body: { result: 3465 } }]);
    await new Bitrix24Channel('https://b24.example/rest/1/key/', fn).deliver(makeLead());

    expect(calls[0]?.url).toBe('https://b24.example/rest/1/key/crm.lead.add.json');
    expect(calls[0]?.body).toMatchObject({
      fields: { NAME: 'Ирина <Ким>', SOURCE_ID: 'WEB', PHONE: [{ VALUE: '+79123456789' }] },
    });
  });

  it('surfaces the Bitrix24 error description', async () => {
    const { fn } = fakeFetch([
      { body: { error: 'insufficient_scope', error_description: 'no crm scope' } },
    ]);
    const channel = new Bitrix24Channel('https://b24.example/rest/1/key', fn);
    await expect(channel.deliver(makeLead())).rejects.toThrow('no crm scope');
  });
});

describe('MockCrmChannel', () => {
  it('keeps recent deals for the demo', async () => {
    const channel = new MockCrmChannel(() => {});
    await channel.deliver(makeLead());
    expect(channel.recent()[0]).toMatchObject({ id: 1001, phone: '+79123456789' });
  });
});
