
import { useState } from 'react'
import './App.css'

const sections = {
  Dashboard: [],
  Environmental: [
    ['Scope 1 Emissions', 'kg CO₂e'],
    ['Scope 2 Emissions', 'kg CO₂e'],
    ['Scope 3 Emissions', 'kg CO₂e'],
    ['Energy Used', 'kWh'],
    ['Water Withdrawn', 'm³'],
    ['Total Waste', 'kg'],
  ],
  Social: [
    ['Opening Headcount', 'people'],
    ['Closing Headcount', 'people'],
    ['Employee Departures', 'people'],
    ['Training Hours', 'hours'],
    ['Workplace Incidents', 'incidents'],
  ],
  Governance: [
    ['Total Board Members', 'people'],
    ['Independent Board Members', 'people'],
    ['Anti-corruption Training Eligible', 'people'],
    ['Anti-corruption Training Completed', 'people'],
    ['Ethics Cases Open', 'cases'],
    ['Ethics Cases Closed', 'cases'],
  ],
  Reports: [],
}

function App() {
  const [active, setActive] = useState('Dashboard')
  const [period, setPeriod] = useState('2026')
  const [status, setStatus] = useState('Draft')

  const metrics = Object.entries(sections)
    .filter(([name]) => name !== 'Dashboard' && name !== 'Reports')
    .flatMap(([pillar, items]) =>
      items.map(([name, unit]) => ({ pillar, name, unit }))
    )

  const visibleMetrics =
    active === 'Dashboard'
      ? metrics
      : sections[active]?.map(([name, unit]) => ({
          pillar: active,
          name,
          unit,
        })) ?? []

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">E</div>
          <div>
            <h2>EcoTrack</h2>
            <span>ESG REPORTING</span>
          </div>
        </div>

        <p className="nav-label">WORKSPACE</p>

        {Object.keys(sections).map((item) => (
          <button
            key={item}
            className={`nav-item ${active === item ? 'selected' : ''}`}
            onClick={() => setActive(item)}
          >
            <span>{{
              Dashboard: '▦',
              Environmental: '♧',
              Social: '♙',
              Governance: '◇',
              Reports: '▤',
            }[item]}</span>
            {item}
          </button>
        ))}

        <div className="sidebar-bottom">
          <span className="status-dot" />
          Demo workspace
          <small>Synthetic demonstration data</small>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="breadcrumb">Workspace / ESG Reporting</p>
            <h1>{active === 'Dashboard' ? 'ESG Overview' : active}</h1>
          </div>
          <div className="top-actions">
            <label>
              Reporting period
              <select
                value={period}
                onChange={(event) => setPeriod(event.target.value)}
              >
                <option value="2026">FY 2026</option>
                <option value="2025">FY 2025</option>
                <option value="2024">FY 2024</option>
              </select>
            </label>
            <span className="avatar">AD</span>
          </div>
        </header>

        <section className="welcome-panel">
          <div>
            <span className="eyebrow">SUSTAINABILITY WORKSPACE</span>
            <h2>Your ESG reporting, in one place.</h2>
            <p>
              Review environmental, social and governance metrics for FY {period}.
            </p>
          </div>
          <div className="report-badge">
            <span className="status-dot" />
            {status}
          </div>
        </section>

        <section className="pillar-grid">
          {[
            {
              name: 'Environmental',
              subtitle: 'Climate, energy, water and waste',
              icon: '♧',
              color: 'green',
            },
            {
              name: 'Social',
              subtitle: 'Workforce, training and safety',
              icon: '♙',
              color: 'blue',
            },
            {
              name: 'Governance',
              subtitle: 'Board, ethics and accountability',
              icon: '◇',
              color: 'purple',
            },
          ].map((pillar) => (
            <button
              key={pillar.name}
              className="pillar-card"
              onClick={() => setActive(pillar.name)}
            >
              <span className={`pillar-icon ${pillar.color}`}>
                {pillar.icon}
              </span>
              <span>
                <strong>{pillar.name}</strong>
                <small>{pillar.subtitle}</small>
              </span>
              <span className="arrow">↗</span>
            </button>
          ))}
        </section>

        <section className="section-heading">
          <div>
            <h2>{active === 'Dashboard' ? 'ESG Metrics' : `${active} Metrics`}</h2>
            <p>
              Units and data status are shown separately. No live company data
              has been connected yet.
            </p>
          </div>
          <span className="count-badge">{visibleMetrics.length} metrics</span>
        </section>

        {active === 'Reports' ? (
          <section className="empty-panel">
            <div className="empty-icon">▤</div>
            <h3>Reports</h3>
            <p>
              Report generation will be available after metrics are entered,
              reviewed and approved.
            </p>
          </section>
        ) : (
          <section className="metric-grid">
            {visibleMetrics.map((metric) => (
              <article className="metric-card" key={metric.name}>
                <div className="metric-top">
                  <span className={`mini-dot ${metric.pillar.toLowerCase()}`} />
                  <span className="metric-pillar">{metric.pillar}</span>
                  <span className="data-status">Not entered</span>
                </div>
                <h3>{metric.name}</h3>
                <div className="metric-value">—</div>
                <div className="metric-footer">
                  <span>Unit: {metric.unit}</span>
                  <span>FY {period}</span>
                </div>
              </article>
            ))}
          </section>
        )}

        <section className="workflow-panel">
          <div>
            <h2>Reporting workflow</h2>
            <p>Move the report through the review process as it is implemented.</p>
          </div>
          <div className="workflow-actions">
            <select
              aria-label="Demo workflow status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option>Draft</option>
              <option>Submitted</option>
              <option>Changes Requested</option>
              <option>Approved</option>
            </select>
            <span className="demo-note">UI demo only</span>
          </div>
        </section>

        <footer className="page-footer">
          ESG Reporting Prototype · Synthetic demo workspace · FY {period}
        </footer>
      </main>
    </div>
  )
}

export default App
