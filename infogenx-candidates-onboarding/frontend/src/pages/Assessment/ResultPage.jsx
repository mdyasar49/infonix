import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import './ResultPage.css'

function ResultPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [result, setResult] = useState(null)
  const [attemptNumber, setAttemptNumber] = useState(1)

  const defaultApi = window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://candidates.infogenx.com'
  const apiUrl = import.meta.env.VITE_API_URL || defaultApi

  // Questionnaire form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    location: '',
    experience: 'Fresher',
    qualification: '',
    certification: 'None',
    linkedin: '',
    resumeLink: '',
    workTimings: '8 Hours / Day (Flexible timings)',
    startDate: 'Immediate',
    currentSalary: 'Not Applicable / Fresher',
    workStatus: 'Not working',
    workMode: 'WFH all days with Fixed Day/hrs',
    availability: 'Weekday (9:00 AM - 6:00 PM IST) & Weekend on request'
  })

  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)

  useEffect(() => {
    if (user?.email) {
      const storedResult = sessionStorage.getItem(`infogenx_assessment_result_${user.email}`)
      const storedCount = sessionStorage.getItem(`infogenx_attempt_count_${user.email}`)
      const storedSub = sessionStorage.getItem(`infogenx_profile_submitted_${user.email}`)
      const savedProfile = sessionStorage.getItem(`infogenx_candidate_profile_${user.email}`)

      if (storedResult) {
        try {
          const parsed = JSON.parse(storedResult)
          setResult(parsed)
        } catch (e) {
          // ignore
        }
      }

      if (storedCount) {
        setAttemptNumber(parseInt(storedCount, 10))
      }

      if (storedSub === 'true') {
        setAlreadySubmitted(true)
      }

      // Prepopulate form data from user or saved session
      if (savedProfile) {
        try {
          const parsedProf = JSON.parse(savedProfile)
          setFormData(parsedProf)
        } catch (e) {}
      } else {
        setFormData(prev => ({
          ...prev,
          name: user.name || '',
          phone: user.mobile || user.phone || '',
          location: user.location || 'Chennai, Tamil Nadu',
          qualification: user.qualification || 'B.E. Computer Science & Engineering'
        }))
      }
    }
  }, [user])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const isTestUser = user?.role === 'test_user' || user?.role === 'test'

  const handleReattempt = () => {
    if (!isTestUser) return // Candidates are strictly limited to 1 attempt
    const nextAttempt = attemptNumber + 1
    if (user?.email) {
      sessionStorage.setItem(`infogenx_attempt_count_${user.email}`, nextAttempt.toString())
    }
    navigate('/assessment')
  }

  const handleSubmitProfile = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.phone) {
      setSubmitError('Please provide your name and contact/WhatsApp number.')
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    try {
      const scoreStr = result ? `${result.percentage}% (${result.score}/50)` : 'Passed'

      const res = await fetch(`${apiUrl}/api/offer-letter/request-approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateName: formData.name,
          candidateEmail: user?.email,
          phone: formData.phone,
          location: formData.location,
          experience: formData.experience,
          qualification: formData.qualification,
          certification: formData.certification,
          linkedin: formData.linkedin,
          resumeLink: formData.resumeLink,
          workTimings: formData.workTimings,
          startDate: formData.startDate,
          currentSalary: formData.currentSalary,
          workStatus: formData.workStatus,
          workMode: formData.workMode,
          availability: formData.availability,
          score: scoreStr,
          requestedRole: 'Business Development Executive',
          department: 'Business Development & Client Relations'
        })
      })

      const data = await res.json()
      if (data.success) {
        setSubmitSuccess(true)
        setAlreadySubmitted(true)
        if (user?.email) {
          sessionStorage.setItem(`infogenx_profile_submitted_${user.email}`, 'true')
          sessionStorage.setItem(`infogenx_candidate_profile_${user.email}`, JSON.stringify(formData))
        }
        // Auto-navigate to offer letter status after 2.5 seconds
        setTimeout(() => {
          navigate('/offer-letter')
        }, 2500)
      } else {
        setSubmitError(data.message || 'Failed to submit profile. Please try again.')
      }
    } catch (err) {
      setSubmitError(`Submission error: ${err.message}. Please try again.`)
    } finally {
      setSubmitting(false)
    }
  }

  const passed = result ? result.passed : false
  const score = result ? result.score : 0
  const percentage = result ? result.percentage : 0

  return (
    <div className="result-shell" style={{ background: '#F8FAFC', minHeight: 'calc(100vh - 100px)', padding: '24px 20px 48px 20px' }}>
      <main className="result-main" style={{ maxWidth: '940px', margin: '0 auto' }}>
        <div className="result-card" style={{
          background: '#FFFFFF',
          borderRadius: '20px',
          padding: '36px 32px',
          border: '1.5px solid transparent',
          backgroundImage: 'linear-gradient(#ffffff, #ffffff), linear-gradient(135deg, #00123C 0%, #E65525 100%)',
          backgroundClip: 'padding-box, border-box',
          backgroundOrigin: 'padding-box, border-box',
          boxShadow: '0 20px 50px rgba(0, 18, 60, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '28px'
        }}>

          <div style={{ textAlign: 'center', width: '100%' }}>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '800',
              margin: '0 0 8px',
              background: 'linear-gradient(135deg, #00123C 0%, #E65525 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Assessment Result & Verification
            </h1>
            <p style={{ margin: 0, color: '#5C6A86', fontSize: '15px' }}>
              Official evaluation outcome and profile submission for Offer Letter generation.
            </p>
          </div>

          {result ? (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '28px', alignItems: 'center' }}>
              {/* Outcome Banner */}
              <div style={{
                width: '100%',
                background: passed ? '#F0FDF4' : '#FFF7F5',
                border: passed ? '1px solid #86EFAC' : '1px solid rgba(230, 85, 37, 0.3)',
                borderRadius: '18px',
                padding: '24px',
                textAlign: 'center'
              }}>
                <div style={{
                  display: 'inline-block',
                  padding: '6px 20px',
                  borderRadius: '20px',
                  background: passed ? '#22C55E' : '#E65525',
                  color: '#FFFFFF',
                  fontWeight: '800',
                  fontSize: '15px',
                  marginBottom: '12px',
                  letterSpacing: '0.05em'
                }}>
                  {passed ? 'SELECTED ✓' : 'NOT SELECTED ✕'}
                </div>

                <h2 style={{
                  fontSize: '34px',
                  fontWeight: '800',
                  color: passed ? '#15803D' : '#E65525',
                  margin: '0 0 6px'
                }}>
                  {passed ? 'Selected' : 'Not Selected'}
                </h2>

                <p style={{ fontSize: '16px', fontWeight: '600', color: '#475569', margin: 0 }}>
                  {passed
                    ? 'Congratulations! You have been selected to proceed with the HR Training Process.'
                    : 'Thank you for your participation. You have not been selected on this evaluation.'}
                </p>
              </div>

              {/* Metrics Grid */}
              <div style={{
                width: '100%',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '14px'
              }}>
                <div style={{ background: '#FFF8F3', border: '1px solid rgba(0, 18, 60, 0.08)', borderRadius: '14px', padding: '16px', textAlign: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#5C6A86', fontWeight: '700', textTransform: 'uppercase' }}>Evaluation Status</span>
                  <p style={{ fontSize: '18px', fontWeight: '800', color: passed ? '#15803D' : '#E65525', margin: '4px 0 0' }}>
                    {passed ? 'Selected' : 'Not Selected'}
                  </p>
                </div>

                <div style={{ background: '#FFF8F3', border: '1px solid rgba(0, 18, 60, 0.08)', borderRadius: '14px', padding: '16px', textAlign: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#5C6A86', fontWeight: '700', textTransform: 'uppercase' }}>Attempt Recorded</span>
                  <p style={{ fontSize: '18px', fontWeight: '800', color: isTestUser ? '#E65525' : '#00123C', margin: '4px 0 0' }}>
                    {isTestUser ? `Attempt ${attemptNumber} (Unlimited 🧪)` : `Attempt 1 of 1`}
                  </p>
                </div>

                <div style={{ background: '#FFF8F3', border: '1px solid rgba(0, 18, 60, 0.08)', borderRadius: '14px', padding: '16px', textAlign: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#5C6A86', fontWeight: '700', textTransform: 'uppercase' }}>Next Stage</span>
                  <p style={{ fontSize: '18px', fontWeight: '800', color: passed ? '#22C55E' : '#64748B', margin: '4px 0 0' }}>
                    {passed ? 'HR Training Tasks' : 'Completed'}
                  </p>
                </div>
              </div>

              {/* Candidate Passed: Show Questionnaire and Submission */}
              {passed ? (
                <div style={{ width: '100%' }}>
                  {submitSuccess && (
                    <div style={{
                      background: '#F0FDF4',
                      border: '1.5px solid #22C55E',
                      borderRadius: '12px',
                      padding: '20px',
                      marginBottom: '24px',
                      textAlign: 'center'
                    }}>
                      <h3 style={{ margin: '0 0 6px', color: '#15803D', fontSize: '18px', fontWeight: '800' }}>
                        ✓ Profile Submitted Successfully!
                      </h3>
                      <p style={{ margin: '0 0 10px', color: '#166534', fontSize: '14px' }}>
                        Twilio SMS alert has been dispatched to Executive Leadership, and a confirmation email has been sent to your email address. Redirecting to your Offer Letter tracker...
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate('/offer-letter')}
                        style={{
                          background: '#15803D',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '10px 24px',
                          fontWeight: '700',
                          fontSize: '14px',
                          cursor: 'pointer'
                        }}
                      >
                        Go to Offer Letter Status Now →
                      </button>
                    </div>
                  )}

                  {submitError && (
                    <div style={{
                      background: '#FEF2F2',
                      border: '1.5px solid #F87171',
                      borderRadius: '12px',
                      padding: '16px 20px',
                      color: '#991B1B',
                      marginBottom: '24px',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}>
                      ⚠️ {submitError}
                    </div>
                  )}

                  {alreadySubmitted && !submitSuccess ? (
                    <div style={{
                      background: '#F8FAFC',
                      border: '1px solid #CBD5E1',
                      borderRadius: '16px',
                      padding: '28px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}>✓</div>
                      <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#00123C', margin: '0 0 8px' }}>
                        Your Profile & Assessment Have Been Submitted
                      </h3>
                      <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '580px', margin: '0 auto 20px', lineHeight: '1.6' }}>
                        Your selection status and profile questionnaire details have been sent to Infogenx HR Management and Executive Leadership.
                      </p>
                      <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => navigate('/offer-letter')}
                          style={{
                            background: 'linear-gradient(90deg, #00123C 0%, #E65525 100%)',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '14px 32px',
                            fontSize: '15px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            boxShadow: '0 8px 20px rgba(230, 85, 37, 0.25)'
                          }}
                        >
                          📄 Track & E-Sign Offer Letter
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate('/task')}
                          style={{
                            background: '#FFFFFF',
                            color: '#00123C',
                            border: '2px solid #00123C',
                            borderRadius: '10px',
                            padding: '14px 28px',
                            fontSize: '15px',
                            fontWeight: '700',
                            cursor: 'pointer'
                          }}
                        >
                          Continue to Task →
                        </button>
                      </div>
                    </div>
                  ) : !submitSuccess && (
                    <div style={{
                      background: '#FFFFFF',
                      borderRadius: '16px',
                      border: '1px solid #E2E8F0',
                      padding: '30px',
                      boxShadow: '0 4px 20px rgba(0, 18, 60, 0.04)'
                    }}>
                      <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '16px', marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#00123C', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>📋</span> Candidate Profile & Work Preferences
                        </h3>
                        <p style={{ margin: 0, color: '#64748B', fontSize: '14px' }}>
                          Please confirm your contact details, experience, and working availability. Once submitted, your profile will be sent to Management with an automated Twilio SMS alert and email to issue your Offer Letter.
                        </p>
                      </div>

                      <form onSubmit={handleSubmitProfile} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* Row 1: Name and Phone */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#00123C', marginBottom: '6px' }}>
                              Name <span style={{ color: '#E65525' }}>*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={formData.name}
                              onChange={(e) => handleInputChange('name', e.target.value)}
                              placeholder="Full Name"
                              style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', boxSizing: 'border-box' }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#00123C', marginBottom: '6px' }}>
                              Contact Number and WhatsappNo. <span style={{ color: '#E65525' }}>*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={formData.phone}
                              onChange={(e) => handleInputChange('phone', e.target.value)}
                              placeholder="+91 97878 06366 / +61 403 339 424"
                              style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', boxSizing: 'border-box' }}
                            />
                          </div>
                        </div>

                        {/* Row 2: Location and Experience */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#00123C', marginBottom: '6px' }}>
                              Location <span style={{ color: '#E65525' }}>*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={formData.location}
                              onChange={(e) => handleInputChange('location', e.target.value)}
                              placeholder="City / State (e.g. Chennai, Tamil Nadu)"
                              style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', boxSizing: 'border-box' }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#00123C', marginBottom: '6px' }}>
                              Any Experience
                            </label>
                            <input
                              type="text"
                              value={formData.experience}
                              onChange={(e) => handleInputChange('experience', e.target.value)}
                              placeholder="Fresher / 1.5 Years in Web Development"
                              style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', boxSizing: 'border-box' }}
                            />
                          </div>
                        </div>

                        {/* Row 3: Qualification and Certification */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#00123C', marginBottom: '6px' }}>
                              Qualification
                            </label>
                            <input
                              type="text"
                              value={formData.qualification}
                              onChange={(e) => handleInputChange('qualification', e.target.value)}
                              placeholder="Degree & Major (e.g. B.E. Computer Science)"
                              style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', boxSizing: 'border-box' }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#00123C', marginBottom: '6px' }}>
                              Certification
                            </label>
                            <input
                              type="text"
                              value={formData.certification}
                              onChange={(e) => handleInputChange('certification', e.target.value)}
                              placeholder="e.g. AWS, Full Stack Dev, Python (or None)"
                              style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', boxSizing: 'border-box' }}
                            />
                          </div>
                        </div>

                        {/* Row 4: LinkedIn and Resume Google Drive Link */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#00123C', marginBottom: '6px' }}>
                              LinkedIn profile URL
                            </label>
                            <input
                              type="url"
                              value={formData.linkedin}
                              onChange={(e) => handleInputChange('linkedin', e.target.value)}
                              placeholder="https://linkedin.com/in/yourprofile"
                              style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', boxSizing: 'border-box' }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#00123C', marginBottom: '6px' }}>
                              Resume Google Drive Link
                            </label>
                            <input
                              type="url"
                              value={formData.resumeLink}
                              onChange={(e) => handleInputChange('resumeLink', e.target.value)}
                              placeholder="https://drive.google.com/file/d/..."
                              style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', boxSizing: 'border-box' }}
                            />
                          </div>
                        </div>

                        {/* Row 5: Work Duration & Start Date */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#00123C', marginBottom: '6px' }}>
                              Work Duration & timings you can work
                            </label>
                            <input
                              type="text"
                              value={formData.workTimings}
                              onChange={(e) => handleInputChange('workTimings', e.target.value)}
                              placeholder="e.g. 8 Hours / Day (Flexible timings)"
                              style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', boxSizing: 'border-box' }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#00123C', marginBottom: '6px' }}>
                              Start Date
                            </label>
                            <input
                              type="text"
                              value={formData.startDate}
                              onChange={(e) => handleInputChange('startDate', e.target.value)}
                              placeholder="Immediate / Within 1 week"
                              style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', boxSizing: 'border-box' }}
                            />
                          </div>
                        </div>

                        {/* Row 6: Current Salary and Work Status */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#00123C', marginBottom: '6px' }}>
                              Your Current Monthly Take Home Salary or Hourly rate if u r working
                            </label>
                            <input
                              type="text"
                              value={formData.currentSalary}
                              onChange={(e) => handleInputChange('currentSalary', e.target.value)}
                              placeholder="e.g. 25,000 INR / Month or Fresher"
                              style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', boxSizing: 'border-box' }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#00123C', marginBottom: '6px' }}>
                              Your Current Work Status
                            </label>
                            <select
                              value={formData.workStatus}
                              onChange={(e) => handleInputChange('workStatus', e.target.value)}
                              style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', background: '#FFFFFF', boxSizing: 'border-box' }}
                            >
                              <option value="Not working">*Not working</option>
                              <option value="Freelancer">*Freelancer</option>
                              <option value="Working in a Organisation">*Working in a Organisation</option>
                            </select>
                          </div>
                        </div>

                        {/* Row 7: If Working Mode and Preferred Availability */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#00123C', marginBottom: '6px' }}>
                              If Working then (Mode)
                            </label>
                            <select
                              value={formData.workMode}
                              onChange={(e) => handleInputChange('workMode', e.target.value)}
                              style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', background: '#FFFFFF', boxSizing: 'border-box' }}
                            >
                              <option value="WFH all days with Fixed Day/hrs">*WFH all days with Fixed Day/hrs</option>
                              <option value="Hybrid">*Hybrid</option>
                              <option value="Flexible">*Flexible</option>
                            </select>
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#00123C', marginBottom: '6px' }}>
                              Preferred Availability (Weekday and Weekend Time Slots)
                            </label>
                            <input
                              type="text"
                              value={formData.availability}
                              onChange={(e) => handleInputChange('availability', e.target.value)}
                              placeholder="Weekday 9 AM - 6 PM IST, Weekend on request"
                              style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', boxSizing: 'border-box' }}
                            />
                          </div>
                        </div>

                        {/* Submit CTA */}
                        <div style={{ textAlign: 'center', marginTop: '12px' }}>
                          <button
                            type="submit"
                            disabled={submitting}
                            style={{
                              background: submitting ? '#94A3B8' : 'linear-gradient(90deg, #00123C 0%, #E65525 100%)',
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: '12px',
                              padding: '16px 40px',
                              fontSize: '16px',
                              fontWeight: '700',
                              cursor: submitting ? 'not-allowed' : 'pointer',
                              boxShadow: '0 10px 24px rgba(230, 85, 37, 0.28)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '10px'
                            }}
                          >
                            {submitting ? (
                              <><span>⏳</span> Submitting Profile & Dispatching Alerts...</>
                            ) : (
                              <><span>✉️</span> Submit Profile & Request Offer Letter →</>
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {isTestUser ? (
                    <>
                      <p style={{ fontSize: '15px', color: '#00123C', margin: 0 }}>
                        <span style={{ color: '#E65525', fontWeight: '700' }}>
                          🧪 Unlimited Test Mode Active: You can reattempt this assessment without restrictions.
                        </span>
                      </p>
                      <div>
                        <button
                          type="button"
                          onClick={handleReattempt}
                          style={{
                            background: 'linear-gradient(90deg, #00123C 0%, #E65525 100%)',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '12px',
                            padding: '16px 48px',
                            fontSize: '16px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            boxShadow: '0 10px 24px rgba(230, 85, 37, 0.2)'
                          }}
                        >
                          Reattempt Assessment (Unlimited Test Mode) ↺
                        </button>
                      </div>
                    </>
                  ) : (
                    <div style={{
                      background: '#FEF2F2',
                      border: '1px solid #FCA5A5',
                      borderRadius: '12px',
                      padding: '18px',
                      color: '#991B1B',
                      fontSize: '15px',
                      fontWeight: '700'
                    }}>
                      Maximum attempts (1/1) reached. Candidates are granted strictly 1 assessment attempt.
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <p style={{ color: '#5C6A86', fontSize: '15px', marginBottom: '20px' }}>
                No assessment result recorded yet. Please complete the assessment first.
              </p>
              <button
                type="button"
                onClick={() => navigate('/assessment')}
                style={{
                  background: 'linear-gradient(90deg, #00123C 0%, #E65525 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '12px 32px',
                  fontSize: '15px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Go to Assessment →
              </button>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}

export default ResultPage
