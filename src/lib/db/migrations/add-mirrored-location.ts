import { client } from "@/lib/db";

/**
 * Migration script to add the mirrored_location column to the repositories table
 */
export async function addMirroredLocationColumn() {
  try {
    console.log("Starting migration: Adding mirrored_location column to repositories table");

    // Check if the column already exists
    const tableInfo = await client.execute(`PRAGMA table_info(repositories)`);
    const columnExists = tableInfo.rows.some((row: any) => row.name === "mirrored_location");

    if (columnExists) {
      console.log("Column mirrored_location already exists, skipping migration");
      return;
    }

    // Add the mirrored_location column
    await client.execute(`ALTER TABLE repositories ADD COLUMN mirrored_location TEXT DEFAULT ''`);

    console.log("Migration completed successfully: mirrored_location column added");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}
