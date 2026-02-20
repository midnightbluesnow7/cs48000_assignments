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

- **Python** 3.8+ (Download: https://www.python.org/)
- **PostgreSQL** 13+ (Download: https://www.postgresql.org/download/)
- **pip** (comes with Python)
- **psql** CLI tool (included with PostgreSQL)

### Step 1: Install Dependencies

```bash
cd /path/to/cs48000_assignments
pip install -r requirements.txt
```

### Step 2: Set Up PostgreSQL Database

```bash
# Start PostgreSQL service
# Windows:
net start postgresql-13

# macOS (Homebrew):
brew services start postgresql

# Linux:
sudo systemctl start postgresql
```

### Step 3: Create Database and Load Schema

```bash
# Login to PostgreSQL
psql -U postgres

# Create the database
CREATE DATABASE operations_db;

# Exit psql
\q

# Load the schema into the new database
psql -U postgres -d operations_db -f db/schema.sql

# Verify tables were created
psql -U postgres -d operations_db -c "\dt"
```

**Expected output:**
```
                       List of relations
 Schema |            Name            | Type  | Owner
--------+----------------------------+-------+----------
 public | data_source_metadatas      | table | postgres
 public | lots                       | table | postgres
 public | production_records         | table | postgres
 public | quality_inspection_records | table | postgres
 public | shipping_records           | table | postgres
 public | data_integrity_flags       | table | postgres
```

### Step 4: Configure Environment Variables

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

### Step 5: Load Seed Data (Optional - for testing)

```bash
# Load sample data from seed.sql
psql -U postgres -d operations_db -f db/seed.sql

# Verify data loaded
psql -U postgres -d operations_db -c "SELECT COUNT(*) FROM lots;"
```

### Step 6: Set Up Data Source Directories

Create the following directory structure for data ingestion:
```
data/sources/
├── production_logs/
│   └── production_data.csv
├── quality_logs/
│   └── quality_data.xlsx
└── shipping_logs/
    └── shipping_data.xlsx
```

**Data File Format Requirements** (per AC2: Data Normalization):
- **Production Logs:** CSV with columns: Lot ID, Production Line, Units Planned, Units Actual, Shift, Production Date, Source Timestamp
- **Quality Logs:** XLSX with columns: Lot ID, Inspection Date, Inspection Result (Pass/Fail), Defect Type, Defect Count, Inspector ID
- **Shipping Logs:** XLSX with columns: Lot ID, Ship Date, Destination State, Carrier, Quantity Shipped, Shipment Status

### Step 7: Start the Application

```bash
streamlit run app.py        # Development (with auto-reload)
```

**Expected output:**
```
  You can now view your Streamlit app in your browser.

  Local URL: http://localhost:8501
  Network URL: http://192.168.x.x:8501

✓ Database connected to localhost:5432/operations_db
✓ Data source metadata initialized
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

### Unit Test Setup

```bash
# Ensure test dependencies are installed (pytest, pytest-cov)
pip install pytest pytest-cov

# Run all unit tests
pytest tests/

# Run tests in watch mode (for development)
ptw  # requires pytest-watch: pip install pytest-watch

# Generate coverage report
pytest tests/ --cov=src --cov-report=html

# Run specific test suite
pytest tests/services/test_data_ingestion.py
```

### Test Coverage by Acceptance Criteria

Unit tests should be organized by feature and data layer:

**AC1: Automated Multi-Source Ingestion**
- Data Ingestion Service (CSV/XLSX parsing)
  - `should parse production CSV file correctly`
  - `should parse quality XLSX file correctly`
  - `should parse shipping XLSX file correctly`
  - `should insert production record into database`
  - `should insert quality inspection record into database`
  - `should insert shipping record into database`
- File Source Handler
  - `should read CSV from specified directory`
  - `should read XLSX from specified directory`
  - `should handle missing files gracefully`

**AC2: Data Normalization & Relational Mapping**
- Data Cleansing Service
  - `should trim whitespace from Lot IDs`
  - `should remove leading zeros from batch numbers`
  - `should standardize dates to YYYY-MM-DD format`
  - `should handle mixed date formats in source files`
- Relational Mapping Service
  - `should join production + quality by (Lot ID, Production Date)`
  - `should flag missing quality records as "Pending Inspection"`
  - `should preserve production records even without quality data`
- Data Validation
  - `should create composite key (Lot ID + Date) correctly`
  - `should prevent duplicate lot entries`

**AC3: Integrated Problem Reporting**
- Reporting Service
  - `AC3.1: should calculate production health by line per week`
  - `AC3.1: should identify highest error rate production lines`
  - `AC3.2: should aggregate defect types by month`
  - `AC3.2: should support defect trending visualization`
  - `AC3.3: should search lot by code and return integrated status`
  - `AC3.3: should return current operational status (In Production/Failed Quality/Shipped/Pending)`

**AC4: Automated Validation & Exception Handling**
- Validation Rules Engine
  - `AC4: should create "Pending Inspection" flag when quality record missing`
  - `AC4: should create "Orphaned Shipment" flag when shipping exists without quality`
  - `AC4: should create "Date Logic Error" flag when ship_date < production_date`
  - `AC4: should not create duplicate flags for same lot and rule`
- Source Health Monitor
  - `AC4: should track last_updated_timestamp for each data source`
  - `AC4: should mark source as "Stale" if not updated in 24 hours`
  - `AC4: should mark source as "Healthy" or "Error" based on sync status`

**Database Layer (Unit Tests)**
- Models/DAOs
  - `should create Lot record with composite key`
  - `should retrieve Lot by lot_code and production_date`
  - `should create ProductionRecord with foreign key to Lot`
  - `should create QualityInspectionRecord with optional relationship`
  - `should create ShippingRecord with 1:1 relationship to Lot`
  - `should create DataIntegrityFlag with reference to Lot`

### Running Tests Before Deployment

```bash
# Run full test suite with coverage
pytest tests/ --cov=src --cov-report=term-missing

# Verify coverage threshold (80%)
pytest tests/ --cov=src --cov-fail-under=80
```

**Expected execution time:** ~60-120 seconds for full suite

---

## Files & Environment Variables to Update

### Required Configuration Files

#### 1. `.env` - Database Connection & Data Ingestion Paths

```bash
# PostgreSQL Database Configuration (AC1, AC2)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=operations_db
DB_USER=postgres
DB_PASSWORD=your_secure_password_here

# Data Source Directories (AC1: Automated Multi-Source Ingestion)
PRODUCTION_LOGS_PATH=/path/to/data/sources/production_logs
QUALITY_LOGS_PATH=/path/to/data/sources/quality_logs
SHIPPING_LOGS_PATH=/path/to/data/sources/shipping_logs

# Application Settings
NODE_ENV=development
PORT=3000

# Data Refresh Configuration (AC1: Scheduled Trigger)
AUTO_REFRESH_INTERVAL=86400000  # 24 hours in milliseconds
DATA_REFRESH_TIME=02:00         # UTC time for daily refresh

# (Optional) Logging & Monitoring
LOG_LEVEL=info
```

#### 2. `db/schema.sql` - Database Schema

**Key tables created by this script:**

| Table | Purpose | AC Requirement |
|-------|---------|----------------|
| `data_source_metadatas` | Tracks source health and refresh status | AC4 |
| `lots` | Core conformed entity (Lot ID + Production Date composite key) | AC2 |
| `production_records` | Production data from CSV logs | AC1, AC3.1 |
| `quality_inspection_records` | Quality data from XLSX logs | AC1, AC3.2 |
| `shipping_records` | Shipping data from XLSX logs | AC1, AC3.3 |
| `data_integrity_flags` | Validation issues and exceptions | AC4 |

**Indexes created:**
- `idx_lots_lot_code` - Supports AC3.3 (Lot search)
- `idx_production_records_date` - Supports AC3.1 (Weekly trends)
- `idx_quality_inspections_date` - Supports AC3.2 (Defect trending)
- `idx_production_lot_id`, `idx_quality_lot_id` - Supports joins

#### 3. `db/seed.sql` - Sample Data (Testing & Development Only)

Contains:
- 100+ sample lot records with various date formats and Lot ID variations
- Production, quality, and shipping records
- Data source metadata entries
- Examples of data quality issues for testing AC4 validation rules

**Load with:**
```bash
psql -U postgres -d operations_db -f db/seed.sql
```

#### 4. `requirements.txt` - Python Dependencies

```
streamlit==1.28.0
psycopg2-binary==2.9.9
sqlalchemy==2.0.23
pandas==2.1.3
numpy==1.24.3
openpyxl==3.1.2
pytest==7.4.3
pytest-cov==4.1.0
```

Update with your contact info in:
`pyproject.toml` or at the top of `app.py`:
```python
"""
Operations Data Consolidation System
Author: Your Name <your.email@company.com>
Version: 1.0.0
"""
```

#### 5. Data Source Directory Structure

```
data/sources/
├── production_logs/
│   └── production_data.csv
│       Columns: Lot_ID, Production_Line, Units_Planned, Units_Actual, 
│                Shift, Production_Date, Source_Updated_Timestamp
│
├── quality_logs/
│   └── quality_data.xlsx
│       Columns: Lot_ID, Inspection_Date, Inspection_Result (Pass/Fail),
│                Defect_Type, Defect_Count, Inspector_ID, Source_Updated_Timestamp
│
└── shipping_logs/
    └── shipping_data.xlsx
        Columns: Lot_ID, Ship_Date, Destination_State, Carrier,
                 Qty_Shipped, Shipment_Status, Source_Updated_Timestamp
```

### Optional Configuration

- `CLEANUP_STALE_FLAGS_DAYS` - Auto-clean resolved flags older than N days (default 30)
- `LOG_LEVEL` - Set to "debug" for detailed logging (default "info")
- `VALIDATION_RULES_ENABLED` - Enable/disable AC4 validation rules (default true)
- `DB_POOL_SIZE` - Connection pool size for concurrent queries (default 10)

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

| Issue | Diagnosis | Solution |
|-------|-----------|----------|
| **PostgreSQL connection refused** | Check if service is running | `sudo systemctl start postgresql` (Linux) or `net start postgresql-13` (Windows) |
| **Database "operations_db" does not exist** | Schema not loaded | Run `psql -U postgres -d operations_db -f db/schema.sql` |
| **Tables not found in database** | schema.sql failed to execute | Verify PostgreSQL user has permissions: `GRANT ALL PRIVILEGES ON DATABASE operations_db TO postgres;` |
| **Port 3000 already in use** | Another service on port 3000 | Windows: `netstat -ano \| findstr :3000` then `taskkill /PID <PID> /F`. Linux/Mac: `lsof -i :3000 \| kill -9 <PID>` |
| **No data files found** | Data source directories missing | Create: `mkdir -p data/sources/{production_logs,quality_logs,shipping_logs}` and add CSV/XLSX files |
| **Data ingestion skipped (AC1)** | File format not recognized | Verify CSV/XLSX headers match schema. Check `data_source_metadatas.refresh_status` in database |
| **"Pending Inspection" flags not created (AC2)** | Validation rules not triggered | Ensure quality records are missing for some lots. Check `data_integrity_flags` table |
| **Tests failing** | Dependencies not installed | Run `pip install -r requirements.txt && pytest tests/` |
| **Environment variables not loading** | .env file location or syntax | Verify `.env` in project root (not in `src/`). Check for extra spaces or missing `=` |
| **Date normalization not working (AC2)** | Date format in source files unrecognized | Ensure dates are in YYYY-MM-DD, MM/DD/YYYY, or YYYY-MM-DD HH:MM:SS format |
| **Defect trending returns no data (AC3.2)** | No quality records with defect_count > 0 | Load seed data: `psql -U postgres -d operations_db -f db/seed.sql` |
| **"Date Conflict" flags not detected (AC4)** | Ship Date >= Production Date for all records | Insert test record: `psql -U postgres -d operations_db -c "INSERT INTO shipping_records..."` with past ship_date |
| **Source health shows "Stale" (AC4)** | Metadata not updated in 24+ hours | Check `data_source_metadatas.last_updated_timestamp`. Run manual ingest: `POST /api/ingest` |

---

##Deployment Checklist

### Pre-Deployment (Development Environment)
- [ ] All unit tests passing: `pytest tests/ --cov=src --cov-fail-under=80`
- [ ] No security warnings: `bandit -r src/` (install with: pip install bandit)
- [ ] Database schema validated locally: `psql -U postgres -d operations_db -c "\dt"`
- [ ] Sample data ingestion tested: `pytest tests/integration/`
- [ ] All AC requirements verified:
  - [ ] AC1: Data ingestion from all 3 sources
  - [ ] AC2: Data normalization tested (whitespace, leading zeros, date formats)
  - [ ] AC3: All 3 reporting queries tested
  - [ ] AC4: Validation rules working (pending inspection, orphaned shipment, date conflicts)

### Database Setup (Production)
- [ ] PostgreSQL 13+ installed on production server
- [ ] Create production database: `CREATE DATABASE operations_db_prod;`
- [ ] Load schema: `psql -U postgres -d operations_db_prod -f db/schema.sql`
- [ ] Configure backups: `pg_dump` scheduled daily
- [ ] Test read/write permissions
- [ ] Document database connection string (keep secure)

### Application Deployment
- [ ] Update `.env` with production credentials:
  ```bash
  DB_HOST=prod-db-server
  DB_PORT=5432
  DB_NAME=operations_db_prod
  DB_USER=ops_readonly  # Use read-only user if possible
  DB_PASSWORD=SECURE_PASSWORD
  NODE_ENV=production
  AUTO_REFRESH_INTERVAL=86400000
  ```
- [ ] Install production dependencies: `pip install -r requirements.txt`
- [ ] Verify Streamlit package installed: `streamlit --version`
- [ ] Test production database connection: `python scripts/test_db_connection.py`

### Data & Configuration
- [ ] Create production data source directories:
  ```bash
  /mnt/sharepoint/production_logs/
  /mnt/sharepoint/quality_logs/
  /mnt/sharepoint/shipping_logs/
  ```
- [ ] Copy production data files to directories
- [ ] Run initial data ingest: `POST /api/ingest`
- [ ] Verify data quality: Check `data_integrity_flags` table
- [ ] Document source file locations and refresh schedule

### Monitoring & Validation
- [ ] Verify source health dashboard: `GET /api/integrity/source-health`
  - All sources should have `refresh_status = 'Healthy'`
- [ ] Test AC3 reporting endpoints:
  - Production Health: `GET /api/reports/production-health`
  - Defect Trending: `GET /api/reports/defect-trending`
  - Lot Search: `GET /api/search/lot/{lot_code}`
- [ ] Monitor AC4 data integrity: `GET /api/integrity/flags`
  - Expected flags: Pending Inspection, Orphaned Shipment, Date Conflict
- [ ] Set up automated monitoring for source staleness (alerts if not updated in 24h)
- [ ] Document expected daily refresh time and rollback procedure

### Post-Deployment (First Week)
- [ ] Monitor application logs for errors
- [ ] Verify daily auto-refresh is running
- [ ] Confirm no performance degradation (query response time)
- [ ] Review user feedback and adjust dashboards if needed
- [ ] Document any data quality issues found and resolution process

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
