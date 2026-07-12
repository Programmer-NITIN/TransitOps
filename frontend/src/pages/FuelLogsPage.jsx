import { useState, useEffect } from 'react';
import api from '../services/api';
import { exportToCsv } from '../utils/csvExport';
import './FuelLogsPage.css';

const INITIAL_FORM = { vehicle_id: '', driver_id: '', liters: '', cost: '', odometer_at_fill: '', log_date: '' };

export default function FuelLogsPage() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({});
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [filter, setFilter] = useState({ vehicle: '' });

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/fuel-logs'),
      api.get('/fuel-logs/stats'),
      api.get('/vehicles'),
      api.get('/drivers'),
    ]).then(([logsRes, statsRes, vRes, dRes]) => {
      setLogs(logsRes.data);
      setStats(statsRes.data);
      setVehicles(vRes.data);
      setDrivers(dRes.data);
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.driver_id) delete payload.driver_id;
      await api.post('/fuel-logs', payload);
      showToast('Fuel log added successfully');
      setModal(false);
      setForm(INITIAL_FORM);
      load();
    } catch (err) {
      showToast(err.error || err.message || 'Failed to add fuel log', 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this fuel log?')) return;
    try {
      await api.delete(`/fuel-logs/${id}`);
      showToast('Fuel log deleted');
      load();
    } catch (e) {
      showToast(e.error || 'Failed to delete', 'error');
    }
  };

  const handleExport = () => {
    exportToCsv('fuel-logs.csv',
      ['Vehicle', 'Driver', 'Liters', 'Cost (₹)', 'Odometer', 'Date'],
      logs,
      ['registration_number', 'driver_name', 'liters', 'cost', 'odometer_at_fill', 'log_date']
    );
  };

  const fmt = (n) => Number(n || 0).toLocaleString('en-IN');

  // Filter logs by vehicle
  const filteredLogs = filter.vehicle
    ? logs.filter(l => String(l.vehicle_id) === filter.vehicle)
    : logs;

  // Compute efficiency breakdown
  const vehicleFuelMap = {};
  logs.forEach(l => {
    const key = l.registration_number || 'Unknown';
    if (!vehicleFuelMap[key]) vehicleFuelMap[key] = { liters: 0, cost: 0, count: 0 };
    vehicleFuelMap[key].liters += parseFloat(l.liters || 0);
    vehicleFuelMap[key].cost += parseFloat(l.cost || 0);
    vehicleFuelMap[key].count += 1;
  });
  const fuelBreakdown = Object.entries(vehicleFuelMap)
    .sort((a, b) => b[1].cost - a[1].cost)
    .slice(0, 6);
  const maxFuelCost = Math.max(...fuelBreakdown.map(([, v]) => v.cost), 1);

  return (
    <>
      {toast && <div className="toast-container"><div className={`toast toast-${toast.type}`}>{toast.msg}</div></div>}

      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Fuel Logs</h1>
          <p className="page-subtitle">Record and track fuel fill-ups across your fleet</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={handleExport}>
            <span className="material-symbols-outlined">download</span> Export CSV
          </button>
          <button className="btn btn-primary" onClick={() => setModal(true)}>
            <span className="material-symbols-outlined">add</span> Add Fuel Log
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {[
          { label: 'Total Entries', value: stats.total_entries || 0, icon: 'tag', cls: 'primary' },
          { label: 'Total Liters', value: `${fmt(stats.total_liters)}L`, icon: 'water_drop', cls: 'fuel' },
          { label: 'Total Cost', value: `₹${fmt(stats.total_cost)}`, icon: 'currency_rupee', cls: 'cost' },
          { label: 'Avg ₹/Liter', value: `₹${stats.avg_cost_per_liter || '0.00'}`, icon: 'speed', cls: 'efficiency' },
        ].map((k) => (
          <div key={k.label} className={`card glass-panel kpi-glow fuel-kpi`}>
            <span className={`material-symbols-outlined kpi-icon kpi-icon-${k.cls}`}>{k.icon}</span>
            <div className="fuel-kpi-value">{k.value}</div>
            <div className="fuel-kpi-label font-label-md">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Stats + Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="card glass-panel" style={{ padding: 24 }}>
          <div className="card-title" style={{ marginBottom: 12, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--on-surface-variant)', fontFamily: "'JetBrains Mono', monospace" }}>
            Fuel Spend Overview
          </div>
          <div style={{ fontFamily: "'Geist', sans-serif", fontSize: 42, fontWeight: 800, color: 'var(--on-surface)', marginBottom: 8 }}>
            ₹{fmt(stats?.total_cost)}
          </div>
          <div style={{ fontSize: 13, color: 'var(--on-surface-variant)' }}>
            {stats?.total_entries || 0} fill-ups · {fmt(stats?.total_liters)} liters consumed
          </div>
          <div className="fuel-spend-rate" style={{ marginTop: 16, display: 'flex', gap: 24 }}>
            <div className="fuel-mini-stat">
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#f59e0b' }}>local_gas_station</span>
              <div>
                <div style={{ fontSize: 11, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg Rate</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 600, color: 'var(--on-surface)' }}>₹{stats?.avg_cost_per_liter || '0.00'}/L</div>
              </div>
            </div>
            <div className="fuel-mini-stat">
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#4d8eff' }}>speed</span>
              <div>
                <div style={{ fontSize: 11, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg Fill</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 600, color: 'var(--on-surface)' }}>
                  {stats?.total_entries > 0 ? (parseFloat(stats.total_liters || 0) / parseInt(stats.total_entries)).toFixed(1) : '0.0'}L
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card glass-panel" style={{ padding: 24 }}>
          <div className="card-title" style={{ marginBottom: 12, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--on-surface-variant)', fontFamily: "'JetBrains Mono', monospace" }}>
            Fuel Cost by Vehicle
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {fuelBreakdown.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--outline)', padding: '20px 0', textAlign: 'center' }}>No data yet</div>
            ) : fuelBreakdown.map(([reg, data]) => (
              <div key={reg} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#f59e0b' }}>local_gas_station</span>
                <span className="font-label-md" style={{ color: 'var(--primary)', width: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11 }}>{reg}</span>
                <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{ width: `${(data.cost / maxFuelCost) * 100}%`, height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, #f59e0b, #f97316)', transition: 'width 0.5s ease' }} />
                </div>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--on-surface)', minWidth: 70, textAlign: 'right' }}>₹{fmt(data.cost)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="fleet-filters glass-panel card">
        <div className="filter-group">
          <span className="material-symbols-outlined" style={{ color: 'var(--outline)', fontSize: 18 }}>filter_list</span>
          <select className="select filter-select" value={filter.vehicle} onChange={(e) => setFilter({ vehicle: e.target.value })}>
            <option value="">All Vehicles</option>
            {vehicles.map((v) => <option key={v.id} value={v.id}>{v.registration_number} — {v.name_model}</option>)}
          </select>
        </div>
        <div style={{ fontSize: 13, color: 'var(--on-surface-variant)' }}>
          Showing {filteredLogs.length} of {logs.length} records
        </div>
      </div>

      {/* Table */}
      <div className="card glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
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
            {loading ? [...Array(5)].map((_, i) => (
              <tr key={i}>{[...Array(7)].map((_, j) => <td key={j}><div className="skeleton" style={{ height: 16, width: '80%' }} /></td>)}</tr>
            )) : filteredLogs.length === 0 ? (
              <tr><td colSpan={7}>
                <div className="empty-state">
                  <span className="material-symbols-outlined">local_gas_station</span>
                  <p>No fuel logs recorded yet</p>
                </div>
              </td></tr>
            ) : filteredLogs.map((log) => (
              <tr key={log.id}>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span className="font-label-md" style={{ color: 'var(--primary)', letterSpacing: '0.02em' }}>{log.registration_number}</span>
                    <span style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>{log.name_model}</span>
                  </div>
                </td>
                <td>{log.driver_name || <span style={{ color: 'var(--outline)' }}>—</span>}</td>
                <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>{parseFloat(log.liters).toFixed(1)}</td>
                <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600 }}>₹{parseFloat(log.cost).toLocaleString()}</td>
                <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>{parseFloat(log.odometer_at_fill).toLocaleString()}</td>
                <td>{new Date(log.log_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                <td>
                  <button className="btn-ghost" title="Delete" onClick={() => handleDelete(log.id)}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--error)' }}>delete</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontFamily: "'Geist', sans-serif", fontSize: 22, fontWeight: 700, marginBottom: 24 }}>
              Add Fuel Log
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Vehicle *</label>
                  <select className="select" value={form.vehicle_id} onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })} required>
                    <option value="">Select Vehicle</option>
                    {vehicles.map((v) => <option key={v.id} value={v.id}>{v.registration_number} — {v.name_model}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Driver</label>
                  <select className="select" value={form.driver_id} onChange={(e) => setForm({ ...form, driver_id: e.target.value })}>
                    <option value="">None</option>
                    {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Liters *</label>
                  <input className="input" type="number" step="0.1" min="0.1" value={form.liters} onChange={(e) => setForm({ ...form, liters: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Cost (₹) *</label>
                  <input className="input" type="number" step="0.01" min="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Odometer (km) *</label>
                  <input className="input" type="number" step="0.1" min="0" value={form.odometer_at_fill} onChange={(e) => setForm({ ...form, odometer_at_fill: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input className="input" type="date" value={form.log_date} onChange={(e) => setForm({ ...form, log_date: e.target.value })} required />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>{saving ? 'Saving...' : 'Add Fuel Log'}</button>
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
