FROM node:22.23-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/leads/package.json packages/leads/
COPY services/leads-api/package.json services/leads-api/
RUN npm ci --no-audit --no-fund --workspace @landings/leads-api --include-workspace-root=false
COPY packages/leads packages/leads
COPY services/leads-api services/leads-api
RUN npm run build -w @landings/leads-api

# The bundle has no runtime dependencies, so the final image is just Node.
FROM node:22.23-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/services/leads-api/dist ./dist
USER node
EXPOSE 8787
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:8787/api/health || exit 1
CMD ["node", "--enable-source-maps", "dist/server.js"]
