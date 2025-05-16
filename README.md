# Gitea Mirror

**Gitea Mirror** is a modern web application for automatically mirroring repositories from GitHub to your self-hosted Gitea instance. Designed for developers, teams, and organizations who want to retain full control of their code while still collaborating on GitHub.

## Features

- 🔁 Sync public, private, or starred GitHub repos to Gitea
- 🏢 Mirror entire organizations with structure preservation
- 🐞 Optional mirroring of issues and labels
- 🌟 Mirror your starred repositories
- 🕹️ Modern user interface with toast notifications and smooth experience
- 🧠 Smart filtering and job queue with detailed logs
- 🛠️ Works with personal access tokens (GitHub + Gitea)
- 🔒 First-time user signup experience with secure authentication
- 🐳 Fully Dockerized + can be self-hosted in minutes
- 📊 Dashboard with real-time status updates
- ⏱️ Scheduled automatic mirroring

## Screenshots

<table> <tr> <td><img src="https://github.com/user-attachments/assets/e62c6560-3da1-4e58-be88-3479e2b3b00b" width="100%"/></td> <td><img src="https://github.com/user-attachments/assets/fd982b81-fae3-4103-bc60-a4d3d5b477dd" width="100%"/></td> </tr> <tr> <td><img src="https://github.com/user-attachments/assets/3f499710-4cfe-45d9-8480-8665ec1efc9e" width="100%"/></td> <td><img src="https://github.com/user-attachments/assets/e032161f-1526-4508-ad13-d91a44458e66" width="100%"/></td> </tr> </table>

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


#### Database

The database (`data/gitea-mirror.db`) is created when the application first runs. It starts empty and is populated as you configure and use the application.

**Note**: On first launch, you'll be guided through creating an admin account with your chosen credentials.

#### Production Database

The production database (`data/gitea-mirror.db`) is created when the application runs in production mode. It starts empty and is populated as you configure and use the application.

**Important**: The production database file is excluded from the Git repository as it may contain sensitive information like GitHub and Gitea tokens. Never commit this file to the repository.

##### Database Initialization

Before running the application in production mode for the first time, you need to initialize the database:

```bash
# Initialize the database for production mode
pnpm setup
```

This will create the necessary tables. On first launch, you'll be guided through creating your admin account with a secure password.

### Installation

#### Using Docker (Recommended)

Gitea Mirror provides multi-architecture Docker images that work on both ARM64 (e.g., Apple Silicon, Raspberry Pi) and x86_64 (Intel/AMD) platforms.

##### Using Pre-built Images from GitHub Container Registry

```bash
# Pull the latest multi-architecture image
docker pull ghcr.io/arunavo4/gitea-mirror:latest

# Run the application
docker run -d \\
  -p 4321:4321 \\
  ghcr.io/arunavo4/gitea-mirror:latest
```

##### Using Docker Compose (Recommended)

```bash
# Start the application using Docker Compose
docker-compose --profile production up -d

# For development mode (requires configuration)
# Ensure you have run pnpm setup first
docker-compose -f docker-compose.dev.yml up -d
```

##### Building Docker Images Manually

The project includes a build script to create and manage multi-architecture Docker images:

```bash
# Copy example environment file if you don't have one
cp .env.example .env

# Edit .env file with your preferred settings
# DOCKER_REGISTRY, DOCKER_IMAGE, DOCKER_TAG, etc.

# Build and load into local Docker
./scripts/build-docker.sh --load

# OR: Build and push to a registry (requires authentication)
./scripts/build-docker.sh --push

# Then run with Docker Compose
docker-compose --profile production up -d
```

See [Docker build documentation](./scripts/README-docker.md) for more details.

##### Building Your Own Image

For manual Docker builds (without the helper script):

```bash
# Build the Docker image for your current architecture
docker build -t gitea-mirror:latest .

# Build multi-architecture images (requires Docker Buildx)
docker buildx create --name multiarch --driver docker-container --use
docker buildx build --platform linux/amd64,linux/arm64 -t gitea-mirror:latest --load .

# If you encounter issues with Buildx, you can try these workarounds:
# 1. Retry with network settings
docker buildx build --platform linux/amd64,linux/arm64 -t gitea-mirror:latest --network=host --load .

# 2. Build one platform at a time if you're having resource issues
docker buildx build --platform linux/amd64 -t gitea-mirror:amd64 --load .
docker buildx build --platform linux/arm64 -t gitea-mirror:arm64 --load .

# Create a named volume for database persistence
docker volume create gitea-mirror-data
```

##### Environment Variables

The Docker container can be configured with the following environment variables:

- `DATABASE_URL`: SQLite database URL (default: `sqlite://data/gitea-mirror.db`)
- `HOST`: Host to bind to (default: `0.0.0.0`)
- `PORT`: Port to listen on (default: `3000`)
- `JWT_SECRET`: Secret key for JWT token generation (important for security)


#### Manual Installation

```bash
# Clone the repository
git clone https://github.com/arunavo4/gitea-mirror.git
cd gitea-mirror

# Quick setup (installs dependencies and initializes the database)
pnpm setup

# Development Mode Options

# Run in development mode
pnpm dev

# Run in development mode with clean database (removes existing DB first)
pnpm dev:clean

# Production Mode Options

# Build the application
pnpm build

# Preview the production build
pnpm preview

# Start the production server (default)
pnpm start

# Start the production server with a clean setup
pnpm start:fresh

# Database Management

# Initialize the database
pnpm init-db

# Reset users for testing first-time signup
pnpm reset-users

# Check database status
pnpm check-db
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
pnpm setup

# Start the development server
pnpm dev
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
  --name gitea-mirror-dev \
  --network gitea-network \
  -p 3000:3000 \
  -v gitea-mirror-data:/app/data \
  -e NODE_ENV=development \
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
# Start with development environment and local Gitea instance
docker-compose -f docker-compose.dev.yml up -d
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
- ✅ Modern toast notifications for better user feedback
- ✅ First-time user signup experience
- ✅ Better error handling and user guidance
- ✅ Comprehensive error handling
- ✅ Unit tests for components and API
- ✅ Direct GitHub to Gitea mirroring (no external dependencies)
- ✅ Docker and docker-compose support for easy deployment

## Acknowledgements

- [Octokit](https://github.com/octokit/rest.js/) - GitHub REST API client for JavaScript
- [Shadcn UI](https://ui.shadcn.com/) - For the beautiful UI components
- [Astro](https://astro.build/) - For the excellent web framework
