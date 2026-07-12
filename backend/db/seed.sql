-- ============================================
-- TransitOps Seed Data
-- Realistic Indian logistics data
-- ============================================

-- ROLES (4 roles as per problem statement)
INSERT INTO roles (name, description) VALUES
    ('Fleet Manager', 'Oversees fleet assets, maintenance, vehicle lifecycle, and operational efficiency'),
    ('Driver', 'Creates trips, assigns vehicles and drivers, monitors active deliveries'),
    ('Safety Officer', 'Ensures driver compliance, tracks license validity, monitors safety scores'),
    ('Financial Analyst', 'Reviews operational expenses, fuel consumption, maintenance costs, and profitability');

-- USERS (one per role, password: "TransitOps@123" hashed with bcrypt)
-- Hash: $2b$10$0WeLNA3FdmglGAf3ti2Sl.gJTrkoBAjg1PZCARRLxxoHcRt0f/hNi
INSERT INTO users (email, password_hash, full_name, role_id) VALUES
    ('fleet@transitops.in', '$2b$10$0WeLNA3FdmglGAf3ti2Sl.gJTrkoBAjg1PZCARRLxxoHcRt0f/hNi', 'Rajesh Kumar', 1),
    ('driver@transitops.in', '$2b$10$0WeLNA3FdmglGAf3ti2Sl.gJTrkoBAjg1PZCARRLxxoHcRt0f/hNi', 'Priya Sharma', 2),
    ('safety@transitops.in', '$2b$10$0WeLNA3FdmglGAf3ti2Sl.gJTrkoBAjg1PZCARRLxxoHcRt0f/hNi', 'Amit Patel', 3),
    ('finance@transitops.in', '$2b$10$0WeLNA3FdmglGAf3ti2Sl.gJTrkoBAjg1PZCARRLxxoHcRt0f/hNi', 'Sneha Reddy', 4);

-- VEHICLES (8 vehicles across Indian regions)
INSERT INTO vehicles (registration_number, name_model, type, max_load_capacity_kg, current_odometer_km, acquisition_cost, status, region) VALUES
    ('MH-12-AB-1234', 'Tata Prima 4928.S', 'Truck', 28000.00, 145230.50, 2850000.00, 'Available', 'Maharashtra'),
    ('KA-01-CD-5678', 'Ashok Leyland Boss 1920HB', 'Truck', 19000.00, 98450.00, 2200000.00, 'On Trip', 'Karnataka'),
    ('DL-03-EF-9012', 'Mahindra Supro MaxiTruck', 'Van', 1000.00, 52340.00, 650000.00, 'Available', 'Delhi NCR'),
    ('GJ-06-GH-3456', 'Eicher Pro 6049', 'Truck', 24900.00, 178900.00, 3100000.00, 'In Shop', 'Gujarat'),
    ('TN-09-IJ-7890', 'BharatBenz 1617R', 'Truck', 16200.00, 67890.00, 1950000.00, 'Available', 'Tamil Nadu'),
    ('RJ-14-KL-2345', 'Tata Ultra T.16 S', 'Pickup', 7500.00, 34560.00, 1100000.00, 'Available', 'Rajasthan'),
    ('UP-32-MN-6789', 'Ashok Leyland Dost+', 'Van', 1500.00, 41230.00, 750000.00, 'Available', 'Uttar Pradesh'),
    ('AP-05-OP-1357', 'Volvo FMX 460', 'Trailer', 35000.00, 210450.00, 5500000.00, 'Retired', 'Andhra Pradesh');

