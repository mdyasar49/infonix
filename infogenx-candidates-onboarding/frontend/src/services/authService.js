// Infogenx Brand Identity Color Palette
export const INFOGENX_COLORS = {
  primaryNavy: '#00123C',
  royalBlue: '#000E68',
  brandOrange: '#E65525',
  darkOrange: '#D33E00',
  brandBlush: '#FFEEE9',
  white: '#FFFFFF',
  bgSurface: '#F8FBFF',
  bgMuted: '#EEF4FF',
  textPrimary: '#071028',
  textSecondary: '#5C6A86',
  border: 'rgba(0, 18, 60, 0.08)',
}

const defaultApi = window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://candidates.infogenx.com'
const MYSQL_AUTH_URL = `${defaultApi}/api/candidate-auth/login`
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzBZ_OQKodlVo9M1bcUlBQXnZS93NxZQvJdqUIJiFf0ex6TVl-XrN0UW2sMJv8LBuyhhA/exec"
const API_URL = import.meta.env.VITE_AUTH_API_URL || MYSQL_AUTH_URL

// Authentication service
class AuthService {
  async login(email, password) {
    try {
      const normalizedEmail = (email || '').trim().toLowerCase()

      // 1. First attempt: Authenticate via cPanel MySQL Database API
      try {
        const mysqlRes = await fetch(MYSQL_AUTH_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: normalizedEmail, password })
        })

        if (mysqlRes.ok) {
          const mysqlData = await mysqlRes.json()
          if (mysqlData.success && mysqlData.student) {
            const sessionData = {
              ...mysqlData.student,
              loggedIn: true,
              loginTime: new Date().toISOString(),
              onboardingProgress: {},
            }
            sessionStorage.setItem('infogenx_session', JSON.stringify(sessionData))
            return {
              success: true,
              student: sessionData,
            }
          }
        }
      } catch (mysqlErr) {
        console.warn('[AuthService] MySQL auth fallback:', mysqlErr.message)
      }

      // 2. Built-in Admin & Test User Credentials fallback
      if ((normalizedEmail === 'test@infogenx.com' && password === 'test123') ||
          (normalizedEmail === 'admin@infogenx.com' && password === 'India-1234')) {
        const adminSession = {
          name: 'Infogenx Administrator',
          email: normalizedEmail,
          role: 'admin',
          loggedIn: true,
          loginTime: new Date().toISOString(),
          onboardingProgress: {},
        }
        sessionStorage.setItem('infogenx_session', JSON.stringify(adminSession))
        return {
          success: true,
          student: adminSession,
        }
      }

      if (normalizedEmail === 'tester@infogenx.com' && password === 'testuser123') {
        const testSession = {
          name: 'QA Test User (Unlimited Attempts)',
          email: 'tester@infogenx.com',
          role: 'test_user',
          loggedIn: true,
          loginTime: new Date().toISOString(),
          onboardingProgress: {},
        }
        sessionStorage.setItem('infogenx_session', JSON.stringify(testSession))
        return {
          success: true,
          student: testSession,
        }
      }

      // 3. Fallback: Google Apps Script legacy authentication
      const isAppsScript = APPS_SCRIPT_URL.includes('script.google.com')
      const options = {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "login",
          email: normalizedEmail,
          password,
        }),
        redirect: "follow"
      }

      const response = await fetch(APPS_SCRIPT_URL, options)
      const result = await response.json()

      if (result && result.success) {
        const sessionData = {
          ...result.student,
          loggedIn: true,
          loginTime: new Date().toISOString(),
          onboardingProgress: {},
        }

        sessionStorage.setItem(
          'infogenx_session',
          JSON.stringify(sessionData)
        )

        return {
          success: true,
          student: sessionData,
        }
      }

      // Format clean error message without internal script traces
      let displayError = 'Invalid email ID or password.'
      if (result && result.message) {
        if (result.message.includes('not defined') || result.message.includes('Script error')) {
          displayError = 'Invalid email ID or generated password.'
        } else {
          displayError = result.message
        }
      }

      return {
        success: false,
        error: displayError,
      }
    } catch (error) {
      return {
        success: false,
        error: 'Unable to connect to server. Please try again.',
      }
    }
  }

  logout() {
    sessionStorage.removeItem('infogenx_session')
  }

  getSession() {
    const session = sessionStorage.getItem('infogenx_session')
    return session ? JSON.parse(session) : null
  }

  isAuthenticated() {
    return !!this.getSession()
  }

  updateProgress(stepId, status) {
    const session = this.getSession()

    if (session) {
      session.onboardingProgress[stepId] = status

      sessionStorage.setItem(
        'infogenx_session',
        JSON.stringify(session)
      )

      return session
    }

    return null
  }
}

export const authService = new AuthService()

