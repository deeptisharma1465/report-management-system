import { useEffect, useState, type FormEvent } from 'react'
import './Dashboard.css'
import { useReportSearch } from './hooks/useReportSearch'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

const REPORT_TYPES = ['General', 'Financial', 'Operational', 'Compliance']

const AUDIT_PAGE_SIZE = 20

type Report = {
  id: number
  title: string
  description: string | null
  report_type: string
  report_date: string
  agency_id: number
  uploaded_by: number
  agency_name: string | null
  uploader_name: string | null
  is_deleted: boolean
  original_filename: string | null
  stored_filename: string | null
  file_path: string | null
  content_type: string | null
  file_size: number | null
  created_at: string
  updated_at: string
}

type User = {
  id: number
  name: string
  email: string
  role: string
  is_active: boolean
}

type Agency = {
  id: number
  name: string
  description: string | null
}

type AuditLog = {
  id: number
  action: string
  entity_type: string
  entity_id: number | null
  user_id: number | null
  details: Record<string, unknown> | null
  created_at: string
}

type AdminDashboardProps = {
  userName?: string
  token?: string
  onLogout?: () => void
}

function relevanceLabel(score: number | null) {
  if (score === null) return ''
  if (score >= 0.5) return 'High match'
  if (score >= 0.35) return 'Good match'
  return 'Related'
}