-- DRIVERS (6 drivers with realistic Indian details)
INSERT INTO drivers (name, license_number, license_category, license_expiry, contact_number, safety_score, status) VALUES
    ('Vikram Singh', 'DL-0420110012345', 'CE', '2027-08-15', '+91-9876543210', 9.2, 'Available'),
    ('Arun Nair', 'KA-0520130067890', 'C', '2027-03-20', '+91-9123456789', 8.5, 'On Trip'),
    ('Manoj Tiwari', 'MH-0320140023456', 'CE', '2026-12-31', '+91-8765432109', 7.8, 'Available'),
    ('Deepak Yadav', 'UP-6520120045678', 'D', '2027-06-10', '+91-7654321098', 6.5, 'Off Duty'),
    ('Suresh Babu', 'TN-0920150089012', 'C', '2026-08-01', '+91-6543210987', 9.8, 'Available'),
    ('Ravi Verma', 'GJ-0620160034567', 'CE', '2025-01-15', '+91-5432109876', 4.2, 'Suspended');

-- TRIPS (Sample completed and active trips)
INSERT INTO trips (vehicle_id, driver_id, source, destination, cargo_weight_kg, planned_distance_km, actual_distance_km, fuel_consumed_liters, revenue, status, dispatched_at, completed_at)
SELECT 
    v.id, d.id,
    'Mumbai Warehouse, Bhiwandi', 'Pune Distribution Center, Hinjewadi',
    15000.00, 165.00, 172.00, 45.50, 28500.00,
    'Completed', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days'
FROM vehicles v, drivers d
WHERE v.registration_number = 'MH-12-AB-1234' AND d.name = 'Vikram Singh';

INSERT INTO trips (vehicle_id, driver_id, source, destination, cargo_weight_kg, planned_distance_km, actual_distance_km, fuel_consumed_liters, revenue, status, dispatched_at, completed_at)
SELECT 
    v.id, d.id,
    'Bangalore Tech Park, Whitefield', 'Chennai Port, Ennore',
    12000.00, 346.00, 358.00, 92.00, 42000.00,
    'Completed', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days'
FROM vehicles v, drivers d
WHERE v.registration_number = 'TN-09-IJ-7890' AND d.name = 'Suresh Babu';

-- Active trip (On Trip)
INSERT INTO trips (vehicle_id, driver_id, source, destination, cargo_weight_kg, planned_distance_km, revenue, status, dispatched_at)
SELECT 
    v.id, d.id,
    'Bangalore Electronic City', 'Hyderabad Shamshabad Cargo Hub',
    18500.00, 570.00, 55000.00,
    'Dispatched', NOW() - INTERVAL '6 hours'
FROM vehicles v, drivers d
WHERE v.registration_number = 'KA-01-CD-5678' AND d.name = 'Arun Nair';

-- Draft trip
INSERT INTO trips (vehicle_id, driver_id, source, destination, cargo_weight_kg, planned_distance_km, revenue, status)
SELECT 
    v.id, d.id,
    'Delhi ICD Tughlakabad', 'Jaipur Sanganer Industrial Area',
    800.00, 281.00, 15000.00,
    'Draft'
FROM vehicles v, drivers d
WHERE v.registration_number = 'DL-03-EF-9012' AND d.name = 'Manoj Tiwari';

-- MAINTENANCE LOGS
INSERT INTO maintenance_logs (vehicle_id, service_type, description, cost, priority, status, start_date)
SELECT v.id, 'Engine Overhaul', 'Complete engine overhaul after 175,000 km. Replacing turbocharger and fuel injectors.', 85000.00, 'High', 'Open', NOW() - INTERVAL '2 days'
FROM vehicles v WHERE v.registration_number = 'GJ-06-GH-3456';

INSERT INTO maintenance_logs (vehicle_id, service_type, description, cost, priority, status, start_date, end_date)
SELECT v.id, 'Oil Change & Filter', 'Routine oil change with synthetic 15W-40. Replaced oil filter and air filter.', 4500.00, 'Low', 'Closed', NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days'
FROM vehicles v WHERE v.registration_number = 'MH-12-AB-1234';

