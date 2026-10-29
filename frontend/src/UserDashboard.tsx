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

type UserDashboardProps = {
  userName?: string
  token: string
  agencyId: number
  onLogout?: () => void
}

function UserDashboard({
  userName = 'User',
  token,
  agencyId,
  onLogout = () => {},
}: UserDashboardProps) {
  const [activePage, setActivePage] = useState('Overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [reportTitle, setReportTitle] = useState('')
  const [reportType, setReportType] = useState('General')
  const [reportDescription, setReportDescription] = useState('')
  const [message, setMessage] = useState('')
  const [reports, setReports] = useState<Report[]>([])
  const [reportsLoading, setReportsLoading] = useState(false)
  const [reportsError, setReportsError] = useState('')
  const [creatingReport, setCreatingReport] = useState(false)
  

  const menuItems = [
    { name: 'Overview', icon: '⌂' },
    { name: 'My Reports', icon: '▤' },
    { name: 'Upload Report', icon: '+' },
  ]

  const stats = [
  {
    title: 'My Reports',
    value: reports.length,
    icon: '▤',
  },
  {
  title: 'Last Activity (min ago)',
  value: reports.length
  ? `${Math.max(
      0,
      Math.floor(
        (Date.now() -
          new Date(reports[0].updated_at).getTime()) /
          60000,
      ),
    )} min`
  : '—',
   icon: '◷',
},
  {
    title: 'Available Reports',
    value: reports.length,
    icon: '▣',
  },
]

  useEffect(() => {
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
    } catch (error) {
      if (!cancelled) {
        setReportsError(
          error instanceof Error ? error.message : 'Unable to load reports.',
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
useEffect(() => {
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
    } catch (error) {
      if (!cancelled) {
        setReportsError(
          error instanceof Error ? error.message : 'Unable to load reports.',
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

async function handleCreateReport(
  event: React.FormEvent<HTMLFormElement>,
) {
  event.preventDefault()
  setMessage('')
  setReportsError('')
  setCreatingReport(true)

  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'}/api/reports`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: reportTitle.trim(),
          description: reportDescription.trim() || null,
          report_type: reportType,
          report_date: new Date().toISOString().slice(0, 10),
          agency_id: agencyId,
        }),
      },
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      throw new Error(
        errorData?.detail || 'Unable to create report.',
      )
    }

    const createdReport: Report = await response.json()

    setReports((previous) => [createdReport, ...previous])
    setReportTitle('')
    setReportType('General')
    setReportDescription('')
    setMessage('Report created successfully!')
  } catch (error) {
    setReportsError(
      error instanceof Error ? error.message : 'Unable to create report.',
    )
  } finally {
    setCreatingReport(false)
  }
}

  return (
    <main className="dashboard">
      <aside className="dashboard-sidebar">
        <div className="dashboard-brand">
          <span className="dashboard-brand-icon">R</span>
          <span>ReportFlow</span>
        </div>

        <p className="workspace-label">MY WORKSPACE</p>

        <nav className="dashboard-nav">
          {menuItems.map((item) => (
            <button
              key={item.name}
              className={`nav-item ${
                activePage === item.name ? 'active' : ''
              }`}
              onClick={() => {
                setActivePage(item.name)
                setMessage('')
              }}
            >
              <span>{item.icon}</span>
              {item.name}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="role-badge">
            <span className="role-dot" />
            Standard User
          </div>

          <button className="logout-button" onClick={onLogout}>
            ↪ Sign out
          </button>
        </div>
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <p className="header-eyebrow">YOUR WORKSPACE</p>
            <h1>{activePage}</h1>
          </div>

          <div className="profile">
            <div className="profile-avatar">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <strong>{userName}</strong>
              <span>Standard User</span>
            </div>
          </div>
        </header>

        <div className="dashboard-content">
          {activePage === 'Overview' && (
            <>
              <div className="welcome-section">
                <div>
                  <h2>Welcome back, {userName}!</h2>
                  <p>
                    Access your reports and manage your work from one place.
                  </p>
                </div>

                <button
                  className="primary-action"
                  onClick={() => {
                    setActivePage('Upload Report')
                    setMessage('')
                  }}
                >
                  + Upload Report
                </button>
              </div>

              <div className="stats-grid user-stats-grid">
                {stats.map((stat) => (
                  <article className="stat-card" key={stat.title}>
                    <div className="stat-top">
                      <span>{stat.title}</span>
                      <span className="stat-icon">{stat.icon}</span>
                    </div>
                    <strong>{stat.value}</strong>
                  </article>
                ))}
              </div>

              <section className="reports-panel">
                <div className="panel-heading">
                  <div>
                    <h3>My Recent Reports</h3>
                    <p>Reports accessible to your account.</p>
                  </div>

                  <button
                    className="text-action"
                    onClick={() => setActivePage('My Reports')}
                  >
                    View all →
                  </button>
                </div>

                {reportsLoading ? (
  <p>Loading reports...</p>
) : reportsError ? (
  <p className="auth-message auth-error">{reportsError}</p>
) : reports.length === 0 ? (
  <div className="empty-state">
    <div className="empty-icon">▤</div>
    <strong>No reports to display yet</strong>
    <p>Create a report to see it here.</p>
  </div>
) : (
  <div className="reports-table-wrapper">
    <table className="reports-table">
      <thead>
        <tr>
          <th>Title</th>
          <th>Type</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        {reports.slice(0, 5).map((report) => (
          <tr key={report.id}>
            <td>{report.title}</td>
            <td>{report.report_type}</td>
            <td>{report.report_date}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}
              </section>
            </>
          )}

          {activePage === 'My Reports' && (
            <section className="reports-panel">
              <div className="panel-heading">
                <div>
                  <h3>My Reports</h3>
                  <p>Search reports available to your account.</p>
                </div>
              </div>

              <div className="field report-search-field">
                <label htmlFor="reportSearch">Search reports</label>
                <input
                  id="reportSearch"
                  type="search"
                  placeholder="Search by report title..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>

              
{reportsLoading ? (
  <p>Loading reports...</p>
) : reportsError ? (
  <p className="auth-message auth-error">{reportsError}</p>
) : (
  <div className="reports-table-wrapper">
    <table className="reports-table">
      <thead>
        <tr>
          <th>Title</th>
          <th>Type</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        {reports
          .filter((report) =>
            `${report.title} ${report.report_type} ${report.description ?? ''}`
              .toLowerCase()
              .includes(searchTerm.toLowerCase()),
          )
          .map((report) => (
            <tr key={report.id}>
              <td>{report.title}</td>
              <td>{report.report_type}</td>
              <td>{report.report_date}</td>
            </tr>
          ))}
      </tbody>
    </table>
    {!reportsLoading && reports.length === 0 && (
      <p>No reports found. Create your first report.</p>
    )}
  </div>
)}

            </section>
          )}

          {activePage === 'Upload Report' && (
            <section className="reports-panel create-report-panel">
              <div className="panel-heading">
                <div>
                  <h3>Upload a Report</h3>
                  <p>Enter the basic details for your report.</p>
                </div>
              </div>

              {message && (
                <p className="auth-message auth-success" role="status">
                  {message}
                </p>
              )}

              <form className="create-report-form" onSubmit={handleCreateReport}>
                <div className="field">
                  <label htmlFor="reportTitle">Report title</label>
                  <input
                    id="reportTitle"
                    type="text"
                    placeholder="Enter report title"
                    value={reportTitle}
                    onChange={(event) => setReportTitle(event.target.value)}
                    maxLength={255}
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="reportType">Report type</label>
                  <select
                    id="reportType"
                    value={reportType}
                    onChange={(event) => setReportType(event.target.value)}
                    required
                  >
                    <option value="General">General</option>
                    <option value="Financial">Financial</option>
                    <option value="Operational">Operational</option>
                    <option value="Compliance">Compliance</option>
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="reportDescription">Description</label>
                  <textarea
                    id="reportDescription"
                    placeholder="Describe the report (optional)"
                    value={reportDescription}
                    onChange={(event) =>
                      setReportDescription(event.target.value)
                    }
                    rows={4}
                  />
                </div>
                {reportsError && (
  <p className="auth-message auth-error" role="alert">
    {reportsError}
  </p>
)}
                <button
  className="primary-action"
  type="submit"
  disabled={creatingReport}
>
  {creatingReport ? 'Uploading...' : 'Upload Report'}
</button>
              </form>
            </section>
          )}
        </div>
      </section>
    </main>
  )
}

export default UserDashboard
