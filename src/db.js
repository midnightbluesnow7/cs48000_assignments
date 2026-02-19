/**
 * Database Connection Module
 * 
 * Manages PostgreSQL database connections using the pg library.
 * Provides methods to execute queries, retrieve data, and manage connections.
 * 
 * RESOURCE MANAGEMENT:
 * - All queries use Connection Pool to prevent resource leaks
 * - Connections are automatically returned to the pool after query execution
 * - Connections timeout after 5 minutes of inactivity
 * 
 * Time Complexity: O(1) for connection retrieval
 * Space Complexity: O(n) where n = pool size (default 5-10 connections)
 */

const { Pool } = require('pg');
const config = require('./config');

// Create a connection pool that manages multiple connections
// This prevents resource exhaustion from opening/closing connections for each query
const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.database,
  user: config.database.user,
  password: config.database.password,
  max: 20, // Maximum pool size
  idleTimeoutMillis: 30000, // Connection returns to pool after 30 seconds of inactivity
  connectionTimeoutMillis: 2000, // Connection attempt timeout
});

// Event handlers for pool monitoring
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

/**
 * Execute a SQL query with parameterized values
 * 
 * SECURITY NOTE: Uses parameterized queries to prevent SQL injection
 * Parameters are passed separately from the query string and escaped by the database driver
 * 
 * Time Complexity: O(1) for query execution (actual query time depends on database)
 * Space Complexity: O(r) where r = number of result rows
 * 
 * @param {string} query - SQL query with $1, $2, etc. placeholders
 * @param {Array} values - Parameter values to safely substitute into query
 * @returns {Promise<Object>} Result object with 'rows' array and 'rowCount'
 * @throws {Error} Database connection or query error
 * 
 * Resource Management:
 * - Connection is automatically returned to pool after execution
 * - If an error occurs, connection is still returned to the pool
 */
const query = async (queryString, values = []) => {
  try {
    const result = await pool.query(queryString, values);
    return result;
  } catch (error) {
    console.error('Database query error:', error.message);
    throw error;
  }
};

/**
 * Execute multiple queries within a transaction
 * 
 * RESOURCE MANAGEMENT:
 * - Gets dedicated connection from pool
 * - Begins transaction at start
 * - Rolls back if any query fails
 * - Always releases connection back to pool in finally block
 * 
 * Time Complexity: O(n) where n = number of queries in callback
 * Space Complexity: O(1) - uses single connection
 * 
 * @param {Function} callback - Async function receiving client object
 * @returns {Promise<any>} Result of callback function
 * 
 * Example usage:
 * ```
 * await transaction(async (client) => {
 *   await client.query('INSERT INTO lots (lot_code, production_date) VALUES ($1, $2)', [lotCode, date]);
 *   await client.query('INSERT INTO production_records (...) VALUES (...)');
 * });
 * ```
 */
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    // Connection is always returned to pool regardless of success/failure
    client.release();
  }
};

/**
 * Close all database connections
 * 
 * RESOURCE MANAGEMENT:
 * - Call this during graceful shutdown
 * - Waits for all connections to close properly
 * - Prevents database from hanging processes
 * 
 * Time Complexity: O(1) - one operation regardless of pool size
 * Space Complexity: O(1)
 */
const closePool = async () => {
  try {
    await pool.end();
    console.log('Database pool closed successfully');
  } catch (error) {
    console.error('Error closing database pool:', error.message);
  }
};

module.exports = {
  query,
  transaction,
  closePool,
  pool,
};
