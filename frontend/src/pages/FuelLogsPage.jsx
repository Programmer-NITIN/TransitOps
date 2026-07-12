import { useState, useEffect } from 'react';
import api from '../services/api';
import { exportToCsv } from '../utils/csvExport';

const INITIAL_FORM = { vehicle_id: '', driver_id: '', liters: '', cost: '', odometer_at_fill: '', log_date: '' };

export default function FuelLogsPage() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({});
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [logsRes, statsRes, vRes, dRes] = await Promise.all([
        api.get('/fuel-logs'),
        api.get('/fuel-logs/stats'),
        api.get('/vehicles'),
        api.get('/drivers'),
      ]);
      setLogs(logsRes.data);
      setStats(statsRes.data);
      setVehicles(vRes.data);
      setDrivers(dRes.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/fuel-logs', form);
      setShowModal(false);
      setForm(INITIAL_FORM);
      load();
    } catch (err) { setError(err.message || 'Failed to add fuel log'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this fuel log?')) return;
    try { await api.delete(`/fuel-logs/${id}`); load(); } catch (e) { console.error(e); }
  };

  const handleExport = () => {
    exportToCsv('fuel-logs.csv',
      ['Vehicle', 'Driver', 'Liters', 'Cost (₹)', 'Odometer', 'Date'],
      logs,
      ['registration_number', 'driver_name', 'liters', 'cost', 'odometer_at_fill', 'log_date']
    );
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <span className="material-symbols-outlined page-title-icon">local_gas_station</span>
            Fuel Logs
          </h1>
          <p className="page-subtitle">Record and track fuel fill-ups across your fleet</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={handleExport}>
            <span className="material-symbols-outlined">download</span> Export CSV
          </button>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <span className="material-symbols-outlined">add</span> Add Fuel Log
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-card-header"><span className="stat-card-label">Total Entries</span><span className="material-symbols-outlined stat-card-icon">tag</span></div>
          <div className="stat-card-value">{stats.total_entries || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header"><span className="stat-card-label">Total Liters</span><span className="material-symbols-outlined stat-card-icon">water_drop</span></div>
          <div className="stat-card-value">{parseFloat(stats.total_liters || 0).toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header"><span className="stat-card-label">Total Cost</span><span className="material-symbols-outlined stat-card-icon">currency_rupee</span></div>
          <div className="stat-card-value">₹{parseFloat(stats.total_cost || 0).toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header"><span className="stat-card-label">Avg ₹/Liter</span><span className="material-symbols-outlined stat-card-icon">speed</span></div>
          <div className="stat-card-value">₹{stats.avg_cost_per_liter || '0.00'}</div>
        </div>
      </div>

      {/* Table */}
      <div className="data-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Vehicle</th>
              <th>Driver</th>
              <th>Liters</th>
              <th>Cost (₹)</th>
              <th>Odometer (km)</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: 32, color: 'var(--on-surface-variant)' }}>No fuel logs recorded yet</td></tr>
            )}
            {logs.map((log) => (
              <tr key={log.id}>
                <td>
                  <div className="vehicle-cell">
                    <span className="mono-text">{log.registration_number}</span>
                    <span className="sub-text">{log.name_model}</span>
                  </div>
                </td>
                <td>{log.driver_name || '—'}</td>
                <td>{parseFloat(log.liters).toFixed(1)}</td>
                <td>₹{parseFloat(log.cost).toLocaleString()}</td>
                <td>{parseFloat(log.odometer_at_fill).toLocaleString()}</td>
                <td>{new Date(log.log_date).toLocaleDateString('en-IN')}</td>
                <td>
                  <button className="btn-icon btn-danger-icon" onClick={() => handleDelete(log.id)} title="Delete">
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Fuel Log</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {error && <div className="error-banner">{error}</div>}
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Vehicle *</label>
                  <select value={form.vehicle_id} onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })} required>
                    <option value="">Select Vehicle</option>
                    {vehicles.map((v) => <option key={v.id} value={v.id}>{v.registration_number} — {v.name_model}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Driver</label>
                  <select value={form.driver_id} onChange={(e) => setForm({ ...form, driver_id: e.target.value })}>
                    <option value="">None</option>
                    {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Liters *</label>
                  <input type="number" step="0.1" min="0.1" value={form.liters} onChange={(e) => setForm({ ...form, liters: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Cost (₹) *</label>
                  <input type="number" step="0.01" min="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Odometer (km) *</label>
                  <input type="number" step="0.1" min="0" value={form.odometer_at_fill} onChange={(e) => setForm({ ...form, odometer_at_fill: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Date *</label>
                  <input type="date" value={form.log_date} onChange={(e) => setForm({ ...form, log_date: e.target.value })} required />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Add Fuel Log</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
