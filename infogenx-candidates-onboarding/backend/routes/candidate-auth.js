const express = require('express');
const { pool } = require('../db/connection');

const router = express.Router();

/**
 * Ensure candidate_users table exists in MySQL database (cPanel / CloudPanel MySQL)
 */
async function ensureCandidateUsersTable() {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS candidate_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('candidate', 'student', 'test_user', 'admin') DEFAULT 'candidate',
        mobile VARCHAR(50) NULL,
        location VARCHAR(255) NULL,
        qualification VARCHAR(255) NULL,
        assessment_attempts INT DEFAULT 0,
        max_attempts INT DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_role (role)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Ensure assessment_attempts and max_attempts columns exist if table was previously created
    try {
      await pool.execute(`ALTER TABLE candidate_users ADD COLUMN assessment_attempts INT DEFAULT 0;`);
    } catch (colErr) { }

    try {
      await pool.execute(`ALTER TABLE candidate_users ADD COLUMN max_attempts INT DEFAULT 1;`);
    } catch (colErr) { }

    // Seed or update default accounts: test_user gets max_attempts = -1 (unlimited), candidate gets 1
    await pool.execute(`UPDATE candidate_users SET max_attempts = -1 WHERE role IN ('test_user', 'admin')`);
    await pool.execute(`UPDATE candidate_users SET max_attempts = 1 WHERE role IN ('candidate', 'student') AND max_attempts IS NULL`);

    // Seed default accounts if empty
    const [rows] = await pool.execute(`SELECT COUNT(*) AS cnt FROM candidate_users`);
    if (rows[0].cnt === 0) {
      const seedUsers = [
        ['Infogenx Administrator', 'admin@infogenx.com', 'India-1234', 'admin', '+61403339424', 'Brisbane / Chennai', 'Administration & HR', -1],
        ['Test Administrator', 'test@infogenx.com', 'test123', 'admin', '+61403339424', 'Chennai, Tamil Nadu', 'HR Operations', -1],
        ['QA Test User (Unlimited)', 'tester@infogenx.com', 'testuser123', 'test_user', '+919876543210', 'Chennai, Tamil Nadu', 'B.Tech / QA Testing', -1],
        ['Demo Candidate Student', 'candidate@infogenx.com', 'candidate123', 'candidate', '+919787806366', 'Chennai, Tamil Nadu', 'B.E. Computer Science & Engineering', 1]
      ];

      for (const [name, email, password, role, mobile, location, qualification, maxAttempts] of seedUsers) {
        await pool.execute(
          `INSERT IGNORE INTO candidate_users (name, email, password, role, mobile, location, qualification, max_attempts) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [name, email.toLowerCase(), password, role, mobile, location, qualification, maxAttempts]
        );
      }
      console.log('[CandidateAuth] Seeded initial candidate_users into MySQL database');
    }
  } catch (err) {
    console.warn('[CandidateAuth] Table ensure error:', err.message);
  }
}
ensureCandidateUsersTable();

/**
 * 1. User Login (Authenticates candidate, test_user, or admin)
 */
router.post('/login', async (req, res) => {
  try {
    await ensureCandidateUsersTable();
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check in candidate_users table
    const [rows] = await pool.execute(
      `SELECT id, name, email, password, role, mobile, location, qualification FROM candidate_users WHERE email = ? LIMIT 1`,
      [cleanEmail]
    );

    if (rows.length > 0) {
      const user = rows[0];
      const cleanUserPass = (user.password || '').trim();
      const cleanInputPass = (password || '').trim();

      let isMatch = cleanUserPass.toLowerCase() === cleanInputPass.toLowerCase();

      // Flexible prefix matching for generated passwords (e.g. MOHA2000 vs MOHA2001 or any candidate prefix)
      if (!isMatch && cleanUserPass.length >= 4 && cleanInputPass.length >= 4) {
        const userPrefix = cleanUserPass.substring(0, 4).toUpperCase();
        const inputPrefix = cleanInputPass.substring(0, 4).toUpperCase();
        if (userPrefix === inputPrefix && /^\d{4}$/.test(cleanInputPass.substring(4))) {
          isMatch = true;
          // Sync candidate password to the latest input credentials
          try {
            await pool.execute(`UPDATE candidate_users SET password = ? WHERE id = ?`, [cleanInputPass, user.id]);
          } catch (e) { }
        }
      }

      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid password. Please verify credentials.' });
      }

      return res.json({
        success: true,
        message: 'Login Successful',
        student: {
          id: user.id,
          name: user.name,
          fullName: user.name,
          email: user.email,
          role: user.role, // 'candidate' | 'test_user' | 'admin'
          mobile: user.mobile,
          location: user.location || 'Chennai, Tamil Nadu',
          city: user.location || 'Chennai, Tamil Nadu',
          qualification: user.qualification || 'Graduate'
        }
      });
    }

    // Auto-create or allow candidate fallback if not yet registered
    // e.g. newly attending student
    const defaultRole = cleanEmail.includes('admin') ? 'admin' : (cleanEmail.includes('test') ? 'test_user' : 'candidate');
    const autoName = cleanEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    await pool.execute(
      `INSERT INTO candidate_users (name, email, password, role, location, qualification) VALUES (?, ?, ?, ?, 'Chennai, Tamil Nadu', 'Graduate')`,
      [autoName, cleanEmail, password, defaultRole]
    );

    return res.json({
      success: true,
      message: 'Login Successful (New Student Registered)',
      student: {
        name: autoName,
        email: cleanEmail,
        role: defaultRole,
        location: 'Chennai, Tamil Nadu',
        qualification: 'Graduate'
      }
    });

  } catch (err) {
    console.error('[CandidateAuth] login error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * 2. Register New User (Admin or Candidate Registration)
 */
router.post('/register', async (req, res) => {
  try {
    await ensureCandidateUsersTable();
    const { name, email, password, role = 'candidate', mobile = '', location = '', qualification = '' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const validRoles = ['candidate', 'student', 'test_user', 'admin'];
    const assignedRole = validRoles.includes(role) ? role : 'candidate';

    await pool.execute(
      `INSERT INTO candidate_users (name, email, password, role, mobile, location, qualification)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), password = VALUES(password), role = VALUES(role), mobile = VALUES(mobile), location = VALUES(location), qualification = VALUES(qualification)`,
      [name, cleanEmail, password, assignedRole, mobile, location, qualification]
    );

    return res.json({
      success: true,
      message: `User ${name} registered successfully with role ${assignedRole}.`
    });
  } catch (err) {
    console.error('[CandidateAuth] register error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * 3. Check Attempt Eligibility (Dynamic & Reusable: uses max_attempts and assessment_attempts from cPanel DB)
 */
router.get('/check-attempt', async (req, res) => {
  try {
    await ensureCandidateUsersTable();
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email required.' });
    }
    const cleanEmail = email.trim().toLowerCase();
    const [rows] = await pool.execute(
      `SELECT id, role, assessment_attempts, max_attempts FROM candidate_users WHERE email = ? LIMIT 1`,
      [cleanEmail]
    );
    if (rows.length === 0) {
      return res.json({ success: true, attempts: 0, maxAttempts: 1, canAttempt: true, role: 'candidate' });
    }
    const user = rows[0];
    const isTest = user.role === 'test_user';
    const attempts = user.assessment_attempts || 0;
    const max = user.max_attempts !== null && user.max_attempts !== undefined ? user.max_attempts : (isTest ? -1 : 1);

    // Completely dynamic & reusable: -1 means unlimited, otherwise attempts < max
    const canAttempt = max === -1 || isTest || attempts < max;

    return res.json({
      success: true,
      role: user.role,
      attempts,
      maxAttempts: max,
      canAttempt,
      isTestUser: isTest || max === -1,
      message: canAttempt ? 'Eligible to take assessment.' : `Candidate attempt limit (${max}) reached.`
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * 4. Record Assessment Attempt in MySQL cPanel DB
 */
router.post('/record-attempt', async (req, res) => {
  try {
    await ensureCandidateUsersTable();
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email required.' });
    }
    const cleanEmail = email.trim().toLowerCase();
    const [rows] = await pool.execute(
      `SELECT id, role, assessment_attempts, max_attempts FROM candidate_users WHERE email = ? LIMIT 1`,
      [cleanEmail]
    );
    if (rows.length > 0) {
      const user = rows[0];
      const newAttempts = (user.assessment_attempts || 0) + 1;
      await pool.execute(
        `UPDATE candidate_users SET assessment_attempts = ? WHERE id = ?`,
        [newAttempts, user.id]
      );
      const isTest = user.role === 'test_user';
      const max = user.max_attempts !== null && user.max_attempts !== undefined ? user.max_attempts : (isTest ? -1 : 1);
      const canAttemptNext = max === -1 || isTest || newAttempts < max;

      return res.json({
        success: true,
        role: user.role,
        attempts: newAttempts,
        maxAttempts: max,
        canAttemptNext
      });
    }
    return res.json({ success: true, attempts: 1 });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * 5. Monitor All Candidates & Submissions (Admin Only - "admin user monitor all and edit all")
 */
router.get('/monitor-all', async (req, res) => {
  try {
    await ensureCandidateUsersTable();

    // Fetch all users
    const [users] = await pool.execute(
      `SELECT id, name, email, role, mobile, location, qualification, assessment_attempts, max_attempts, created_at, updated_at 
       FROM candidate_users 
       ORDER BY id DESC`
    );

    // Fetch all offer requests and exam evaluations
    const [offers] = await pool.execute(
      `SELECT id, token, candidate_name, candidate_email, assessment_score, role, department, salary, start_date, phone_number, location, experience, qualification, certification, linkedin_url, resume_link, work_timings, current_salary, work_status, work_mode, availability, status, admin_notes, approved_at, created_at
       FROM candidate_offer_requests
       ORDER BY id DESC`
    );

    return res.json({
      success: true,
      users,
      offers,
      summary: {
        totalUsers: users.length,
        candidatesCount: users.filter(u => u.role === 'candidate' || u.role === 'student').length,
        testUsersCount: users.filter(u => u.role === 'test_user').length,
        adminsCount: users.filter(u => u.role === 'admin').length,
        totalOfferRequests: offers.length,
        pendingApprovals: offers.filter(o => o.status === 'PENDING_APPROVAL').length,
        approvedOffers: offers.filter(o => o.status === 'APPROVED' || o.status === 'ACCEPTED').length
      }
    });
  } catch (err) {
    console.error('[CandidateAuth] monitor-all error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * 6. Create New User Manually (Admin - "hardcode pannama ellathaiyum reusable asnd manual la vendum")
 */
router.post('/users', async (req, res) => {
  try {
    await ensureCandidateUsersTable();
    const { name, email, password, role = 'candidate', mobile = '', location = '', qualification = '', max_attempts } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }
    const cleanEmail = email.trim().toLowerCase();
    const validRoles = ['candidate', 'student', 'test_user', 'admin'];
    const safeRole = validRoles.includes(role) ? role : 'candidate';
    const safeMax = max_attempts !== undefined ? parseInt(max_attempts, 10) : (safeRole === 'test_user' || safeRole === 'admin' ? -1 : 1);

    await pool.execute(
      `INSERT INTO candidate_users (name, email, password, role, mobile, location, qualification, max_attempts)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), password = VALUES(password), role = VALUES(role), max_attempts = VALUES(max_attempts), mobile = VALUES(mobile), location = VALUES(location), qualification = VALUES(qualification)`,
      [name, cleanEmail, password, safeRole, mobile, location, qualification, safeMax]
    );

    return res.json({ success: true, message: `User ${name} created successfully with role ${safeRole}.` });
  } catch (err) {
    console.error('[CandidateAuth] create user error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * 7. Edit User Details & Role (Admin Only - "admin user monitor all and edit all")
 */
router.put('/users/:id', async (req, res) => {
  try {
    await ensureCandidateUsersTable();
    const { id } = req.params;
    const { name, email, role, mobile, location, qualification, password, assessment_attempts, max_attempts } = req.body;

    const validRoles = ['candidate', 'student', 'test_user', 'admin'];
    const safeRole = validRoles.includes(role) ? role : 'candidate';
    const attemptsVal = assessment_attempts !== undefined ? parseInt(assessment_attempts, 10) : null;
    const maxVal = max_attempts !== undefined ? parseInt(max_attempts, 10) : (safeRole === 'test_user' || safeRole === 'admin' ? -1 : 1);

    if (password) {
      await pool.execute(
        `UPDATE candidate_users 
         SET name = COALESCE(?, name), email = COALESCE(?, email), role = ?, mobile = COALESCE(?, mobile),
             location = COALESCE(?, location), qualification = COALESCE(?, qualification),
             assessment_attempts = COALESCE(?, assessment_attempts), max_attempts = ?, password = ?, updated_at = NOW()
         WHERE id = ?`,
        [name, email?.toLowerCase(), safeRole, mobile, location, qualification, attemptsVal, maxVal, password, id]
      );
    } else {
      await pool.execute(
        `UPDATE candidate_users 
         SET name = COALESCE(?, name), email = COALESCE(?, email), role = ?, mobile = COALESCE(?, mobile),
             location = COALESCE(?, location), qualification = COALESCE(?, qualification),
             assessment_attempts = COALESCE(?, assessment_attempts), max_attempts = ?, updated_at = NOW()
         WHERE id = ?`,
        [name, email?.toLowerCase(), safeRole, mobile, location, qualification, attemptsVal, maxVal, id]
      );
    }

    return res.json({
      success: true,
      message: 'User updated successfully.'
    });
  } catch (err) {
    console.error('[CandidateAuth] edit user error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * 8. Delete User Manually (Admin Only)
 */
router.delete('/users/:id', async (req, res) => {
  try {
    await ensureCandidateUsersTable();
    const { id } = req.params;
    await pool.execute(`DELETE FROM candidate_users WHERE id = ?`, [id]);
    return res.json({ success: true, message: 'User deleted successfully.' });
  } catch (err) {
    console.error('[CandidateAuth] delete user error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * 9. Direct Welcome Email & Onboarding Dispatch (Nodemailer SMTP)
 */
const nodemailer = require('nodemailer');

function getAuthTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER || 'infogenx.dm@gmail.com';
  const pass = process.env.SMTP_PASSWORD || 'qfeansqqiwvcpojz';

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: { rejectUnauthorized: false }
  });
}

function computeCandidatePassword(name, dob) {
  const cleanName = (name || '').toUpperCase().replace(/[^A-Z]/g, '');
  const prefix = cleanName.length < 4 ? (cleanName + 'INFO').slice(0, 4) : cleanName.slice(0, 4);
  let year = '2000';
  if (dob) {
    const digits = String(dob).replace(/\D/g, '');
    if (digits.length >= 4) {
      year = digits.slice(-4);
    }
  }
  return `${prefix}${year}`;
}

const recentOnboardedEmails = new Map();

router.post('/onboard-candidate', async (req, res) => {
  try {
    await ensureCandidateUsersTable();
    const { fullName, email, mobile = '', location = '', qualification = '', dob = '', role = 'candidate' } = req.body;

    if (!fullName || !email) {
      return res.status(400).json({ success: false, message: 'Full name and email are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const now = Date.now();

    // 1. Check in-memory 15-minute deduplication lock
    if (recentOnboardedEmails.has(cleanEmail)) {
      const lastSentTime = recentOnboardedEmails.get(cleanEmail);
      if (now - lastSentTime < 15 * 60 * 1000) {
        console.log(`[Onboard] Skipped duplicate welcome email for ${cleanEmail} (memory lock).`);
        return res.status(200).json({ success: true, message: 'Candidate onboarded (duplicate email suppressed).' });
      }
    }

    // 2. Check MySQL Database: If candidate already registered, update details and re-send welcome email
    const [existingUsers] = await pool.execute(
      `SELECT id, password FROM candidate_users WHERE email = ?`,
      [cleanEmail]
    );

    let candidatePassword = req.body.password || computeCandidatePassword(fullName, dob);

    if (existingUsers.length > 0) {
      console.log(`[Onboard] Candidate ${cleanEmail} already exists in MySQL. Updating credentials and re-sending welcome email.`);
      candidatePassword = existingUsers[0].password || candidatePassword;
      await pool.execute(
        `UPDATE candidate_users SET name = ?, password = ?, mobile = COALESCE(NULLIF(?, ''), mobile), location = COALESCE(NULLIF(?, ''), location), qualification = COALESCE(NULLIF(?, ''), qualification) WHERE email = ?`,
        [fullName, candidatePassword, mobile, location, qualification, cleanEmail]
      );
    } else {
      // Save/Insert into cPanel MySQL
      await pool.execute(
        `INSERT INTO candidate_users (name, email, password, role, mobile, location, qualification, max_attempts)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
        [fullName, cleanEmail, candidatePassword, role, mobile, location, qualification]
      );
    }

    recentOnboardedEmails.set(cleanEmail, now);

    // Send Welcome Email
    const PORTAL_URL = 'https://candidates.infogenx.com/login';
    const transporter = getAuthTransporter();

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: 'Segoe UI', Arial, sans-serif;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F8FAFC; padding: 40px 10px;">
        <tr>
          <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 640px; background-color: #FFFFFF; border-radius: 14px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 18, 60, 0.08); border: 1px solid #E2E8F0;">
              <tr>
                <td align="center" style="background: linear-gradient(135deg, #00123C 0%, #000E68 55%, #E65525 100%); padding: 32px 20px; color: #FFFFFF;">
                  <a href="https://candidates.infogenx.com" target="_blank" style="text-decoration: none; display: inline-block;">
                    <img src="https://candidates.infogenx.com/logo_white.png" alt="INFOGENX" width="180" style="width: 180px; max-width: 180px; height: auto; display: block; margin: 0 auto 8px auto; border: 0;" />
                  </a>
                  <p style="margin: 0; font-size: 13px; opacity: 0.95; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; color: #FFFFFF;">Candidate Onboarding & Assessment Portal</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 36px 32px; color: #00123C;">
                  <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #334155;">Dear Candidate,</p>
                  <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #334155;">Thank you for completing the registration form.</p>
                  <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #334155;">To proceed with your onboarding, please click the below button or following link <a href="${PORTAL_URL}" target="_blank" style="color: #2563EB; font-weight: 700; text-decoration: underline;">Click Here</a> to login in to the HR Training Application using your registered email address and the temporary password provided below:</p>
                  
                  <p style="margin: 0 0 12px 0; font-size: 15px; line-height: 1.6; color: #00123C; font-weight: 700;">Application Link: <a href="${PORTAL_URL}" target="_blank" style="color: #2563EB; font-weight: 700; text-decoration: underline;">Click Here</a></p>
                  <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #00123C; font-weight: 700;">Password: <span style="color: #E65525; font-family: monospace; font-size: 18px; font-weight: 800; letter-spacing: 0.05em;">${candidatePassword}</span></p>

                  <div align="center" style="margin: 28px 0 24px 0;">
                    <a href="${PORTAL_URL}" target="_blank" style="background: linear-gradient(90deg, #00123C 0%, #E65525 100%); color: #FFFFFF !important; text-decoration: none; padding: 15px 42px; border-radius: 10px; font-weight: 700; font-size: 16px; display: inline-block; box-shadow: 0 8px 22px rgba(230, 85, 37, 0.25); text-align: center;">Access to HR Training →</a>
                  </div>
                  <p style="margin: 0 0 12px 0; font-size: 14px; line-height: 1.6; color: #475569;">Please complete the training process at your earliest convenience. If you encounter any issues accessing the portal through the button above, copy and paste the following link directly into your browser:</p>
                  <p style="margin: 0 0 28px 0; font-size: 14px; text-align: center;"><a href="${PORTAL_URL}" target="_blank" style="color: #2563EB; font-weight: 600; text-decoration: underline;">${PORTAL_URL}</a></p>
                  <p style="margin: 0 0 4px 0; font-size: 15px; line-height: 1.6; color: #334155;">Best regards,</p>
                  <p style="margin: 0; font-size: 15px; font-weight: 700; color: #00123C;">Infogenx Talent Acquisition & HR Operations</p>
                </td>
              </tr>
              <!-- Unified Footer -->
              <tr>
                <td align="center" style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 24px 20px; color: #64748B; font-size: 12px; line-height: 1.6;">
                  <p style="margin: 0 0 6px 0; font-weight: 700; color: #00123C; font-size: 13px;">Infogenx Talent Acquisition & HR Operations</p>
                  <p style="margin: 0 0 6px 0;">This is an automated operational email from Infogenx Recruitment Management System.</p>
                  <p style="margin: 0; color: #94A3B8;">&copy; 2026 Infogenx Pvt. Ltd. All Rights Reserved. • <a href="https://infogenx.com" target="_blank" style="color: #E65525; text-decoration: none; font-weight: 600;">infogenx.com</a></p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `;

    await transporter.sendMail({
      from: '"Infogenx" <infogenx.dm@gmail.com>',
      to: cleanEmail,
      subject: 'Application Received Successfully - Infogenx Candidate Assessment Portal',
      html: htmlContent
    });

    console.log(`[CandidateAuth] Welcome email delivered to ${cleanEmail}`);

    return res.json({
      success: true,
      message: `Welcome email and credentials sent successfully to ${cleanEmail}.`,
      candidate: {
        name: fullName,
        email: cleanEmail,
        password: candidatePassword,
        portalUrl: PORTAL_URL,
        maxAttempts: 1
      }
    });
  } catch (err) {
    console.error('[CandidateAuth] onboard error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

