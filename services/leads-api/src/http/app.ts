import { Hono, type Context } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { secureHeaders } from 'hono/secure-headers';
import type { LeadService } from '../services/lead-service';

export interface AppDeps {
  leadService: LeadService;
  trustProxy: boolean;
  /** Client address from the socket, used when not behind a proxy. */
  remoteAddress: (c: Context) => string | undefined;
}

export function clientKey(
  forwardedFor: string | undefined,
  remote: string | undefined,
  trustProxy: boolean,
): string {
  if (trustProxy && forwardedFor) {
    // The proxy appends the real peer last; earlier entries come from the client.
    const parts = forwardedFor
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);
    const last = parts.at(-1);
    if (last) return last;
  }
  return remote ?? 'unknown';
}

export function createApp(deps: AppDeps): Hono {
  const app = new Hono();

  app.use('*', secureHeaders());

  app.get('/api/health', (c) => c.json({ ok: true }));

  app.post(
    '/api/leads',
    bodyLimit({
      maxSize: 16 * 1024,
      onError: (c) => c.json({ ok: false, error: 'payload_too_large' }, 413),
    }),
    async (c) => {
      let payload: unknown;
      try {
        payload = await c.req.json();
      } catch {
        return c.json({ ok: false, error: 'validation', fields: { form: 'bad_json' } }, 400);
      }

      const key = clientKey(
        c.req.header('x-forwarded-for'),
        deps.remoteAddress(c),
        deps.trustProxy,
      );
      const result = await deps.leadService.submit(payload, { clientKey: key });
      if (result.body.ok === false && result.body.error === 'rate_limited') {
        c.header('retry-after', String(result.body.retryAfterSec));
      }
      return c.json(result.body, result.status as 200);
    },
  );

  app.notFound((c) => c.json({ ok: false, error: 'not_found' }, 404));
  app.onError((error, c) => {
    console.error(error);
    return c.json({ ok: false, error: 'server_error' }, 500);
  });

  return app;
}
