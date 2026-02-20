/**
 * Data Models / Repository Layer
 * 
 * This module defines all data access operations for the application.
 * Each model represents a business entity (Lot, ProductionRecord, etc.) 
 * and provides CRUD operations.
 * 
 * ARCHITECTURE NOTE:
 * - Repository pattern isolates database operations from business logic
 * - All database operations are parameterized to prevent SQL injection
 * - Connection management is handled by the db.js pool
 * 
 * Time Complexity: Each query is O(1) for execution (actual DB time varies)
 * Space Complexity: Depends on result set size
 */

const db = require('./db');

/**
 * Lots Model
 * Represents the core conformed entity that unifies all data sources
 */
const Lot = {
  /**
   * Create a new lot with auto-generated defaults
   * 
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   * 
   * @param {string} lotCode - Business Lot ID (cleansed)
   * @param {string} productionDate - ISO date string (YYYY-MM-DD)
   * @returns {Promise<Object>} Created lot with id
   */
  create: async (lotCode, productionDate) => {
    const query = `
      INSERT INTO lots (lot_code, production_date, is_pending_inspection, created_at)
      VALUES ($1, $2, true, CURRENT_TIMESTAMP)
      ON CONFLICT (lot_code, production_date) DO UPDATE
      SET lot_code = EXCLUDED.lot_code
      RETURNING *
    `;
    const result = await db.query(query, [lotCode, productionDate]);
    return result.rows[0];
  },

  /**
   * Retrieve a lot by code and production date (composite key)
   * 
   * Time Complexity: O(log n) with index on (lot_code, production_date)
   * Space Complexity: O(1)
   * 
   * @param {string} lotCode - Lot code to search
   * @param {string} productionDate - Production date to search
   * @returns {Promise<Object|null>} Lot object or null if not found
   */
  findByCompositeKey: async (lotCode, productionDate) => {
    const query = `
      SELECT * FROM lots
      WHERE lot_code = $1 AND production_date = $2
    `;
    const result = await db.query(query, [lotCode, productionDate]);
    return result.rows[0] || null;
  },

  /**
   * Search lots by lot code (supports partial searching)
   * 
   * Time Complexity: O(log n) with index on lot_code
   * Space Complexity: O(m) where m = matching results
   * 
   * @param {string} lotCode - Lot code to search (can be partial)
   * @returns {Promise<Array>} Array of matching lots
   */
  searchByCode: async (lotCode) => {
    const query = `
      SELECT * FROM lots
      WHERE lot_code ILIKE $1
      ORDER BY production_date DESC
      LIMIT 100
    `;
    const result = await db.query(query, [`%${lotCode}%`]);
    return result.rows;
  },

  /**
   * Update lot status and flags
   * 
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   * 
   * @param {number} lotId - Lot ID to update
   * @param {Object} updates - Object with fields to update
   * @returns {Promise<Object>} Updated lot
   */
  update: async (lotId, updates) => {
    const allowedFields = [
      'is_pending_inspection',
      'has_data_integrity_issue',
      'has_date_conflict',
    ];
    
    const updateClauses = [];
    const values = [];
    let paramIndex = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (allowedFields.includes(key)) {
        updateClauses.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex += 1;
      }
    });

    if (updateClauses.length === 0) {
      return Lot.findById(lotId);
    }

    values.push(lotId);
    const query = `
      UPDATE lots
      SET ${updateClauses.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    const result = await db.query(query, values);
    return result.rows[0];
  },

  /**
   * Retrieve lot by internal ID
   * 
   * Time Complexity: O(1) with primary key index
   * Space Complexity: O(1)
   * 
   * @param {number} lotId - Internal lot ID
   * @returns {Promise<Object|null>} Lot object or null
   */
  findById: async (lotId) => {
    const query = 'SELECT * FROM lots WHERE id = $1';
    const result = await db.query(query, [lotId]);
    return result.rows[0] || null;
  },

  /**
   * Get all lots within a date range
   * Used for trend analysis and reporting
   * 
   * Time Complexity: O(log n + m) where m = results found
   * Space Complexity: O(m) where m = matching results
   * 
   * @param {string} startDate - ISO date (YYYY-MM-DD)
   * @param {string} endDate - ISO date (YYYY-MM-DD)
   * @returns {Promise<Array>} Array of lots
   */
  findByDateRange: async (startDate, endDate) => {
    const query = `
      SELECT * FROM lots
      WHERE production_date BETWEEN $1 AND $2
      ORDER BY production_date DESC
    `;
    const result = await db.query(query, [startDate, endDate]);
    return result.rows;
  },
};

/**
 * ProductionRecord Model
 * Represents production log entries with line and error information
 */
const ProductionRecord = {
  /**
   * Create a production record for a lot
   * 
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   * 
   * @param {number} lotId - Lot ID (foreign key)
   * @param {string} productionLineId - Production line identifier
   * @param {string} shift - Shift identifier (e.g., "A", "B", "C")
   * @param {number} unitsPlanned - Planned production units
   * @param {number} unitsActual - Actual produced units
   * @param {number} downtimeMinutes - Downtime in minutes
   * @param {boolean} hasLineIssue - Whether production line had issues
   * @param {string} sourceUpdatedTimestamp - ISO timestamp of source file update
   * @returns {Promise<Object>} Created production record
   */
  create: async (
    lotId,
    productionLineId,
    shift,
    unitsPlanned,
    unitsActual,
    downtimeMinutes,
    hasLineIssue,
    sourceUpdatedTimestamp
  ) => {
    const query = `
      INSERT INTO production_records 
      (lot_id, production_line_id, shift, units_planned, units_actual, downtime_minutes, has_line_issue, source_updated_timestamp)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const result = await db.query(query, [
      lotId,
      productionLineId,
      shift,
      unitsPlanned,
      unitsActual,
      downtimeMinutes,
      hasLineIssue,
      sourceUpdatedTimestamp,
    ]);
    return result.rows[0];
  },

  /**
   * Get production records for a specific lot
   * 
   * Time Complexity: O(log n + m) where m = records per lot
   * Space Complexity: O(m)
   * 
   * @param {number} lotId - Lot ID
   * @returns {Promise<Array>} Array of production records
   */
  findByLotId: async (lotId) => {
    const query = `
      SELECT * FROM production_records
      WHERE lot_id = $1
      ORDER BY source_updated_timestamp DESC
    `;
    const result = await db.query(query, [lotId]);
    return result.rows;
  },

  /**
   * Get production records by production line for error rate analysis
   * Used for AC 3.1: Production Health trend analysis
   * 
   * Time Complexity: O(log n + m) where m = matching records
   * Space Complexity: O(m)
   * 
   * @param {string} productionLineId - Production line ID
   * @param {string} startDate - ISO date
   * @param {string} endDate - ISO date
   * @returns {Promise<Array>} Array of production records
   */
  findByProductionLineAndDateRange: async (productionLineId, startDate, endDate) => {
    const query = `
      SELECT pr.* FROM production_records pr
      JOIN lots l ON pr.lot_id = l.id
      WHERE pr.production_line_id = $1 
        AND l.production_date BETWEEN $2 AND $3
      ORDER BY l.production_date ASC
    `;
    const result = await db.query(query, [productionLineId, startDate, endDate]);
    return result.rows;
  },
};

