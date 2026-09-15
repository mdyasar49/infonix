# 🎓 Infogenx Candidate & Student Onboarding Portal (End-to-End Enterprise System)

A modern, full-featured **React 19 + Vite + Node.js + Google Apps Script** candidate onboarding, assessment, and offer issuance platform for **Infogenx**. The portal guides applicants seamlessly through registration, login, SOP orientation, timed MCQ assessments, recruitment tasks, candidate profile questionnaires, executive review, and automated offer letter delivery.

🌐 **Portal Production URL:** [https://candidates.infogenx.com](https://candidates.infogenx.com)  
⚡ **API Production URL:** [https://candidates.infogenx.com/api](https://candidates.infogenx.com/api)  
📦 **GitHub Repository:** [https://github.com/mdyasar49/infogenx-candidates-onboarding](https://github.com/mdyasar49/infogenx-candidates-onboarding)  

---

## 🚀 End-to-End Architecture Workflow

```
[ 1. Candidate Application ] ──► Google Forms (Infogenx Application Form)
              │
              ▼
[ 2. Auto Automation Engine ] ──► Google Apps Script (Trigger.gs, Email.gs, Database.gs)
              │                     - Records applicant in Google Sheets
              │                     - Syncs credentials to cPanel MySQL Database
              │                     - Sends branded HTML email with credentials + official logo
              ▼
[ 3. Candidate Portal Login ] ──► https://candidates.infogenx.com/login
              │                     - Dual resilient authentication (cPanel MySQL + Apps Script fallback)
              │                     - Strictly enforces single examination attempt restriction
              ▼
[ 4. Stage 1: SOP Orientation ] ──► Interactive PDF viewer (Recruitment SOP)
              │
              ▼
[ 5. Stage 2: Presentation ] ──► Company culture, stipends, track milestones PPT viewer
              │
              ▼
[ 6. Stage 3: Assessment ] ──► 50-Question Technical & Compliance MCQ Exam
              │                     - Real-time countdown timer, auto-lock on completion
              │                     - Strict single attempt enforcement
              ▼
[ 7. Stage 4: Practical Task ] ──► Recruitment Form Creation, Flyer Design & Social Media Posting
              │                     - Screenshot upload and verification
              ▼
[ 8. Stage 5: Profile Capture ] ──► Complete 14-point candidate questionnaire submitted
              │                     - Instant Twilio GSM-7 SMS alert to management
              │                     - Professional executive review email sent to admin@infogenx.in
              ▼
[ 9. Stage 6: Offer Approval ] ──► Admin review console (via secure token)
              │                     - Offer letter generated, candidate digital signature captured
              │                     - Automated PDF generation & delivery
```

---

## 📂 Repository Structure

```
infogenx-candidates-onboarding/
├── assets/                                 # Brand assets & logos
│   └── logo_white.png                      # High-res transparent white brand logo
│
├── frontend/                               # React 19 + Vite Client Application
│   ├── public/                             # Public static files, PDFs, favicons
│   │   └── materials/                      # Orientation SOP and PPT PDFs
│   ├── src/
│   │   ├── assets/                         # UI icons and logo
│   │   ├── components/                     # Header, ProgressSidebar, MaterialCard, Route Guards
│   │   ├── pages/
│   │   │   ├── Auth/LoginPage.jsx          # Candidate login page
│   │   │   ├── Learning/                   # SOPPage.jsx & PresentationPage.jsx
│   │   │   ├── Assessment/                 # AssessmentPage.jsx & ResultPage.jsx
│   │   │   ├── Task/TaskPage.jsx           # Practical recruitment assignment
│   │   │   └── Admin/                      # AdminReviewPage.jsx & User Management
│   │   ├── services/
│   │   │   └── authService.js              # Resilient dual-backend auth service
│   │   ├── index.css                       # Design tokens, typography & CSS variables
│   │   └── main.jsx                        # React entrypoint
│   ├── package.json
│   └── vite.config.js
│
├── backend/                                # Node.js / Express 5 API Service
│   ├── routes/
│   │   ├── candidate-auth.js               # cPanel MySQL login & attempt tracking
│   │   ├── offer-letter.js                 # Dynamic questionnaire, SMS, HR token review, Offer PDF
│   │   ├── login.js                        # Microservice auth route
│   │   ├── assessment.js                   # Question delivery & score evaluation
│   │   └── task.js                         # File upload & task verification
│   ├── services/
│   │   └── notificationService.js          # SMS & consistent email formatting with brand logo
│   ├── server.js                           # Express server entrypoint
│   ├── package.json
│   └── .env.example                        # Environment variables template
│
├── google-apps-script/                     # Enterprise Google Workspace Automation
│   ├── Email.gs                            # Branded candidate credentials email with company logo
│   ├── Trigger.gs                          # OnFormSubmit triggers & automated student ingestion
│   ├── Form.gs                             # Google Form inspection and answer parsing
│   ├── Database.gs                         # Google Sheets student row recording & MySQL sync
│   ├── Auth.gs                             # Password generation and verification
│   ├── Sms.gs                              # Twilio SMS alerts
│   ├── Setup.gs                            # Environment setup & trigger installer
│   ├── API.gs                              # Web App API endpoints (doGet / doPost)
│   ├── appsscript.json                     # Apps Script manifest
│   ├── push_local_to_target.py             # Script to push local .gs code to all 4 target Apps Script projects
│   ├── run_full_onboarding_pipeline.py     # End-to-end pipeline execution runner
│   ├── sync_apps_script_projects.py        # Project synchronization utility
│   ├── test_user_form_live.py              # Automated test form submission
│   └── update_appscript_and_deploy.py      # Apps Script deploy automation
│
├── deployment/                             # DevOps & Deployment Automations
│   ├── full_deploy_and_verify.py           # One-click deployment & public HTTPS verification runner
│   ├── deploy_updates.py                   # Automated SFTP upload to API & Frontend servers
│   ├── deploy_consistent_emails.py         # Hot-reloader for email templates & API restart
│   ├── check_remote_scores.py              # Candidate score verification tool
│   └── deploy_candidates.ps1               # PowerShell deployment script
│
├── README.md                               # Comprehensive project documentation
└── .gitignore                              # Git exclusion rules
```

---

## 🔑 Key Features & Innovations

### 1. Unified Brand Email Architecture
- All notification emails (Google Apps Script and Node.js backend) share a consistent **Infogenx Signature Palette**:
  - Gradient Header: `linear-gradient(135deg, #00123C 0%, #000E68 55%, #E65525 100%)`
  - Company Brand Logo (`https://candidates.infogenx.com/logo_white.png`)
  - Modern typography and clean white card containers with subtle drop shadows
  - Consistent layout across Application Received, Login Credentials, HR Review, Candidate Outcome, and Offer Letter Approval.

### 2. Dual-Engine Resilient Authentication
- **Primary:** High-speed query against the production cPanel MySQL `candidates` database via `https://api.infogenx.com/api/candidate-auth/login`.
- **Secondary:** Automated fallback to Google Apps Script / Google Sheets API if database latency occurs.
- **Security:** Passwords salted/hashed, attempts counted dynamically, and single test attempt strictly enforced.

### 3. Strict 1-Attempt Examination Enforcement
- Candidates are strictly allowed **1 attempt** for the 50-mark assessment.
- Attempt counts are validated server-side on both the MySQL API and the front-end router before any test questions are loaded.
- In case of network disconnection or emergency, authorized administrators can reset candidate attempts from the secure Admin console.

### 4. Real-time Multi-Channel Notifications
- **Twilio GSM-7 SMS Alerts:** Dispatched immediately upon questionnaire completion to forward numbers (`+61403339424`, `+919787806366`).
- **HR Executive Emails:** Sent directly to `admin@infogenx.in` with full candidate profile breakdown and one-click token approval link.

---

## 💻 Local Development Setup

### 1. Frontend Setup
```bash
cd frontend
npm install
npm run dev
# Running on http://localhost:5173
```

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your local MySQL and SMTP credentials
npm install
npm run dev
# Running on http://localhost:5000
```

### 3. Deploying Google Apps Script
```bash
cd google-apps-script
python push_local_to_target.py
# Automatically pushes all .gs files to the 4 linked Apps Script projects
```

---

## 🚀 Production Deployment

### Automated One-Click Full Deployment:
```bash
python deployment/full_deploy_and_verify.py
```
This script automatically executes:
1. Pushes updated Google Apps Script code to all 4 script projects.
2. SFTP uploads backend routes (`candidate-auth.js`, `offer-letter.js`) to `api.infogenx.com`.
3. Restarts the remote Node.js process and verifies status.
4. Validates static assets (`logo_white.png`, `logo.png`) on `candidates.infogenx.com`.
5. Tests all public HTTPS endpoints and reports latency.

---

## 📄 License & Ownership
Copyright © 2026 **Infogenx Private Limited**. All rights reserved.
