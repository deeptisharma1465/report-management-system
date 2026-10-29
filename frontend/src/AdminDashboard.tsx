import { useEffect, useState } from 'react'
import './Dashboard.css'
type Report = {
  id: number
  title: string
  description: string | null
  report_type: string
  report_date: string
  agency_id: number
  uploaded_by: number
  is_deleted: boolean
  created_at: string
  updated_at: string
}
type AdminDashboardProps = {
  userName?: string
  token?: string
  onLogout?: () => void
}

function AdminDashboard({
  userName = 'Admin',
  token,
  onLogout = () => {},
}: AdminDashboardProps) {
  const [activePage, setActivePage] = useState('Overview')
  const [reports, setReports] = useState<Report[]>([])
  const [reportsLoading, setReportsLoading] = useState(false)
  const [reportsError, setReportsError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const menuItems = [
    { name: 'Overview', icon: '⌂' },
    { name: 'Reports', icon: '▤' },
    { name: 'Users', icon: '♙' },
    { name: 'Agencies', icon: '▦' },
    { name: 'Audit Logs', icon: '◷' },
  ]

  const stats = [
    { title: 'Total Reports', value: '—', icon: '▤' },
    { title: 'Total Users', value: '—', icon: '♙' },
    { title: 'Total Agencies', value: '—', icon: '▦' },
    { title: 'Recent Activity', value: '—', icon: '◷' },
  ]

useEffect(() => {
  if (!token) return

  let cancelled = false

  async function fetchReports() {
    setReportsLoading(true)
    setReportsError('')

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'}/api/reports`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (!response.ok) {
        throw new Error(
          response.status === 401
            ? 'Session expired. Please sign in again.'
            : response.status === 403
              ? 'You do not have permission to view reports.'
              : 'Unable to load reports.',
        )
      }

      const data: Report[] = await response.json()

      if (!cancelled) {
        setReports(data)
      }
    } catch (err) {
      if (!cancelled) {
        setReportsError(
          err instanceof Error ? err.message : 'Unable to load reports.',
        )
      }
    } finally {
      if (!cancelled) {
        setReportsLoading(false)
      }
    }
  }

  void fetchReports()

  return () => {
    cancelled = true
  }
}, [token])
    const filteredReports = reports.filter((report) =>
  `${report.title} ${report.report_type} ${report.description ?? ''}`
    .toLowerCase()
    .includes(searchTerm.toLowerCase()),
)
  return (
    <main className="dashboard">
      <aside className="dashboard-sidebar">
        <div className="dashboard-brand">
          <span className="dashboard-brand-icon">R</span>
          <span>ReportFlow</span>
        </div>

        <p className="workspace-label">ADMIN WORKSPACE</p>

        <nav className="dashboard-nav">
          {menuItems.map((item) => (
            <button
              key={item.name}
              className={`nav-item ${
                activePage === item.name ? 'active' : ''
              }`}
              onClick={() => setActivePage(item.name)}
            >
              <span>{item.icon}</span>
              {item.name}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="role-badge">
            <span className="role-dot" />
            Administrator
          </div>

          <button className="logout-button" onClick={onLogout}>
            ↪ Sign out
          </button>
        </div>
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <p className="header-eyebrow">ADMINISTRATION</p>
            <h1>{activePage}</h1>
          </div>

          <div className="profile">
            <div className="profile-avatar">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <strong>{userName}</strong>
              <span>Administrator</span>
            </div>
          </div>
        </header>

        <div className="dashboard-content">
          
{activePage === 'Overview' ? (
  <>
    <div className="welcome-section">
      <div>
        <h2>Welcome back, {userName}!</h2>
        <p>
          Here is an overview of your report management workspace.
        </p>
      </div>
    </div>

    <div className="stats-grid">
      {[
        { title: 'Total Reports', value: reports.length, icon: '▤' },
        { title: 'Total Users', value: '—', icon: '♙' },
        { title: 'Total Agencies', value: '—', icon: '▦' },
        { title: 'Recent Activity', value: '—', icon: '◷' },
      ].map((stat) => (
        <article className="stat-card" key={stat.title}>
          <div className="stat-top">
            <span>{stat.title}</span>
            <span className="stat-icon">{stat.icon}</span>
          </div>
          <strong>{stat.value}</strong>
          <p>
            {stat.title === 'Total Reports'
              ? 'Active reports in the system'
              : 'API integration pending'}
          </p>
        </article>
      ))}
    </div>

    <section className="reports-panel">
      <div className="panel-heading">
        <div>
          <h3>Recent Reports</h3>
          <p>Reports available in your workspace.</p>
        </div>
        <button
          className="text-action"
          onClick={() => setActivePage('Reports')}
        >
          View all →
        </button>
      </div>

      {reportsLoading ? (
        <p>Loading reports...</p>
      ) : reportsError ? (
        <p role="alert" className="auth-error">
          {reportsError}
        </p>
      ) : reports.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">▤</div>
          <strong>No reports available</strong>
          <p>Reports will appear here when available.</p>
        </div>
      ) : (
        <div className="reports-table-wrapper">
          <table className="reports-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Report Date</th>
                <th>Agency ID</th>
              </tr>
            </thead>
            <tbody>
              {reports.slice(0, 5).map((report) => (
                <tr key={report.id}>
                  <td>{report.title}</td>
                  <td>{report.report_type}</td>
                  <td>{report.report_date}</td>
                  <td>{report.agency_id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  </>
) : activePage === 'Reports' ? (
  <section className="reports-panel">
    <div className="panel-heading">
      <div>
        <h3>All Reports</h3>
        <p>Search and review reports.</p>
      </div>
    </div>

    <div className="field report-search-field">
      <label htmlFor="reportSearch">Search reports</label>
      <input
        id="reportSearch"
        type="search"
        placeholder="Search by title, type or description..."
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
      />
    </div>

    {reportsLoading ? (
      <p>Loading reports...</p>
    ) : reportsError ? (
      <p role="alert" className="auth-error">
        {reportsError}
      </p>
    ) : filteredReports.length === 0 ? (
      <div className="empty-state">
        <div className="empty-icon">⌕</div>
        <strong>No matching reports</strong>
        <p>Try another search term or check back later.</p>
      </div>
    ) : (
      <div className="reports-table-wrapper">
        <table className="reports-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Type</th>
              <th>Report Date</th>
              <th>Agency ID</th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.map((report) => (
              <tr key={report.id}>
                <td>{report.title}</td>
                <td>{report.report_type}</td>
                <td>{report.report_date}</td>
                <td>{report.agency_id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </section>
) : (
  <section className="reports-panel page-placeholder">
    <div className="panel-heading">
      <div>
        <h3>{activePage}</h3>
        <p>Manage {activePage.toLowerCase()} in your workspace.</p>
      </div>
    </div>

    <div className="empty-state">
      <div className="empty-icon">✦</div>
      <strong>{activePage} page</strong>
      <p>
        This section is ready for its interface and backend API integration.
      </p>
    </div>
  </section>
)}

        </div>
      </section>
    </main>
  )
}

export default AdminDashboard