/**
 * QualityInspectionRecord Model
 * Represents quality control inspection results
 */
const QualityInspectionRecord = {
  /**
   * Create a quality inspection record
   * 
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   * 
   * @param {number} lotId - Lot ID (foreign key)
   * @param {string} inspectionDate - Inspection date (YYYY-MM-DD)
   * @param {boolean} isPass - Pass/Fail result
   * @param {string} defectType - Type of defect (Cosmetic, Functional, etc.)
   * @param {number} defectCount - Count of defects found
   * @param {string} inspectorId - Inspector identifier
   * @param {string} sourceUpdatedTimestamp - ISO timestamp of source file update
   * @returns {Promise<Object>} Created inspection record
   */
  create: async (
    lotId,
    inspectionDate,
    isPass,
    defectType,
    defectCount,
    inspectorId,
    sourceUpdatedTimestamp
  ) => {
    const query = `
      INSERT INTO quality_inspection_records
      (lot_id, inspection_date, is_pass, defect_type, defect_count, inspector_id, source_updated_timestamp)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const result = await db.query(query, [
      lotId,
      inspectionDate,
      isPass,
      defectType,
      defectCount,
      inspectorId,
      sourceUpdatedTimestamp,
    ]);
    return result.rows[0];
  },

  /**
   * Get quality inspection records for a lot
   * 
   * Time Complexity: O(log n + m)
   * Space Complexity: O(m)
   * 
   * @param {number} lotId - Lot ID
   * @returns {Promise<Array>} Array of inspection records
   */
  findByLotId: async (lotId) => {
    const query = `
      SELECT * FROM quality_inspection_records
      WHERE lot_id = $1
      ORDER BY inspection_date DESC
    `;
    const result = await db.query(query, [lotId]);
    return result.rows;
  },

  /**
   * Get defect trend data by defect type and date range
   * Aggregates defect counts for trend analysis
   * Used for AC 3.2: Defect Trending
   * 
   * Time Complexity: O(n log n) due to GROUP BY aggregation
   * Space Complexity: O(k) where k = unique defect types
   * 
   * Algorithm:
   * - Scans all quality records in date range: O(n)
   * - Groups by defect type: O(k) where k = unique types
   * - Sorts by date: O(n log n)
   * 
   * @param {string} startDate - ISO date
   * @param {string} endDate - ISO date
   * @returns {Promise<Array>} Aggregated defect data
   */
  getDefectTrendByType: async (startDate, endDate) => {
    const query = `
      SELECT 
        defect_type,
        DATE_TRUNC('week', inspection_date) AS week,
        COUNT(DISTINCT lot_id) AS affected_lots,
        SUM(defect_count) AS total_defects,
        ROUND(100.0 * SUM(defect_count) / NULLIF(SUM(NULLIF(defect_count, 0)), 0), 2) AS defect_percentage
      FROM quality_inspection_records
      WHERE inspection_date BETWEEN $1 AND $2
      GROUP BY defect_type, DATE_TRUNC('week', inspection_date)
      ORDER BY week DESC, total_defects DESC
    `;
    const result = await db.query(query, [startDate, endDate]);
    return result.rows;
  },

  /**
   * Find lots with missing quality records
   * Used for AC 2: Conflict Resolution (Pending Inspection)
   * 
   * Time Complexity: O(n) where n = total lots
   * Space Complexity: O(m) where m = lots without quality records
   * 
   * @returns {Promise<Array>} Array of lots with no quality records
   */
  findLotsWithoutQuality: async () => {
    const query = `
      SELECT l.* FROM lots l
      LEFT JOIN quality_inspection_records q ON l.id = q.lot_id
      WHERE q.id IS NULL
    `;
    const result = await db.query(query);
    return result.rows;
  },
};

/**
 * ShippingRecord Model
 * Represents shipping log entries (1:1 with Lot)
 */
const ShippingRecord = {
  /**
   * Create a shipping record for a lot
   * 
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   * 
   * @param {number} lotId - Lot ID (foreign key, UNIQUE constraint)
   * @param {string} shipDate - Ship date (YYYY-MM-DD)
   * @param {string} destinationState - Destination state code (e.g., "CA")
   * @param {string} carrier - Carrier name
   * @param {number} qtyShipped - Quantity shipped
   * @param {string} shipmentStatus - Status (e.g., "In Transit", "Delivered")
   * @param {string} sourceUpdatedTimestamp - ISO timestamp of source file update
   * @returns {Promise<Object>} Created shipping record
   */
  create: async (
    lotId,
    shipDate,
    destinationState,
    carrier,
    qtyShipped,
    shipmentStatus,
    sourceUpdatedTimestamp
  ) => {
    const query = `
      INSERT INTO shipping_records
      (lot_id, ship_date, destination_state, carrier, qty_shipped, shipment_status, source_updated_timestamp)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const result = await db.query(query, [
      lotId,
      shipDate,
      destinationState,
      carrier,
      qtyShipped,
      shipmentStatus,
      sourceUpdatedTimestamp,
    ]);
    return result.rows[0];
  },

  /**
   * Get shipping record for a lot
   * Since it's 1:1, there's at most one record
   * 
   * Time Complexity: O(1) with UNIQUE constraint on lot_id
   * Space Complexity: O(1)
   * 
   * @param {number} lotId - Lot ID
   * @returns {Promise<Object|null>} Shipping record or null
   */
  findByLotId: async (lotId) => {
    const query = `
      SELECT * FROM shipping_records
      WHERE lot_id = $1
    `;
    const result = await db.query(query, [lotId]);
    return result.rows[0] || null;
  },

  /**
   * Search for lot by lot code (for AC 3.3: Shipment Verification)
   * Joins with lots table to find shipment by lot code
   * 
   * Time Complexity: O(log n) with index on lot_code
   * Space Complexity: O(1)
   * 
   * @param {string} lotCode - Business Lot ID
   * @returns {Promise<Object|null>} Shipping record with lot details or null
   */
  findByLotCode: async (lotCode) => {
    const query = `
      SELECT 
        l.lot_code,
        l.production_date,
        l.is_pending_inspection,
        s.shipment_status,
        s.ship_date,
        s.destination_state,
        s.carrier
      FROM lots l
      LEFT JOIN shipping_records s ON l.id = s.lot_id
      WHERE l.lot_code = $1
      ORDER BY l.production_date DESC
      LIMIT 1
    `;
    const result = await db.query(query, [lotCode]);
    return result.rows[0] || null;
  },

  /**
   * Find shipping records with missing quality inspections
   * Used for AC 4: Data Integrity - Orphaned Shipment detection
   * 
   * Time Complexity: O(n) where n = total shipments
   * Space Complexity: O(m) where m = orphaned shipments
   * 
   * @returns {Promise<Array>} Array of shipping records without quality records
   */
  findOrphanedShipments: async () => {
    const query = `
      SELECT s.*, l.lot_code FROM shipping_records s
      JOIN lots l ON s.lot_id = l.id
      LEFT JOIN quality_inspection_records q ON l.id = q.lot_id
      WHERE q.id IS NULL
    `;
    const result = await db.query(query);
    return result.rows;
  },
};

