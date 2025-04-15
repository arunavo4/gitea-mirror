# Gitea Mirror Web UI: Product Requirements Document

## 1. Introduction

### 1.1 Purpose
This document outlines the requirements for developing a web-based user interface for the gitea-mirror tool. The current implementation relies on environment variables and Docker configuration, which requires technical knowledge to set up and use. The new web UI will provide a more user-friendly experience while maintaining all existing functionality.

### 1.2 Project Overview
gitea-mirror is a tool that automatically mirrors GitHub repositories to a Gitea server. The tool currently supports mirroring:
- Personal repositories (public and private)
- Starred repositories
- Organization repositories (for organizations the user is a member of)
- Public organization repositories (even if the user is not a member)
- Single repositories
- Repository issues and labels

The new web UI will provide a dashboard-style interface to configure, monitor, and manage these mirroring operations without requiring users to edit configuration files or run Docker commands.

### 1.3 Scope
The project will:
- Create a new web application using Astro framework
- Implement all existing functionality of the gitea-mirror tool
- Add a user-friendly interface for configuration and monitoring
- Provide real-time status updates of mirroring operations
- Allow for easy addition/removal of GitHub organizations and repositories
- Support user authentication and multiple user profiles

## 2. User Stories

### 2.1 Authentication and Setup
1. As a user, I want to log in to the application using my credentials so that my mirroring configurations are saved.
2. As a user, I want to connect my GitHub account via OAuth so that the application can access my repositories and organizations.
3. As a user, I want to connect my Gitea account by providing a URL and token so that the application can mirror repositories to my Gitea instance.
4. As a user, I want to set up multiple Gitea destinations so that I can mirror to different Gitea instances.

### 2.2 Repository Management
1. As a user, I want to see a list of all my GitHub repositories so that I can select which ones to mirror.
2. As a user, I want to filter repositories by name, visibility (public/private), and fork status so that I can find specific repositories easily.
3. As a user, I want to select individual repositories for mirroring so that I have fine-grained control over what gets mirrored.
4. As a user, I want to bulk select repositories based on criteria (e.g., all non-fork repositories) so that I can quickly set up mirroring for multiple repositories.

