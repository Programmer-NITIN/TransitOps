-- ============================================
-- TransitOps Database Schema
-- PostgreSQL DDL with ENUMs, Constraints, 
-- Triggers, and Indexes
-- ============================================

-- Clean slate
DROP TRIGGER IF EXISTS trg_users_updated ON users;
DROP TRIGGER IF EXISTS trg_vehicles_updated ON vehicles;
DROP TRIGGER IF EXISTS trg_drivers_updated ON drivers;
DROP TRIGGER IF EXISTS trg_trips_updated ON trips;
DROP FUNCTION IF EXISTS update_timestamp();

DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS fuel_logs CASCADE;
DROP TABLE IF EXISTS maintenance_logs CASCADE;
DROP TABLE IF EXISTS trips CASCADE;
DROP TABLE IF EXISTS drivers CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

DROP TYPE IF EXISTS vehicle_status CASCADE;
DROP TYPE IF EXISTS driver_status CASCADE;
DROP TYPE IF EXISTS trip_status CASCADE;
DROP TYPE IF EXISTS maintenance_status CASCADE;

-- ============================================
-- CUSTOM ENUM TYPES (Type-safe status columns)
-- ============================================

CREATE TYPE vehicle_status AS ENUM ('Available', 'On Trip', 'In Shop', 'Retired');
CREATE TYPE driver_status AS ENUM ('Available', 'On Trip', 'Off Duty', 'Suspended');
CREATE TYPE trip_status AS ENUM ('Draft', 'Dispatched', 'Completed', 'Cancelled');
CREATE TYPE maintenance_status AS ENUM ('Open', 'Closed');

-- ============================================
-- ROLES TABLE
-- ============================================

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USERS TABLE
-- ============================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- VEHICLES TABLE
-- ============================================

CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_number VARCHAR(20) UNIQUE NOT NULL,
    name_model VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('Truck', 'Van', 'Trailer', 'Tanker', 'Pickup', 'Bus')),
    max_load_capacity_kg DECIMAL(10,2) NOT NULL CHECK (max_load_capacity_kg > 0),
    current_odometer_km DECIMAL(12,2) DEFAULT 0 CHECK (current_odometer_km >= 0),
    acquisition_cost DECIMAL(12,2) NOT NULL CHECK (acquisition_cost > 0),
    status vehicle_status DEFAULT 'Available',
    region VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DRIVERS TABLE
-- ============================================

CREATE TABLE drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    license_number VARCHAR(50) UNIQUE NOT NULL,
    license_category VARCHAR(20) NOT NULL CHECK (license_category IN ('A', 'B', 'C', 'D', 'E', 'CE', 'DE')),
    license_expiry DATE NOT NULL,
    contact_number VARCHAR(20) NOT NULL,
    safety_score DECIMAL(4,1) DEFAULT 5.0 CHECK (safety_score >= 0 AND safety_score <= 10),
    status driver_status DEFAULT 'Available',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TRIPS TABLE
-- ============================================

CREATE TABLE trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE RESTRICT,
    source VARCHAR(200) NOT NULL,
    destination VARCHAR(200) NOT NULL,
    cargo_weight_kg DECIMAL(10,2) NOT NULL CHECK (cargo_weight_kg > 0),
    planned_distance_km DECIMAL(10,2) NOT NULL CHECK (planned_distance_km > 0),
    actual_distance_km DECIMAL(10,2),
    fuel_consumed_liters DECIMAL(10,2),
    final_odometer_km DECIMAL(12,2),
    revenue DECIMAL(12,2) DEFAULT 0 CHECK (revenue >= 0),
    status trip_status DEFAULT 'Draft',
    dispatched_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MAINTENANCE LOGS TABLE
-- ============================================

CREATE TABLE maintenance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
    service_type VARCHAR(100) NOT NULL,
    description TEXT,
    cost DECIMAL(10,2) NOT NULL CHECK (cost >= 0),
    priority VARCHAR(20) DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
    status maintenance_status DEFAULT 'Open',
    start_date TIMESTAMPTZ DEFAULT NOW(),
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FUEL LOGS TABLE
-- ============================================

CREATE TABLE fuel_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
    liters DECIMAL(10,2) NOT NULL CHECK (liters > 0),
    cost DECIMAL(10,2) NOT NULL CHECK (cost >= 0),
    odometer_at_fill DECIMAL(12,2),
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- EXPENSES TABLE
-- ============================================

CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
    trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('Fuel', 'Toll', 'Maintenance', 'Insurance', 'Parking', 'Fine', 'Other')),
    description TEXT,
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES (Performance optimization)
-- ============================================

-- User lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role_id);

-- Vehicle queries
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_type ON vehicles(type);
CREATE INDEX idx_vehicles_region ON vehicles(region);
CREATE INDEX idx_vehicles_reg_number ON vehicles(registration_number);

-- Driver queries
CREATE INDEX idx_drivers_status ON drivers(status);
CREATE INDEX idx_drivers_license_expiry ON drivers(license_expiry);
CREATE INDEX idx_drivers_license_number ON drivers(license_number);

-- Trip queries
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_trips_vehicle ON trips(vehicle_id);
CREATE INDEX idx_trips_driver ON trips(driver_id);
CREATE INDEX idx_trips_dates ON trips(created_at);

-- Maintenance queries
CREATE INDEX idx_maintenance_vehicle ON maintenance_logs(vehicle_id);
CREATE INDEX idx_maintenance_status ON maintenance_logs(status);

-- Fuel log queries
CREATE INDEX idx_fuel_vehicle ON fuel_logs(vehicle_id);
CREATE INDEX idx_fuel_trip ON fuel_logs(trip_id);
CREATE INDEX idx_fuel_date ON fuel_logs(log_date);

-- Expense queries
CREATE INDEX idx_expenses_vehicle ON expenses(vehicle_id);
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_expenses_date ON expenses(expense_date);

-- ============================================
-- TRIGGER: Auto-update updated_at timestamp
-- ============================================

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_vehicles_updated
    BEFORE UPDATE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_drivers_updated
    BEFORE UPDATE ON drivers
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_trips_updated
    BEFORE UPDATE ON trips
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();
