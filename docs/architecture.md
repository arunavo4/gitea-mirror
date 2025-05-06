# Gitea Mirror Architecture

This document provides a comprehensive overview of the Gitea Mirror application architecture, including component diagrams, project structure, and detailed explanations of each part of the system.

## Table of Contents

- [System Overview](#system-overview)
- [Architecture Diagram](#architecture-diagram)
- [Component Breakdown](#component-breakdown)
- [Data Flow](#data-flow)
- [Project Structure](#project-structure)
- [Key Components](#key-components)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Development and Production Environments](#development-and-production-environments)
- [Deployment](#deployment)

## System Overview

Gitea Mirror is a web application that automates the mirroring of GitHub repositories to Gitea instances. It provides a user-friendly interface for configuring, monitoring, and managing mirroring operations without requiring users to edit configuration files or run Docker commands.

The application is built using:
- **Astro**: Web framework for the frontend
- **React**: Component library for interactive UI elements
- **Shadcn UI**: UI component library built on Tailwind CSS
- **SQLite**: Database for storing configuration and state
- **Node.js**: Runtime environment for the backend

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Gitea Mirror                             │
│                                                                 │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────────┐   │
│  │             │     │             │     │                 │   │
│  │  Frontend   │◄───►│   Backend   │◄───►│    Database     │   │
│  │  (Astro)    │     │  (Node.js)  │     │    (SQLite)     │   │
│  │             │     │             │     │                 │   │
│  └─────────────┘     └──────┬──────┘     └─────────────────┘   │
│                             │                                   │
└─────────────────────────────┼───────────────────────────────────┘
                              │
                              ▼
          ┌─────────────────────────────────────────┐
          │                                         │
          │              External APIs              │
          │                                         │
          │  ┌─────────────┐     ┌─────────────┐   │
          │  │             │     │             │   │
          │  │  GitHub API │     │  Gitea API  │   │
          │  │             │     │             │   │
          │  └─────────────┘     └─────────────┘   │
          │                                         │
          └─────────────────────────────────────────┘
```

## Component Breakdown

### Frontend (Astro + React)

The frontend is built with Astro, a modern web framework that allows for server-side rendering and partial hydration. React components are used for interactive elements, providing a responsive and dynamic user interface.

Key frontend components:
- **Dashboard**: Overview of mirroring status and recent activity
- **Repository Management**: Interface for managing repositories to mirror
- **Organization Management**: Interface for managing GitHub organizations
- **Configuration**: Settings for GitHub and Gitea connections
- **Activity Log**: Detailed log of mirroring operations

### Backend (Node.js)

The backend is built with Node.js and provides API endpoints for the frontend to interact with. It handles:
- Authentication and user management
- GitHub API integration
- Gitea API integration
- Mirroring operations
- Database interactions

### Database (SQLite)

SQLite is used for data persistence, storing:
- User accounts and authentication data
- GitHub and Gitea configuration
- Repository and organization information
- Mirroring job history and status

### External APIs

The application integrates with:
- **GitHub API**: For fetching repositories, organizations, and issues
- **Gitea API**: For creating and updating mirrored repositories

## Data Flow

1. **Configuration Flow**:
   ```
   User → Frontend → Backend → Database
   ```

2. **Repository Sync Flow**:
   ```
   Backend → GitHub API → Backend → Database → Frontend
   ```

3. **Mirroring Flow**:
   ```
   User → Frontend → Backend → GitHub API → Gitea API → Backend → Database → Frontend
   ```

4. **Status Update Flow**:
   ```
   Backend → Database → Frontend
   ```

## Project Structure

```
gitea-mirror/
├── data/                      # Database files
│   └── gitea-mirror.db        # SQLite database file
├── docs/                      # Documentation
│   ├── architecture.md        # This document
│   ├── configuration.md       # Configuration guide
│   └── quickstart.md          # Quick start guide
├── public/                    # Static assets
├── scripts/                   # Utility scripts
│   └── create-dev-db.ts       # Script to create development database
├── src/                       # Source code
│   ├── components/            # UI components
│   │   ├── activity/          # Activity log components
│   │   ├── auth/              # Authentication components
│   │   │   ├── LoginForm.tsx  # Login component
│   │   │   └── SignupForm.tsx # Signup component for first-time users 
│   │   ├── config/            # Configuration components
│   │   ├── dashboard/         # Dashboard components
│   │   ├── layout/            # Layout components
│   │   ├── organizations/     # Organization management components
│   │   ├── repositories/      # Repository management components
│   │   └── ui/                # Shadcn UI components
│   ├── lib/                   # Shared libraries
│   │   ├── db/                # Database utilities
│   │   │   └── schema.ts      # Database schema
│   │   ├── config.ts          # Application configuration
│   │   ├── github.ts          # GitHub API utilities
│   │   ├── gitea.ts           # Gitea API utilities
│   │   └── mirror.ts          # Mirroring utilities
│   ├── pages/                 # Astro pages
│   │   ├── api/               # API endpoints
│   │   │   ├── auth/          # Authentication endpoints
│   │   │   │   ├── index.ts   # User verification endpoints
│   │   │   │   ├── login.ts   # Login endpoint
│   │   │   │   ├── logout.ts  # Logout endpoint
│   │   │   │   └── register.ts # Registration endpoint
│   │   │   ├── config/        # Configuration endpoints
│   │   │   ├── github/        # GitHub integration endpoints
│   │   │   ├── gitea/         # Gitea integration endpoints
│   │   │   └── sync/          # Data synchronization endpoints
│   │   ├── activity.astro     # Activity log page
│   │   ├── config.astro       # Configuration page
│   │   ├── index.astro        # Dashboard page
│   │   ├── login.astro        # Login page
│   │   ├── signup.astro       # Signup page for first-time users
│   │   ├── organizations.astro # Organizations page
│   │   └── repositories.astro  # Repositories page
│   └── styles/                # Global styles
├── .gitignore                 # Git ignore file
├── astro.config.mjs           # Astro configuration
├── docker-compose.yml         # Docker Compose configuration
├── Dockerfile                 # Docker configuration
├── package.json               # NPM package configuration
├── README.md                  # Project README
└── tailwind.config.js         # Tailwind CSS configuration
```

## Key Components

### Frontend Components

#### Toast Notifications (`src/components/ui/sonner.tsx`)
The application uses toast notifications to provide feedback to users:
- Success notifications for completed operations
- Error notifications for failed operations
- Information notifications for ongoing processes
- Consistent UI across all components

#### Dashboard (`src/components/dashboard/Dashboard.tsx`)
The dashboard provides an overview of the mirroring status, including:
- Total repositories
- Successfully mirrored repositories
- Failed mirrors
- Recent activity

#### Repository Table (`src/components/repositories/RepositoryTable.tsx`)
Displays a list of repositories with:
- Repository name and owner
- Status (mirrored, pending, failed)
- Last mirrored date
- Actions (mirror now, view details)

#### Organization List (`src/components/organizations/OrganizationList.tsx`)
Displays a list of GitHub organizations with:
- Organization name
- Type (member, public)
- Include/exclude toggle
- Repository count

#### Configuration Tabs (`src/components/config/ConfigTabs.tsx`)
Provides tabs for configuring:
- GitHub connection settings
- Gitea connection settings
- Mirroring options
- Scheduling options

#### Activity Log (`src/components/activity/ActivityLog.tsx`)
Displays a detailed log of mirroring operations with:
- Timestamp
- Operation type
- Status (success, error, info)
- Details

### Backend Components

#### GitHub Utilities (`src/lib/github.ts`)
Provides functions for interacting with the GitHub API:
- `createGitHubClient`: Creates an authenticated Octokit instance
- `getUserRepositories`: Gets repositories for the authenticated user
- `getStarredRepositories`: Gets starred repositories
- `getOrganizationRepositories`: Gets repositories for an organization
- `getUserOrganizations`: Gets organizations for the authenticated user
- `getRepositoryIssues`: Gets issues for a repository
- `cloneRepository`: Gets clone URL for a repository

#### Gitea Utilities (`src/lib/gitea.ts`)
Provides functions for interacting with the Gitea API:
- `testGiteaConnection`: Tests connection to Gitea
- `createGiteaRepository`: Creates a repository in Gitea
- `checkGiteaRepository`: Checks if a repository exists in Gitea
- `createGiteaOrganization`: Creates an organization in Gitea
- `createGiteaIssue`: Creates an issue in Gitea
- `mirrorRepository`: Mirrors a repository from GitHub to Gitea

#### Mirroring Utilities (`src/lib/mirror.ts`)
Provides functions for mirroring repositories:
- `mirrorSingleRepository`: Mirrors a single repository
- `mirrorAllRepositories`: Mirrors all repositories based on configuration
- `syncRepositories`: Syncs repositories from GitHub based on configuration

#### Database Utilities (`src/lib/db/schema.ts`)
Defines the database schema using Drizzle ORM:
- `users`: User accounts
- `configs`: Configuration settings
- `repositories`: Repository information
- `organizations`: Organization information
- `mirrorJobs`: Mirroring job history

### API Endpoints

#### Authentication API (`src/pages/api/auth/`)
Handles user authentication:
- `GET /api/auth`: Checks if any users exist and returns current user status
- `POST /api/auth/login`: Authenticates a user
- `POST /api/auth/register`: Registers a new user (first-time setup)
- `POST /api/auth/logout`: Logs out current user

#### Configuration API (`src/pages/api/config.ts`)
Handles configuration management:
- `GET /api/config`: Gets configuration settings
- `POST /api/config`: Updates configuration settings

#### GitHub API (`src/pages/api/github.ts`)
Handles GitHub integration:
- `POST /api/github/test-connection`: Tests GitHub connection
- `POST /api/github/repositories`: Gets repositories from GitHub
- `POST /api/github/organizations`: Gets organizations from GitHub
- `POST /api/github/starred`: Gets starred repositories from GitHub

#### Gitea API (`src/pages/api/gitea.ts`)
Handles Gitea integration:
- `POST /api/gitea/test-connection`: Tests Gitea connection
- `POST /api/gitea/create-organization`: Creates an organization in Gitea
- `POST /api/gitea/create-repository`: Creates a repository in Gitea

#### Mirror API (`src/pages/api/mirror.ts`)
Handles mirroring operations:
- `POST /api/mirror/start`: Starts a mirroring job
- `POST /api/mirror/sync`: Syncs repositories from GitHub
- `POST /api/mirror/:id/cancel`: Cancels a mirroring job
- `GET /api/mirror/jobs/:id`: Gets mirroring jobs for a configuration
- `GET /api/mirror/job/:id`: Gets details for a mirroring job

## Database Schema

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│      users      │       │     configs     │       │  repositories   │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id              │       │ id              │       │ id              │
│ username        │       │ user_id         │◄──────┤ config_id       │
│ password        │       │ name            │       │ name            │
│ email           │       │ is_active       │       │ full_name       │
│ created_at      │       │ github_config   │       │ url             │
│ updated_at      │       │ gitea_config    │       │ is_private      │
└────────┬────────┘       │ schedule_config │       │ is_fork         │
         │                │ include         │       │ owner           │
         │                │ exclude         │       │ organization    │
         └───────────────►│ created_at      │       │ has_issues      │
                          │ updated_at      │       │ is_starred      │
                          └────────┬────────┘       │ status          │
                                   │                │ error_message   │
                                   │                │ last_mirrored   │
                                   │                │ created_at      │
                                   │                │ updated_at      │
                                   │                └─────────────────┘
                                   │
                                   │                ┌─────────────────┐
                                   │                │  organizations  │
                                   │                ├─────────────────┤
                                   └───────────────►│ id              │
                                                    │ config_id       │
                                                    │ name            │
                                                    │ type            │
                                                    │ is_included     │
                                                    │ repository_count│
                                                    │ created_at      │
                                                    │ updated_at      │
                                                    └─────────────────┘

                                   ┌─────────────────┐
                                   │   mirror_jobs   │
                                   ├─────────────────┤
                                   │ id              │
                                   │ config_id       │◄───────────────┐
                                   │ repository_id   │                │
                                   │ status          │                │
                                   │ started_at      │                │
                                   │ completed_at    │                │
                                   │ log             │                │
                                   │ created_at      │                │
                                   │ updated_at      │                │
                                   └─────────────────┘                │
                                                                      │
                                                                      │
                                                                      │
                                                                      │
```

## First-Time User Experience

The application includes a streamlined first-time user experience:

1. **Database Check**: When the application starts, it checks if any users exist in the database
2. **Signup Flow**: If no users exist, new visitors are redirected to the signup page
3. **Admin Creation**: The first user created becomes the admin user
4. **Default Configuration**: Empty configurations are handled gracefully with sensible defaults
5. **Guided Setup**: Toast notifications and clear UI guide users through the setup process

## Development and Production Environments

The application supports two environments:

### Development Environment
- Uses SQLite database for local development and testing
- Database file: `data/gitea-mirror.db`
- Configured with `NODE_ENV=development`

### Production Environment
- Uses the same SQLite database structure for production use
- Database file: `data/gitea-mirror.db`
- Configured with `NODE_ENV=production`
- Requires proper configuration with GitHub and Gitea credentials

## Deployment

### Docker Deployment

The application can be deployed using Docker with proper database persistence:

```bash
# Create a named volume for database persistence
docker volume create gitea-mirror-prod-data

# Build the Docker image
docker build -t gitea-mirror:latest .

# Run in production mode with database persistence
docker run -d \
  -p 3000:3000 \
  -v gitea-mirror-data:/app/data \
  -e DATABASE_URL=sqlite://data/gitea-mirror.db \
  -e NODE_ENV=production \
  --name gitea-mirror \
  gitea-mirror:latest
```

The SQLite database is stored in a Docker volume (`gitea-mirror-prod-data`) to ensure data persistence across container restarts and updates.

### Docker Compose Deployment

For more complex deployments, Docker Compose is recommended. The docker-compose.yml file defines named volumes for database persistence:

```yaml
volumes:
  gitea-mirror-data:    # Database volume
```

To start the application with Docker Compose:

```bash
# Production mode with database persistence
docker-compose --profile production up -d

# Development mode with database persistence
docker-compose -f docker-compose.dev.yml up -d
```

Each environment uses its own named volume, ensuring data isolation between different modes while maintaining persistence.

### Manual Deployment

The application can also be deployed manually:

```bash
# Install dependencies
pnpm install

# Build the application
pnpm build

# Start the application
pnpm start
```

## Conclusion

The Gitea Mirror application provides a comprehensive solution for mirroring GitHub repositories to Gitea instances. Its architecture is designed to be modular, scalable, and easy to maintain, with clear separation of concerns between frontend, backend, and database components.

The application supports both development and production environments, making it easy for developers to contribute to the project without requiring complex setup. The Docker and Docker Compose configurations provide simple deployment options for various use cases.
