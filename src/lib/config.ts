/**
 * Application configuration
 */

// Environment variables
export const ENV = {
  // Node environment (development, production, test)
  NODE_ENV: process.env.NODE_ENV || "development",

  // Database URL - use SQLite by default
  get DATABASE_URL() {
    // If explicitly set, use the provided DATABASE_URL
    if (process.env.DATABASE_URL) {
      return process.env.DATABASE_URL;
    }

    // Otherwise, use the default database
    return "sqlite://data/gitea-mirror.db";
  },

  // JWT secret for authentication
  JWT_SECRET:
    process.env.JWT_SECRET || "your-secret-key-change-this-in-production",

  // Server host and port
  HOST: process.env.HOST || "localhost",
  PORT: parseInt(process.env.PORT || "3000", 10),
};
