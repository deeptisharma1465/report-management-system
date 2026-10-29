
import { useState } from 'react'
import AdminDashboard from './AdminDashboard'
import UserDashboard from './UserDashboard'

function DashboardPreview() {
  const [role, setRole] = useState<'admin' | 'user'>('admin')

  return (
    <>
      <div
        style={{
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: '#eaf5ef',
        }}
      >
        <strong>Preview:</strong>

        
<button
  onClick={() => setRole('admin')}
  style={{
    background: role === 'admin' ? '#176b4d' : '#ffffff',
    color: role === 'admin' ? '#ffffff' : '#24513f',
    border: '1px solid #176b4d',
    borderRadius: '7px',
    padding: '9px 14px',
    fontWeight: 600,
    cursor: 'pointer',
  }}
>
  Admin Dashboard
</button>

<button
  onClick={() => setRole('user')}
  style={{
    background: role === 'user' ? '#176b4d' : '#ffffff',
    color: role === 'user' ? '#ffffff' : '#24513f',
    border: '1px solid #176b4d',
    borderRadius: '7px',
    padding: '9px 14px',
    fontWeight: 600,
    cursor: 'pointer',
  }}
>
  User Dashboard
</button>

      </div>

      {role === 'admin' ? (
        <AdminDashboard userName="Aditi" />
      ) : (
        <UserDashboard userName="Aditi" />
      )}
    </>
  )
}

export default DashboardPreview
