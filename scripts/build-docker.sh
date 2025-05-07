#!/bin/bash
# Build and push the Gitea Mirror docker image for multiple architectures

set -e  # Exit on any error

# Load environment variables if .env file exists
if [ -f .env ]; then
  echo "Loading environment variables from .env"
  export $(grep -v '^#' .env | xargs)
fi

# Set default values if not set in environment
DOCKER_REGISTRY=${DOCKER_REGISTRY:-ghcr.io}
DOCKER_IMAGE=${DOCKER_IMAGE:-gitea-mirror}
DOCKER_TAG=${DOCKER_TAG:-latest}

FULL_IMAGE_NAME="$DOCKER_REGISTRY/$DOCKER_IMAGE:$DOCKER_TAG"
echo "Building image: $FULL_IMAGE_NAME"

# Parse command line arguments
LOAD=false
PUSH=false

while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    --load)
      LOAD=true
      shift
      ;;
    --push)
      PUSH=true
      shift
      ;;
    *)
      echo "Unknown option: $key"
      echo "Usage: $0 [--load] [--push]"
      echo "  --load  Load the image into Docker after build"
      echo "  --push  Push the image to the registry after build"
      exit 1
      ;;
  esac
done

# Build command construction
BUILD_CMD="docker buildx build --platform linux/amd64,linux/arm64 -t $FULL_IMAGE_NAME"

# Add load or push flag if specified
if [ "$LOAD" = true ]; then
  BUILD_CMD="$BUILD_CMD --load"
fi

if [ "$PUSH" = true ]; then
  BUILD_CMD="$BUILD_CMD --push"
fi

# Add context directory
BUILD_CMD="$BUILD_CMD ."

# Execute the build command
echo "Executing: $BUILD_CMD"

# Function to execute with retries
execute_with_retry() {
  local cmd="$1"
  local max_attempts=${2:-3}
  local attempt=1
  local delay=5
  
  while [ $attempt -le $max_attempts ]; do
    echo "Attempt $attempt of $max_attempts..."
    if eval "$cmd"; then
      echo "Command succeeded!"
      return 0
    else
      echo "Command failed, waiting $delay seconds before retry..."
      sleep $delay
      attempt=$((attempt + 1))
      delay=$((delay * 2))  # Exponential backoff
    fi
  done
  
  echo "All attempts failed!"
  return 1
}

# Execute with retry
execute_with_retry "$BUILD_CMD"
BUILD_RESULT=$?

if [ $BUILD_RESULT -eq 0 ]; then
  echo "✅ Build successful!"
else
  echo "❌ Build failed after multiple attempts."
  exit 1
fi

# Print help message if neither --load nor --push was specified
if [ "$LOAD" = false ] && [ "$PUSH" = false ]; then
  echo
  echo "NOTE: Image was built but not loaded or pushed. To use this image, run again with:"
  echo "  $0 --load    # to load into local Docker"
  echo "  $0 --push    # to push to registry $DOCKER_REGISTRY"
fi
