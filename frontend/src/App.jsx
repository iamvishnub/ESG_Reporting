import { useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';
import { api, setCredentials, clearCredentials } from './services/api';
import './App.css';
const pillars = ['Environmental', 'Social', 'Governance'];
const reviewStatuses = [
  'Draft',
  'Submitted',
  'Changes Requested',
  'Approved',
];
const initialForm = {
  name: '',
  pillar: 'Environmental',
  unit: '',
  value: '',
  reportingPeriod: '2026',
  dataStatus: 'Measured',
  source: '',
  method: '',
  assumptions: '',
  owner: '',
};
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [metrics, setMetrics] = useState([]);
  const [approvedMetrics, setApprovedMetrics] = useState([]);
  const [reportSummary, setReportSummary] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState('');
  const [form, setForm] = useState(initialForm);
  const [selectedPeriod, setSelectedPeriod] = useState('All');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [auditMetricId, setAuditMetricId] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState('');
  const [reviewingId, setReviewingId] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('Submitted');
  const loadMetrics = async () => {
    try {
      setError('');
      const data = await api.get('/api/metrics');
      setMetrics(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Unable to load metrics.');
    } finally {
      setLoading(false);
    }
  };
  const loadReports = async () => {
    setReportLoading(true);
    setReportError('');
    try {
      const [summary, approved] = await Promise.all([
        api.get('/api/reports/summary'),
        api.get('/api/reports/approved'),
      ]);
      setReportSummary(summary);
      setApprovedMetrics(Array.isArray(approved) ? approved : []);
    } catch (err) {
      setReportError(err.message || 'Unable to load approved reports.');
    } finally {
      setReportLoading(false);
    }
  };
  const downloadApprovedReport = () => {
    const reportMetrics = approvedMetrics.filter((metric) =>
      selectedPeriod === 'All' || String(metric.reportingPeriod || '') === selectedPeriod
    );

    if (reportMetrics.length === 0) {
      setReportError('There are no approved metrics for the selected reporting period. Refresh reports after approving metrics.');
      return;
    }

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 16;
    const usableWidth = pageWidth - margin * 2;
    let y = 18;

    const addPageIfNeeded = (height = 8) => {
      if (y + height > pageHeight - 16) {
        doc.addPage();
        y = 18;
      }
    };
    const addText = (text, options = {}) => {
      const { size = 10, bold = false, gap = 2 } = options;
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setFontSize(size);
      const lines = doc.splitTextToSize(String(text ?? '—'), usableWidth);
      addPageIfNeeded(lines.length * (size * 0.42) + gap);
      doc.text(lines, margin, y);
      y += lines.length * (size * 0.42) + gap;
    };

    doc.setTextColor(23, 82, 67);
    addText('ESG REPORT', { size: 22, bold: true, gap: 3 });
    doc.setTextColor(40, 55, 50);
    addText(`Reporting period: ${selectedPeriod === 'All' ? 'All available periods' : selectedPeriod}`, { size: 11, bold: true });
    addText(`Generated on: ${new Date().toLocaleString()}`, { size: 9, gap: 5 });
    addText('Purpose and scope', { size: 13, bold: true, gap: 3 });
    addText('This report summarizes approved ESG metric records available in this application for the selected reporting period. Only records with Approved review status are included. Values, units, sources and methods are reproduced from the saved metric records.', { gap: 4 });
    addText('Environmental, Social and Governance', { size: 13, bold: true, gap: 3 });
    addText('Environmental covers topics such as emissions, energy, water and waste. Social covers workforce, training and workplace safety. Governance covers board independence, anti-corruption training and ethics reporting. Carbon data alone does not represent all three ESG pillars.', { gap: 4 });

    const pillarsForReport = ['Environmental', 'Social', 'Governance'];
    pillarsForReport.forEach((pillar) => {
      const pillarMetrics = reportMetrics.filter((metric) => metric.pillar === pillar);
      addPageIfNeeded(14);
      doc.setFillColor(232, 242, 237);
      doc.roundedRect(margin, y - 4, usableWidth, 9, 1.5, 1.5, 'F');
      doc.setTextColor(23, 82, 67);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(`${pillar} (${pillarMetrics.length} approved metric${pillarMetrics.length === 1 ? '' : 's'})`, margin + 3, y + 2);
      y += 12;
      doc.setTextColor(40, 55, 50);

      if (pillarMetrics.length === 0) {
        addText('No approved metrics recorded for this pillar in the selected period.', { gap: 4 });
        return;
      }

      pillarMetrics.forEach((metric, index) => {
        addPageIfNeeded(32);
        addText(`${index + 1}. ${metric.name || 'Unnamed metric'}`, { size: 11, bold: true, gap: 2 });
        addText(`Result: ${metric.value === null || metric.value === undefined ? 'Unavailable' : `${metric.value} ${metric.unit || ''}`.trim()}`);
        addText(`Reporting period: ${metric.reportingPeriod || 'Not specified'} | Data status: ${metric.dataStatus || 'Not specified'} | Review status: ${metric.reviewStatus || 'Approved'}`);
        addText(`Method / formula: ${metric.method || 'Not provided'}`);
        addText(`Data source: ${metric.source || 'Not provided'} | Responsible owner: ${metric.owner || 'Not provided'}`);
        if (metric.assumptions) addText(`Assumptions / exclusions: ${metric.assumptions}`);
        y += 2;
      });
    });

    addPageIfNeeded(28);
    addText('Interpretation and limitations', { size: 13, bold: true, gap: 3 });
    addText('This report reflects the approved metric records available in the prototype. Missing metrics are not interpreted as zero. The application does not currently attach evidence files to each metric or store immutable generated report versions; therefore, this PDF is a generated snapshot of the approved records at download time. Verify reporting boundaries, units, calculation methods and source records before external publication. This prototype does not by itself establish compliance with a reporting standard.', { gap: 4 });
    addText(`Approved metrics included: ${reportMetrics.length}`, { size: 10, bold: true, gap: 2 });

    const safePeriod = selectedPeriod === 'All' ? 'all-periods' : selectedPeriod.replace(/[^a-zA-Z0-9_-]/g, '-');
    doc.save(`ESG-Report-${safePeriod}.pdf`);
    setReportError('');
  };
  useEffect(() => {
    if (isLoggedIn) loadMetrics();
  }, [isLoggedIn]);
  const updateForm = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (!form.name.trim() || !form.unit.trim()) {
      setError('Metric name and unit are required.');
      return;
    }
    if (!form.reportingPeriod.trim()) {
      setError('Reporting period is required.');
      return;
    }
    const unavailable =
      form.dataStatus === 'Unavailable' || form.dataStatus === 'N/A';
    if (unavailable && !form.assumptions.trim()) {
      setError('Provide a reason for Unavailable or N/A data.');
      return;
    }
    if (!form.source.trim() || !form.method.trim() || !form.owner.trim()) {
      setError('Source, calculation method, and owner are required.');
      return;
    }
    let metricValue = null;
    if (!unavailable) {
      if (form.value.trim() === '') {
        setError('Enter a numeric value for this metric.');
        return;
      }
      metricValue = Number(form.value);
      if (!Number.isFinite(metricValue) || metricValue < 0) {
        setError('Metric value must be a valid non-negative number.');
        return;
      }
    }
    const payload = {
      name: form.name.trim(),
      pillar: form.pillar,
      unit: form.unit.trim(),
      value: metricValue,
      reportingPeriod: form.reportingPeriod.trim(),
      dataStatus: form.dataStatus,
      source: form.source.trim(),
      method: form.method.trim(),
      assumptions: form.assumptions.trim(),
      owner: form.owner.trim(),
      reviewStatus: 'Draft',
    };
    setSaving(true);
    try {
if (editingId !== null) {
  await api.put(`/api/metrics/${editingId}/edit`, payload);
  setSuccess('Metric updated successfully.');
  setEditingId(null);
} else {
  await api.post('/api/metrics', payload);
  setSuccess('Metric saved successfully as Draft.');
}      setForm(initialForm);
      setSuccess('Metric saved successfully as Draft.');
      await loadMetrics();
    } catch (err) {
      setError(err.message || 'Unable to save metric.');
    } finally {
      setSaving(false);
    }
  };
  const handleEdit = (metric) => {
  setEditingId(metric.id);
  setForm({
    name: metric.name || '',
    pillar: metric.pillar || 'Environmental',
    unit: metric.unit || '',
    value: metric.value ?? '',
    reportingPeriod: metric.reportingPeriod || '2026',
    dataStatus: metric.dataStatus || 'Measured',
    source: metric.source || '',
    method: metric.method || '',
    assumptions: metric.assumptions || '',
    owner: metric.owner || '',
  });
  setError('');
  setSuccess('');
  document.getElementById('add-metric')?.scrollIntoView({
    behavior: 'smooth',
  });
};
  const updateReview = async (metricId, nextStatus) => {
    setError('');
    setSuccess('');
    try {
      await api.patch(`/api/metrics/${metricId}/review`, { reviewStatus: nextStatus });
      setSuccess(`Review status changed to ${nextStatus}.`);
      setReviewingId(null);
      await loadMetrics();
      if (auditMetricId === metricId) {
        await viewAuditHistory(metricId);
      }
    } catch (err) {
      setError(err.message || 'Unable to update review status.');
    }
  };
  const viewAuditHistory = async (metricId) => {
    setAuditMetricId(metricId);
    setAuditLogs([]);
    setAuditError('');
    setAuditLoading(true);
    try {
      const logs = await api.get(`/api/metrics/${metricId}/audit`);
      setAuditLogs(Array.isArray(logs) ? logs : []);
    } catch (err) {
      setAuditError(err.message || 'Unable to load audit history.');
    } finally {
      setAuditLoading(false);
    }
  };
  const availablePeriods = [
    ...new Set(
      metrics
        .map((metric) => metric.reportingPeriod)
        .filter(Boolean)
    ),
  ].sort((a, b) => b.localeCompare(a));
  const filteredMetrics =
    selectedPeriod === 'All'
      ? metrics
      : metrics.filter(
          (metric) => metric.reportingPeriod === selectedPeriod
        );
  const countByPillar = (pillar) =>
    filteredMetrics.filter((metric) => metric.pillar === pillar).length;
  const approvedCount = filteredMetrics.filter(
    (metric) => metric.reviewStatus === 'Approved'
  ).length;
  const draftCount = filteredMetrics.filter(
    (metric) =>
      !metric.reviewStatus || metric.reviewStatus === 'Draft'
  ).length;
  const submittedCount = filteredMetrics.filter(
    (metric) => metric.reviewStatus === 'Submitted'
  ).length;
  const unavailableCount = filteredMetrics.filter(
    (metric) =>
      metric.dataStatus === 'Unavailable' || metric.dataStatus === 'N/A'
  ).length;
  const canTransition = (status) => {
    if (status === 'Draft') return ['Submitted'];
    if (status === 'Submitted') {
      return ['Changes Requested', 'Approved'];
    }
    if (status === 'Changes Requested') return ['Submitted'];
    return [];
  };
  const formatValue = (metric) => {
    if (
      metric.value === null ||
      metric.value === undefined ||
      metric.dataStatus === 'Unavailable' ||
      metric.dataStatus === 'N/A'
    ) {
      return '—';
    }
    return `${metric.value} ${metric.unit || ''}`.trim();
  };
  const handleLogin = async (event) => {
    event.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      setCredentials(username.trim(), password);
      await api.get('/api/metrics');
      const roleByUsername = {
        admin: 'ADMIN',
        contributor: 'CONTRIBUTOR',
        reviewer: 'REVIEWER',
        viewer: 'REPORT_VIEWER',
      };
      setUserRole(roleByUsername[username.trim().toLowerCase()] || 'USER');
      setIsLoggedIn(true);
      setPassword('');
    } catch (err) {
      clearCredentials();
      setLoginError('Login failed. Check your username and password.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    clearCredentials();
    setIsLoggedIn(false);
    setUsername('');
    setPassword('');
    setUserRole('');
    setMetrics([]);
    setApprovedMetrics([]);
    setReportSummary(null);
    setAuditMetricId(null);
    setAuditLogs([]);
    setError('');
    setSuccess('');
  };

  if (!isLoggedIn) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '24px', background: '#f3f6f9' }}>
        <form onSubmit={handleLogin} style={{ width: '100%', maxWidth: '420px', background: '#ffffff', padding: '36px', borderRadius: '18px', boxShadow: '0 16px 48px rgba(20, 40, 70, 0.12)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', display: 'grid', placeItems: 'center', background: '#176b55', color: '#ffffff', fontWeight: 800, fontSize: '24px' }}>E</div>
            <div>
              <h1 style={{ margin: 0, fontSize: '24px', color: '#182b28' }}>ESG Reporting</h1>
              <p style={{ margin: '5px 0 0', color: '#64746f' }}>Sign in to your reporting workspace</p>
            </div>
          </div>
          <label style={{ display: 'block', marginBottom: '16px', fontWeight: 600, color: '#243b36' }}>
            Username
            <input autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required style={{ boxSizing: 'border-box', display: 'block', width: '100%', padding: '12px', marginTop: '7px', border: '1px solid #ccd7d3', borderRadius: '8px', fontSize: '16px' }} />
          </label>
          <label style={{ display: 'block', marginBottom: '18px', fontWeight: 600, color: '#243b36' }}>
            Password
            <input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required style={{ boxSizing: 'border-box', display: 'block', width: '100%', padding: '12px', marginTop: '7px', border: '1px solid #ccd7d3', borderRadius: '8px', fontSize: '16px' }} />
          </label>
          {loginError && <p role="alert" style={{ color: '#b42318', background: '#fff0ef', padding: '10px 12px', borderRadius: '8px' }}>{loginError}</p>}
          <button type="submit" disabled={loginLoading} style={{ width: '100%', border: 0, borderRadius: '8px', padding: '13px', background: '#176b55', color: '#ffffff', fontWeight: 700, fontSize: '16px', cursor: loginLoading ? 'wait' : 'pointer' }}>
            {loginLoading ? 'Signing in...' : 'Sign in'}
          </button>
          <div style={{ marginTop: '22px', padding: '14px', borderRadius: '10px', background: '#f4f8f6', color: '#52645e', fontSize: '13px', lineHeight: 1.7 }}>
            <strong>Demo accounts</strong><br />
            Admin: admin / Admin@123<br />
            Contributor: contributor / Contributor@123<br />
            Reviewer: reviewer / Reviewer@123<br />
            Report viewer: viewer / Viewer@123
          </div>
          <p style={{ color: '#75837e', fontSize: '12px', margin: '18px 0 0' }}>Local development prototype</p>
        </form>
      </div>
    );
  }

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">E</div>
          <div>
            <h2>ESG Report</h2>
            <p>Reporting workspace</p>
          </div>
        </div>
        <nav className="sidebar-nav">
          <a href="#dashboard" className="nav-item active">
            Dashboard
          </a>
          <a href="#esg-understanding" className="nav-item">ESG Understanding</a>
          <a href="#metrics" className="nav-item">
            ESG Metrics
          </a>
          {['ADMIN', 'CONTRIBUTOR'].includes(userRole) && (
            <a href="#add-metric" className="nav-item">Add Metric</a>
          )}
          <a href="#audit-history" className="nav-item">
            Audit History
          </a>
          <a href="#reports" className="nav-item" onClick={loadReports}>
            Reports
          </a>
        </nav>
        <div className="sidebar-footer">
          <p>ESG Reporting Prototype</p>
          <small>Local development environment</small>
        </div>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">REPORTING WORKSPACE</p>
            <h1>ESG Overview</h1>
          </div>
          <label className="period-filter">
            Reporting period
            <select
              value={selectedPeriod}
              onChange={(event) => setSelectedPeriod(event.target.value)}
            >
              <option value="All">All periods</option>
              {availablePeriods.map((period) => (
                <option key={period} value={period}>
                  {period}
                </option>
              ))}
            </select>
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' }}>
            <span style={{ fontSize: '13px', color: '#52645e' }}>{username} · {userRole.replaceAll('_', ' ')}</span>
            <button type="button" className="secondary-button" onClick={handleLogout}>Log out</button>
          </div>
        </header>
        <section id="dashboard" className="welcome-panel">
          <div>
            <p className="eyebrow">SUSTAINABILITY PERFORMANCE</p>
            <h2>Environmental, Social & Governance</h2>
            <p>
              Record metrics, document supporting evidence, and manage
              the review process.
            </p>
          </div>
          {['ADMIN', 'CONTRIBUTOR'].includes(userRole) && (
            <a className="primary-button dashboard-link" href="#add-metric">+ Add Metric</a>
          )}
        </section>

        <section id="esg-understanding" style={{ margin: '24px 0', padding: '24px', background: '#ffffff', border: '1px solid #e0e8e4', borderRadius: '16px', boxShadow: '0 4px 16px rgba(24, 43, 40, 0.04)' }}>
          <div style={{ marginBottom: '18px' }}>
            <p className="eyebrow">ASSIGNMENT DESIGN NOTE</p>
            <h2 style={{ margin: '0 0 8px', color: '#182b28' }}>Understanding ESG Reporting</h2>
            <p style={{ margin: 0, color: '#52645e', lineHeight: 1.7 }}>
              Environmental, Social and Governance (ESG) reporting helps stakeholders understand an organisation’s environmental impact, treatment of people, and accountability in decision-making. Carbon emissions are important, but carbon reporting alone does not describe workforce practices, workplace safety, board independence or ethical conduct.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            <article style={{ padding: '18px', borderRadius: '12px', background: '#eff8f2', borderTop: '4px solid #25845a' }}>
              <h3 style={{ margin: '0 0 8px', color: '#176b45' }}>Environmental</h3>
              <p style={{ margin: '0 0 10px', color: '#40564b', lineHeight: 1.6 }}>Measures how an organisation affects the natural environment.</p>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#40564b', lineHeight: 1.7 }}>
                <li>Scope 1, Scope 2 and Scope 3 emissions (kg or tonnes CO₂e)</li>
                <li>Energy consumption by source (common unit such as kWh)</li>
                <li>Water withdrawal (m³)</li>
                <li>Total waste, recycled waste and recycling rate (%)</li>
              </ul>
            </article>
            <article style={{ padding: '18px', borderRadius: '12px', background: '#eff6ff', borderTop: '4px solid #3478bd' }}>
              <h3 style={{ margin: '0 0 8px', color: '#235b95' }}>Social</h3>
              <p style={{ margin: '0 0 10px', color: '#40516a', lineHeight: 1.6 }}>Looks at how the organisation treats and supports people.</p>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#40516a', lineHeight: 1.7 }}>
                <li>Workforce at period start and end</li>
                <li>Employee departures and turnover (%)</li>
                <li>Total training hours and hours per employee</li>
                <li>Workplace injury incidents</li>
              </ul>
            </article>
            <article style={{ padding: '18px', borderRadius: '12px', background: '#faf3ff', borderTop: '4px solid #8b5bb5' }}>
              <h3 style={{ margin: '0 0 8px', color: '#704092' }}>Governance</h3>
              <p style={{ margin: '0 0 10px', color: '#5b4b68', lineHeight: 1.6 }}>Focuses on ethical conduct, oversight and transparent accountability.</p>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#5b4b68', lineHeight: 1.7 }}>
                <li>Total board members and independent members</li>
                <li>Independent board percentage (%)</li>
                <li>Eligible people and anti-corruption training completion (%)</li>
                <li>Ethics cases, with open/closed status reported in aggregate</li>
              </ul>
            </article>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginTop: '14px' }}>
            <div style={{ padding: '16px', borderRadius: '12px', background: '#f7f9f8' }}>
              <h3 style={{ margin: '0 0 8px', color: '#243b36', fontSize: '16px' }}>Supply-chain context</h3>
              <p style={{ margin: 0, color: '#52645e', lineHeight: 1.7 }}>Suppliers, manufacturers, logistics providers, distributors, wholesalers and retailers can contribute relevant data. Each stakeholder’s records remain distinct. Supplier workforce or board figures must not be added to the reporting organisation’s own totals; supplier disclosures are shown separately unless a metric explicitly defines otherwise.</p>
            </div>
            <div style={{ padding: '16px', borderRadius: '12px', background: '#f7f9f8' }}>
              <h3 style={{ margin: '0 0 8px', color: '#243b36', fontSize: '16px' }}>How to interpret the data</h3>
              <p style={{ margin: 0, color: '#52645e', lineHeight: 1.7 }}>Each metric should identify its unit, formula or method, source, reporting period, reporting boundary and responsible owner. Evidence supports a claim but does not by itself verify accuracy. Measured and estimated values must be distinguished; unavailable or not-applicable data needs a reason and must not be treated as zero. Review status should remain visible.</p>
            </div>
          </div>
          <p style={{ margin: '16px 0 0', paddingTop: '14px', borderTop: '1px solid #e5ece8', color: '#64746f', fontSize: '13px', lineHeight: 1.6 }}>
            Reporting completeness is different from ESG performance. This prototype supports ESG data collection and review; it should not be described as compliant with a reporting standard unless that mapping has been verified. Organisation-level emissions inventory and product footprint are different measures and must not be substituted for one another.
          </p>
        </section>

        {error && (
          <div className="alert error-alert" role="alert">
            {error}
          </div>
        )}
        {success && (
          <div className="alert success-alert" role="status">
            {success}
          </div>
        )}
        <section className="summary-grid">
          <article className="summary-card">
            <p>Total Metrics</p>
            <h2>{filteredMetrics.length}</h2>
          </article>
          <article className="summary-card">
            <p>Approved</p>
            <h2>{approvedCount}</h2>
          </article>
          <article className="summary-card">
            <p>Awaiting Review</p>
            <h2>{submittedCount}</h2>
          </article>
          <article className="summary-card">
            <p>Drafts</p>
            <h2>{draftCount}</h2>
          </article>
        </section>
        <section className="pillar-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">THREE PILLARS</p>
              <h2>ESG Categories</h2>
            </div>
          </div>
          <div className="pillar-grid">
            {pillars.map((pillar) => (
              <article className="pillar-card" key={pillar}>
                <div className="pillar-card-top">
                  <h3>{pillar}</h3>
                  <span>{countByPillar(pillar)}</span>
                </div>
                <p>
                  {pillar === 'Environmental' &&
                    'Energy, emissions, water and waste.'}
                  {pillar === 'Social' &&
                    'Workforce, training, safety and turnover.'}
                  {pillar === 'Governance' &&
                    'Board independence, ethics and compliance.'}
                </p>
              </article>
            ))}
          </div>
        </section>
        <section id="metrics" className="metrics-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">DATA REGISTER</p>
              <h2>ESG Metrics</h2>
              <p className="section-description">
                Values and metadata recorded for each reporting period.
              </p>
            </div>
            <span className="metric-count">
              {filteredMetrics.length} metrics
            </span>
          </div>
          {loading ? (
            <p className="loading-message">Loading metrics...</p>
          ) : filteredMetrics.length === 0 ? (
            <div className="empty-state">
              <h3>No metrics found</h3>
              <p>Add a metric or choose a different reporting period.</p>
            </div>
          ) : (
            <div className="metric-grid">
              {filteredMetrics.map((metric) => {
                const currentStatus = metric.reviewStatus || 'Draft';
                const transitions = canTransition(currentStatus);
                return (
                  <article className="metric-card" key={metric.id}>
                    <div className="metric-card-header">
                      <span className="pillar-tag">{metric.pillar}</span>
                      <span
                        className={`review-badge ${currentStatus
                          .toLowerCase()
                          .replaceAll(' ', '-')}`}
                      >
                        {currentStatus}
                      </span>
                    </div>
                    <h3>{metric.name}</h3>
                    <p className="metric-value">{formatValue(metric)}</p>
                    <div className="metric-details">
                      <p>
                        <span>Reporting period</span>
                        <strong>{metric.reportingPeriod || '—'}</strong>
                      </p>
                      <p>
                        <span>Data status</span>
                        <strong>{metric.dataStatus || '—'}</strong>
                      </p>
                      <p>
                        <span>Data owner</span>
                        <strong>{metric.owner || '—'}</strong>
                      </p>
                      <p>
                        <span>Source</span>
                        <strong>{metric.source || '—'}</strong>
                      </p>
                    </div>
                    {metric.method && (
                      <p className="metric-metadata">
                        <strong>Method:</strong> {metric.method}
                      </p>
                    )}
                    {metric.assumptions && (
                      <p className="metric-metadata">
                        <strong>Assumptions / notes:</strong>{' '}
                        {metric.assumptions}
                      </p>
                    )}
                    <div className="metric-actions">
                      {['ADMIN', 'REVIEWER'].includes(userRole) && (
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => viewAuditHistory(metric.id)}
                        >
                          View Audit History
                        </button>
                      )}
                      {['ADMIN', 'CONTRIBUTOR'].includes(userRole) && ['Draft', 'Changes Requested'].includes(currentStatus) && (
  <button
    type="button"
    className="secondary-button"
    onClick={() => handleEdit(metric)}
  >
    Edit Metric
  </button>
)}
                      {['ADMIN', 'REVIEWER'].includes(userRole) && transitions.length > 0 && (
                        <div className="review-action">
                          {reviewingId === metric.id ? (
                            <>
                              <select
                                value={reviewStatus}
                                onChange={(event) =>
                                  setReviewStatus(event.target.value)
                                }
                                aria-label="New review status"
                              >
                                {transitions.map((status) => (
                                  <option key={status} value={status}>
                                    {status}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                className="primary-button"
                                onClick={() =>
                                  updateReview(metric.id, reviewStatus)
                                }
                              >
                                Confirm
                              </button>
                              <button
                                type="button"
                                className="secondary-button"
                                onClick={() => setReviewingId(null)}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              className="primary-button"
                              onClick={() => {
                                setReviewStatus(transitions[0]);
                                setReviewingId(metric.id);
                              }}
                            >
                              Update Review
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
        {['ADMIN', 'CONTRIBUTOR'].includes(userRole) && (
        <section id="add-metric" className="form-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">DATA COLLECTION</p>
<h2>{editingId !== null ? 'Edit ESG Metric' : 'Add ESG Metric'}</h2>              <p className="section-description">
                Record the value, source, calculation method and owner.
              </p>
            </div>
          </div>
          <form className="metric-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <label>
                Metric name *
                <input
                  name="name"
                  value={form.name}
                  onChange={updateForm}
                  placeholder="e.g. Scope 1 emissions"
                  required
                />
              </label>
              <label>
                ESG pillar *
                <select
                  name="pillar"
                  value={form.pillar}
                  onChange={updateForm}
                  required
                >
                  {pillars.map((pillar) => (
                    <option key={pillar} value={pillar}>
                      {pillar}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Value
                <input
                  name="value"
                  type="number"
                  min="0"
                  step="any"
                  value={form.value}
                  onChange={updateForm}
                  placeholder="Enter numeric value"
                  disabled={
                    form.dataStatus === 'Unavailable' ||
                    form.dataStatus === 'N/A'
                  }
                  required={
                    form.dataStatus !== 'Unavailable' &&
                    form.dataStatus !== 'N/A'
                  }
                />
              </label>
              <label>
                Unit *
                <input
                  name="unit"
                  value={form.unit}
                  onChange={updateForm}
                  placeholder="e.g. tCO₂e, kWh, %"
                  required
                />
              </label>
              <label>
                Reporting period *
                <input
                  name="reportingPeriod"
                  value={form.reportingPeriod}
                  onChange={updateForm}
                  placeholder="e.g. 2026"
                  required
                />
              </label>
              <label>
                Data status *
                <select
                  name="dataStatus"
                  value={form.dataStatus}
                  onChange={updateForm}
                  required
                >
                  <option value="Measured">Measured</option>
                  <option value="Estimated">Estimated</option>
                  <option value="Unavailable">Unavailable</option>
                  <option value="N/A">N/A</option>
                </select>
              </label>
              <label>
                Data source *
                <input
                  name="source"
                  value={form.source}
                  onChange={updateForm}
                  placeholder="e.g. electricity bills"
                  required
                />
              </label>
              <label>
                Data owner *
                <input
                  name="owner"
                  value={form.owner}
                  onChange={updateForm}
                  placeholder="Responsible person or team"
                  required
                />
              </label>
              <label className="full-width">
                Calculation method *
                <textarea
                  name="method"
                  value={form.method}
                  onChange={updateForm}
                  placeholder="Explain how the value was calculated"
                  rows="2"
                  required
                />
              </label>
              <label className="full-width">
                Assumptions / notes
                <textarea
                  name="assumptions"
                  value={form.assumptions}
                  onChange={updateForm}
                  placeholder="Document assumptions, limitations or reason for unavailable data"
                  rows="3"
                  required={
                    form.dataStatus === 'Unavailable' ||
                    form.dataStatus === 'N/A'
                  }
                />
              </label>
            </div>
            <button
              type="submit"
              className="primary-button"
              disabled={saving}
            >
{saving
  ? 'Saving...'
  : editingId !== null
    ? 'Update Metric'
    : 'Save Metric as Draft'}        
        </button>
        {editingId !== null && (
  <button
    type="button"
    className="secondary-button"
    onClick={() => {
      setEditingId(null);
      setForm(initialForm);
      setError('');
      setSuccess('');
    }}
  >
    Cancel Edit
  </button>
)}
          </form>
        </section>
        )}
        {['ADMIN', 'REVIEWER'].includes(userRole) && (
        <section id="audit-history" className="workflow-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">TRACEABILITY</p>
              <h2>Audit History</h2>
              <p className="section-description">
                Review recorded status transitions for a selected metric.
              </p>
            </div>
          </div>
          {auditMetricId === null ? (
            <div className="empty-state">
              <p>Select “View Audit History” on a metric card.</p>
            </div>
          ) : (
            <>
              <h3>Metric #{auditMetricId}</h3>
              {auditLoading ? (
                <p className="loading-message">Loading audit history...</p>
              ) : auditError ? (
                <p className="error-alert">{auditError}</p>
              ) : auditLogs.length === 0 ? (
                <p className="empty-state">
                  No audit records found for this metric.
                </p>
              ) : (
                <div className="audit-list">
                  {auditLogs.map((log) => (
                    <article className="metric-card" key={log.id}>
                      <p>
                        <strong>Action:</strong> {log.action}
                      </p>
                      <p>
                        <strong>Status:</strong>{' '}
                        {log.previousStatus || '—'} → {log.newStatus || '—'}
                      </p>
                      <p>
                        <strong>Changed by:</strong>{' '}
                        {log.changedBy || '—'}
                      </p>
                      <p>
                        <strong>Timestamp:</strong>{' '}
                        {log.changedAt
                          ? new Date(log.changedAt).toLocaleString()
                          : '—'}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
        )}
        <section id="reports" className="workflow-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">REPORTING</p>
              <h2>Approved ESG Reports</h2>
              <p className="section-description">
                Summary and metrics approved for reporting.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="primary-button"
                onClick={loadReports}
                disabled={reportLoading}
              >
                {reportLoading ? 'Loading...' : 'Refresh Reports'}
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={downloadApprovedReport}
                disabled={reportLoading || approvedMetrics.length === 0}
                title="Download a PDF containing approved metrics for the selected period"
              >
                Download Report PDF
              </button>
            </div>
          </div>
          {reportError && (
            <div className="alert error-alert" role="alert">
              {reportError}
            </div>
          )}
          {reportSummary && (
            <div className="summary-grid">
              <article className="summary-card">
                <p>Total Approved</p>
                <h2>{reportSummary.totalApprovedMetrics}</h2>
              </article>
              <article className="summary-card">
                <p>Environmental</p>
                <h2>{reportSummary.environmentalCount}</h2>
              </article>
              <article className="summary-card">
                <p>Social</p>
                <h2>{reportSummary.socialCount}</h2>
              </article>
              <article className="summary-card">
                <p>Governance</p>
                <h2>{reportSummary.governanceCount}</h2>
              </article>
            </div>
          )}
          {reportLoading ? (
            <p className="loading-message">Loading approved reports...</p>
          ) : (
            <div className="report-table-wrapper">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>Pillar</th>
                    <th>Value</th>
                    <th>Period</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {approvedMetrics.map((metric) => (
                    <tr key={metric.id}>
                      <td>{metric.name}</td>
                      <td>{metric.pillar}</td>
                      <td>{metric.value ?? '—'} {metric.unit || ''}</td>
                      <td>{metric.reportingPeriod || '—'}</td>
                      <td>{metric.reviewStatus}</td>
                    </tr>
                  ))}
                  {approvedMetrics.length === 0 && !reportError && (
                    <tr>
                      <td colSpan="5">No approved metrics found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <footer className="app-footer">
          <p>ESG Reporting Prototype · Local development</p>
          <p>
            {unavailableCount} metric(s) marked Unavailable or N/A in this
            reporting view.
          </p>
        </footer>
      </main>
    </div>
  );
}
export default App;
