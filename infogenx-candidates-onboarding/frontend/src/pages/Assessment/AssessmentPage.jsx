import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { questionBank } from '../../../../backend/services/questions.js'
import './AssessmentPage.css'

function AssessmentPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [viewState, setViewState] = useState('INTRO') // 'INTRO' | 'EXAM'
  const [currentQIndex, setCurrentQIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [attemptCount, setAttemptCount] = useState(1)
  const [hasCompletedAttempt, setHasCompletedAttempt] = useState(false)
  const isTestUser = user?.role === 'test_user' || user?.role === 'test'

  const questions = questionBank

  useEffect(() => {
    if (user?.email) {
      const defaultApi = window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://candidates.infogenx.com'
      const apiUrl = import.meta.env.VITE_API_URL || defaultApi

      // Check live backend attempt count from cPanel DB
      fetch(`${apiUrl}/api/candidate-auth/check-attempt?email=${encodeURIComponent(user.email)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.success && !data.canAttempt) {
            setHasCompletedAttempt(true)
          }
        })
        .catch(() => {})

      const storedCount = sessionStorage.getItem(`infogenx_attempt_count_${user.email}`)
      const storedResult = sessionStorage.getItem(`infogenx_assessment_result_${user.email}`)
      if (storedCount) {
        setAttemptCount(parseInt(storedCount, 10))
      }
      if (storedResult && !isTestUser) {
        setHasCompletedAttempt(true)
      }
    }
  }, [user, isTestUser])

  const handleSelectOption = (qId, optionIndex) => {
    setUserAnswers((prev) => ({
      ...prev,
      [qId]: optionIndex,
    }))
  }

  const handleSubmitAssessment = async () => {
    const answeredCount = Object.keys(userAnswers).length
    if (answeredCount < questions.length) {
      const confirmSubmit = window.confirm(
        `You have answered ${answeredCount} of ${questions.length} questions. Do you still want to submit?`
      )
      if (!confirmSubmit) return
    }

    setSubmitting(true)

    // Calculate score
    let score = 0
    questions.forEach((q) => {
      if (userAnswers[q.id] === q.answer) {
        score += 1
      }
    })

    const total = questions.length
    const percentage = Math.round((score / total) * 100)
    const passed = score >= 40

    const currentAttempt = attemptCount
    const nextAttempt = currentAttempt

    const resultPayload = {
      score,
      totalQuestions: total,
      percentage,
      passed,
      status: passed ? 'PASS' : 'FAIL',
      attemptNumber: currentAttempt,
      timestamp: new Date().toISOString(),
      candidateDetails: {
        name: user?.name || 'Candidate',
        email: user?.email || 'N/A',
        mobile: user?.mobile || 'N/A',
        location: user?.location || 'N/A',
        qualification: user?.qualification || 'N/A',
        skills: user?.skills || 'N/A',
      }
    }

    // Save to sessionStorage
    if (user?.email) {
      sessionStorage.setItem(`infogenx_assessment_result_${user.email}`, JSON.stringify(resultPayload))
      sessionStorage.setItem(`infogenx_attempt_count_${user.email}`, currentAttempt.toString())
    }

    // Record attempt in backend cPanel MySQL DB
    try {
      const defaultApi = window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://candidates.infogenx.com'
      const apiUrl = import.meta.env.VITE_API_URL || defaultApi
      await fetch(`${apiUrl}/api/candidate-auth/record-attempt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user?.email })
      })
    } catch (e) {
      // ignore
    }

    // Try posting to assessment evaluation endpoint if reachable
    try {
      await fetch('/api/assessment/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user?.email,
          candidateDetails: resultPayload.candidateDetails,
          answers: userAnswers,
        }),
      })
    } catch (err) {
      // Seamless local fallback
    } finally {
      setSubmitting(false)
      navigate('/result')
    }
  }

  const currentQ = questions[currentQIndex]
  const answeredCount = Object.keys(userAnswers).length

  return (
    <div className="assessment-shell" style={{ background: '#FFFFFF', minHeight: 'calc(100vh - 100px)', padding: '0 20px 32px 20px' }}>
      <main className="assessment-main" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div className="assessment-card" style={{
          background: '#FFFFFF',
          borderRadius: '20px',
          padding: '36px 32px',
          border: '1.5px solid transparent',
          backgroundImage: 'linear-gradient(#ffffff, #ffffff), linear-gradient(135deg, #00123C 0%, #E65525 100%)',
          backgroundClip: 'padding-box, border-box',
          backgroundOrigin: 'padding-box, border-box',
          boxShadow: '0 20px 50px rgba(0, 18, 60, 0.06)'
        }}>

          {/* VIEW: INTRO */}
          {viewState === 'INTRO' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              <div style={{ textAlign: 'center' }}>
                <h1 style={{
                  fontSize: '32px',
                  fontWeight: '800',
                  margin: '0 0 10px',
                  background: 'linear-gradient(135deg, #00123C 0%, #E65525 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Assessment
                </h1>
                <p style={{ color: '#5C6A86', fontSize: '15px', margin: 0 }}>
                  Knowledge evaluation based exclusively on the Infogenx Recruitment SOP and orientation guide.
                </p>
              </div>

              <div style={{
                background: '#FFF8F3',
                border: '1px solid rgba(230, 85, 37, 0.15)',
                borderRadius: '16px',
                padding: '24px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '20px',
                textAlign: 'center'
              }}>
                <div style={{ padding: '12px' }}>
                  <span style={{ fontSize: '28px', fontWeight: '800', color: '#00123C', display: 'block' }}>50 Questions</span>
                  <span style={{ fontSize: '13px', color: '#5C6A86', fontWeight: '600' }}>Multiple Choice (1 Mark Each)</span>
                </div>
                <div style={{ padding: '12px', borderLeft: '1px solid rgba(0, 18, 60, 0.08)' }}>
                  <span style={{ fontSize: '28px', fontWeight: '800', color: '#E65525', display: 'block' }}>80% Passing Score</span>
                  <span style={{ fontSize: '13px', color: '#5C6A86', fontWeight: '600' }}>Minimum 40/50 Marks Required</span>
                </div>
                <div style={{ padding: '12px', borderLeft: '1px solid rgba(0, 18, 60, 0.08)' }}>
                  <span style={{ fontSize: '28px', fontWeight: '800', color: isTestUser ? '#E65525' : '#00123C', display: 'block' }}>Attempt #{attemptCount}</span>
                  <span style={{ fontSize: '13px', color: isTestUser ? '#E65525' : '#5C6A86', fontWeight: isTestUser ? '700' : '600' }}>
                    {isTestUser ? '🧪 Unlimited Attempts (Test Mode)' : 'Strictly 1 Attempt Allowed'}
                  </span>
                </div>
              </div>

              <div style={{ background: '#FFF7F5', borderRadius: '14px', padding: '20px', border: '1px solid rgba(230, 85, 37, 0.2)' }}>
                <h4 style={{ color: '#E65525', margin: '0 0 10px', fontSize: '15px', fontWeight: '700' }}>Assessment Instructions</h4>
                <ul style={{ paddingLeft: '20px', fontSize: '14px', color: '#00123C', display: 'flex', flexDirection: 'column', gap: '8px', margin: 0 }}>
                  <li>Candidates are granted <strong>strictly 1 test attempt</strong>. Please ensure undisturbed time and stable connectivity.</li>
                  <li>Achieve <strong>40/50 marks (80%)</strong> or higher to clear the assessment.</li>
                  <li>Upon passing, you will proceed to the Recruitment Task and Offer Letter release.</li>
                </ul>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
                {hasCompletedAttempt && !isTestUser ? (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      background: '#FEF2F2',
                      border: '1px solid #FCA5A5',
                      color: '#991B1B',
                      padding: '14px 28px',
                      borderRadius: '10px',
                      fontWeight: '700',
                      fontSize: '14px',
                      marginBottom: '16px'
                    }}>
                      ⚠️ You have already completed your 1 permitted assessment attempt.
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate('/result')}
                      style={{
                        background: 'linear-gradient(90deg, #00123C 0%, #E65525 100%)',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '14px 38px',
                        fontSize: '16px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        boxShadow: '0 8px 20px rgba(0, 18, 60, 0.15)'
                      }}
                    >
                      View Your Assessment Result →
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setViewState('EXAM')}
                    style={{
                      background: 'linear-gradient(90deg, #00123C 0%, #E65525 100%)',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '16px 48px',
                      fontSize: '17px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      boxShadow: '0 10px 24px rgba(0, 18, 60, 0.18)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Start Assessment →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* VIEW: EXAM */}
          {viewState === 'EXAM' && currentQ && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#00123C', margin: '0 0 4px' }}>
                    Question {currentQIndex + 1} <span style={{ color: '#E65525' }}>of {questions.length}</span>
                  </h2>
                  <p style={{ margin: 0, fontSize: '13px', color: '#5C6A86' }}>
                    Attempt #{attemptCount} {isTestUser ? '(Unlimited 🧪)' : ''} | Answered: {answeredCount} / {questions.length}
                  </p>
                </div>
                <div style={{
                  background: '#FFF8F3',
                  border: '1px solid rgba(230, 85, 37, 0.2)',
                  color: '#E65525',
                  padding: '6px 16px',
                  borderRadius: '20px',
                  fontWeight: '700',
                  fontSize: '13px'
                }}>
                  Passing Score: 80% (40/50)
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ width: '100%', height: '8px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${((currentQIndex + 1) / questions.length) * 100}%`,
                  background: 'linear-gradient(90deg, #00123C 0%, #E65525 100%)',
                  transition: 'width 0.2s ease'
                }} />
              </div>

              {/* Question Box */}
              <div style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '16px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
              }}>
                <div style={{ fontSize: '17px', fontWeight: '700', color: '#00123C', lineHeight: '1.5' }}>
                  {currentQIndex + 1}. {currentQ.question}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {currentQ.options.map((optText, optIdx) => {
                    const isSelected = userAnswers[currentQ.id] === optIdx
                    const optionLetter = String.fromCharCode(65 + optIdx)
                    return (
                      <div
                        key={optIdx}
                        onClick={() => handleSelectOption(currentQ.id, optIdx)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '14px',
                          padding: '14px 18px',
                          borderRadius: '12px',
                          border: isSelected ? '2px solid #E65525' : '1px solid #CBD5E1',
                          background: isSelected ? '#FFF8F3' : '#FFFFFF',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: isSelected ? '#E65525' : '#F1F5F9',
                          color: isSelected ? '#FFFFFF' : '#00123C',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '700',
                          fontSize: '13px'
                        }}>
                          {optionLetter}
                        </span>
                        <span style={{ fontSize: '15px', color: '#00123C', fontWeight: isSelected ? '700' : '500' }}>
                          {optText}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Question Navigation Palette */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                maxHeight: '120px',
                overflowY: 'auto',
                padding: '12px',
                background: '#F8FAFC',
                borderRadius: '12px',
                border: '1px solid #E2E8F0'
              }}>
                {questions.map((q, idx) => {
                  const isAnswered = userAnswers[q.id] !== undefined
                  const isCurrent = idx === currentQIndex
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setCurrentQIndex(idx)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        border: isCurrent ? '2px solid #E65525' : '1px solid #CBD5E1',
                        background: isAnswered ? '#00123C' : '#FFFFFF',
                        color: isAnswered ? '#FFFFFF' : '#00123C',
                        fontWeight: '700',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      {idx + 1}
                    </button>
                  )
                })}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setCurrentQIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentQIndex === 0}
                  style={{
                    background: '#FFFFFF',
                    color: '#00123C',
                    border: '1px solid #CBD5E1',
                    borderRadius: '10px',
                    padding: '12px 28px',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: currentQIndex === 0 ? 'not-allowed' : 'pointer',
                    opacity: currentQIndex === 0 ? 0.5 : 1
                  }}
                >
                  ← Previous
                </button>

                {currentQIndex < questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentQIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                    style={{
                      background: 'linear-gradient(90deg, #00123C 0%, #E65525 100%)',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '12px 32px',
                      fontSize: '14px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      boxShadow: '0 6px 16px rgba(0, 18, 60, 0.15)'
                    }}
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmitAssessment}
                    disabled={submitting}
                    style={{
                      background: 'linear-gradient(90deg, #00123C 0%, #E65525 100%)',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '12px 36px',
                      fontSize: '15px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      boxShadow: '0 8px 20px rgba(230, 85, 37, 0.2)'
                    }}
                  >
                    {submitting ? 'Evaluating...' : 'Submit Assessment ✓'}
                  </button>
                )}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}

export default AssessmentPage

