/**
 * Express Application Setup
 * 
 * Configures Express middleware, routes, and error handling
 * This is the main application factory
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
require('express-async-errors'); // Enable async/await error handling in routes

const routes = require('./routes');

/**
 * Create Express application
 * 
 * Time Complexity: O(1)
 * Space Complexity: O(1)
 * 
 * @returns {Express.Application} Configured Express app
 */
const createApp = () => {
  const app = express();

  // MIDDLEWARE LAYER - Request processing pipeline

  /**
   * Security Middleware
   * - Helmet: Sets secure HTTP headers
   * - CORS: Allows cross-origin requests (configure as needed)
   */
  app.use(helmet()); // Security headers (Content-Security-Policy, X-Frame-Options, etc.)
  app.use(cors()); // Allow all origins by default - configure in production

  /**
   * Parsing Middleware
   * - Parses JSON request bodies up to 10MB
   * - Parses URL-encoded form data
   */
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  /**
   * Logging Middleware
   * 
   * Logs incoming requests with method, path, and query
   * Time Complexity: O(1)
   */
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`, {
      query: req.query,
      params: req.params,
    });
    next();
  });

  /**
   * API Routes
   * All operational endpoints (see routes.js)
   * 
   * Endpoints include:
   * - /health - Health check
   * - /api/ingest - Data ingestion
   * - /api/reports/* - AC3 reporting endpoints
   * - /api/search/* - AC3 search functionality
   * - /api/integrity/* - AC4 validation endpoints
   */
  app.use(routes);

  /**
   * Root Endpoint
   * Returns API documentation
   */
  app.get('/', (req, res) => {
    res.json({
      name: 'Operations Data Consolidation System',
      version: '1.0.0',
      description: 'Consolidated view of Production, Quality, and Shipping data',
      endpoints: {
        health: 'GET /health',
        documentation: 'GET /api/docs',
        ingestion: {
          trigger: 'POST /api/ingest',
          status: 'GET /api/ingest/status',
        },
        reporting: {
          productionHealth: 'GET /api/reports/production-health?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD',
          defectTrending: 'GET /api/reports/defect-trending?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD',
          integratedView: 'GET /api/reports/integrated-view?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD',
        },
        search: {
          lotStatus: 'GET /api/search/lot/:lotCode',
        },
        integrity: {
          flags: 'GET /api/integrity/flags',
          summary: 'GET /api/integrity/summary',
          validate: 'POST /api/validation/run',
        },
      },
      acceptanceCriteria: {
        AC1: 'Automated Multi-Source Ingestion - POST /api/ingest',
        AC2: 'Data Normalization & Relational Mapping - Automatic on ingestion',
        AC3: 'Integrated Problem Reporting - /api/reports/* endpoints',
        AC4: 'Automated Validation & Exception Handling - /api/integrity/* & /api/validation/*',
      },
    });
  });

  /**
   * API Documentation Endpoint
   */
  app.get('/api/docs', (req, res) => {
    res.json({
      title: 'Operations Data Consolidation System - API Documentation',
      baseUrl: `${req.protocol}://${req.get('host')}`,
      endpoints: [
        {
          path: '/health',
          method: 'GET',
          description: 'Health check endpoint',
          response: { status: 'healthy', timestamp: 'ISO timestamp' },
        },
        {
          path: '/api/ingest',
          method: 'POST',
          description: 'Manually trigger data ingestion from all three sources (AC1)',
          response: {
            timestamp: 'ISO timestamp',
            ingestion: Array,
            validation: Array,
          },
        },
        {
          path: '/api/ingest/status',
          method: 'GET',
          description: 'Get source health status (AC4)',
          response: {
            sources: Array,
            fieldExample: {
              sourceName: 'Production Logs',
              lastUpdatedTimestamp: 'ISO timestamp',
              refreshStatus: 'Healthy|Stale|Error',
            },
          },
        },
        {
          path: '/api/reports/production-health',
          method: 'GET',
          description: 'AC3.1: Production line health with error rates',
          queryParams: {
            startDate: 'YYYY-MM-DD (required)',
            endDate: 'YYYY-MM-DD (required)',
            topN: 'Number to return (default: 10)',
          },
        },
        {
          path: '/api/reports/defect-trending',
          method: 'GET',
          description: 'AC3.2: Defect type trends over time',
          queryParams: {
            startDate: 'YYYY-MM-DD (required)',
            endDate: 'YYYY-MM-DD (required)',
          },
        },
        {
          path: '/api/reports/integrated-view',
          method: 'GET',
          description: 'Consolidated view of all lots with filters',
          queryParams: {
            startDate: 'Optional',
            endDate: 'Optional',
            productionLine: 'Optional',
            limit: 'Optional (default: 100)',
          },
        },
        {
          path: '/api/search/lot/:lotCode',
          method: 'GET',
          description: 'AC3.3: Search lot by code and return current status',
          urlParams: { lotCode: 'Business Lot ID to search' },
        },
        {
          path: '/api/integrity/flags',
          method: 'GET',
          description: 'AC4: Get all active data integrity flags',
        },
        {
          path: '/api/integrity/summary',
          method: 'GET',
          description: 'AC4: Get summary of data issues by type',
        },
        {
          path: '/api/validation/run',
          method: 'POST',
          description: 'AC4: Manually trigger all validation checks',
        },
      ],
    });
  });

  /**
   * 404 Not Found Handler
   * 
   * Catches all unmatched routes
   * Time Complexity: O(1)
   */
  app.use((req, res) => {
    res.status(404).json({
      error: 'Not found',
      path: req.path,
      method: req.method,
      documentation: `${req.protocol}://${req.get('host')}/api/docs`,
    });
  });

  /**
   * Global Error Handler
   * 
   * Catches all unhandled errors from routes
   * Time Complexity: O(1)
   * 
   * Error object properties (from error.js):
   * - status: HTTP status code
   * - message: Error message
   * - code: Application-specific error code
   */
  app.use((err, req, res, next) => {
    console.error('Global error handler:', {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });

    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Internal server error';

    res.status(status).json({
      error: message,
      timestamp: new Date().toISOString(),
      path: req.path,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  });

  return app;
};

module.exports = createApp;
