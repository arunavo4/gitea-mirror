import { db, client } from '../src/lib/db';
import { configs } from '../src/lib/db';
import fs from 'fs';
import path from 'path';

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Check for database files in the root directory
const rootDbFile = path.join(process.cwd(), 'gitea-mirror.db');
const rootDevDbFile = path.join(process.cwd(), 'gitea-mirror-dev.db');
const dataDbFile = path.join(dataDir, 'gitea-mirror.db');
const dataDevDbFile = path.join(dataDir, 'gitea-mirror-dev.db');

async function main() {
  console.log('Checking for database issues...');

  // Check for database files in the root directory
  if (fs.existsSync(rootDbFile)) {
    console.log('Found database file in root directory: gitea-mirror.db');
    
    // If the data directory doesn't have the file, move it there
    if (!fs.existsSync(dataDbFile)) {
      console.log('Moving database file to data directory...');
      fs.copyFileSync(rootDbFile, dataDbFile);
      console.log('Database file moved successfully.');
    } else {
      console.log('Database file already exists in data directory. Checking for differences...');
      
      // Compare file sizes to see which is newer/larger
      const rootStats = fs.statSync(rootDbFile);
      const dataStats = fs.statSync(dataDbFile);
      
      if (rootStats.size > dataStats.size || rootStats.mtime > dataStats.mtime) {
        console.log('Root database file is newer or larger. Backing up data directory file and replacing it...');
        fs.copyFileSync(dataDbFile, `${dataDbFile}.backup-${Date.now()}`);
        fs.copyFileSync(rootDbFile, dataDbFile);
        console.log('Database file replaced successfully.');
      }
    }
    
    // Remove the root file
    console.log('Removing database file from root directory...');
    fs.unlinkSync(rootDbFile);
    console.log('Root database file removed.');
  }

  // Do the same for dev database
  if (fs.existsSync(rootDevDbFile)) {
    console.log('Found development database file in root directory: gitea-mirror-dev.db');
    
    // If the data directory doesn't have the file, move it there
    if (!fs.existsSync(dataDevDbFile)) {
      console.log('Moving development database file to data directory...');
      fs.copyFileSync(rootDevDbFile, dataDevDbFile);
      console.log('Development database file moved successfully.');
    } else {
      console.log('Development database file already exists in data directory. Checking for differences...');
      
      // Compare file sizes to see which is newer/larger
      const rootStats = fs.statSync(rootDevDbFile);
      const dataStats = fs.statSync(dataDevDbFile);
      
      if (rootStats.size > dataStats.size || rootStats.mtime > dataStats.mtime) {
        console.log('Root development database file is newer or larger. Backing up data directory file and replacing it...');
        fs.copyFileSync(dataDevDbFile, `${dataDevDbFile}.backup-${Date.now()}`);
        fs.copyFileSync(rootDevDbFile, dataDevDbFile);
        console.log('Development database file replaced successfully.');
      }
    }
    
    // Remove the root file
    console.log('Removing development database file from root directory...');
    fs.unlinkSync(rootDevDbFile);
    console.log('Root development database file removed.');
  }

  // Check if database files exist in the data directory
  if (!fs.existsSync(dataDbFile)) {
    console.warn('⚠️  WARNING: Production database file not found in data directory.');
    console.warn('   Run "pnpm init-db" to create it.');
  } else {
    console.log('✅ Production database file found in data directory.');
    
    // Check if we can connect to the database
    try {
      // Try to query the database
      const configCount = await db.select().from(configs).limit(1);
      console.log(`✅ Successfully connected to the database. Found ${configCount.length} configurations.`);
    } catch (error) {
      console.error('❌ Error connecting to the database:', error);
      console.warn('   The database file might be corrupted. Consider running "pnpm init-db" to recreate it.');
    }
  }

  console.log('Database check completed.');
}

main().catch(error => {
  console.error('Error during database check:', error);
  process.exit(1);
});
