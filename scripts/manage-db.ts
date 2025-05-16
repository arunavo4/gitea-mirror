import fs from "fs";
import path from "path";
import { client, db } from "../src/lib/db";
import { configs } from "../src/lib/db";
import { v4 as uuidv4 } from "uuid";

// Command line arguments
const args = process.argv.slice(2);
const command = args[0] || "check";

// Ensure data directory exists
const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Database paths
const rootDbFile = path.join(process.cwd(), "gitea-mirror.db");
const rootDevDbFile = path.join(process.cwd(), "gitea-mirror-dev.db");
const dataDbFile = path.join(dataDir, "gitea-mirror.db");
const dataDevDbFile = path.join(dataDir, "gitea-mirror-dev.db");

// Database path - ensure we use absolute path
const dbPath =
  process.env.DATABASE_URL || `file:${path.join(dataDir, "gitea-mirror.db")}`;

/**
 * Ensure all required tables exist
 */
async function ensureTablesExist() {
  const requiredTables = [
    "users",
    "configs",
    "repositories",
    "organizations",
    "mirror_jobs",
  ];

  for (const table of requiredTables) {
    try {
      await client.execute(`SELECT 1 FROM ${table} LIMIT 1`);
    } catch (error) {
      if (error instanceof Error && error.message.includes("SQLITE_ERROR")) {
        console.warn(`⚠️  Table '${table}' is missing. Creating it now...`);
        switch (table) {
          case "users":
            await client.execute(
              `CREATE TABLE users (
                id TEXT PRIMARY KEY,
                username TEXT NOT NULL,
                password TEXT NOT NULL,
                email TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
              )`
            );
            break;
          case "configs":
            await client.execute(
              `CREATE TABLE configs (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                name TEXT NOT NULL,
                is_active INTEGER NOT NULL DEFAULT 1,
                github_config TEXT NOT NULL,
                gitea_config TEXT NOT NULL,
                include TEXT NOT NULL DEFAULT '[]',
                exclude TEXT NOT NULL DEFAULT '[]',
                schedule_config TEXT NOT NULL,
                created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
                updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
                FOREIGN KEY (user_id) REFERENCES users(id)
              )`
            );
            break;
          case "repositories":
            await client.execute(
              `CREATE TABLE repositories (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                config_id TEXT NOT NULL,
                name TEXT NOT NULL,
                full_name TEXT NOT NULL,
                url TEXT NOT NULL,
                clone_url TEXT NOT NULL,
                owner TEXT NOT NULL,
                organization TEXT,
                is_private INTEGER NOT NULL DEFAULT 0,
                is_fork INTEGER NOT NULL DEFAULT 0,
                forked_from TEXT,
                has_issues INTEGER NOT NULL DEFAULT 0,
                is_starred INTEGER NOT NULL DEFAULT 0,
                is_archived INTEGER NOT NULL DEFAULT 0,
                size INTEGER NOT NULL DEFAULT 0,
                has_lfs INTEGER NOT NULL DEFAULT 0,
                has_submodules INTEGER NOT NULL DEFAULT 0,
                default_branch TEXT NOT NULL,
                visibility TEXT NOT NULL DEFAULT 'public',
                status TEXT NOT NULL DEFAULT 'imported',
                last_mirrored INTEGER,
                error_message TEXT,
                created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
                updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (config_id) REFERENCES configs(id)
              )`
            );
            break;
          case "organizations":
            await client.execute(
              `CREATE TABLE organizations (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                config_id TEXT NOT NULL,
                name TEXT NOT NULL,
                avatar_url TEXT NOT NULL,
                membership_role TEXT NOT NULL DEFAULT 'member',
                is_included INTEGER NOT NULL DEFAULT 1,
                status TEXT NOT NULL DEFAULT 'imported',
                last_mirrored INTEGER,
                error_message TEXT,
                repository_count INTEGER NOT NULL DEFAULT 0,
                created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
                updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (config_id) REFERENCES configs(id)
              )`
            );
            break;
          case "mirror_jobs":
            await client.execute(
              `CREATE TABLE mirror_jobs (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                repository_id TEXT,
                repository_name TEXT,
                organization_id TEXT,
                organization_name TEXT,
                details TEXT,
                status TEXT NOT NULL DEFAULT 'imported',
                message TEXT NOT NULL,
                timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
              )`
            );
            break;
        }
        console.log(`✅ Table '${table}' created successfully.`);
      } else {
        console.error(`❌ Error checking table '${table}':`, error);
        process.exit(1);
      }
    }
  }
}

