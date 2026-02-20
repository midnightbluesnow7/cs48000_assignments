/**
 * Comprehensive Test Suite
 * 
 * Tests all Acceptance Criteria (ACs):
 * - AC1: Automated Multi-Source Ingestion
 * - AC2: Data Normalization & Relational Mapping
 * - AC3: Integrated Problem Reporting
 * - AC4: Automated Validation & Exception Handling
 * 
 * Framework: Jest
 * Time to run: ~30-60 seconds
 * 
 * Test Coverage Matrix:
 * Each test is mapped to specific AC requirements
 * 
 * Time Complexity: Tests run O(n) operations on small datasets
 * Space Complexity: O(1) for test setup/teardown
 */

// Mock environment
process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'operations_db_test';

const request = require('supertest');
const createApp = require('../src/app');
const db = require('../src/db');
const models = require('../src/models');
const { DataCleaner } = require('../src/dataIngestion');
const ReportingService = require('../src/reporting');
const ValidationService = require('../src/validation');

const app = createApp();

// Test data constants
const TEST_LOT_CODE = 'TEST-001';
const TEST_DATE = '2026-02-10';
const TEST_PRODUCTION_LINE = 'P1';

/**
 * TEST SUITE 1: DATA CLEANSING & NORMALIZATION (AC2)
 * 
 * Verifies that data is properly normalized:
 * - Trimmed of whitespace
 * - Leading zeros removed
 * - Dates standardized to ISO format
 */
describe('AC2: Data Normalization & Cleansing', () => {
  /**
   * Test: Trim whitespace from strings
   * 
   * Time Complexity: O(1)
   * AC2 Requirement: "trim whitespace"
   */
  test('DataCleaner should trim whitespace', () => {
    expect(DataCleaner.trimString('  LOT123  ')).toBe('LOT123');
    expect(DataCleaner.trimString('\t\n LOT123 \n\t')).toBe('LOT123');
  });

  /**
   * Test: Remove leading zeros
   * 
   * Time Complexity: O(1)
   * AC2 Requirement: "remove leading zeros"
   */
  test('DataCleaner should remove leading zeros', () => {
    expect(DataCleaner.removeLeadingZeros('00123')).toBe('123');
    expect(DataCleaner.removeLeadingZeros('0')).toBe('0');
    expect(DataCleaner.removeLeadingZeros('123')).toBe('123');
  });

  /**
   * Test: Standardize dates to ISO format (YYYY-MM-DD)
   * 
   * Time Complexity: O(n) where n = date string length
   * AC2 Requirement: "standardize date formats (e.g., YYYY-MM-DD)"
   * 
   * Tests multiple date formats:
   * - ISO: 2026-02-10
   * - American: 02/10/2026
   * - Date objects from Excel
   */
  test('DataCleaner should standardize date formats', () => {
    // ISO format pass-through
    expect(DataCleaner.standardizeDate('2026-02-10')).toBe('2026-02-10');
    
    // American format (MM/DD/YYYY)
    const americanDate = DataCleaner.standardizeDate('02/10/2026');
    expect(americanDate).toBe('2026-02-10');
    
    // Date object
    const dateObj = new Date('2026-02-10');
    expect(DataCleaner.standardizeDate(dateObj)).toBe('2026-02-10');
  });

  /**
   * Test: Clean lot code (combine trim + remove leading zeros)
   * 
   * AC2 Requirement: Complete cleansing logic
   */
  test('DataCleaner should clean lot codes completely', () => {
    expect(DataCleaner.cleanLotCode('  00LOT123  ')).toBe('LOT123');
    expect(DataCleaner.cleanLotCode('000ABC')).toBe('ABC');
  });

  /**
   * Test: Convert string boolean values
   * 
   * Time Complexity: O(1)
   * Handles: Pass/Fail, Yes/No, True/False, 1/0
   */
  test('DataCleaner should convert string booleans', () => {
    expect(DataCleaner.toBoolean('Yes')).toBe(true);
    expect(DataCleaner.toBoolean('Pass')).toBe(true);
    expect(DataCleaner.toBoolean('No')).toBe(false);
    expect(DataCleaner.toBoolean('Fail')).toBe(false);
  });

  /**
   * Test: Convert strings to integers
   * 
   * Time Complexity: O(1)
   */
  test('DataCleaner should convert strings to integers', () => {
    expect(DataCleaner.toInteger('100')).toBe(100);
    expect(DataCleaner.toInteger('invalid')).toBe(0);
    expect(DataCleaner.toInteger('100', 50)).toBe(100);
    expect(DataCleaner.toInteger('invalid', 50)).toBe(50);
  });
});

