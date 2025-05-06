# Scripts Directory

This folder contains utility scripts for database management. Each script is described below to help developers understand its purpose and usage.

### init-db.ts
Initializes the SQLite database in the `./data/gitea-mirror.db` location. Creates necessary tables but no longer creates a default admin user. When the application starts with an empty users table, it will automatically redirect to the signup page.

### check-db.ts
Validates the existence and integrity of the database. Checks for user accounts and configurations, providing helpful information about what to expect when starting the application.

### reset-users.ts
Removes all users from the database and their associated data (configurations, repositories, organizations, and jobs). This is useful for testing the first-time user experience or resetting the application to a clean state without recreating the entire database.

### fix-db-issues.ts
Utility script that checks for database files in the wrong locations and moves them to the correct ones. This helps ensure database files are stored in the expected `./data` directory.

## Running the Scripts
You can execute these utility scripts using your package manager. From the project root, run:

```bash
# Initialize the database
pnpm run init-db

# Check database status
pnpm run check-db

# Reset all users (for testing signup flow)
pnpm run reset-users

# Remove database files from root directory
pnpm run cleanup-db

# Complete setup (install dependencies and initialize database)
pnpm run setup

# Start development server with a fresh database
pnpm run dev:clean

# Start production server with a fresh database
pnpm run start:fresh
```
