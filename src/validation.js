/**
 * Data Validation and Integrity Service
 * 
 * This module implements automated validation and exception handling (AC4):
 * - Identifies missing quality records (Pending Inspection)
 * - Detects orphaned shipments (shipping without quality)
 * - Finds date logic errors (ship date before production date)
 * - Flags data integrity issues
 * 
 * All flagging operations are idempotent - running validation multiple times
 * won't create duplicate flags.
 * 
 * Time Complexity: See individual function documentation
 * Space Complexity: O(n) where n = number of detected issues
 */

const models = require('./models');

/**
 * Validation Service
 * Orchestrates all validation operations
 */
const ValidationService = {
  /**
   * Validate: Lot exists in Production but missing in Quality
   * Creates "Pending Inspection" flag
   * 
   * AC2: Conflict Resolution - Missing Quality record triggers flag
   * AC4: Data Integrity Flags - Pending Inspection
   * 
   * Time Complexity: O(n) where n = total lots without quality records
   * Space Complexity: O(m) where m = lots without quality
   * 
   * @returns {Promise<Object>} Validation result with counts
   */
  validatePendingInspections: async () => {
    console.log('Validating pending inspections...');
    
    const result = {
      name: 'Pending Inspections',
      flagsCreated: 0,
      flagsSkipped: 0,
      errors: [],
    };

    try {
      // Find all lots without quality records
      const lotsWithoutQuality = await models.QualityInspectionRecord.findLotsWithoutQuality();

      for (const lot of lotsWithoutQuality) {
        try {
          // Check if flag already exists (idempotency)
          const existingFlag = await models.DataIntegrityFlag.findExisting(
            lot.id,
            'Pending Inspection'
          );

          if (!existingFlag) {
            // Create new flag
            await models.DataIntegrityFlag.create(
              lot.id,
              'Pending Inspection',
              'Warning',
              `Lot ${lot.lot_code} produced on ${lot.production_date} is pending quality inspection`
            );
            result.flagsCreated += 1;
          } else {
            result.flagsSkipped += 1;
          }

          // Update lot flag
          await models.Lot.update(lot.id, {
            is_pending_inspection: true,
          });
        } catch (error) {
          result.errors.push(`Error validating lot ${lot.lot_code}: ${error.message}`);
        }
      }

      console.log(`Pending inspections validation completed: ${result.flagsCreated} flags created`);
      return result;
    } catch (error) {
      result.errors.push(`Pending inspections validation failed: ${error.message}`);
      return result;
    }
  },

  /**
   * Validate: Lot exists in Shipping but missing in Quality
   * Creates "Orphaned Shipment" flag (Data Integrity issue)
   * 
   * AC4: Data Integrity - Orphaned shipment detection
   * This is a critical issue: product shipped without passing quality control
   * 
   * Time Complexity: O(n) where n = orphaned shipments
   * Space Complexity: O(m)
   * 
   * @returns {Promise<Object>} Validation result
   */
  validateOrphanedShipments: async () => {
    console.log('Validating orphaned shipments...');
    
    const result = {
      name: 'Orphaned Shipments',
      flagsCreated: 0,
      flagsSkipped: 0,
      errors: [],
    };

    try {
      // Find shipping records without quality inspections
      const orphanedShipments = await models.ShippingRecord.findOrphanedShipments();

      for (const shipment of orphanedShipments) {
        try {
          // Check if flag already exists
          const existingFlag = await models.DataIntegrityFlag.findExisting(
            shipment.lot_id,
            'Orphaned Shipment'
          );

          if (!existingFlag) {
            // Create flag with Critical severity - this is a serious issue
            await models.DataIntegrityFlag.create(
              shipment.lot_id,
              'Orphaned Shipment',
              'Critical',
              `Lot ${shipment.lot_code} shipped to ${shipment.destination_state} without quality inspection`
            );
            result.flagsCreated += 1;
          } else {
            result.flagsSkipped += 1;
          }

          // Update lot flag
          await models.Lot.update(shipment.lot_id, {
            has_data_integrity_issue: true,
          });
        } catch (error) {
          result.errors.push(`Error validating shipment for lot ${shipment.lot_code}: ${error.message}`);
        }
      }

      console.log(`Orphaned shipments validation completed: ${result.flagsCreated} flags created`);
      return result;
    } catch (error) {
      result.errors.push(`Orphaned shipments validation failed: ${error.message}`);
      return result;
    }
  },

  /**
   * Validate: Date Logic - Ship Date must be >= Production Date
   * Creates "Date Conflict" flag
   * 
   * AC4: Data Integrity - Date logic error detection
   * Indicates potential data corruption or entry error
   * 
   * Time Complexity: O(n) where n = shipping records with production data
   * Space Complexity: O(m) where m = date conflicts found
   * 
   * Algorithm:
   * 1. Join shipping records with production records via lots
   * 2. Compare ship_date >= production_date
   * 3. Create flags for violations
   * 
   * @returns {Promise<Object>} Validation result
   */
  validateDateLogic: async () => {
    console.log('Validating date logic...');
    
    const result = {
      name: 'Date Logic Validation',
      flagsCreated: 0,
      flagsSkipped: 0,
      errors: [],
    };

    try {
      // Query to find date conflicts: ship_date < production_date
      const query = `
        SELECT 
          l.id,
          l.lot_code,
          l.production_date,
          s.ship_date,
          s.destination_state
        FROM shipping_records s
        JOIN lots l ON s.lot_id = l.id
        WHERE s.ship_date < l.production_date
      `;

      const dbResult = await require('./db').query(query);
      const dateConflicts = dbResult.rows;

      for (const conflict of dateConflicts) {
        try {
          // Check if flag already exists
          const existingFlag = await models.DataIntegrityFlag.findExisting(
            conflict.id,
            'Date Conflict'
          );

          if (!existingFlag) {
            // Create flag
            await models.DataIntegrityFlag.create(
              conflict.id,
              'Date Conflict',
              'Error',
              `Lot ${conflict.lot_code}: Ship date (${conflict.ship_date}) is before production date (${conflict.production_date})`
            );
            result.flagsCreated += 1;
          } else {
            result.flagsSkipped += 1;
          }

          // Update lot flag
          await models.Lot.update(conflict.id, {
            has_date_conflict: true,
          });
        } catch (error) {
          result.errors.push(`Error flagging date conflict for lot ${conflict.lot_code}: ${error.message}`);
        }
      }

      console.log(`Date logic validation completed: ${result.flagsCreated} conflicts found`);
      return result;
    } catch (error) {
      result.errors.push(`Date logic validation failed: ${error.message}`);
      return result;
    }
  },

  /**
   * Run all validations
   * Idempotent - safe to run multiple times
   * 
   * Time Complexity: O(n + m + k) where n, m, k are different validation sizes
   * Space Complexity: O(total issues found)
   * 
   * @returns {Promise<Array>} Array of validation results
   */
  runAllValidations: async () => {
    console.log('Starting comprehensive data validation...');
    
    const results = [];

    results.push(await ValidationService.validatePendingInspections());
    results.push(await ValidationService.validateOrphanedShipments());
    results.push(await ValidationService.validateDateLogic());

    // Calculate total flags created
    const totalFlagsCreated = results.reduce((sum, r) => sum + r.flagsCreated, 0);
    console.log(`Data validation completed: ${totalFlagsCreated} total flags created`);

    return results;
  },

  /**
   * Check source health by comparing last update timestamps
   * Flags sources as Stale if not updated recently
   * 
   * AC4: Status Dashboard - Source Health indicator
   * Shows Last Updated timestamp for each source
   * 
   * Time Complexity: O(3) - exactly 3 sources, constant time
   * Space Complexity: O(1)
   * 
   * @param {number} staleThresholdHours - Hours to consider source as stale (default: 24)
   * @returns {Promise<Array>} Array of source health snapshots
   */
  checkSourceHealth: async (staleThresholdHours = 24) => {
    console.log('Checking source health...');
    
    try {
      const sources = await models.DataSourceMetadata.getAllSources();
      const now = new Date();
      const staleThresholdMs = staleThresholdHours * 60 * 60 * 1000;

      const healthStatus = sources.map((source) => {
        const lastUpdated = new Date(source.last_updated_timestamp);
        const timeSinceUpdate = now - lastUpdated;
        const isStale = timeSinceUpdate > staleThresholdMs;

        return {
          sourceName: source.source_name,
          lastUpdatedTimestamp: source.last_updated_timestamp,
          timeSinceUpdateMinutes: Math.floor(timeSinceUpdate / 60000),
          refreshStatus: isStale ? 'Stale' : source.refresh_status,
          sourceLocation: source.source_location,
          fileFormat: source.file_format,
        };
      });

      console.log('Source health check completed');
      return healthStatus;
    } catch (error) {
      console.error('Source health check failed:', error.message);
      return [];
    }
  },
};

module.exports = ValidationService;
