# Data Directory

This directory contains the SQLite database files for the Gitea Mirror application.

## Files

- `gitea-mirror.db`: The main database file used in production mode. This file is **not** committed to the repository as it may contain sensitive information like tokens.
- `gitea-mirror-dev.db`: A development database with mock data. This file is committed to the repository for development purposes.

## Important Notes

- **Never commit `gitea-mirror.db` to the repository** as it may contain sensitive information like GitHub and Gitea tokens.
- When running in real data mode (`pnpm dev:real`), the application will use `gitea-mirror.db`.
- When running in mock data mode (`pnpm dev`), the application will use mock data from the code, not from the database.

## Database Initialization

To initialize the database for real data mode, run:

```bash
pnpm init-db
```

This will create the necessary tables. On first launch, you'll be guided through creating an admin account with your chosen credentials.

## User Management

To reset users (for testing the first-time setup flow), run:

```bash
pnpm reset-users
```

This will remove all users and their associated data from the database, allowing you to test the signup flow.
