-- PostgreSQL DDL for Operations Monitoring System
-- Optimized for Performance, Normalization, and Integrity

BEGIN;

-- 1. DATA SOURCE METADATA (AC 4: Status Dashboard)
CREATE TABLE data_source_metadatas (
    id SERIAL PRIMARY KEY,
    source_name VARCHAR(100) NOT NULL UNIQUE, -- Production Logs, Quality Logs, etc.
    source_location TEXT NOT NULL,
    file_format VARCHAR(10) NOT NULL,
    last_updated_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    refresh_status VARCHAR(20) NOT NULL DEFAULT 'Healthy',
    CONSTRAINT ck_metadata_status CHECK (refresh_status IN ('Healthy', 'Stale', 'Error'))
);

-- 2. CORE CONFORMED ENTITIES: LOTS (AC 2)
CREATE TABLE lots (
    id SERIAL PRIMARY KEY,
    lot_code VARCHAR(50) NOT NULL,         -- The business Lot ID (cleansed)
    production_date DATE NOT NULL,
    is_pending_inspection BOOLEAN NOT NULL DEFAULT TRUE,
    has_data_integrity_issue BOOLEAN NOT NULL DEFAULT FALSE,
    has_date_conflict BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- Business logic uniqueness constraint
    UNIQUE (lot_code, production_date)
);

-- 3. PRODUCTION RECORDS (AC 3.1)
CREATE TABLE production_records (
    id SERIAL PRIMARY KEY,
    lot_id INTEGER NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
    production_line_id VARCHAR(20) NOT NULL,
    shift VARCHAR(20) NOT NULL,
    units_planned INTEGER NOT NULL,
    units_actual INTEGER NOT NULL,
    downtime_minutes INTEGER NOT NULL DEFAULT 0,
    has_line_issue BOOLEAN NOT NULL DEFAULT FALSE,
    source_updated_timestamp TIMESTAMP NOT NULL,
    -- Validations
    CONSTRAINT ck_production_units CHECK (units_planned >= 0 AND units_actual >= 0),
    CONSTRAINT ck_production_downtime CHECK (downtime_minutes >= 0)
);

-- 4. QUALITY INSPECTION RECORDS (AC 3.2)
CREATE TABLE quality_inspection_records (
    id SERIAL PRIMARY KEY,
    lot_id INTEGER NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
    inspection_date DATE NOT NULL,
    is_pass BOOLEAN NOT NULL DEFAULT FALSE, -- Using Boolean as requested
    defect_type VARCHAR(50),                -- Cosmetic, Functional, etc.
    defect_count INTEGER NOT NULL DEFAULT 0,
    inspector_id VARCHAR(50) NOT NULL,
    source_updated_timestamp TIMESTAMP NOT NULL,
    -- Validations
    CONSTRAINT ck_defect_count CHECK (defect_count >= 0)
);

-- 5. SHIPPING RECORDS (AC 4)
CREATE TABLE shipping_records (
    id SERIAL PRIMARY KEY,
    lot_id INTEGER NOT NULL UNIQUE REFERENCES lots(id) ON DELETE CASCADE, -- 1:1 Lot to Shipment
    ship_date DATE NOT NULL,
    destination_state CHAR(2) NOT NULL,
    carrier VARCHAR(50) NOT NULL,
    qty_shipped INTEGER NOT NULL,
    shipment_status VARCHAR(20) NOT NULL,
    source_updated_timestamp TIMESTAMP NOT NULL,
    -- Validations
    CONSTRAINT ck_ship_qty CHECK (qty_shipped >= 0)
);

-- 6. DATA INTEGRITY FLAGS (AC 4)
CREATE TABLE data_integrity_flags (
    id SERIAL PRIMARY KEY,
    lot_id INTEGER NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
    flag_type VARCHAR(50) NOT NULL, -- Missing Quality, Date Conflict, etc.
    severity VARCHAR(20) NOT NULL,
    description TEXT NOT NULL,
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    detected_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_severity CHECK (severity IN ('Warning', 'Error', 'Critical'))
);

-- 7. PERFORMANCE INDEXES (Support for AC 3 Search & Trends)
-- Supports Lot ID Search function
CREATE INDEX idx_lots_lot_code ON lots(lot_code);
-- Supports Weekly/Monthly Production Health Trends
CREATE INDEX idx_production_records_date ON lots(production_date);
-- Supports Defect Trending
CREATE INDEX idx_quality_inspections_date ON quality_inspection_records(inspection_date);
-- Supports Foreign Key Joins
CREATE INDEX idx_production_lot_id ON production_records(lot_id);
CREATE INDEX idx_quality_lot_id ON quality_inspection_records(lot_id);

-- 8. ANALYTICAL VIEW (Consolidated Search View)
CREATE OR REPLACE VIEW integrated_lot_view AS
SELECT 
    l.lot_code,
    l.production_date,
    p.production_line_id,
    p.units_actual,
    q.is_pass AS quality_pass_flag,
    q.defect_type,
    s.shipment_status,
    s.ship_date,
    l.is_pending_inspection,
    l.has_data_integrity_issue
FROM lots l
LEFT JOIN production_records p ON l.id = p.lot_id
LEFT JOIN quality_inspection_records q ON l.id = q.lot_id
LEFT JOIN shipping_records s ON l.id = s.lot_id;

COMMIT;
