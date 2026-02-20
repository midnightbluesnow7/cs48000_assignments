# Operations Data Consolidation System

## Project Description

The Operations Data Consolidation System is a production-ready application that consolidates spreadsheets from three disparate data sources (Production Logs, Quality Inspection, and Shipping Logs) into an integrated view. This system enables Operations Analysts to quickly answer critical business questions about production, quality, and shipment status.

**Business Problem:**
Operations teams manually manage three separate data sources in spreadsheets, making it difficult to get timely answers about production health, quality issues, and shipment status.

**Solution:**
An automated data consolidation system that integrates data from all three sources, normalizes the data to eliminate formatting inconsistencies, validates data integrity, and provides operational dashboards for real-time insights.

### Key Features

- **Automated Multi-Source Ingestion** (AC1)
  - Automatically aggregates data from Production Logs (CSV), Quality Inspection (XLSX), and Shipping Logs (XLSX)
  - Auto-refresh on demand or on a scheduled daily trigger
  - Real-time source health monitoring

- **Data Normalization & Relational Mapping** (AC2)
  - Unified data model using composite key of Lot ID + Date
  - Automatic data cleansing: trim whitespace, remove leading zeros, standardize dates
  - Intelligent conflict resolution: flags missing quality records, marks them as "Pending Inspection"

- **Integrated Problem Reporting** (AC3)
  - **Production Health**: Identifies production lines with highest error rates per week (Question 1)
  - **Defect Trending**: Visual breakdown of defect types (Cosmetic, Functional, etc.) over time (Question 2)
  - **Shipment Verification**: Global search function for Lot ID to check current status (Question 3)

- **Automated Validation & Exception Handling** (AC4)
  - Data integrity flags for validation violations
  - Source Health Dashboard showing "Last Updated" timestamp for each source
  - Outlier detection and logic error identification

---

## How to Run / Build the Code

### Prerequisites

