/**
 * Database Setup Script
 * 
 * Creates all database tables, indexes, and views
 * Run this script once before starting the application
 * 
 * Usage: node db/setup.js
 * 
 * This implements the schema defined in db/schema.sql
 * Includes all tables required for AC1-AC4
 */

require('dotenv').config();

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: 'postgres', // Connect to default database first
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

/**
 * Setup database schema
 * 
 * Time Complexity: O(1) - single execution of SQL
 * Space Complexity: O(1)
 */
const setupDatabase = async () => {
  let client;
  
  try {
    client = await pool.connect();

    const dbName = process.env.DB_NAME || 'operations_db';

    console.log(`📊 Setting up database: ${dbName}`);

    // Check if database exists
    const result = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (result.rows.length === 0) {
      // Create database if it doesn't exist
      console.log(`Creating database ${dbName}...`);
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`✓ Database ${dbName} created`);
    } else {
      console.log(`Database ${dbName} already exists`);
    }

    client.release();

    // Connect to the target database
    const targetPool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: dbName,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
    });

    const targetClient = await targetPool.connect();

    // Read schema SQL file
    const schemaPath = path.join(__dirname, 'schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found: ${schemaPath}`);
    }

    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // Execute schema
    console.log('Creating tables and indexes...');
    await targetClient.query(schema);
    console.log('✓ Schema created successfully');

    // Verify tables exist
    const tablesResult = await targetClient.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log('\n📋 Created tables:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    targetClient.release();
    await targetPool.end();
    await pool.end();

    console.log('\n✓ Database setup complete!');
    console.log('Next steps:');
    console.log('  1. Update .env with your configuration');
    console.log('  2. Place data files in configured directories');
    console.log('  3. Run: npm start');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    if (client) client.release();
    process.exit(1);
  }
};

// Run setup
setupDatabase();
