#!/bin/bash
# Docker setup diagnostics tool for Gitea Mirror

# ANSI color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=====================================================${NC}"
echo -e "${BLUE}        Gitea Mirror Docker Setup Diagnostics        ${NC}"
echo -e "${BLUE}=====================================================${NC}"

# Check if Docker is installed and running
echo -e "\n${YELLOW}Checking Docker...${NC}"
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓ Docker is installed${NC}"
    if docker info &> /dev/null; then
        echo -e "${GREEN}✓ Docker daemon is running${NC}"
        
        # Get Docker version
        DOCKER_VERSION=$(docker version --format '{{.Server.Version}}')
        echo -e "${GREEN}✓ Docker version: $DOCKER_VERSION${NC}"
    else
        echo -e "${RED}✗ Docker daemon is not running${NC}"
        echo -e "  Run: ${YELLOW}open -a Docker${NC}"
    fi
else
    echo -e "${RED}✗ Docker is not installed${NC}"
    echo -e "  Visit: ${BLUE}https://www.docker.com/products/docker-desktop${NC}"
fi

# Check for Docker Compose
echo -e "\n${YELLOW}Checking Docker Compose...${NC}"
if docker compose version &> /dev/null; then
    COMPOSE_VERSION=$(docker compose version --short)
    echo -e "${GREEN}✓ Docker Compose is installed (v$COMPOSE_VERSION)${NC}"
elif command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version | awk '{print $3}' | sed 's/,//')
    echo -e "${GREEN}✓ Docker Compose is installed (v$COMPOSE_VERSION)${NC}"
    echo -e "${YELLOW}⚠ Using legacy docker-compose - consider upgrading${NC}"
else
    echo -e "${RED}✗ Docker Compose is not installed${NC}"
fi

# Check for Docker Buildx
echo -e "\n${YELLOW}Checking Docker Buildx...${NC}"
if docker buildx version &> /dev/null; then
    BUILDX_VERSION=$(docker buildx version | head -n1 | awk '{print $2}')
    echo -e "${GREEN}✓ Docker Buildx is installed (v$BUILDX_VERSION)${NC}"
    
    # List available builders
    echo -e "\n${YELLOW}Available builders:${NC}"
    docker buildx ls
else
    echo -e "${RED}✗ Docker Buildx is not installed or not activated${NC}"
fi

# Check for QEMU
echo -e "\n${YELLOW}Checking QEMU for multi-platform builds...${NC}"
if docker run --rm --privileged multiarch/qemu-user-static --reset -p yes &> /dev/null; then
    echo -e "${GREEN}✓ QEMU is available for multi-architecture builds${NC}"
else
    echo -e "${RED}✗ QEMU setup issue - multi-platform builds may fail${NC}"
    echo -e "  Run: ${YELLOW}docker run --rm --privileged multiarch/qemu-user-static --reset -p yes${NC}"
fi

# Check Docker resources
echo -e "\n${YELLOW}Checking Docker resources...${NC}"
if [ "$(uname)" == "Darwin" ]; then
    # macOS
    if command -v osascript &> /dev/null; then
        SYS_MEM=$(( $(sysctl -n hw.memsize) / 1024 / 1024 / 1024 ))
        echo -e "System memory: ${GREEN}$SYS_MEM GB${NC}"
        echo -e "NOTE: Check Docker Desktop settings to see allocated resources"
        echo -e "Recommended: At least 4GB RAM and 2 CPUs for multi-platform builds"
    fi
fi

# Check environment file
echo -e "\n${YELLOW}Checking environment configuration...${NC}"
if [ -f .env ]; then
    echo -e "${GREEN}✓ .env file exists${NC}"
    
    # Parse .env file safely
    if [ -f .env ]; then
        REGISTRY=$(grep DOCKER_REGISTRY .env | cut -d= -f2)
        IMAGE=$(grep DOCKER_IMAGE .env | cut -d= -f2)
        TAG=$(grep DOCKER_TAG .env | cut -d= -f2)
        
        echo -e "Docker image configuration:"
        echo -e "  Registry: ${BLUE}${REGISTRY:-"Not set (will use default)"}${NC}"
        echo -e "  Image: ${BLUE}${IMAGE:-"Not set (will use default)"}${NC}"
        echo -e "  Tag: ${BLUE}${TAG:-"Not set (will use default)"}${NC}"
    fi
else
    echo -e "${YELLOW}⚠ .env file not found${NC}"
    echo -e "  Run: ${YELLOW}cp .env.example .env${NC}"
fi

# Conclusion and recommendations
echo -e "\n${BLUE}=====================================================${NC}"
echo -e "${BLUE}                 Recommendations                     ${NC}"
echo -e "${BLUE}=====================================================${NC}"

echo -e "\n${YELLOW}For local development:${NC}"
echo -e "1. ${GREEN}pnpm setup${NC} (initialize database and install dependencies)"
echo -e "2. ${GREEN}./scripts/build-docker.sh --load${NC} (build and load into Docker)"
echo -e "3. ${GREEN}docker-compose -f docker-compose.dev.yml up -d${NC} (start the development container)"

echo -e "\n${YELLOW}For production deployment (using Docker Compose):${NC}"
echo -e "1. ${GREEN}pnpm setup${NC} (if not already done, to ensure database schema is ready)"
echo -e "2. ${GREEN}docker-compose --profile production up -d${NC} (start the production container)"

echo -e "\n${YELLOW}For CI/CD builds:${NC}"
echo -e "1. Use GitHub Actions workflow with retry mechanism"
echo -e "2. If build fails, try running with: ${GREEN}DOCKER_BUILDKIT=1${NC}"
echo -e "3. Consider breaking the build into multiple steps for better reliability"

echo -e "\n${YELLOW}For troubleshooting:${NC}"
echo -e "1. Check container logs: ${GREEN}docker logs gitea-mirror-dev${NC} (for development) or ${GREEN}docker logs gitea-mirror${NC} (for production)"
echo -e "2. Check health status: ${GREEN}docker inspect --format='{{.State.Health.Status}}' gitea-mirror-dev${NC} (for development) or ${GREEN}docker inspect --format='{{.State.Health.Status}}' gitea-mirror${NC} (for production)"
echo -e "3. See full documentation: ${BLUE}.github/workflows/TROUBLESHOOTING.md${NC}"
echo -e ""
