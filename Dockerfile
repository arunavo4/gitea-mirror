# syntax=docker/dockerfile:1.4

FROM node:lts-alpine AS base
ENV PNPM_HOME=/usr/local/bin
ENV PATH=$PNPM_HOME:$PATH
RUN apk add --no-cache libc6-compat

# -----------------------------------
FROM base AS deps
WORKDIR /app
RUN apk add --no-cache python3 make g++ gcc

RUN --mount=type=cache,target=/root/.npm \
  corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml* ./

# Full dev install
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
  pnpm install --frozen-lockfile

# -----------------------------------
FROM base AS builder
WORKDIR /app
RUN apk add --no-cache python3 make g++ gcc

RUN --mount=type=cache,target=/root/.npm \
  corepack enable && corepack prepare pnpm@latest --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm build

# -----------------------------------
FROM deps AS pruner
WORKDIR /app

# Prune dev dependencies and just keep the production bits
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
  pnpm prune --prod

# -----------------------------------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV DATABASE_URL=sqlite://data/gitea-mirror.db

RUN apk add --no-cache wget && \
  mkdir -p /app/data && \
  addgroup --system --gid 1001 nodejs && \
  adduser --system --uid 1001 gitea-mirror && \
  chown -R gitea-mirror:nodejs /app/data

COPY --from=builder --chown=gitea-mirror:nodejs /app/dist ./dist
COPY --from=pruner --chown=gitea-mirror:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=gitea-mirror:nodejs /app/package.json ./package.json

USER gitea-mirror

VOLUME /app/data
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["node", "./dist/server/entry.mjs"]