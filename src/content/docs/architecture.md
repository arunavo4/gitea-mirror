---
title: "Architecture"
description: "Comprehensive overview of the Gitea Mirror application architecture."
order: 1
updatedDate: 2023-10-15
---

# Gitea Mirror Architecture

This document provides a comprehensive overview of the Gitea Mirror application architecture, including component diagrams, project structure, and detailed explanations of each part of the system.

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
