# Gitea Mirror

**Gitea Mirror** is a modern web application for automatically mirroring repositories from GitHub to your self-hosted Gitea instance. Designed for developers, teams, and organizations who want to retain full control of their code while still collaborating on GitHub.

## Features

- 🔁 Sync public, private, or starred GitHub repos to Gitea
- 🏢 Mirror entire organizations with structure preservation
- 🐞 Optional mirroring of issues and labels
- 🌟 Mirror your starred repositories
- 🕹️ User-friendly web interface to manage and trigger mirror jobs
- 🧠 Smart filtering and job queue with detailed logs
- 🛠️ Works with personal access tokens (GitHub + Gitea)
- 🐳 Fully Dockerized + can be self-hosted in minutes
- 📊 Dashboard with real-time status updates
- ⏱️ Scheduled automatic mirroring

## Screenshots

### Dashboard
The dashboard provides an overview of your mirroring status, including total repositories, successfully mirrored repositories, and recent activity.

### Repository Management
Manage all your repositories in one place. Filter by status, search by name, and trigger manual mirroring operations.

### Configuration
Easily configure your GitHub and Gitea connections, set up automatic mirroring schedules, and manage organization mirroring.

## Getting Started

See the [Quick Start Guide](docs/quickstart.md) for detailed instructions on getting up and running quickly.

### Prerequisites

- Node.js 18 or later
- A GitHub account with a personal access token
- A Gitea instance with an access token

### Development vs Production Mode

The application can run in two modes:

- **Development Mode**: Uses a pre-populated development database with mock data for UI development without requiring actual GitHub/Gitea setup
- **Production Mode**: Uses a separate production database and requires proper configuration to connect to real GitHub/Gitea instances

The mode is controlled by the `USE_MOCK_DATA` environment variable:
- Set to `true` for development mode with the mock database
- Set to `false` for production mode with the real database

#### Development Database

The development database (`data/gitea-mirror-dev.db`) is pre-populated with mock data including:
- Sample repositories
- Sample organizations
- Sample mirror jobs and activity logs
- Default configuration
- Test user account (username: `admin`, password: `password`)

This allows developers to immediately start working on the UI without setting up GitHub and Gitea accounts.

#### Production Database

The production database (`data/gitea-mirror.db`) is created when the application runs in production mode. It starts empty and is populated as you configure and use the application.

### Installation

#### Using Docker (Recommended)

Gitea Mirror provides multi-architecture Docker images that work on both ARM64 (e.g., Apple Silicon, Raspberry Pi) and x86_64 (Intel/AMD) platforms.

##### Using Pre-built Images from GitHub Container Registry

```bash
# Pull the latest multi-architecture image
docker pull ghcr.io/arunavo4/gitea-mirror:latest

# Run in production mode (real data)
docker run -d \
  -p 3000:3000 \
  -v gitea-mirror-prod-data:/app/data \
  -e DATABASE_URL=sqlite://data/gitea-mirror.db \
  -e USE_MOCK_DATA=false \
  --name gitea-mirror \
  ghcr.io/arunavo4/gitea-mirror:latest

# Or run in development mode (mock data)
docker run -d \
  -p 3000:3000 \
  -v gitea-mirror-dev-data:/app/data \
  -e USE_MOCK_DATA=true \
  --name gitea-mirror-dev \
  ghcr.io/arunavo4/gitea-mirror:latest
```

##### Using Docker Compose (Recommended)

```bash
# For production mode with real data
docker-compose --profile production up -d

# For development mode with mock data
# This will automatically create and populate the development database
docker-compose --profile development up -d

# For development mode with real data (requires configuration)
docker-compose --profile development-real up -d
```

##### Building Your Own Image

```bash
# Build the Docker image for your current architecture
docker build -t gitea-mirror:latest .

# Build multi-architecture images (requires Docker Buildx)
docker buildx create --name multiarch --driver docker-container --use
docker buildx build --platform linux/amd64,linux/arm64 -t gitea-mirror:latest .

# Create named volumes for database persistence
docker volume create gitea-mirror-prod-data
docker volume create gitea-mirror-dev-data
```

##### Environment Variables

The Docker container can be configured with the following environment variables:

- `NODE_ENV`: Set to `production` or `development`
- `DATABASE_URL`: SQLite database URL (default: `sqlite://data/gitea-mirror.db`)
- `USE_MOCK_DATA`: Set to `true` for development mode with mock data, `false` for production
- `HOST`: Host to bind to (default: `0.0.0.0`)
- `PORT`: Port to listen on (default: `3000`)
- `JWT_SECRET`: Secret for JWT token generation (required in production)

#### Manual Installation

```bash
# Clone the repository
git clone https://github.com/arunavo4/gitea-mirror.git
cd gitea-mirror

# Quick setup for development (installs dependencies and creates dev database)
pnpm setup:dev

# Development Mode Options

# Run in development mode with mock data (default)
pnpm dev

# Run in development mode with real data (requires configuration)
pnpm dev:real

# Production Mode Options

# Build the application
pnpm build

# Preview the production build with mock data
pnpm preview:mock

# Preview the production build with real data
pnpm preview:real

# Start the production server with real data (default)
pnpm start

# Start the production server with mock data
pnpm start:mock

# Database Management

# Create/regenerate the development database with mock data
pnpm create-dev-db
```

