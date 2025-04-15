/**
 * Application configuration
 */

// Environment variables
export const ENV = {
  // Node environment (development, production, test)
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Database URL - use different databases for development and production
  get DATABASE_URL() {
    // If explicitly set, use the provided DATABASE_URL
    if (process.env.DATABASE_URL) {
      return process.env.DATABASE_URL;
    }

    // Otherwise, choose based on USE_MOCK_DATA
    return this.USE_MOCK_DATA
      ? 'sqlite://data/gitea-mirror-dev.db' // Development database with mock data
      : 'sqlite://data/gitea-mirror.db';    // Production database
  },

  // JWT secret for authentication
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-this-in-production',

  // Server host and port
  HOST: process.env.HOST || 'localhost',
  PORT: parseInt(process.env.PORT || '3000', 10),

  // Use mock data in development mode
  // This controls whether to use the development database with mock data
  get USE_MOCK_DATA() {
    if (process.env.USE_MOCK_DATA === 'true') return true;
    if (process.env.USE_MOCK_DATA === 'false') return false;
    return process.env.NODE_ENV === 'development';
  },
};

/**
 * Mock data for development
 */
export const MOCK_DATA = {
  // Mock repositories
  repositories: [
    {
      id: '1',
      name: 'gitea-mirror',
      fullName: 'arunavo4/gitea-mirror',
      url: 'https://github.com/arunavo4/gitea-mirror',
      isPrivate: false,
      isFork: false,
      owner: 'arunavo4',
      organization: null,
      hasIssues: true,
      isStarred: false,
      status: 'mirrored',
      lastMirrored: new Date('2023-10-15'),
      configId: '1',
      createdAt: new Date('2023-10-01'),
      updatedAt: new Date('2023-10-15'),
    },
    {
      id: '2',
      name: 'astro',
      fullName: 'withastro/astro',
      url: 'https://github.com/withastro/astro',
      isPrivate: false,
      isFork: false,
      owner: 'withastro',
      organization: 'withastro',
      hasIssues: true,
      isStarred: true,
      status: 'mirrored',
      lastMirrored: new Date('2023-10-14'),
      configId: '1',
      createdAt: new Date('2023-10-01'),
      updatedAt: new Date('2023-10-14'),
    },
    {
      id: '3',
      name: 'react',
      fullName: 'facebook/react',
      url: 'https://github.com/facebook/react',
      isPrivate: false,
      isFork: false,
      owner: 'facebook',
      organization: 'facebook',
      hasIssues: true,
      isStarred: false,
      status: 'pending',
      configId: '1',
      createdAt: new Date('2023-10-01'),
      updatedAt: new Date('2023-10-01'),
    },
    {
      id: '4',
      name: 'private-repo',
      fullName: 'user/private-repo',
      url: 'https://github.com/user/private-repo',
      isPrivate: true,
      isFork: false,
      owner: 'user',
      organization: null,
      hasIssues: true,
      isStarred: false,
      status: 'failed',
      errorMessage: 'Authentication failed',
      configId: '1',
      createdAt: new Date('2023-10-01'),
      updatedAt: new Date('2023-10-10'),
    },
  ],

  // Mock activities
  activities: [
    {
      id: '1',
      message: 'Successfully mirrored repository: gitea-mirror',
      timestamp: new Date('2023-10-15T14:30:00'),
      status: 'success',
    },
    {
      id: '2',
      message: 'Successfully mirrored repository: astro',
      timestamp: new Date('2023-10-14T10:15:00'),
      status: 'success',
    },
    {
      id: '3',
      message: 'Failed to mirror repository: private-repo',
      timestamp: new Date('2023-10-10T08:45:00'),
      status: 'error',
    },
    {
      id: '4',
      message: 'Started mirroring process for 3 repositories',
      timestamp: new Date('2023-10-10T08:30:00'),
      status: 'info',
    },
  ],

  // Mock organizations
  organizations: [
    {
      id: '1',
      name: 'microsoft',
      type: 'public',
      isIncluded: true,
      repositoryCount: 42,
      configId: '1',
      createdAt: new Date('2023-10-01'),
      updatedAt: new Date('2023-10-15'),
    },
    {
      id: '2',
      name: 'google',
      type: 'public',
      isIncluded: true,
      repositoryCount: 38,
      configId: '1',
      createdAt: new Date('2023-10-01'),
      updatedAt: new Date('2023-10-14'),
    },
    {
      id: '3',
      name: 'my-org',
      type: 'member',
      isIncluded: true,
      repositoryCount: 12,
      configId: '1',
      createdAt: new Date('2023-10-01'),
      updatedAt: new Date('2023-10-10'),
    },
  ],

  // Mock GitHub config
  githubConfig: {
    username: 'example-user',
    token: '',
    skipForks: true,
    privateRepositories: true,
    mirrorIssues: true,
    mirrorStarred: true,
    mirrorOrganizations: true,
    onlyMirrorOrgs: false,
    preserveOrgStructure: true,
    skipStarredIssues: false,
  },

  // Mock Gitea config
  giteaConfig: {
    url: 'https://gitea.example.com',
    token: '',
    organization: 'github-mirrors',
    visibility: 'public',
    starredReposOrg: 'github',
  },

  // Mock schedule config
  scheduleConfig: {
    enabled: true,
    interval: 3600,
    lastRun: new Date('2023-10-15T14:30:00'),
    nextRun: new Date('2023-10-15T15:30:00'),
  },
};
