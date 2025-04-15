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

This will create the necessary tables and a default admin user (username: admin, password: password123).