// Onboarding workflow steps based on Infogenx Recruitment Framework
export const onboardingWorkflow = [
  {
    id: 1,
    title: 'Welcome & SOP Overview',
    description: 'Introduction to Infogenx culture & core values.',
    route: '/sop',
  },
  {
    id: 2,
    title: 'Recruitment Process',
    description: 'Multi-channel sourcing & candidate screening matrix.',
    route: '/recruitment-process',
  },
  {
    id: 3,
    title: 'Job Roles & Tech Stack',
    description: 'Explore technical domains & non-IT opportunities.',
    route: '/job-roles',
  },
  {
    id: 4,
    title: 'Technical Assessment',
    description: '50 MCQ evaluation based on SOP guide.',
    route: '/assessment',
  },
  {
    id: 5,
    title: 'Recruitment Task',
    description: 'Unlocked upon 80% (40/50) Assessment PASS.',
    route: '/task',
  },
  {
    id: 6,
    title: 'Offer & Selection',
    description: 'Compensation structure & stipend roadmap.',
    route: '/offer-letter',
  },
  {
    id: 7,
    title: 'Onboarding Completion',
    description: 'Verification, NDA, IT setup & mentor assignment.',
    route: '/onboarding',
  },
]

// Helper to get step status based on completed steps
export function getStepStatus(completedSteps, stepId) {
  if (completedSteps.includes(stepId)) {
    return 'complete'
  }
  if (stepId === completedSteps.length + 2) {
    return 'current'
  }
  return 'locked'
}

// Learning Materials
export const learningMaterials = [
  {
    id: 1,
    title: 'Infogenx Welcome Guide',
    type: 'PDF',
    description: 'An introduction to company culture, values, and onboarding expectations.',
    duration: '5 min read',
  },
  {
    id: 2,
    title: 'Welcome to Infogenx',
    type: 'Video',
    description: 'A premium overview of Infogenx, teams, and career pathways.',
    duration: '12 min watch',
  },
  {
    id: 3,
    title: 'Security & Compliance',
    type: 'Document',
    description: 'A short guide to data privacy, security protocols and workplace conduct.',
    duration: '8 min read',
  },
]

// Terms & Conditions
export const termsAgreement = {
  title: 'Infogenx Student Onboarding Terms & Conditions',
  sections: [
    {
      heading: 'Welcome to Infogenx',
      body: 'By continuing with this onboarding journey, you agree to follow the company code of conduct, complete assigned learning tasks and participate in scheduled assessments. The Infogenx onboarding portal provides access to training materials, evaluation checklists and corporate policies.',
    },
    {
      heading: 'Data Privacy & Compliance',
      body: 'All personal details and onboarding activity are handled according to Infogenx privacy guidelines. Students must maintain confidentiality, follow data handling best practices, and report any suspicious activity to the program administrator.',
    },
    {
      heading: 'Assessment & Eligibility',
      body: 'Completion of learning materials and assessments is required to move forward in the onboarding workflow. Assessment results are used to verify readiness for the next stage of the program and are not a formal employment evaluation.',
    },
    {
      heading: 'Offer Acceptance',
      body: 'After completing the assessment, you will review the offer letter, provide a digital signature, and confirm your acceptance. This portal is designed to capture your consent and prepare your onboarding path efficiently.',
    },
  ],
}

// Assessment Info
export const assessmentInfo = {
  title: 'Core Onboarding Assessment',
  description: 'A short knowledge check to confirm your readiness for Infogenx workflows and compliance guidelines.',
  duration: '15 Minutes',
  questions: 12,
  passScore: '70%',
  details: [
    'Multiple choice questions on company culture and policy.',
    'Scenario based queries for onboarding best practices.',
    'Instant summary of results after completion.',
  ],
}

// Result Summary
export const resultSummary = {
  score: 88,
  total: 100,
  grade: 'Excellent',
  eligibility: 'Cleared for onboarding continuation',
  nextAction: 'Review Offer Letter',
}

// Offer Letter
export const offerLetter = {
  candidate: 'Aarna Mehta',
  role: 'Onboarding Trainee',
  location: 'Bengaluru, India',
  salary: '₹6,50,000 / annum',
  startDate: '01 August 2026',
  referenceId: 'INF-OL-2026-0917',
  summary: 'We are pleased to extend this premium offer as part of your Infogenx onboarding journey. Review the details carefully and proceed with signature confirmation to secure your placement.',
  benefits: [
    'Comprehensive onboarding support',
    'Buddy mentorship program',
    'Access to premium learning resources',
  ],
}

// Training Plan
export const trainingPlan = {
  intro: 'Your first-day training plan is tailored for fast ramp-up and seamless orientation at Infogenx. Review the links and tasks below to stay on track.',
  resources: [
    {
      title: 'Team Introduction Guide',
      type: 'Guide',
      url: '#',
    },
    {
      title: 'HR Onboarding Checklist',
      type: 'Checklist',
      url: '#',
    },
    {
      title: 'Workplace Safety Brief',
      type: 'Video',
      url: '#',
    },
  ],
  tasks: [
    {
      title: 'Complete profile verification',
      status: 'Pending',
    },
    {
      title: 'Attend welcome session',
      status: 'Scheduled',
    },
    {
      title: 'Set up workspace access',
      status: 'Pending',
    },
  ],
}

// Completion Data
export const completionData = {
  title: 'Onboarding Completed',
  message: 'Congratulations! You have successfully completed your Infogenx onboarding path. Your profile is now fully activated and ready for the next phase.',
  summary: [
    'All required materials completed',
    'Assessment reviewed and cleared',
    'Offer letter confirmed',
    'Digital acceptance captured',
  ],
}

// Standalone login function (used by LoginPage)
export function login(email, password) {
  return authService.login(email, password)
}
