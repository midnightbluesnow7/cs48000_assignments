/**
 * API Routes for Operations Data Consolidation System
 * 
 * Endpoints for:
 * - Data ingestion and refresh
 * - Validation and integrity checks
 * - Production health reporting (AC 3.1)
 * - Defect trending analysis (AC 3.2)
 * - Lot search and verification (AC 3.3)
 * - Source health status (AC 4)
 * - Data integrity flags (AC 4)
 */

const express = require('express');
const { DataIngestionService } = require('./dataIngestion');
const ValidationService = require('./validation');
const ReportingService = require('./reporting');
const models = require('./models');

const router = express.Router();

/**
 * Health Check Endpoint
 * 
 * GET /health
 * Time Complexity: O(1)
 * Space Complexity: O(1)
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * Data Ingestion Endpoints
 * Addresses AC1: Automated Multi-Source Ingestion
 */

/**
 * POST /api/ingest - Manually trigger complete data ingestion
 * 
 * Ingests all three data sources and runs validation
 * Returns detailed ingestion results
 * 
 * Time Complexity: O(n log n) where n = total records across all sources
 * Space Complexity: O(n)
 * 
 * Response:
 * {
 *   timestamp: ISO timestamp,
 *   ingestion: { production, quality, shipping results },
 *   validation: { pending inspections, orphaned shipments, date logic results }
 * }
 */
