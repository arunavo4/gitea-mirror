---
title: "Configuration"
description: "Guide to configuring Gitea Mirror for your environment."
order: 2
updatedDate: 2023-10-15
---

# Gitea Mirror Configuration Guide

This guide provides detailed information on how to configure Gitea Mirror for your environment.

## Configuration Methods

Gitea Mirror can be configured using:

1. **Environment Variables**: Set configuration options through environment variables
2. **Web UI**: Configure the application through the web interface after installation

## Environment Variables

The following environment variables can be used to configure Gitea Mirror:

| Variable | Description | Default Value | Example |
|----------|-------------|---------------|---------|
| `NODE_ENV` | Node environment (development, production, test) | `development` | `production` |
| `DATABASE_URL` | SQLite database URL | `sqlite://data/gitea-mirror.db` | `sqlite://path/to/your/database.db` |
| `JWT_SECRET` | Secret key for JWT authentication | `your-secret-key-change-this-in-production` | `your-secure-random-string` |
| `HOST` | Server host | `localhost` | `0.0.0.0` |
| `PORT` | Server port | `3000` | `8080` |

### Important Security Note

In production environments, you should always set a strong, unique `JWT_SECRET` to ensure secure authentication.

## Web UI Configuration

After installing and starting Gitea Mirror, you can configure it through the web interface:

1. Navigate to `http://your-server:port/`
2. If this is your first time, you'll be guided through creating an admin account
3. Log in with your credentials
4. Go to the Configuration page

### GitHub Configuration

| Option | Description | Default |
|--------|-------------|---------|
| Username | Your GitHub username | - |
| Token | GitHub personal access token | - |
| Skip Forks | Skip forked repositories | `false` |
| Private Repositories | Include private repositories | `false` |
| Mirror Issues | Mirror issues from GitHub to Gitea | `false` |
| Mirror Starred | Mirror starred repositories | `false` |
| Mirror Organizations | Mirror organization repositories | `false` |
| Only Mirror Orgs | Only mirror organization repositories | `false` |
| Preserve Org Structure | Maintain organization structure in Gitea | `false` |
| Skip Starred Issues | Skip mirroring issues for starred repositories | `false` |

#### GitHub Token Permissions

Your GitHub token needs the following permissions:

- `repo` - Full control of private repositories
- `read:org` - Read organization membership
- `read:user` - Read user profile data

### Gitea Configuration

| Option | Description | Default |
|--------|-------------|---------|
| URL | Gitea server URL | - |
| Token | Gitea access token | - |
| Organization | Default organization for mirrored repositories | - |
| Visibility | Default visibility for mirrored repositories | `public` |
| Starred Repos Org | Organization for starred repositories | `github` |
