
import { useState, type FormEvent } from 'react'
import './App.css'
import AdminDashboard from './AdminDashboard'
import UserDashboard from './UserDashboard'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

type User = {
  id: number
  name: string
  email: string
  role: 'admin' | 'user'
  is_active: boolean
  agency_id: number | null
}

function App() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [agencyId, setAgencyId] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register'

      const body = isLogin
        ? { email, password }
        : {
            name,
            email,
            password,
            // agency_id: Number(agencyId),
            agency_id: 1,
          }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail
            ? typeof data.detail === 'string'
              ? data.detail
              : JSON.stringify(data.detail)
            : 'Something went wrong. Please try again.',
        )
      }

      if (isLogin) {
        setUser(data.user as User)
        setToken(data.access_token)
      } else {
        setSuccess('Account created successfully! Please sign in.')
        setIsLogin(true)
        setPassword('')
        setAgencyId('')
      }
    } catch (err) {
      setError(
        err instanceof TypeError
          ? 'Cannot connect to the backend. Check that the server is running.'
          : err instanceof Error
            ? err.message
            : 'Something went wrong. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  function handleLogout() {
    setUser(null)
    setToken(null)
    setEmail('')
    setPassword('')
    setError('')
    setSuccess('')
    setIsLogin(true)
  }

  
if (user && token) {
  if (user.role === 'admin') {
    return (
      <AdminDashboard
        userName={user.name}
        token={token}
        onLogout={handleLogout}
      />
    )
  }

  return (
  <UserDashboard
    userName={user.name}
    token={token}
    agencyId={user.agency_id!}
    onLogout={handleLogout}
  />
)
}


  return (
    <main className="auth-page">
      <section className="auth-visual">
        <div className="brand">
          <div className="brand-icon">R</div>
          <span>ReportFlow</span>
        </div>

        <div className="visual-content">
          <span className="eyebrow">REPORT MANAGEMENT PLATFORM</span>
          <h1>
            Your reports.
            <br />
            <span>One organized place.</span>
          </h1>
          <p>
            Manage reports, organize agency workflows, and keep
            everything accessible from one secure workspace.
          </p>

          <div className="visual-card">
            <div className="card-top">
              <span className="status-dot" />
              Workspace overview
              <span className="card-menu">•••</span>
            </div>
            <div className="mini-stats">
              <div>
                <span className="mini-label">Reports</span>
                <strong>Organized</strong>
              </div>
              <div>
                <span className="mini-label">Access</span>
                <strong>Role-based</strong>
              </div>
            </div>
            <div className="progress-line">
              <span />
            </div>
            <span className="card-caption">
              A clearer way to manage your work.
            </span>
          </div>
        </div>

        <div className="visual-footer">
          <span>Secure workspace</span>
          <span>Built for teams</span>
        </div>
      </section>

      <section className="auth-panel">
        <div className="mobile-brand">
          <div className="brand-icon">R</div>
          <span>ReportFlow</span>
        </div>

        <div className="auth-form-wrapper">
          <div className="form-heading">
            <span className="form-eyebrow">
              {isLogin ? 'WELCOME BACK' : 'GET STARTED'}
            </span>
            <h2>
              {isLogin ? 'Sign in to your account' : 'Create your account'}
            </h2>
            <p>
              {isLogin
                ? 'Enter your details to access your workspace.'
                : 'Create an account to get started with ReportFlow.'}
            </p>
          </div>

          {error && (
            <p role="alert" className="auth-message auth-error">
              {error}
            </p>
          )}

          {success && (
            <p role="status" className="auth-message auth-success">
              {success}
            </p>
          )}

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <>
                <div className="field">
                  <label htmlFor="name">Full name</label>
                  <input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    autoComplete="name"
                    minLength={2}
                    required
                  />
                </div>

                {/* <div className="field">
                  <label htmlFor="agencyId">Agency ID</label>
                  <input
                    id="agencyId"
                    type="number"
                    placeholder="Enter your assigned agency ID"
                    value={agencyId}
                    onChange={(event) => setAgencyId(event.target.value)}
                    min={1}
                    required
                  />
                  <small>Ask your administrator for a valid agency ID.</small>
                </div> */}
              </>
            )}

            <div className="field">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="field">
              <div className="label-row">
                <label htmlFor="password">Password</label>
                {isLogin && <span className="field-note">Required</span>}
              </div>
              
<div className="password-input-wrapper">
  <input
    id="password"
    type={showPassword ? 'text' : 'password'}
    placeholder="Enter your password"
    value={password}
    onChange={(event) => setPassword(event.target.value)}
    autoComplete={isLogin ? 'current-password' : 'new-password'}
    minLength={8}
    required
  />

  <button
    type="button"
    className="toggle-password"
    onClick={() => setShowPassword((previous) => !previous)}
    aria-label={showPassword ? 'Hide password' : 'Show password'}
  >
    {showPassword ? '🙈' : '👁'}
  </button>
</div>

            </div>

            {isLogin && (
              <div className="form-options">
                <span className="security-note">
                  <span className="lock-icon">✓</span>
                  Secure sign-in
                </span>
              </div>
            )}

            <button
              className="submit-button"
              type="submit"
              disabled={loading}
            >
              {loading
                ? 'Please wait...'
                : isLogin
                  ? 'Sign in'
                  : 'Create account'}
              {!loading && <span>→</span>}
            </button>
          </form>

          <div className="switch-auth">
            {isLogin
              ? "Don't have an account?"
              : 'Already have an account?'}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin)
                setError('')
                setSuccess('')
              }}
            >
              {isLogin ? 'Create account' : 'Sign in'}
            </button>
          </div>

          <div className="form-divider">
            <span />
            <span>YOUR WORKSPACE</span>
            <span />
          </div>

          <p className="privacy-note">
            Access to reports is protected by account permissions
            and agency-level restrictions.
          </p>
        </div>

        <footer className="panel-footer">
          <span>© 2026 ReportFlow</span>
          <span>Report Management System</span>
        </footer>
      </section>
    </main>
  )
}

export default App
