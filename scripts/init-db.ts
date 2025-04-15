import { db, client } from '../src/lib/db';
import {
  repositories,
  organizations,
  configs,
  mirrorJobs,
  users
} from '../src/lib/db';
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
    await client.execute(
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        password TEXT NOT NULL,
        email TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )`
    );

    // Create a default admin user
    const userCountResult = await client.execute(`SELECT COUNT(*) as count FROM users`);
    const userCount = userCountResult.rows[0].count;
    if (userCount === 0) {
      const userId = uuidv4();
      await client.execute(`
        INSERT INTO users (id, username, password, email, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        userId,
        'admin',
        '$2a$10$JdJF5JDfWVMiMBtNijMbQuJzGbcoGVDMoT9o8gVrXPTC6zl0Ywd4W', // 'password123'
        'admin@example.com',
        Date.now(),
        Date.now()
      ]);
      console.log('Default admin user created (username: admin, password: password123)');
    }

    await client.execute(
      `CREATE TABLE IF NOT EXISTS configs (
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

    await client.execute(
      `CREATE TABLE IF NOT EXISTS repositories (
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

    await client.execute(
      `CREATE TABLE IF NOT EXISTS organizations (
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

    await client.execute(
      `CREATE TABLE IF NOT EXISTS mirror_jobs (
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
    const configCountResult = await client.execute(`SELECT COUNT(*) as count FROM configs`);
    const configCount = configCountResult.rows[0].count;
    if (configCount === 0) {
      // Get the first user
      const firstUserResult = await client.execute(`SELECT id FROM users LIMIT 1`);
      if (firstUserResult.rows.length > 0) {
        const userId = firstUserResult.rows[0].id;
        const configId = uuidv4();
        const githubConfig = JSON.stringify({
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
        });
        const giteaConfig = JSON.stringify({
          url: process.env.GITEA_URL || '',
          token: process.env.GITEA_TOKEN || '',
          username: process.env.GITEA_USERNAME || '',
          organization: '',
          visibility: 'public',
          starredReposOrg: 'github',
        });
        const include = JSON.stringify(['*']);
        const exclude = JSON.stringify([]);
        const scheduleConfig = JSON.stringify({
          enabled: false,
          interval: 3600, // seconds
          lastRun: null,
          nextRun: null,
        });

        await client.execute(`
          INSERT INTO configs (id, user_id, name, is_active, github_config, gitea_config, include, exclude, schedule_config, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          configId,
          userId,
          'Default Configuration',
          1, // true for SQLite
          githubConfig,
          giteaConfig,
          include,
          exclude,
          scheduleConfig,
          Date.now(),
          Date.now()
        ]);
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
