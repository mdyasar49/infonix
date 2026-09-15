function sendWelcomeEmail(email, fullName, password, mobile, skillCategory) {
  if (!email) {
    Logger.log("sendWelcomeEmail skipped: No email provided.");
    return;
  }

  const cleanEmail = email.trim().toLowerCase();

  // -------------------------------------------------------------------
  // 300-Second (5-Minute) Multi-Project Deduplication Lock
  // -------------------------------------------------------------------
  const cacheKey = "email_sent_lock_" + cleanEmail;
  const docCache = CacheService.getDocumentCache();
  const scriptCache = CacheService.getScriptCache();

  if ((docCache && docCache.get(cacheKey)) || (scriptCache && scriptCache.get(cacheKey))) {
    Logger.log("sendWelcomeEmail skipped: Deduplication lock active for " + cleanEmail);
    return;
  }

  if (docCache) docCache.put(cacheKey, "true", 300);
  if (scriptCache) scriptCache.put(cacheKey, "true", 300);

  // 1. Dispatch Welcome Email via Node Backend API (Guarantees 100% Latest Design & Single Delivery)
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
}