import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import '../styles/pages.css'

export default function Admin() {
  const { userContext, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedGroups, setSelectedGroups] = useState([])

  // Check if user is admin
  useEffect(() => {
    if (!isAuthenticated || !userContext?.isAdmin) {
      navigate('/')
      return
    }
  }, [isAuthenticated, userContext, navigate])

  // Load users from Cognito (via Lambda)
  useEffect(() => {
    if (!userContext?.isAdmin) return

    const loadUsers = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('id_token')
        
        // Call Lambda function to list users
        const response = await fetch(`${window.location.origin}/api/admin/users`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (!response.ok) throw new Error('Failed to load users')
        const data = await response.json()
        setUsers(data.users || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadUsers()
  }, [userContext])

  const handleSelectUser = (user) => {
    setSelectedUser(user)
    setSelectedGroups(user.groups || [])
  }

  const toggleGroup = (groupName) => {
    setSelectedGroups(prev =>
      prev.includes(groupName)
        ? prev.filter(g => g !== groupName)
        : [...prev, groupName]
    )
  }

  const handleSaveGroups = async () => {
    if (!selectedUser) return

    try {
      const token = localStorage.getItem('id_token')
      const response = await fetch(`${window.location.origin}/api/admin/users/${selectedUser.username}/groups`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ groups: selectedGroups }),
      })

      if (!response.ok) throw new Error('Failed to update groups')
      
      // Update local state
      setUsers(users.map(u =>
        u.username === selectedUser.username
          ? { ...u, groups: selectedGroups }
          : u
      ))
      setSelectedUser({ ...selectedUser, groups: selectedGroups })
    } catch (err) {
      setError(err.message)
    }
  }

  if (!isAuthenticated || !userContext?.isAdmin) {
    return <div className="page-container">Access Denied</div>
  }

  const availableGroups = ['FAN', 'BESTIE', 'CREATOR', 'CREATOR_PENDING', 'ADMIN', 'COLLAB', 'PRIME']

  return (
    <div className="page-container">
      <h1>Admin Dashboard</h1>
      
      {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Users List */}
        <div>
          <h2>Users</h2>
          {loading ? (
            <p>Loading users...</p>
          ) : (
            <div style={{ border: '1px solid #ddd', borderRadius: '8px', maxHeight: '600px', overflowY: 'auto' }}>
              {users.map(user => (
                <div
                  key={user.username}
                  onClick={() => handleSelectUser(user)}
                  style={{
                    padding: '1rem',
                    borderBottom: '1px solid #eee',
                    cursor: 'pointer',
                    backgroundColor: selectedUser?.username === user.username ? '#f0f0f0' : 'white',
                    ':hover': { backgroundColor: '#f5f5f5' },
                  }}
                >
                  <div style={{ fontWeight: 'bold' }}>{user.email}</div>
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>
                    {user.groups?.length > 0 ? user.groups.join(', ') : 'FAN'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User Groups Editor */}
        <div>
          <h2>Edit Groups</h2>
          {selectedUser ? (
            <div>
              <div style={{ marginBottom: '1rem' }}>
                <strong>User:</strong> {selectedUser.email}
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <strong>Select Groups:</strong>
                <div style={{ marginTop: '0.5rem' }}>
                  {availableGroups.map(group => (
                    <label key={group} style={{ display: 'block', marginBottom: '0.5rem' }}>
                      <input
                        type="checkbox"
                        checked={selectedGroups.includes(group)}
                        onChange={() => toggleGroup(group)}
                      />
                      {' '}{group}
                    </label>
                  ))}
                </div>
              </div>

              <button
                className="btn btn-primary"
                onClick={handleSaveGroups}
              >
                Save Groups
              </button>
            </div>
          ) : (
            <p>Select a user to edit their groups</p>
          )}
        </div>
      </div>
    </div>
  )
}
