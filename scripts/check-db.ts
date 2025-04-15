import fs from 'fs';
import path from 'path';

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Check if database files exist in the root directory
const rootDbFile = path.join(process.cwd(), 'gitea-mirror.db');
const rootDevDbFile = path.join(process.cwd(), 'gitea-mirror-dev.db');
const dataDbFile = path.join(dataDir, 'gitea-mirror.db');
const dataDevDbFile = path.join(dataDir, 'gitea-mirror-dev.db');

// Check for database files in the root directory
if (fs.existsSync(rootDbFile)) {
  console.warn('⚠️  WARNING: Database file found in root directory: gitea-mirror.db');
  console.warn('   This file should be in the data directory.');
  console.warn('   Run "pnpm cleanup-db" to remove it.');
}

if (fs.existsSync(rootDevDbFile)) {
  console.warn('⚠️  WARNING: Development database file found in root directory: gitea-mirror-dev.db');
  console.warn('   This file should be in the data directory.');
  console.warn('   Run "pnpm cleanup-db" to remove it.');
}

// Check for database files in the data directory
if (fs.existsSync(dataDbFile)) {
  console.log('✅ Production database file found in data directory: data/gitea-mirror.db');
} else {
  console.warn('⚠️  WARNING: Production database file not found in data directory.');
  console.warn('   Run "pnpm init-db" to create it.');
}

if (fs.existsSync(dataDevDbFile)) {
  console.log('✅ Development database file found in data directory: data/gitea-mirror-dev.db');
} else {
  console.warn('⚠️  WARNING: Development database file not found in data directory.');
  console.warn('   Run "pnpm create-dev-db" to create it.');
}
