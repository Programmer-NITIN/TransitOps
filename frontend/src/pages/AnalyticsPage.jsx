import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, Legend } from 'recharts';
import api from '../services/api';
import './AnalyticsPage.css';

const COLORS = ['#4d8eff', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#ef4444'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color }}>{p.name}: {typeof p.value === 'number' ? `₹${Number(p.value).toLocaleString('en-IN')}` : p.value}</p>)}
    </div>
  );
};

export default function AnalyticsPage() {
  const [dashboard, setDashboard] = useState(null);
  const [fuel, setFuel] = useState([]);
  const [expenseBreakdown, setExpenseBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/reports/dashboard'),
      api.get('/reports/fuel-efficiency'),
      api.get('/reports/expense-breakdown'),
    ]).then(([d, f, e]) => {
      setDashboard(d.data);
      setFuel(f.data);
      setExpenseBreakdown(e.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 24 }}>{[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 300, marginBottom: 16, borderRadius: 'var(--radius-lg)' }} />)}</div>;

  const fmt = (n) => Number(n || 0).toLocaleString('en-IN');

  // Fleet utilization data
  const fleetData = [
    { name: 'Available', value: Number(dashboard?.vehicles?.available || 0), color: '#10b981' },
    { name: 'On Trip', value: Number(dashboard?.vehicles?.on_trip || 0), color: '#4d8eff' },
    { name: 'In Shop', value: Number(dashboard?.vehicles?.in_shop || 0), color: '#f59e0b' },
  ].filter(d => d.value > 0);

  // Fuel consumption bar data
  const fuelData = fuel.map(f => ({
    name: f.registration_number,
    model: f.name_model,
    liters: Number(f.total_liters),
    cost: Number(f.total_fuel_cost),
  })).filter(f => f.liters > 0);

  // Expense pie data
  const expensePie = expenseBreakdown.map((e, i) => ({
    name: e.category,
    value: Number(e.total),
    color: COLORS[i % COLORS.length],
  }));

  // Revenue vs Expenses
  const revExpData = [
    { name: 'Revenue', value: Number(dashboard?.total_revenue || 0), fill: '#10b981' },
    { name: 'Expenses', value: Number(dashboard?.total_expenses || 0), fill: '#ef4444' },
    { name: 'Profit', value: Number(dashboard?.total_revenue || 0) - Number(dashboard?.total_expenses || 0), fill: '#4d8eff' },
  ];

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Analytics Center</h1>
        <p className="page-subtitle">Deep insights into your fleet operations and financial performance</p>
      </div>

      {/* Revenue Summary */}
      <div className="analytics-summary">
        {[
          { label: 'Total Revenue', value: `₹${fmt(dashboard?.total_revenue)}`, icon: 'trending_up', color: '#10b981' },
          { label: 'Total Expenses', value: `₹${fmt(dashboard?.total_expenses)}`, icon: 'trending_down', color: '#ef4444' },
          { label: 'Net Profit', value: `₹${fmt(Number(dashboard?.total_revenue || 0) - Number(dashboard?.total_expenses || 0))}`, icon: 'account_balance', color: '#4d8eff' },
          { label: 'Distance Covered', value: `${fmt(dashboard?.trips?.total_km)} km`, icon: 'straighten', color: '#8b5cf6' },
        ].map((s) => (
          <div key={s.label} className="card glass-panel analytics-stat">
            <span className="material-symbols-outlined" style={{ fontSize: 24, color: s.color }}>{s.icon}</span>
            <div>
              <div style={{ fontFamily: "'Geist', sans-serif", fontSize: 24, fontWeight: 800, color: 'var(--on-surface)' }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginTop: 2 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="charts-grid">
        {/* Fleet Utilization Pie */}
        <div className="card glass-panel chart-card">
          <h3 className="card-title">Fleet Utilization</h3>
          {fleetData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={fleetData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={4} dataKey="value">
                  {fleetData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="transparent" />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(val) => <span style={{ color: 'var(--on-surface-variant)', fontSize: 12 }}>{val}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="empty-state"><p>No fleet data</p></div>}
        </div>

        {/* Revenue vs Expenses Bar */}
        <div className="card glass-panel chart-card">
          <h3 className="card-title">Revenue vs Expenses</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={revExpData} barSize={48}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="name" tick={{ fill: 'var(--on-surface-variant)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--on-surface-variant)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {revExpData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="charts-grid">
        {/* Fuel Consumption */}
        <div className="card glass-panel chart-card">
          <h3 className="card-title">Fuel Consumption by Vehicle</h3>
          {fuelData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={fuelData} layout="vertical" barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                <XAxis type="number" tick={{ fill: 'var(--on-surface-variant)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" width={100} tick={{ fill: 'var(--on-surface-variant)', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="liters" fill="#f59e0b" radius={[0, 4, 4, 0]} name="Liters" />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="empty-state"><p>No fuel data yet</p></div>}
        </div>

        {/* Expense Breakdown Pie */}
        <div className="card glass-panel chart-card">
          <h3 className="card-title">Expense Breakdown</h3>
          {expensePie.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={expensePie} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {expensePie.map((entry, i) => <Cell key={i} fill={entry.color} stroke="transparent" />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="empty-state"><p>No expense data</p></div>}
        </div>
      </div>
    </>
  );
}
