#!/bin/sh
set -e

# Ensure data directory exists
mkdir -p /app/data

# Initialize the database if it doesn't exist
if [ ! -f "/app/data/gitea-mirror.db" ]; then
  echo "Initializing database..."
  node -r tsx/cjs scripts/init-db.ts
else
  echo "Database already exists, checking for issues..."
  node -r tsx/cjs scripts/fix-db-issues.ts
fi

# Start the application
echo "Starting Gitea Mirror..."
exec node ./dist/server/entry.mjs
