/**
 * Database Seed Script
 * 
 * Inserts sample test data into the database
 * Useful for development and testing purposes
 * 
 * Usage: node db/seed.js
 * 
 * Creates sample data across all three sources:
 * - Production Records
 * - Quality Inspection Records
 * - Shipping Records
 */

require('dotenv').config();

const pool = require('../src/db');

/**
 * Seed database with test data
 * 
 * Time Complexity: O(n) where n = number of test records
 * Space Complexity: O(n)
 */
const seedDatabase = async () => {
  try {
    console.log('🌱 Seeding database with test data...');

    // Sample data
    const testDate = '2026-02-10';
    const samples = [
      {
        lotCode: 'LOT-001',
        productionDate: testDate,
        productionLine: 'P1',
        shift: 'A',
        unitsPlanned: 1000,
        unitsActual: 950,
        downtimeMinutes: 30,
        inspectionDate: testDate,
        isPass: true,
        defectType: 'Cosmetic',
        defectCount: 5,
        shipDate: testDate,
        destination: 'CA',
        carrier: 'FedEx',
      },
      {
        lotCode: 'LOT-002',
        productionDate: testDate,
        productionLine: 'P2',
        shift: 'B',
        unitsPlanned: 1200,
        unitsActual: 1100,
        downtimeMinutes: 60,
        inspectionDate: testDate,
        isPass: false,
        defectType: 'Functional',
        defectCount: 15,
        shipDate: null,
        destination: null,
        carrier: null,
      },
      {
        lotCode: 'LOT-003',
        productionDate: testDate,
        productionLine: 'P1',
        shift: 'C',
        unitsPlanned: 800,
        unitsActual: 800,
        downtimeMinutes: 0,
        inspectionDate: null,
        isPass: null,
        defectType: null,
        defectCount: 0,
        shipDate: null,
        destination: null,
        carrier: null,
      },
    ];

    for (const sample of samples) {
      // Create lot
      const lotResult = await pool.query(
        `INSERT INTO lots (lot_code, production_date, is_pending_inspection, created_at)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
         ON CONFLICT (lot_code, production_date) DO UPDATE SET lot_code = EXCLUDED.lot_code
         RETURNING id`,
        [sample.lotCode, sample.productionDate, !sample.inspectionDate]
      );

      const lotId = lotResult.rows[0].id;
      console.log(`Created lot: ${sample.lotCode}`);

      // Create production record
      await pool.query(
        `INSERT INTO production_records 
         (lot_id, production_line_id, shift, units_planned, units_actual, downtime_minutes, has_line_issue, source_updated_timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)`,
        [
          lotId,
          sample.productionLine,
          sample.shift,
          sample.unitsPlanned,
          sample.unitsActual,
          sample.downtimeMinutes,
          sample.unitsActual < sample.unitsPlanned, // flag if underproduction
        ]
      );

      // Create quality record if available
      if (sample.inspectionDate) {
        await pool.query(
          `INSERT INTO quality_inspection_records
           (lot_id, inspection_date, is_pass, defect_type, defect_count, inspector_id, source_updated_timestamp)
           VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
          [
            lotId,
            sample.inspectionDate,
            sample.isPass,
            sample.defectType,
            sample.defectCount,
            'QC-001',
          ]
        );
      }

      // Create shipping record if available
      if (sample.shipDate) {
        await pool.query(
          `INSERT INTO shipping_records
           (lot_id, ship_date, destination_state, carrier, qty_shipped, shipment_status, source_updated_timestamp)
           VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
          [
            lotId,
            sample.shipDate,
            sample.destination,
            sample.carrier,
            sample.unitsActual,
            'In Transit',
          ]
        );
      }
    }

    // Create source metadata
    await pool.query(
      `INSERT INTO data_source_metadatas 
       (source_name, source_location, file_format, last_updated_timestamp, refresh_status)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4)
       ON CONFLICT (source_name) DO UPDATE SET last_updated_timestamp = CURRENT_TIMESTAMP`,
      ['Production Logs', './data/sources/production_logs', 'CSV', 'Healthy']
    );

    await pool.query(
      `INSERT INTO data_source_metadatas 
       (source_name, source_location, file_format, last_updated_timestamp, refresh_status)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4)
       ON CONFLICT (source_name) DO UPDATE SET last_updated_timestamp = CURRENT_TIMESTAMP`,
      ['Quality Inspection', './data/sources/quality_logs', 'XLSX', 'Healthy']
    );

    await pool.query(
      `INSERT INTO data_source_metadatas 
       (source_name, source_location, file_format, last_updated_timestamp, refresh_status)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4)
       ON CONFLICT (source_name) DO UPDATE SET last_updated_timestamp = CURRENT_TIMESTAMP`,
      ['Shipping Logs', './data/sources/shipping_logs', 'XLSX', 'Healthy']
    );

    console.log('✓ Seed data inserted successfully');
    console.log('\nSample data:');
    console.log('  - LOT-001: Passed quality, shipped to CA');
    console.log('  - LOT-002: Failed quality, not shipped (has functional defects)');
    console.log('  - LOT-003: Pending inspection, not shipped');

  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  } finally {
    await pool.closePool();
  }
};

seedDatabase();
