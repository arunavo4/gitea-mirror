import { db, configs, repositories, organizations, mirrorJobs, users } from '../src/lib/db';
import { MOCK_DATA } from '../src/lib/config';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';

// Ensure the data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Create a new SQLite database for development
const dbPath = path.join(dataDir, 'gitea-mirror-dev.db');
console.log(`Creating development database at ${dbPath}`);

// Remove existing database if it exists
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
}

// Create a new database
const sqlite = new Database(dbPath);
const devDb = drizzle(sqlite);

// Create tables
console.log('Creating tables...');
const schema = fs.readFileSync(path.join(process.cwd(), 'src/lib/db/schema.sql'), 'utf8');
sqlite.exec(schema);

// Insert mock data
async function populateDatabase() {
  console.log('Populating database with mock data...');

  // Insert mock user
  const userId = crypto.randomUUID();
  await devDb.insert(users).values({
    id: userId,
    username: 'admin',
    password: '$2a$10$JdUgzKGz5BZkJjP9Vdlmw.QE6eiGXTu0UT9BQ9YTYkS.31/O1Ejm.', // hashed 'password'
    email: 'admin@example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log('Added mock user');

  // Insert mock config
  const configId = crypto.randomUUID();
  await devDb.insert(configs).values({
    id: configId,
    userId,
    name: 'Default Configuration',
    isActive: true,
    githubConfig: JSON.stringify(MOCK_DATA.githubConfig),
    giteaConfig: JSON.stringify(MOCK_DATA.giteaConfig),
    scheduleConfig: JSON.stringify(MOCK_DATA.scheduleConfig),
    include: JSON.stringify(['*']),
    exclude: JSON.stringify([]),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log('Added mock configuration');

  // Insert mock repositories
  for (const repo of MOCK_DATA.repositories) {
    await devDb.insert(repositories).values({
      ...repo,
      id: crypto.randomUUID(),
      configId,
    });
  }
  console.log(`Added ${MOCK_DATA.repositories.length} mock repositories`);

  // Insert mock organizations
  for (const org of MOCK_DATA.organizations) {
    await devDb.insert(organizations).values({
      ...org,
      id: crypto.randomUUID(),
      configId,
    });
  }
  console.log(`Added ${MOCK_DATA.organizations.length} mock organizations`);

  // Insert mock mirror jobs
  const jobId = crypto.randomUUID();
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

  // Create a completed job
  await devDb.insert(mirrorJobs).values({
    id: jobId,
    configId,
    status: 'completed',
    startedAt: fiveMinutesAgo,
    completedAt: now,
    log: JSON.stringify([
      {
        timestamp: fiveMinutesAgo,
        message: 'Mirror job started',
        level: 'info',
      },
      {
        timestamp: new Date(fiveMinutesAgo.getTime() + 1 * 60 * 1000),
        message: 'Mirroring repository: jaedle/mirror-to-gitea',
        level: 'info',
        repositoryName: 'jaedle/mirror-to-gitea',
      },
      {
        timestamp: new Date(fiveMinutesAgo.getTime() + 2 * 60 * 1000),
        message: 'Successfully mirrored repository: jaedle/mirror-to-gitea',
        level: 'success',
        repositoryName: 'jaedle/mirror-to-gitea',
      },
      {
        timestamp: new Date(fiveMinutesAgo.getTime() + 3 * 60 * 1000),
        message: 'Mirroring repository: withastro/astro',
        level: 'info',
        repositoryName: 'withastro/astro',
      },
      {
        timestamp: new Date(fiveMinutesAgo.getTime() + 4 * 60 * 1000),
        message: 'Successfully mirrored repository: withastro/astro',
        level: 'success',
        repositoryName: 'withastro/astro',
      },
      {
        timestamp: now,
        message: 'Mirroring process completed. 2 repositories mirrored, 0 failed.',
        level: 'info',
      },
    ]),
    createdAt: fiveMinutesAgo,
    updatedAt: now,
  });

  // Create a failed job
  const failedJobId = crypto.randomUUID();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const fiftyFiveMinutesAgo = new Date(now.getTime() - 55 * 60 * 1000);

  // Get the repository ID for the private repo
  const privateRepos = await devDb
    .select()
    .from(repositories)
    .where(eq(repositories.name, 'private-repo'));

  const privateRepoId = privateRepos.length > 0 ? privateRepos[0].id : undefined;

  await devDb.insert(mirrorJobs).values({
    id: failedJobId,
    configId,
    repositoryId: privateRepoId, // Use the actual ID from the database
    status: 'failed',
    startedAt: oneHourAgo,
    completedAt: fiftyFiveMinutesAgo,
    log: JSON.stringify([
      {
        timestamp: oneHourAgo,
        message: 'Mirror job started',
        level: 'info',
      },
      {
        timestamp: fiftyFiveMinutesAgo,
        message: 'Failed to mirror repository: user/private-repo',
        level: 'error',
        details: 'Error: Authentication failed. Please check your GitHub token and ensure it has the necessary permissions.',
        repositoryName: 'user/private-repo',
      },
    ]),
    createdAt: oneHourAgo,
    updatedAt: fiftyFiveMinutesAgo,
  });

  console.log('Added mock mirror jobs');

  console.log('Database population complete!');
}

populateDatabase()
  .then(() => {
    console.log('Development database created successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error creating development database:', error);
    process.exit(1);
  });
