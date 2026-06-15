# Deployment

The stack is two containers: `web` (nginx with the three static sites) and `api` (leads API). Only `web` talks to the outside world; it proxies `/api/` to `api` inside the Compose network.

## 1. Configure

```bash
cp services/leads-api/.env.example services/leads-api/.env
# fill in TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, CRM_PROVIDER and its keys
```

Public URLs are baked into canonical links, Open Graph tags and the sitemap at build time. Put them in a `.env` next to `docker-compose.yml`:

```dotenv
REPAIR_URL=https://remont.example.com
TUTOR_URL=https://tutor.example.com
FITNESS_URL=https://fitness.example.com
# optional analytics
PUBLIC_UMAMI_SRC=https://stats.example.com/script.js
PUBLIC_UMAMI_ID_REPAIR=...
PUBLIC_UMAMI_ID_TUTOR=...
PUBLIC_UMAMI_ID_FITNESS=...
```

## 2. Run

On a clean server with nothing else on ports 80/443, run `docker compose up -d --build` and point any reverse proxy at `127.0.0.1:8081`, `:8082` and `:8083`.

If Caddy or Traefik already runs in Docker, join its network instead of publishing ports:

```bash
PROXY_NETWORK=infra_default docker compose -f docker-compose.yml -f deploy/docker-compose.proxy.yml up -d --build
```

## 3. Caddy

Add one block per domain. Nothing else in the existing Caddyfile changes.

```caddyfile
remont.example.com {
	encode zstd gzip
	reverse_proxy local-landings-web-1:8081
}

tutor.example.com {
	encode zstd gzip
	reverse_proxy local-landings-web-1:8082
}

fitness.example.com {
	encode zstd gzip
	reverse_proxy local-landings-web-1:8083
}
```

Use `127.0.0.1:808x` instead of the container name when Caddy runs on the host. Before reloading: back up the Caddyfile, run `caddy validate`, then `caddy reload`. Add the blocks only after the DNS records exist, otherwise Caddy keeps retrying certificates.

nginx trusts `X-Forwarded-For` only from private networks (the proxy), resolves the visitor's address and passes it to the API, so rate limits apply per visitor. Keep the published ports bound to 127.0.0.1 so nobody can reach nginx around the proxy and forge that header.

## 4. Check

```bash
curl -s https://remont.example.com/api/health          # {"ok":true}
curl -sI https://tutor.example.com/en/ | grep -i cache  # no-cache for HTML
```

Then send a test request through any form and look for it in Telegram and the CRM.

## Serving under a path

To host a site at `https://example.com/demo/remont/` instead of a subdomain, build it with `BASE_PATH=/demo/remont/` and strip the prefix in the proxy (`handle_path /demo/remont/*` in Caddy). Links, assets and the sitemap follow `BASE_PATH`.
