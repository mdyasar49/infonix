import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { ROLE_OFFER_CONFIGS, detectRoleKey } from '../../data/roleOfferConfigs'
import headerImg from '../../assets/offer/infogenx_header.jpeg'
import directorSigImg from '../../assets/offer/director_signature.jpeg'
import './OfferLetterView.css'

function getFormattedDate(d = new Date()) {
  const day = d.getDate()
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  const suffix = (day === 1 || day === 21 || day === 31) ? 'st' :
                 (day === 2 || day === 22) ? 'nd' :
                 (day === 3 || day === 23) ? 'rd' : 'th'
  return `${day}${suffix} ${monthNames[d.getMonth()]} ${d.getFullYear()}`
}

function OfferLetterView() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Dynamic Role Track Configuration
  const initialRoleKey = detectRoleKey(user?.department || user?.role || user?.stream)
  const [selectedRoleKey, setSelectedRoleKey] = useState(initialRoleKey)
  const activeRoleConfig = ROLE_OFFER_CONFIGS[selectedRoleKey] || ROLE_OFFER_CONFIGS['bde']

  const [customSalary, setCustomSalary] = useState(activeRoleConfig.defaultSalary)
  const [signatureMode, setSignatureMode] = useState('draw') // 'draw' | 'upload'
  const [signatureData, setSignatureData] = useState(null)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailStatus, setEmailStatus] = useState(null) // { type: 'success' | 'error', message: string }
  const [isDrawing, setIsDrawing] = useState(false)
  const [canvasHasContent, setCanvasHasContent] = useState(false)

  // Admin Approval Workflow State
  const [approvalStatus, setApprovalStatus] = useState('CHECKING') // 'CHECKING' | 'PENDING_APPROVAL' | 'APPROVED'
  const [offerToken, setOfferToken] = useState(null)

  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)

  const candidateName = user?.name || user?.email?.split('@')[0] || 'Candidate'
  const candidateEmail = user?.email || ''
  const todayDateStr = getFormattedDate()
  const startDateStr = getFormattedDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))

  const defaultApi = window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://candidates.infogenx.com'
  const apiUrl = import.meta.env.VITE_API_URL || defaultApi
  const isAdmin = user?.role === 'ADMIN' || user?.email === 'test@infogenx.com' || user?.email?.includes('admin@')

  // Check Approval Status from backend on mount
  useEffect(() => {
    async function checkApproval() {
      if (!candidateEmail) return
      try {
        const res = await fetch(`${apiUrl}/api/offer-letter/status?email=${encodeURIComponent(candidateEmail)}`)
        const data = await res.json()
        if (data.success) {
          if (data.status === 'APPROVED' || data.status === 'ACCEPTED') {
            setApprovalStatus('APPROVED')
            if (data.offer) {
              setOfferToken(data.offer.token)
              if (data.offer.role) {
                const rKey = detectRoleKey(data.offer.role)
                setSelectedRoleKey(rKey)
              }
              if (data.offer.salary) {
                setCustomSalary(data.offer.salary)
              }
            }
          } else if (data.status === 'PENDING_APPROVAL') {
            setApprovalStatus('PENDING_APPROVAL')
            if (data.offer?.token) setOfferToken(data.offer.token)
          } else {
            // NOT_REQUESTED: Trigger automatic request to Admin
            handleAutoRequest()
          }
        } else {
          setApprovalStatus('PENDING_APPROVAL')
        }
      } catch (err) {
        console.warn('Error checking offer status:', err)
        setApprovalStatus('PENDING_APPROVAL')
      }
    }

    const handleAutoRequest = async () => {
      try {
        const storedResult = sessionStorage.getItem(`infogenx_assessment_result_${candidateEmail}`)
        let scoreStr = 'Passed'
        if (storedResult) {
          try {
            const parsed = JSON.parse(storedResult)
            scoreStr = `${parsed.percentage}% (${parsed.score}/50)`
          } catch (e) {}
        }

        const res = await fetch(`${apiUrl}/api/offer-letter/request-approval`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            candidateName,
            candidateEmail,
            score: scoreStr,
            requestedRole: activeRoleConfig.title,
            department: activeRoleConfig.department
          })
        })
        const data = await res.json()
        if (data.success) {
          setApprovalStatus(data.status || 'PENDING_APPROVAL')
          if (data.token) setOfferToken(data.token)
        }
      } catch (e) {
        setApprovalStatus('PENDING_APPROVAL')
      }
    }

    checkApproval()
  }, [candidateEmail, apiUrl])

  // Update default salary when changing role track
  const handleRoleChange = (e) => {
    const newKey = e.target.value
    setSelectedRoleKey(newKey)
    if (ROLE_OFFER_CONFIGS[newKey]) {
      setCustomSalary(ROLE_OFFER_CONFIGS[newKey].defaultSalary)
    }
  }

  // Load saved signature from session storage if present
  useEffect(() => {
    if (user?.email) {
      const savedSig = sessionStorage.getItem(`infogenx_offer_sig_${user.email}`)
      if (savedSig) {
        setSignatureData(savedSig)
      }
    }
  }, [user])

  // Canvas Drawing Handlers
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#00123C'
  }, [signatureMode])

  const getCanvasPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    }
  }

  const startDraw = (e) => {
    e.preventDefault()
    setIsDrawing(true)
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const pos = getCanvasPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
  }

  const draw = (e) => {
    if (!isDrawing) return
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const pos = getCanvasPos(e, canvas)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    setCanvasHasContent(true)
  }

  const stopDraw = () => {
    setIsDrawing(false)
  }

  const clearDrawCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setCanvasHasContent(false)
  }

  const applyDrawnSignature = () => {
    const canvas = canvasRef.current
    if (!canvas || !canvasHasContent) return
    const dataUrl = canvas.toDataURL('image/png')
    setSignatureData(dataUrl)
    if (user?.email) {
      sessionStorage.setItem(`infogenx_offer_sig_${user.email}`, dataUrl)
    }
  }

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, JPEG).')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result
      setSignatureData(dataUrl)
      if (user?.email) {
        sessionStorage.setItem(`infogenx_offer_sig_${user.email}`, dataUrl)
      }
    }
    reader.readAsDataURL(file)
  }

  const resetSignature = () => {
    setSignatureData(null)
    setCanvasHasContent(false)
    if (user?.email) {
      sessionStorage.removeItem(`infogenx_offer_sig_${user.email}`)
    }
  }

  // Load html2pdf dynamically
  const loadHtml2Pdf = () => {
    return new Promise((resolve) => {
      if (window.html2pdf) return resolve(window.html2pdf)
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
      script.onload = () => resolve(window.html2pdf)
      script.onerror = () => resolve(null) // fallback
      document.head.appendChild(script)
    })
  }

  // Print or Download PDF
  const handleDownloadPDF = async () => {
    const docElement = document.getElementById('printable-offer-letter')
    if (!docElement) {
      window.print()
      return
    }

    try {
      const h2p = await loadHtml2Pdf()
      if (h2p) {
        const opt = {
          margin: [8, 8, 8, 8],
          filename: `OfferLetter-${candidateName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, letterRendering: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        }
        await h2p().set(opt).from(docElement).save()
        return
      }
    } catch (e) {
      console.warn('html2pdf fallback to print:', e)
    }
    window.print()
  }

  // Send Email via Backend
  const handleSendEmail = async () => {
    if (!candidateEmail) {
      alert('Candidate email not found. Please log in again.')
      return
    }

    if (!signatureData) {
      const proceed = window.confirm('You have not added your signature yet. Do you want to sign the letter first?\n\nClick Cancel to sign, or OK to send unsigned.')
      if (!proceed) return
    }

    setSendingEmail(true)
    setEmailStatus(null)

    try {
      let pdfBase64 = null
      const docElement = document.getElementById('printable-offer-letter')

      if (docElement) {
        try {
          const h2p = await loadHtml2Pdf()
          if (h2p) {
            const opt = {
              margin: [8, 8, 8, 8],
              image: { type: 'jpeg', quality: 0.95 },
              html2canvas: { scale: 2, useCORS: true },
              jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            }
            const dataUri = await h2p().set(opt).from(docElement).outputPdf('datauristring')
            if (dataUri && dataUri.includes(',')) {
              pdfBase64 = dataUri.split(',')[1]
            }
          }
        } catch (pdfErr) {
          console.warn('Could not generate client-side PDF string:', pdfErr)
        }
      }

      const defaultApi = window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://candidates.infogenx.com'
      const apiUrl = import.meta.env.VITE_API_URL || defaultApi

      const res = await fetch(`${apiUrl}/api/offer-letter/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateName,
          candidateEmail,
          role: activeRoleConfig.title,
          department: activeRoleConfig.department,
          salary: customSalary,
          startDate: startDateStr,
          openingStatement: activeRoleConfig.openingStatement,
          incentiveDescription: activeRoleConfig.incentiveDescription,
          targets: activeRoleConfig.targets,
          reportingTools: activeRoleConfig.reportingTools,
          signatureDataUrl: signatureData,
          pdfBase64
        })
      })

      const data = await res.json()
      if (data.success) {
        setEmailStatus({
          type: 'success',
          message: `✓ Offer Letter (PDF) successfully sent to ${candidateEmail}! Please check your inbox.`
        })
      } else {
        setEmailStatus({
          type: 'error',
          message: data.message || 'Failed to send offer letter email.'
        })
      }
    } catch (err) {
      setEmailStatus({
        type: 'error',
        message: `Network error: ${err.message}. Please try again.`
      })
    } finally {
      setSendingEmail(false)
    }
  }

  return (
    <div className="offer-letter-view-container">

      {/* Top Action Bar (hidden during printing) */}
      <div className="offer-actions-bar no-print">
        <div className="offer-actions-left">
          <button type="button" className="btn-secondary" onClick={() => navigate('/result')}>
            ← Back to Results
          </button>
          {(approvalStatus === 'APPROVED' || isAdmin) ? (
            <>
              <button type="button" className="btn-primary" onClick={handleDownloadPDF}>
                🖨️ Download PDF / Print
              </button>
              <button
                type="button"
                className="btn-accent"
                onClick={handleSendEmail}
                disabled={sendingEmail}
              >
                {sendingEmail ? '✉️ Sending...' : '✉️ Send Signed PDF to My Email'}
              </button>
            </>
          ) : (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#FFFBEB', borderRadius: '8px', color: '#B45309', fontSize: '13px', fontWeight: '700', border: '1px solid #FDE68A' }}>
              <span>🔒 Official PDF &amp; Email release unlocks upon Admin Approval</span>
            </div>
          )}
        </div>

        <div className="offer-actions-right">
          <button type="button" className="btn-next-task" onClick={() => navigate('/task')}>
            Proceed to Recruitment Task →
          </button>
        </div>
      </div>

      {/* Email Alert Banner */}
      {emailStatus && (
        <div className={`offer-alert-banner no-print ${emailStatus.type}`}>
          {emailStatus.message}
        </div>
      )}

      {/* Pending Admin Approval Banner */}
      {approvalStatus === 'PENDING_APPROVAL' && (
        <div className="offer-pending-card no-print">
          <div className="offer-pending-header">
            <h3>⏳ Offer Letter Pending HR / Management Review</h3>
            <span className="badge-pending-status">
              Awaiting Admin Approval
            </span>
          </div>
          <p className="offer-pending-desc">
            Your assessment outcome has been recorded and submitted to the <strong>Infogenx HR Management Team</strong>.
            The Admin is currently reviewing your profile, validating your department track, and customizing your official compensation and start date.
            Once approved by Management, your official Offer Letter will unlock here and you will receive a notification email.
          </p>

          <div className="approval-timeline">
            <div className="timeline-step completed">
              <span className="step-circle">✓</span>
              <span>1. Assessment Completed</span>
            </div>
            <div className="timeline-step active">
              <span className="step-circle">⏳</span>
              <span>2. Admin Review &amp; Approval (In Progress)</span>
            </div>
            <div className="timeline-step">
              <span className="step-circle">3</span>
              <span>3. Offer Released &amp; E-Signature</span>
            </div>
          </div>

          {isAdmin && (
            <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px dashed #FDE68A', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <span style={{ fontSize: '13px', color: '#92400E', fontWeight: '700' }}>
                🛡️ You are logged in as Admin / HR Reviewer:
              </span>
              <button
                type="button"
                className="btn-open-admin-console"
                onClick={() => navigate(offerToken ? `/admin/offer-review?token=${offerToken}` : '/admin/offer-review')}
              >
                Open Admin Approval Console →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Approved Success Notification Banner */}
      {approvalStatus === 'APPROVED' && (
        <div className="offer-approved-banner no-print">
          <span>✓</span>
          <span>Official Offer Letter has been reviewed and approved by Infogenx Management. Please review the terms and provide your signature below.</span>
        </div>
      )}

      {/* Role & Package Customizer Box (Visible to Admin or for Preview) */}
      {(isAdmin || approvalStatus === 'APPROVED') && (
        <div className="role-customizer-box no-print">
          <div className="role-customizer-header">
            <h4>💼 Position Track & Package Configuration</h4>
            <span className="dept-badge">
              🏢 {activeRoleConfig.department}
            </span>
          </div>

          <div className="role-customizer-grid">
            <div className="role-field-group">
              <label htmlFor="role-select">Select Candidate Job Role</label>
              <select
                id="role-select"
                className="role-select-input"
                value={selectedRoleKey}
                onChange={handleRoleChange}
              >
                {Object.values(ROLE_OFFER_CONFIGS).map((cfg) => (
                  <option key={cfg.id} value={cfg.id}>
                    {cfg.title} — ({cfg.department})
                  </option>
                ))}
              </select>
            </div>

            <div className="role-field-group">
              <label htmlFor="salary-input">Monthly Gross Remuneration</label>
              <div className="salary-input-wrapper">
                <input
                  id="salary-input"
                  type="text"
                  className="salary-text-input"
                  value={customSalary}
                  onChange={(e) => setCustomSalary(e.target.value)}
                  placeholder="e.g. ₹35,000 per month"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* E-Signature Control Box (Available when Approved or in Admin Mode) */}
      {approvalStatus === 'APPROVED' && !signatureData && (
        <div className="signature-input-box no-print">
          <div className="sig-box-header">
            <h3>✍️ Provide Your Signature to Accept Offer</h3>
            <p>You can either draw your signature below or upload a photo of your signature.</p>
          </div>

          <div className="sig-mode-tabs">
            <button
              type="button"
              className={`sig-tab-btn ${signatureMode === 'draw' ? 'active' : ''}`}
              onClick={() => setSignatureMode('draw')}
            >
              ✏️ Draw Signature
            </button>
            <button
              type="button"
              className={`sig-tab-btn ${signatureMode === 'upload' ? 'active' : ''}`}
              onClick={() => setSignatureMode('upload')}
            >
              📁 Upload Signature Image
            </button>
          </div>

          {signatureMode === 'draw' ? (
            <div className="canvas-wrapper">
              <canvas
                ref={canvasRef}
                width={650}
                height={160}
                className="sig-canvas"
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={stopDraw}
                onMouseLeave={stopDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={stopDraw}
              />
              <div className="canvas-btn-row">
                <button type="button" className="btn-sm-clear" onClick={clearDrawCanvas}>
                  Clear
                </button>
                <button
                  type="button"
                  className="btn-sm-apply"
                  onClick={applyDrawnSignature}
                  disabled={!canvasHasContent}
                >
                  Apply Signature to Offer Letter ✓
                </button>
              </div>
            </div>
          ) : (
            <div className="upload-wrapper">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                className="btn-upload-trigger"
                onClick={() => fileInputRef.current?.click()}
              >
                Choose Signature Image (PNG, JPG)
              </button>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '8px 0 0' }}>
                Tip: Use a clear photo or scan of your signature on white paper.
              </p>
            </div>
          )}
        </div>
      )}

      {/* The Printable Official Offer Letter Document */}
      <div className="offer-document" id="printable-offer-letter">
        {/* Header Logo Banner */}
        <div className="doc-header">
          <img src={headerImg} alt="Infogenx Private Limited" className="doc-logo" />
        </div>

        <div className="doc-date">Date: {todayDateStr}</div>

        <div className="doc-salutation">Dear {candidateName},</div>

        <p className="doc-p">
          We are pleased to offer you the position of <strong>{activeRoleConfig.title}</strong> in our <strong>{activeRoleConfig.department}</strong> division at <strong>Infogenx Private Limited</strong>.
          {' '}{activeRoleConfig.openingStatement}
        </p>

        <p className="doc-p">
          Your employment will be governed by the following terms and conditions:
        </p>

        <h4 className="doc-h4">1. Remuneration & Compensation</h4>
        <ul className="doc-ul">
          <li><strong>Fixed Monthly Salary:</strong> You will receive a consolidated gross salary of <strong>{customSalary}</strong>.</li>
          <li><strong>Performance Incentives:</strong> {activeRoleConfig.incentiveDescription}</li>
          <li><strong>Payment Schedule:</strong> Salary and earned performance incentives will be transferred to your designated bank account during the first week of every month, following verification of your monthly deliverables.</li>
        </ul>

        <h4 className="doc-h4">2. Performance Expectations & Targets</h4>
        <ul className="doc-ul">
          {activeRoleConfig.targets.map((tgt, idx) => (
            <li key={idx}>
              <strong>{tgt.label}:</strong> {tgt.text}
            </li>
          ))}
        </ul>

        <h4 className="doc-h4">3. Reporting & Operations</h4>
        <p className="doc-p">
          As part of our data-driven approach, you are required to maintain a daily log of your activities, code commits, and project milestones in the company’s designated operational systems (<strong>{activeRoleConfig.reportingTools}</strong>). This report must be kept up to date to facilitate monthly payouts.
        </p>

        <h4 className="doc-h4">4. Acceptance and Commencement</h4>
        <p className="doc-p">
          Your official start date is scheduled for <strong>{startDateStr}</strong>. To accept this offer, please sign and return this letter.
        </p>

        {/* Authorization & Candidate Acceptance Signatures */}
        <div className="doc-signature-grid">
          {/* Company Authorization */}
          <div className="doc-sig-col">
            <h5 className="doc-sig-h5">Authorization</h5>
            <p className="doc-sig-sub">For Infogenx Private Limited:</p>
            <div className="doc-sig-img-container">
              <img src={directorSigImg} alt="Director Signature" className="doc-director-sig" />
            </div>
            <p className="doc-sig-name"><strong>Nithyanand Arumugham</strong></p>
            <p className="doc-sig-detail">Director</p>
            <p className="doc-sig-detail">Phone: +91 97878 06366</p>
            <p className="doc-sig-detail">Email: nithyanand.a@infogenx.com.au</p>
            <p className="doc-sig-detail">Date: {todayDateStr}</p>
          </div>

          {/* Candidate Acceptance */}
          <div className="doc-sig-col candidate-col">
            <h5 className="doc-sig-h5">Candidate Acceptance</h5>
            <p className="doc-sig-sub">
              I, <strong>{candidateName}</strong>, accept the offer of employment as <strong>{activeRoleConfig.title}</strong> under the terms and conditions outlined above.
            </p>
            <div className="doc-sig-img-container">
              {signatureData ? (
                <img src={signatureData} alt="Candidate E-Signature" className="doc-candidate-sig" />
              ) : (
                <div className="doc-sig-placeholder">
                  [Draw or upload your signature above]
                </div>
              )}
            </div>
            <p className="doc-sig-name"><strong>{candidateName}</strong></p>
            <p className="doc-sig-detail">Date: {todayDateStr}</p>
            {signatureData && (
              <div className="no-print" style={{ marginTop: '8px' }}>
                <button type="button" className="btn-resign" onClick={resetSignature}>
                  Change / Clear Signature ↺
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Document Footer */}
        <div className="doc-footer">
          Infogenx Private Limited • Official Candidate Onboarding System • https://candidates.infogenx.com
        </div>
      </div>
    </div>
  )
}

export default OfferLetterView
