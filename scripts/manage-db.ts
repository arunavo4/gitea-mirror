#!/usr/bin/env bun
/**
 * Database management script for v3.0.0
 * Provides utilities for database maintenance
 */

import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import fs from "fs";
import path from "path";

// Inline getDatabasePath to avoid import issues in production
function getDatabasePath(): string {
  const DATABASE_URL = process.env.DATABASE_URL || "file:./data/gitea-mirror.db";
  return DATABASE_URL.replace("file:", "");
}

const command = process.argv[2];

async function runCommand() {
  switch (command) {
    case "init":
      await initDatabase();
      break;
    case "migrate":
      await runMigrations();
      break;
    case "reset-users":
      await resetUsers();
      break;
    case "check":
      await checkDatabase();
      break;
    case "backup":
      await backupDatabase();
      break;
    default:
      showHelp();
  }
}

function showHelp() {
  console.log(`
Gitea Mirror Database Management (v3.0.0)

Usage: bun scripts/manage-db.ts <command>

Commands:
  init         Initialize a new database with migrations
  migrate      Run pending migrations
  reset-users  Remove all users (careful!)
  check        Check database health
  backup       Create a backup of the database
  
Examples:
  bun scripts/manage-db.ts init
  bun scripts/manage-db.ts migrate
  bun scripts/manage-db.ts backup
`);
}

async function initDatabase() {
  const dbPath = getDatabasePath();
  
  if (fs.existsSync(dbPath)) {
    console.log("⚠️  Database already exists at", dbPath);
    console.log("Use 'bun run cleanup-db' first if you want to start fresh.");
    process.exit(1);
  }
  
  console.log("🆕 Initializing new database...");
  
  // Ensure directory exists
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // Create empty database and run migrations
  const sqlite = new Database(dbPath);
  const db = drizzle(sqlite);
  
  try {
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("✅ Database initialized successfully");
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    process.exit(1);
  } finally {
    sqlite.close();
  }
}

async function runMigrations() {
  const dbPath = getDatabasePath();
  
  if (!fs.existsSync(dbPath)) {
    console.log("❌ Database doesn't exist. Run 'init' first.");
    process.exit(1);
  }
  
  console.log("🔄 Running migrations...");
  
  const sqlite = new Database(dbPath);
  const db = drizzle(sqlite);
  
  try {
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("✅ Migrations completed successfully");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    sqlite.close();
  }
}

async function resetUsers() {
  const dbPath = getDatabasePath();
  
  if (!fs.existsSync(dbPath)) {
    console.log("❌ Database doesn't exist");
    process.exit(1);
  }
  
  console.log("⚠️  WARNING: This will delete ALL users!");
  console.log("Press Ctrl+C to cancel, or wait 5 seconds to continue...");
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  const sqlite = new Database(dbPath);
  
  try {
    sqlite.exec("DELETE FROM users");
    console.log("✅ All users deleted");
  } catch (error) {
    console.error("❌ Failed to delete users:", error);
    process.exit(1);
  } finally {
    sqlite.close();
  }
}

async function checkDatabase() {
  const dbPath = getDatabasePath();
  
  if (!fs.existsSync(dbPath)) {
    console.log("❌ Database doesn't exist at", dbPath);
    process.exit(1);
  }
  
  console.log("🔍 Checking database health...");
  
  const sqlite = new Database(dbPath);
  
  try {
    // Check tables
    const tables = sqlite.query("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[];
    console.log("\n📊 Tables:", tables.map(t => t.name).join(", "));
    
    // Check migration status
    const hasMigrations = tables.some(t => t.name === "__drizzle_migrations");
    if (hasMigrations) {
      const migrations = sqlite.query("SELECT hash, created_at FROM __drizzle_migrations ORDER BY created_at DESC LIMIT 5").all();
      console.log("\n🔄 Recent migrations:", migrations.length);
      migrations.forEach((m: any) => {
        console.log(`   - ${m.hash.substring(0, 8)}... at ${new Date(m.created_at).toLocaleString()}`);
      });
    } else {
      console.log("\n⚠️  No migration history found (v2.x database?)");
    }
    
    // Check counts
    const userCount = sqlite.query("SELECT COUNT(*) as count FROM users").get() as { count: number };
    const configCount = sqlite.query("SELECT COUNT(*) as count FROM configs").get() as { count: number };
    const repoCount = sqlite.query("SELECT COUNT(*) as count FROM repositories").get() as { count: number };
    
    console.log("\n📈 Statistics:");
    console.log(`   - Users: ${userCount.count}`);
    console.log(`   - Configs: ${configCount.count}`);
    console.log(`   - Repositories: ${repoCount.count}`);
    
    console.log("\n✅ Database check complete");
  } catch (error) {
    console.error("❌ Database check failed:", error);
    process.exit(1);
  } finally {
    sqlite.close();
  }
}

async function backupDatabase() {
  const dbPath = getDatabasePath();
  
  if (!fs.existsSync(dbPath)) {
    console.log("❌ Database doesn't exist");
    process.exit(1);
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = `${dbPath}.backup-${timestamp}`;
  
  console.log("📦 Creating backup...");
  
  try {
    fs.copyFileSync(dbPath, backupPath);
    const stats = fs.statSync(backupPath);
    console.log(`✅ Backup created: ${backupPath}`);
    console.log(`   Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  } catch (error) {
    console.error("❌ Backup failed:", error);
    process.exit(1);
  }
}

// Run the command
runCommand().catch(console.error);