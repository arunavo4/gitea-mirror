import { addMirroredLocationColumn } from "../src/lib/db/migrations/add-mirrored-location";

async function runMigrations() {
  try {
    console.log("Running database migrations...");
    
    // Run the migration to add the mirrored_location column
    await addMirroredLocationColumn();
    
    console.log("All migrations completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

runMigrations();
