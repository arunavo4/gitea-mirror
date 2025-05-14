# Scripts Directory

This directory contains utility scripts for the gitea-mirror project.

## Docker Build Script

### build-docker.sh

This script simplifies the process of building and publishing multi-architecture Docker images for the gitea-mirror project.

#### Usage

```bash
./build-docker.sh [--load] [--push]
```

Options:
- `--load`: Load the built image into the local Docker daemon
- `--push`: Push the image to the configured Docker registry

Without any flags, the script will build the image but leave it in the build cache only.

#### Configuration

The script uses environment variables from the `.env` file in the project root:

- `DOCKER_REGISTRY`: The Docker registry to push to (default: ghcr.io)
- `DOCKER_IMAGE`: The image name (default: gitea-mirror)
- `DOCKER_TAG`: The image tag (default: latest)

#### Examples

1. Build for multiple architectures and load into Docker:
   ```bash
   ./scripts/build-docker.sh --load
   ```

2. Build and push to the registry:
   ```bash
   ./scripts/build-docker.sh --push
   ```

3. Using with docker-compose:
   ```bash
   # Ensure dependencies are installed and database is initialized
   pnpm setup

   # First build the image
   ./scripts/build-docker.sh --load
   
   # Then run using docker-compose for development
   docker-compose -f ../docker-compose.dev.yml up -d

   # Or for production
   docker-compose --profile production up -d
   ```

## Diagnostics Script

### docker-diagnostics.sh

This utility script helps diagnose issues with your Docker setup for building and running Gitea Mirror.

#### Usage

```bash
./scripts/docker-diagnostics.sh
```

The script checks:
- Docker and Docker Compose installation
- Docker Buildx configuration
- QEMU availability for multi-architecture builds
- Docker resources (memory, CPU)
- Environment configuration
- Provides recommendations for building and troubleshooting

Run this script before building if you're experiencing issues with Docker builds or want to validate your environment.
