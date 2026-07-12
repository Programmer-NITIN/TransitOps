import { useState, useEffect } from 'react';
import api from '../services/api';
import './FleetPage.css';

const VEHICLE_TYPES = ['Truck', 'Van', 'Trailer', 'Tanker', 'Pickup', 'Bus'];
const STATUSES = ['Available', 'On Trip', 'In Shop', 'Retired'];

const emptyForm = { registration_number: '', name_model: '', type: 'Truck', max_load_capacity_kg: '', current_odometer_km: '', acquisition_cost: '', region: '' };

export default function FleetPage() {
  const [vehicles, setVehicles] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [filter, setFilter] = useState({ status: '', type: '', search: '' });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const load = () => {
    const params = new URLSearchParams();
    if (filter.status) params.set('status', filter.status);
    if (filter.type) params.set('type', filter.type);
    if (filter.search) params.set('search', filter.search);
    Promise.all([
      api.get(`/vehicles?${params}`),
      api.get('/vehicles/stats'),
    ]).then(([v, s]) => { setVehicles(v.data); setStats(s.data); })
      .catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter.status, filter.type]);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const openAdd = () => { setEditing(null); setForm(emptyForm); setModal(true); };
  const openEdit = (v) => { setEditing(v); setForm({ registration_number: v.registration_number, name_model: v.name_model, type: v.type, max_load_capacity_kg: v.max_load_capacity_kg, current_odometer_km: v.current_odometer_km, acquisition_cost: v.acquisition_cost, region: v.region || '' }); setModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/vehicles/${editing.id}`, form);
        showToast('Vehicle updated successfully');
      } else {
        await api.post('/vehicles', form);
        showToast('Vehicle added successfully');
      }
      setModal(false);
      load();
    } catch (err) { showToast(err.error || 'Failed to save', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this vehicle?')) return;
    try {
      await api.delete(`/vehicles/${id}`);
      showToast('Vehicle deleted');
      load();
    } catch (err) { showToast(err.error || 'Cannot delete', 'error'); }
  };

  const statusBadge = (s) => <span className={`badge badge-${s.toLowerCase().replace(/\s+/g, '-')}`}>{s}</span>;

  return (
    <>
      {toast && <div className="toast-container"><div className={`toast toast-${toast.type}`}>{toast.msg}</div></div>}

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Fleet Inventory</h1>
          <p className="page-subtitle">Manage your vehicle fleet and track utilization</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <span className="material-symbols-outlined">add</span> Add Vehicle
        </button>
      </div>

      {/* KPI Row */}
      {stats && (
        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
          {[
            { label: 'Total Fleet', value: stats.total, icon: 'local_shipping', cls: 'primary' },
            { label: 'Available', value: stats.available, icon: 'check_circle', cls: 'available' },
            { label: 'On Trip', value: stats.on_trip, icon: 'route', cls: 'on-trip' },
            { label: 'In Shop', value: stats.in_shop, icon: 'build', cls: 'in-shop' },
            { label: 'Fleet Value', value: `₹${Number(stats.total_fleet_value).toLocaleString('en-IN')}`, icon: 'payments', cls: 'revenue' },
          ].map((k) => (
            <div key={k.label} className={`card glass-panel kpi-glow fleet-kpi`}>
              <span className={`material-symbols-outlined kpi-icon kpi-icon-${k.cls}`}>{k.icon}</span>
              <div className="fleet-kpi-value">{k.value}</div>
              <div className="fleet-kpi-label font-label-md">{k.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="fleet-filters glass-panel card">
        <div className="filter-group">
          <span className="material-symbols-outlined" style={{ color: 'var(--outline)', fontSize: 18 }}>filter_list</span>
          <select className="select filter-select" value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}>
            <option value="">All Status</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="select filter-select" value={filter.type} onChange={(e) => setFilter({ ...filter, type: e.target.value })}>
            <option value="">All Types</option>
            {VEHICLE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="filter-search">
          <span className="material-symbols-outlined" style={{ color: 'var(--outline)', fontSize: 18, position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}>search</span>
          <input className="input" style={{ paddingLeft: 36 }} placeholder="Search by reg number or model..." value={filter.search} onChange={(e) => setFilter({ ...filter, search: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && load()} />
        </div>
      </div>

      {/* Table */}
      <div className="card glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Registration</th><th>Model</th><th>Type</th><th>Capacity (kg)</th><th>Odometer (km)</th><th>Region</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? [...Array(5)].map((_, i) => (
              <tr key={i}>{[...Array(8)].map((_, j) => <td key={j}><div className="skeleton" style={{ height: 16, width: '80%' }} /></td>)}</tr>
            )) : vehicles.length === 0 ? (
              <tr><td colSpan={8}><div className="empty-state"><span className="material-symbols-outlined">local_shipping</span><p>No vehicles found</p></div></td></tr>
            ) : vehicles.map((v) => (
              <tr key={v.id}>
                <td><span className="font-label-md" style={{ color: 'var(--primary)', letterSpacing: '0.02em' }}>{v.registration_number}</span></td>
                <td>{v.name_model}</td>
                <td><span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--on-surface-variant)' }}>{v.type}</span></td>
                <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>{Number(v.max_load_capacity_kg).toLocaleString()}</td>
                <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>{Number(v.current_odometer_km).toLocaleString()}</td>
                <td>{v.region || '—'}</td>
                <td>{statusBadge(v.status)}</td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn-ghost" title="Edit" onClick={() => openEdit(v)}><span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit</span></button>
                    <button className="btn-ghost" title="Delete" onClick={() => handleDelete(v.id)}><span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--error)' }}>delete</span></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontFamily: "'Geist', sans-serif", fontSize: 22, fontWeight: 700, marginBottom: 24 }}>
              {editing ? 'Edit Vehicle' : 'Add New Vehicle'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Registration No.</label><input className="input" name="registration_number" value={form.registration_number} onChange={(e) => setForm({ ...form, registration_number: e.target.value })} required /></div>
                <div className="form-group"><label className="form-label">Model / Name</label><input className="input" name="name_model" value={form.name_model} onChange={(e) => setForm({ ...form, name_model: e.target.value })} required /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Type</label><select className="select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{VEHICLE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
                <div className="form-group"><label className="form-label">Region</label><input className="input" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Max Capacity (kg)</label><input className="input" type="number" step="0.01" min="0.01" value={form.max_load_capacity_kg} onChange={(e) => setForm({ ...form, max_load_capacity_kg: e.target.value })} required /></div>
                <div className="form-group"><label className="form-label">Acquisition Cost (₹)</label><input className="input" type="number" step="0.01" min="0.01" value={form.acquisition_cost} onChange={(e) => setForm({ ...form, acquisition_cost: e.target.value })} required /></div>
              </div>
              <div className="form-group"><label className="form-label">Current Odometer (km)</label><input className="input" type="number" step="0.01" min="0" value={form.current_odometer_km} onChange={(e) => setForm({ ...form, current_odometer_km: e.target.value })} /></div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>{saving ? 'Saving...' : (editing ? 'Update Vehicle' : 'Add Vehicle')}</button>
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
