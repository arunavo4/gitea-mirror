import { db } from '../src/lib/db';
import { 
  repositories, 
  organizations, 
  configs, 
  mirrorJobs, 
  users 
} from '../src/lib/db/schema';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';

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
      `CREATE TABLE IF NOT EXISTS ${repositories._.name} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        full_name TEXT NOT NULL,
        url TEXT NOT NULL,
        description TEXT,
        is_private BOOLEAN NOT NULL DEFAULT false,
        is_mirrored BOOLEAN NOT NULL DEFAULT false,
        organization_id INTEGER,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`
    );

    await db.execute(
      `CREATE TABLE IF NOT EXISTS ${organizations._.name} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        description TEXT,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`
    );

    await db.execute(
      `CREATE TABLE IF NOT EXISTS ${configs._.name} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        github_config TEXT NOT NULL,
        gitea_config TEXT NOT NULL,
        schedule_config TEXT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`
    );

    await db.execute(
      `CREATE TABLE IF NOT EXISTS ${mirrorJobs._.name} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        repository_name TEXT NOT NULL,
        status TEXT NOT NULL,
        message TEXT,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`
    );

    await db.execute(
      `CREATE TABLE IF NOT EXISTS ${users._.name} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        is_admin BOOLEAN NOT NULL DEFAULT false,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`
    );

    // Insert default config if none exists
    const configCount = await db.select({ count: db.fn.count() }).from(configs);
    if (configCount[0].count === 0) {
      await db.insert(configs).values({
        githubConfig: JSON.stringify({
          username: process.env.GITHUB_USERNAME || '',
          token: process.env.GITHUB_TOKEN || '',
          mirrorIssues: false,
          mirrorStarred: true,
          mirrorOrganizations: true,
          preserveOrgStructure: true,
          onlyMirrorOrgs: false,
        }),
        giteaConfig: JSON.stringify({
          url: process.env.GITEA_URL || '',
          token: process.env.GITEA_TOKEN || '',
          username: process.env.GITEA_USERNAME || '',
          organization: '',
          visibility: 'public',
        }),
        scheduleConfig: JSON.stringify({
          enabled: false,
          interval: 60, // minutes
          lastRun: null,
        }),
      });
      console.log('Default configuration created.');
    }

    console.log('Database initialization completed successfully.');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

main();
