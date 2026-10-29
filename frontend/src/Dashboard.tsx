
import { useState } from 'react'
import './Dashboard.css'

type DashboardProps = {
  role: 'admin' | 'user'
  userName?: string
  onLogout: () => void
}

function Dashboard({ role, userName = 'User', onLogout }: DashboardProps) {
  const isAdmin = role === 'admin'
  const [activePage, setActivePage] = useState('Overview')

  const navigation = isAdmin
    ? ['Overview', 'All Reports', 'Users', 'Agencies', 'Audit Logs']
    : ['Overview', 'My Reports', 'Create Report']

  const stats = isAdmin
    ? [
        { label: 'Total Reports', value: '—', icon: '▤' },
        { label: 'Total Users', value: '—', icon: '♙' },
        { label: 'Agencies', value: '—', icon: '⌂' },
        { label: 'Pending Review', value: '—', icon: '◷' },
      ]
    : [
        { label: 'My Reports', value: '—', icon: '▤' },
        { label: 'Recently Updated', value: '—', icon: '◷' },
        { label: 'Available Reports', value: '—', icon: '▣' },
      ]

  return (
    <main className="dashboard">
      <aside className="dashboard-sidebar">
        <div className="dashboard-brand">
          <span className="dashboard-brand-icon">R</span>
          <span>ReportFlow</span>
        </div>

        <div className="workspace-label">WORKSPACE</div>

        <nav className="dashboard-nav">
          {navigation.map((item) => (
            <button
              key={item}
              className={`nav-item ${activePage === item ? 'active' : ''}`}
              onClick={() => setActivePage(item)}
            >
              <span>{item === 'Overview' ? '⌂' : '▤'}</span>
              {item}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="role-badge">
            <span className="role-dot" />
            {isAdmin ? 'Administrator' : 'Standard User'}
          </div>
          <button className="logout-button" onClick={onLogout}>
            ↪ Sign out
          </button>
        </div>
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <p className="header-eyebrow">
              {isAdmin ? 'ADMINISTRATION' : 'YOUR WORKSPACE'}
            </p>
            <h1>{activePage}</h1>
          </div>

          <div className="profile">
            <div className="profile-avatar">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <strong>{userName}</strong>
              <span>{isAdmin ? 'Administrator' : 'User'}</span>
            </div>
          </div>
        </header>

        <div className="dashboard-content">
          <div className="welcome-section">
            <div>
              <h2>
                {activePage === 'Overview'
                  ? `Welcome back, ${userName.split(' ')[0]}!`
                  : activePage}
              </h2>
              <p>
                {isAdmin
                  ? 'Manage reports, users, agencies and workspace activity.'
                  : 'View and manage the reports available to your account.'}
              </p>
            </div>

            {!isAdmin && (
              <button
                className="primary-action"
                onClick={() => setActivePage('Create Report')}
              >
                + Create Report
              </button>
            )}
          </div>

          {activePage === 'Overview' ? (
            <>
              <div className="stats-grid">
                {stats.map((stat) => (
                  <article className="stat-card" key={stat.label}>
                    <div className="stat-top">
                      <span>{stat.label}</span>
                      <span className="stat-icon">{stat.icon}</span>
                    </div>
                    <strong>{stat.value}</strong>
                    <p>Connect the API to load live data</p>
                  </article>
                ))}
              </div>

              <section className="reports-panel">
                <div className="panel-heading">
                  <div>
                    <h3>{isAdmin ? 'Recent Reports' : 'My Recent Reports'}</h3>
                    <p>Your report activity will appear here.</p>
                  </div>
                  <button
                    className="text-action"
                    onClick={() =>
                      setActivePage(isAdmin ? 'All Reports' : 'My Reports')
                    }
                  >
                    View all →
                  </button>
                </div>

                <div className="empty-state">
                  <div className="empty-icon">▤</div>
                  <strong>No reports to display yet</strong>
                  <p>
                    Report data will appear here once the reports API is
                    connected.
                  </p>
                </div>
              </section>
            </>
          ) : (
            <section className="reports-panel page-placeholder">
              <div className="empty-state">
                <div className="empty-icon">✦</div>
                <strong>{activePage}</strong>
                <p>
                  This section is ready for its page UI and API integration.
                </p>
              </div>
            </section>
          )}
        </div>
      </section>
    </main>
  )
}

export default Dashboard
