import fs from 'fs';
import path from 'path';
import { client } from '../src/lib/db';

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Check if database files exist in the root directory
const rootDbFile = path.join(process.cwd(), 'gitea-mirror.db');
const dataDbFile = path.join(dataDir, 'gitea-mirror.db');

// Check for database files in the root directory
if (fs.existsSync(rootDbFile)) {
  console.warn('⚠️  WARNING: Database file found in root directory: gitea-mirror.db');
  console.warn('   This file should be in the data directory.');
  console.warn('   Run "pnpm cleanup-db" to remove it.');
}

// Check for database files in the data directory
if (fs.existsSync(dataDbFile)) {
  console.log('✅ Database file found in data directory: data/gitea-mirror.db');
  
  // Check for users
  try {
    const userCountResult = await client.execute(`SELECT COUNT(*) as count FROM users`);
    const userCount = userCountResult.rows[0].count;
    
    if (userCount === 0) {
      console.log('ℹ️  No users found in the database.');
      console.log('   When you start the application, you will be directed to the signup page');
      console.log('   to create an initial admin account.');
    } else {
      console.log(`✅ ${userCount} user(s) found in the database.`);
      console.log('   The application will show the login page on startup.');
    }
    
    // Check for configurations
    const configCountResult = await client.execute(`SELECT COUNT(*) as count FROM configs`);
    const configCount = configCountResult.rows[0].count;
    
    if (configCount === 0) {
      console.log('ℹ️  No configurations found in the database.');
      console.log('   You will need to set up your GitHub and Gitea configurations after login.');
    } else {
      console.log(`✅ ${configCount} configuration(s) found in the database.`);
    }
    
  } catch (error) {
    console.error('❌ Error connecting to the database:', error);
    console.warn('   The database file might be corrupted. Consider running "pnpm init-db" to recreate it.');
  }
} else {
  console.warn('⚠️  WARNING: Database file not found in data directory.');
  console.warn('   Run "pnpm init-db" to create it.');
}
