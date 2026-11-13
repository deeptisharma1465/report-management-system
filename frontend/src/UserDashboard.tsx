
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
} from 'react'
import './Dashboard.css'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'pptx']

type Report = {
  id: number
  title: string
  description: string | null
  report_type: string
  report_date: string
  agency_id: number
  uploaded_by: number
  is_deleted: boolean
  original_filename: string | null
  stored_filename: string | null
  file_path: string | null
  content_type: string | null
  file_size: number | null
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

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState('')
  const [isDragging, setIsDragging] = useState(false)

  const [message, setMessage] = useState('')
  const [reports, setReports] = useState<Report[]>([])
  const [reportsLoading, setReportsLoading] = useState(false)
  const [reportsError, setReportsError] = useState('')
  const [creatingReport, setCreatingReport] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

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
      title: 'Last Activity',
      value: reports.length
        ? `${Math.max(
            0,
            Math.floor(
              (Date.now() -
                new Date(reports[0].updated_at).getTime()) /
                60000,
            ),
          )} min ago`
        : '—',
      icon: '◷',
    },
    {
      title: 'Available Reports',
      value: reports.length,
      icon: '▣',
    },
  ]

  // Fetch reports from backend
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
      } catch (error) {
        if (!cancelled) {
          setReportsError(
            error instanceof Error
              ? error.message
              : 'Unable to load reports.',
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

  // Validate and select a document
  function validateAndSelectFile(file: File) {
    setFileError('')

    const extension = file.name.split('.').pop()?.toLowerCase()

    if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
      setSelectedFile(null)
      setFileError(
        'Invalid file format. Please select a PDF, DOCX or PPTX file.',
      )

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      return
    }

    if (file.size === 0) {
      setSelectedFile(null)
      setFileError('The selected file is empty.')
      return
    }

    setSelectedFile(file)
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (file) {
      validateAndSelectFile(file)
    }
  }

  // Drag and drop handlers
  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)

    const file = event.dataTransfer.files?.[0]

    if (file) {
      validateAndSelectFile(file)
    }
  }

  function removeSelectedFile() {
    setSelectedFile(null)
    setFileError('')

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function formatFileSize(size: number) {
    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`
    }

    return `${(size / (1024 * 1024)).toFixed(2)} MB`
  }

  // Upload document and metadata
  async function handleCreateReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setMessage('')
    setReportsError('')
    setFileError('')

    if (!selectedFile) {
      setFileError('Please select a document before uploading.')
      return
    }

    if (!reportTitle.trim()) {
      setReportsError('Please enter a report title.')
      return
    }

    setCreatingReport(true)

    try {
      const formData = new FormData()

      formData.append('file', selectedFile)
      formData.append('title', reportTitle.trim())
      formData.append(
        'description',
        reportDescription.trim(),
      )
      formData.append('report_type', reportType)
      formData.append(
        'report_date',
        new Date().toISOString().slice(0, 10),
      )
      formData.append('agency_id', String(agencyId))

      const response = await fetch(`${API_BASE_URL}/api/reports`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const responseData = await response.json().catch(() => null)

      if (!response.ok) {
        const detail = responseData?.detail

        throw new Error(
          typeof detail === 'string'
            ? detail
            : detail
              ? JSON.stringify(detail)
              : 'Unable to upload report. Please try again.',
        )
      }

      const createdReport: Report | undefined =
        responseData?.report ?? responseData

      if (createdReport?.id) {
        setReports((previous) => [
          createdReport,
          ...previous.filter((report) => report.id !== createdReport.id),
        ])
      } else {
        // Refresh reports if the backend returns a different response shape.
        const refreshResponse = await fetch(`${API_BASE_URL}/api/reports`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (refreshResponse.ok) {
          const refreshedReports: Report[] = await refreshResponse.json()
          setReports(refreshedReports)
        }
      }

      setReportTitle('')
      setReportType('General')
      setReportDescription('')
      setSelectedFile(null)

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      setMessage('Report uploaded successfully!')
    } catch (error) {
      setReportsError(
        error instanceof Error
          ? error.message
          : 'Unable to upload report.',
      )
    } finally {
      setCreatingReport(false)
    }
  }

async function handleDownload(report: Report) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/reports/${report.id}/file`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )

    if (!response.ok) {
      throw new Error('Unable to download file.')
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = report.original_filename || 'report'
    document.body.appendChild(link)
    link.click()
    link.remove()

    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Download error:', error)
    alert('Could not download the file. Please try again.')
  }
}
  function changePage(page: string) {
    setActivePage(page)
    setMessage('')
    setReportsError('')
    setFileError('')
  }

  const filteredReports = reports.filter((report) =>
  `${report.title} ${report.report_type} ${
    report.description ?? ''
  } ${report.original_filename ?? ''}`
    .toLowerCase()
    .includes(searchTerm.toLowerCase()),
)

  return (
    <main className="dashboard">
      {/* Sidebar */}
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
              onClick={() => changePage(item.name)}
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

      {/* Main dashboard */}
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
          {/* OVERVIEW */}
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
                  onClick={() => changePage('Upload Report')}
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
                    onClick={() => changePage('My Reports')}
                  >
                    View all →
                  </button>
                </div>

                {reportsLoading ? (
                  <p>Loading reports...</p>
                ) : reportsError ? (
                  <p className="auth-message auth-error">
                    {reportsError}
                  </p>
                ) : reports.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">▤</div>
                    <strong>No reports to display yet</strong>
                    <p>Create a report to see it here.</p>
                  </div>
                ) : (
                  <div className="reports-table-wrapper">
                    <table className="reports-table">
                      <tbody>
  {filteredReports.map((report) => (
    <tr key={report.id}>
      <td>{report.title}</td>
      <td>{report.report_type}</td>
      <td>{report.report_date}</td>
      <td>
  {report.original_filename ? (
    <button
      type="button"
      className="text-action"
      onClick={() => handleDownload(report)}
    >
      📄 {report.original_filename}
    </button>
  ) : (
    'No file attached'
  )}
</td>
    </tr>
  ))}
</tbody>

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

          {/* MY REPORTS */}
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
                  placeholder="Search by report title, type or description..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>

              {reportsLoading ? (
                <p>Loading reports...</p>
              ) : reportsError ? (
                <p className="auth-message auth-error">
                  {reportsError}
                </p>
              ) : filteredReports.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">⌕</div>
                  <strong>No reports found</strong>
                  <p>
                    {reports.length === 0
                      ? 'Create your first report.'
                      : 'Try another search term.'}
                  </p>
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
                      {filteredReports.map((report) => (
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
          )}

          {/* UPLOAD REPORT */}
          {activePage === 'Upload Report' && (
            <section className="reports-panel create-report-panel">
              <div className="panel-heading">
                <div>
                  <h3>Upload a Report</h3>
                  <p>
                    Upload your document and provide the required information.
                  </p>
                </div>
              </div>

              {message && (
                <p className="auth-message auth-success" role="status">
                  {message}
                </p>
              )}

              <form
                className="create-report-form"
                onSubmit={handleCreateReport}
              >
                {/* FILE UPLOAD */}
                <div className="field">
                  <label>
                    Upload document <span className="required-mark">*</span>
                  </label>

                  <div
                    className={`file-upload-area ${
                      isDragging ? 'dragging' : ''
                    } ${selectedFile ? 'has-file' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        fileInputRef.current?.click()
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label="Choose a PDF, DOCX or PPTX document"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                      onChange={handleFileChange}
                      required={!selectedFile}
                      onClick={(event) => event.stopPropagation()}
                    />

                    {!selectedFile ? (
                      <div className="file-upload-content">
                        <span className="upload-icon">↑</span>

                        <strong>
                          Drag and drop your document here
                        </strong>

                        <p>
                          or <span className="browse-text">browse files</span>
                        </p>

                        <div className="supported-formats">
                          <span>PDF</span>
                          <span>DOCX</span>
                          <span>PPTX</span>
                        </div>

                        <small>
                          Supported formats: PDF, DOCX and PPTX
                        </small>
                      </div>
                    ) : (
                      <div className="file-upload-content">
                        <span className="upload-icon">✓</span>
                        <strong>Document selected</strong>
                        <p>Click to choose a different document</p>
                      </div>
                    )}
                  </div>

                  {fileError && (
                    <p className="auth-message auth-error" role="alert">
                      {fileError}
                    </p>
                  )}

                  {selectedFile && (
                    <div className="selected-file">
                      <div className="selected-file-info">
                        <span className="selected-file-icon">📄</span>

                        <div className="selected-file-details">
                          <strong>{selectedFile.name}</strong>
                          <small>
                            {formatFileSize(selectedFile.size)}
                          </small>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="remove-file-button"
                        onClick={removeSelectedFile}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                {/* REPORT TITLE */}
                <div className="field">
                  <label htmlFor="reportTitle">
                    Report title <span className="required-mark">*</span>
                  </label>

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

                {/* REPORT TYPE */}
                <div className="field">
                  <label htmlFor="reportType">
                    Report type <span className="required-mark">*</span>
                  </label>

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

                {/* DESCRIPTION */}
                <div className="field">
                  <label htmlFor="reportDescription">
                    Description
                  </label>

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
                  disabled={creatingReport || !selectedFile}
                >
                  {creatingReport
                    ? 'Uploading document...'
                    : '↑ Upload Report'}
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
