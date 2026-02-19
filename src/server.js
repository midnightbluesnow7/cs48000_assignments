/**
 * Server Entry Point
 * 
 * Starts the Express server and sets up graceful shutdown
 * Initializes database and schedules auto-refresh
 */

require('dotenv').config();

const config = require('./config');
const createApp = require('./app');
const db = require('./db');
const { DataIngestionService } = require('./dataIngestion');
const ValidationService = require('./validation');

/**
 * Server startup function
 * 
 * Time Complexity: O(1) for startup, O(n) for initial data load
 * Space Complexity: O(n) where n = initial data records
 */
const startServer = async () => {
  try {
    // Initialize Express app
    const app = createApp();

    console.log('🚀 Starting Operations Data Consolidation System...');
    console.log(`Environment: ${config.server.nodeEnv}`);
    console.log(`Database: ${config.database.host}:${config.database.port}/${config.database.database}`);

    // Test database connection
    console.log('Testing database connection...');
    try {
      const result = await db.query('SELECT NOW()');
      console.log('✓ Database connection successful');
    } catch (error) {
      console.error('✗ Database connection failed:', error.message);
      console.error(`Make sure PostgreSQL is running and configured in .env file`);
      process.exit(1);
    }

    /**
     * Initial Data Ingestion
     * 
     * On startup, performs first data ingestion and validation
     * This ensures system is ready for queries
     * 
     * Time Complexity: O(n log n) where n = total records across sources
     * Can be disabled by setting SKIP_INITIAL_INGEST=true
     */
    if (process.env.SKIP_INITIAL_INGEST !== 'true') {
      console.log('Starting initial data ingestion...');
      try {
        const ingestionResults = await DataIngestionService.ingestAllData();
        const validationResults = await ValidationService.runAllValidations();
        
        const totalIngested = ingestionResults.reduce((sum, r) => sum + r.recordsIngested, 0);
        const totalFlags = validationResults.reduce((sum, r) => sum + r.flagsCreated, 0);
        
        console.log(`✓ Initial ingestion completed: ${totalIngested} records, ${totalFlags} integrity flags`);
      } catch (error) {
        console.warn('⚠ Initial ingestion failed (non-fatal):', error.message);
        console.log('System will continue but may have incomplete data');
      }
    }

    /**
     * Auto-Refresh Scheduler
     * 
     * Automatically ingests and validates data at regular intervals
     * Default: 24 hours (86400000ms)
     * 
     * Configuration:
     * - Interval: Set via AUTO_REFRESH_INTERVAL environment variable
     * - Can be disabled by setting AUTO_REFRESH_INTERVAL=0
     * 
     * Algorithm:
     * - Time Complexity: O(n log n) per refresh cycle
     * - Runs asynchronously without blocking server
     */
    if (config.autoRefresh.intervalMs > 0) {
      console.log(`Setting up auto-refresh every ${config.autoRefresh.intervalMs}ms (${(config.autoRefresh.intervalMs / 3600000).toFixed(1)} hours)`);

      // IMPORTANT: Don't await auto-refresh - it runs in background
      // This prevents startup from being blocked by long-running operations
      setInterval(async () => {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] Starting scheduled data refresh...`);
        
        try {
          await DataIngestionService.ingestAllData();
          await ValidationService.runAllValidations();
          console.log(`[${timestamp}] Scheduled refresh completed`);
        } catch (error) {
          console.error(`[${timestamp}] Scheduled refresh failed:`, error.message);
        }
      }, config.autoRefresh.intervalMs);
    }

    /**
     * Start HTTP Server
     * 
     * Binds to all network interfaces (0.0.0.0) on configured port
     */
    const server = app.listen(config.server.port, '0.0.0.0', () => {
      console.log(`✓ Server listening on port ${config.server.port}`);
      console.log(`API Documentation: http://localhost:${config.server.port}/api/docs`);
    });

    /**
     * Graceful Shutdown Handler
     * 
     * Ensures clean shutdown by:
     * 1. Stopping incoming requests
     * 2. Closing database connections
     * 3. Flushing outstanding async operations
     * 
     * Resources that must be cleaned up:
     * - Database connection pool
     * - HTTP server socket
     * - Any background timers
     * 
     * Time Complexity: O(1) - cleanup operations
     * Space Complexity: O(1)
     */
    const gracefulShutdown = async (signal) => {
      console.log(`\n🛑 Received ${signal}, starting graceful shutdown...`);

      // Stop accepting new connections
      server.close(async () => {
        console.log('HTTP server closed');

        // Close database connections
        try {
          await db.closePool();
          console.log('Database connections closed');
        } catch (error) {
          console.error('Error closing database:', error.message);
        }

        console.log('✓ Graceful shutdown complete');
        process.exit(0);
      });

      // Force shutdown after 30 seconds if graceful shutdown takes too long
      setTimeout(() => {
        console.error('⚠ Graceful shutdown timeout, forcing exit');
        process.exit(1);
      }, 30000);
    };

    // Listen for shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('⚠ Uncaught Exception:', error.message);
      console.error(error.stack);
      gracefulShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('⚠ Unhandled Rejection at:', promise, 'Reason:', reason);
      // Note: Don't shutdown on unhandled rejection - just log it
    });

  } catch (error) {
    console.error('Failed to start server:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

// Start the server
startServer();