/**
 * Check database status
 */
async function checkDatabase() {
  console.log("Checking database status...");

  // Check for database files in the root directory (which is incorrect)
  if (fs.existsSync(rootDbFile)) {
    console.warn(
      "⚠️  WARNING: Database file found in root directory: gitea-mirror.db"
    );
    console.warn("   This file should be in the data directory.");
    console.warn(
      '   Run "pnpm manage-db fix" to fix this issue or "pnpm cleanup-db" to remove it.'
    );
  }

  // Check if database files exist in the data directory (which is correct)
  if (fs.existsSync(dataDbFile)) {
    console.log(
      "✅ Database file found in data directory: data/gitea-mirror.db"
    );

    // Check for users
    try {
      const userCountResult = await client.execute(
        `SELECT COUNT(*) as count FROM users`
      );
      const userCount = userCountResult.rows[0].count;

      if (userCount === 0) {
        console.log("ℹ️  No users found in the database.");
        console.log(
          "   When you start the application, you will be directed to the signup page"
        );
        console.log("   to create an initial admin account.");
      } else {
        console.log(`✅ ${userCount} user(s) found in the database.`);
        console.log("   The application will show the login page on startup.");
      }

      // Check for configurations
      const configCountResult = await client.execute(
        `SELECT COUNT(*) as count FROM configs`
      );
      const configCount = configCountResult.rows[0].count;

      if (configCount === 0) {
        console.log("ℹ️  No configurations found in the database.");
        console.log(
          "   You will need to set up your GitHub and Gitea configurations after login."
        );
      } else {
        console.log(
          `✅ ${configCount} configuration(s) found in the database.`
        );
      }
    } catch (error) {
      console.error("❌ Error connecting to the database:", error);
      console.warn(
        '   The database file might be corrupted. Consider running "pnpm manage-db init" to recreate it.'
      );
    }
  } else {
    console.warn("⚠️  WARNING: Database file not found in data directory.");
    console.warn('   Run "pnpm manage-db init" to create it.');
  }
}

/**
 * Update database schema
 */
async function updateSchema() {
  console.log(`Checking and updating database schema at ${dbPath}...`);

  // Check if the database exists
  if (!fs.existsSync(dataDbFile)) {
    console.log(
      "⚠️  Database file doesn't exist. Run 'pnpm manage-db init' first to create it."
    );
    return;
  }

  try {
    console.log("Checking for missing columns in mirror_jobs table...");

    // Check if repository_id column exists in mirror_jobs table
    const tableInfoResult = await client.execute(
      `PRAGMA table_info(mirror_jobs)`
    );

    // Get column names
    const columns = tableInfoResult.rows.map((row) => row.name);

    // Check for repository_id column
    if (!columns.includes("repository_id")) {
      console.log(
        "Adding missing repository_id column to mirror_jobs table..."
      );
      await client.execute(
        `ALTER TABLE mirror_jobs ADD COLUMN repository_id TEXT;`
      );
      console.log("✅ Added repository_id column to mirror_jobs table.");
    }

    // Check for repository_name column
    if (!columns.includes("repository_name")) {
      console.log(
        "Adding missing repository_name column to mirror_jobs table..."
      );
      await client.execute(
        `ALTER TABLE mirror_jobs ADD COLUMN repository_name TEXT;`
      );
      console.log("✅ Added repository_name column to mirror_jobs table.");
    }

    // Check for organization_id column
    if (!columns.includes("organization_id")) {
      console.log(
        "Adding missing organization_id column to mirror_jobs table..."
      );
      await client.execute(
        `ALTER TABLE mirror_jobs ADD COLUMN organization_id TEXT;`
      );
      console.log("✅ Added organization_id column to mirror_jobs table.");
    }

    // Check for organization_name column
    if (!columns.includes("organization_name")) {
      console.log(
        "Adding missing organization_name column to mirror_jobs table..."
      );
      await client.execute(
        `ALTER TABLE mirror_jobs ADD COLUMN organization_name TEXT;`
      );
      console.log("✅ Added organization_name column to mirror_jobs table.");
    }

    // Check for details column
    if (!columns.includes("details")) {
      console.log("Adding missing details column to mirror_jobs table...");
      await client.execute(`ALTER TABLE mirror_jobs ADD COLUMN details TEXT;`);
      console.log("✅ Added details column to mirror_jobs table.");
    }

    // Check for mirrored_location column in repositories table
    const repoColumns = await client.execute(
      `PRAGMA table_info(repositories)`
    );
    const repoColumnNames = repoColumns.rows.map((row: any) => row.name);

    if (!repoColumnNames.includes("mirrored_location")) {
      console.log("Adding missing mirrored_location column to repositories table...");
      await client.execute(
        `ALTER TABLE repositories ADD COLUMN mirrored_location TEXT DEFAULT '';`
      );
      console.log("✅ Added mirrored_location column to repositories table.");
    }

    console.log("✅ Schema update completed successfully.");
  } catch (error) {
    console.error("❌ Error updating schema:", error);
    process.exit(1);
  }
}

