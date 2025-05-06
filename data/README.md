# Data Directory

This directory contains the SQLite database file for the Gitea Mirror application.

## Files

- `gitea-mirror.db`: The main database file. This file is **not** committed to the repository as it may contain sensitive information like tokens.

## Important Notes

- **Never commit `gitea-mirror.db` to the repository** as it may contain sensitive information like GitHub and Gitea tokens.
- The application will create this database file automatically on first run.

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