/**
 * DataSourceMetadata Model
 * Manages source health tracking and refresh status
 */
const DataSourceMetadata = {
  /**
   * Create or update source metadata
   * 
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   * 
   * @param {string} sourceName - Name of data source
   * @param {string} sourceLocation - Path or URL to source
   * @param {string} fileFormat - File format (XLSX, CSV)
   * @param {string} refreshStatus - Status (Healthy, Stale, Error)
   * @returns {Promise<Object>} Metadata object
   */
  upsert: async (sourceName, sourceLocation, fileFormat, refreshStatus = 'Healthy') => {
    const query = `
      INSERT INTO data_source_metadatas 
      (source_name, source_location, file_format, last_updated_timestamp, refresh_status)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4)
      ON CONFLICT (source_name) DO UPDATE
      SET last_updated_timestamp = CURRENT_TIMESTAMP,
          refresh_status = $4,
          source_location = $2,
          file_format = $3
      RETURNING *
    `;
    const result = await db.query(query, [sourceName, sourceLocation, fileFormat, refreshStatus]);
    return result.rows[0];
  },

  /**
   * Get metadata for all data sources
   * Used for AC 4: Source Health Dashboard
   * 
   * Time Complexity: O(1) - fixed number of sources
   * Space Complexity: O(3) - exactly 3 sources
   * 
   * @returns {Promise<Array>} Array of source metadata
   */
  getAllSources: async () => {
    const query = `
      SELECT * FROM data_source_metadatas
      ORDER BY source_name ASC
    `;
    const result = await db.query(query);
    return result.rows;
  },

  /**
   * Get metadata for specific source
   * 
   * Time Complexity: O(1) with UNIQUE constraint on source_name
   * Space Complexity: O(1)
   * 
   * @param {string} sourceName - Name of source
   * @returns {Promise<Object|null>} Metadata or null
   */
  findByName: async (sourceName) => {
    const query = `
      SELECT * FROM data_source_metadatas
      WHERE source_name = $1
    `;
    const result = await db.query(query, [sourceName]);
    return result.rows[0] || null;
  },
};

