-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);

-- Configurations table
CREATE TABLE IF NOT EXISTS configs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT 1,
  github_config TEXT NOT NULL,
  gitea_config TEXT NOT NULL,
  schedule_config TEXT NOT NULL,
  include TEXT NOT NULL,
  exclude TEXT NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Repositories table
CREATE TABLE IF NOT EXISTS repositories (
  id TEXT PRIMARY KEY,
  config_id TEXT NOT NULL,
  name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  url TEXT NOT NULL,
  is_private BOOLEAN NOT NULL,
  is_fork BOOLEAN NOT NULL,
  owner TEXT NOT NULL,
  organization TEXT,
  mirrored_location TEXT DEFAULT '',
  has_issues BOOLEAN NOT NULL,
  is_starred BOOLEAN NOT NULL,
  status TEXT NOT NULL,
  error_message TEXT,
  last_mirrored DATETIME,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (config_id) REFERENCES configs (id) ON DELETE CASCADE
);

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  config_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  is_included BOOLEAN NOT NULL,
  repository_count INTEGER NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (config_id) REFERENCES configs (id) ON DELETE CASCADE
);

-- Mirror jobs table
CREATE TABLE IF NOT EXISTS mirror_jobs (
  id TEXT PRIMARY KEY,
  config_id TEXT NOT NULL,
  repository_id TEXT,
  status TEXT NOT NULL,
  started_at DATETIME NOT NULL,
  completed_at DATETIME,
  log TEXT NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (config_id) REFERENCES configs (id) ON DELETE CASCADE,
  FOREIGN KEY (repository_id) REFERENCES repositories (id) ON DELETE SET NULL
);
