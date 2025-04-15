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

### Prerequisites

- Node.js 18 or later
- A GitHub account with a personal access token
- A Gitea instance with an access token

### Installation

#### Using Docker (Recommended)

```bash
# Pull and build the Docker image
docker build -t gitea-mirror:latest .

# Run the container
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL=sqlite://data/gitea-mirror.db \
  --name gitea-mirror \
  gitea-mirror:latest
```

#### Manual Installation

```bash
# Clone the repository
git clone https://github.com/jaedle/gitea-mirror.git
cd gitea-mirror

# Install dependencies
pnpm install

# Build the application
pnpm build

# Start the application
pnpm start
```

### Configuration

Gitea Mirror can be configured through environment variables or through the web UI. See the [Configuration Guide](docs/configuration.md) for more details.

## Development

```bash
# Install dependencies
pnpm install

# Start the development server
pnpm dev
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