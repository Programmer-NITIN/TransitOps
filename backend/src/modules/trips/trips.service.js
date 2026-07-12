const { query } = require('../../config/db');

class TripService {
  async list(filters = {}) {
    let sql = `SELECT t.*, v.registration_number, v.name_model, d.name as driver_name
      FROM trips t
      JOIN vehicles v ON t.vehicle_id = v.id
      JOIN drivers d ON t.driver_id = d.id
      WHERE 1=1`;
    const params = [];
    let idx = 1;

    if (filters.status) { sql += ` AND t.status = $${idx++}`; params.push(filters.status); }
    if (filters.vehicle_id) { sql += ` AND t.vehicle_id = $${idx++}`; params.push(filters.vehicle_id); }
    if (filters.driver_id) { sql += ` AND t.driver_id = $${idx++}`; params.push(filters.driver_id); }
    if (filters.search) {
      sql += ` AND (t.source ILIKE $${idx} OR t.destination ILIKE $${idx} OR v.registration_number ILIKE $${idx})`;
      params.push(`%${filters.search}%`); idx++;
    }

    sql += ` ORDER BY t.created_at DESC`;
    return (await query(sql, params)).rows;
  }

  async getById(id) {
    const result = await query(
      `SELECT t.*, v.registration_number, v.name_model, d.name as driver_name, d.contact_number as driver_contact
       FROM trips t JOIN vehicles v ON t.vehicle_id = v.id JOIN drivers d ON t.driver_id = d.id
       WHERE t.id = $1`, [id]
    );
    if (result.rows.length === 0) { const e = new Error('Trip not found'); e.statusCode = 404; throw e; }
    return result.rows[0];
  }

  async create(data) {
    const result = await query(
      `INSERT INTO trips (vehicle_id, driver_id, source, destination, planned_distance_km, load_weight_kg, revenue, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [data.vehicle_id, data.driver_id, data.source, data.destination, data.planned_distance_km, data.load_weight_kg || null, data.revenue || 0, data.status || 'Draft']
    );
    return result.rows[0];
  }

  async update(id, data) {
    const fields = []; const params = []; let idx = 1;
    const allowed = ['vehicle_id', 'driver_id', 'source', 'destination', 'planned_distance_km', 'actual_distance_km', 'load_weight_kg', 'revenue', 'status', 'started_at', 'completed_at'];
    for (const f of allowed) { if (data[f] !== undefined) { fields.push(`${f} = $${idx++}`); params.push(data[f]); } }
    if (fields.length === 0) { const e = new Error('No fields to update'); e.statusCode = 400; throw e; }
    params.push(id);
    const result = await query(`UPDATE trips SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`, params);
    if (result.rows.length === 0) { const e = new Error('Trip not found'); e.statusCode = 404; throw e; }
    return result.rows[0];
  }

  async updateStatus(id, status) {
    const updates = { status };
    if (status === 'Dispatched') updates.started_at = new Date().toISOString();
    if (status === 'Completed') updates.completed_at = new Date().toISOString();
    return this.update(id, updates);
  }
}

module.exports = new TripService();