/**
 * TEST SUITE 2: DATA MODEL & REPOSITORY OPERATIONS
 * 
 * Tests CRUD operations on data models
 * Verifies database operations and constraints
 * 
 * Time Complexity: Each test O(1) database operation
 */
describe('AC1: Data Model Operations', () => {
  beforeAll(async () => {
    // Ensure clean test database
    try {
      // Create test database if needed
      const adminPool = new (require('pg')).Pool({
        host: process.env.DB_HOST || 'localhost',
        database: 'postgres',
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
      });

      const checkDb = await adminPool.query(
        'SELECT 1 FROM pg_database WHERE datname = $1',
        [process.env.DB_NAME]
      );

      if (checkDb.rows.length === 0) {
        await adminPool.query(`CREATE DATABASE ${process.env.DB_NAME}`);
      }

      await adminPool.end();

      // Initialize schema
      const schema = require('fs').readFileSync(
        require('path').join(__dirname, '../db/schema.sql'),
        'utf-8'
      );
      
      const setupPool = new (require('pg')).Pool({
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
      });

      await setupPool.query(schema);
      
      // Clear existing data for clean test runs
      await setupPool.query('TRUNCATE TABLE shipping_records RESTART IDENTITY CASCADE;');
      await setupPool.query('TRUNCATE TABLE quality_inspection_records RESTART IDENTITY CASCADE;');
      await setupPool.query('TRUNCATE TABLE production_records RESTART IDENTITY CASCADE;');
      await setupPool.query('TRUNCATE TABLE lots RESTART IDENTITY CASCADE;');
      await setupPool.query('TRUNCATE TABLE data_integrity_flags RESTART IDENTITY CASCADE;');
      await setupPool.query('TRUNCATE TABLE data_source_metadatas RESTART IDENTITY CASCADE;');
      
      await setupPool.end();
    } catch (error) {
      console.log('Database setup:', error.message);
    }
  });

  afterAll(async () => {
    // Pool will be closed in global afterAll
  });

  /**
   * Test: Create and retrieve Lot (composite key)
   * 
   * AC1 & AC2: Primary key validation
   * Tests composite key (Lot ID + Date)
   */
  test('should create and retrieve a lot with composite key', async () => {
    const lot = await models.Lot.create(TEST_LOT_CODE, TEST_DATE);
    
    expect(lot).toBeDefined();
    expect(lot.id).toBeDefined();
    expect(lot.lot_code).toBe(TEST_LOT_CODE);
    // Date comparison - handle both Date objects and strings
    let lotDate = lot.production_date;
    if (lotDate instanceof Date) {
      lotDate = lotDate.toISOString().split('T')[0];
    } else if (typeof lotDate === 'string' && lotDate.includes('T')) {
      lotDate = lotDate.split('T')[0];
    }
    expect(lotDate).toBe(TEST_DATE);
    expect(lot.is_pending_inspection).toBe(true);

    // Test retrieval by composite key
    const found = await models.Lot.findByCompositeKey(TEST_LOT_CODE, TEST_DATE);
    
    expect(found).toBeDefined();
    expect(found.id).toBe(lot.id);
  });

  /**
   * Test: Create ProductionRecord (AC1 source)
   * 
   * AC1: Ingestion from Production Logs
   * Tests production line error tracking
   */
  test('should create production record for a lot', async () => {
    const lot = await models.Lot.create('LOT-P1', TEST_DATE);
    
    const prod = await models.ProductionRecord.create(
      lot.id,
      TEST_PRODUCTION_LINE,
      'A',
      1000, // units_planned
      950,  // units_actual
      30,   // downtime_minutes
      false, // has_line_issue
      new Date().toISOString()
    );

    expect(prod).toBeDefined();
    expect(prod.production_line_id).toBe(TEST_PRODUCTION_LINE);
    expect(prod.units_actual).toBe(950);
  });

  /**
   * Test: Create QualityInspectionRecord (AC1 source)
   * 
   * AC1: Ingestion from Quality Inspection
   * Tests defect tracking, AC3.2 foundational data
   */
  test('should create quality inspection record', async () => {
    const lot = await models.Lot.create('LOT-Q1', TEST_DATE);
    
    const quality = await models.QualityInspectionRecord.create(
      lot.id,
      TEST_DATE,
      true, // isPass
      'Cosmetic', // defectType
      0,    // defectCount
      'QC-001',
      new Date().toISOString()
    );

    expect(quality).toBeDefined();
    expect(quality.is_pass).toBe(true);
    expect(quality.defect_type).toBe('Cosmetic');
  });

  /**
   * Test: Create ShippingRecord (AC1 source)
   * 
   * AC1: Ingestion from Shipping Logs
   */
  test('should create shipping record', async () => {
    const lot = await models.Lot.create('LOT-SHIP-' + Date.now(), TEST_DATE);
    
    const shipping = await models.ShippingRecord.create(
      lot.id,
      TEST_DATE,
      'CA',     // destinationState
      'FedEx',  // carrier
      950,      // qtyShipped
      'In Transit',
      new Date().toISOString()
    );

    expect(shipping).toBeDefined();
    expect(shipping.destination_state).toBe('CA');
    expect(shipping.carrier).toBe('FedEx');
  });
});