### Configuration

Gitea Mirror can be configured through environment variables or through the web UI. See the [Configuration Guide](docs/configuration.md) for more details.

Key configuration options include:

- GitHub connection settings (username, token, repository filters)
- Gitea connection settings (URL, token, organization)
- Mirroring options (issues, starred repositories, organizations)
- Scheduling options for automatic mirroring

## Architecture

Gitea Mirror follows a modular architecture with clear separation of concerns. See the [Architecture Document](docs/architecture.md) for a comprehensive overview of the system design, including:

- Component diagrams
- Data flow
- Project structure
- Key components
- Database schema
- API endpoints

### High-Level Architecture

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

## Development

### Local Development Setup

```bash
# Install dependencies
pnpm install

# Start the development server with mock data
pnpm dev

# Or start with real data (requires configuration)
pnpm dev:real
```

### Setting Up a Local Gitea Instance for Testing

For full end-to-end testing, you can set up a local Gitea instance using Docker:

```bash
# Create a Docker network for Gitea and Gitea Mirror to communicate
docker network create gitea-network

# Create volumes for Gitea data persistence
docker volume create gitea-data
docker volume create gitea-config

# Run Gitea container
docker run -d \
  --name gitea \
  --network gitea-network \
  -p 3001:3000 \
  -p 2222:22 \
  -v gitea-data:/data \
  -v gitea-config:/etc/gitea \
  -e USER_UID=1000 \
  -e USER_GID=1000 \
  -e GITEA__database__DB_TYPE=sqlite3 \
  -e GITEA__database__PATH=/data/gitea.db \
  -e GITEA__server__DOMAIN=localhost \
  -e GITEA__server__ROOT_URL=http://localhost:3001/ \
  -e GITEA__server__SSH_DOMAIN=localhost \
  -e GITEA__server__SSH_PORT=2222 \
  -e GITEA__server__START_SSH_SERVER=true \
  -e GITEA__security__INSTALL_LOCK=true \
  -e GITEA__service__DISABLE_REGISTRATION=false \
  gitea/gitea:latest
```

After Gitea is running:

1. Access Gitea at http://localhost:3001/
2. Register a new user
3. Create a personal access token in Gitea (Settings > Applications > Generate New Token)
4. Run Gitea Mirror with the local Gitea configuration:

```bash
# Run Gitea Mirror connected to the local Gitea instance
docker run -d \
  --name gitea-mirror-dev-real \
  --network gitea-network \
  -p 3000:3000 \
  -v gitea-mirror-dev-real-data:/app/data \
  -e NODE_ENV=development \
  -e USE_MOCK_DATA=false \
  -e JWT_SECRET=dev-secret-key \
  -e GITHUB_TOKEN=your-github-token \
  -e GITHUB_USERNAME=your-github-username \
  -e GITEA_URL=http://gitea:3000 \
  -e GITEA_TOKEN=your-local-gitea-token \
  -e GITEA_USERNAME=your-local-gitea-username \
  arunavo4/gitea-mirror:latest
```

This setup allows you to test the full mirroring functionality with a local Gitea instance.

### Using Docker Compose for Development

For convenience, a dedicated development docker-compose file is provided that sets up both Gitea Mirror and a local Gitea instance:

```bash
# Start with mock data (no Gitea instance)
docker-compose -f docker-compose.dev.yml --profile with-mock-data up -d

# Start with real data and local Gitea instance
docker-compose -f docker-compose.dev.yml --profile with-real-data up -d
```

You can also create a `.env` file with your GitHub and Gitea credentials:

```
# GitHub credentials
GITHUB_TOKEN=your-github-token
GITHUB_USERNAME=your-github-username

# Gitea credentials (will be set up after you create a user in the local Gitea instance)
GITEA_TOKEN=your-local-gitea-token
GITEA_USERNAME=your-local-gitea-username
```

## Technologies Used

- **Frontend**: Astro, React, Shadcn UI, Tailwind CSS v4
- **Backend**: Node.js
- **Database**: SQLite (default) or PostgreSQL
- **API Integration**: GitHub API (Octokit), Gitea API

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Project Status

This project is now complete with the following features implemented:

- ✅ User-friendly dashboard with status overview
- ✅ Repository management interface
- ✅ Organization management interface
- ✅ Configuration management for GitHub and Gitea
- ✅ Scheduling and automation
- ✅ Activity logging and monitoring
- ✅ Responsive design for all screen sizes
- ✅ Comprehensive error handling
- ✅ Unit tests for components and API
- ✅ Direct GitHub to Gitea mirroring (no external dependencies)
- ✅ Docker and docker-compose support for easy deployment

## Acknowledgements

- [Octokit](https://github.com/octokit/rest.js/) - GitHub REST API client for JavaScript
- [Shadcn UI](https://ui.shadcn.com/) - For the beautiful UI components
- [Astro](https://astro.build/) - For the excellent web framework