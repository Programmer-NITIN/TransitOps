import { useState, useEffect } from 'react';
import api from '../services/api';
import './DashboardPage.css';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [recentTrips, setRecentTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/reports/dashboard'),
      api.get('/reports/recent-trips'),
    ]).then(([dash, trips]) => {
      setData(dash.data);
      setRecentTrips(trips.data);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="dash-loading">{[...Array(4)].map((_, i) => <div key={i} className="skeleton kpi-skeleton" />)}</div>;

  const kpis = [
    { label: 'Total Vehicles', value: data?.vehicles?.total || 0, icon: 'local_shipping', color: 'primary', sub: `${data?.vehicles?.available || 0} available` },
    { label: 'Active Trips', value: data?.trips?.active || 0, icon: 'route', color: 'info', sub: `${data?.trips?.completed || 0} completed` },
    { label: 'Total Drivers', value: data?.drivers?.total || 0, icon: 'badge', color: 'success', sub: `Avg safety: ${data?.drivers?.avg_safety || 0}` },
    { label: 'Total Revenue', value: `₹${Number(data?.total_revenue || 0).toLocaleString('en-IN')}`, icon: 'trending_up', color: 'revenue', sub: `Expenses: ₹${Number(data?.total_expenses || 0).toLocaleString('en-IN')}` },
  ];

  const statusBadge = (status) => {
    const cls = status.toLowerCase().replace(/\s+/g, '-');
    return <span className={`badge badge-${cls}`}>{status}</span>;
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Fleet Command Center</h1>
        <p className="page-subtitle">Real-time operational overview of your logistics network</p>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        {kpis.map((kpi) => (
          <div key={kpi.label} className={`card glass-panel kpi-card kpi-glow kpi-${kpi.color}`}>
            <div className="kpi-header">
              <span className="kpi-label font-label-md">{kpi.label}</span>
              <span className={`material-symbols-outlined kpi-icon kpi-icon-${kpi.color}`}>{kpi.icon}</span>
            </div>
            <div className="kpi-value">{kpi.value}</div>
            <div className="kpi-sub">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Fleet Status + Recent Trips */}
      <div className="dash-grid">
        {/* Fleet Status Breakdown */}
        <div className="card glass-panel">
          <h3 className="card-title">Fleet Status</h3>
          <div className="status-bars">
            {[
              { label: 'Available', value: data?.vehicles?.available, total: data?.vehicles?.total, color: '#10b981' },
              { label: 'On Trip', value: data?.vehicles?.on_trip, total: data?.vehicles?.total, color: '#4d8eff' },
              { label: 'In Shop', value: data?.vehicles?.in_shop, total: data?.vehicles?.total, color: '#f59e0b' },
            ].map((s) => (
              <div key={s.label} className="status-bar-row">
                <div className="status-bar-label">
                  <span className="status-dot" style={{ background: s.color }} />
                  <span>{s.label}</span>
                  <span className="status-count">{s.value || 0}</span>
                </div>
                <div className="status-bar-track">
                  <div className="status-bar-fill" style={{ width: `${((s.value || 0) / (s.total || 1)) * 100}%`, background: s.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Trips */}
        <div className="card glass-panel">
          <h3 className="card-title">Recent Trips</h3>
          <div className="recent-trips-list">
            {recentTrips.length === 0 ? (
              <div className="empty-state"><span className="material-symbols-outlined">route</span><p>No trips yet</p></div>
            ) : (
              recentTrips.slice(0, 5).map((trip) => (
                <div key={trip.id} className="trip-row">
                  <div className="trip-route">
                    <span className="trip-from">{trip.source?.split(',')[0]}</span>
                    <span className="material-symbols-outlined trip-arrow">arrow_forward</span>
                    <span className="trip-to">{trip.destination?.split(',')[0]}</span>
                  </div>
                  <div className="trip-meta">
                    <span className="trip-vehicle font-label-md">{trip.registration_number}</span>
                    {statusBadge(trip.status)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="dash-stats-row">
        <div className="card glass-panel stat-mini">
          <span className="material-symbols-outlined" style={{ color: '#f59e0b' }}>warning</span>
          <div>
            <div className="stat-mini-value">{data?.drivers?.expired_licenses || 0}</div>
            <div className="stat-mini-label">Expired Licenses</div>
          </div>
        </div>
        <div className="card glass-panel stat-mini">
          <span className="material-symbols-outlined" style={{ color: '#10b981' }}>verified</span>
          <div>
            <div className="stat-mini-value">{data?.trips?.total_km ? `${Number(data.trips.total_km).toLocaleString('en-IN')} km` : '0 km'}</div>
            <div className="stat-mini-label">Total Distance Covered</div>
          </div>
        </div>
        <div className="card glass-panel stat-mini">
          <span className="material-symbols-outlined" style={{ color: '#4d8eff' }}>speed</span>
          <div>
            <div className="stat-mini-value">{data?.drivers?.avg_safety || '0'}/10</div>
            <div className="stat-mini-label">Avg Safety Score</div>
          </div>
        </div>
      </div>
    </>
  );
}
