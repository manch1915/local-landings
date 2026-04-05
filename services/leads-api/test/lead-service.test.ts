import { describe, expect, it } from 'vitest';
import { MemoryRateLimiter } from '../src/infrastructure/rate-limiter';
import { LeadService } from '../src/services/lead-service';
import { RecordingChannel } from './helpers';

const valid = {
  site: 'fitness',
  name: 'Дмитрий',
  phone: '8 (913) 555-12-34',
  consent: true,
  website: '',
  elapsedMs: 9000,
  context: { class: 'Функциональный тренинг, ср 19:00' },
};

function setup(channels = [new RecordingChannel('telegram'), new RecordingChannel('crm')]) {
  const service = new LeadService({
    channels,
    rateLimiter: new MemoryRateLimiter(2, 60_000),
    minFillMs: 2500,
    now: () => new Date('2026-10-19T09:00:00Z'),
    newId: () => 'lead0001',
  });
  return { service, channels };
}

describe('LeadService', () => {
  it('delivers a valid lead to every channel', async () => {
    const { service, channels } = setup();
    const result = await service.submit(valid, { clientKey: '1.1.1.1' });

    expect(result).toEqual({ status: 201, body: { ok: true, id: 'lead0001' } });
    for (const channel of channels) {
      expect(channel.delivered).toHaveLength(1);
      expect(channel.delivered[0]?.phone).toBe('+79135551234');
      expect(channel.delivered[0]).not.toHaveProperty('website');
    }
  });

  it('pretends to accept honeypot hits but delivers nothing', async () => {
    const { service, channels } = setup();
    const result = await service.submit(
      { ...valid, website: 'http://spam.example' },
      { clientKey: 'x' },
    );

    expect(result.status).toBe(200);
    expect(result.body.ok).toBe(true);
    expect(channels[0]?.delivered).toHaveLength(0);
  });

  it('drops forms submitted faster than a person can type', async () => {
    const { service, channels } = setup();
    await service.submit({ ...valid, elapsedMs: 400 }, { clientKey: 'x' });
    expect(channels[1]?.delivered).toHaveLength(0);
  });

  it('treats a request without the fill timer as a bot', async () => {
    const { service, channels } = setup();
    const { elapsedMs: _skip, ...withoutTimer } = valid;
    const result = await service.submit(withoutTimer, { clientKey: 'x' });
    expect(result.status).toBe(200);
    expect(channels[0]?.delivered).toHaveLength(0);
  });

  it('does not spend the site cap on spam', async () => {
    const channel = new RecordingChannel('crm');
    const service = new LeadService({
      channels: [channel],
      rateLimiter: new MemoryRateLimiter(10, 60_000),
      siteRateLimiter: new MemoryRateLimiter(1, 60_000),
      minFillMs: 2500,
    });
    await service.submit({ ...valid, website: 'spam' }, { clientKey: 'bot' });
    const real = await service.submit(valid, { clientKey: 'person' });
    expect(real.status).toBe(201);
  });

  it('caps leads per site across all clients', async () => {
    const channel = new RecordingChannel('crm');
    const service = new LeadService({
      channels: [channel],
      rateLimiter: new MemoryRateLimiter(10, 60_000),
      siteRateLimiter: new MemoryRateLimiter(2, 60_000),
      minFillMs: 0,
    });
    await service.submit(valid, { clientKey: 'a' });
    await service.submit(valid, { clientKey: 'b' });
    const third = await service.submit(valid, { clientKey: 'c' });
    expect(third.status).toBe(429);
    expect(channel.delivered).toHaveLength(2);
  });

  it('returns field codes for invalid input without touching the limit', async () => {
    const { service } = setup();
    for (let i = 0; i < 3; i++) {
      const result = await service.submit({ ...valid, phone: '12' }, { clientKey: 'same' });
      expect(result.status).toBe(422);
      expect(result.body).toMatchObject({
        error: 'validation',
        fields: { phone: 'phone_invalid' },
      });
    }
    const ok = await service.submit(valid, { clientKey: 'same' });
    expect(ok.status).toBe(201);
  });

  it('rate limits repeated submits from one client', async () => {
    const { service } = setup();
    await service.submit(valid, { clientKey: 'same' });
    await service.submit(valid, { clientKey: 'same' });
    const third = await service.submit(valid, { clientKey: 'same' });

    expect(third.status).toBe(429);
    expect(third.body).toMatchObject({ error: 'rate_limited' });
    const other = await service.submit(valid, { clientKey: 'other' });
    expect(other.status).toBe(201);
  });

  it('accepts the lead when at least one channel works', async () => {
    const { service } = setup([
      new RecordingChannel('telegram', true),
      new RecordingChannel('crm'),
    ]);
    const result = await service.submit(valid, { clientKey: 'x' });
    expect(result.status).toBe(201);
  });

  it('reports delivery failure when every channel is down', async () => {
    const { service } = setup([
      new RecordingChannel('telegram', true),
      new RecordingChannel('crm', true),
    ]);
    const result = await service.submit(valid, { clientKey: 'x' });
    expect(result).toEqual({ status: 502, body: { ok: false, error: 'delivery_failed' } });
  });
});

describe('MemoryRateLimiter', () => {
  it('frees a slot once the window passes', () => {
    const limiter = new MemoryRateLimiter(1, 10_000);
    expect(limiter.hit('k', 0)).toBe(0);
    expect(limiter.hit('k', 1_000)).toBe(9);
    expect(limiter.hit('k', 10_001)).toBe(0);
  });

  it('refuses new keys while the map is full of live ones', () => {
    const limiter = new MemoryRateLimiter(1, 60_000, 2);
    limiter.hit('a', 0);
    limiter.hit('b', 1);
    expect(limiter.hit('c', 2)).toBe(60);
    // Known keys keep their own window.
    expect(limiter.hit('a', 3)).toBeGreaterThan(0);
    // Once old windows expire there is room again.
    expect(limiter.hit('c', 70_000)).toBe(0);
  });
});