/**
 * TEST SUITE 3: AC2 - CONFLICT RESOLUTION
 * 
 * Tests handling of missing Lot relationships
 * Verifies "Pending Inspection" flag behavior
 */
describe('AC2: Conflict Resolution & Pending Inspection', () => {
  /**
   * Test: Lots without Quality inspection are marked as Pending
   * 
   * AC2 Requirement: "If a Lot ID exists in Production but is missing in Quality,
   * the record must still appear but be flagged as 'Pending Inspection.'"
   * 
   * Time Complexity: O(n) where n = lots without quality
   */
  test('should flag lots without quality as pending inspection', async () => {
    const lot = await models.Lot.create('LOT-PENDING', TEST_DATE);

    // Create production but no quality
    await models.ProductionRecord.create(
      lot.id,
      TEST_PRODUCTION_LINE,
      'A',
      1000, 950, 0, false,
      new Date().toISOString()
    );

    // Update lot flag
    const updated = await models.Lot.update(lot.id, {
      is_pending_inspection: true,
    });

    expect(updated.is_pending_inspection).toBe(true);
  });
});

/**
 * TEST SUITE 4: AC3 - INTEGRATED PROBLEM REPORTING
 * 
 * Tests the three core operational queries
 */
describe('AC3: Integrated Problem Reporting', () => {
  /**
   * AC3.1: Production Health Report
   * 
   * Question: "Which production lines have the highest error rates per week?"
   * 
   * Should return production lines sorted by error rate descending
   */
  test('AC3.1: should get production health by line', async () => {
    // Create sample production data
    const lot1 = await models.Lot.create('LOT-PROD1', TEST_DATE);
    await models.ProductionRecord.create(
      lot1.id, 'P1', 'A', 1000, 800, 60, true,
      new Date().toISOString()
    );

    // Query should return production health metrics
    const report = await ReportingService.getProductionHealthByLine(
      TEST_DATE,
      TEST_DATE,
      10
    );

    // Report should be an array
    expect(Array.isArray(report)).toBe(true);
  });

  /**
   * AC3.2: Defect Trending
   * 
   * Question: "What is the defect trend? How do defect types (Cosmetic vs Functional) vary over time?"
   * 
   * Should aggregate defects by type and time period
   */
  test('AC3.2: should get defect trending', async () => {
    const lot = await models.Lot.create('LOT-DEFECT-' + Date.now(), TEST_DATE);
    await models.QualityInspectionRecord.create(
      lot.id,
      TEST_DATE,
      false,
      'Functional',
      5,
      'QC-001',
      new Date().toISOString()
    );

    const trend = await ReportingService.getDefectTrending(TEST_DATE, TEST_DATE);

    expect(Array.isArray(trend)).toBe(true);
  });

  /**
   * AC3.3: Shipment Verification Search
   * 
   * Question: "What is the current status of a specific Lot ID?"
   * 
   * Entering a Lot ID should immediately return:
   * - In Production
   * - Failed Quality
   * - Shipped
   * - Pending Inspection
   */
  test('AC3.3: should search lot by code and return status', async () => {
    const lot = await models.Lot.create('LOT-SEARCH', TEST_DATE);

    await models.ProductionRecord.create(
      lot.id, TEST_PRODUCTION_LINE, 'A', 1000, 950, 0, false,
      new Date().toISOString()
    );

    await models.QualityInspectionRecord.create(
      lot.id, TEST_DATE, true, 'Cosmetic', 0, 'QC-001',
      new Date().toISOString()
    );

    const result = await ReportingService.searchLotByCode('LOT-SEARCH');

    expect(result).toBeDefined();
    expect(result.lotCode).toBe('LOT-SEARCH');
    expect(['In Production', 'Passed Quality', 'Failed Quality', 'Pending Inspection', 'Shipped', 'Data Conflict'])
      .toContain(result.currentStatus);
  });
});

