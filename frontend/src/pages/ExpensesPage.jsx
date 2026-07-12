import { useState, useEffect } from 'react';
import api from '../services/api';

const CATEGORIES = ['Fuel', 'Toll', 'Maintenance', 'Insurance', 'Parking', 'Fine', 'Other'];
const emptyForm = { vehicle_id: '', category: 'Fuel', amount: '', description: '', expense_date: '' };

const catIcon = (c) => ({ Fuel: 'local_gas_station', Maintenance: 'build', Insurance: 'shield', Toll: 'toll', Salary: 'payments', Penalty: 'gavel', Other: 'receipt_long' }[c] || 'receipt_long');
const catColor = (c) => ({ Fuel: '#f59e0b', Maintenance: '#4d8eff', Insurance: '#8b5cf6', Toll: '#ec4899', Salary: '#10b981', Penalty: '#ef4444', Other: '#94a3b8' }[c] || '#94a3b8');

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [filter, setFilter] = useState({ category: '' });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const load = () => {
    const p = new URLSearchParams();
    if (filter.category) p.set('category', filter.category);
    Promise.all([api.get(`/expenses?${p}`), api.get('/expenses/stats'), api.get('/vehicles')])
      .then(([e, s, v]) => { setExpenses(e.data); setStats(s.data); setVehicles(v.data); })
      .catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [filter.category]);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };
  const openEdit = (e) => { setEditing(e); setForm({ vehicle_id: e.vehicle_id || '', category: e.category, amount: e.amount, description: e.description, expense_date: e.expense_date?.split('T')[0] || '' }); setModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { ...form }; if (!payload.vehicle_id) delete payload.vehicle_id;
      if (editing) { await api.put(`/expenses/${editing.id}`, payload); showToast('Updated'); }
      else { await api.post('/expenses', payload); showToast('Added'); }
      setModal(false); load();
    } catch (err) { showToast(err.error || 'Failed', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete?')) return;
    try { await api.delete(`/expenses/${id}`); showToast('Deleted'); load(); }
    catch (err) { showToast(err.error || 'Failed', 'error'); }
  };

  const fmt = (n) => Number(n || 0).toLocaleString('en-IN');

  // Breakdown for mini-chart
  const breakdown = stats ? [
    { cat: 'Fuel', val: stats.fuel },
    { cat: 'Maintenance', val: stats.maintenance },
    { cat: 'Insurance', val: stats.insurance },
    { cat: 'Toll', val: stats.toll },
    { cat: 'Other', val: stats.other },
  ].filter(b => b.val > 0) : [];
  const maxBreakdown = Math.max(...breakdown.map(b => Number(b.val)), 1);

  return (
    <>
      {toast && <div className="toast-container"><div className={`toast toast-${toast.type}`}>{toast.msg}</div></div>}

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div><h1 className="page-title">Expense Ledger</h1><p className="page-subtitle">Track and categorize all operational expenses</p></div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setForm(emptyForm); setModal(true); }}><span className="material-symbols-outlined">add</span> Add Expense</button>
      </div>

      {/* Stats + Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="card glass-panel" style={{ padding: 24 }}>
          <div className="card-title">Total Expenses</div>
          <div style={{ fontFamily: "'Geist', sans-serif", fontSize: 42, fontWeight: 800, color: 'var(--on-surface)', marginBottom: 8 }}>₹{fmt(stats?.total_amount)}</div>
          <div style={{ fontSize: 13, color: 'var(--on-surface-variant)' }}>{stats?.total || 0} records across {breakdown.length} categories</div>
        </div>
        <div className="card glass-panel" style={{ padding: 24 }}>
          <div className="card-title">Category Breakdown</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {breakdown.map((b) => (
              <div key={b.cat} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: catColor(b.cat) }}>{catIcon(b.cat)}</span>
                <span style={{ fontSize: 12, color: 'var(--on-surface-variant)', width: 80 }}>{b.cat}</span>
                <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{ width: `${(Number(b.val) / maxBreakdown) * 100}%`, height: '100%', borderRadius: 3, background: catColor(b.cat), transition: 'width 0.5s ease' }} />
                </div>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--on-surface)', minWidth: 70, textAlign: 'right' }}>₹{fmt(b.val)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="fleet-filters glass-panel card">
        <div className="filter-group">
          <span className="material-symbols-outlined" style={{ color: 'var(--outline)', fontSize: 18 }}>filter_list</span>
          <select className="select filter-select" value={filter.category} onChange={(e) => setFilter({ category: e.target.value })}>
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead><tr><th>Category</th><th>Description</th><th>Amount</th><th>Vehicle</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? [...Array(5)].map((_, i) => <tr key={i}>{[...Array(6)].map((_, j) => <td key={j}><div className="skeleton" style={{ height: 16, width: '80%' }} /></td>)}</tr>) : expenses.length === 0 ? (
              <tr><td colSpan={6}><div className="empty-state"><span className="material-symbols-outlined">receipt_long</span><p>No expenses</p></div></td></tr>
            ) : expenses.map((e) => (
              <tr key={e.id}>
                <td><span className="badge" style={{ background: `${catColor(e.category)}20`, color: catColor(e.category) }}><span className="material-symbols-outlined" style={{ fontSize: 14, marginRight: 4 }}>{catIcon(e.category)}</span>{e.category}</span></td>
                <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.description}</td>
                <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600 }}>₹{fmt(e.amount)}</td>
                <td>{e.registration_number ? <span className="font-label-md" style={{ color: 'var(--primary)' }}>{e.registration_number}</span> : <span style={{ color: 'var(--outline)' }}>General</span>}</td>
                <td>{new Date(e.expense_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                <td><div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn-ghost" onClick={() => openEdit(e)}><span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit</span></button>
                  <button className="btn-ghost" onClick={() => handleDelete(e.id)}><span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--error)' }}>delete</span></button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontFamily: "'Geist', sans-serif", fontSize: 22, fontWeight: 700, marginBottom: 24 }}>{editing ? 'Edit Expense' : 'Add Expense'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Category</label>
                  <select className="select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
                </div>
                <div className="form-group"><label className="form-label">Vehicle (optional)</label>
                  <select className="select" value={form.vehicle_id} onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}>
                    <option value="">General expense</option>
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.registration_number}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group"><label className="form-label">Description</label><input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required /></div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Amount (₹)</label><input className="input" type="number" step="0.01" min="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></div>
                <div className="form-group"><label className="form-label">Date</label><input className="input" type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} required /></div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>{saving ? 'Saving...' : (editing ? 'Update' : 'Add Expense')}</button>
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
