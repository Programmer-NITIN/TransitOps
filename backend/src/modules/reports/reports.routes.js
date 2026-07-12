const router = require('express').Router();
const authenticate = require('../../middleware/auth');
const { query } = require('../../config/db');

router.use(authenticate);

// ─── GET /api/reports/dashboard — Main dashboard KPIs (with filters) ───
router.get('/dashboard', async (req, res, next) => {
  try {
    const { type, status, region } = req.query;

    // Build vehicle filter clause
    let vFilter = '';
    const vParams = [];
    let vIdx = 1;
    if (type) { vFilter += ` AND v.type = $${vIdx++}`; vParams.push(type); }
    if (status) { vFilter += ` AND v.status = $${vIdx++}`; vParams.push(status); }
    if (region) { vFilter += ` AND v.region ILIKE $${vIdx++}`; vParams.push(`%${region}%`); }

    // Vehicle stats (filtered)
    const vehiclesQ = query(
      `SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE v.status = 'Available') as available,
       COUNT(*) FILTER (WHERE v.status = 'On Trip') as on_trip, COUNT(*) FILTER (WHERE v.status = 'In Shop') as in_shop
       FROM vehicles v WHERE 1=1 ${vFilter}`, vParams
    );

    // Build vehicle ID subquery for filtering trips/expenses
    const vehicleSubQ = `SELECT id FROM vehicles v WHERE 1=1 ${vFilter}`;

    // Driver stats (unfiltered — drivers are not per-vehicle)
    const driversQ = query(
      `SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'Available') as available,
       ROUND(AVG(safety_score),1) as avg_safety,
       COUNT(*) FILTER (WHERE license_expiry < CURRENT_DATE) as expired_licenses FROM drivers`
    );

    // Trip stats (filtered by vehicles matching the filter)
    const tripsQ = vFilter
      ? query(
          `SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE t.status = 'Completed') as completed,
           COUNT(*) FILTER (WHERE t.status = 'Dispatched') as active,
           COALESCE(SUM(CASE WHEN t.status='Completed' THEN t.actual_distance_km END),0) as total_km
           FROM trips t WHERE t.vehicle_id IN (${vehicleSubQ})`, vParams
        )
      : query(
          `SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'Completed') as completed,
           COUNT(*) FILTER (WHERE status = 'Dispatched') as active,
           COALESCE(SUM(CASE WHEN status='Completed' THEN actual_distance_km END),0) as total_km FROM trips`
        );

    // Expense & revenue (filtered)
    const expensesQ = vFilter
      ? query(`SELECT COALESCE(SUM(amount),0) as total FROM expenses WHERE vehicle_id IN (${vehicleSubQ})`, vParams)
      : query(`SELECT COALESCE(SUM(amount),0) as total FROM expenses`);

    const revenueQ = vFilter
      ? query(`SELECT COALESCE(SUM(revenue),0) as total FROM trips WHERE status = 'Completed' AND vehicle_id IN (${vehicleSubQ})`, vParams)
      : query(`SELECT COALESCE(SUM(revenue),0) as total FROM trips WHERE status = 'Completed'`);

    const [vehicles, drivers, trips, expenses, revenue] = await Promise.all([vehiclesQ, driversQ, tripsQ, expensesQ, revenueQ]);

    res.json({
      success: true,
      data: {
        vehicles: vehicles.rows[0],
        drivers: drivers.rows[0],
        trips: trips.rows[0],
        total_expenses: expenses.rows[0].total,
        total_revenue: revenue.rows[0].total,
      },
    });
  } catch (err) { next(err); }
});

