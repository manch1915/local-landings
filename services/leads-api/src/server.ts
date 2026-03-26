import { serve } from '@hono/node-server';
import { getConnInfo } from '@hono/node-server/conninfo';
import { loadConfig } from './config';
import { buildContainer, jsonLogger } from './container';
import { createApp } from './http/app';

const config = loadConfig();
const { leadService, channels } = buildContainer(config);

const app = createApp({
  leadService,
  trustProxy: config.TRUST_PROXY,
  remoteAddress: (c) => getConnInfo(c).remote.address,
});

const server = serve({ fetch: app.fetch, port: config.PORT }, (info) => {
  jsonLogger('leads-api started', {
    port: info.port,
    channels: channels.map((channel) => channel.name),
  });
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}
