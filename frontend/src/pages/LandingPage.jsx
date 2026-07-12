import { useNavigate } from 'react-router-dom';
import dashboardMockup from '../assets/dashboard-mockup.png';
import './LandingPage.css';

const FEATURES = [
  { icon: 'smart_toy', title: 'AI Dispatch', desc: 'Algorithmic route optimization predicting traffic, weather, and driver fatigue to ensure maximum efficiency.', accent: 'primary' },
  { icon: 'route', title: 'Live Telemetry', desc: 'Sub-second latency updates on vehicle location, fuel consumption, and vital engine diagnostics.', accent: 'tertiary' },
  { icon: 'build', title: 'Predictive Maintenance', desc: 'Identify component wear before failure occurs. Schedule servicing autonomously based on real usage data.', accent: 'primary' },
];

const FOOTER_LINKS = ['Privacy Policy', 'Terms of Service', 'Security', 'Status'];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-root">
      {/* ═══ Sticky Nav ═══ */}
      <header className="landing-nav">
        <div className="nav-brand">
          <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: 24 }}>explore</span>
          <span className="nav-logo">TransitOps</span>
        </div>
        <nav className="nav-links">
          <a href="#features">Features</a>
          <a href="#security">Security</a>
          <a href="#customers">Customers</a>
        </nav>
        <div className="nav-actions">
          <button className="nav-login" onClick={() => navigate('/login')}>Log in</button>
          <button className="nav-cta" onClick={() => navigate('/login')}>Get Started</button>
        </div>
      </header>

      <main>
        {/* ═══ Hero ═══ */}
        <section className="hero-section">
          <div className="hero-grid-bg" />
          <div className="hero-glow" />
          <div className="hero-content">
            <span className="hero-badge">Next-Gen Logistics</span>
            <h1 className="hero-title">Fleet Command Center</h1>
            <p className="hero-subtitle">
              Gain absolute control over your global operations with real-time telemetry, AI‑driven dispatching, and predictive maintenance. Scale with precision.
            </p>
            <div className="hero-buttons">
              <button className="btn-hero-primary" onClick={() => navigate('/login')}>Deploy Now</button>
              <button className="btn-hero-secondary" onClick={() => window.open('https://github.com/Programmer-NITIN/TransitOps', '_blank')}>View Documentation</button>
            </div>

            {/* Browser Mockup */}
            <div className="mockup-frame">
              <div className="mockup-titlebar">
                <span className="dot dot-red" />
                <span className="dot dot-yellow" />
                <span className="dot dot-blue" />
              </div>
              <img src={dashboardMockup} alt="TransitOps Fleet Command Dashboard" className="mockup-img" />
            </div>
          </div>
        </section>

        {/* ═══ Features ═══ */}
        <section className="features-section" id="features">
          <div className="features-inner">
            <div className="features-header">
              <h2 className="features-title">Real-time Intelligence</h2>
              <p className="features-subtitle">Transform raw telemetry into actionable operational directives instantly.</p>
            </div>
            <div className="features-grid">
              {FEATURES.map((f) => (
                <div key={f.title} className={`feature-card feature-card--${f.accent}`}>
                  <div className="feature-hover-bg" />
                  <div className={`feature-icon feature-icon--${f.accent}`}>
                    <span className="material-symbols-outlined">{f.icon}</span>
                  </div>
                  <h3 className="feature-name">{f.title}</h3>
                  <p className="feature-desc">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ Stats ═══ */}
        <section className="stats-section" id="customers">
          <div className="stats-inner">
            {[
              { value: '500+', label: 'Fleets Managed' },
              { value: '12K', label: 'Active Vehicles' },
              { value: '99.9%', label: 'Uptime SLA' },
              { value: '35%', label: 'Cost Reduction' },
            ].map((s) => (
              <div key={s.label} className="stat-item">
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ CTA ═══ */}
        <section className="cta-section">
          <div className="cta-bg" />
          <div className="cta-glow" />
          <div className="cta-content">
            <h2 className="cta-title">Ready to optimize your fleet?</h2>
            <p className="cta-subtitle">Join industry leaders utilizing TransitOps to drive efficiency and reduce operational costs.</p>
            <button className="cta-button" onClick={() => navigate('/login')}>Start Your Free Trial</button>
          </div>
        </section>
      </main>

      {/* ═══ Footer ═══ */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <span className="footer-logo">TransitOps</span>
            <span className="footer-copy">© 2025 TransitOps Enterprise Logistics. All rights reserved.</span>
          </div>
          <nav className="footer-links">
            {FOOTER_LINKS.map((l) => <a key={l} href="#">{l}</a>)}
          </nav>
        </div>
      </footer>
    </div>
  );
}
