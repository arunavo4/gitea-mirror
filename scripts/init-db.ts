import { db } from '../src/lib/db';
import {
  repositories,
  organizations,
  configs,
  mirrorJobs,
  users
} from '../src/lib/db';
import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Database path
const dbPath = process.env.DATABASE_URL || 'sqlite://data/gitea-mirror.db';

async function main() {
  console.log(`Initializing database at ${dbPath}...`);

  try {
    // Create tables if they don't exist
    await db.execute(
      `CREATE TABLE IF NOT EXISTS ${users._.name} (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        password TEXT NOT NULL,
        email TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )`
    );

    // Create a default admin user
    const userCount = await db.select({ count: db.fn.count() }).from(users);
    if (userCount[0].count === 0) {
      const userId = uuidv4();
      await db.insert(users).values({
        id: userId,
        username: 'admin',
        password: '$2a$10$JdJF5JDfWVMiMBtNijMbQuJzGbcoGVDMoT9o8gVrXPTC6zl0Ywd4W', // 'password123'
        email: 'admin@example.com',
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      console.log('Default admin user created (username: admin, password: password123)');
    }

    await db.execute(
      `CREATE TABLE IF NOT EXISTS ${configs._.name} (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        is_active INTEGER NOT NULL,
        github_config TEXT NOT NULL,
        gitea_config TEXT NOT NULL,
        include TEXT NOT NULL,
        exclude TEXT NOT NULL,
        schedule_config TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`
    );

    await db.execute(
      `CREATE TABLE IF NOT EXISTS ${repositories._.name} (
        id TEXT PRIMARY KEY,
        config_id TEXT NOT NULL,
        name TEXT NOT NULL,
        full_name TEXT NOT NULL,
        url TEXT NOT NULL,
        is_private INTEGER NOT NULL,
        is_fork INTEGER NOT NULL,
        owner TEXT NOT NULL,
        organization TEXT,
        has_issues INTEGER NOT NULL,
        is_starred INTEGER NOT NULL,
        status TEXT NOT NULL,
        last_mirrored INTEGER,
        error_message TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (config_id) REFERENCES configs(id)
      )`
    );

    await db.execute(
      `CREATE TABLE IF NOT EXISTS ${organizations._.name} (
        id TEXT PRIMARY KEY,
        config_id TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        is_included INTEGER NOT NULL,
        repository_count INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (config_id) REFERENCES configs(id)
      )`
    );

    await db.execute(
      `CREATE TABLE IF NOT EXISTS ${mirrorJobs._.name} (
        id TEXT PRIMARY KEY,
        config_id TEXT NOT NULL,
        repository_id TEXT,
        status TEXT NOT NULL,
        started_at INTEGER,
        completed_at INTEGER,
        log TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (config_id) REFERENCES configs(id),
        FOREIGN KEY (repository_id) REFERENCES repositories(id)
      )`
    );

    // Insert default config if none exists
    const configCount = await db.select({ count: db.fn.count() }).from(configs);
    if (configCount[0].count === 0) {
      // Get the first user
      const firstUser = await db.select().from(users).limit(1);
      if (firstUser.length > 0) {
        const userId = firstUser[0].id;
        await db.insert(configs).values({
          id: uuidv4(),
          userId: userId,
          name: 'Default Configuration',
          isActive: true,
          githubConfig: JSON.stringify({
            username: process.env.GITHUB_USERNAME || '',
            token: process.env.GITHUB_TOKEN || '',
            skipForks: false,
            privateRepositories: false,
            mirrorIssues: false,
            mirrorStarred: true,
            mirrorOrganizations: true,
            onlyMirrorOrgs: false,
            useSpecificUser: false,
            singleRepo: '',
            includeOrgs: [],
            excludeOrgs: [],
            mirrorPublicOrgs: false,
            publicOrgs: [],
            preserveOrgStructure: true,
            skipStarredIssues: false,
          }),
          giteaConfig: JSON.stringify({
            url: process.env.GITEA_URL || '',
            token: process.env.GITEA_TOKEN || '',
            username: process.env.GITEA_USERNAME || '',
            organization: '',
            visibility: 'public',
            starredReposOrg: 'github',
          }),
          include: JSON.stringify(['*']),
          exclude: JSON.stringify([]),
          scheduleConfig: JSON.stringify({
            enabled: false,
            interval: 3600, // seconds
            lastRun: null,
            nextRun: null,
          }),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        console.log('Default configuration created.');
      }
    }

    console.log('Database initialization completed successfully.');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

main();
