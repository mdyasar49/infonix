import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { ROLE_OFFER_CONFIGS, detectRoleKey } from '../../data/roleOfferConfigs'
import headerImg from '../../assets/offer/infogenx_header.jpeg'
import directorSigImg from '../../assets/offer/director_signature.jpeg'
import './AdminOfferReviewPage.css'

function AdminOfferReviewPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  // Candidate and offer details
  const [candidateData, setCandidateData] = useState(null)
  const [allRequests, setAllRequests] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [summary, setSummary] = useState(null)
  const [activeTab, setActiveTab] = useState('directory') // 'directory' | 'offers'
  const [userSearch, setUserSearch] = useState('')

  // Form states
  const [selectedRoleKey, setSelectedRoleKey] = useState('bde')
  const [department, setDepartment] = useState('')
  const [salary, setSalary] = useState('₹30,000 per month')
  const [startDate, setStartDate] = useState('')
  const [adminNotes, setAdminNotes] = useState('')

  const defaultApi = window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://candidates.infogenx.com'
  const apiUrl = import.meta.env.VITE_API_URL || defaultApi

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      if (token) {
        const res = await fetch(`${apiUrl}/api/offer-letter/review/${token}`)
        const data = await res.json()
        if (data.success && data.offer) {
          setCandidateData(data.offer)
          const roleKey = detectRoleKey(data.offer.role || data.offer.department)
          setSelectedRoleKey(roleKey)
          const roleCfg = ROLE_OFFER_CONFIGS[roleKey] || ROLE_OFFER_CONFIGS['bde']
          setDepartment(data.offer.department || roleCfg.department)
          setSalary(data.offer.salary || roleCfg.defaultSalary)
          setStartDate(data.offer.startDate || '')
          setAdminNotes(data.offer.adminNotes || '')
        } else {
          setError(data.message || 'Unable to retrieve candidate offer details.')
        }
      } else {
        // Fetch monitor-all data from cPanel MySQL API
        const res = await fetch(`${apiUrl}/api/candidate-auth/monitor-all`)
        const data = await res.json()
        if (data.success) {
          setAllUsers(data.users || [])
          setAllRequests(data.offers || [])
          setSummary(data.summary || null)
        } else {
          // Fallback to all-requests
          const fallbackRes = await fetch(`${apiUrl}/api/offer-letter/all-requests`)
          const fallbackData = await fallbackRes.json()
          if (fallbackData.success) {
            setAllRequests(fallbackData.requests || [])
          }
        }
      }
    } catch (err) {
      setError(`Failed to connect to backend: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Fetch offer details by token or fetch all requests
  useEffect(() => {
    loadData()
  }, [token, apiUrl])

  // Edit user modal state
  const [editingUser, setEditingUser] = useState(null)
  const [isCreatingUser, setIsCreatingUser] = useState(false)
  const [userForm, setUserForm] = useState({ name: '', email: '', role: 'candidate', mobile: '', location: '', qualification: '', password: '', max_attempts: 1, assessment_attempts: 0 })
  const [savingUser, setSavingUser] = useState(false)
  const [userEditMsg, setUserEditMsg] = useState(null)

  const handleOpenCreateUser = () => {
    setEditingUser(null)
    setIsCreatingUser(true)
    setUserForm({
      name: '',
      email: '',
      role: 'candidate',
      max_attempts: 1,
      assessment_attempts: 0,
      mobile: '',
      location: '',
      qualification: '',
      password: 'candidate123'
    })
    setUserEditMsg(null)
  }

  const handleOpenEditUser = (u) => {
    setIsCreatingUser(false)
    setEditingUser(u)
    setUserForm({
      name: u.name || '',
      email: u.email || '',
      role: u.role || 'candidate',
      max_attempts: u.max_attempts !== undefined ? u.max_attempts : (u.role === 'test_user' || u.role === 'admin' ? -1 : 1),
      assessment_attempts: u.assessment_attempts !== undefined ? u.assessment_attempts : 0,
      mobile: u.mobile || '',
      location: u.location || '',
      qualification: u.qualification || '',
      password: ''
    })
    setUserEditMsg(null)
  }

  const handleSaveUser = async (e) => {
    e.preventDefault()
    if (!editingUser) return
    setSavingUser(true)
    setUserEditMsg(null)
    try {
      const res = await fetch(`${apiUrl}/api/candidate-auth/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm)
      })
      const data = await res.json()
      if (data.success) {
        setUserEditMsg({ type: 'success', text: '✓ User details & role updated in cPanel DB!' })
        await loadData()
        setTimeout(() => {
          setEditingUser(null)
        }, 1200)
      } else {
        setUserEditMsg({ type: 'error', text: data.message || 'Failed to update user.' })
      }
    } catch (err) {
      setUserEditMsg({ type: 'error', text: `Network error: ${err.message}` })
    } finally {
      setSavingUser(false)
    }
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    setSavingUser(true)
    setUserEditMsg(null)
    try {
      const res = await fetch(`${apiUrl}/api/candidate-auth/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm)
      })
      const data = await res.json()
      if (data.success) {
        setUserEditMsg({ type: 'success', text: '✓ New user added successfully to cPanel DB!' })
        await loadData()
        setTimeout(() => {
          setIsCreatingUser(false)
        }, 1200)
      } else {
        setUserEditMsg({ type: 'error', text: data.message || 'Failed to create user.' })
      }
    } catch (err) {
      setUserEditMsg({ type: 'error', text: `Network error: ${err.message}` })
    } finally {
      setSavingUser(false)
    }
  }

  const handleDeleteUser = async (u) => {
    if (!window.confirm(`Are you sure you want to delete user ${u.name} (${u.email}) from cPanel DB?`)) return
    try {
      const res = await fetch(`${apiUrl}/api/candidate-auth/users/${u.id}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (data.success) {
        alert('User removed from cPanel DB.')
        await loadData()
      } else {
        alert(data.message || 'Failed to delete user.')
      }
    } catch (err) {
      alert(`Delete error: ${err.message}`)
    }
  }

  // Handle Role Track Dropdown change
  const handleRoleChange = (e) => {
    const newKey = e.target.value
    setSelectedRoleKey(newKey)
    const cfg = ROLE_OFFER_CONFIGS[newKey]
    if (cfg) {
      setDepartment(cfg.department)
      setSalary(cfg.defaultSalary)
    }
  }

  // Handle Admin Approval Submission
  const handleApprove = async () => {
    if (!candidateData && !token) return

    setApproving(true)
    setError(null)
    setSuccessMessage(null)

    const activeRoleConfig = ROLE_OFFER_CONFIGS[selectedRoleKey] || ROLE_OFFER_CONFIGS['bde']

    try {
      const res = await fetch(`${apiUrl}/api/offer-letter/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token || candidateData.token,
          candidateEmail: candidateData?.candidateEmail,
          role: activeRoleConfig.title,
          department,
          salary,
          startDate,
          adminNotes,
          openingStatement: activeRoleConfig.openingStatement,
          incentiveDescription: activeRoleConfig.incentiveDescription,
          targets: activeRoleConfig.targets,
          reportingTools: activeRoleConfig.reportingTools
        })
      })

      const data = await res.json()
      if (data.success) {
        setSuccessMessage(`✓ Offer Letter successfully approved! Official email with offer document has been dispatched to ${candidateData.candidateEmail}.`)
        setCandidateData((prev) => ({
          ...prev,
          status: 'APPROVED',
          role: activeRoleConfig.title,
          department,
          salary
        }))
      } else {
        setError(data.message || 'Failed to approve offer letter.')
      }
    } catch (err) {
      setError(`Network error: ${err.message}`)
    } finally {
      setApproving(false)
    }
  }

  const activeRoleConfig = ROLE_OFFER_CONFIGS[selectedRoleKey] || ROLE_OFFER_CONFIGS['bde']

  return (
    <div className="admin-review-shell">
      <div className="admin-review-container">

        {/* Header Bar */}
        <header className="admin-review-header">
          <div className="admin-header-title">
            <h1>Infogenx HR Management Portal</h1>
            <p>Candidate Evaluation & Official Offer Letter Release Console</p>
          </div>
          <div className="admin-badge">
            🛡️ Admin Authorization Mode
          </div>
        </header>

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: '#ffffff', borderRadius: '12px' }}>
            <p style={{ fontSize: '16px', color: '#00123C', fontWeight: '600' }}>Loading Offer Request Data...</p>
          </div>
        )}

        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '16px 20px', borderRadius: '10px', marginBottom: '20px', fontWeight: '600' }}>
            ⚠️ {error}
          </div>
        )}

        {successMessage && (
          <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', color: '#166534', padding: '18px 24px', borderRadius: '10px', marginBottom: '24px', fontWeight: '700', fontSize: '15px' }}>
            {successMessage}
          </div>
        )}

        {/* Token Mode: Review Specific Candidate */}
        {!loading && candidateData && (
          <>
            {/* Candidate Summary Card */}
            <div className="candidate-summary-card">
              <div className="cand-info-group">
                <div className="cand-avatar">
                  {candidateData.candidateName?.[0]?.toUpperCase() || 'C'}
                </div>
                <div className="cand-text">
                  <h3>{candidateData.candidateName}</h3>
                  <p>{candidateData.candidateEmail}</p>
                </div>
              </div>

              <div className="cand-meta-badges">
                <span className="badge-score">
                  🎯 Assessment: {candidateData.score || 'Passed'}
                </span>
                <span className={`badge-status ${candidateData.status === 'APPROVED' ? 'approved' : 'pending'}`}>
                  {candidateData.status === 'APPROVED' ? '✓ APPROVED' : '⏳ PENDING HR APPROVAL'}
                </span>
              </div>
            </div>

            {/* Candidate Questionnaire Breakdown Card */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '24px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 2px 8px rgba(0, 18, 60, 0.04)'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#00123C', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📋</span> Candidate Questionnaire & Work Preferences
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', fontSize: '13.5px' }}>
                <div><strong>Phone / WhatsApp:</strong> <span style={{ color: '#334155' }}>{candidateData.phone || 'N/A'}</span></div>
                <div><strong>Location:</strong> <span style={{ color: '#334155' }}>{candidateData.location || 'N/A'}</span></div>
                <div><strong>Experience:</strong> <span style={{ color: '#334155' }}>{candidateData.experience || 'Fresher'}</span></div>
                <div><strong>Qualification:</strong> <span style={{ color: '#334155' }}>{candidateData.qualification || 'N/A'}</span></div>
                <div><strong>Certification:</strong> <span style={{ color: '#334155' }}>{candidateData.certification || 'None'}</span></div>
                <div><strong>Work Status:</strong> <span style={{ color: '#334155' }}>{candidateData.workStatus || 'Not working'}</span></div>
                <div><strong>Work Mode:</strong> <span style={{ color: '#334155' }}>{candidateData.workMode || 'WFH / Flexible'}</span></div>
                <div><strong>Work Duration & Timings:</strong> <span style={{ color: '#334155' }}>{candidateData.workTimings || 'Full Time / Flexible'}</span></div>
                <div><strong>Start Date:</strong> <span style={{ color: '#334155' }}>{candidateData.startDate || 'Immediate'}</span></div>
                <div><strong>Current Salary / Rate:</strong> <span style={{ color: '#334155' }}>{candidateData.currentSalary || 'N/A'}</span></div>
                <div style={{ gridColumn: '1 / -1' }}><strong>Preferred Availability:</strong> <span style={{ color: '#334155' }}>{candidateData.availability || 'Flexible'}</span></div>
                <div><strong>LinkedIn Profile:</strong> {candidateData.linkedin ? <a href={candidateData.linkedin} target="_blank" rel="noreferrer" style={{ color: '#E65525', fontWeight: '600' }}>{candidateData.linkedin} ↗</a> : <span style={{ color: '#64748B' }}>N/A</span>}</div>
                <div><strong>Resume Link:</strong> {candidateData.resumeLink ? <a href={candidateData.resumeLink} target="_blank" rel="noreferrer" style={{ color: '#000E68', fontWeight: '600' }}>Open Google Drive Resume ↗</a> : <span style={{ color: '#64748B' }}>N/A</span>}</div>
              </div>
            </div>

            {/* Approval & Customization Form */}
            <div className="approval-form-card">
              <h3 className="form-section-title">
                📝 Configure Offer Terms & Compensation Package
              </h3>

              <div className="form-grid-2col">
                {/* Role Selector */}
                <div className="admin-field-group">
                  <label htmlFor="admin-role-select">Designated Job Role Track</label>
                  <select
                    id="admin-role-select"
                    className="admin-field-select"
                    value={selectedRoleKey}
                    onChange={handleRoleChange}
                    disabled={candidateData.status === 'APPROVED'}
                  >
                    {Object.values(ROLE_OFFER_CONFIGS).map((cfg) => (
                      <option key={cfg.id} value={cfg.id}>
                        {cfg.title} — ({cfg.department})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Department */}
                <div className="admin-field-group">
                  <label htmlFor="admin-dept-input">Assigned Department</label>
                  <input
                    id="admin-dept-input"
                    type="text"
                    className="admin-field-input"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    disabled={candidateData.status === 'APPROVED'}
                  />
                </div>
              </div>

              <div className="form-grid-2col">
                {/* Monthly Salary */}
                <div className="admin-field-group">
                  <label htmlFor="admin-salary-input">Gross Monthly Remuneration</label>
                  <input
                    id="admin-salary-input"
                    type="text"
                    className="admin-field-input"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    placeholder="e.g. ₹35,000 per month"
                    disabled={candidateData.status === 'APPROVED'}
                  />
                </div>

                {/* Scheduled Start Date */}
                <div className="admin-field-group">
                  <label htmlFor="admin-startdate-input">Scheduled Joining / Start Date</label>
                  <input
                    id="admin-startdate-input"
                    type="text"
                    className="admin-field-input"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    placeholder="e.g. 17th September 2026"
                    disabled={candidateData.status === 'APPROVED'}
                  />
                </div>
              </div>

              {/* Admin Remarks */}
              <div className="admin-field-group" style={{ marginTop: '10px' }}>
                <label htmlFor="admin-notes-input">Internal Remarks / Management Notes (Optional)</label>
                <textarea
                  id="admin-notes-input"
                  className="admin-field-textarea"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="e.g. Approved with pre-negotiated cloud cert allowance. Candidate showed exceptional problem solving in sprint module."
                  disabled={candidateData.status === 'APPROVED'}
                />
              </div>

              {/* Action Buttons */}
              <div className="admin-action-bar">
                <button
                  type="button"
                  className="btn-admin-approve"
                  onClick={handleApprove}
                  disabled={approving || candidateData.status === 'APPROVED'}
                >
                  {approving ? '⏳ Approving & Dispatching...' : candidateData.status === 'APPROVED' ? '✓ Offer Already Approved' : '✓ Approve & Issue Offer Letter to Student'}
                </button>
              </div>
            </div>

            {/* Live Document Preview */}
            <div style={{ background: '#ffffff', borderRadius: '14px', padding: '30px', border: '1px solid #e2e8f0', boxShadow: '0 4px 18px rgba(0, 18, 60, 0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h4 style={{ margin: 0, color: '#00123C', fontSize: '16px', fontWeight: '700' }}>
                  📄 Live Offer Document Preview
                </h4>
                <span style={{ fontSize: '13px', color: '#64748b' }}>
                  This is the exact document the student will see and receive.
                </span>
              </div>

              <div style={{ padding: '24px', border: '1px solid #e2e8f0', borderRadius: '10px', background: '#fafafa' }}>
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <img src={headerImg} alt="Infogenx" style={{ maxHeight: '80px', maxWidth: '100%', objectFit: 'contain' }} />
                </div>
                <p><strong>Position:</strong> {activeRoleConfig.title} ({department})</p>
                <p><strong>Candidate:</strong> {candidateData.candidateName} &lt;{candidateData.candidateEmail}&gt;</p>
                <p><strong>Compensation:</strong> {salary}</p>
                <p><strong>Performance Incentive:</strong> {activeRoleConfig.incentiveDescription}</p>
                <p><strong>Reporting System:</strong> {activeRoleConfig.reportingTools}</p>
              </div>
            </div>
          </>
        )}

        {/* Overview Mode: Directory & Requests (When no specific token is provided) */}
        {!loading && !candidateData && (
          <div>
            {/* Summary KPI Cards */}
            {summary && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '16px',
                marginBottom: '24px'
              }}>
                <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '18px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0, 18, 60, 0.04)', textAlign: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Total Registered</span>
                  <p style={{ fontSize: '26px', fontWeight: '800', color: '#00123C', margin: '4px 0 0' }}>{summary.totalUsers}</p>
                </div>
                <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '18px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0, 18, 60, 0.04)', textAlign: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#2563EB', textTransform: 'uppercase' }}>Candidates / Students</span>
                  <p style={{ fontSize: '26px', fontWeight: '800', color: '#2563EB', margin: '4px 0 0' }}>{summary.candidatesCount}</p>
                </div>
                <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '18px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0, 18, 60, 0.04)', textAlign: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#E65525', textTransform: 'uppercase' }}>Test Users (Unlimited 🧪)</span>
                  <p style={{ fontSize: '26px', fontWeight: '800', color: '#E65525', margin: '4px 0 0' }}>{summary.testUsersCount}</p>
                </div>
                <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '18px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0, 18, 60, 0.04)', textAlign: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#7C3AED', textTransform: 'uppercase' }}>System Admins 🛡️</span>
                  <p style={{ fontSize: '26px', fontWeight: '800', color: '#7C3AED', margin: '4px 0 0' }}>{summary.adminsCount}</p>
                </div>
                <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '18px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0, 18, 60, 0.04)', textAlign: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#16A34A', textTransform: 'uppercase' }}>Pending Offers</span>
                  <p style={{ fontSize: '26px', fontWeight: '800', color: '#D97706', margin: '4px 0 0' }}>{summary.pendingApprovals}</p>
                </div>
              </div>
            )}

            {/* Navigation Tabs */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
              <button
                type="button"
                onClick={() => setActiveTab('directory')}
                style={{
                  padding: '12px 24px',
                  borderRadius: '10px',
                  border: 'none',
                  background: activeTab === 'directory' ? 'linear-gradient(90deg, #00123C 0%, #E65525 100%)' : '#FFFFFF',
                  color: activeTab === 'directory' ? '#FFFFFF' : '#00123C',
                  fontWeight: '700',
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxShadow: activeTab === 'directory' ? '0 4px 14px rgba(230, 85, 37, 0.25)' : '0 1px 3px rgba(0,0,0,0.06)'
                }}
              >
                👥 Candidate Directory &amp; Role Management ({allUsers.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('offers')}
                style={{
                  padding: '12px 24px',
                  borderRadius: '10px',
                  border: 'none',
                  background: activeTab === 'offers' ? 'linear-gradient(90deg, #00123C 0%, #E65525 100%)' : '#FFFFFF',
                  color: activeTab === 'offers' ? '#FFFFFF' : '#00123C',
                  fontWeight: '700',
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxShadow: activeTab === 'offers' ? '0 4px 14px rgba(230, 85, 37, 0.25)' : '0 1px 3px rgba(0,0,0,0.06)'
                }}
              >
                📋 Offer Letter Queue ({allRequests.length})
              </button>
            </div>

            {/* TAB 1: Candidates & Users Directory */}
            {activeTab === 'directory' && (
              <div className="admin-table-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', color: '#00123C' }}>
                    👥 Registered Candidate Users (MySQL cPanel DB: <code style={{ color: '#E65525' }}>infogenxblog</code>)
                  </h3>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      placeholder="Search candidate name, email, or role..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        fontSize: '13.5px',
                        width: '240px'
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleOpenCreateUser}
                      style={{
                        padding: '8px 18px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'linear-gradient(90deg, #15803D 0%, #16A34A 100%)',
                        color: '#FFFFFF',
                        fontWeight: '700',
                        fontSize: '13.5px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(22, 163, 74, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      ➕ Add User / Role
                    </button>
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table className="requests-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Assigned Role</th>
                        <th>Test Attempts</th>
                        <th>Mobile</th>
                        <th>Location</th>
                        <th>Qualification</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allUsers
                        .filter((u) => {
                          const query = userSearch.toLowerCase()
                          return (
                            (u.name || '').toLowerCase().includes(query) ||
                            (u.email || '').toLowerCase().includes(query) ||
                            (u.role || '').toLowerCase().includes(query)
                          )
                        })
                        .map((u) => (
                          <tr key={u.id}>
                            <td>#{u.id}</td>
                            <td><strong>{u.name}</strong></td>
                            <td>{u.email}</td>
                            <td>
                              <span style={{
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: '700',
                                background: u.role === 'admin' ? '#F3E8FF' : (u.role === 'test_user' ? '#FFF7ED' : '#EFF6FF'),
                                color: u.role === 'admin' ? '#7E22CE' : (u.role === 'test_user' ? '#C2410C' : '#1D4ED8'),
                                border: u.role === 'test_user' ? '1px solid #FDBA74' : 'none'
                              }}>
                                {u.role === 'test_user' ? '🧪 Test User (Unlimited)' : u.role.toUpperCase()}
                              </span>
                            </td>
                            <td>
                              {u.max_attempts === -1 || u.role === 'test_user' || u.role === 'admin' ? (
                                <span style={{ color: '#E65525', fontWeight: '700' }}>Unlimited 🧪 ({u.assessment_attempts || 0} taken)</span>
                              ) : (
                                <span style={{ fontWeight: '700', color: (u.assessment_attempts || 0) >= (u.max_attempts || 1) ? '#DC2626' : '#16A34A' }}>
                                  {u.assessment_attempts || 0} / {u.max_attempts || 1} {(u.assessment_attempts || 0) >= (u.max_attempts || 1) ? '(Exhausted)' : '(Available)'}
                                </span>
                              )}
                            </td>
                            <td>{u.mobile || '—'}</td>
                            <td>{u.location || '—'}</td>
                            <td>{u.qualification || '—'}</td>
                            <td>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  type="button"
                                  className="btn-review-action"
                                  onClick={() => handleOpenEditUser(u)}
                                  style={{ background: '#00123C', padding: '6px 12px' }}
                                >
                                  Edit ✏️
                                </button>
                                <button
                                  type="button"
                                  className="btn-review-action"
                                  onClick={() => handleDeleteUser(u)}
                                  style={{ background: '#DC2626', padding: '6px 10px' }}
                                  title="Delete user"
                                >
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: Offer Requests Queue */}
            {activeTab === 'offers' && (
              <div className="admin-table-card">
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#00123C' }}>
                  📋 Candidate Offer Letter Queue
                </h3>
                {allRequests.length === 0 ? (
                  <p style={{ color: '#64748b', textAlign: 'center', padding: '40px 0' }}>
                    No candidate offer requests found in database.
                  </p>
                ) : (
                  <table className="requests-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Candidate</th>
                        <th>Email</th>
                        <th>Score</th>
                        <th>Assigned Role</th>
                        <th>Salary</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allRequests.map((req) => (
                        <tr key={req.id}>
                          <td>#{req.id}</td>
                          <td><strong>{req.candidate_name}</strong></td>
                          <td>{req.candidate_email}</td>
                          <td>{req.assessment_score}</td>
                          <td>{req.role}</td>
                          <td>{req.salary}</td>
                          <td>
                            <span className={`badge-status ${req.status === 'APPROVED' ? 'approved' : 'pending'}`}>
                              {req.status}
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn-review-action"
                              onClick={() => navigate(`/admin/offer-review?token=${req.token}`)}
                            >
                              Review &amp; Edit →
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Create / Edit User Modal Dialog */}
            {(editingUser || isCreatingUser) && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                background: 'rgba(0, 18, 60, 0.65)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: '20px'
              }}>
                <div style={{
                  background: '#FFFFFF',
                  borderRadius: '16px',
                  width: '100%',
                  maxWidth: '540px',
                  padding: '30px',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                  border: '1px solid #CBD5E1'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                    <div>
                      <h3 style={{ margin: 0, color: '#00123C', fontSize: '20px', fontWeight: '800' }}>
                        {isCreatingUser ? '➕ Add User to cPanel DB' : '✏️ Edit User Details & Role'}
                      </h3>
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B' }}>
                        {isCreatingUser ? 'Manually register a candidate, tester, or admin' : `Managing ${editingUser.name} (${editingUser.email})`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setEditingUser(null); setIsCreatingUser(false); }}
                      style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748B' }}
                    >
                      ✕
                    </button>
                  </div>

                  {userEditMsg && (
                    <div style={{
                      padding: '12px 16px',
                      borderRadius: '8px',
                      marginBottom: '16px',
                      fontSize: '13.5px',
                      fontWeight: '700',
                      background: userEditMsg.type === 'success' ? '#F0FDF4' : '#FEF2F2',
                      color: userEditMsg.type === 'success' ? '#15803D' : '#991B1B',
                      border: userEditMsg.type === 'success' ? '1px solid #86EFAC' : '1px solid #FCA5A5'
                    }}>
                      {userEditMsg.text}
                    </div>
                  )}

                  <form onSubmit={isCreatingUser ? handleCreateUser : handleSaveUser} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>Full Name</label>
                      <input
                        type="text"
                        required
                        value={userForm.name}
                        onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>Email Address</label>
                      <input
                        type="email"
                        required
                        value={userForm.email}
                        onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                          Assigned User Role
                        </label>
                        <select
                          value={userForm.role}
                          onChange={(e) => {
                            const newRole = e.target.value
                            setUserForm({
                              ...userForm,
                              role: newRole,
                              max_attempts: newRole === 'test_user' || newRole === 'admin' ? -1 : 1
                            })
                          }}
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #00123C', fontSize: '13.5px', fontWeight: '700', background: '#FFF8F3', boxSizing: 'border-box' }}
                        >
                          <option value="candidate">Candidate (1 Attempt Only)</option>
                          <option value="student">Student (1 Attempt Only)</option>
                          <option value="test_user">Test User (🧪 Unlimited Attempts)</option>
                          <option value="admin">Administrator (🛡️ Monitor &amp; Edit All)</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                          Max Attempts (-1 = Unlimited)
                        </label>
                        <input
                          type="number"
                          value={userForm.max_attempts}
                          onChange={(e) => setUserForm({ ...userForm, max_attempts: parseInt(e.target.value, 10) })}
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>Mobile / Phone</label>
                        <input
                          type="text"
                          value={userForm.mobile}
                          onChange={(e) => setUserForm({ ...userForm, mobile: e.target.value })}
                          placeholder="+91..."
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>Location</label>
                        <input
                          type="text"
                          value={userForm.location}
                          onChange={(e) => setUserForm({ ...userForm, location: e.target.value })}
                          placeholder="City / State"
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>

                    {!isCreatingUser && (
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                          Test Attempts Taken (Change to 0 to grant re-test)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={userForm.assessment_attempts}
                          onChange={(e) => setUserForm({ ...userForm, assessment_attempts: parseInt(e.target.value, 10) || 0 })}
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', boxSizing: 'border-box' }}
                        />
                      </div>
                    )}

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>Qualification</label>
                      <input
                        type="text"
                        value={userForm.qualification}
                        onChange={(e) => setUserForm({ ...userForm, qualification: e.target.value })}
                        placeholder="Degree / Major"
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                        {isCreatingUser ? 'Initial Password *' : 'Reset Password (Leave blank to keep current)'}
                      </label>
                      <input
                        type="text"
                        required={isCreatingUser}
                        value={userForm.password}
                        onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                        placeholder={isCreatingUser ? 'Set login password' : 'New Password (Optional)'}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px' }}>
                      <button
                        type="button"
                        onClick={() => { setEditingUser(null); setIsCreatingUser(false); }}
                        style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#334155', fontWeight: '700', cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={savingUser}
                        style={{
                          padding: '10px 24px',
                          borderRadius: '8px',
                          border: 'none',
                          background: 'linear-gradient(90deg, #00123C 0%, #E65525 100%)',
                          color: '#FFFFFF',
                          fontWeight: '700',
                          cursor: savingUser ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {savingUser ? 'Saving Changes...' : isCreatingUser ? 'Create User in cPanel DB ✓' : 'Save User Changes ✓'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

export default AdminOfferReviewPage
