import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config';
import { clientKey, createApp } from '../src/http/app';
import { MemoryRateLimiter } from '../src/infrastructure/rate-limiter';
import { LeadService } from '../src/services/lead-service';
import { RecordingChannel } from './helpers';

function app() {
  const leadService = new LeadService({
    channels: [new RecordingChannel('crm')],
    rateLimiter: new MemoryRateLimiter(1, 60_000),
    minFillMs: 0,
  });
  return createApp({ leadService, trustProxy: true, remoteAddress: () => '10.0.0.1' });
}

function post(body: string, ip = '203.0.113.7') {
  return new Request('http://localhost/api/leads', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body,
  });
}

const lead = JSON.stringify({ site: 'tutor', name: 'Ольга', phone: '+79001234567', consent: true });

describe('HTTP app', () => {
  it('answers health checks', async () => {
    const res = await app().request('/api/health');
    expect(res.status).toBe(200);
  });

  it('accepts a lead and then rate limits the same client', async () => {
    const server = app();
    expect((await server.request(post(lead))).status).toBe(201);

    const limited = await server.request(post(lead));
    expect(limited.status).toBe(429);
    expect(limited.headers.get('retry-after')).toBeTruthy();
  });

  it('rejects broken JSON', async () => {
    const res = await app().request(post('{nope'));
    expect(res.status).toBe(400);
  });

  it('rejects oversized bodies', async () => {
    const res = await app().request(post(JSON.stringify({ message: 'x'.repeat(20_000) })));
    expect(res.status).toBe(413);
  });
});

describe('clientKey', () => {
  it('takes the address the proxy appended', () => {
    expect(clientKey('6.6.6.6, 203.0.113.7', '10.0.0.1', true)).toBe('203.0.113.7');
  });

  it('ignores the header when not behind a proxy', () => {
    expect(clientKey('6.6.6.6', '10.0.0.1', false)).toBe('10.0.0.1');
  });
});

describe('loadConfig', () => {
  it('defaults to the mock CRM', () => {
    expect(loadConfig({}).CRM_PROVIDER).toBe('mock');
  });

  it('refuses a half-configured Telegram', () => {
    expect(() => loadConfig({ TELEGRAM_BOT_TOKEN: '1:a' })).toThrow(/TELEGRAM_CHAT_ID/);
  });

  it('refuses amoCRM without credentials', () => {
    expect(() => loadConfig({ CRM_PROVIDER: 'amocrm' })).toThrow(/AMOCRM_SUBDOMAIN/);
  });
});
