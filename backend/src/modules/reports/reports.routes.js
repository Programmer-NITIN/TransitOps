const router = require('express').Router();
const authenticate = require('../../middleware/auth');
const { query } = require('../../config/db');

router.use(authenticate);

// GET /api/reports/dashboard — Main dashboard KPIs
router.get('/dashboard', async (req, res, next) => {
  try {
    const [vehicles, drivers, trips, expenses, revenue] = await Promise.all([
      query(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'Available') as available, COUNT(*) FILTER (WHERE status = 'On Trip') as on_trip, COUNT(*) FILTER (WHERE status = 'In Shop') as in_shop FROM vehicles`),
      query(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'Available') as available, ROUND(AVG(safety_score),1) as avg_safety, COUNT(*) FILTER (WHERE license_expiry < CURRENT_DATE) as expired_licenses FROM drivers`),
      query(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'Completed') as completed, COUNT(*) FILTER (WHERE status = 'Dispatched') as active, COALESCE(SUM(CASE WHEN status='Completed' THEN actual_distance_km END),0) as total_km FROM trips`),
      query(`SELECT COALESCE(SUM(amount),0) as total FROM expenses`),
      query(`SELECT COALESCE(SUM(revenue),0) as total FROM trips WHERE status = 'Completed'`),
    ]);

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

// GET /api/reports/recent-trips
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

// GET /api/reports/fuel-efficiency
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

// GET /api/reports/expense-breakdown
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

module.exports = router;
