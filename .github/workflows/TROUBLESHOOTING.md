# GitHub Actions Workflow Troubleshooting

This document provides guidance on troubleshooting issues with the GitHub Actions workflows in this repository.

## Docker Build Issues

The Docker build workflow can sometimes fail due to temporary GitHub infrastructure issues or limitations when working with multi-platform builds.

### Common Errors

#### 502 Bad Gateway

```
Error: Response status code does not indicate success: 502 (Bad Gateway).
```

This is usually a temporary issue with GitHub's infrastructure. The workflow includes retry mechanisms, but sometimes manual intervention is needed.

#### Failed to download action

```
Warning: Failed to download action [...] 
```

This happens when GitHub Actions has trouble downloading the Docker actions. The workflow includes automatic retries for these cases.

### Solutions

1. **Re-run the workflow**: Often, simply re-running the workflow will resolve the issue.

2. **Use the stable workflow**: We provide a more stable workflow with additional retry capabilities:
   - Go to Actions > "Build and Push Docker Images (Stable)" > Run workflow
   - Choose "normal" mode for standard operation with retries
   - Choose "safe" mode to use older versions of actions that may be more stable
   - Choose "aggressive" mode to bypass GitHub Actions abstractions and use direct Docker commands

3. **Local build and push**: If GitHub Actions continues to fail, you can build and push locally:
   ```bash
   # Build and push using our helper script
   ./scripts/build-docker.sh --push
   ```

## Manual Build with Direct Docker Commands

If all else fails, you can build and push manually:

```bash
# Log in to GitHub Container Registry
export CR_PAT=your_personal_access_token
echo $CR_PAT | docker login ghcr.io -u USERNAME --password-stdin

# Set up buildx
docker buildx create --use
docker buildx inspect --bootstrap

# Build and push
docker buildx build --platform linux/amd64,linux/arm64 \
  -t ghcr.io/username/gitea-mirror:latest \
  --push .
```

## GitHub Actions Runner Limits

GitHub-hosted runners have limitations:
- CPU: 2 cores
- Memory: 7 GB RAM
- Disk space: 14 GB

Multi-platform builds can be resource-intensive. If you consistently encounter failures, consider:

1. Building single platform at a time
2. Using self-hosted runners with more resources
3. Simplifying the Docker image to reduce build complexity
