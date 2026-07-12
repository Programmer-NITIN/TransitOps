const { query } = require('../../config/db');

class MaintenanceService {
  async list(filters = {}) {
    let sql = `SELECT m.*, v.registration_number, v.name_model
      FROM maintenance_logs m JOIN vehicles v ON m.vehicle_id = v.id WHERE 1=1`;
    const params = []; let idx = 1;
    if (filters.vehicle_id) { sql += ` AND m.vehicle_id = $${idx++}`; params.push(filters.vehicle_id); }
    if (filters.type) { sql += ` AND m.type = $${idx++}`; params.push(filters.type); }
    sql += ` ORDER BY m.service_date DESC`;
    return (await query(sql, params)).rows;
  }

  async create(data) {
    const result = await query(
      `INSERT INTO maintenance_logs (vehicle_id, type, description, cost, service_date, next_due_date)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [data.vehicle_id, data.type, data.description, data.cost, data.service_date, data.next_due_date || null]
    );
    return result.rows[0];
  }

  async update(id, data) {
    const fields = []; const params = []; let idx = 1;
    const allowed = ['vehicle_id', 'type', 'description', 'cost', 'service_date', 'next_due_date'];
    for (const f of allowed) { if (data[f] !== undefined) { fields.push(`${f} = $${idx++}`); params.push(data[f]); } }
    if (!fields.length) { const e = new Error('No fields'); e.statusCode = 400; throw e; }
    params.push(id);
    const result = await query(`UPDATE maintenance_logs SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`, params);
    if (!result.rows.length) { const e = new Error('Not found'); e.statusCode = 404; throw e; }
    return result.rows[0];
  }

  async delete(id) {
    const result = await query('DELETE FROM maintenance_logs WHERE id = $1 RETURNING id', [id]);
    if (!result.rows.length) { const e = new Error('Not found'); e.statusCode = 404; throw e; }
    return { deleted: true };
  }

  async getStats() {
    const result = await query(`
      SELECT COUNT(*) as total,
        COALESCE(SUM(cost), 0) as total_cost,
        COUNT(*) FILTER (WHERE type = 'Preventive') as preventive,
        COUNT(*) FILTER (WHERE type = 'Corrective') as corrective,
        COUNT(*) FILTER (WHERE type = 'Emergency') as emergency,
        COUNT(*) FILTER (WHERE next_due_date IS NOT NULL AND next_due_date < CURRENT_DATE) as overdue
      FROM maintenance_logs
    `);
    return result.rows[0];
  }
}

module.exports = new MaintenanceService();
