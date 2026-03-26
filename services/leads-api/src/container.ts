import type { Config } from './config';
import type { LeadChannel } from './domain/lead';
import { AmoCrmChannel } from './infrastructure/amocrm';
import { Bitrix24Channel } from './infrastructure/bitrix24';
import { MockCrmChannel } from './infrastructure/mock-crm';
import { MemoryRateLimiter } from './infrastructure/rate-limiter';
import { TelegramChannel } from './infrastructure/telegram';
import { LeadService } from './services/lead-service';

export type Logger = (message: string, extra?: Record<string, unknown>) => void;

export const jsonLogger: Logger = (message, extra) => {
  console.log(JSON.stringify({ time: new Date().toISOString(), message, ...extra }));
};

function crmChannel(config: Config, log: Logger): LeadChannel {
  switch (config.CRM_PROVIDER) {
    case 'amocrm':
      return new AmoCrmChannel(
        config.AMOCRM_SUBDOMAIN ?? '',
        config.AMOCRM_TOKEN ?? '',
        config.AMOCRM_PIPELINE_ID,
      );
    case 'bitrix24':
      return new Bitrix24Channel(config.BITRIX24_WEBHOOK_URL ?? '');
    case 'mock':
      return new MockCrmChannel(log);
  }
}

export function buildContainer(config: Config, log: Logger = jsonLogger) {
  const channels: LeadChannel[] = [crmChannel(config, log)];
  if (config.TELEGRAM_BOT_TOKEN && config.TELEGRAM_CHAT_ID) {
    channels.unshift(new TelegramChannel(config.TELEGRAM_BOT_TOKEN, config.TELEGRAM_CHAT_ID));
  } else {
    log('telegram is not configured, leads go to the CRM channel only');
  }

  const leadService = new LeadService({
    channels,
    rateLimiter: new MemoryRateLimiter(config.RATE_LIMIT_PER_10_MIN, 10 * 60 * 1000),
    minFillMs: config.MIN_FILL_MS,
    log,
  });

  return { leadService, channels };
}
