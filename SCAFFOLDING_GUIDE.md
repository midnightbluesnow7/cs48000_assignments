"""Scaffolding Overview - SteelWorks Operations Data Hub."""

# Project Scaffolding Architecture

## Overview
This document provides a guide to the generated scaffolding for the SteelWorks Operations Data Hub project. The scaffolding follows a layered architecture as defined in ADR 001, with classes and function stubs ready for implementation.

---

## Project Structure

```
src/
├── models/                          # Domain models
│   ├── lot.py                       # Lot (composite key entity)
│   ├── production_record.py         # Production Record
│   ├── quality_record.py            # Quality Inspection Record
│   ├── shipping_record.py           # Shipping Record
│   ├── data_source.py               # Data Source Metadata
│   └── data_integrity_flag.py       # Data Integrity Flag
├── data_access/                     # Data Access Layer (AC 2: pulls from designated directories)
│   ├── base.py                      # Abstract BaseDataAccess class
│   ├── file_ingestion_adapter.py   # AC 1: Loads XLSX/CSV files
│   ├── production_data_access.py   # AC 3.1: Production data queries
│   ├── quality_data_access.py      # AC 3.2: Quality data queries
│   ├── shipping_data_access.py     # AC 3.3: Shipping search function
│   ├── data_source_metadata_access.py  # AC 4: Source Health indicators
│   └── data_integrity_access.py    # AC 4: Data Integrity Flags
├── services/                        # Business Logic Layer
│   ├── data_normalization_service.py     # AC 2: Cleansing Logic
│   ├── data_integration_service.py       # AC 2: Composite key joins
│   ├── conflict_resolution_service.py    # AC 2: Handle missing records
│   ├── validation_service.py             # AC 4: Outlier detection
│   └── integrated_view_service.py        # AC 3: Reports & Search
└── presentation/                    # Presentation Layer (Streamlit)
    ├── dashboard.py                 # Main Streamlit app
    └── widgets.py                   # Reusable UI components

tests/
├── unit/
│   ├── services/                    # Service unit tests
│   │   ├── test_data_normalization_service.py
│   │   ├── test_data_integration_service.py
│   │   ├── test_conflict_resolution_service.py
│   │   ├── test_validation_service.py
│   │   └── test_integrated_view_service.py
│   └── data_access/                 # Data Access unit tests
│       ├── test_file_ingestion_adapter.py
│       ├── test_production_data_access.py
│       ├── test_quality_data_access.py
│       ├── test_shipping_data_access.py
│       ├── test_data_source_metadata_access.py
│       └── test_data_integrity_access.py

config.py                           # Configuration management
main.py                            # Application entry point
requirements.txt                   # Python dependencies
```

---

## Acceptance Criteria Mapping

### AC 1: Automated Multi-Source Ingestion
**Classes & Methods:**
- `FileIngestionAdapter`: Loads data from XLSX/CSV files
  - `read_production_logs()` - Read production data
  - `read_quality_logs()` - Read quality inspection data
  - `read_shipping_logs()` - Read shipping data
  - `_read_xlsx_file()` - Parse XLSX files
  - `_read_csv_file()` - Parse CSV files

**Frequency Implementation:**
- `Dashboard.handle_page_load()` - Refresh on view open
- `config.py` - Configure scheduled refresh with `REFRESH_INTERVAL_HOURS`

---

### AC 2: Data Normalization & Relational Mapping
**Classes & Methods:**

**Normalization:**
- `DataNormalizationService`:
  - `normalize_production_data()` - Trim whitespace, remove leading zeros, standardize dates
  - `normalize_quality_data()` - Same cleansing operations
  - `normalize_shipping_data()` - Same cleansing operations
  - `_standardize_date()` - Convert to YYYY-MM-DD format
  - `_standardize_lot_id()` - Normalize lot IDs

**Relational Mapping (Composite Key):**
- `DataIntegrationService`:
  - `integrate_all_sources()` - Join using (lot_code, production_date)
  - `get_composite_key()` - Generate composite key
  - `join_production_quality()` - Join on composite key
  - `join_with_shipping()` - Add shipping to joined data

**Conflict Resolution:**
- `ConflictResolutionService`:
  - `resolve_missing_quality_records()` - Flag as "Pending Inspection"
  - `create_pending_inspection_flag()` - Mark lot as pending
  - `resolve_missing_shipping_records()` - Flag integrity issues

---

### AC 3: Integrated Problem Reporting

**Production Health (3.1):**
- `IntegratedViewService.get_production_health_by_line_per_week()`
  - Identifies lines with highest error rates per week
- `ProductionDataAccess.get_error_count_by_line_per_week()`
- Widget: `ProductionHealthWidget.render_error_rate_by_line()`

**Defect Trending (3.2):**
- `IntegratedViewService.get_defect_trending()`
  - Visual breakdown of Cosmetic vs Functional defects over time
- `QualityDataAccess.get_defect_trend_by_type()`
- Widget: `DefectTrendingWidget.render_defect_by_type()`

**Shipment Search (3.3):**
- `IntegratedViewService.search_lot_status()`
  - Lot ID search returns status: In Production, Failed Quality, Shipped
