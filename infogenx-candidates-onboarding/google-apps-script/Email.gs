function sendWelcomeEmail(email, fullName, password, mobile, skillCategory) {
  if (!email) {
    Logger.log("sendWelcomeEmail skipped: No email provided.");
    return;
  }

  const cleanEmail = email.trim().toLowerCase();

  // -------------------------------------------------------------------
  // 15-Second Deduplication Lock: Prevents concurrent trigger execution per submit
  // -------------------------------------------------------------------
  const cache = CacheService.getScriptCache();
  const cacheKey = "email_sent_lock_" + cleanEmail;
  if (cache.get(cacheKey)) {
    Logger.log("sendWelcomeEmail skipped: Concurrent trigger active for " + cleanEmail);
    return;
  }
  cache.put(cacheKey, "true", 15); // 15-second window lock

  const PORTAL_URL = "https://candidates.infogenx.com/login";
  const subject = "Infogenx HR Training Credentials";

  // 1. Sync candidate record to Backend Database so they can log in
  try {
    const payload = JSON.stringify({
      fullName: fullName || "Candidate",
      email: cleanEmail,
      password: password || "INFO" + Math.floor(1000 + Math.random() * 9000),
      mobile: mobile || "",
      skillCategory: skillCategory || "General"
    });

    const options = {
      method: "post",
      contentType: "application/json",
      payload: payload,
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch("https://candidates.infogenx.com/api/candidate-auth/onboard-candidate", options);
    Logger.log("Candidate Auth Onboarding Server Response: " + response.getContentText());
  } catch (apiErr) {
    Logger.log("Candidate Auth Server API warning: " + apiErr.message);
  }

  // 2. ALWAYS Send Welcome Email directly via GmailApp (guarantees latest template & 100% delivery)
  try {
    const htmlBody =
      '<!DOCTYPE html>' +
      '<html>' +
      '<head>' +
      '<meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
      '<title>Infogenx HR Training Credentials</title>' +
      '</head>' +
      '<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: \'Segoe UI\', Arial, sans-serif; -webkit-font-smoothing: antialiased;">' +
      '<table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F8FAFC; padding: 40px 10px;">' +
      '<tr>' +
      '<td align="center">' +
      '<table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 18, 60, 0.08); border: 1px solid #E2E8F0;">' +
      '<!-- Header Branding -->' +
      '<tr>' +
      '<td align="center" style="background: linear-gradient(135deg, #00123C 0%, #000E68 55%, #E65525 100%); padding: 34px 20px; color: #FFFFFF;">' +
      '<a href="https://candidates.infogenx.com" target="_blank" style="text-decoration: none; display: inline-block;">' +
      '<img src="https://candidates.infogenx.com/logo_white.png" alt="INFOGENX" width="180" style="width: 180px; max-width: 180px; height: auto; display: block; margin: 0 auto 8px auto; border: 0;" />' +
      '</a>' +
      '<p style="margin: 0; font-size: 13px; opacity: 0.95; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; color: #FFFFFF;">Candidate Onboarding & Assessment Portal</p>' +
      '</td>' +
      '</tr>' +
      '<!-- Content Body -->' +
      '<tr>' +
      '<td style="padding: 36px 32px; color: #00123C;">' +
      '<p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #334155;">Dear Candidate,</p>' +
      '<p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #334155;">Thank you for completing the registration form.</p>' +
      '<p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #334155;">To proceed with your onboarding, please click the button below to log in to the HR Training Application using your registered email address and the temporary password provided below:</p>' +
      '<div align="center" style="margin: 24px 0 18px 0;">' +
      '<p style="margin: 0; font-size: 15px; line-height: 1.6; color: #00123C; font-weight: 700;">Password: <span style="color: #E65525; font-family: monospace; font-size: 19px; font-weight: 800; letter-spacing: 0.05em; background-color: #FFEEE9; padding: 6px 14px; border-radius: 6px; border: 1px dashed #E65525; display: inline-block; margin-left: 6px;">' + password + '</span></p>' +
      '</div>' +
      '<!-- CTA Button -->' +
      '<div align="center" style="margin: 18px 0 24px 0;">' +
      '<a href="' + PORTAL_URL + '" target="_blank" style="background: linear-gradient(90deg, #00123C 0%, #E65525 100%); color: #FFFFFF !important; text-decoration: none; padding: 15px 42px; border-radius: 10px; font-weight: 700; font-size: 16px; display: inline-block; box-shadow: 0 8px 22px rgba(230, 85, 37, 0.25); text-align: center;">Access HR Training Application →</a>' +
      '</div>' +
      '<!-- Direct Link Fallback -->' +
      '<p style="margin: 0 0 12px 0; font-size: 14px; line-height: 1.6; color: #475569;">Please complete the training process at your earliest convenience. If you encounter any issues accessing the portal through the button above, copy and paste the following link directly into your browser:</p>' +
      '<p style="margin: 0 0 28px 0; font-size: 14px; text-align: center;"><a href="' + PORTAL_URL + '" target="_blank" style="color: #2563EB; font-weight: 600; text-decoration: underline;">' + PORTAL_URL + '</a></p>' +
      '<p style="margin: 0 0 4px 0; font-size: 15px; line-height: 1.6; color: #334155;">Best regards,</p>' +
      '<p style="margin: 0; font-size: 15px; font-weight: 700; color: #00123C;">Infogenx Talent Acquisition & HR Operations</p>' +
      '</td>' +
      '</tr>' +
      '<!-- Unified Footer -->' +
      '<tr>' +
      '<td align="center" style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 24px 20px; color: #64748B; font-size: 12px; line-height: 1.6;">' +
      '<p style="margin: 0 0 6px 0; font-weight: 700; color: #00123C; font-size: 13px;">Infogenx Talent Acquisition & HR Operations</p>' +
      '<p style="margin: 0 0 6px 0;">This is an automated operational email from Infogenx Recruitment Management System.</p>' +
      '<p style="margin: 0; color: #94A3B8;">&copy; 2026 Infogenx Pvt. Ltd. All Rights Reserved. • <a href="https://infogenx.com" target="_blank" style="color: #E65525; text-decoration: none; font-weight: 600;">infogenx.com</a></p>' +
      '</td>' +
      '</tr>' +
      '</table>' +
      '</td>' +
      '</tr>' +
      '</table>' +
      '</body>' +
      '</html>';

    const plainTextBody = "Dear Candidate,\n\n" +
      "Thank you for completing the registration form.\n\n" +
      "To proceed with your onboarding, please click the button below to log in to the HR Training Application using your registered email address and the temporary password provided below:\n\n" +
      "Password: " + password + "\n\n" +
      "Please complete the training process at your earliest convenience. If you encounter any issues accessing the portal through the button above, copy and paste the following link directly into your browser:\n\n" +
      PORTAL_URL + "\n\n" +
      "Best regards,\n" +
      "Infogenx Talent Acquisition & HR Operations";

    GmailApp.sendEmail(cleanEmail, subject, plainTextBody, {
      htmlBody: htmlBody,
      name: "Infogenx"
    });
    Logger.log("✅ GmailApp sendEmail completed for: " + cleanEmail);
  } catch (gmailErr) {
    Logger.log("GmailApp sendEmail warning: " + gmailErr.message);
  }
}