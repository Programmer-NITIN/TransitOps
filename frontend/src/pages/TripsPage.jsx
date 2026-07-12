import { useState, useEffect } from 'react';
import api from '../services/api';
import { exportToCsv } from '../utils/csvExport';
import './TripsPage.css';

const STATUSES = ['Draft', 'Dispatched', 'Completed', 'Cancelled'];
const emptyForm = { vehicle_id: '', driver_id: '', source: '', destination: '', planned_distance_km: '', cargo_weight_kg: '', revenue: '' };

export default function TripsPage() {
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [filter, setFilter] = useState({ status: '', search: '' });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const load = () => {
    const p = new URLSearchParams();
    if (filter.status) p.set('status', filter.status);
    if (filter.search) p.set('search', filter.search);
    api.get(`/trips?${p}`).then((d) => setTrips(d.data)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => {
    Promise.all([api.get('/vehicles'), api.get('/drivers')]).then(([v, d]) => { setVehicles(v.data); setDrivers(d.data); });
    load();
  }, [filter.status]);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await api.post('/trips', form); showToast('Trip created'); setModal(false); load(); }
    catch (err) { showToast(err.error || err.message || 'Failed', 'error'); }
    finally { setSaving(false); }
  };

  const changeStatus = async (id, status) => {
    try { await api.patch(`/trips/${id}/status`, { status }); showToast(`Trip ${status.toLowerCase()}`); load(); }
    catch (err) { showToast(err.error || err.message || 'Failed', 'error'); }
  };

  const statusBadge = (s) => <span className={`badge badge-${s.toLowerCase()}`}>{s}</span>;
  const fmt = (n) => Number(n || 0).toLocaleString('en-IN');

  return (
    <>
      {toast && <div className="toast-container"><div className={`toast toast-${toast.type}`}>{toast.msg}</div></div>}

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div><h1 className="page-title">Trip Dispatching</h1><p className="page-subtitle">Plan, dispatch, and track your logistics routes</p></div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => exportToCsv('trips.csv', ['Source','Destination','Vehicle','Driver','Status','Distance (km)','Cargo (kg)','Revenue'], trips, ['source','destination','registration_number','driver_name','status','planned_distance_km','cargo_weight_kg','revenue'])}><span className="material-symbols-outlined">download</span> Export CSV</button>
          <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setModal(true); }}><span className="material-symbols-outlined">add</span> New Trip</button>
        </div>
      </div>

      {/* Summary */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {[
          { label: 'Total', value: trips.length, icon: 'route', cls: 'primary' },
          { label: 'Dispatched', value: trips.filter(t => t.status === 'Dispatched').length, icon: 'local_shipping', cls: 'on-trip' },
          { label: 'Completed', value: trips.filter(t => t.status === 'Completed').length, icon: 'check_circle', cls: 'available' },
          { label: 'Revenue', value: `₹${fmt(trips.reduce((s, t) => s + Number(t.revenue || 0), 0))}`, icon: 'payments', cls: 'revenue' },
        ].map((k) => (
          <div key={k.label} className="card glass-panel fleet-kpi">
            <span className={`material-symbols-outlined kpi-icon kpi-icon-${k.cls}`}>{k.icon}</span>
            <div className="fleet-kpi-value">{k.value}</div>
            <div className="fleet-kpi-label font-label-md">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="fleet-filters glass-panel card">
        <div className="filter-group">
          <span className="material-symbols-outlined" style={{ color: 'var(--outline)', fontSize: 18 }}>filter_list</span>
          <select className="select filter-select" value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}>
            <option value="">All Status</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="filter-search">
          <span className="material-symbols-outlined" style={{ color: 'var(--outline)', fontSize: 18, position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}>search</span>
          <input className="input" style={{ paddingLeft: 36 }} placeholder="Search routes..." value={filter.search} onChange={(e) => setFilter({ ...filter, search: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && load()} />
        </div>
      </div>

      {/* Trip Cards */}
      <div className="trips-grid">
        {loading ? [...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 180, borderRadius: 'var(--radius-lg)' }} />) : trips.length === 0 ? (
          <div className="empty-state" style={{ gridColumn: '1 / -1' }}><span className="material-symbols-outlined">route</span><p>No trips found</p></div>
        ) : trips.map((t) => (
          <div key={t.id} className="trip-card glass-panel card">
            <div className="trip-card-header">
              <div className="trip-route-display">
                <div className="trip-point"><span className="trip-dot source-dot" /><span className="trip-city">{t.source?.split(',')[0]}</span></div>
                <div className="trip-line"><span className="material-symbols-outlined">arrow_forward</span><span className="trip-distance">{fmt(t.planned_distance_km)} km</span></div>
                <div className="trip-point"><span className="trip-dot dest-dot" /><span className="trip-city">{t.destination?.split(',')[0]}</span></div>
              </div>
              {statusBadge(t.status)}
            </div>
            <div className="trip-card-details">
              <div className="trip-detail"><span className="material-symbols-outlined">local_shipping</span>{t.registration_number} — {t.name_model}</div>
              <div className="trip-detail"><span className="material-symbols-outlined">badge</span>{t.driver_name}</div>
              {t.cargo_weight_kg && <div className="trip-detail"><span className="material-symbols-outlined">inventory_2</span>{fmt(t.cargo_weight_kg)} / {fmt(t.max_load_capacity_kg)} kg</div>}
              {t.revenue > 0 && <div className="trip-detail"><span className="material-symbols-outlined">payments</span>₹{fmt(t.revenue)}</div>}
            </div>
            <div className="trip-card-actions">
              {t.status === 'Draft' && <button className="btn btn-sm btn-primary" onClick={() => changeStatus(t.id, 'Dispatched')}><span className="material-symbols-outlined">send</span> Dispatch</button>}
              {t.status === 'Dispatched' && <button className="btn btn-sm" style={{ background: '#10b981', color: '#fff' }} onClick={() => changeStatus(t.id, 'Completed')}><span className="material-symbols-outlined">check</span> Complete</button>}
              {(t.status === 'Draft' || t.status === 'Dispatched') && <button className="btn btn-sm btn-ghost-danger" onClick={() => changeStatus(t.id, 'Cancelled')}>Cancel</button>}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontFamily: "'Geist', sans-serif", fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Create New Trip</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Vehicle</label>
                  <select className="select" value={form.vehicle_id} onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })} required>
                    <option value="">Select vehicle...</option>
                    {vehicles.filter(v => v.status === 'Available').map(v => <option key={v.id} value={v.id}>{v.registration_number} — {v.name_model}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Driver</label>
                  <select className="select" value={form.driver_id} onChange={(e) => setForm({ ...form, driver_id: e.target.value })} required>
                    <option value="">Select driver...</option>
                    {drivers.filter(d => d.status === 'Available').map(d => <option key={d.id} value={d.id}>{d.name} — {d.license_number}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Source</label><input className="input" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="Mumbai Warehouse, MH" required /></div>
                <div className="form-group"><label className="form-label">Destination</label><input className="input" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} placeholder="Pune Distribution Hub, MH" required /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Distance (km)</label><input className="input" type="number" step="0.1" min="0.1" value={form.planned_distance_km} onChange={(e) => setForm({ ...form, planned_distance_km: e.target.value })} required /></div>
                <div className="form-group"><label className="form-label">Cargo Weight (kg)</label><input className="input" type="number" step="0.1" min="0.1" value={form.cargo_weight_kg} onChange={(e) => setForm({ ...form, cargo_weight_kg: e.target.value })} required /></div>
              </div>
              <div className="form-group"><label className="form-label">Revenue (₹)</label><input className="input" type="number" step="0.01" min="0" value={form.revenue} onChange={(e) => setForm({ ...form, revenue: e.target.value })} /></div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>{saving ? 'Creating...' : 'Create Trip'}</button>
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