- `ShippingDataAccess.search_by_lot_id()`
- Widget: `ShipmentSearchWidget.render_search_box()` and `render_lot_status_result()`

---

### AC 4: Automated Validation & Exception Handling

**Data Integrity Flags:**
- `ValidationService.detect_all_outliers()` - Detect data quality issues
- `ValidationService.detect_date_conflicts()` - Flag ship_date < production_date
- `DataIntegrityAccess.create_missing_quality_flag()` - Lot in Shipping, missing from Quality
- Widget: `DataIntegrityWidget.render_integrity_summary()`

**Source Health Dashboard:**
- `DataSourceMetadataAccess.get_source_health_dashboard()` - Last Updated timestamps
- Widget: `SourceHealthWidget.render_source_health_dashboard()`
- Displays all three sources: Production Logs, Quality Inspection, Shipping Logs

**Data Models:**
- `DataSource` - Source metadata with refresh_status (Healthy/Stale/Error)
- `DataIntegrityFlag` - Issues with severity (Warning/Error/Critical)

---

## Layer Responsibilities

### Domain Models Layer (`models/`)
- Pure data classes with minimal logic
- Represent entities from the database schema
- Example: `Lot` with composite key (lot_code, production_date)

### Data Access Layer (`data_access/`)
- Abstract: `BaseDataAccess` with CRUD operations
- File I/O: `FileIngestionAdapter` for XLSX/CSV reading
- Query operations: `ProductionDataAccess`, `QualityDataAccess`, `ShippingDataAccess`
- Metadata: `DataSourceMetadataAccess` for source health tracking
- Validation: `DataIntegrityAccess` for flag management

### Service Layer (`services/`)
- **DataNormalizationService**: Data cleansing (AC 2)
- **DataIntegrationService**: Composite key joins (AC 2)
- **ConflictResolutionService**: Handle missing records (AC 2)
- **ValidationService**: Detect outliers (AC 4)
- **IntegratedViewService**: Build reports (AC 3)

### Presentation Layer (`presentation/`)
- **Dashboard**: Main Streamlit application
- **Widgets**: Reusable UI components
- Pages:
  - Production Health (AC 3.1)
  - Defect Trending (AC 3.2)
  - Shipment Search (AC 3.3)
  - Source Health (AC 4)
  - Data Integrity Issues (AC 4)

---

## Testing Strategy

### Unit Test Coverage
- **Services**: 60+ test stubs covering normalization, integration, validation
- **Data Access**: 40+ test stubs covering CRUD operations and queries
- **No Integration Tests**: Per requirements, only unit test stubs included

### Running Tests
```bash
pytest tests/unit/services/
pytest tests/unit/data_access/
pytest tests/unit/ --cov=src/
```

---

## Implementation Steps (Next Phase)

1. **Implement Domain Models**
   - Add validation logic and helper methods
   - Example: `Lot.get_composite_key()` returns (lot_code, production_date)

2. **Implement Data Access Layer**
   - Connect to PostgreSQL database using SQLAlchemy
   - Implement file readers for XLSX/CSV
   - Implement all CRUD and query methods

3. **Implement Service Layer**
   - Data normalization logic (regex for date/number standardization)
   - Join logic using composite keys
   - Conflict resolution (flag missing records)
   - Validation (detect date conflicts and missing fields)

4. **Implement Presentation Layer**
   - Create Streamlit pages for each requirement (AC 3, AC 4)
   - Add widgets for charts and tables
   - Implement search functionality

5. **Write Unit Tests**
   - Fill in test implementations
   - Achieve >80% code coverage

---

## Configuration

Key environment variables in `config.py`:

```python
DATABASE_URL              # PostgreSQL connection string
PRODUCTION_LOG_PATH       # Path to production CSV/XLSX files
QUALITY_LOG_PATH         # Path to quality XLSX/CSV files
SHIPPING_LOG_PATH        # Path to shipping XLSX files
AUTO_REFRESH_ENABLED     # Enable automatic data refresh (True/False)
REFRESH_INTERVAL_HOURS   # Interval for scheduled refresh (24 hours default)
STALE_DATA_THRESHOLD_HOURS  # Mark source stale if not updated within this time
```

---

## Key Design Decisions

1. **Composite Key (lot_code, production_date)** 
   - Ensures Data Normalization (AC 2) joins on consistent keys
   - All three data sources must be normalized before joining

2. **Single Database**
   - Enables efficient SQL joins (per ADR 001)
   - Supports "Pending Inspection" flags for missing quality records

3. **Layered Architecture**
   - Data Access isolated from Business Logic
   - Easy to mock for unit testing
   - Maintainable if file formats change

4. **Streamlit for UI**
   - Rapid prototyping (per ADR 001)
   - Python-native for data processing
   - Built-in support for charts and tables

---

## Notes for Implementation

- All method stubs have docstrings with expected behavior
- Test stubs follow test naming convention: `test_<method>_<condition>`
- Use type hints throughout implementation
- Handle timezone awareness for datetime comparisons
- Implement proper error handling for file I/O and database operations
- Add logging for audit trail of data ingestion and validation