### 2.3 Organization Management
1. As a user, I want to see a list of GitHub organizations I belong to so that I can select which ones to mirror.
2. As a user, I want to add public GitHub organizations (that I'm not a member of) so that I can mirror their public repositories.
3. As a user, I want to include or exclude specific organizations from mirroring so that I have control over which organizations are mirrored.
4. As a user, I want to preserve the organization structure when mirroring so that repositories maintain their organizational context in Gitea.

### 2.4 Mirroring Configuration
1. As a user, I want to configure whether to mirror issues along with repositories so that I can preserve issue history.
2. As a user, I want to configure whether to mirror starred repositories so that I can keep track of repositories I'm interested in.
3. As a user, I want to specify a Gitea organization to mirror repositories to so that I can organize mirrored repositories.
4. As a user, I want to set the visibility (public/private) of mirrored repositories and organizations in Gitea so that I can control access to mirrored content.

### 2.5 Monitoring and Management
1. As a user, I want to see the status of mirroring operations in real-time so that I know when mirroring is complete.
2. As a user, I want to see a history of mirroring operations so that I can track when repositories were last mirrored.
3. As a user, I want to manually trigger mirroring for specific repositories so that I can update mirrors on demand.
4. As a user, I want to receive notifications when mirroring operations complete or fail so that I'm aware of any issues.

## 3. Functional Requirements

### 3.1 User Authentication and Management
- The application shall support user registration and login.
- The application shall support GitHub OAuth integration for repository access.
- The application shall securely store Gitea tokens and URLs.
- The application shall support multiple user profiles with separate configurations.

### 3.2 GitHub Integration
- The application shall retrieve and display the user's GitHub repositories.
- The application shall retrieve and display the user's GitHub organizations.
- The application shall support adding public GitHub organizations not associated with the user.
- The application shall support filtering repositories by name, visibility, and fork status.

### 3.3 Gitea Integration
- The application shall support configuring multiple Gitea instances.
- The application shall create and manage Gitea organizations as needed.
- The application shall mirror repositories to the specified Gitea instance.
- The application shall support setting repository and organization visibility in Gitea.

### 3.4 Mirroring Configuration
- The application shall allow users to select which repositories to mirror.
- The application shall allow users to include or exclude specific organizations.
- The application shall support mirroring issues and labels from GitHub repositories.
- The application shall support mirroring starred repositories.
- The application shall support preserving organization structure in Gitea.
- The application shall support mirroring a single repository.

### 3.5 Mirroring Execution
- The application shall execute mirroring operations in the background.
- The application shall provide real-time status updates of mirroring operations.
- The application shall support scheduling regular mirroring operations.
- The application shall support manual triggering of mirroring operations.

### 3.6 Dashboard and Monitoring
- The application shall display a dashboard with an overview of mirroring status.
- The application shall display a list of mirrored repositories with their status.
- The application shall display a history of mirroring operations.
- The application shall provide notifications for completed or failed mirroring operations.

## 4. Non-Functional Requirements

### 4.1 Performance
- The application shall support mirroring multiple repositories concurrently.
- The application shall handle large numbers of repositories (100+) without significant performance degradation.
- The dashboard shall update in real-time without requiring page refreshes.

### 4.2 Security
- The application shall securely store GitHub and Gitea tokens.
- The application shall use HTTPS for all communications.
- The application shall implement proper authentication and authorization mechanisms.
- The application shall not expose sensitive information in logs or error messages.

### 4.3 Usability
- The application shall have a clean, intuitive user interface built with Shadcn UI and Tailwind CSS v4.
- The application shall provide clear feedback for user actions.
- The application shall include tooltips and help text for complex features.
- The application shall be responsive and work on both desktop and mobile devices.
- The application shall follow modern design principles with consistent styling using Shadcn UI components.

### 4.4 Reliability
- The application shall handle GitHub and Gitea API rate limits gracefully.
- The application shall retry failed operations with appropriate backoff.
- The application shall maintain a log of all operations for troubleshooting.
- The application shall recover gracefully from errors and continue operation.

### 4.5 Scalability
- The application shall be deployable as a Docker container.
- The application shall support horizontal scaling for handling multiple users.
- The application shall use a database for persistent storage of configurations and status.

## 5. Technical Architecture

### 5.1 Frontend
- **Framework**: Astro.js for the web UI
- **UI Components**: Shadcn UI component library with Tailwind CSS v4
- **State Management**: Use Astro's built-in state management or integrate with a lightweight state management solution
- **Real-time Updates**: Use WebSockets or Server-Sent Events for real-time status updates

### 5.2 Backend
- **Language**: JavaScript/Node.js (to leverage existing codebase)
- **API**: RESTful API for communication between frontend and backend
- **Authentication**: JWT-based authentication for API access
- **Database**: SQLite for small deployments, PostgreSQL for larger deployments
- **Background Jobs**: Use a job queue system for handling mirroring operations

### 5.3 Integration Points
- **GitHub API**: Use Octokit.js (already in use in the current implementation)
- **Gitea API**: Use the existing API integration code
- **Docker**: Package the application as a Docker container for easy deployment

### 5.4 Deployment
- **Docker**: Provide a Docker image for easy deployment
- **Docker Compose**: Provide a docker-compose.yml for deploying with a database
- **Environment Variables**: Support configuration via environment variables for compatibility with the current approach

## 6. User Interface Design

The user interface will be built using Shadcn UI components and Tailwind CSS v4, providing a modern, clean, and consistent design language throughout the application. Shadcn UI offers accessible, customizable components that will ensure a professional look and feel while Tailwind v4 provides advanced styling capabilities.

### 6.1 Dashboard
- Overview of mirroring status (total repositories, successful mirrors, failed mirrors)
- Quick actions (trigger mirroring, add repositories, etc.)
- Recent activity log
- System status (GitHub API rate limit, Gitea connection status)

### 6.2 Repository Management
- List view of repositories with filtering and sorting options
- Bulk selection and action capabilities
- Status indicators for each repository (mirrored, pending, failed)
- Action buttons for individual repositories (mirror now, view details, etc.)

### 6.3 Organization Management
- List of user's GitHub organizations
- Interface for adding public organizations
- Configuration options for each organization (include/exclude, preserve structure)
- Status indicators for each organization

### 6.4 Configuration
- GitHub connection settings
- Gitea connection settings
- Global mirroring options (issues, starred repos, etc.)
- Schedule configuration for automatic mirroring

### 6.5 Activity Log
- Detailed log of all mirroring operations
- Filtering and search capabilities
- Error details for failed operations
- Export options for logs

## 7. Migration and Compatibility

### 7.1 Data Migration
- The application shall provide a way to import existing gitea-mirror configurations.
- The application shall support reading Docker environment variables for initial setup.

### 7.2 API Compatibility
- The application shall maintain compatibility with the GitHub and Gitea APIs used in the current implementation.
- The application shall handle API changes gracefully with appropriate error messages.

### 7.3 Backward Compatibility
- The application shall support running in a mode compatible with the current command-line/Docker approach.
- The application shall generate equivalent Docker commands for users who prefer the current approach.

## 8. Implementation Considerations

### 8.1 Reuse of Existing Code
- Leverage the existing GitHub repository fetching code (`get-github-repositories.mjs`).
- Reuse the Gitea API integration code for mirroring repositories.
- Adapt the configuration handling to work with both UI inputs and environment variables.

### 8.2 Improvements Over Current Implementation
- Remove hardcoded values and defaults that caused issues in the current implementation.
- Implement better error handling and reporting through the UI.
- Add validation for user inputs to prevent configuration errors.
- Provide more detailed logging and status information.

### 8.3 New Features
- Add support for scheduling mirroring operations at specific times.
- Implement webhook support for triggering mirroring on GitHub repository changes.
- Add support for mirroring pull requests in addition to issues.
- Implement user management for multi-user deployments.

## 9. Testing Requirements

### 9.1 Unit Testing
- All core functionality shall have unit tests.
- GitHub and Gitea API interactions shall be mockable for testing.

### 9.2 Integration Testing
- End-to-end tests shall verify the complete mirroring process.
- Tests shall cover various configuration scenarios.

### 9.3 User Acceptance Testing
- Test with real GitHub and Gitea instances.
- Verify all user stories are satisfied.

## 10. Deployment and Operations

### 10.1 Deployment Options
- Docker container for easy deployment
- Docker Compose for deployment with a database
- Manual installation instructions for advanced users

### 10.2 Configuration
- Environment variables for container configuration
- Configuration file for advanced settings
- UI-based configuration for most settings

### 10.3 Monitoring and Logging
- Structured logging for troubleshooting
- Prometheus metrics for monitoring (optional)
- Health check endpoints for container orchestration

## 11. Timeline and Milestones

### 11.1 Phase 1: Core Functionality
- Basic UI implementation
- GitHub and Gitea integration
- Repository mirroring functionality

### 11.2 Phase 2: Enhanced Features
- Organization management
- Issue mirroring
- Scheduling and automation

### 11.3 Phase 3: Advanced Features
- Multi-user support
- Advanced monitoring and reporting
- Webhook integration

## 12. Known Issues and Limitations from Current Implementation

### 12.1 GitHub API Rate Limits
- The current implementation can hit GitHub API rate limits when mirroring many repositories or organizations.
- The new implementation should include rate limit awareness and throttling.

### 12.2 Organization Mirroring Issues
- The current implementation has issues with mirroring GitHub organizations despite proper configuration.
- The new implementation should address these issues with improved organization detection and handling.

### 12.3 Single Repository Migration
- Recent updates that removed hardcoded organization names caused regression in single repository migrations.
- The new implementation should ensure single repository mirroring works correctly without dependencies on organization names.

## 13. API Endpoints and Dependencies

### 13.1 GitHub API Endpoints
- **User Repositories**: `GET /users/:username/repos` - Fetch public repositories for a user
- **Authenticated User Repositories**: `GET /user/repos` - Fetch private repositories for authenticated user
- **Organization Repositories**: `GET /orgs/:org/repos` - Fetch repositories for an organization
- **User Organizations**: `GET /user/orgs` - Fetch organizations for authenticated user
- **Public User Organizations**: `GET /users/:username/orgs` - Fetch public organizations for a user
- **Repository Details**: `GET /repos/:owner/:repo` - Fetch details for a specific repository
- **Starred Repositories**: `GET /user/starred` and `GET /users/:username/starred` - Fetch starred repositories
- **Issues**: `GET /repos/:owner/:repo/issues` - Fetch issues for a repository
- **Search API**: `GET /search/repositories` - Search for repositories (used for organization repositories)

### 13.2 Gitea API Endpoints
- **User Information**: `GET /api/v1/user` - Get authenticated user information
- **Repository Migration**: `POST /api/v1/repos/migrate` - Create a mirrored repository
- **Repository Check**: `GET /api/v1/repos/:owner/:repo` - Check if a repository exists
- **Organization Creation**: `POST /api/v1/orgs` - Create a new organization
- **Organization Check**: `GET /api/v1/orgs/:org` - Check if an organization exists
- **Issue Creation**: `POST /api/v1/repos/:owner/:repo/issues` - Create an issue
- **Label Creation**: `POST /api/v1/repos/:owner/:repo/labels` - Create a label
- **Star Repository**: `PUT /api/v1/user/starred/:owner/:repo` - Star a repository

### 13.3 Required Dependencies
- **@octokit/rest**: GitHub API client for JavaScript
- **superagent**: HTTP request library for API calls to Gitea
- **p-queue**: Queue for handling concurrent API requests
- **minimatch**: Pattern matching for repository filtering
- **jsonwebtoken**: JWT implementation for authentication
- **bcrypt**: Password hashing for user authentication
- **sqlite3** or **pg**: Database drivers for data persistence
- **express** or **fastify**: Backend API framework
- **ws**: WebSocket implementation for real-time updates
- **node-cron**: Scheduling library for periodic mirroring
- **winston**: Logging library for structured logs

### 13.4 Frontend Dependencies
- **astro**: Core framework for the web UI
- **tailwindcss**: Utility-first CSS framework (v4)
- **shadcn-ui**: Component library built on Tailwind CSS
- **react**: Used by Shadcn UI components
- **lucide-icons**: Icon library for UI elements
- **zod**: Schema validation for forms
- **react-hook-form**: Form handling
- **tanstack/react-query**: Data fetching and caching
- **date-fns**: Date formatting and manipulation

## 14. Conclusion

The gitea-mirror Web UI project aims to create a user-friendly interface for the existing gitea-mirror tool, making it accessible to a wider audience while maintaining all existing functionality. By addressing known issues and adding new features, the web UI will provide a more robust and flexible solution for mirroring GitHub repositories to Gitea instances.

This PRD serves as a comprehensive guide for developing the new web UI, outlining requirements, architecture, and implementation considerations. The project will be developed in phases, with each phase building on the previous one to deliver a complete solution.
