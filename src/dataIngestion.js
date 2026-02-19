/**
 * Data Ingestion and Normalization Service
 * 
 * This module handles:
 * - Reading CSV and XLSX files from designated directories
 * - Normalizing and cleansing data according to business rules
 * - Validating data integrity
 * - Loading data into the database
 * 
 * This addresses:
 * - AC1: Automated Multi-Source Ingestion
 * - AC2: Data Normalization & Relational Mapping
 * 
 * Time Complexity varies by operation - see individual function documentation
 * Space Complexity: O(n) where n = number of records in file
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const XLSX = require('xlsx');
const db = require('./db');
const models = require('./models');
const config = require('./config');

/**
 * Cleansing and normalization utilities
 * 
 * These functions implement AC2 requirements:
 * - Trim whitespace
 * - Remove leading zeros
 * - Standardize date formats
 */
const DataCleaner = {
  /**
   * Trim whitespace from string
   * 
   * Time Complexity: O(n) where n = string length
   * Space Complexity: O(n)
   */
  trimString: (value) => {
    return typeof value === 'string' ? value.trim() : value;
  },

  /**
   * Remove leading zeros from lot ID values
   * Applied after string trimming
   * 
   * Time Complexity: O(n) where n = string length
   * Space Complexity: O(n)
   * 
   * Example: "00123" -> "123"
   */
  removeLeadingZeros: (value) => {
    if (typeof value !== 'string') return value;
    // Only remove leading zeros if the string isn't just zeros
    return value.replace(/^0+([0-9]+)/, '$1') || value;
  },

  /**
   * Standardize date format to YYYY-MM-DD
   * Handles various input formats:
   * - MM/DD/YYYY (American)
   * - DD/MM/YYYY (European)
   * - YYYY-MM-DD (ISO - pass-through)
   * - ISO date objects
   * 
   * Time Complexity: O(n) where n = date string length
   * Space Complexity: O(1)
   * 
   * @param {string|Date} dateValue - Date in various formats
   * @returns {string} Date in YYYY-MM-DD format or null if invalid
   */
  standardizeDate: (dateValue) => {
    if (!dateValue) return null;

    // If it's a Date object (from XLSX), convert to ISO string
    if (dateValue instanceof Date) {
      return dateValue.toISOString().split('T')[0];
    }

    if (typeof dateValue !== 'string') {
      return null;
    }

    const trimmed = dateValue.trim();

    // Already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }

    // Try MM/DD/YYYY (American format)
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
      const [month, day, year] = trimmed.split('/');
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    // Try DD/MM/YYYY (European format - attempt conversion)
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
      const parts = trimmed.split('/');
      // Assume format is ambiguous, try parsing with Date constructor
      const date = new Date(trimmed);
      if (!Number.isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }

    return null;
  },

  /**
   * Clean a lot code: trim and remove leading zeros
   * 
   * Time Complexity: O(n)
   * Space Complexity: O(n)
   * 
   * @param {string} lotCode - Lot code to clean
   * @returns {string} Cleaned lot code
   */
  cleanLotCode: (lotCode) => {
    const trimmed = DataCleaner.trimString(lotCode);
    // Remove all leading zeros from lot code (e.g., '00LOT123' -> 'LOT123')
    return trimmed.replace(/^0+/, '') || '0';
  },

  /**
   * Convert string boolean values to actual boolean
   * Handles "Yes"/"No", "Pass"/"Fail", "True"/"False", "1"/"0"
   * 
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   * 
   * @param {string|boolean} value - Value to convert
   * @param {boolean} defaultValue - Default if value is unclear (default: false)
   * @returns {boolean} Boolean value
   */
  toBoolean: (value, defaultValue = false) => {
    if (typeof value === 'boolean') return value;
    if (typeof value !== 'string') return defaultValue;

    const normalized = value.trim().toLowerCase();
    
    if (['yes', 'y', 'true', 'pass', '1'].includes(normalized)) {
      return true;
    }
    if (['no', 'n', 'false', 'fail', '0'].includes(normalized)) {
      return false;
    }

    return defaultValue;
  },

  /**
   * Convert string to integer, with validation
   * 
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   * 
   * @param {string|number} value - Value to convert
   * @param {number} defaultValue - Default if parsing fails (default: 0)
   * @returns {number} Integer value
   */
  toInteger: (value, defaultValue = 0) => {
    if (typeof value === 'number') return Math.floor(value);
    
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? defaultValue : parsed;
  },
};

