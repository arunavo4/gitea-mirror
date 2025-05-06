import { db, client } from "../src/lib/db";
import fs from "fs";
import path from "path";

// Ensure data directory exists
const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Database path - ensure we use absolute path
const dbPath =
  process.env.DATABASE_URL || `file:${path.join(dataDir, "gitea-mirror.db")}`;

async function main() {
  console.log(`Resetting users in database at ${dbPath}...`);

  try {
    // Check if the database exists
    const dbFilePath = dbPath.replace('file:', '');
    const doesDbExist = fs.existsSync(dbFilePath);
    
    if (!doesDbExist) {
      console.log("Database file doesn't exist. Run 'pnpm init-db' first to create it.");
      return;
    }

    // Count existing users
    const userCountResult = await client.execute(
      `SELECT COUNT(*) as count FROM users`
    );
    const userCount = userCountResult.rows[0].count;

    if (userCount === 0) {
      console.log("No users found in the database.");
      return;
    }

    // Delete all users
    await client.execute(`DELETE FROM users`);
    console.log(`Deleted ${userCount} users from the database.`);

    // Check dependent configurations that need to be removed
    const configCount = await client.execute(
      `SELECT COUNT(*) as count FROM configs`
    );
    
    if (configCount.rows[0].count > 0) {
      await client.execute(`DELETE FROM configs`);
      console.log(`Deleted ${configCount.rows[0].count} configurations.`);
    }

    // Check for dependent repositories
    const repoCount = await client.execute(
      `SELECT COUNT(*) as count FROM repositories`
    );
    
    if (repoCount.rows[0].count > 0) {
      await client.execute(`DELETE FROM repositories`);
      console.log(`Deleted ${repoCount.rows[0].count} repositories.`);
    }

    // Check for dependent organizations
    const orgCount = await client.execute(
      `SELECT COUNT(*) as count FROM organizations`
    );
    
    if (orgCount.rows[0].count > 0) {
      await client.execute(`DELETE FROM organizations`);
      console.log(`Deleted ${orgCount.rows[0].count} organizations.`);
    }

    // Check for dependent mirror jobs
    const jobCount = await client.execute(
      `SELECT COUNT(*) as count FROM mirror_jobs`
    );
    
    if (jobCount.rows[0].count > 0) {
      await client.execute(`DELETE FROM mirror_jobs`);
      console.log(`Deleted ${jobCount.rows[0].count} mirror jobs.`);
    }

    console.log("Database has been reset. The application will now prompt for a new admin account setup on next run.");
    
  } catch (error) {
    console.error("Error resetting users:", error);
    process.exit(1);
  }
}

main();
