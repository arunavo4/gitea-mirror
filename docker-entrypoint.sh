#!/bin/sh
set -e


# Ensure data directory exists
mkdir -p /app/data

# If pnpm is available, run setup (for dev images), else run node init directly
if command -v pnpm >/dev/null 2>&1; then
  echo "Running pnpm setup (if needed)..."
  pnpm setup || true
fi

# Initialize the database if it doesn't exist
if [ ! -f "/app/data/gitea-mirror.db" ]; then
  echo "Initializing database..."
  if [ -f "scripts/init-db.ts" ]; then
    node -r tsx/cjs scripts/init-db.ts
  elif [ -f "scripts/manage-db.ts" ]; then
    node -r tsx/cjs scripts/manage-db.ts init
  fi
else
  echo "Database already exists, checking for issues..."
  if [ -f "scripts/fix-db-issues.ts" ]; then
    node -r tsx/cjs scripts/fix-db-issues.ts
  elif [ -f "scripts/manage-db.ts" ]; then
    node -r tsx/cjs scripts/manage-db.ts fix
  fi

  # Update the database schema
  echo "Updating database schema..."
  if [ -f "scripts/manage-db.ts" ]; then
    node -r tsx/cjs scripts/manage-db.ts update-schema
  fi

  # Run migrations
  echo "Running database migrations..."
  if [ -f "scripts/run-migrations.ts" ]; then
    node -r tsx/cjs scripts/run-migrations.ts
  fi
fi

# Start the application
echo "Starting Gitea Mirror..."
exec node ./dist/server/entry.mjs
