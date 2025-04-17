# Scripts Directory

This folder contains utility scripts for database management. Each script is described below to help developers understand its purpose and usage.

### init-db.ts
Initializes the SQLite database specified by `DATABASE_URL` or `./data/gitea-mirror.db`. Creates necessary tables, a default admin user, and a default configuration if none exist. Use this script to set up a new production or staging database.

### create-dev-db.ts
Creates a development database at `./data/gitea-mirror-dev.db` with sample or mock data for local testing. Useful for running the frontend and backend in development mode without affecting production data.

### check-db.ts
Validates the existence and integrity of the database at `DATABASE_URL` or `./data/gitea-mirror.db`. Checks table schemas and reports any missing tables or mismatches. Use this script to quickly verify the database state before running migrations or the application.

## Running the Scripts
You can execute these utility scripts using your package manager. From the project root, run:

// ❗ Using pnpm:
pnpm run init-db       # initialize the main database
pnpm run create-dev-db  # create a development database with sample data
pnpm run check-db       # validate database schema and integrity

// ❗ Or with npm:
npm run init-db
npm run create-dev-db
npm run check-db