/**
 * DataIntegrityFlag Model
 * Manages data quality issues and validation violations
 */
const DataIntegrityFlag = {
  /**
   * Create a data integrity flag
   * 
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   * 
   * @param {number} lotId - Lot ID (foreign key)
   * @param {string} flagType - Type of flag (Missing Quality, Date Conflict, Orphaned Shipment, etc.)
   * @param {string} severity - Severity level (Warning, Error, Critical)
   * @param {string} description - Human-readable description
   * @returns {Promise<Object>} Created flag object
   */
  create: async (lotId, flagType, severity, description) => {
    const query = `
      INSERT INTO data_integrity_flags
      (lot_id, flag_type, severity, description, detected_date, is_resolved)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, false)
      RETURNING *
    `;
    const result = await db.query(query, [lotId, flagType, severity, description]);
    return result.rows[0];
  },

  /**
   * Find existing flag
   * Prevents duplicate flags
   * 
   * Time Complexity: O(log n) with indexes
   * Space Complexity: O(1)
   * 
   * @param {number} lotId - Lot ID
   * @param {string} flagType - Flag type
   * @returns {Promise<Object|null>} Existing flag or null
   */
  findExisting: async (lotId, flagType) => {
    const query = `
      SELECT * FROM data_integrity_flags
      WHERE lot_id = $1 AND flag_type = $2 AND is_resolved = false
      LIMIT 1
    `;
    const result = await db.query(query, [lotId, flagType]);
    return result.rows[0] || null;
  },

  /**
   * Get all active flags
   * Used for data quality dashboards
   * 
   * Time Complexity: O(n) where n = total flags
   * Space Complexity: O(m) where m = active flags
   * 
   * @returns {Promise<Array>} Array of active data integrity flags
   */
  findActiveFlags: async () => {
    const query = `
      SELECT f.*, l.lot_code FROM data_integrity_flags f
      JOIN lots l ON f.lot_id = l.id
      WHERE f.is_resolved = false
      ORDER BY f.severity DESC, f.detected_date DESC
    `;
    const result = await db.query(query);
    return result.rows;
  },

  /**
   * Get flags for a specific lot
   * 
   * Time Complexity: O(log n) with index on lot_id
   * Space Complexity: O(m)
   * 
   * @param {number} lotId - Lot ID
   * @returns {Promise<Array>} Array of flags for the lot
   */
  findByLotId: async (lotId) => {
    const query = `
      SELECT * FROM data_integrity_flags
      WHERE lot_id = $1
      ORDER BY detected_date DESC
    `;
    const result = await db.query(query, [lotId]);
    return result.rows;
  },

  /**
   * Mark flag as resolved
   * 
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   * 
   * @param {number} flagId - Flag ID to resolve
   * @returns {Promise<Object>} Updated flag
   */
  markResolved: async (flagId) => {
    const query = `
      UPDATE data_integrity_flags
      SET is_resolved = true
      WHERE id = $1
      RETURNING *
    `;
    const result = await db.query(query, [flagId]);
    return result.rows[0];
  },
};

module.exports = {
  Lot,
  ProductionRecord,
  QualityInspectionRecord,
  ShippingRecord,
  DataSourceMetadata,
  DataIntegrityFlag,
};
