const express = require('express');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { pool } = require('../db/connection');

const router = express.Router();

function getTransporter() {
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

function getFormattedDate(d = new Date()) {
  const day = d.getDate();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const suffix = (day === 1 || day === 21 || day === 31) ? 'st' :
                 (day === 2 || day === 22) ? 'nd' :
                 (day === 3 || day === 23) ? 'rd' : 'th';
  return `${day}${suffix} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
}

async function ensureOfferTable() {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS candidate_offer_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        token VARCHAR(64) NOT NULL UNIQUE,
        candidate_name VARCHAR(255) NOT NULL,
        candidate_email VARCHAR(255) NOT NULL,
        assessment_score VARCHAR(50) DEFAULT 'Passed',
        role VARCHAR(255) DEFAULT 'Business Development Executive',
        department VARCHAR(255) DEFAULT 'Business Development & Client Relations',
        salary VARCHAR(100) DEFAULT '₹30,000 per month',
        start_date VARCHAR(100) NULL,
        phone_number VARCHAR(100) NULL,
        location VARCHAR(255) NULL,
        experience VARCHAR(255) NULL,
        qualification VARCHAR(255) NULL,
        certification VARCHAR(255) NULL,
        linkedin_url VARCHAR(500) NULL,
        resume_link VARCHAR(500) NULL,
        work_timings VARCHAR(255) NULL,
        current_salary VARCHAR(255) NULL,
        work_status VARCHAR(255) NULL,
        work_mode VARCHAR(255) NULL,
        availability VARCHAR(255) NULL,
        sms_status VARCHAR(50) DEFAULT 'PENDING',
        candidate_notified_at DATETIME NULL,
        owner_notified_at DATETIME NULL,
        status ENUM('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'ACCEPTED') DEFAULT 'PENDING_APPROVAL',
        admin_email VARCHAR(255) DEFAULT 'admin@infogenx.com',
        admin_notes TEXT NULL,
        approved_by VARCHAR(255) NULL,
        approved_at DATETIME NULL,
        signature_data LONGTEXT NULL,
        accepted_at DATETIME NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_candidate_email (candidate_email),
        INDEX idx_token (token),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    const additionalCols = [
      'phone_number VARCHAR(100) NULL',
      'location VARCHAR(255) NULL',
      'experience VARCHAR(255) NULL',
      'qualification VARCHAR(255) NULL',
      'certification VARCHAR(255) NULL',
      'linkedin_url VARCHAR(500) NULL',
      'resume_link VARCHAR(500) NULL',
      'work_timings VARCHAR(255) NULL',
      'current_salary VARCHAR(255) NULL',
      'work_status VARCHAR(255) NULL',
      'work_mode VARCHAR(255) NULL',
      'availability VARCHAR(255) NULL',
      "sms_status VARCHAR(50) DEFAULT 'PENDING'",
      'candidate_notified_at DATETIME NULL',
      'owner_notified_at DATETIME NULL'
    ];

    for (const colDef of additionalCols) {
      const colName = colDef.split(' ')[0];
      try {
        const [existing] = await pool.execute(
          `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'candidate_offer_requests' AND COLUMN_NAME = ?`,
          [colName]
        );
        if (existing.length === 0) {
          await pool.execute(`ALTER TABLE candidate_offer_requests ADD COLUMN ${colDef};`);
        }
      } catch (colErr) {
        // Continue if already exists
      }
    }
  } catch (err) {
    console.warn('[OfferLetter] Table ensure error:', err.message);
  }
}
ensureOfferTable();

/**
 * Dispatch Plain Text SMS via Twilio to configured forward numbers (Owner)
 */
async function sendCandidateCompletionSMS(candidate) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
  if (!accountSid || !authToken) {
    console.warn('[OfferLetter] Twilio credentials not configured in process.env, skipping direct SMS dispatch.');
    return;
  }
  const rawNumbers = process.env.FORWARD_SMS_NUMBERS || '+61403339424';
  // Exclude India (+91) numbers per user instruction ("india number ku sms vendaam")
  const recipients = rawNumbers
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .filter(s => !s.startsWith('+91') && !s.startsWith('91'));

  const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  const smsBody = 
`INFOGENX CANDIDATE ALERT
----------------------------------
Exam & Assessment Completed!

Name : ${candidate.name || 'N/A'}
Contact Number and WhatsappNo.: ${candidate.phone || 'N/A'}
Location: ${candidate.location || 'N/A'}
Any Experience: ${candidate.experience || 'Fresher'}
Qualification: ${candidate.qualification || 'N/A'}
Certification: ${candidate.certification || 'None'}
LinkedIn profile URL : ${candidate.linkedin || 'N/A'}
Resume Google Drive Link: ${candidate.resumeLink || 'N/A'}
Work Duration  & timings you can work : ${candidate.workTimings || 'Full Time / Flexible'}
Start Date: ${candidate.startDate || 'Immediate'}
Your Current Monthly Take Home Salary or Hourly rate  if u r working: ${candidate.currentSalary || 'N/A'}
Your Current Work Status: ${candidate.workStatus || 'Not working'}
If Working then: ${candidate.workMode || 'WFH all days with Fixed Day/hrs'}
Preferred Availability (Weekday and Weekend Time Slots): ${candidate.availability || 'Flexible'}
Score: ${candidate.score || 'Passed'} - PASSED
----------------------------------
Portal: https://candidates.infogenx.com`;

  const sendResults = [];
  for (const toNumber of recipients) {
    try {
      const bodyParams = new URLSearchParams({
        MessagingServiceSid: messagingServiceSid,
        To: toNumber,
        Body: smsBody
      });
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: bodyParams.toString()
      });
      const data = await res.json();
      sendResults.push({ to: toNumber, status: res.status, sid: data.sid, error: data.error_message });
      console.log(`[Twilio SMS] Alert to ${toNumber} status: ${res.status}, sid: ${data.sid}`);
    } catch (err) {
      console.error(`[Twilio SMS] Error sending to ${toNumber}:`, err.message);
      sendResults.push({ to: toNumber, error: err.message });
    }
  }
  return sendResults;
}

