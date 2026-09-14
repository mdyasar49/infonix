function sendWelcomeEmail(email, fullName, password, mobile, skillCategory) {
  if (!email) {
    Logger.log("sendWelcomeEmail skipped: No email provided.");
    return;
  }

  const PORTAL_URL = "https://candidates.infogenx.com/login";
  const BACKUP_PORTAL_URL = "https://infogenx-candidates-onboarding.netlify.app/login";
  const subject = "Application Received Successfully - Infogenx Candidate Portal";

  // 1. Sync candidate and send Welcome Email via Infogenx Server SMTP
  let serverEmailSent = false;
  try {
    const payload = JSON.stringify({
      fullName: fullName || "Candidate",
      email: email,
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

    const response = UrlFetchApp.fetch("https://api.infogenx.com/api/candidate-auth/onboard-candidate", options);
    Logger.log("Candidate Auth Onboarding Server Response: " + response.getContentText());
    if (response.getResponseCode() >= 200 && response.getResponseCode() < 300) {
      serverEmailSent = true;
    }
  } catch (apiErr) {
    Logger.log("Candidate Auth Server API warning: " + apiErr.message);
  }

  // 2. Send branded email directly from current Gmail account ONLY if server API did not handle it
  if (!serverEmailSent) {
    try {
      const htmlBody =
        '<!DOCTYPE html>' +
        '<html>' +
        '<head>' +
        '<meta charset="utf-8">' +
        '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
        '<title>Application Received - Infogenx</title>' +
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
        '<h2 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 800; color: #00123C;">Application Received Successfully 🎉</h2>' +
        '<p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #334155;">Dear <strong>' + fullName + '</strong>,</p>' +
        '<p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #334155;">Thank you for submitting your candidate application to Infogenx. Your profile has been registered in our system, and your candidate onboarding account is now active.</p>' +
        '<!-- Credentials Box -->' +
        '<div style="background-color: #FFF8F3; border: 1.5px solid rgba(230, 85, 37, 0.25); border-radius: 12px; padding: 22px; margin-bottom: 26px;">' +
        '<h3 style="margin: 0 0 14px 0; font-size: 16px; font-weight: 800; color: #E65525;">Your Login Credentials</h3>' +
        '<table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px;">' +
        '<tr>' +
        '<td style="padding: 6px 0; color: #5C6A86; font-weight: 600; width: 140px;">Registered Email:</td>' +
        '<td style="padding: 6px 0; color: #00123C; font-weight: 700;">' + email + '</td>' +
        '</tr>' +
        '<tr>' +
        '<td style="padding: 6px 0; color: #5C6A86; font-weight: 600;">Generated Password:</td>' +
        '<td style="padding: 6px 0; color: #E65525; font-weight: 800; font-family: monospace; font-size: 16px; letter-spacing: 0.05em;">' + password + '</td>' +
        '</tr>' +
        '</table>' +
        '</div>' +
        '<!-- Instruction -->' +
        '<p style="margin: 0 0 28px 0; font-size: 15px; line-height: 1.6; color: #334155;">Thanks for filling out this form, Please login to the HR Training Applicaiton with below user name and password and complete all training Process</p>' +
        '<!-- CTA Button -->' +
        '<div align="center" style="margin: 30px 0 24px 0;">' +
        '<a href="' + PORTAL_URL + '" target="_blank" style="background: linear-gradient(90deg, #00123C 0%, #E65525 100%); color: #FFFFFF !important; text-decoration: none; padding: 15px 36px; border-radius: 10px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 8px 22px rgba(0, 18, 60, 0.16); text-align: center;">Access Candidate Portal →</a>' +
        '</div>' +
        '<!-- Direct Link Fallback -->' +
        '<p style="margin: 0; font-size: 13px; color: #94A3B8; text-align: center; line-height: 1.5;">If the button above does not work, copy and paste this link into your browser:<br><a href="' + PORTAL_URL + '" target="_blank" style="color: #E65525; text-decoration: underline;">' + PORTAL_URL + '</a></p>' +
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

      const plainTextBody = "Dear " + fullName + ",\n\n" +
        "Thanks for filling out this form, Please login to the HR Training Applicaiton with below user name and password and complete all training Process\n\n" +
        "Registered Email: " + email + "\n" +
        "Generated Password: " + password + "\n\n" +
        "Portal Link: " + PORTAL_URL + "\n\n" +
        "Best regards,\nInfogenx Recruitment Team";

      GmailApp.sendEmail(email, subject, plainTextBody, {
        htmlBody: htmlBody,
        name: "Infogenx Candidate Portal"
      });
    } catch (gmailErr) {
      Logger.log("GmailApp sendEmail warning: " + gmailErr.message);
    }
  }
}
}