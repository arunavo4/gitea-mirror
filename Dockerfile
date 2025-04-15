FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm install -g pnpm
RUN pnpm build

# Production image, copy all the files and run the app
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 gitea-mirror
USER gitea-mirror

# Copy necessary files
COPY --from=builder --chown=gitea-mirror:nodejs /app/dist ./dist
COPY --from=builder --chown=gitea-mirror:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=gitea-mirror:nodejs /app/package.json ./package.json

# Create data directory for SQLite database
RUN mkdir -p /app/data
VOLUME /app/data

# Expose the port
EXPOSE 3000

# Set the environment variables
ENV HOST=0.0.0.0
ENV PORT=3000
ENV DATABASE_URL=sqlite://data/gitea-mirror.db

# Start the application
CMD ["node", "./dist/server/entry.mjs"]