// 1. Submit Candidate Request for Admin Approval, Dispatch Twilio SMS & Send Separate Emails
router.post('/request-approval', async (req, res) => {
  try {
    await ensureOfferTable();
    const {
      candidateName,
      candidateEmail,
      phone = '',
      location = '',
      experience = '',
      qualification = '',
      certification = '',
      linkedin = '',
      resumeLink = '',
      workTimings = '',
      startDate = '',
      currentSalary = '',
      workStatus = '',
      workMode = '',
      availability = '',
      score = 'Passed',
      requestedRole = 'Business Development Executive',
      department = 'Business Development & Client Relations',
      adminEmail = process.env.ADMIN_OFFER_EMAIL || 'admin@infogenx.com'
    } = req.body;

    if (!candidateEmail || !candidateName) {
      return res.status(400).json({ success: false, message: 'Candidate name and email are required.' });
    }

    const cleanEmail = candidateEmail.toLowerCase().trim();

    // Check existing request
    const [existing] = await pool.execute(
      `SELECT * FROM candidate_offer_requests WHERE candidate_email = ? ORDER BY id DESC LIMIT 1`,
      [cleanEmail]
    );

    let token;
    let currentStatus = 'PENDING_APPROVAL';

    if (existing.length > 0) {
      token = existing[0].token;
      currentStatus = existing[0].status;

      // Update existing record with submitted questionnaire details
      await pool.execute(
        `UPDATE candidate_offer_requests 
         SET candidate_name = ?, assessment_score = ?, role = ?, department = ?,
             phone_number = ?, location = ?, experience = ?, qualification = ?,
             certification = ?, linkedin_url = ?, resume_link = ?, work_timings = ?,
             start_date = COALESCE(NULLIF(?, ''), start_date), current_salary = ?,
             work_status = ?, work_mode = ?, availability = ?, updated_at = NOW()
         WHERE id = ?`,
        [
          candidateName, score, requestedRole, department,
          phone, location, experience, qualification,
          certification, linkedin, resumeLink, workTimings,
          startDate, currentSalary,
          workStatus, workMode, availability,
          existing[0].id
        ]
      );

      if (currentStatus === 'APPROVED' || currentStatus === 'ACCEPTED') {
        return res.json({
          success: true,
          status: currentStatus,
          token,
          offer: existing[0],
          message: 'Offer letter has already been approved by Admin.'
        });
      }
    } else {
      token = crypto.randomBytes(24).toString('hex');
      const defaultStartDate = startDate || getFormattedDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
      await pool.execute(
        `INSERT INTO candidate_offer_requests 
         (token, candidate_name, candidate_email, assessment_score, role, department, start_date, 
          phone_number, location, experience, qualification, certification, linkedin_url, resume_link, 
          work_timings, current_salary, work_status, work_mode, availability, status, admin_email)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING_APPROVAL', ?)`,
        [
          token, candidateName, cleanEmail, score, requestedRole, department, defaultStartDate,
          phone, location, experience, qualification, certification, linkedin, resumeLink,
          workTimings, currentSalary, workStatus, workMode, availability, adminEmail
        ]
      );
    }

    // Prepare Candidate Object for Dispatch
    const candidatePayload = {
      name: candidateName,
      email: cleanEmail,
      phone,
      location,
      experience,
      qualification,
      certification,
      linkedin,
      resumeLink,
      workTimings,
      startDate,
      currentSalary,
      workStatus,
      workMode,
      availability,
      score,
      role: requestedRole,
      department
    };

    // 1. Dispatch SMS via Twilio to Owner Forward Numbers (NOT to candidate)
    let smsResults = [];
    try {
      smsResults = await sendCandidateCompletionSMS(candidatePayload);
      await pool.execute(
        `UPDATE candidate_offer_requests SET sms_status = 'SENT' WHERE token = ?`,
        [token]
      );
    } catch (smsErr) {
      console.warn('[OfferLetter] Twilio SMS dispatch warning:', smsErr.message);
    }

    // Transporter instance
    const transporter = getTransporter();
    const reviewUrl = `https://candidates.infogenx.com/admin/offer-review?token=${token}`;
    const portalUrl = `https://candidates.infogenx.com/offer-letter`;

    let isPassed = false;
    if (typeof req.body.passed === 'boolean') {
      isPassed = req.body.passed;
    } else if (typeof score === 'number') {
      isPassed = score >= 40;
    } else if (typeof score === 'string') {
      const s = score.toLowerCase().trim();
      if (s.includes('fail') || s.includes('not pass') || s.includes('not select')) {
        isPassed = false;
      } else if (s.includes('pass') || s.includes('select')) {
        isPassed = true;
      }
    }

    // 2. Send Executive Detail Email to HR Team (admin@infogenx.in)
    const ownerHtml = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: 'Segoe UI', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F8FAFC; padding: 36px 12px;">
        <tr>
          <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 680px; background-color: #FFFFFF; border-radius: 14px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 18, 60, 0.08); border: 1px solid #E2E8F0;">
              <!-- Header Branding -->
              <tr>
                <td align="center" style="background: linear-gradient(135deg, #00123C 0%, #000E68 55%, #E65525 100%); padding: 34px 20px; color: #FFFFFF;">
                  <a href="https://candidates.infogenx.com" target="_blank" style="text-decoration: none; display: inline-block;">
                    <img src="https://candidates.infogenx.com/logo_white.png" alt="INFOGENX" width="180" style="width: 180px; max-width: 180px; height: auto; display: block; margin: 0 auto 8px auto; border: 0;" />
                  </a>
                  <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.95; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; color: #FFFFFF;">HR Training & Candidate Review</p>
                </td>
              </tr>
              <!-- Content Body -->
              <tr>
                <td style="padding: 36px 32px; color: #00123C;">
                  <h2 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 800; color: #00123C;">Candidate Completed HR Training & Practical Task</h2>
                  <p style="font-size: 15px; margin: 0 0 12px; font-weight: 700; color: #00123C;">Dear HR Team,</p>
                  <p style="font-size: 14px; line-height: 1.6; color: #334155; margin: 0 0 20px;">
                    This candidate has successfully completed all stages of the HR Training Process & and Practical Task. Below are the Candidate details for your review:
                  </p>

                  <div style="background-color: #F0FDF4; border: 1.5px solid #BBF7D0; border-left: 5px solid #16A34A; border-radius: 10px; padding: 14px 18px; margin-bottom: 22px;">
                    <span style="font-weight: 700; color: #166534; font-size: 14px;">✓ Assessment Status: Selected (Passed)</span>
                  </div>

                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; margin-bottom: 24px; font-size: 13.5px;">
                    <tbody>
                      <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px 10px; font-weight: 600; color: #5C6A86; width: 36%;">Name :</td><td style="padding: 10px 10px; font-weight: 700; color: #00123C;">${candidateName}</td></tr>
                      <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px 10px; font-weight: 600; color: #5C6A86;">Contact Number and WhatsappNo.:</td><td style="padding: 10px 10px; font-weight: 600; color: #0f172a;">${phone || 'N/A'}</td></tr>
                      <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px 10px; font-weight: 600; color: #5C6A86;">Email Address:</td><td style="padding: 10px 10px; font-weight: 600; color: #0f172a;"><a href="mailto:${cleanEmail}" style="color: #000E68;">${cleanEmail}</a></td></tr>
                      <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px 10px; font-weight: 600; color: #5C6A86;">Location:</td><td style="padding: 10px 10px; color: #0f172a;">${location || 'N/A'}</td></tr>
                      <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px 10px; font-weight: 600; color: #5C6A86;">Any Experience:</td><td style="padding: 10px 10px; color: #0f172a;">${experience || 'Fresher'}</td></tr>
                      <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px 10px; font-weight: 600; color: #5C6A86;">Qualification:</td><td style="padding: 10px 10px; color: #0f172a;">${qualification || 'N/A'}</td></tr>
                      <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px 10px; font-weight: 600; color: #5C6A86;">Certification:</td><td style="padding: 10px 10px; color: #0f172a;">${certification || 'None'}</td></tr>
                      <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px 10px; font-weight: 600; color: #5C6A86;">LinkedIn profile URL :</td><td style="padding: 10px 10px; word-break: break-all;">${linkedin ? `<a href="${linkedin}" target="_blank" style="color: #E65525; font-weight: 600;">${linkedin}</a>` : 'N/A'}</td></tr>
                      <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px 10px; font-weight: 600; color: #5C6A86;">Resume Google Drive Link:</td><td style="padding: 10px 10px; word-break: break-all;">${resumeLink ? `<a href="${resumeLink}" target="_blank" style="color: #000E68; font-weight: 600;">View Resume</a>` : 'N/A'}</td></tr>
                      <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px 10px; font-weight: 600; color: #5C6A86;">Work Duration & timings you can work :</td><td style="padding: 10px 10px; color: #0f172a;">${workTimings || 'Full Time / Flexible'}</td></tr>
                      <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px 10px; font-weight: 600; color: #5C6A86;">Start Date:</td><td style="padding: 10px 10px; color: #0f172a;">${startDate || 'Immediate'}</td></tr>
                      <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px 10px; font-weight: 600; color: #5C6A86;">Your Current Monthly Take Home Salary or Hourly rate if u r working:</td><td style="padding: 10px 10px; color: #0f172a;">${currentSalary || 'N/A'}</td></tr>
                      <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px 10px; font-weight: 600; color: #5C6A86;">Your Current Work Status:</td><td style="padding: 10px 10px; color: #0f172a;">${workStatus || 'Not working'}</td></tr>
                      <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px 10px; font-weight: 600; color: #5C6A86;">If Working then:</td><td style="padding: 10px 10px; color: #0f172a;">${workMode || 'WFH all days with Fixed Day/hrs'}</td></tr>
                      <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px 10px; font-weight: 600; color: #5C6A86;">Preferred Availability (Weekday and Weekend Time Slots):</td><td style="padding: 10px 10px; color: #0f172a;">${availability || 'Flexible'}</td></tr>
                    </tbody>
                  </table>

                  <div align="center" style="margin: 32px 0 24px 0;">
                    <a href="${reviewUrl}" target="_blank" style="background: linear-gradient(90deg, #00123C 0%, #E65525 100%); color: #FFFFFF !important; text-decoration: none; padding: 15px 36px; border-radius: 10px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 8px 22px rgba(0, 18, 60, 0.16); text-align: center;">
                      👉 Review & Approve Offer Letter →
                    </a>
                  </div>

                  <p style="font-size: 12px; color: #64748b; text-align: center; word-break: break-all; margin: 0;">
                    Direct Review Link: <a href="${reviewUrl}" style="color: #E65525; text-decoration: underline;">${reviewUrl}</a>
                  </p>
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

    // 3. Candidate Result Email - NO SCORE SHOWN, only Selected / Not Selected
    const candidateHtml = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: 'Segoe UI', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F8FAFC; padding: 36px 12px;">
        <tr>
          <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 640px; background-color: #FFFFFF; border-radius: 14px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 18, 60, 0.08); border: 1px solid #E2E8F0;">
              <!-- Header Branding -->
              <tr>
                <td align="center" style="background: linear-gradient(135deg, #00123C 0%, #000E68 55%, #E65525 100%); padding: 34px 20px; color: #FFFFFF;">
                  <a href="https://candidates.infogenx.com" target="_blank" style="text-decoration: none; display: inline-block;">
                    <img src="https://candidates.infogenx.com/logo_white.png" alt="INFOGENX" width="180" style="width: 180px; max-width: 180px; height: auto; display: block; margin: 0 auto 8px auto; border: 0;" />
                  </a>
                  <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.95; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; color: #FFFFFF;">HR Training Process & Assessment Outcome</p>
                </td>
              </tr>
              <!-- Content Body -->
              <tr>
                <td style="padding: 36px 32px; color: #00123C;">
                  <p style="margin: 0 0 18px 0; font-size: 15px; line-height: 1.6; color: #334155;">Dear Candidate,</p>
                  <p style="margin: 0 0 22px 0; font-size: 14.5px; line-height: 1.7; color: #334155;">
                    Thank you for completing the Infogenx HR Training Assessment. We are pleased to notify you of your assessment evaluation result below:
                  </p>

                  <div style="background: ${isPassed ? '#F0FDF4' : '#FFF7F5'}; border: 1.5px solid ${isPassed ? '#BBF7D0' : 'rgba(230, 85, 37, 0.3)'}; border-left: 5px solid ${isPassed ? '#16A34A' : '#E65525'}; border-radius: 12px; padding: 22px; text-align: center; margin-bottom: 24px;">
                    <div style="font-size: 13px; font-weight: 700; color: ${isPassed ? '#15803D' : '#E65525'}; text-transform: uppercase; letter-spacing: 0.5px;">Assessment Outcome</div>
                    <div style="font-size: 28px; font-weight: 800; color: ${isPassed ? '#15803D' : '#E65525'}; margin: 6px 0;">
                      ${isPassed ? 'Selected ✓' : 'Not Selected ✕'}
                    </div>
                    <div style="font-size: 14px; color: ${isPassed ? '#166534' : '#991B1B'}; font-weight: 500;">
                      ${isPassed ? 'You have been selected to continue with your HR Training Process & Practical Tasks.' : 'Thank you for your interest and time in participating.'}
                    </div>
                  </div>

                  ${isPassed ? `
                  <h3 style="color: #00123C; font-size: 16px; font-weight: 800; margin: 24px 0 12px;">What Happens Next?</h3>
                  <ol style="font-size: 14px; line-height: 1.8; color: #475569; padding-left: 20px; margin: 0 0 24px;">
                    <li><strong>Executive Review:</strong> Our HR and Management team has received your profile details for final verification.</li>
                    <li><strong>Offer Letter Preparation:</strong> Your customized role scope and compensation package are being processed.</li>
                    <li><strong>E-Signature & Acceptance:</strong> You will be notified as soon as your official Offer Letter is approved. You can then review and digitally e-sign your formal document directly on your candidate portal.</li>
                  </ol>

                  <div align="center" style="margin: 30px 0 24px 0;">
                    <a href="${portalUrl}" target="_blank" style="background: linear-gradient(90deg, #00123C 0%, #E65525 100%); color: #FFFFFF !important; text-decoration: none; padding: 15px 36px; border-radius: 10px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 8px 22px rgba(0, 18, 60, 0.16); text-align: center;">
                      View Onboarding Portal & Offer Status →
                    </a>
                  </div>
                  ` : ''}

                  <p style="font-size: 13.5px; line-height: 1.6; color: #64748b; margin-top: 20px;">
                    If you have any questions or need further information, our HR team is here to help. Feel free to contact us at <a href="mailto:admin@infogenx.in" style="color: #000E68; font-weight: 600;">admin@infogenx.in</a>.
                  </p>
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

    // 4. Send email to HR Team (admin@infogenx.in) ONLY if candidate passed the test
    if (isPassed) {
      try {
        await transporter.sendMail({
          from: `"Infogenx HR Management" <${process.env.SMTP_USER || 'infogenx.dm@gmail.com'}>`,
          to: 'admin@infogenx.in',
          cc: 'nithyanand.a@infogenx.com.au, reachus@infogenx.com, infogenx.dm@gmail.com',
          subject: `⚡ [HR TRAINING & TASK COMPLETED] ${candidateName} - Candidate Details for Review`,
          html: ownerHtml
        });
        console.log(`[OfferLetter] HR notification email sent to admin@infogenx.in for passed candidate ${candidateName}`);
        await pool.execute(
          `UPDATE candidate_offer_requests SET owner_notified_at = NOW() WHERE token = ?`,
          [token]
        );
      } catch (mailErr) {
        console.warn(`[OfferLetter] Error sending HR email to admin@infogenx.in:`, mailErr.message);
      }
    } else {
      console.log(`[OfferLetter] Candidate ${cleanEmail} did not pass the test. HR notification to admin@infogenx.in skipped.`);
    }

    // 5. Send confirmation email to Candidate (NO SCORES, only Selected / Not Selected)
    try {
      await transporter.sendMail({
        from: `"Infogenx Talent Acquisition" <${process.env.SMTP_USER || 'infogenx.dm@gmail.com'}>`,
        to: cleanEmail,
        subject: isPassed
          ? `🎉 Congratulations on your Selection - Infogenx HR Training!`
          : `Infogenx Assessment Result Notification`,
        html: candidateHtml
      });
      console.log(`[OfferLetter] Candidate status notification email sent to ${cleanEmail}`);
      await pool.execute(
        `UPDATE candidate_offer_requests SET candidate_notified_at = NOW() WHERE token = ?`,
        [token]
      );
    } catch (candMailErr) {
      console.warn(`[OfferLetter] Error sending candidate email:`, candMailErr.message);
    }

    return res.json({
      success: true,
      status: currentStatus,
      token,
      smsDispatched: smsResults.length > 0,
      message: 'Candidate profile and assessment submitted successfully. SMS alert and emails dispatched.'
    });
  } catch (err) {
    console.error('[OfferLetter] request-approval error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Check Candidate Offer Status (Used by Candidate Portal /offer-letter)
router.get('/status', async (req, res) => {
  try {
    await ensureOfferTable();
    const { email, token } = req.query;
    if (!email && !token) {
      return res.status(400).json({ success: false, message: 'Email or token is required.' });
    }

    let rows;
    if (token) {
      [rows] = await pool.execute(`SELECT * FROM candidate_offer_requests WHERE token = ? LIMIT 1`, [token]);
    } else {
      [rows] = await pool.execute(
        `SELECT * FROM candidate_offer_requests WHERE candidate_email = ? ORDER BY id DESC LIMIT 1`,
        [email.toLowerCase().trim()]
      );
    }

    if (rows.length === 0) {
      return res.json({ success: true, status: 'NOT_REQUESTED' });
    }

    const offer = rows[0];
    return res.json({
      success: true,
      status: offer.status,
      offer: {
        id: offer.id,
        token: offer.token,
        candidateName: offer.candidate_name,
        candidateEmail: offer.candidate_email,
        score: offer.assessment_score,
        role: offer.role,
        department: offer.department,
        salary: offer.salary,
        startDate: offer.start_date,
        status: offer.status,
        adminNotes: offer.admin_notes,
        approvedAt: offer.approved_at,
        acceptedAt: offer.accepted_at
      }
    });
  } catch (err) {
    console.error('[OfferLetter] status error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Get Offer Review Data by Token (Used by Admin Review Screen)
router.get('/review/:token', async (req, res) => {
  try {
    await ensureOfferTable();
    const { token } = req.params;
    const [rows] = await pool.execute(`SELECT * FROM candidate_offer_requests WHERE token = ? LIMIT 1`, [token]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Offer approval request not found or invalid token.' });
    }

    const offer = rows[0];
    return res.json({
      success: true,
      offer: {
        id: offer.id,
        token: offer.token,
        candidateName: offer.candidate_name,
        candidateEmail: offer.candidate_email,
        score: offer.assessment_score,
        role: offer.role,
        department: offer.department,
        salary: offer.salary,
        startDate: offer.start_date,
        phone: offer.phone_number,
        location: offer.location,
        experience: offer.experience,
        qualification: offer.qualification,
        certification: offer.certification,
        linkedin: offer.linkedin_url,
        resumeLink: offer.resume_link,
        workTimings: offer.work_timings,
        currentSalary: offer.current_salary,
        workStatus: offer.work_status,
        workMode: offer.work_mode,
        availability: offer.availability,
        status: offer.status,
        adminNotes: offer.admin_notes,
        approvedAt: offer.approved_at
      }
    });
  } catch (err) {
    console.error('[OfferLetter] review token error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 4. List All Candidate Offer Requests (For Admin Dashboard)
router.get('/all-requests', async (req, res) => {
  try {
    await ensureOfferTable();
    const [rows] = await pool.execute(
      `SELECT id, token, candidate_name, candidate_email, assessment_score, role, department, salary, start_date, phone_number, location, experience, qualification, certification, linkedin_url, resume_link, work_timings, current_salary, work_status, work_mode, availability, status, admin_notes, approved_at, created_at
       FROM candidate_offer_requests
       ORDER BY id DESC LIMIT 100`
    );
    return res.json({ success: true, requests: rows });
  } catch (err) {
    console.error('[OfferLetter] all-requests error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 5. Admin Approves and Issues Offer Letter to Candidate
router.post('/approve', async (req, res) => {
  try {
    await ensureOfferTable();
    const {
      token,
      candidateEmail,
      role = 'Business Development Executive',
      department = 'Business Development & Client Relations',
      salary = '₹30,000 per month',
      startDate,
      adminNotes = '',
      approvedBy = 'Infogenx HR Management',
      openingStatement,
      incentiveDescription,
      targets,
      reportingTools,
      pdfBase64
    } = req.body;

    if (!token && !candidateEmail) {
      return res.status(400).json({ success: false, message: 'Token or candidateEmail is required.' });
    }

    let rows;
    if (token) {
      [rows] = await pool.execute(`SELECT * FROM candidate_offer_requests WHERE token = ? LIMIT 1`, [token]);
    } else {
      [rows] = await pool.execute(
        `SELECT * FROM candidate_offer_requests WHERE candidate_email = ? ORDER BY id DESC LIMIT 1`,
        [candidateEmail.toLowerCase().trim()]
      );
    }

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Offer request record not found.' });
    }

    const offerRecord = rows[0];
    const targetEmail = offerRecord.candidate_email;
    const targetName = offerRecord.candidate_name;
    const todayStr = getFormattedDate();
    const formattedStartDate = startDate || offerRecord.start_date || getFormattedDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

    // Update database status to APPROVED
    await pool.execute(
      `UPDATE candidate_offer_requests
       SET role = ?, department = ?, salary = ?, start_date = ?, admin_notes = ?, approved_by = ?, approved_at = NOW(), status = 'APPROVED'
       WHERE id = ?`,
      [role, department, salary, formattedStartDate, adminNotes, approvedBy, offerRecord.id]
    );

    // Build email to candidate
    const resolvedOpening = openingStatement || `Based on your technical proficiency, aptitude, and outstanding performance in our technical assessment, we believe you will be a valuable asset to our global operations.`;
    const resolvedIncentive = incentiveDescription || `You are eligible for a Performance-Linked Incentive (PLI) for every milestone successfully completed. The incentive is calculated based on milestone delivery, quality metrics, and profitability.`;
    const resolvedReporting = reportingTools || `the company's designated operational systems (GitHub / Jira / Zoho CRM / Google Sheets)`;

    let targetsHtml = `
      <li><strong>Initial Target:</strong> Consistent output and adherence to project deliverables within your first month.</li>
      <li><strong>Contract Continuity:</strong> This offer is performance-linked. Maintaining quality output and proactive communication is required to ensure contract continuity.</li>
      <li><strong>Performance Review:</strong> A formal review will be conducted after six months. Upon satisfactory appraisal, a revision in base compensation and incentive tier will be evaluated.</li>
    `;
    if (Array.isArray(targets) && targets.length > 0) {
      targetsHtml = targets.map(t => `<li><strong>${t.label}:</strong> ${t.text}</li>`).join('\n');
    }

    const attachments = [];
    const headerPath = path.join(__dirname, '../assets/offer/infogenx_header.jpeg');
    const directorSigPath = path.join(__dirname, '../assets/offer/director_signature.jpeg');

    if (fs.existsSync(headerPath)) {
      attachments.push({ filename: 'infogenx_header.jpeg', path: headerPath, cid: 'infogenx_header' });
    }
    if (fs.existsSync(directorSigPath)) {
      attachments.push({ filename: 'director_signature.jpeg', path: directorSigPath, cid: 'director_sig' });
    }
    if (pdfBase64) {
      const cleanBase64 = pdfBase64.includes(',') ? pdfBase64.split(',')[1] : pdfBase64;
      attachments.push({
        filename: `OfferLetter-${targetName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
        content: Buffer.from(cleanBase64, 'base64'),
        contentType: 'application/pdf'
      });
    }

    const portalSignUrl = `https://candidates.infogenx.com/offer-letter`;

    const candidateHtml = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: 'Segoe UI', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F8FAFC; padding: 36px 12px;">
        <tr>
          <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 640px; background-color: #FFFFFF; border-radius: 14px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 18, 60, 0.08); border: 1px solid #E2E8F0;">
              <!-- Header Branding -->
              <tr>
                <td align="center" style="background: linear-gradient(135deg, #00123C 0%, #000E68 55%, #E65525 100%); padding: 34px 20px; color: #FFFFFF;">
                  <a href="https://candidates.infogenx.com" target="_blank" style="text-decoration: none; display: inline-block;">
                    <img src="https://candidates.infogenx.com/logo_white.png" alt="INFOGENX" width="180" style="width: 180px; max-width: 180px; height: auto; display: block; margin: 0 auto 8px auto; border: 0;" />
                  </a>
                  <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.95; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; color: #FFFFFF;">Official Offer Letter Notification</p>
                </td>
              </tr>
              <!-- Content Body -->
              <tr>
                <td style="padding: 36px 32px; color: #00123C;">
                  <div style="text-align: right; color: #64748b; font-size: 13px; font-weight: 600; margin-bottom: 12px;">Date: ${todayStr}</div>
                  <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #334155;">Dear Candidate,</p>
                  <p style="font-size: 14.5px; line-height: 1.6; color: #334155; margin: 0 0 20px 0;">
                    We are pleased to inform you that your <strong>Official Offer Letter</strong> has been reviewed and officially approved by the <strong>Infogenx Management Team</strong>!
                  </p>

                  <div style="background-color: #F0FDF4; border: 1.5px solid #BBF7D0; border-left: 5px solid #16A34A; padding: 20px; border-radius: 12px; margin: 20px 0;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px; border-collapse: collapse;">
                      <tr style="border-bottom: 1px solid #E2E8F0;"><td style="padding: 8px 0; color: #5C6A86; font-weight: 600; width: 40%;">Assigned Position:</td><td style="padding: 8px 0; color: #00123C; font-weight: 700;">${role}</td></tr>
                      <tr style="border-bottom: 1px solid #E2E8F0;"><td style="padding: 8px 0; color: #5C6A86; font-weight: 600;">Department:</td><td style="padding: 8px 0; color: #00123C; font-weight: 700;">${department}</td></tr>
                      <tr style="border-bottom: 1px solid #E2E8F0;"><td style="padding: 8px 0; color: #5C6A86; font-weight: 600;">Approved Compensation:</td><td style="padding: 8px 0; color: #E65525; font-weight: 700;">${salary}</td></tr>
                      <tr><td style="padding: 8px 0; color: #5C6A86; font-weight: 600;">Scheduled Start Date:</td><td style="padding: 8px 0; color: #00123C; font-weight: 700;">${formattedStartDate}</td></tr>
                    </table>
                  </div>

                  <p style="font-size: 14px; line-height: 1.6; color: #334155;">
                    ${resolvedOpening}
                  </p>

                  <h4 style="color: #00123C; font-size: 15px; font-weight: 700; margin: 22px 0 10px;">Key Deliverables & Performance Targets:</h4>
                  <ul style="font-size: 14px; line-height: 1.7; color: #334155; padding-left: 20px; margin: 0 0 24px;">
                    ${targetsHtml}
                  </ul>

                  <p style="font-size: 14px; line-height: 1.6; color: #334155;">
                    Please access your candidate portal to review your approved terms, draw or upload your digital signature (E-Signature), and download your official Offer Letter:
                  </p>

                  <div align="center" style="margin: 32px 0 24px 0;">
                    <a href="${portalSignUrl}" target="_blank" style="background: linear-gradient(90deg, #00123C 0%, #E65525 100%); color: #FFFFFF !important; text-decoration: none; padding: 15px 36px; border-radius: 10px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 8px 22px rgba(0, 18, 60, 0.16); text-align: center;">
                      ✍️ View & Sign Your Approved Offer Letter →
                    </a>
                  </div>

                  <div style="margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 20px; display: table; width: 100%;">
                    <div style="display: table-cell; vertical-align: top;">
                      <img src="cid:director_sig" alt="Director Signature" style="max-height: 40px;" />
                      <p style="margin: 2px 0; font-weight: 700; font-size: 13px; color: #00123C;">Nithyanand Arumugham</p>
                      <p style="margin: 0; font-size: 12px; color: #64748b;">Director • Infogenx Private Limited</p>
                    </div>
                  </div>
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

    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"Infogenx HR Management" <${process.env.SMTP_USER || 'infogenx.dm@gmail.com'}>`,
      to: targetEmail,
      cc: 'admin@infogenx.com',
      subject: `🎉 Congratulations! Your Official Infogenx Offer Letter has been Approved`,
      html: candidateHtml,
      attachments
    });

    console.log(`[OfferLetter] Approved offer letter emailed to student ${targetEmail}`);

    return res.json({
      success: true,
      message: `Offer Letter successfully approved and emailed to ${targetEmail}.`,
      offer: {
        role,
        department,
        salary,
        startDate: formattedStartDate,
        status: 'APPROVED'
      }
    });
  } catch (err) {
    console.error('[OfferLetter] approve error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/send-email', async (req, res) => {
  try {
    const {
      candidateName,
      candidateEmail,
      role = 'Business Development Executive',
      department = 'Business Development & Client Relations',
      salary = '₹30,000 per month',
      signatureDataUrl,
      pdfBase64,
      startDate,
      openingStatement,
      incentiveDescription,
      targets,
      reportingTools
    } = req.body;

    if (!candidateEmail || !candidateName) {
      return res.status(400).json({
        success: false,
        message: 'Candidate name and email are required'
      });
    }

    const todayStr = getFormattedDate();
    const formattedStartDate = startDate || getFormattedDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

    const defaultOpening = `Based on your technical proficiency, aptitude, and outstanding performance in our technical assessment, we believe you will be a valuable asset to our global operations.`;
    const resolvedOpening = openingStatement || defaultOpening;
    const resolvedIncentive = incentiveDescription || `You are eligible for a Performance-Linked Incentive (PLI) for every milestone successfully completed. The incentive is calculated based on milestone delivery, quality metrics, and profitability.`;
    const resolvedReporting = reportingTools || `the company's designated tracking systems (Google Sheets / Zoho CRM / Git Repositories)`;

    let targetsHtml = `
      <li><strong>Initial Target:</strong> Consistent output and adherence to project deliverables within your first month.</li>
      <li><strong>Contract Continuity:</strong> This offer is performance-linked. Maintaining quality output and proactive communication is required to ensure contract continuity.</li>
      <li><strong>Performance Review:</strong> A formal review will be conducted after six months. Upon satisfactory appraisal, a revision in base compensation and incentive tier will be evaluated.</li>
    `;
    if (Array.isArray(targets) && targets.length > 0) {
      targetsHtml = targets.map(t => `<li><strong>${t.label}:</strong> ${t.text}</li>`).join('\n');
    }

    // Reference assets
    const headerPath = path.join(__dirname, '../assets/offer/infogenx_header.jpeg');
    const directorSigPath = path.join(__dirname, '../assets/offer/director_signature.jpeg');

    const attachments = [];

    // Header image CID
    if (fs.existsSync(headerPath)) {
      attachments.push({
        filename: 'infogenx_header.jpeg',
        path: headerPath,
        cid: 'infogenx_header'
      });
    }

    // Director signature CID
    if (fs.existsSync(directorSigPath)) {
      attachments.push({
        filename: 'director_signature.jpeg',
        path: directorSigPath,
        cid: 'director_sig'
      });
    }

    // Candidate signature CID
    let candidateSigHtml = `<span style="font-family: 'Brush Script MT', cursive; font-size: 22px; color: #00123C; border-bottom: 1px solid #00123C; padding: 0 10px;">${candidateName}</span>`;
    if (signatureDataUrl && signatureDataUrl.startsWith('data:image')) {
      const base64Data = signatureDataUrl.split(',')[1];
      attachments.push({
        filename: 'candidate_signature.png',
        content: Buffer.from(base64Data, 'base64'),
        cid: 'candidate_sig'
      });
      candidateSigHtml = `<img src="cid:candidate_sig" alt="Candidate Signature" style="max-height: 50px; max-width: 220px; object-fit: contain; vertical-align: middle;" />`;
    }

    // PDF attachment if provided
    if (pdfBase64) {
      const cleanBase64 = pdfBase64.includes(',') ? pdfBase64.split(',')[1] : pdfBase64;
      attachments.push({
        filename: `OfferLetter-${candidateName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
        content: Buffer.from(cleanBase64, 'base64'),
        contentType: 'application/pdf'
      });
    }

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; background: #f8fafc; padding: 20px; margin: 0; line-height: 1.6; }
    .container { max-width: 720px; margin: 0 auto; background: #ffffff; padding: 40px; border-radius: 10px; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
    .header-img { width: 100%; max-height: 120px; object-fit: contain; margin-bottom: 25px; }
    h1 { font-size: 20px; color: #00123C; margin: 0 0 10px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #E65525; padding-bottom: 8px; }
    h2 { font-size: 15px; color: #00123C; margin: 20px 0 8px; text-transform: uppercase; font-weight: 700; }
    p { margin: 8px 0; font-size: 14px; }
    ul { margin: 8px 0 16px 20px; padding: 0; font-size: 14px; }
    li { margin-bottom: 6px; }
    .meta-date { text-align: right; font-size: 14px; color: #64748b; font-weight: 600; margin-bottom: 20px; }
    .salutation { font-size: 16px; font-weight: 700; color: #00123C; margin-bottom: 14px; }
    .sign-section { margin-top: 35px; border-top: 2px solid #e2e8f0; padding-top: 25px; }
    .sign-grid { display: table; width: 100%; margin-top: 15px; }
    .sign-col { display: table-cell; width: 50%; vertical-align: top; padding-right: 15px; }
    .sign-title { font-weight: 700; font-size: 14px; color: #00123C; margin-bottom: 8px; }
    .sign-box { min-height: 60px; margin: 10px 0; }
    .footer { text-align: center; margin-top: 35px; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div style="text-align: center;">
      <img src="cid:infogenx_header" class="header-img" alt="Infogenx Private Limited" />
    </div>

    <div class="meta-date">Date: ${todayStr}</div>

    <div class="salutation">Dear ${candidateName},</div>

    <p>
      We are pleased to offer you the position of <strong>${role}</strong> in our <strong>${department}</strong> division at <strong>Infogenx Private Limited</strong>.
      ${resolvedOpening}
    </p>

    <p>Your employment will be governed by the following terms and conditions:</p>

    <h2>1. Remuneration & Compensation</h2>
    <ul>
      <li><strong>Fixed Monthly Compensation:</strong> You will receive a consolidated gross salary of <strong>${salary}</strong>.</li>
      <li><strong>Performance Incentives:</strong> ${resolvedIncentive}</li>
      <li><strong>Payment Schedule:</strong> Salary and earned incentives will be transferred to your designated bank account during the first week of every month, following the verification of your performance reports.</li>
    </ul>

    <h2>2. Performance Expectations & Targets</h2>
    <ul>
      ${targetsHtml}
    </ul>

    <h2>3. Reporting & Operations</h2>
    <p>
      As part of our data-driven approach, you are required to maintain a daily log of your activities and project statuses in the company's designated operational systems (<strong>${resolvedReporting}</strong>).
    </p>

    <h2>4. Acceptance and Commencement</h2>
    <p>
      Your official start date is scheduled for <strong>${formattedStartDate}</strong>.
      This letter constitutes our formal offer. By signing below, you acknowledge and agree to these terms.
    </p>

    <div class="sign-section">
      <div class="sign-grid">
        <div class="sign-col">
          <div class="sign-title">Authorization (For Infogenx Private Limited):</div>
          <div class="sign-box">
            <img src="cid:director_sig" alt="Director Signature" style="max-height: 45px; object-fit: contain;" />
          </div>
          <p style="margin: 2px 0;"><strong>Nithyanand Arumugham</strong><br>Director</p>
          <p style="margin: 2px 0; font-size: 13px; color: #64748b;">Phone: +91 97878 06366<br>Email: nithyanand.a@infogenx.com.au</p>
          <p style="margin: 4px 0; font-size: 13px;">Date: ${todayStr}</p>
        </div>

        <div class="sign-col" style="border-left: 1px dashed #cbd5e1; padding-left: 20px;">
          <div class="sign-title">Candidate Acceptance:</div>
          <p style="font-size: 13px; margin: 4px 0;">
            I, <strong>${candidateName}</strong>, accept the offer of employment as <strong>${role}</strong> under the terms outlined above.
          </p>
          <div class="sign-box">
            ${candidateSigHtml}
          </div>
          <p style="margin: 2px 0;"><strong>${candidateName}</strong></p>
          <p style="margin: 4px 0; font-size: 13px;">Date of Signing: ${todayStr}</p>
        </div>
      </div>
    </div>

    <div class="footer">
      Infogenx Private Limited • Official Candidate Onboarding System<br>
      Website: <a href="https://infogenx.com" style="color: #E65525;">https://infogenx.com</a> • Portal: <a href="https://candidates.infogenx.com" style="color: #E65525;">https://candidates.infogenx.com</a>
    </div>
  </div>
</body>
</html>
    `;

    const transporter = getTransporter();

    const mailOptions = {
      from: `"Infogenx HR Team" <${process.env.SMTP_USER || 'infogenx.dm@gmail.com'}>`,
      to: candidateEmail,
      cc: 'admin@infogenx.com',
      subject: `🎉 Congratulations! Your Official Infogenx Offer Letter - ${candidateName}`,
      html: htmlContent,
      attachments
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[OfferLetter] Email sent to ${candidateEmail}. Message ID: ${info.messageId}`);

    return res.json({
      success: true,
      message: `Offer Letter successfully emailed to ${candidateEmail}`,
      messageId: info.messageId,
      acceptedDate: todayStr
    });
  } catch (err) {
    console.error('[OfferLetter] Error sending offer letter email:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to send Offer Letter email'
    });
  }
});

module.exports = router;
