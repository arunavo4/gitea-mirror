# Scripts Directory

This folder contains utility scripts for database management, event management, Docker builds, and LXC container deployment.

## Database Management

### Database Management Tool (manage-db.ts)

This is a consolidated database management tool that handles all database-related operations. It combines the functionality of the previous separate scripts into a single, more intelligent script that can check, fix, and initialize the database as needed.

#### Features

- **Check Mode**: Validates the existence and integrity of the database
- **Init Mode**: Creates the database only if it doesn't already exist
- **Fix Mode**: Corrects database file location issues
- **Reset Users Mode**: Removes all users and their data
- **Auto Mode**: Automatically checks, fixes, and initializes the database if needed

#### Running the Database Management Tool

You can execute the database management tool using your package manager with various commands:

```bash
# Checks database status (default action if no command is specified)
bun run manage-db

# Check database status
bun run check-db

# Initialize the database (only if it doesn't exist)
bun run init-db

# Fix database location issues
bun run fix-db

# Automatic check, fix, and initialize if needed
bun run db-auto

# Reset all users (for testing signup flow)
bun run reset-users

# Remove database files completely
bun run cleanup-db

# Complete setup (install dependencies and initialize database)
bun run setup

# Start development server with a fresh database
bun run dev:clean

# Start production server with a fresh database
bun run start:fresh
```

#### Database File Location

The database file should be located in the `./data/gitea-mirror.db` directory. If the file is found in the root directory, the fix mode will move it to the correct location.

## Event Management

The following scripts help manage events in the SQLite database:

> **Note**: For a more user-friendly approach, you can use the cleanup button in the Activity Log page of the web interface to delete all activities with a single click.





### Remove Duplicate Events (remove-duplicate-events.ts)

Specifically removes duplicate events based on deduplication keys without affecting old events.

```bash
# Remove duplicate events for all users
bun scripts/remove-duplicate-events.ts

# Remove duplicate events for a specific user
bun scripts/remove-duplicate-events.ts <userId>
```



### Fix Interrupted Jobs (fix-interrupted-jobs.ts)

Fixes interrupted jobs that might be preventing cleanup by marking them as failed.

```bash
# Fix all interrupted jobs
bun scripts/fix-interrupted-jobs.ts

# Fix interrupted jobs for a specific user
bun scripts/fix-interrupted-jobs.ts <userId>
```

Use this script if you're having trouble cleaning up activities due to "interrupted" jobs that won't delete.

### Startup Recovery (startup-recovery.ts)

Runs job recovery during application startup to handle any interrupted jobs from previous runs.

```bash
# Run startup recovery (normal mode)
bun scripts/startup-recovery.ts

# Force recovery even if recent attempt was made
bun scripts/startup-recovery.ts --force

# Set custom timeout (default: 30000ms)
bun scripts/startup-recovery.ts --timeout=60000

# Using npm scripts
bun run startup-recovery
bun run startup-recovery-force
```

This script is automatically run by the Docker entrypoint during container startup. It ensures that any jobs interrupted by container restarts or application crashes are properly recovered or marked as failed.

## Deployment Scripts

### Docker Deployment

- **build-docker.sh**: Builds the Docker image for the application
- **docker-diagnostics.sh**: Provides diagnostic information for Docker deployments

### LXC Container Deployment

Two deployment options are available for LXC containers:

1. **Proxmox VE (online)**: Using the community-maintained script by Tobias ([CrazyWolf13](https://github.com/CrazyWolf13))
   - Author: Tobias ([CrazyWolf13](https://github.com/CrazyWolf13))
   - Available at: [community-scripts/ProxmoxVED](https://github.com/community-scripts/ProxmoxVED/blob/main/install/gitea-mirror-install.sh)
   - Pulls everything from GitHub
   - Creates a privileged container with the application
   - Sets up systemd service

2. **gitea-mirror-lxc-local.sh**: For offline/LAN-only deployment on a developer laptop
   - Pushes your local checkout + Bun ZIP to the container
   - Useful for testing without internet access

For detailed instructions on LXC deployment, see [README-lxc.md](./README-lxc.md).