// ─── GET /api/reports/recent-trips ─────────────────────────────
router.get('/recent-trips', async (req, res, next) => {
  try {
    const result = await query(`
      SELECT t.*, v.registration_number, v.name_model, d.name as driver_name
      FROM trips t
      JOIN vehicles v ON t.vehicle_id = v.id
      JOIN drivers d ON t.driver_id = d.id
      ORDER BY t.created_at DESC
      LIMIT 10
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

// ─── GET /api/reports/fuel-efficiency ──────────────────────────
router.get('/fuel-efficiency', async (req, res, next) => {
  try {
    const result = await query(`
      SELECT v.registration_number, v.name_model, v.type,
        COUNT(f.id) as fill_count,
        COALESCE(SUM(f.liters), 0) as total_liters,
        COALESCE(SUM(f.cost), 0) as total_fuel_cost
      FROM vehicles v
      LEFT JOIN fuel_logs f ON v.id = f.vehicle_id
      GROUP BY v.id, v.registration_number, v.name_model, v.type
      ORDER BY total_liters DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

// ─── GET /api/reports/expense-breakdown ────────────────────────
router.get('/expense-breakdown', async (req, res, next) => {
  try {
    const result = await query(`
      SELECT category, COUNT(*) as count, COALESCE(SUM(amount), 0) as total
      FROM expenses
      GROUP BY category
      ORDER BY total DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

// ─── GET /api/reports/vehicle-roi — Per-vehicle ROI ────────────
router.get('/vehicle-roi', async (req, res, next) => {
  try {
    const result = await query(`
      SELECT
        v.id, v.registration_number, v.name_model, v.type, v.acquisition_cost, v.status,
        COALESCE(trip_data.total_revenue, 0) as total_revenue,
        COALESCE(maint_data.total_maint_cost, 0) as maintenance_cost,
        COALESCE(fuel_data.total_fuel_cost, 0) as fuel_cost,
        CASE
          WHEN v.acquisition_cost > 0 THEN
            ROUND(
              ((COALESCE(trip_data.total_revenue, 0) - (COALESCE(maint_data.total_maint_cost, 0) + COALESCE(fuel_data.total_fuel_cost, 0)))
              / v.acquisition_cost) * 100, 2
            )
          ELSE 0
        END as roi_percent
      FROM vehicles v
      LEFT JOIN (
        SELECT vehicle_id, SUM(revenue) as total_revenue FROM trips WHERE status = 'Completed' GROUP BY vehicle_id
      ) trip_data ON v.id = trip_data.vehicle_id
      LEFT JOIN (
        SELECT vehicle_id, SUM(cost) as total_maint_cost FROM maintenance_logs GROUP BY vehicle_id
      ) maint_data ON v.id = maint_data.vehicle_id
      LEFT JOIN (
        SELECT vehicle_id, SUM(cost) as total_fuel_cost FROM fuel_logs GROUP BY vehicle_id
      ) fuel_data ON v.id = fuel_data.vehicle_id
      ORDER BY roi_percent DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

// ─── GET /api/reports/vehicle-costs — Per-vehicle operational costs ───
router.get('/vehicle-costs', async (req, res, next) => {
  try {
    const result = await query(`
      SELECT
        v.id, v.registration_number, v.name_model, v.type,
        COALESCE(fuel_data.total_fuel, 0) as fuel_cost,
        COALESCE(maint_data.total_maint, 0) as maintenance_cost,
        COALESCE(exp_data.total_expenses, 0) as total_expenses,
        COALESCE(fuel_data.total_fuel, 0) + COALESCE(maint_data.total_maint, 0) as operational_cost
      FROM vehicles v
      LEFT JOIN (
        SELECT vehicle_id, SUM(cost) as total_fuel FROM fuel_logs GROUP BY vehicle_id
      ) fuel_data ON v.id = fuel_data.vehicle_id
      LEFT JOIN (
        SELECT vehicle_id, SUM(cost) as total_maint FROM maintenance_logs GROUP BY vehicle_id
      ) maint_data ON v.id = maint_data.vehicle_id
      LEFT JOIN (
        SELECT vehicle_id, SUM(amount) as total_expenses FROM expenses GROUP BY vehicle_id
      ) exp_data ON v.id = exp_data.vehicle_id
      ORDER BY operational_cost DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

module.exports = router;
