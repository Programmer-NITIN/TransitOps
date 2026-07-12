const { query, getClient } = require('../../config/db');

class MaintenanceService {
  async list(filters = {}) {
    let sql = `SELECT m.*, v.registration_number, v.name_model
      FROM maintenance_logs m JOIN vehicles v ON m.vehicle_id = v.id WHERE 1=1`;
    const params = []; let idx = 1;
    if (filters.vehicle_id) { sql += ` AND m.vehicle_id = $${idx++}`; params.push(filters.vehicle_id); }
    if (filters.status) { sql += ` AND m.status = $${idx++}`; params.push(filters.status); }
    sql += ` ORDER BY m.start_date DESC`;
    return (await query(sql, params)).rows;
  }

  // ─── Create (Transactional — auto set vehicle In Shop) ───────
  async create(data) {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `INSERT INTO maintenance_logs (vehicle_id, service_type, description, cost, priority, status, start_date, end_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [data.vehicle_id, data.service_type, data.description, data.cost, data.priority || 'Medium', data.status || 'Open', data.start_date || new Date().toISOString(), data.end_date || null]
      );

      // If status is Open, automatically set vehicle to In Shop
      if ((data.status || 'Open') === 'Open') {
        await client.query("UPDATE vehicles SET status = 'In Shop' WHERE id = $1 AND status != 'Retired'", [data.vehicle_id]);
      }

      await client.query('COMMIT');
      return result.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async update(id, data) {
    const fields = []; const params = []; let idx = 1;
    const allowed = ['vehicle_id', 'service_type', 'description', 'cost', 'priority', 'status', 'start_date', 'end_date'];
    for (const f of allowed) { if (data[f] !== undefined) { fields.push(`${f} = $${idx++}`); params.push(data[f]); } }
    if (!fields.length) { const e = new Error('No fields'); e.statusCode = 400; throw e; }
    params.push(id);
    const result = await query(`UPDATE maintenance_logs SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`, params);
    if (!result.rows.length) { const e = new Error('Not found'); e.statusCode = 404; throw e; }
    return result.rows[0];
  }

  // ─── Close Maintenance (Transactional — restore vehicle) ─────
  async close(id) {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Update log to Closed
      const result = await client.query(
        "UPDATE maintenance_logs SET status = 'Closed', end_date = NOW() WHERE id = $1 AND status = 'Open' RETURNING *",
        [id]
      );
      if (!result.rows.length) {
        const e = new Error('Maintenance log not found or already closed');
        e.statusCode = 400; throw e;
      }

      const log = result.rows[0];

      // Check if vehicle has OTHER open maintenance logs
      const otherOpen = await client.query(
        "SELECT COUNT(*) FROM maintenance_logs WHERE vehicle_id = $1 AND status = 'Open' AND id != $2",
        [log.vehicle_id, id]
      );

      // If no other open logs, restore vehicle to Available (unless Retired)
      if (parseInt(otherOpen.rows[0].count) === 0) {
        await client.query(
          "UPDATE vehicles SET status = 'Available' WHERE id = $1 AND status = 'In Shop'",
          [log.vehicle_id]
        );
      }

      await client.query('COMMIT');
      return result.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
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
        COUNT(*) FILTER (WHERE status = 'Open') as open_count,
        COUNT(*) FILTER (WHERE status = 'Closed') as closed_count,
        COUNT(*) FILTER (WHERE priority = 'High' OR priority = 'Critical') as high_priority
      FROM maintenance_logs
    `);
    return result.rows[0];
  }
}

module.exports = new MaintenanceService();
