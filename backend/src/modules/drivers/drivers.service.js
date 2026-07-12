const { query } = require('../../config/db');

class DriverService {
  async list(filters = {}) {
    let sql = `SELECT * FROM drivers WHERE 1=1`;
    const params = [];
    let idx = 1;

    if (filters.status) {
      sql += ` AND status = $${idx++}`;
      params.push(filters.status);
    }
    if (filters.search) {
      sql += ` AND (name ILIKE $${idx} OR license_number ILIKE $${idx})`;
      params.push(`%${filters.search}%`);
      idx++;
    }

    sql += ` ORDER BY created_at DESC`;
    const result = await query(sql, params);
    return result.rows;
  }

  async getById(id) {
    const result = await query(
      `SELECT d.*,
        (SELECT COUNT(*) FROM trips t WHERE t.driver_id = d.id) as total_trips,
        (SELECT COUNT(*) FROM trips t WHERE t.driver_id = d.id AND t.status = 'Completed') as completed_trips
       FROM drivers d WHERE d.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      const err = new Error('Driver not found');
      err.statusCode = 404;
      throw err;
    }
    return result.rows[0];
  }

  async create(data) {
    const result = await query(
      `INSERT INTO drivers (name, license_number, license_category, license_expiry, contact_number, safety_score, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [data.name, data.license_number, data.license_category, data.license_expiry, data.contact_number, data.safety_score || 5.0, data.status || 'Available']
    );
    return result.rows[0];
  }

  async update(id, data) {
    const fields = [];
    const params = [];
    let idx = 1;

    const allowedFields = ['name', 'license_number', 'license_category', 'license_expiry', 'contact_number', 'safety_score', 'status'];
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = $${idx++}`);
        params.push(data[field]);
      }
    }

    if (fields.length === 0) {
      const err = new Error('No fields to update');
      err.statusCode = 400;
      throw err;
    }

    params.push(id);
    const result = await query(
      `UPDATE drivers SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      const err = new Error('Driver not found');
      err.statusCode = 404;
      throw err;
    }
    return result.rows[0];
  }

  async getStats() {
    const result = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'Available') as available,
        COUNT(*) FILTER (WHERE status = 'On Trip') as on_trip,
        COUNT(*) FILTER (WHERE status = 'Off Duty') as off_duty,
        COUNT(*) FILTER (WHERE status = 'Suspended') as suspended,
        ROUND(AVG(safety_score), 1) as avg_safety_score,
        COUNT(*) FILTER (WHERE license_expiry < CURRENT_DATE) as expired_licenses,
        COUNT(*) FILTER (WHERE license_expiry < CURRENT_DATE + INTERVAL '30 days' AND license_expiry >= CURRENT_DATE) as expiring_soon
      FROM drivers
    `);
    return result.rows[0];
  }
}

module.exports = new DriverService();