function formatAction(action: string) {
  const text = action.replace(/_/g, ' ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function actionBadgeClass(action: string) {
  if (action.endsWith('created')) return 'status-active'
  if (action.endsWith('deleted')) return 'status-inactive'
  return 'role-user'
}

function timeAgo(dateString: string) {
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(dateString).getTime()) / 60000),
  )
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days > 1 ? 's' : ''} ago`
}

function formatDateTime(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
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

  // Users page
  const [users, setUsers] = useState<User[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersError, setUsersError] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')

  // Agencies page
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [agenciesLoading, setAgenciesLoading] = useState(false)
  const [agenciesError, setAgenciesError] = useState('')
  const [agencySearch, setAgencySearch] = useState('')
  const [agencyFormOpen, setAgencyFormOpen] = useState(false)
  const [editingAgencyId, setEditingAgencyId] = useState<number | null>(null)
  const [agencyName, setAgencyName] = useState('')
  const [agencyDescription, setAgencyDescription] = useState('')
  const [agencySaving, setAgencySaving] = useState(false)
  const [agencyFormError, setAgencyFormError] = useState('')
  const [agencyMessage, setAgencyMessage] = useState('')

  // Audit logs page
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [auditLoading, setAuditLoading] = useState(false)
  const [auditError, setAuditError] = useState('')
  const [auditPage, setAuditPage] = useState(0)
  const [auditHasMore, setAuditHasMore] = useState(false)
  const [auditRefresh, setAuditRefresh] = useState(0)
  const [auditSearch, setAuditSearch] = useState('')
  const [auditActionFilter, setAuditActionFilter] = useState('All')
  const [latestAudit, setLatestAudit] = useState<AuditLog | null>(null)

  // Filters
  const [typeFilter, setTypeFilter] = useState('All')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const menuItems = [
    { name: 'Overview', icon: '⌂' },
    { name: 'Reports', icon: '▤' },
    { name: 'Users', icon: '♙' },
    { name: 'Agencies', icon: '▦' },
    { name: 'Audit Logs', icon: '◷' },
  ]

  // Semantic (AI) search
  const {
    hits,
    loading: searchLoading,
    error: searchError,
    isSearching,
  } = useReportSearch(searchTerm, token ?? '')

  type Row = { report: Report; score: number | null; snippet: string | null }

  const rows: Row[] = isSearching
    ? hits.map(({ report, score, snippet }) => ({ report, score, snippet }))
    : reports.map((report) => ({ report, score: null, snippet: null }))

  // Apply type/date filters on top of the normal list or search results
  const filteredRows = rows.filter(({ report }) => {
    if (typeFilter !== 'All' && report.report_type !== typeFilter) return false
    if (dateFrom && report.report_date < dateFrom) return false
    if (dateTo && report.report_date > dateTo) return false
    return true
  })

  const hasActiveFilters =
    typeFilter !== 'All' || dateFrom !== '' || dateTo !== ''

  function clearFilters() {
    setTypeFilter('All')
    setDateFrom('')
    setDateTo('')
  }

  useEffect(() => {
    if (!token) return

    let cancelled = false

    async function fetchReports() {
      setReportsLoading(true)
      setReportsError('')

      try {
        const response = await fetch(`${API_BASE_URL}/api/reports`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

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

  // Fetch registered users whenever the Users page is opened
  useEffect(() => {
    if (
      !token ||
      (activePage !== 'Overview' &&
        activePage !== 'Users' &&
        activePage !== 'Agencies' &&
        activePage !== 'Audit Logs')
    ) {
      return
    }

    let cancelled = false

    async function fetchUsers() {
      setUsersLoading(true)
      setUsersError('')

      try {
        const response = await fetch(`${API_BASE_URL}/api/users`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error(
            response.status === 401
              ? 'Session expired. Please sign in again.'
              : response.status === 403
                ? 'You do not have permission to view users.'
                : 'Unable to load users.',
          )
        }

        const data: User[] = await response.json()

        if (!cancelled) {
          setUsers(data)
        }
      } catch (err) {
        if (!cancelled) {
          setUsersError(
            err instanceof Error ? err.message : 'Unable to load users.',
          )
        }
      } finally {
        if (!cancelled) {
          setUsersLoading(false)
        }
      }
    }

    void fetchUsers()

    return () => {
      cancelled = true
    }
  }, [token, activePage])

  const normalizedUserSearch = userSearch.trim().toLowerCase()

  const filteredUsers = users.filter((user) => {
    if (roleFilter !== 'All' && user.role !== roleFilter) return false
    if (statusFilter === 'Active' && !user.is_active) return false
    if (statusFilter === 'Inactive' && user.is_active) return false
    if (!normalizedUserSearch) return true
    return `${user.name} ${user.email}`
      .toLowerCase()
      .includes(normalizedUserSearch)
  })

  const hasUserFilters = roleFilter !== 'All' || statusFilter !== 'All'

  function clearUserFilters() {
    setRoleFilter('All')
    setStatusFilter('All')
  }

  // Fetch agencies whenever the Agencies page is opened
  useEffect(() => {
    if (!token || (activePage !== 'Overview' && activePage !== 'Agencies')) return

    let cancelled = false

    async function fetchAgencies() {
      setAgenciesLoading(true)
      setAgenciesError('')

      try {
        const response = await fetch(`${API_BASE_URL}/api/agencies`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error(
            response.status === 401
              ? 'Session expired. Please sign in again.'
              : response.status === 403
                ? 'You do not have permission to view agencies.'
                : 'Unable to load agencies.',
          )
        }

        const data: Agency[] = await response.json()

        if (!cancelled) {
          setAgencies(data)
        }
      } catch (err) {
        if (!cancelled) {
          setAgenciesError(
            err instanceof Error ? err.message : 'Unable to load agencies.',
          )
        }
      } finally {
        if (!cancelled) {
          setAgenciesLoading(false)
        }
      }
    }

    void fetchAgencies()

    return () => {
      cancelled = true
    }
  }, [token, activePage])

  const normalizedAgencySearch = agencySearch.trim().toLowerCase()

  const filteredAgencies = agencies.filter((agency) => {
    if (!normalizedAgencySearch) return true
    return `${agency.name} ${agency.description ?? ''} ${agency.id}`
      .toLowerCase()
      .includes(normalizedAgencySearch)
  })

  function openCreateAgency() {
    setEditingAgencyId(null)
    setAgencyName('')
    setAgencyDescription('')
    setAgencyFormError('')
    setAgencyMessage('')
    setAgencyFormOpen(true)
  }

  function openEditAgency(agency: Agency) {
    setEditingAgencyId(agency.id)
    setAgencyName(agency.name)
    setAgencyDescription(agency.description ?? '')
    setAgencyFormError('')
    setAgencyMessage('')
    setAgencyFormOpen(true)
  }

  function closeAgencyForm() {
    setAgencyFormOpen(false)
    setEditingAgencyId(null)
    setAgencyFormError('')
  }

  async function handleSaveAgency(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAgencyFormError('')
    setAgencyMessage('')

    const name = agencyName.trim()

    if (!name) {
      setAgencyFormError('Please enter an agency name.')
      return
    }

    setAgencySaving(true)

    try {
      const isEditing = editingAgencyId !== null

      const response = await fetch(
        isEditing
          ? `${API_BASE_URL}/api/agencies/${editingAgencyId}`
          : `${API_BASE_URL}/api/agencies`,
        {
          method: isEditing ? 'PATCH' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name,
            description: agencyDescription.trim() || null,
          }),
        },
      )

      const responseData = await response.json().catch(() => null)

      if (!response.ok) {
        const detail = responseData?.detail

        throw new Error(
          typeof detail === 'string'
            ? detail
            : 'Unable to save agency. Please check the details and try again.',
        )
      }

      const saved: Agency = responseData

      setAgencies((previous) =>
        (isEditing
          ? previous.map((agency) => (agency.id === saved.id ? saved : agency))
          : [...previous, saved]
        ).sort((a, b) => a.name.localeCompare(b.name)),
      )

      setAgencyMessage(
        isEditing ? 'Agency updated successfully!' : 'Agency created successfully!',
      )
      closeAgencyForm()
    } catch (error) {
      setAgencyFormError(
        error instanceof Error ? error.message : 'Unable to save agency.',
      )
    } finally {
      setAgencySaving(false)
    }
  }

  // Fetch one page of audit logs (newest first)
  useEffect(() => {
    if (!token || activePage !== 'Audit Logs') return

    let cancelled = false

    async function fetchAuditLogs() {
      setAuditLoading(true)
      setAuditError('')

      try {
        // Ask for one extra row so we know whether a next page exists.
        const response = await fetch(
          `${API_BASE_URL}/api/audit-logs?limit=${AUDIT_PAGE_SIZE + 1}&offset=${
            auditPage * AUDIT_PAGE_SIZE
          }`,
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
                ? 'You do not have permission to view audit logs.'
                : 'Unable to load audit logs.',
          )
        }

        const data: AuditLog[] = await response.json()

        if (!cancelled) {
          setAuditHasMore(data.length > AUDIT_PAGE_SIZE)
          setAuditLogs(data.slice(0, AUDIT_PAGE_SIZE))
        }
      } catch (err) {
        if (!cancelled) {
          setAuditError(
            err instanceof Error ? err.message : 'Unable to load audit logs.',
          )
        }
      } finally {
        if (!cancelled) {
          setAuditLoading(false)
        }
      }
    }

    void fetchAuditLogs()

    return () => {
      cancelled = true
    }
  }, [token, activePage, auditPage, auditRefresh])

  const userNamesById = new Map(users.map((user) => [user.id, user.name]))

  function auditUserLabel(userId: number | null) {
    if (userId === null) return 'System'
    return userNamesById.get(userId) ?? `User #${userId}`
  }

  const auditActions = Array.from(
    new Set(auditLogs.map((log) => log.action)),
  ).sort()

  const normalizedAuditSearch = auditSearch.trim().toLowerCase()

  const filteredAuditLogs = auditLogs.filter((log) => {
    if (auditActionFilter !== 'All' && log.action !== auditActionFilter) {
      return false
    }
    if (!normalizedAuditSearch) return true
    return `${log.action} ${log.entity_type} ${log.entity_id ?? ''} ${auditUserLabel(
      log.user_id,
    )} ${log.details ? JSON.stringify(log.details) : ''}`
      .toLowerCase()
      .includes(normalizedAuditSearch)
  })

  const hasAuditFilters = auditActionFilter !== 'All' || auditSearch !== ''

  function clearAuditFilters() {
    setAuditActionFilter('All')
    setAuditSearch('')
  }

  // Latest activity for the Overview card
  useEffect(() => {
    if (!token || activePage !== 'Overview') return

    let cancelled = false

    fetch(`${API_BASE_URL}/api/audit-logs?limit=1`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) =>
        response.ok ? response.json() : Promise.reject(new Error('failed')),
      )
      .then((data: AuditLog[]) => {
        if (!cancelled) setLatestAudit(data[0] ?? null)
      })
      .catch(() => {
        if (!cancelled) setLatestAudit(null)
      })

    return () => {
      cancelled = true
    }
  }, [token, activePage])

  const overviewStats = [
    {
      title: 'Total Reports',
      value: reports.length,
      icon: '▤',
      note: 'Active reports in the system',
    },
    {
      title: 'Total Users',
      value: usersLoading || usersError ? '—' : users.length,
      icon: '♙',
      note: usersError
        ? 'Unable to load users'
        : `${users.filter((user) => user.is_active).length} active`,
    },
    {
      title: 'Total Agencies',
      value: agenciesLoading || agenciesError ? '—' : agencies.length,
      icon: '▦',
      note: agenciesError ? 'Unable to load agencies' : 'Registered agencies',
    },
    {
      title: 'Last Activity',
      value: latestAudit ? timeAgo(latestAudit.created_at) : '—',
      icon: '◷',
      note: latestAudit
        ? formatAction(latestAudit.action)
        : 'No activity recorded yet',
    },
  ]

  async function handleDeleteReport(report: Report) {
    if (!token) {
      setReportsError(
        'You must be signed in as an administrator to delete reports.',
      )
      return
    }

    if (
      !window.confirm(
        `Delete "${report.title}"? It will be removed from active reports.`,
      )
    ) {
      return
    }

    setReportsError('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/reports/${report.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const responseData = await response.json().catch(() => null)
        const detail = responseData?.detail

        throw new Error(
          typeof detail === 'string'
            ? detail
            : 'Unable to delete report. Please try again.',
        )
      }

      setReports((previous) =>
        previous.filter((currentReport) => currentReport.id !== report.id),
      )
    } catch (error) {
      setReportsError(
        error instanceof Error ? error.message : 'Unable to delete report.',
      )
    }
  }

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

              <div className="stats-grid user-stats-grid admin-stats-grid">
                {overviewStats.map((stat) => (
                  <article className="stat-card" key={stat.title}>
                    <div className="stat-top">
                      <span>{stat.title}</span>
                      <span className="stat-icon">{stat.icon}</span>
                    </div>
                    <strong>{stat.value}</strong>
                    <p>{stat.note}</p>
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
                    type="button"
                    className="view-all-link"
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
                          <th>Agency</th>
                          <th>Uploaded by</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reports.slice(0, 5).map((report) => (
                          <tr key={report.id}>
                            <td className="report-title-cell">{report.title}</td>
                            <td>
                              <span
                                className={`type-badge type-${report.report_type.toLowerCase()}`}
                              >
                                {report.report_type}
                              </span>
                            </td>
                            <td>{report.report_date}</td>
                            <td>{report.agency_name ?? '—'}</td>
                            <td>{report.uploader_name ?? '—'}</td>
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
                  <p>Search and review reports across all agencies.</p>
                </div>
              </div>

              <div className="report-toolbar">
                <div className="search-box">
                  <span className="search-icon">⌕</span>
                  <input
                    id="reportSearch"
                    type="search"
                    aria-label="Search reports"
                    placeholder="Search by meaning, e.g. 'budget overview' or 'staff safety'..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      className="search-clear-btn"
                      aria-label="Clear search"
                      title="Clear search"
                      onClick={() => setSearchTerm('')}
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="filter-row">
                  <div className="filter-field">
                    <label htmlFor="typeFilter">Type</label>
                    <select
                      id="typeFilter"
                      value={typeFilter}
                      onChange={(event) => setTypeFilter(event.target.value)}
                    >
                      <option value="All">All types</option>
                      {REPORT_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="filter-field">
                    <label htmlFor="dateFrom">From</label>
                    <input
                      id="dateFrom"
                      type="date"
                      value={dateFrom}
                      max={dateTo || undefined}
                      onChange={(event) => setDateFrom(event.target.value)}
                    />
                  </div>

                  <div className="filter-field">
                    <label htmlFor="dateTo">To</label>
                    <input
                      id="dateTo"
                      type="date"
                      value={dateTo}
                      min={dateFrom || undefined}
                      onChange={(event) => setDateTo(event.target.value)}
                    />
                  </div>

                  {hasActiveFilters && (
                    <button
                      type="button"
                      className="clear-filters-btn"
                      onClick={clearFilters}
                    >
                      ✕ Clear
                    </button>
                  )}
                </div>

                <p className="result-count">
                  {filteredRows.length}{' '}
                  {filteredRows.length === 1 ? 'report' : 'reports'}
                  {hasActiveFilters ? ' (filtered)' : ''}
                </p>
              </div>

              {reportsLoading || searchLoading ? (
                <p>{searchLoading ? 'Searching...' : 'Loading reports...'}</p>
              ) : reportsError || searchError ? (
                <p role="alert" className="auth-error">
                  {reportsError || searchError}
                </p>
              ) : filteredRows.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">⌕</div>
                  <strong>No reports found</strong>
                  <p>
                    {reports.length === 0
                      ? 'No reports have been uploaded yet.'
                      : hasActiveFilters
                        ? 'No reports match your filters.'
                        : 'Try describing it differently.'}
                  </p>
                </div>
              ) : (
                <div className="reports-table-wrapper">
                  <table className="reports-table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Type</th>
                        <th>Report Date</th>
                        <th>Agency</th>
                        <th>Uploaded by</th>
                        {isSearching && <th>Relevance</th>}
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.map(({ report, score, snippet }) => (
                        <tr key={report.id}>
                          <td>
                            {report.title}
                            {snippet && (
                              <small
                                style={{ display: 'block', opacity: 0.7 }}
                              >
                                {snippet}
                              </small>
                            )}
                          </td>
                          <td>
                            <span
                              className={`type-badge type-${report.report_type.toLowerCase()}`}
                            >
                              {report.report_type}
                            </span>
                          </td>
                          <td>{report.report_date}</td>
                          <td>{report.agency_name ?? '—'}</td>
                          <td>{report.uploader_name ?? '—'}</td>
                          {isSearching && <td>{relevanceLabel(score)}</td>}
                          <td>
                            <button
                              type="button"
                              className="action-btn delete-action-btn"
                              onClick={() => handleDeleteReport(report)}
                              disabled={!token}
                              title="Delete report"
                            >
                              🗑 Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ) : activePage === 'Users' ? (
            <section className="reports-panel">
              <div className="panel-heading">
                <div>
                  <h3>Registered Users</h3>
                  <p>Everyone who has an account in the workspace.</p>
                </div>
              </div>

              <div className="report-toolbar">
                <div className="search-box">
                  <span className="search-icon">⌕</span>
                  <input
                    id="userSearch"
                    type="search"
                    aria-label="Search users"
                    placeholder="Search by name or email..."
                    value={userSearch}
                    onChange={(event) => setUserSearch(event.target.value)}
                  />
                  {userSearch && (
                    <button
                      type="button"
                      className="search-clear-btn"
                      aria-label="Clear search"
                      title="Clear search"
                      onClick={() => setUserSearch('')}
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="filter-row">
                  <div className="filter-field">
                    <label htmlFor="roleFilter">Role</label>
                    <select
                      id="roleFilter"
                      value={roleFilter}
                      onChange={(event) => setRoleFilter(event.target.value)}
                    >
                      <option value="All">All roles</option>
                      <option value="admin">Administrator</option>
                      <option value="user">Standard user</option>
                    </select>
                  </div>

                  <div className="filter-field">
                    <label htmlFor="statusFilter">Status</label>
                    <select
                      id="statusFilter"
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value)}
                    >
                      <option value="All">All statuses</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  {hasUserFilters && (
                    <button
                      type="button"
                      className="clear-filters-btn"
                      onClick={clearUserFilters}
                    >
                      ✕ Clear
                    </button>
                  )}
                </div>

                <p className="result-count">
                  {filteredUsers.length}{' '}
                  {filteredUsers.length === 1 ? 'user' : 'users'}
                  {hasUserFilters || normalizedUserSearch ? ' (filtered)' : ''}
                </p>
              </div>

              {usersLoading ? (
                <p>Loading users...</p>
              ) : usersError ? (
                <p role="alert" className="auth-error">
                  {usersError}
                </p>
              ) : filteredUsers.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">♙</div>
                  <strong>No users found</strong>
                  <p>
                    {users.length === 0
                      ? 'No users have registered yet.'
                      : 'No users match your search or filters.'}
                  </p>
                </div>
              ) : (
                <div className="reports-table-wrapper">
                  <table className="reports-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.id}>
                          <td>{user.id}</td>
                          <td className="report-title-cell">{user.name}</td>
                          <td>{user.email}</td>
                          <td>
                            <span
                              className={`type-badge role-${user.role.toLowerCase()}`}
                            >
                              {user.role === 'admin'
                                ? 'Administrator'
                                : 'Standard user'}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`type-badge ${
                                user.is_active
                                  ? 'status-active'
                                  : 'status-inactive'
                              }`}
                            >
                              {user.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ) : activePage === 'Agencies' ? (
            <section className="reports-panel">
              <div className="panel-heading">
                <div>
                  <h3>Agencies</h3>
                  <p>Create and manage the agencies in your workspace.</p>
                </div>

                {!agencyFormOpen && (
                  <button
                    type="button"
                    className="primary-action"
                    onClick={openCreateAgency}
                  >
                    + Add Agency
                  </button>
                )}
              </div>

              {agencyMessage && (
                <p className="auth-message auth-success" role="status">
                  {agencyMessage}
                </p>
              )}

              {agencyFormOpen && (
                <form className="create-report-form" onSubmit={handleSaveAgency}>
                  <div className="form-row">
                    <div className="field">
                      <label htmlFor="agencyName">
                        Agency name <span className="required-mark">*</span>
                      </label>
                      <input
                        id="agencyName"
                        type="text"
                        placeholder="Enter agency name"
                        value={agencyName}
                        onChange={(event) => setAgencyName(event.target.value)}
                        maxLength={100}
                        required
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="agencyDescription">Description</label>
                      <input
                        id="agencyDescription"
                        type="text"
                        placeholder="Optional"
                        value={agencyDescription}
                        onChange={(event) =>
                          setAgencyDescription(event.target.value)
                        }
                        maxLength={255}
                      />
                    </div>
                  </div>

                  {agencyFormError && (
                    <p className="auth-error" role="alert">
                      {agencyFormError}
                    </p>
                  )}

                  <div className="form-actions">
                    <button
                      type="button"
                      className="action-btn"
                      onClick={closeAgencyForm}
                      disabled={agencySaving}
                    >
                      Cancel
                    </button>
                    <button
                      className="primary-action"
                      type="submit"
                      disabled={agencySaving}
                    >
                      {agencySaving
                        ? 'Saving...'
                        : editingAgencyId === null
                          ? 'Create agency'
                          : 'Save changes'}
                    </button>
                  </div>
                </form>
              )}

              <div className="report-toolbar">
                <div className="search-box">
                  <span className="search-icon">⌕</span>
                  <input
                    id="agencySearch"
                    type="search"
                    aria-label="Search agencies"
                    placeholder="Search by name or description..."
                    value={agencySearch}
                    onChange={(event) => setAgencySearch(event.target.value)}
                  />
                  {agencySearch && (
                    <button
                      type="button"
                      className="search-clear-btn"
                      aria-label="Clear search"
                      title="Clear search"
                      onClick={() => setAgencySearch('')}
                    >
                      ✕
                    </button>
                  )}
                </div>

                <p className="result-count">
                  {filteredAgencies.length}{' '}
                  {filteredAgencies.length === 1 ? 'agency' : 'agencies'}
                  {normalizedAgencySearch ? ' (filtered)' : ''}
                </p>
              </div>

              {agenciesLoading ? (
                <p>Loading agencies...</p>
              ) : agenciesError ? (
                <p role="alert" className="auth-error">
                  {agenciesError}
                </p>
              ) : filteredAgencies.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">▦</div>
                  <strong>No agencies found</strong>
                  <p>
                    {agencies.length === 0
                      ? 'Add your first agency to get started.'
                      : 'No agencies match your search.'}
                  </p>
                </div>
              ) : (
                <div className="reports-table-wrapper">
                  <table className="reports-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Reports</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAgencies.map((agency) => (
                        <tr key={agency.id}>
                          <td>{agency.id}</td>
                          <td className="report-title-cell">{agency.name}</td>
                          <td>
                            {agency.description || (
                              <span className="muted-text">—</span>
                            )}
                          </td>
                          <td>
                            {
                              reports.filter(
                                (report) => report.agency_id === agency.id,
                              ).length
                            }
                          </td>
                          <td>
                            <button
                              type="button"
                              className="action-btn"
                              onClick={() => openEditAgency(agency)}
                            >
                              ✎ Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ) : activePage === 'Audit Logs' ? (
            <section className="reports-panel">
              <div className="panel-heading">
                <div>
                  <h3>Audit Logs</h3>
                  <p>A record of who did what in the workspace, newest first.</p>
                </div>

                <button
                  type="button"
                  className="action-btn"
                  onClick={() => setAuditRefresh((count) => count + 1)}
                  disabled={auditLoading}
                >
                  ↻ Refresh
                </button>
              </div>

              <div className="report-toolbar">
                <div className="search-box">
                  <span className="search-icon">⌕</span>
                  <input
                    id="auditSearch"
                    type="search"
                    aria-label="Search audit logs"
                    placeholder="Search this page by user, action or report..."
                    value={auditSearch}
                    onChange={(event) => setAuditSearch(event.target.value)}
                  />
                  {auditSearch && (
                    <button
                      type="button"
                      className="search-clear-btn"
                      aria-label="Clear search"
                      title="Clear search"
                      onClick={() => setAuditSearch('')}
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="filter-row">
                  <div className="filter-field">
                    <label htmlFor="auditActionFilter">Action</label>
                    <select
                      id="auditActionFilter"
                      value={auditActionFilter}
                      onChange={(event) =>
                        setAuditActionFilter(event.target.value)
                      }
                    >
                      <option value="All">All actions</option>
                      {auditActions.map((action) => (
                        <option key={action} value={action}>
                          {formatAction(action)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {hasAuditFilters && (
                    <button
                      type="button"
                      className="clear-filters-btn"
                      onClick={clearAuditFilters}
                    >
                      ✕ Clear
                    </button>
                  )}
                </div>

                <p className="result-count">
                  {filteredAuditLogs.length}{' '}
                  {filteredAuditLogs.length === 1 ? 'entry' : 'entries'} on this
                  page{hasAuditFilters ? ' (filtered)' : ''}
                </p>
              </div>

              {auditLoading ? (
                <p>Loading audit logs...</p>
              ) : auditError ? (
                <p role="alert" className="auth-error">
                  {auditError}
                </p>
              ) : filteredAuditLogs.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">◷</div>
                  <strong>No audit entries found</strong>
                  <p>
                    {auditLogs.length === 0
                      ? 'Activity will appear here as people use the workspace.'
                      : 'No entries on this page match your search or filter.'}
                  </p>
                </div>
              ) : (
                <div className="reports-table-wrapper">
                  <table className="reports-table">
                    <thead>
                      <tr>
                        <th>When</th>
                        <th>User</th>
                        <th>Action</th>
                        <th>Item</th>
                        <th>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAuditLogs.map((log) => (
                        <tr key={log.id}>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            {formatDateTime(log.created_at)}
                          </td>
                          <td>{auditUserLabel(log.user_id)}</td>
                          <td>
                            <span
                              className={`type-badge ${actionBadgeClass(
                                log.action,
                              )}`}
                            >
                              {formatAction(log.action)}
                            </span>
                          </td>
                          <td>
                            {log.entity_type.replace(/_/g, ' ')}
                            {log.entity_id !== null && ` #${log.entity_id}`}
                          </td>
                          <td>
                            {log.details ? (
                              <details className="audit-details">
                                <summary>View</summary>
                                <pre>{JSON.stringify(log.details, null, 2)}</pre>
                              </details>
                            ) : (
                              <span className="muted-text">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="audit-pagination">
                <button
                  type="button"
                  className="action-btn"
                  onClick={() => setAuditPage((page) => Math.max(0, page - 1))}
                  disabled={auditPage === 0 || auditLoading}
                >
                  ← Newer
                </button>
                <span className="result-count">Page {auditPage + 1}</span>
                <button
                  type="button"
                  className="action-btn"
                  onClick={() => setAuditPage((page) => page + 1)}
                  disabled={!auditHasMore || auditLoading}
                >
                  Older →
                </button>
              </div>
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
                  This section is ready for its interface and backend API
                  integration.
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