- **Node.js** 16.x or higher
- **PostgreSQL** 13+ (Download: https://www.postgresql.org/download/)
- **npm** (comes with Node.js)

### Step 1: Install Dependencies

```bash
cd /path/to/cs48000_assignments
npm install
```

### Step 2: Configure Environment Variables

```bash
# Copy example config
cp .env.example .env

# Edit with your PostgreSQL credentials
nano .env   # or your preferred editor
```

Required variables:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=operations_db
DB_USER=postgres
DB_PASSWORD=your_password
```

### Step 3: Set Up Database

```bash
# Create schema and tables
node db/setup.js

# Load sample data (optional)
node db/seed.js
```

### Step 4: Prepare Data Files

Create directories and place CSV/XLSX files:
```
data/sources/
├── production_logs/production_data.csv
├── quality_logs/quality_data.xlsx
└── shipping_logs/shipping_data.xlsx
```

Sample files provided in `data/sources/*/sample_*.csv`

### Step 5: Start the Application

```bash
npm run dev        # Development (with auto-reload)
npm start          # Production
```

**Expected output:**
```
✓ Server listening on port 3000
API Documentation: http://localhost:3000/api/docs
```

---

## Usage Examples

### Example 1: Search Lot Status (AC3.3)
```bash
curl "http://localhost:3000/api/search/lot/00001"
```
Returns: `{ lotCode, currentStatus, productionLine, qualityPass, shipmentStatus, ... }`

### Example 2: Production Health Report (AC3.1)
```bash
curl "http://localhost:3000/api/reports/production-health?startDate=2026-02-10&endDate=2026-02-16"
```
Returns: Production lines sorted by error rate (highest first)

### Example 3: Defect Trending (AC3.2)
```bash
curl "http://localhost:3000/api/reports/defect-trending?startDate=2026-02-10&endDate=2026-02-16"
```
Returns: Defect types by week with trending data

### Example 4: Data Integrity Summary (AC4)
```bash
curl "http://localhost:3000/api/integrity/summary"
```
Returns: Count of active data integrity flags by type

### Example 5: Manual Data Ingest (AC1)
```bash
curl -X POST "http://localhost:3000/api/ingest"
```
Returns: Ingestion results and validation report

---

## How to Run Tests

```bash
# Run all tests with coverage report
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Coverage by Acceptance Criteria

**AC1: Automated Multi-Source Ingestion**
- ✓ `should create production record for a lot` - ProductionRecord CRUD
- ✓ `should create quality inspection record` - QualityInspectionRecord CRUD
- ✓ `should create shipping record` - ShippingRecord CRUD

**AC2: Data Normalization & Relational Mapping**
- ✓ `DataCleaner should trim whitespace` - Whitespace normalization
- ✓ `DataCleaner should remove leading zeros` - Zero padding removal
- ✓ `DataCleaner should standardize date formats` - ISO date conversion
- ✓ `should flag lots without quality as pending inspection` - Conflict resolution

**AC3: Integrated Problem Reporting**
- ✓ `AC3.1: should get production health by line` - Error rate trends
- ✓ `AC3.2: should get defect trending` - Defect type analysis
- ✓ `AC3.3: should search lot by code and return status` - Lot verification

**AC4: Automated Validation & Exception Handling**
- ✓ `AC4: should create pending inspection flags` - Missing quality detection
- ✓ `AC4: should create orphaned shipment flags` - Orphaned shipment detection
- ✓ `AC4: should create date conflict flags` - Date logic error detection
- ✓ `AC4: should check source health` - Source freshness monitoring
- ✓ `AC4: should not create duplicate flags` - Idempotency validation

**All tests:** ~60 seconds total execution time

---

## Files & Environment Variables to Update

### Required Configuration

1. **`.env` file** - Database and path configuration
   ```bash
   DB_PASSWORD=your_actual_password
   PRODUCTION_LOGS_PATH=/path/to/production/logs
   QUALITY_LOGS_PATH=/path/to/quality/logs
   SHIPPING_LOGS_PATH=/path/to/shipping/logs
   ```

2. **`package.json`** - Update author field
   ```json
   "author": "Your Name (your.email@company.com)"
   ```

3. **Data Source Directories** - Create and populate:
   ```
   data/sources/production_logs/your_production_data.csv
   data/sources/quality_logs/your_quality_data.xlsx
   data/sources/shipping_logs/your_shipping_data.xlsx
   ```

### Optional Configuration

- `NODE_ENV` - Set to "production" for deployment
- `PORT` - Change API port (default 3000)
- `AUTO_REFRESH_INTERVAL` - Data refresh frequency in ms (default 24 hours)

---

## Architecture & Complexity Analysis

### Architecture Layers

```
┌─────────────────────────────────┐
│    Express REST API             │
│    /api/reports, /api/search    │
└──────────────┬──────────────────┘
               ↓
┌─────────────────────────────────┐
│  Services Layer                 │
│  - DataIngestionService (AC1,2) │
│  - ValidationService (AC4)      │
│  - ReportingService (AC3)       │
└──────────────┬──────────────────┘
               ↓
┌─────────────────────────────────┐
│  Data Models Layer              │
│  - Lot, ProductionRecord        │
│  - QualityInspectionRecord      │
│  - ShippingRecord, Flags        │
└──────────────┬──────────────────┘
               ↓
┌─────────────────────────────────┐
│  PostgreSQL Database            │
│  - 7 Tables + Indexes + Views   │
└─────────────────────────────────┘
```

### Time & Space Complexity

| Operation | Time Complexity | Space Complexity | Notes |
|-----------|-----------------|------------------|-------|
| Data Ingestion | O(n) | O(n) | File read + insert |
| Production Health | O(n log n) | O(k) | GROUP BY aggregation |
| Defect Trending | O(n log n) | O(k) | Weekly aggregation |
| Lot Search | O(log n) | O(1) | Indexed lookup |
| Validation | O(n) | O(m) | Full scan + flags |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Database connection refused | Verify PostgreSQL running, check .env credentials |
| Port 3000 already in use | Kill process: `lsof -i :3000` \| `kill -9 <PID>` |
| No data files found | Create `data/sources/*/` directories, add CSV/XLSX files |
| Tests fail after install | Run `npm install` again to ensure all dependencies |
| Environment variables not loading | Check `.env` file exists and has proper syntax |

---

##Deployment Checklist

- [ ] Update `.env` with production database credentials
- [ ] Set `NODE_ENV=production` in `.env`
- [ ] Run `npm install --only=production`
- [ ] Execute `node db/setup.js` on production database
- [ ] Place production data files in configured directories
- [ ] Test all API endpoints in production
- [ ] Monitor `/api/integrity/flags` for data quality issues
- [ ] Document expected data refresh schedule

---

## Documentation & Support

- **API Documentation:** http://localhost:3000/api/docs
- **Architecture Decisions:** `docs/architecture_decision_records.md`
- **Data Model Design:** `docs/data_design.md`
- **Tech Stack Rationale:** `docs/tech_stack_decision_records.md`

---

## Author

YOUR NAME (update in `.env` and `package.json`)

## License

MIT