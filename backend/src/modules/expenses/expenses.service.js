const { query } = require('../../config/db');

class ExpenseService {
  async list(filters = {}) {
    let sql = `SELECT e.*, v.registration_number, v.name_model
      FROM expenses e JOIN vehicles v ON e.vehicle_id = v.id WHERE 1=1`;
    const params = []; let idx = 1;
    if (filters.category) { sql += ` AND e.category = $${idx++}`; params.push(filters.category); }
    if (filters.vehicle_id) { sql += ` AND e.vehicle_id = $${idx++}`; params.push(filters.vehicle_id); }
    sql += ` ORDER BY e.expense_date DESC`;
    return (await query(sql, params)).rows;
  }

  async create(data) {
    const result = await query(
      `INSERT INTO expenses (vehicle_id, category, amount, description, expense_date)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [data.vehicle_id, data.category, data.amount, data.description, data.expense_date]
    );
    return result.rows[0];
  }

  async update(id, data) {
    const fields = []; const params = []; let idx = 1;
    const allowed = ['vehicle_id', 'category', 'amount', 'description', 'expense_date'];
    for (const f of allowed) { if (data[f] !== undefined) { fields.push(`${f} = $${idx++}`); params.push(data[f]); } }
    if (!fields.length) { const e = new Error('No fields'); e.statusCode = 400; throw e; }
    params.push(id);
    const result = await query(`UPDATE expenses SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`, params);
    if (!result.rows.length) { const e = new Error('Not found'); e.statusCode = 404; throw e; }
    return result.rows[0];
  }

  async delete(id) {
    const result = await query('DELETE FROM expenses WHERE id = $1 RETURNING id', [id]);
    if (!result.rows.length) { const e = new Error('Not found'); e.statusCode = 404; throw e; }
    return { deleted: true };
  }

  async getStats() {
    const result = await query(`
      SELECT COUNT(*) as total, COALESCE(SUM(amount), 0) as total_amount,
        COALESCE(SUM(amount) FILTER (WHERE category = 'Fuel'), 0) as fuel,
        COALESCE(SUM(amount) FILTER (WHERE category = 'Maintenance'), 0) as maintenance,
        COALESCE(SUM(amount) FILTER (WHERE category = 'Insurance'), 0) as insurance,
        COALESCE(SUM(amount) FILTER (WHERE category = 'Toll'), 0) as toll,
        COALESCE(SUM(amount) FILTER (WHERE category NOT IN ('Fuel','Maintenance','Insurance','Toll')), 0) as other
      FROM expenses
    `);
    return result.rows[0];
  }
}

module.exports = new ExpenseService();
