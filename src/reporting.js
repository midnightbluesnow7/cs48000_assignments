/**
 * Reporting and Query Service
 * 
 * Implements AC3: Integrated Problem Reporting
 * Answers the three core operational questions:
 * 1. Production Health: Which production lines have highest error rates per week?
 * 2. Defect Trending: Visual breakdown of defect types over time
 * 3. Shipment Verification: Search function for Lot ID current status
 * 
 * Time Complexity: See individual function documentation
 * Space Complexity: Depends on query results
 */

const models = require('./models');

/**
 * Reporting Service
 */
const ReportingService = {
  /**
   * AC 3.1: Production Health Report
   * Identifies production lines with highest error rates per week
   * 
   * Time Complexity: O(n log n) where n = production records in date range
   * - Database query with GROUP BY/aggregation: O(n log n)
   * - Sorting by error rate: O(k log k) where k = unique production lines
   * 
   * Space Complexity: O(k) where k = unique production lines in period
   * 
   * Algorithm:
   * 1. Aggregate production records by production line and week
   * 2. Calculate error rate = total_errors / total_units
   * 3. Sort by error rate descending
   * 4. Return top lines with highest error rates
   * 
   * @param {string} startDate - ISO date string (YYYY-MM-DD)
   * @param {string} endDate - ISO date string (YYYY-MM-DD)
   * @param {number} topN - Return top N production lines (default: 10)
   * @returns {Promise<Array>} Array of production lines with error metrics
   */
  getProductionHealthByLine: async (startDate, endDate, topN = 10) => {
    try {
      // Query aggregates production data by line and week
      const query = `
        SELECT 
          pr.production_line_id,
          DATE_TRUNC('week', l.production_date) AS week,
          COUNT(DISTINCT l.id) AS total_lots,
          COALESCE(SUM(pr.units_actual), 0) AS total_units,
          COALESCE(SUM(pr.downtime_minutes), 0) AS total_downtime_minutes,
          COUNT(CASE WHEN pr.has_line_issue = true THEN 1 END) AS lots_with_issues,
          ROUND(
            100.0 * COUNT(CASE WHEN pr.has_line_issue = true THEN 1 END) 
            / NULLIF(COUNT(DISTINCT l.id), 0), 
            2
          ) AS error_rate_percent
        FROM production_records pr
        JOIN lots l ON pr.lot_id = l.id
        WHERE l.production_date BETWEEN $1 AND $2
        GROUP BY pr.production_line_id, DATE_TRUNC('week', l.production_date)
        ORDER BY error_rate_percent DESC, week DESC
        LIMIT $3
      `;

      const result = await require('./db').query(query, [startDate, endDate, topN]);
      return result.rows;
    } catch (error) {
      console.error('Error fetching production health report:', error.message);
      throw error;
    }
  },

  /**
   * AC 3.2: Defect Trending Report
   * Visual breakdown of defect types over time
   * 
   * Time Complexity: O(n log n) where n = quality records in period
   * - Database aggregation: O(n log n)
   * - Sorting: O(k log k) where k = unique defect types × time periods
   * 
   * Space Complexity: O(k) where k = unique (defect_type, week) combinations
   * 
   * Algorithm:
   * 1. Aggregate quality inspection records by defect type and week
   * 2. Calculate defect rates
   * 3. Return time series data for visualization
   * 
   * Returns data suitable for time-series visualization:
   * - Line chart: defect count by type over weeks
   * - Stacked area chart: defect type distribution
   * 
   * @param {string} startDate - ISO date string
   * @param {string} endDate - ISO date string
   * @returns {Promise<Array>} Time series defect data
   */
  getDefectTrending: async (startDate, endDate) => {
    try {
      // Query aggregates quality data by defect type and week
      const query = `
        SELECT 
          qir.defect_type,
          DATE_TRUNC('week', qir.inspection_date) AS week,
          COUNT(DISTINCT qir.lot_id) AS affected_lots,
          SUM(qir.defect_count) AS total_defects,
          COUNT(CASE WHEN qir.is_pass = false THEN 1 END) AS failed_inspections,
          ROUND(
            100.0 * COUNT(CASE WHEN qir.is_pass = false THEN 1 END)
            / NULLIF(COUNT(*), 0),
            2
          ) AS failure_rate_percent
        FROM quality_inspection_records qir
        WHERE qir.inspection_date BETWEEN $1 AND $2
        GROUP BY qir.defect_type, DATE_TRUNC('week', qir.inspection_date)
        ORDER BY week DESC, total_defects DESC
      `;

      const result = await require('./db').query(query, [startDate, endDate]);
      return result.rows;
    } catch (error) {
      console.error('Error fetching defect trending report:', error.message);
      throw error;
    }
  },

  /**
   * AC 3.3: Shipment Verification Search
   * Search for lot by Lot ID and return current status
   * 
   * This is the primary search function for operational use
   * Quickly answers: "What is the current status of Lot XYZ?"
   * 
   * Time Complexity: O(log n) with index on lot_code
   * Space Complexity: O(1)
   * 
   * Returns integrated view showing:
   * - Current lot status (In Production, Failed Quality, Shipped, Pending Inspection)
   * - Production line and metrics
   * - Quality status (Pass/Fail)
   * - Shipment status and destination
   * - Any data integrity flags
   * 
   * @param {string} lotCode - Business Lot ID to search
   * @returns {Promise<Object|null>} Integrated lot status or null if not found
   */
  searchLotByCode: async (lotCode) => {
    try {
      // Query joins all related data for comprehensive status view
      const query = `
        SELECT 
          l.lot_code,
          l.production_date,
          l.is_pending_inspection,
          l.has_data_integrity_issue,
          l.has_date_conflict,
          pr.production_line_id,
          pr.units_actual,
          pr.downtime_minutes,
          pr.has_line_issue,
          qir.is_pass AS quality_pass,
          qir.defect_type,
          qir.defect_count,
          qir.inspection_date,
          sr.shipment_status,
          sr.ship_date,
          sr.destination_state,
          sr.carrier
        FROM lots l
        LEFT JOIN production_records pr ON l.id = pr.lot_id
        LEFT JOIN quality_inspection_records qir ON l.id = qir.lot_id
        LEFT JOIN shipping_records sr ON l.id = sr.lot_id
        WHERE LOWER(l.lot_code) = LOWER($1)
        ORDER BY l.production_date DESC
      `;

      const result = await require('./db').query(query, [lotCode]);
      
      if (result.rows.length === 0) {
        return null;
      }

      // Combine multiple rows (if multiple inspections/shipments exist) into single record
      const row = result.rows[0];
      
      // Derive current status based on data
      let currentStatus = 'In Production';
      
      if (row.has_date_conflict) {
        currentStatus = 'Data Conflict';
      } else if (row.shipment_status) {
        currentStatus = row.shipment_status;
      } else if (row.quality_pass === false) {
        currentStatus = 'Failed Quality';
      } else if (row.quality_pass === true) {
        currentStatus = 'Passed Quality';
      } else if (row.is_pending_inspection) {
        currentStatus = 'Pending Inspection';
      }

      return {
        lotCode: row.lot_code,
        productionDate: row.production_date,
        currentStatus,
        productionLine: row.production_line_id,
        unitsProduced: row.units_actual,
        downtimeMinutes: row.downtime_minutes,
        productionLineIssue: row.has_line_issue,
        qualityPass: row.quality_pass,
        defectType: row.defect_type,
        defectCount: row.defect_count,
        inspectionDate: row.inspection_date,
        shipmentStatus: row.shipment_status,
        shipDate: row.ship_date,
        destinationState: row.destination_state,
        carrier: row.carrier,
        isPendingInspection: row.is_pending_inspection,
        hasDataIntegrityIssue: row.has_data_integrity_issue,
        hasDateConflict: row.has_date_conflict,
      };
    } catch (error) {
      console.error('Error searching for lot:', error.message);
      throw error;
    }
  },

  /**
   * Get Integrated Lot View
   * Returns consolidated view across all three data sources
   * 
   * Time Complexity: O(log n + m) where m = results joining related records
   * Space Complexity: O(m)
   * 
   * Useful for dashboards that need comprehensive operational view
   * 
   * @param {Object} filters - Optional filters
   * @param {string} filters.startDate - Date range start (ISO)
   * @param {string} filters.endDate - Date range end (ISO)
   * @param {string} filters.productionLine - Filter by production line
   * @param {number} filters.limit - Row limit (default: 100)
   * @returns {Promise<Array>} Integrated lot data
   */
  getIntegratedLotView: async (filters = {}) => {
    try {
      const { startDate, endDate, productionLine, limit = 100 } = filters;

      let query = `
        SELECT 
          l.lot_code,
          l.production_date,
          pr.production_line_id,
          pr.units_actual,
          qir.is_pass AS quality_pass,
          qir.defect_type,
          sr.shipment_status,
          sr.ship_date,
          l.is_pending_inspection,
          l.has_data_integrity_issue,
          l.has_date_conflict
        FROM lots l
        LEFT JOIN production_records pr ON l.id = pr.lot_id
        LEFT JOIN quality_inspection_records qir ON l.id = qir.lot_id
        LEFT JOIN shipping_records sr ON l.id = sr.lot_id
      `;

      const params = [];
      const conditions = [];

      if (startDate && endDate) {
        conditions.push(`l.production_date BETWEEN $${params.length + 1} AND $${params.length + 2}`);
        params.push(startDate, endDate);
      }

      if (productionLine) {
        conditions.push(`pr.production_line_id = $${params.length + 1}`);
        params.push(productionLine);
      }

      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }

      query += ` ORDER BY l.production_date DESC LIMIT ${limit}`;

      const result = await require('./db').query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error fetching integrated lot view:', error.message);
      throw error;
    }
  },

  /**
   * Get Data Integrity Summary
   * Returns count of active flags by type
   * Used for AC4: Data quality dashboards
   * 
   * Time Complexity: O(f) where f = total flags
   * Space Complexity: O(k) where k = unique flag types
   * 
   * @returns {Promise<Array>} Flag type summaries
   */
  getDataIntegritySummary: async () => {
    try {
      const query = `
        SELECT 
          flag_type,
          severity,
          COUNT(*) AS count,
          MAX(detected_date) AS latest_detected
        FROM data_integrity_flags
        WHERE is_resolved = false
        GROUP BY flag_type, severity
        ORDER BY severity DESC, count DESC
      `;

      const result = await require('./db').query(query);
      return result.rows;
    } catch (error) {
      console.error('Error fetching data integrity summary:', error.message);
      throw error;
    }
  },
};

module.exports = ReportingService;
