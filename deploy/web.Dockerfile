# Builds all three landings and serves them with nginx.
FROM node:22.23-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/leads/package.json packages/leads/
COPY packages/ui/package.json packages/ui/
COPY services/leads-api/package.json services/leads-api/
COPY apps/repair/package.json apps/repair/
COPY apps/tutor/package.json apps/tutor/
COPY apps/fitness/package.json apps/fitness/
RUN npm ci --no-audit --no-fund

COPY . .

ARG REPAIR_URL=http://localhost:8081
ARG TUTOR_URL=http://localhost:8082
ARG FITNESS_URL=http://localhost:8083
ARG PUBLIC_UMAMI_SRC=""
ARG PUBLIC_UMAMI_ID_REPAIR=""
ARG PUBLIC_UMAMI_ID_TUTOR=""
ARG PUBLIC_UMAMI_ID_FITNESS=""
ARG PUBLIC_YM_ID=""
ENV ASTRO_TELEMETRY_DISABLED=1 PUBLIC_UMAMI_SRC=$PUBLIC_UMAMI_SRC PUBLIC_YM_ID=$PUBLIC_YM_ID

RUN SITE_URL=$REPAIR_URL PUBLIC_UMAMI_ID=$PUBLIC_UMAMI_ID_REPAIR npm run build -w @landings/repair \
 && SITE_URL=$TUTOR_URL PUBLIC_UMAMI_ID=$PUBLIC_UMAMI_ID_TUTOR npm run build -w @landings/tutor \
 && SITE_URL=$FITNESS_URL PUBLIC_UMAMI_ID=$PUBLIC_UMAMI_ID_FITNESS npm run build -w @landings/fitness

FROM nginx:1.29-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY deploy/site.conf /etc/nginx/snippets/site.conf
COPY --from=build /app/apps/repair/dist /srv/repair
COPY --from=build /app/apps/tutor/dist /srv/tutor
COPY --from=build /app/apps/fitness/dist /srv/fitness
EXPOSE 8081 8082 8083