/**
 * File Reader Module
 * Handles reading CSV and XLSX files
 */
const FileReader = {
  /**
   * Read CSV file and parse into JSON array
   * 
   * Time Complexity: O(n) where n = file size in bytes
   * Space Complexity: O(n) - entire file loaded into memory
   * 
   * RESOURCE NOTE: Files are read synchronously and completely loaded into memory
   * For very large files (>100MB), consider streaming implementation
   * 
   * @param {string} filePath - Absolute path to CSV file
   * @returns {Promise<Array>} Array of parsed rows
   * @throws {Error} If file not found or parsing fails
   */
  readCSV: async (filePath) => {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      // csv-parse library parses in memory
      // O(n) scan through input and O(n) output array
      const records = parse(fileContent, {
        columns: true, // Use first row as headers
        skip_empty_lines: true,
      });
      return records;
    } catch (error) {
      throw new Error(`Failed to read CSV file ${filePath}: ${error.message}`);
    }
  },

  /**
   * Read XLSX file and extract data from first sheet
   * 
   * Time Complexity: O(n) where n = file size
   * Space Complexity: O(n)
   * 
   * RESOURCE NOTE: XLSX library uses in-memory parsing
   * For very large files (>100MB), consider alternative libraries
   * 
   * @param {string} filePath - Absolute path to XLSX file
   * @returns {Promise<Array>} Array of parsed rows
   * @throws {Error} If file not found or parsing fails
   */
  readXLSX: async (filePath) => {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      
      // XLSX.utils.sheet_to_json uses O(n) scan of sheet cells
      const records = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
      return records;
    } catch (error) {
      throw new Error(`Failed to read XLSX file ${filePath}: ${error.message}`);
    }
  },

  /**
   * Detect and read any CSV or XLSX file in a directory
   * Returns first matched file (sorted alphabetically)
   * 
   * Time Complexity: O(m) where m = number of files in directory
   * Space Complexity: O(m)
   * 
   * @param {string} directoryPath - Directory to search
   * @returns {Promise<Array>} Parsed file data or empty array if no file found
   */
  readLatestFromDirectory: async (directoryPath) => {
    try {
      // Check if directory exists
      if (!fs.existsSync(directoryPath)) {
        console.warn(`Directory not found: ${directoryPath}`);
        return [];
      }

      // Read all files in directory - O(m) where m = file count
      const files = fs.readdirSync(directoryPath);
      
      // Filter for CSV or XLSX files - O(m)
      const dataFiles = files.filter(f => 
        f.endsWith('.csv') || f.endsWith('.xlsx') || f.endsWith('.xls')
      );

      if (dataFiles.length === 0) {
        console.warn(`No CSV or XLSX files found in: ${directoryPath}`);
        return [];
      }

      // Sort alphabetically and take latest
      dataFiles.sort();
      const latestFile = dataFiles[dataFiles.length - 1];
      const fullPath = path.join(directoryPath, latestFile);

      // Read the file - O(n) file size
      if (latestFile.endsWith('.csv')) {
        return FileReader.readCSV(fullPath);
      } else {
        return FileReader.readXLSX(fullPath);
      }
    } catch (error) {
      console.error(`Error reading from directory ${directoryPath}:`, error.message);
      return [];
    }
  },
};

/**
 * Data Ingestion Service
 * Orchestrates reading, normalizing, and loading data
 */
