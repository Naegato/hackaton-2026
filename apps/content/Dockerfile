# Build context: repo root  →  docker build -f apps/content/Dockerfile .
# Requires next.config.ts to have output: 'standalone'

# ── Stage 1: install dependencies ────────────────────────────────────────────
FROM oven/bun:1.3.14-alpine AS deps
WORKDIR /repo

# Copy workspace manifests first for layer-cache efficiency
COPY package.json bun.lock ./
COPY apps/content/package.json     ./apps/content/
COPY apps/application/package.json ./apps/application/
COPY packages/docker/package.json  ./packages/docker/

RUN bun install --frozen-lockfile

# ── Stage 2: build ───────────────────────────────────────────────────────────
FROM oven/bun:1.3.14-alpine AS builder
WORKDIR /repo

COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/apps/content/node_modules ./apps/content/node_modules

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--no-deprecation --max-old-space-size=4096"

RUN cd apps/content && bun run build

# ── Stage 3: runtime ─────────────────────────────────────────────────────────
# Use Node (not bun) — Next.js standalone server.js runs on Node
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# With outputFileTracingRoot set to the monorepo root, standalone output
# preserves the monorepo path prefix: apps/content/server.js
COPY --from=builder --chown=nextjs:nodejs /repo/apps/content/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /repo/apps/content/.next/static      ./apps/content/.next/static

USER nextjs

# Internal port — published as 3001 in the swarm stack
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/content/server.js"]
