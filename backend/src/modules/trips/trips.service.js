const { query, getClient } = require('../../config/db');

class TripService {
  async list(filters = {}) {
    let sql = `SELECT t.*, v.registration_number, v.name_model, v.max_load_capacity_kg,
      d.name as driver_name
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
      `SELECT t.*, v.registration_number, v.name_model, v.max_load_capacity_kg,
       d.name as driver_name, d.contact_number as driver_contact
       FROM trips t JOIN vehicles v ON t.vehicle_id = v.id JOIN drivers d ON t.driver_id = d.id
       WHERE t.id = $1`, [id]
    );
    if (result.rows.length === 0) { const e = new Error('Trip not found'); e.statusCode = 404; throw e; }
    return result.rows[0];
  }

  // ─── Business Rule Validations ───────────────────────────────
  async _validateTripAssignment(vehicleId, driverId, cargoWeight) {
    // 1. Fetch vehicle
    const vResult = await query('SELECT id, status, max_load_capacity_kg FROM vehicles WHERE id = $1', [vehicleId]);
    if (vResult.rows.length === 0) { const e = new Error('Vehicle not found'); e.statusCode = 404; throw e; }
    const vehicle = vResult.rows[0];

    // 2. Vehicle must be Available
    if (vehicle.status !== 'Available') {
      const e = new Error(`Vehicle is currently "${vehicle.status}" and cannot be assigned to a new trip`);
      e.statusCode = 400; e.type = 'business_rule'; throw e;
    }

    // 3. Cargo capacity check
    if (cargoWeight && parseFloat(cargoWeight) > parseFloat(vehicle.max_load_capacity_kg)) {
      const e = new Error(`Cargo weight (${cargoWeight} kg) exceeds vehicle max capacity (${vehicle.max_load_capacity_kg} kg)`);
      e.statusCode = 400; e.type = 'business_rule'; throw e;
    }

    // 4. Fetch driver
    const dResult = await query('SELECT id, status, license_expiry FROM drivers WHERE id = $1', [driverId]);
    if (dResult.rows.length === 0) { const e = new Error('Driver not found'); e.statusCode = 404; throw e; }
    const driver = dResult.rows[0];

    // 5. Driver must be Available
    if (driver.status !== 'Available') {
      const e = new Error(`Driver is currently "${driver.status}" and cannot be assigned to a new trip`);
      e.statusCode = 400; e.type = 'business_rule'; throw e;
    }

    // 6. License expiry check
    if (driver.license_expiry && new Date(driver.license_expiry) < new Date()) {
      const e = new Error('Driver license has expired. Cannot assign to trip');
      e.statusCode = 400; e.type = 'business_rule'; throw e;
    }

    return { vehicle, driver };
  }

  // ─── Create Trip (with validation) ───────────────────────────
  async create(data) {
    // Validate business rules before insert
    await this._validateTripAssignment(data.vehicle_id, data.driver_id, data.cargo_weight_kg);

    const result = await query(
      `INSERT INTO trips (vehicle_id, driver_id, source, destination, planned_distance_km, cargo_weight_kg, revenue, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [data.vehicle_id, data.driver_id, data.source, data.destination, data.planned_distance_km, data.cargo_weight_kg || 1, data.revenue || 0, data.status || 'Draft']
    );
    return result.rows[0];
  }

  // ─── Update Trip Fields ──────────────────────────────────────
  async update(id, data) {
    const fields = []; const params = []; let idx = 1;
    const allowed = ['vehicle_id', 'driver_id', 'source', 'destination', 'planned_distance_km', 'actual_distance_km', 'cargo_weight_kg', 'revenue', 'status', 'dispatched_at', 'completed_at'];
    for (const f of allowed) { if (data[f] !== undefined) { fields.push(`${f} = $${idx++}`); params.push(data[f]); } }
    if (fields.length === 0) { const e = new Error('No fields to update'); e.statusCode = 400; throw e; }
    params.push(id);
    const result = await query(`UPDATE trips SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`, params);
    if (result.rows.length === 0) { const e = new Error('Trip not found'); e.statusCode = 404; throw e; }
    return result.rows[0];
  }

  // ─── Status Transition (Transactional) ───────────────────────
  async updateStatus(id, status) {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Fetch current trip
      const tripResult = await client.query(
        'SELECT t.*, v.status as vehicle_status, d.status as driver_status FROM trips t JOIN vehicles v ON t.vehicle_id = v.id JOIN drivers d ON t.driver_id = d.id WHERE t.id = $1',
        [id]
      );
      if (tripResult.rows.length === 0) { const e = new Error('Trip not found'); e.statusCode = 404; throw e; }
      const trip = tripResult.rows[0];

      // Validate status transitions
      const validTransitions = {
        'Draft': ['Dispatched', 'Cancelled'],
        'Dispatched': ['Completed', 'Cancelled'],
        'Completed': [],
        'Cancelled': [],
      };

      if (!validTransitions[trip.status]?.includes(status)) {
        const e = new Error(`Cannot transition from "${trip.status}" to "${status}"`);
        e.statusCode = 400; e.type = 'business_rule'; throw e;
      }

      // ── Dispatch: set vehicle+driver to On Trip ──
      if (status === 'Dispatched') {
        // Re-validate vehicle and driver are still Available
        if (trip.vehicle_status !== 'Available') {
          const e = new Error(`Vehicle is "${trip.vehicle_status}" and cannot be dispatched`);
          e.statusCode = 400; e.type = 'business_rule'; throw e;
        }
        if (trip.driver_status !== 'Available') {
          const e = new Error(`Driver is "${trip.driver_status}" and cannot be dispatched`);
          e.statusCode = 400; e.type = 'business_rule'; throw e;
        }

        await client.query('UPDATE trips SET status = $1, dispatched_at = NOW() WHERE id = $2', [status, id]);
        await client.query("UPDATE vehicles SET status = 'On Trip' WHERE id = $1", [trip.vehicle_id]);
        await client.query("UPDATE drivers SET status = 'On Trip' WHERE id = $1", [trip.driver_id]);
      }

      // ── Complete: restore vehicle+driver to Available ──
      else if (status === 'Completed') {
        await client.query('UPDATE trips SET status = $1, completed_at = NOW() WHERE id = $2', [status, id]);
        await client.query("UPDATE vehicles SET status = 'Available' WHERE id = $1", [trip.vehicle_id]);
        await client.query("UPDATE drivers SET status = 'Available' WHERE id = $1", [trip.driver_id]);
      }

      // ── Cancel: restore if was Dispatched ──
      else if (status === 'Cancelled') {
        await client.query('UPDATE trips SET status = $1 WHERE id = $2', [status, id]);
        if (trip.status === 'Dispatched') {
          await client.query("UPDATE vehicles SET status = 'Available' WHERE id = $1", [trip.vehicle_id]);
          await client.query("UPDATE drivers SET status = 'Available' WHERE id = $1", [trip.driver_id]);
        }
      }

      await client.query('COMMIT');

      // Return the updated trip
      return this.getById(id);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

module.exports = new TripService();