/**
 * Initialize the database
 */
async function initializeDatabase() {
  // Check if database already exists first
  if (fs.existsSync(dataDbFile)) {
    console.log("⚠️  Database already exists at data/gitea-mirror.db");
    console.log(
      '   If you want to recreate the database, run "pnpm cleanup-db" first.'
    );
    console.log(
      '   Or use "pnpm manage-db reset-users" to just remove users without recreating tables.'
    );

    // Check if we can connect to it
    try {
      await client.execute(`SELECT COUNT(*) as count FROM users`);
      console.log("✅ Database is valid and accessible.");
      return;
    } catch (error) {
      console.error("❌ Error connecting to the existing database:", error);
      console.log(
        "   The database might be corrupted. Proceeding with reinitialization..."
      );
    }
  }

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

    // NOTE: We no longer create a default admin user - user will create one via signup page

    await client.execute(
      `CREATE TABLE IF NOT EXISTS configs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  github_config TEXT NOT NULL,
  gitea_config TEXT NOT NULL,
  include TEXT NOT NULL DEFAULT '["*"]',
  exclude TEXT NOT NULL DEFAULT '[]',
  schedule_config TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
`
    );

    await client.execute(
      `CREATE TABLE IF NOT EXISTS repositories (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  config_id TEXT NOT NULL,
  name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  url TEXT NOT NULL,
  clone_url TEXT NOT NULL,
  owner TEXT NOT NULL,
  organization TEXT,
  mirrored_location TEXT DEFAULT '',

  is_private INTEGER NOT NULL DEFAULT 0,
  is_fork INTEGER NOT NULL DEFAULT 0,
  forked_from TEXT,

  has_issues INTEGER NOT NULL DEFAULT 0,
  is_starred INTEGER NOT NULL DEFAULT 0,
  is_archived INTEGER NOT NULL DEFAULT 0,

  size INTEGER NOT NULL DEFAULT 0,
  has_lfs INTEGER NOT NULL DEFAULT 0,
  has_submodules INTEGER NOT NULL DEFAULT 0,

  default_branch TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'public',

  status TEXT NOT NULL DEFAULT 'imported',
  last_mirrored INTEGER,
  error_message TEXT,

  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),

  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (config_id) REFERENCES configs(id)
);
`
    );

    await client.execute(
      `CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  config_id TEXT NOT NULL,
  name TEXT NOT NULL,

  avatar_url TEXT NOT NULL,
  membership_role TEXT NOT NULL DEFAULT 'member',

  is_included INTEGER NOT NULL DEFAULT 1,

  status TEXT NOT NULL DEFAULT 'imported',
  last_mirrored INTEGER,
  error_message TEXT,

  repository_count INTEGER NOT NULL DEFAULT 0,

  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),

  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (config_id) REFERENCES configs(id)
);
`
    );

    await client.execute(
      `CREATE TABLE IF NOT EXISTS mirror_jobs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  repository_id TEXT,
  repository_name TEXT,
  organization_id TEXT,
  organization_name TEXT,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'imported',
  message TEXT NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
`
    );

    // Insert default config if none exists
    const configCountResult = await client.execute(
      `SELECT COUNT(*) as count FROM configs`
    );
    const configCount = configCountResult.rows[0].count;
    if (configCount === 0) {
      // Get the first user
      const firstUserResult = await client.execute(
        `SELECT id FROM users LIMIT 1`
      );
      if (firstUserResult.rows.length > 0) {
        const userId = firstUserResult.rows[0].id;
        const configId = uuidv4();
        const githubConfig = JSON.stringify({
          username: process.env.GITHUB_USERNAME || "",
          token: process.env.GITHUB_TOKEN || "",
          skipForks: false,
          privateRepositories: false,
          mirrorIssues: false,
          mirrorStarred: true,
          useSpecificUser: false,
          preserveOrgStructure: true,
          skipStarredIssues: false,
        });
        const giteaConfig = JSON.stringify({
          url: process.env.GITEA_URL || "",
          token: process.env.GITEA_TOKEN || "",
          username: process.env.GITEA_USERNAME || "",
          organization: "",
          visibility: "public",
          starredReposOrg: "github",
        });
        const include = JSON.stringify(["*"]);
        const exclude = JSON.stringify([]);
        const scheduleConfig = JSON.stringify({
          enabled: false,
          interval: 3600,
          lastRun: null,
          nextRun: null,
        });

        await client.execute(
          `
          INSERT INTO configs (id, user_id, name, is_active, github_config, gitea_config, include, exclude, schedule_config, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
          [
            configId,
            userId,
            "Default Configuration",
            1,
            githubConfig,
            giteaConfig,
            include,
            exclude,
            scheduleConfig,
            Date.now(),
            Date.now(),
          ]
        );
      }
    }

    console.log("✅ Database initialization completed successfully.");
  } catch (error) {
    console.error("❌ Error initializing database:", error);
    process.exit(1);
  }
}

/**
 * Reset users in the database
 */
async function resetUsers() {
  console.log(`Resetting users in database at ${dbPath}...`);

  try {
    // Check if the database exists
    const dbFilePath = dbPath.replace("file:", "");
    const doesDbExist = fs.existsSync(dbFilePath);

    if (!doesDbExist) {
      console.log(
        "❌ Database file doesn't exist. Run 'pnpm manage-db init' first to create it."
      );
      return;
    }

    // Count existing users
    const userCountResult = await client.execute(
      `SELECT COUNT(*) as count FROM users`
    );
    const userCount = userCountResult.rows[0].count;

    if (userCount === 0) {
      console.log("ℹ️  No users found in the database. Nothing to reset.");
      return;
    }

    // Delete all users
    await client.execute(`DELETE FROM users`);
    console.log(`✅ Deleted ${userCount} users from the database.`);

    // Check dependent configurations that need to be removed
    const configCount = await client.execute(
      `SELECT COUNT(*) as count FROM configs`
    );

    if (
      configCount.rows &&
      configCount.rows[0] &&
      Number(configCount.rows[0].count) > 0
    ) {
      await client.execute(`DELETE FROM configs`);
      console.log(`✅ Deleted ${configCount.rows[0].count} configurations.`);
    }

    // Check for dependent repositories
    const repoCount = await client.execute(
      `SELECT COUNT(*) as count FROM repositories`
    );

    if (
      repoCount.rows &&
      repoCount.rows[0] &&
      Number(repoCount.rows[0].count) > 0
    ) {
      await client.execute(`DELETE FROM repositories`);
      console.log(`✅ Deleted ${repoCount.rows[0].count} repositories.`);
    }

    // Check for dependent organizations
    const orgCount = await client.execute(
      `SELECT COUNT(*) as count FROM organizations`
    );

    if (
      orgCount.rows &&
      orgCount.rows[0] &&
      Number(orgCount.rows[0].count) > 0
    ) {
      await client.execute(`DELETE FROM organizations`);
      console.log(`✅ Deleted ${orgCount.rows[0].count} organizations.`);
    }

    // Check for dependent mirror jobs
    const jobCount = await client.execute(
      `SELECT COUNT(*) as count FROM mirror_jobs`
    );

    if (
      jobCount.rows &&
      jobCount.rows[0] &&
      Number(jobCount.rows[0].count) > 0
    ) {
      await client.execute(`DELETE FROM mirror_jobs`);
      console.log(`✅ Deleted ${jobCount.rows[0].count} mirror jobs.`);
    }

    console.log(
      "✅ Database has been reset. The application will now prompt for a new admin account setup on next run."
    );
  } catch (error) {
    console.error("❌ Error resetting users:", error);
    process.exit(1);
  }
}

/**
 * Fix database location issues
 */
async function fixDatabaseIssues() {
  console.log("Checking for database issues...");

  // Check for database files in the root directory
  if (fs.existsSync(rootDbFile)) {
    console.log("Found database file in root directory: gitea-mirror.db");

    // If the data directory doesn't have the file, move it there
    if (!fs.existsSync(dataDbFile)) {
      console.log("Moving database file to data directory...");
      fs.copyFileSync(rootDbFile, dataDbFile);
      console.log("Database file moved successfully.");
    } else {
      console.log(
        "Database file already exists in data directory. Checking for differences..."
      );

      // Compare file sizes to see which is newer/larger
      const rootStats = fs.statSync(rootDbFile);
      const dataStats = fs.statSync(dataDbFile);

      if (
        rootStats.size > dataStats.size ||
        rootStats.mtime > dataStats.mtime
      ) {
        console.log(
          "Root database file is newer or larger. Backing up data directory file and replacing it..."
        );
        fs.copyFileSync(dataDbFile, `${dataDbFile}.backup-${Date.now()}`);
        fs.copyFileSync(rootDbFile, dataDbFile);
        console.log("Database file replaced successfully.");
      }
    }

    // Remove the root file
    console.log("Removing database file from root directory...");
    fs.unlinkSync(rootDbFile);
    console.log("Root database file removed.");
  }

  // Do the same for dev database
  if (fs.existsSync(rootDevDbFile)) {
    console.log(
      "Found development database file in root directory: gitea-mirror-dev.db"
    );

    // If the data directory doesn't have the file, move it there
    if (!fs.existsSync(dataDevDbFile)) {
      console.log("Moving development database file to data directory...");
      fs.copyFileSync(rootDevDbFile, dataDevDbFile);
      console.log("Development database file moved successfully.");
    } else {
      console.log(
        "Development database file already exists in data directory. Checking for differences..."
      );

      // Compare file sizes to see which is newer/larger
      const rootStats = fs.statSync(rootDevDbFile);
      const dataStats = fs.statSync(dataDevDbFile);

      if (
        rootStats.size > dataStats.size ||
        rootStats.mtime > dataStats.mtime
      ) {
        console.log(
          "Root development database file is newer or larger. Backing up data directory file and replacing it..."
        );
        fs.copyFileSync(dataDevDbFile, `${dataDevDbFile}.backup-${Date.now()}`);
        fs.copyFileSync(rootDevDbFile, dataDevDbFile);
        console.log("Development database file replaced successfully.");
      }
    }

    // Remove the root file
    console.log("Removing development database file from root directory...");
    fs.unlinkSync(rootDevDbFile);
    console.log("Root development database file removed.");
  }

  // Check if database files exist in the data directory
  if (!fs.existsSync(dataDbFile)) {
    console.warn(
      "⚠️  WARNING: Production database file not found in data directory."
    );
    console.warn('   Run "pnpm manage-db init" to create it.');
  } else {
    console.log("✅ Production database file found in data directory.");

    // Check if we can connect to the database
    try {
      // Try to query the database
      const configCount = await db.select().from(configs).limit(1);
      console.log(`✅ Successfully connected to the database.`);
    } catch (error) {
      console.error("❌ Error connecting to the database:", error);
      console.warn(
        '   The database file might be corrupted. Consider running "pnpm manage-db init" to recreate it.'
      );
    }
  }

  console.log("Database check completed.");
}

/**
 * Main function to handle the command
 */
async function main() {
  console.log(`Database Management Tool for Gitea Mirror`);

  // Ensure all required tables exist
  console.log("Ensuring all required tables exist...");
  await ensureTablesExist();

  switch (command) {
    case "check":
      await checkDatabase();
      break;
    case "init":
      await initializeDatabase();
      break;
    case "fix":
      await fixDatabaseIssues();
      break;
    case "reset-users":
      await resetUsers();
      break;
    case "update-schema":
      await updateSchema();
      break;
    case "auto":
      // Auto mode: check, fix, and initialize if needed
      console.log("Running in auto mode: check, fix, and initialize if needed");
      await fixDatabaseIssues();

      // Also update schema in auto mode
      await updateSchema();

      if (!fs.existsSync(dataDbFile)) {
        await initializeDatabase();
      } else {
        await checkDatabase();
      }
      break;
    default:
      console.log(`
Available commands:
  check        - Check database status
  init         - Initialize the database (only if it doesn't exist)
  fix          - Fix database location issues
  reset-users  - Remove all users and their data
  update-schema - Update the database schema to the latest version
  auto         - Automatic mode: check, fix, and initialize if needed

Usage: pnpm manage-db [command]
`);
  }
}

main().catch((error) => {
  console.error("Error during database management:", error);
  process.exit(1);
});
