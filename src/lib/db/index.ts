import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { sqliteTable, text, integer, blob } from 'drizzle-orm/sqlite-core';

// Define the database URL - for development we'll use a local SQLite file
const dbUrl = process.env.DATABASE_URL || 'file:./gitea-mirror.db';

// Create a client connection to the database
export const client = createClient({ url: dbUrl });

// Create a drizzle instance
export const db = drizzle(client);

// Define the tables
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull(),
  password: text('password').notNull(),
  email: text('email').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(Date.now()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(Date.now()),
});

export const configs = sqliteTable('configs', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  githubConfig: text('github_config', { mode: 'json' }).notNull(),
  giteaConfig: text('gitea_config', { mode: 'json' }).notNull(),
  include: text('include', { mode: 'json' }).notNull().default('["*"]'),
  exclude: text('exclude', { mode: 'json' }).notNull().default('[]'),
  scheduleConfig: text('schedule_config', { mode: 'json' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(Date.now()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(Date.now()),
});

export const repositories = sqliteTable('repositories', {
  id: text('id').primaryKey(),
  configId: text('config_id').notNull().references(() => configs.id),
  name: text('name').notNull(),
  fullName: text('full_name').notNull(),
  url: text('url').notNull(),
  isPrivate: integer('is_private', { mode: 'boolean' }).notNull().default(false),
  isFork: integer('is_fork', { mode: 'boolean' }).notNull().default(false),
  owner: text('owner').notNull(),
  organization: text('organization'),
  hasIssues: integer('has_issues', { mode: 'boolean' }).notNull().default(false),
  isStarred: integer('is_starred', { mode: 'boolean' }).notNull().default(false),
  status: text('status').notNull().default('pending'),
  lastMirrored: integer('last_mirrored', { mode: 'timestamp' }),
  errorMessage: text('error_message'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(Date.now()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(Date.now()),
});

export const mirrorJobs = sqliteTable('mirror_jobs', {
  id: text('id').primaryKey(),
  configId: text('config_id').notNull().references(() => configs.id),
  repositoryId: text('repository_id').references(() => repositories.id),
  status: text('status').notNull().default('pending'),
  startedAt: integer('started_at', { mode: 'timestamp' }),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  log: text('log', { mode: 'json' }).notNull().default('[]'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(Date.now()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(Date.now()),
});

export const organizations = sqliteTable('organizations', {
  id: text('id').primaryKey(),
  configId: text('config_id').notNull().references(() => configs.id),
  name: text('name').notNull(),
  type: text('type').notNull().default('member'),
  isIncluded: integer('is_included', { mode: 'boolean' }).notNull().default(true),
  repositoryCount: integer('repository_count').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(Date.now()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(Date.now()),
});