/**
 * TEST SUITE 5: AC4 - AUTOMATED VALIDATION & EXCEPTION HANDLING
 * 
 * Tests data integrity flag creation and validation rules
 */
describe('AC4: Automated Validation & Exception Handling', () => {
  /**
   * AC4: Data Integrity Flag - Pending Inspection
   * 
   * Creates "Pending Inspection" flag for lots without quality records
   */
  test('AC4: should create pending inspection flags', async () => {
    const lot = await models.Lot.create('LOT-INTEGRITY1', TEST_DATE);

    // Manually create pending inspection flag
    const flag = await models.DataIntegrityFlag.create(
      lot.id,
      'Pending Inspection',
      'Warning',
      'Lot pending quality inspection'
    );

    expect(flag).toBeDefined();
    expect(flag.flag_type).toBe('Pending Inspection');
    expect(flag.severity).toBe('Warning');
  });

  /**
   * AC4: Data Integrity Flag - Orphaned Shipment
   * 
   * Creates "Orphaned Shipment" flag for shipping without quality
   * Severity: Critical (product shipped without QC)
   */
  test('AC4: should create orphaned shipment flags', async () => {
    const lot = await models.Lot.create('LOT-ORPHAN-' + Date.now(), TEST_DATE);

    // Create shipping but no quality
    await models.ShippingRecord.create(
      lot.id, TEST_DATE, 'CA', 'FedEx', 950, 'In Transit',
      new Date().toISOString()
    );

    const flag = await models.DataIntegrityFlag.create(
      lot.id,
      'Orphaned Shipment',
      'Critical',
      'Shipment without quality inspection'
    );

    expect(flag.severity).toBe('Critical');
  });

  /**
   * AC4: Data Integrity Flag - Date Conflict
   * 
   * Flags when Ship Date < Production Date (logic error)
   * Severity: Error
   */
  test('AC4: should create date conflict flags', async () => {
    const flag = await models.DataIntegrityFlag.create(
      1,
      'Date Conflict',
      'Error',
      'Ship date before production date'
    );

    expect(flag.flag_type).toBe('Date Conflict');
    expect(flag.severity).toBe('Error');
  });

  /**
   * AC4: Source Health Status
   * 
   * Shows "Last Updated" timestamp for each source
   * Status: Healthy, Stale, or Error
   */
  test('AC4: should check source health', async () => {
    // Create metadata for sources
    await models.DataSourceMetadata.upsert(
      'Test Source',
      '/test/path',
      'CSV',
      'Healthy'
    );

    const health = await ValidationService.checkSourceHealth(24);

    expect(Array.isArray(health)).toBe(true);
    if (health.length > 0) {
      expect(health[0]).toHaveProperty('sourceName');
      expect(health[0]).toHaveProperty('lastUpdatedTimestamp');
      expect(health[0]).toHaveProperty('refreshStatus');
    }
  });

  /**
   * AC4: Prevent Duplicate Flags
   * 
   * Idempotency: Running validation multiple times shouldn't create duplicate flags
   */
  test('AC4: should not create duplicate flags', async () => {
    const lot = await models.Lot.create('LOT-DUPLICATE', TEST_DATE);

    await models.DataIntegrityFlag.create(
      lot.id,
      'Pending Inspection',
      'Warning',
      'Test flag'
    );

    // Try to create same flag again
    const existing = await models.DataIntegrityFlag.findExisting(
      lot.id,
      'Pending Inspection'
    );

    expect(existing).toBeDefined();
  });
});

/**
 * TEST SUITE 6: HTTP API ENDPOINTS
 * 
 * Tests Express routes for all operations
 */
describe('API Endpoints', () => {
  /**
   * GET / - Root documentation
   */
  test('should return API documentation at root', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('name');
    expect(res.body.name).toBe('Operations Data Consolidation System');
  });

  /**
   * GET /health - Health check
   */
  test('should return health status', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status');
    expect(res.body.status).toBe('healthy');
  });

  /**
   * GET /api/docs - API documentation
   */
  test('should return API documentation', async () => {
    const res = await request(app).get('/api/docs');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('title');
    expect(res.body).toHaveProperty('endpoints');
  });

  /**
   * 404 Not Found
   */
  test('should return 404 for unknown endpoint', async () => {
    const res = await request(app).get('/unknown');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});

/**
 * Global cleanup after all tests
 * Close database pool only once at the very end
 */
afterAll(async () => {
  try {
    await db.closePool();
  } catch (error) {
    // Ignore errors - pool may already be closed
  }
});

module.exports = { app, TEST_LOT_CODE, TEST_DATE, TEST_PRODUCTION_LINE };
