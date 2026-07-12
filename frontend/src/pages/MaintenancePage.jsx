import { useState, useEffect } from 'react';
import api from '../services/api';

const TYPES = ['Preventive', 'Corrective', 'Emergency'];
const emptyForm = { vehicle_id: '', type: 'Preventive', description: '', cost: '', service_date: '', next_due_date: '' };

export default function MaintenancePage() {
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const load = () => {
    Promise.all([api.get('/maintenance'), api.get('/maintenance/stats'), api.get('/vehicles')])
      .then(([m, s, v]) => { setLogs(m.data); setStats(s.data); setVehicles(v.data); })
      .catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };
  const openEdit = (m) => { setEditing(m); setForm({ vehicle_id: m.vehicle_id, type: m.type, description: m.description, cost: m.cost, service_date: m.service_date?.split('T')[0] || '', next_due_date: m.next_due_date?.split('T')[0] || '' }); setModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) { await api.put(`/maintenance/${editing.id}`, form); showToast('Updated'); }
      else { await api.post('/maintenance', form); showToast('Added'); }
      setModal(false); load();
    } catch (err) { showToast(err.error || 'Failed', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this record?')) return;
    try { await api.delete(`/maintenance/${id}`); showToast('Deleted'); load(); }
    catch (err) { showToast(err.error || 'Failed', 'error'); }
  };

  const typeIcon = (t) => t === 'Preventive' ? 'build' : t === 'Corrective' ? 'handyman' : 'warning';
  const typeColor = (t) => t === 'Preventive' ? '#4d8eff' : t === 'Corrective' ? '#f59e0b' : '#ef4444';
  const isOverdue = (d) => d && new Date(d) < new Date();
  const fmt = (n) => Number(n || 0).toLocaleString('en-IN');

  return (
    <>
      {toast && <div className="toast-container"><div className={`toast toast-${toast.type}`}>{toast.msg}</div></div>}

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div><h1 className="page-title">Maintenance Tracker</h1><p className="page-subtitle">Track vehicle service history and upcoming maintenance</p></div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setForm(emptyForm); setModal(true); }}><span className="material-symbols-outlined">add</span> Log Service</button>
      </div>

      {stats && (
        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
          {[
            { label: 'Total Records', value: stats.total, icon: 'build', cls: 'primary' },
            { label: 'Total Cost', value: `₹${fmt(stats.total_cost)}`, icon: 'payments', cls: 'revenue' },
            { label: 'Preventive', value: stats.preventive, icon: 'build', cls: 'on-trip' },
            { label: 'Corrective', value: stats.corrective, icon: 'handyman', cls: 'in-shop' },
            { label: 'Overdue', value: stats.overdue, icon: 'warning', cls: 'in-shop' },
          ].map((k) => (
            <div key={k.label} className="card glass-panel fleet-kpi">
              <span className={`material-symbols-outlined kpi-icon kpi-icon-${k.cls}`}>{k.icon}</span>
              <div className="fleet-kpi-value">{k.value}</div>
              <div className="fleet-kpi-label font-label-md">{k.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="card glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead><tr><th>Vehicle</th><th>Type</th><th>Description</th><th>Cost</th><th>Service Date</th><th>Next Due</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? [...Array(3)].map((_, i) => <tr key={i}>{[...Array(7)].map((_, j) => <td key={j}><div className="skeleton" style={{ height: 16, width: '80%' }} /></td>)}</tr>) : logs.length === 0 ? (
              <tr><td colSpan={7}><div className="empty-state"><span className="material-symbols-outlined">build</span><p>No maintenance records</p></div></td></tr>
            ) : logs.map((m) => (
              <tr key={m.id}>
                <td><span style={{ color: 'var(--primary)' }} className="font-label-md">{m.registration_number}</span><br /><span style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>{m.name_model}</span></td>
                <td><span className="badge" style={{ background: `${typeColor(m.type)}20`, color: typeColor(m.type) }}><span className="material-symbols-outlined" style={{ fontSize: 14, marginRight: 4 }}>{typeIcon(m.type)}</span>{m.type}</span></td>
                <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.description}</td>
                <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>₹{fmt(m.cost)}</td>
                <td>{new Date(m.service_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                <td>{m.next_due_date ? <span style={{ color: isOverdue(m.next_due_date) ? 'var(--error)' : 'var(--on-surface-variant)' }}>{isOverdue(m.next_due_date) && <span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: 'middle', marginRight: 4 }}>warning</span>}{new Date(m.next_due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span> : '—'}</td>
                <td><div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn-ghost" onClick={() => openEdit(m)}><span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit</span></button>
                  <button className="btn-ghost" onClick={() => handleDelete(m.id)}><span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--error)' }}>delete</span></button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontFamily: "'Geist', sans-serif", fontSize: 22, fontWeight: 700, marginBottom: 24 }}>{editing ? 'Edit Record' : 'Log Maintenance'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Vehicle</label>
                  <select className="select" value={form.vehicle_id} onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })} required>
                    <option value="">Select vehicle...</option>
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.registration_number} — {v.name_model}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Type</label>
                  <select className="select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select>
                </div>
              </div>
              <div className="form-group"><label className="form-label">Description</label><input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required /></div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Cost (₹)</label><input className="input" type="number" step="0.01" min="0" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} required /></div>
                <div className="form-group"><label className="form-label">Service Date</label><input className="input" type="date" value={form.service_date} onChange={(e) => setForm({ ...form, service_date: e.target.value })} required /></div>
              </div>
              <div className="form-group"><label className="form-label">Next Due Date (optional)</label><input className="input" type="date" value={form.next_due_date} onChange={(e) => setForm({ ...form, next_due_date: e.target.value })} /></div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>{saving ? 'Saving...' : (editing ? 'Update' : 'Log Service')}</button>
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