INSERT INTO maintenance_logs (vehicle_id, service_type, description, cost, priority, status, start_date, end_date)
SELECT v.id, 'Brake Pad Replacement', 'Front and rear brake pads replaced. Brake fluid topped up.', 12000.00, 'Medium', 'Closed', NOW() - INTERVAL '15 days', NOW() - INTERVAL '14 days'
FROM vehicles v WHERE v.registration_number = 'TN-09-IJ-7890';

-- FUEL LOGS (linked to completed trips)
INSERT INTO fuel_logs (vehicle_id, driver_id, trip_id, liters, cost, odometer_at_fill, log_date)
SELECT v.id, d.id, t.id, 45.50, 4550.00, 145230.50, CURRENT_DATE - INTERVAL '2 days'
FROM vehicles v, drivers d, trips t
WHERE v.registration_number = 'MH-12-AB-1234' AND d.name = 'Vikram Singh' AND t.source LIKE '%Mumbai%' AND t.status = 'Completed';

INSERT INTO fuel_logs (vehicle_id, driver_id, trip_id, liters, cost, odometer_at_fill, log_date)
SELECT v.id, d.id, t.id, 92.00, 9200.00, 67890.00, CURRENT_DATE - INTERVAL '4 days'
FROM vehicles v, drivers d, trips t
WHERE v.registration_number = 'TN-09-IJ-7890' AND d.name = 'Suresh Babu' AND t.source LIKE '%Bangalore Tech%' AND t.status = 'Completed';

INSERT INTO fuel_logs (vehicle_id, driver_id, liters, cost, odometer_at_fill, log_date)
SELECT v.id, d.id, 65.00, 6500.00, 98450.00, CURRENT_DATE - INTERVAL '1 day'
FROM vehicles v, drivers d
WHERE v.registration_number = 'KA-01-CD-5678' AND d.name = 'Arun Nair';

INSERT INTO fuel_logs (vehicle_id, liters, cost, odometer_at_fill, log_date)
SELECT v.id, 30.00, 3000.00, 34560.00, CURRENT_DATE - INTERVAL '7 days'
FROM vehicles v WHERE v.registration_number = 'RJ-14-KL-2345';

-- EXPENSES
INSERT INTO expenses (vehicle_id, trip_id, category, description, amount, expense_date)
SELECT v.id, t.id, 'Toll', 'Mumbai-Pune Expressway toll charges', 350.00, CURRENT_DATE - INTERVAL '2 days'
FROM vehicles v, trips t
WHERE v.registration_number = 'MH-12-AB-1234' AND t.source LIKE '%Mumbai%' AND t.status = 'Completed';

INSERT INTO expenses (vehicle_id, trip_id, category, description, amount, expense_date)
SELECT v.id, t.id, 'Toll', 'NH-48 Bangalore-Chennai toll plaza (4 stops)', 720.00, CURRENT_DATE - INTERVAL '4 days'
FROM vehicles v, trips t
WHERE v.registration_number = 'TN-09-IJ-7890' AND t.source LIKE '%Bangalore Tech%' AND t.status = 'Completed';

INSERT INTO expenses (vehicle_id, category, description, amount, expense_date)
SELECT v.id, 'Parking', 'Overnight parking at Nagpur transit hub', 500.00, CURRENT_DATE - INTERVAL '6 days'
FROM vehicles v WHERE v.registration_number = 'MH-12-AB-1234';

INSERT INTO expenses (vehicle_id, category, description, amount, expense_date)
SELECT v.id, 'Maintenance', 'Emergency tyre puncture repair on highway', 2500.00, CURRENT_DATE - INTERVAL '8 days'
FROM vehicles v WHERE v.registration_number = 'KA-01-CD-5678';

INSERT INTO expenses (vehicle_id, category, description, amount, expense_date)
SELECT v.id, 'Insurance', 'Quarterly comprehensive insurance premium', 45000.00, CURRENT_DATE - INTERVAL '20 days'
FROM vehicles v WHERE v.registration_number = 'MH-12-AB-1234';