router.post('/api/ingest', async (req, res, next) => {
  try {
    console.log('Manual ingestion triggered');
    
    // Ingest all data sources
    const ingestionResults = await DataIngestionService.ingestAllData();

    // Run validations on ingested data
    const validationResults = await ValidationService.runAllValidations();

    res.json({
      timestamp: new Date().toISOString(),
      ingestion: ingestionResults,
      validation: validationResults,
      message: 'Data ingestion and validation completed successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/ingest/status - Check ingestion status
 * Returns last updated timestamps for each source
 * 
 * Implements AC4: Source Health Status Dashboard
 */
router.get('/api/ingest/status', async (req, res, next) => {
  try {
    const healthStatus = await ValidationService.checkSourceHealth();
    
    res.json({
      timestamp: new Date().toISOString(),
      sources: healthStatus,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Reporting Endpoints
 * Addresses AC3: Integrated Problem Reporting
 */

/**
 * GET /api/reports/production-health
 * 
 * AC 3.1: Production Health - Identifies production lines with highest error rates
 * 
 * Query Parameters:
 * - startDate (required): ISO date (YYYY-MM-DD)
 * - endDate (required): ISO date (YYYY-MM-DD)
 * - topN: Number of top lines to return (default: 10)
 * 
 * Time Complexity: O(n log n) where n = records in date range
 * 
 * Response shows:
 * - Production line ID
 * - Error rate as percentage
 * - Total lots and units processed
 * - Downtime metrics
 */
router.get('/api/reports/production-health', async (req, res, next) => {
  try {
    const { startDate, endDate, topN = 10 } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'startDate and endDate query parameters are required',
      });
    }

    const report = await ReportingService.getProductionHealthByLine(
      startDate,
      endDate,
      parseInt(topN, 10)
    );

    res.json({
      timestamp: new Date().toISOString(),
      query: { startDate, endDate, topN },
      report,
      reportType: 'Production Health by Line',
      description: 'Production lines sorted by error rate (highest first)',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/reports/defect-trending
 * 
 * AC 3.2: Defect Trending - Visual breakdown of defect types over time
 * 
 * Query Parameters:
 * - startDate (required): ISO date
 * - endDate (required): ISO date
 * 
 * Time Complexity: O(n log n)
 * 
 * Response shows:
 * - Defect type
 * - Week-by-week breakdown
 * - Affected lot counts
 * - Failure rates
 */
router.get('/api/reports/defect-trending', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'startDate and endDate query parameters are required',
      });
    }

    const report = await ReportingService.getDefectTrending(startDate, endDate);

    res.json({
      timestamp: new Date().toISOString(),
      query: { startDate, endDate },
      report,
      reportType: 'Defect Trending',
      description: 'Defect types and rates over time by week',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/reports/integrated-view
 * 
 * Returns consolidated view across all three data sources
 * 
 * Query Parameters (optional):
 * - startDate: ISO date
 * - endDate: ISO date
 * - productionLine: Filter by production line
 * - limit: Max results (default: 100)
 * 
 * Time Complexity: O(log n + m)
 */
router.get('/api/reports/integrated-view', async (req, res, next) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      productionLine: req.query.productionLine,
      limit: parseInt(req.query.limit || '100', 10),
    };

    const view = await ReportingService.getIntegratedLotView(filters);

    res.json({
      timestamp: new Date().toISOString(),
      filters,
      recordCount: view.length,
      data: view,
      description: 'Integrated view of all lots with production, quality, and shipping data',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/search/lot/:lotCode
 * 
 * AC 3.3: Shipment Verification - Search for Lot ID and return current status
 * 
 * This is the primary search function for operational queries
 * Returns comprehensive status of a lot across all three data sources
 * 
 * URL Parameters:
 * - lotCode: The business Lot ID to search
 * 
 * Time Complexity: O(log n) with index on lot_code
 * 
 * Response example:
 * {
 *   lotCode: "LOT-001",
 *   productionDate: "2026-02-18",
 *   currentStatus: "Shipped",
 *   productionLine: "P1",
 *   unitsProduced: 500,
 *   qualityPass: true,
 *   shipmentStatus: "Delivered",
 *   destinationState: "CA",
 *   carrier: "FedEx"
 * }
 */
router.get('/api/search/lot/:lotCode', async (req, res, next) => {
  try {
    const { lotCode } = req.params;

    if (!lotCode || lotCode.trim() === '') {
      return res.status(400).json({
        error: 'Lot code is required',
      });
    }

    const lot = await ReportingService.searchLotByCode(lotCode);

    if (!lot) {
      return res.status(404).json({
        error: `Lot ${lotCode} not found`,
        lotCode,
      });
    }

    res.json({
      timestamp: new Date().toISOString(),
      lot,
      description: 'Complete lot status across all data sources (AC 3.3: Shipment Verification)',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Data Integrity Endpoints
 * Addresses AC4: Automated Validation & Exception Handling
 */

/**
 * GET /api/integrity/flags
 * 
 * AC4: Data Integrity Flags - Returns all active data integrity issues
 * 
 * Flags include:
 * - Pending Inspection: Lot produced but not yet inspected
 * - Orphaned Shipment: Shipped without quality inspection (Critical)
 * - Date Conflict: Ship date before production date (Error)
 * 
 * Time Complexity: O(f) where f = total active flags
 */
router.get('/api/integrity/flags', async (req, res, next) => {
  try {
    const flags = await models.DataIntegrityFlag.findActiveFlags();
    const summary = await ReportingService.getDataIntegritySummary();

    res.json({
      timestamp: new Date().toISOString(),
      flagCount: flags.length,
      summary,
      flags: flags.slice(0, 100), // Limit display to first 100
      description: 'AC4: Data integrity issues requiring attention',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/integrity/summary
 * 
 * AC4: Data quality summary dashboard
 * Returns count of issues by type and severity
 * 
 * Time Complexity: O(f)
 */
router.get('/api/integrity/summary', async (req, res, next) => {
  try {
    const summary = await ReportingService.getDataIntegritySummary();

    res.json({
      timestamp: new Date().toISOString(),
      summary,
      description: 'Summary of data integrity issues by type and severity',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/validation/run - Manually trigger validation
 * 
 * AC4: Automated Validation - Runs all validation checks
 * 
 * Time Complexity: O(n) where n = total records
 */
router.post('/api/validation/run', async (req, res, next) => {
  try {
    console.log('Manual validation triggered');
    
    const results = await ValidationService.runAllValidations();
    const summary = await ReportingService.getDataIntegritySummary();

    res.json({
      timestamp: new Date().toISOString(),
      validation: results,
      summary,
      message: 'Validation completed',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Error Handling Middleware
 * Formats all errors consistently
 */
router.use((error, req, res, next) => {
  console.error('Route error:', error);

  const status = error.status || 500;
  const message = error.message || 'Internal server error';

  res.status(status).json({
    error: message,
    timestamp: new Date().toISOString(),
    path: req.path,
  });
});

module.exports = router;
