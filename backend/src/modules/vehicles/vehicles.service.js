const { query } = require('../../config/db');

class VehicleService {
  async list(filters = {}) {
    let sql = `SELECT * FROM vehicles WHERE 1=1`;
    const params = [];
    let idx = 1;

    if (filters.status) {
      sql += ` AND status = $${idx++}`;
      params.push(filters.status);
    }
    if (filters.type) {
      sql += ` AND type = $${idx++}`;
      params.push(filters.type);
    }
    if (filters.region) {
      sql += ` AND region ILIKE $${idx++}`;
      params.push(`%${filters.region}%`);
    }
    if (filters.search) {
      sql += ` AND (registration_number ILIKE $${idx} OR name_model ILIKE $${idx})`;
      params.push(`%${filters.search}%`);
      idx++;
    }

    sql += ` ORDER BY created_at DESC`;
    const result = await query(sql, params);
    return result.rows;
  }

  async getById(id) {
    const result = await query(
      `SELECT v.*, 
        (SELECT COUNT(*) FROM trips t WHERE t.vehicle_id = v.id) as total_trips,
        (SELECT COUNT(*) FROM trips t WHERE t.vehicle_id = v.id AND t.status = 'Completed') as completed_trips,
        (SELECT COALESCE(SUM(e.amount), 0) FROM expenses e WHERE e.vehicle_id = v.id) as total_expenses
       FROM vehicles v WHERE v.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      const err = new Error('Vehicle not found');
      err.statusCode = 404;
      throw err;
    }
    return result.rows[0];
  }

  async create(data) {
    const result = await query(
      `INSERT INTO vehicles (registration_number, name_model, type, max_load_capacity_kg, current_odometer_km, acquisition_cost, status, region)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [data.registration_number, data.name_model, data.type, data.max_load_capacity_kg, data.current_odometer_km || 0, data.acquisition_cost, data.status || 'Available', data.region]
    );
    return result.rows[0];
  }

  async update(id, data) {
    const fields = [];
    const params = [];
    let idx = 1;

    const allowedFields = ['registration_number', 'name_model', 'type', 'max_load_capacity_kg', 'current_odometer_km', 'acquisition_cost', 'status', 'region'];
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
      `UPDATE vehicles SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      const err = new Error('Vehicle not found');
      err.statusCode = 404;
      throw err;
    }
    return result.rows[0];
  }

  async delete(id) {
    // Check if vehicle has active trips
    const activeTrips = await query(
      `SELECT COUNT(*) FROM trips WHERE vehicle_id = $1 AND status IN ('Draft', 'Dispatched')`,
      [id]
    );
    if (parseInt(activeTrips.rows[0].count) > 0) {
      const err = new Error('Cannot delete vehicle with active trips');
      err.type = 'business_rule';
      throw err;
    }

    const result = await query('DELETE FROM vehicles WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      const err = new Error('Vehicle not found');
      err.statusCode = 404;
      throw err;
    }
    return { deleted: true };
  }

  async getStats() {
    const result = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'Available') as available,
        COUNT(*) FILTER (WHERE status = 'On Trip') as on_trip,
        COUNT(*) FILTER (WHERE status = 'In Shop') as in_shop,
        COUNT(*) FILTER (WHERE status = 'Retired') as retired,
        COALESCE(SUM(acquisition_cost), 0) as total_fleet_value
      FROM vehicles
    `);
    return result.rows[0];
  }
}

module.exports = new VehicleService();