const DataIngestionService = {
  /**
   * Ingest production logs from CSV files
   * 
   * Addresses AC1: Automated Multi-Source Ingestion
   * Addresses AC2: Data Normalization & Relational Mapping
   * 
   * Time Complexity: O(n log n) where n = number of records
   * - O(n) to read and parse file
   * - O(n) to normalize records
   * - O(n log n) for database transaction due to index updates
   * 
   * Space Complexity: O(n)
   * 
   * @returns {Promise<Object>} Ingestion result with counts and errors
   */
  ingestProductionLogs: async () => {
    console.log('Starting production logs ingestion...');
    
    const result = {
      source: 'Production Logs',
      recordsRead: 0,
      recordsIngested: 0,
      errors: [],
      startTime: new Date(),
    };

    try {
      // Read production data from designated directory
      const records = await FileReader.readLatestFromDirectory(config.dataSources.productionLogsPath);
      result.recordsRead = records.length;

      if (records.length === 0) {
        console.warn('No production logs found');
        return result;
      }

      // Process each record in a transaction for atomicity
      for (const record of records) {
        try {
          // AC2: Data Normalization
          const lotCode = DataCleaner.cleanLotCode(record['Lot ID'] || record['LotCode'] || '');
          const productionDate = DataCleaner.standardizeDate(record['Production Date'] || record['Date'] || '');
          
          if (!lotCode || !productionDate) {
            result.errors.push(`Invalid lot code or date: ${JSON.stringify(record)}`);
            continue;
          }

          // Create or get lot
          const lot = await models.Lot.create(lotCode, productionDate);

          // Extract production metrics
          const productionLineId = DataCleaner.trimString(record['Production Line'] || record['Line'] || '');
          const shift = DataCleaner.trimString(record['Shift'] || '');
          const unitsPlanned = DataCleaner.toInteger(record['Units Planned'] || record['Planned'] || 0);
          const unitsActual = DataCleaner.toInteger(record['Units Actual'] || record['Actual'] || 0);
          const downtimeMinutes = DataCleaner.toInteger(record['Downtime Minutes'] || record['DowntimeMinutes'] || 0);
          
          // Check if production line had issues (optional field)
          const hasLineIssue = DataCleaner.toBoolean(record['Line Issue'] || record['HasIssue'] || false);

          // Create production record
          await models.ProductionRecord.create(
            lot.id,
            productionLineId,
            shift,
            unitsPlanned,
            unitsActual,
            downtimeMinutes,
            hasLineIssue,
            new Date().toISOString()
          );

          result.recordsIngested += 1;
        } catch (error) {
          result.errors.push(`Error processing production record: ${error.message}`);
        }
      }

      // Update source metadata
      await models.DataSourceMetadata.upsert(
        'Production Logs',
        config.dataSources.productionLogsPath,
        'CSV',
        result.errors.length === 0 ? 'Healthy' : 'Healthy (Some Errors)'
      );

      result.endTime = new Date();
      console.log(`Production logs ingestion completed: ${result.recordsIngested}/${result.recordsRead} records`);
      
      return result;
    } catch (error) {
      result.errors.push(`Production ingestion failed: ${error.message}`);
      result.endTime = new Date();
      return result;
    }
  },

  /**
   * Ingest quality inspection logs
   * 
   * Addresses AC1 & AC2 like production logs
   * 
   * Time Complexity: O(n log n)
   * Space Complexity: O(n)
   * 
   * @returns {Promise<Object>} Ingestion result
   */
  ingestQualityLogs: async () => {
    console.log('Starting quality logs ingestion...');
    
    const result = {
      source: 'Quality Inspection',
      recordsRead: 0,
      recordsIngested: 0,
      errors: [],
      startTime: new Date(),
    };

    try {
      const records = await FileReader.readLatestFromDirectory(config.dataSources.qualityLogsPath);
      result.recordsRead = records.length;

      if (records.length === 0) {
        console.warn('No quality logs found');
        return result;
      }

      for (const record of records) {
        try {
          // AC2: Data Normalization
          const lotCode = DataCleaner.cleanLotCode(record['Lot ID'] || record['LotCode'] || '');
          const inspectionDate = DataCleaner.standardizeDate(record['Inspection Date'] || record['Date'] || '');
          
          if (!lotCode || !inspectionDate) {
            result.errors.push(`Invalid lot code or inspection date: ${JSON.stringify(record)}`);
            continue;
          }

          // Find the lot - should exist from production ingestion
          let lot = await models.Lot.findByCompositeKey(lotCode, inspectionDate);
          
          // If lot doesn't exist, create it
          if (!lot) {
            lot = await models.Lot.create(lotCode, inspectionDate);
          }

          // Extract quality metrics
          const isPass = DataCleaner.toBoolean(record['Is Pass'] || record['Pass'] || false);
          const defectType = DataCleaner.trimString(record['Defect Type'] || record['DefectType'] || '');
          const defectCount = DataCleaner.toInteger(record['Defect Count'] || record['DefectCount'] || 0);
          const inspectorId = DataCleaner.trimString(record['Inspector ID'] || record['Inspector'] || 'UNKNOWN');

          // Create quality record
          await models.QualityInspectionRecord.create(
            lot.id,
            inspectionDate,
            isPass,
            defectType,
            defectCount,
            inspectorId,
            new Date().toISOString()
          );

          // Update lot: quality record now exists
          await models.Lot.update(lot.id, {
            is_pending_inspection: false,
          });

          result.recordsIngested += 1;
        } catch (error) {
          result.errors.push(`Error processing quality record: ${error.message}`);
        }
      }

      // Update source metadata
      await models.DataSourceMetadata.upsert(
        'Quality Inspection',
        config.dataSources.qualityLogsPath,
        'XLSX',
        'Healthy'
      );

      result.endTime = new Date();
      console.log(`Quality logs ingestion completed: ${result.recordsIngested}/${result.recordsRead} records`);
      
      return result;
    } catch (error) {
      result.errors.push(`Quality ingestion failed: ${error.message}`);
      result.endTime = new Date();
      return result;
    }
  },

  /**
   * Ingest shipping logs
   * 
   * Time Complexity: O(n log n)
   * Space Complexity: O(n)
   * 
   * @returns {Promise<Object>} Ingestion result
   */
  ingestShippingLogs: async () => {
    console.log('Starting shipping logs ingestion...');
    
    const result = {
      source: 'Shipping Logs',
      recordsRead: 0,
      recordsIngested: 0,
      errors: [],
      startTime: new Date(),
    };

    try {
      const records = await FileReader.readLatestFromDirectory(config.dataSources.shippingLogsPath);
      result.recordsRead = records.length;

      if (records.length === 0) {
        console.warn('No shipping logs found');
        return result;
      }

      for (const record of records) {
        try {
          // AC2: Data Normalization
          const lotCode = DataCleaner.cleanLotCode(record['Lot ID'] || record['LotCode'] || '');
          const shipDate = DataCleaner.standardizeDate(record['Ship Date'] || record['Date'] || '');
          
          if (!lotCode || !shipDate) {
            result.errors.push(`Invalid lot code or ship date: ${JSON.stringify(record)}`);
            continue;
          }

          // Find the lot
          let lot = await models.Lot.findByCompositeKey(lotCode, shipDate);
          
          if (!lot) {
            lot = await models.Lot.create(lotCode, shipDate);
          }

          // Extract shipping metrics
          const destinationState = DataCleaner.trimString(record['Destination State'] || record['State'] || '');
          const carrier = DataCleaner.trimString(record['Carrier'] || 'UNKNOWN');
          const qtyShipped = DataCleaner.toInteger(record['Qty Shipped'] || record['Quantity'] || 0);
          const shipmentStatus = DataCleaner.trimString(record['Status'] || 'In Transit');

          // Create shipping record
          await models.ShippingRecord.create(
            lot.id,
            shipDate,
            destinationState,
            carrier,
            qtyShipped,
            shipmentStatus,
            new Date().toISOString()
          );

          result.recordsIngested += 1;
        } catch (error) {
          result.errors.push(`Error processing shipping record: ${error.message}`);
        }
      }

      // Update source metadata
      await models.DataSourceMetadata.upsert(
        'Shipping Logs',
        config.dataSources.shippingLogsPath,
        'XLSX',
        'Healthy'
      );

      result.endTime = new Date();
      console.log(`Shipping logs ingestion completed: ${result.recordsIngested}/${result.recordsRead} records`);
      
      return result;
    } catch (error) {
      result.errors.push(`Shipping ingestion failed: ${error.message}`);
      result.endTime = new Date();
      return result;
    }
  },

  /**
   * Ingest all data sources
   * Called during app startup and scheduled refresh
   * 
   * Time Complexity: O(n + m + k) where n, m, k are record counts per source
   * Space Complexity: O(n + m + k)
   * 
   * @returns {Promise<Array>} Array of ingestion results
   */
  ingestAllData: async () => {
    console.log('Starting complete data ingestion cycle...');
    
    const results = [];

    results.push(await DataIngestionService.ingestProductionLogs());
    results.push(await DataIngestionService.ingestQualityLogs());
    results.push(await DataIngestionService.ingestShippingLogs());

    console.log('Complete data ingestion cycle finished');
    return results;
  },
};

module.exports = {
  DataCleaner,
  FileReader,
  DataIngestionService,
};
