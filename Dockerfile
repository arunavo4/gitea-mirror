# syntax=docker/dockerfile:1.4

# Base image with common settings for all stages
FROM node:18-alpine AS base
ENV PNPM_HOME=/usr/local/bin
ENV PATH=$PNPM_HOME:$PATH
RUN apk add --no-cache libc6-compat

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++ gcc

# Install pnpm globally with corepack for better performance
RUN --mount=type=cache,target=/root/.npm \
    corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies with cache mount for faster builds
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --prod=false

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++ gcc

# Install pnpm globally with corepack
RUN --mount=type=cache,target=/root/.npm \
    corepack enable && corepack prepare pnpm@latest --activate

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Production image, copy all the files and run the app
FROM base AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV DATABASE_URL=sqlite://data/gitea-mirror.db

# Create data directory and set up non-root user
RUN mkdir -p /app/data && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 gitea-mirror && \
    chown -R gitea-mirror:nodejs /app/data

# Copy necessary files from builder
COPY --from=builder --chown=gitea-mirror:nodejs /app/dist ./dist
COPY --from=builder --chown=gitea-mirror:nodejs /app/package.json ./package.json

# Copy only production dependencies
COPY --from=deps /app/node_modules ./node_modules
RUN chown -R gitea-mirror:nodejs node_modules

# Switch to non-root user
USER gitea-mirror

# Define volume for database persistence
VOLUME /app/data

# Expose the port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start the application
CMD ["node", "./dist/server/entry.mjs"]
