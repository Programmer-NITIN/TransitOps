const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../../middleware/validate');
const authenticate = require('../../middleware/auth');
const authorize = require('../../middleware/rbac');
const { query } = require('../../config/db');

router.use(authenticate);

// GET /api/fuel-logs — List all fuel logs
router.get('/', async (req, res, next) => {
  try {
    let sql = `SELECT f.*, v.registration_number, v.name_model, d.name as driver_name
      FROM fuel_logs f
      JOIN vehicles v ON f.vehicle_id = v.id
      LEFT JOIN drivers d ON f.driver_id = d.id
      WHERE 1=1`;
    const params = []; let idx = 1;

    if (req.query.vehicle_id) { sql += ` AND f.vehicle_id = $${idx++}`; params.push(req.query.vehicle_id); }
    sql += ` ORDER BY f.log_date DESC`;

    const result = await query(sql, params);
    res.json({ success: true, data: result.rows, count: result.rows.length });
  } catch (e) { next(e); }
});

// GET /api/fuel-logs/stats — Fuel log KPIs
router.get('/stats', async (req, res, next) => {
  try {
    const result = await query(`
      SELECT
        COUNT(*) as total_entries,
        COALESCE(SUM(liters), 0) as total_liters,
        COALESCE(SUM(cost), 0) as total_cost,
        CASE WHEN SUM(liters) > 0 THEN ROUND(SUM(cost) / SUM(liters), 2) ELSE 0 END as avg_cost_per_liter
      FROM fuel_logs
    `);
    res.json({ success: true, data: result.rows[0] });
  } catch (e) { next(e); }
});

// POST /api/fuel-logs — Create fuel log
router.post('/', authorize('Fleet Manager', 'Driver', 'Financial Analyst'), [
  body('vehicle_id').notEmpty().withMessage('Vehicle required'),
  body('liters').isFloat({ min: 0.1 }).withMessage('Liters must be positive'),
  body('cost').isFloat({ min: 0.01 }).withMessage('Cost must be positive'),
  body('odometer_at_fill').isFloat({ min: 0 }).withMessage('Odometer required'),
  body('log_date').isDate().withMessage('Date required'),
], validate, async (req, res, next) => {
  try {
    const { vehicle_id, driver_id, trip_id, liters, cost, odometer_at_fill, log_date } = req.body;
    const result = await query(
      `INSERT INTO fuel_logs (vehicle_id, driver_id, trip_id, liters, cost, odometer_at_fill, log_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [vehicle_id, driver_id || null, trip_id || null, liters, cost, odometer_at_fill, log_date]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (e) { next(e); }
});

// DELETE /api/fuel-logs/:id
router.delete('/:id', authorize('Fleet Manager', 'Financial Analyst'), async (req, res, next) => {
  try {
    const result = await query('DELETE FROM fuel_logs WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) { const e = new Error('Not found'); e.statusCode = 404; throw e; }
    res.json({ success: true, message: 'Deleted' });
  } catch (e) { next(e); }
});

module.exports = router;
