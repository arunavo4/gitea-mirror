# Gitea Mirror Quick Start Guide

This guide will help you get Gitea Mirror up and running quickly.

## Prerequisites

Before you begin, make sure you have:

1. A GitHub account with a personal access token
2. A Gitea instance with an access token
3. Docker and docker-compose (recommended) or Node.js 18+ installed

## Installation

### Using Docker (Recommended)

1. Clone the repository:
   ```bash
   git clone https://github.com/arunavo4/gitea-mirror.git
   cd gitea-mirror
   ```

2. Start the application in production mode:
   ```bash
   docker-compose --profile production up -d
   ```

3. Access the application at http://localhost:4321

### Manual Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/arunavo4/gitea-mirror.git
   cd gitea-mirror
   ```

2. Quick setup:
   ```bash
   pnpm setup
   ```
   This installs dependencies and initializes the database.

3. Choose how to run the application:

   **Development Mode:**
   ```bash
   pnpm dev
   ```

   **Production Mode:**
   ```bash
   pnpm build
   pnpm start
   ```

5. Access the application at http://localhost:4321

## Initial Configuration

1. Upon first access, you'll be prompted to create an admin account:
   - Create your username and password
   - This will be your administrator account

2. Go to the Configuration page

3. Configure GitHub settings:
   - Enter your GitHub username
   - Enter your GitHub personal access token
   - Select which repositories to mirror (all, starred, organizations)
   - Configure repository filtering options

4. Configure Gitea settings:
   - Enter your Gitea server URL
   - Enter your Gitea access token
   - Configure organization and visibility settings

5. Configure scheduling (optional):
   - Enable automatic mirroring
   - Set the mirroring interval

6. Save your configuration

## First Mirror

1. After saving your configuration, click "Import GitHub Data" to fetch repositories from GitHub
2. Go to the Repositories page to view your imported repositories
3. Select the repositories you want to mirror
4. Click "Mirror Selected" to start the mirroring process
5. Monitor the progress on the Activity page
6. You'll receive toast notifications about the success or failure of operations

## Next Steps

- See the [Configuration Guide](configuration.md) for detailed configuration options
- Set up automatic mirroring with a schedule
- Configure repository filtering to include/exclude specific repositories

## Troubleshooting

If you encounter issues:

1. Check the Activity page for error messages
2. Verify your GitHub and Gitea tokens have the correct permissions
3. Ensure your Gitea server is accessible
4. Check GitHub API rate limits if you're mirroring many repositories
