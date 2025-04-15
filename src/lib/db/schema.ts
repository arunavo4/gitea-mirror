import { z } from 'zod';

// User schema
export const userSchema = z.object({
  id: z.string().uuid().optional(),
  username: z.string().min(3),
  password: z.string().min(8).optional(), // Hashed password
  email: z.string().email(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type User = z.infer<typeof userSchema>;

// Configuration schema
export const configSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().uuid(),
  name: z.string().min(1),
  isActive: z.boolean().default(true),
  github: z.object({
    username: z.string().min(1),
    token: z.string().optional(),
    skipForks: z.boolean().default(false),
    privateRepositories: z.boolean().default(false),
    mirrorIssues: z.boolean().default(false),
    mirrorStarred: z.boolean().default(false),
    mirrorOrganizations: z.boolean().default(false),
    onlyMirrorOrgs: z.boolean().default(false),
    useSpecificUser: z.boolean().default(false),
    singleRepo: z.string().optional(),
    includeOrgs: z.array(z.string()).default([]),
    excludeOrgs: z.array(z.string()).default([]),
    mirrorPublicOrgs: z.boolean().default(false),
    publicOrgs: z.array(z.string()).default([]),
    preserveOrgStructure: z.boolean().default(false),
    skipStarredIssues: z.boolean().default(false),
  }),
  gitea: z.object({
    url: z.string().url(),
    token: z.string().min(1),
    organization: z.string().optional(),
    visibility: z.enum(['public', 'private', 'limited']).default('public'),
    starredReposOrg: z.string().default('github'),
  }),
  include: z.array(z.string()).default(['*']),
  exclude: z.array(z.string()).default([]),
  schedule: z.object({
    enabled: z.boolean().default(false),
    interval: z.number().min(1).default(3600), // in seconds
    lastRun: z.date().optional(),
    nextRun: z.date().optional(),
  }),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type Config = z.infer<typeof configSchema>;

// Repository schema
export const repositorySchema = z.object({
  id: z.string().uuid().optional(),
  configId: z.string().uuid(),
  name: z.string().min(1),
  fullName: z.string().min(1),
  url: z.string().url(),
  isPrivate: z.boolean().default(false),
  isFork: z.boolean().default(false),
  owner: z.string().min(1),
  organization: z.string().optional(),
  hasIssues: z.boolean().default(false),
  isStarred: z.boolean().default(false),
  status: z.enum(['pending', 'mirrored', 'failed']).default('pending'),
  lastMirrored: z.date().optional(),
  errorMessage: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type Repository = z.infer<typeof repositorySchema>;

// Mirror job schema
export const mirrorJobSchema = z.object({
  id: z.string().uuid().optional(),
  configId: z.string().uuid(),
  repositoryId: z.string().uuid().optional(),
  status: z.enum(['pending', 'running', 'completed', 'failed']).default('pending'),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
  log: z.array(z.object({
    timestamp: z.date().default(() => new Date()),
    message: z.string(),
    level: z.enum(['info', 'warning', 'error']).default('info'),
  })).default([]),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type MirrorJob = z.infer<typeof mirrorJobSchema>;

// Organization schema
export const organizationSchema = z.object({
  id: z.string().uuid().optional(),
  configId: z.string().uuid(),
  name: z.string().min(1),
  type: z.enum(['member', 'public']).default('member'),
  isIncluded: z.boolean().default(true),
  repositoryCount: z.number().default(0),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type Organization = z.infer<typeof organizationSchema>;
