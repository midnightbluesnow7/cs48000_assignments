/**
 * Application Configuration Module
 * 
 * This module centralizes all environment-based configuration for the application.
 * It validates required environment variables on startup and provides defaults
 * for optional settings.
 * 
 * Time Complexity: O(1) - All operations are constant time lookups
 * Space Complexity: O(1) - Fixed number of configuration values
 */

require('dotenv').config();

/**
 * Database Configuration
 * Manages PostgreSQL connection parameters
 */
const database = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'operations_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
};

/**
 * Server Configuration
 * Manages application server settings
 */
const server = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: (process.env.NODE_ENV || 'development') === 'development',
  isProduction: (process.env.NODE_ENV || 'development') === 'production',
};

/**
 * Data Source Configuration
 * Manages file paths for ingesting data from CSV/XLSX sources
 */
const dataSources = {
  productionLogsPath: process.env.PRODUCTION_LOGS_PATH || './data/sources/production_logs',
  qualityLogsPath: process.env.QUALITY_LOGS_PATH || './data/sources/quality_logs',
  shippingLogsPath: process.env.SHIPPING_LOGS_PATH || './data/sources/shipping_logs',
};

/**
 * Auto-refresh Configuration
 * Defines how often data is automatically ingested and refreshed
 * Default: 24 hours (86400000 milliseconds)
 */
const autoRefresh = {
  intervalMs: parseInt(process.env.AUTO_REFRESH_INTERVAL || '86400000', 10),
};

/**
 * API Configuration
 * Defines timeout and other API-level settings
 */
const api = {
  timeoutMs: parseInt(process.env.API_TIMEOUT || '30000', 10),
};

/**
 * Validation: Check for required environment variables
 * Throws an error if critical configuration is missing
 */
const validateConfig = () => {
  const requiredVars = [
    'DB_HOST',
    'DB_PORT',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD',
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      `Please copy .env.example to .env and configure the values.`
    );
  }
};

// Only validate in non-test environments
if (process.env.NODE_ENV !== 'test') {
  try {
    validateConfig();
  } catch (error) {
    console.error('Configuration validation failed:', error.message);
    process.exit(1);
  }
}

module.exports = {
  database,
  server,
  dataSources,
  autoRefresh,
  api,
};
