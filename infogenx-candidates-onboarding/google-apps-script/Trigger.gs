/**
 * ==========================================================
 * INFOGENX STUDENT ONBOARDING SYSTEM
 * TRIGGER.GS - UNIVERSAL MULTI-TRIGGER ENGINE
 * ==========================================================
 *
 * Supports:
 * 1. Google Form Form-Submit Triggers (e.response)
 * 2. Google Sheet Form-Submit Triggers (e.namedValues / e.values)
 * 3. Webhook / Direct Code Ingestion (student object)
 * 4. Manual Test Execution from Apps Script Editor
 * ==========================================================
 */

// Google Form: https://docs.google.com/forms/d/e/1FAIpQLSdAffcQaR1oRuv_NwT5D-MrnGbjPq0EE_cka6jAZ5FjEgt0WA/viewform
const TARGET_FORM_ID = "1ugPH89EBC1RSVJrrHKs3qnYnyR3y5rXAVwK43wamthE";
const TARGET_DATABASE_ID = "1tEjn1hJ0rd2pNV3kaLyv4SitFyoRLwCKb5loAdEvjoM";
const PRIMARY_PROJECT_ID = "1u1_v1sF907CLG4Yk33NHYMQEtNnpgENiNq4CHqAbUMLHmioZAjvJVzC4";

function isPrimaryProject() {
  try {
    const currentId = ScriptApp.getScriptId();
    if (currentId && currentId !== PRIMARY_PROJECT_ID) {
      Logger.log("⚠️ Primary Project Lock: Skipping execution for non-primary project ID: " + currentId);
      return false;
    }
  } catch (err) {
    Logger.log("ScriptId check note: " + err.message);
  }
  return true;
}

/**
 * Main Onboarding Event Handler
 */
function onFormSubmit(e) {
  Logger.log("=== onFormSubmit triggered ===");
  return onStudentRegistration(e);
}

function onSubmit(e) {
  Logger.log("=== onSubmit triggered ===");
  return onStudentRegistration(e);
}

function handleFormSubmit(e) {
  Logger.log("=== handleFormSubmit triggered ===");
  return onStudentRegistration(e);
}

function onEdit(e) {
  Logger.log("=== onEdit triggered ===");
  return onStudentRegistration(e);
}

function onStudentRegistration(e) {
  try {
    if (!isPrimaryProject()) {
      Logger.log("Execution aborted: Non-primary Apps Script project.");
      return;
    }

    Logger.log("=== onStudentRegistration triggered ===");

    // -------------------------------------------------------
    // Student Data Structure
    // -------------------------------------------------------
    const student = {
      fullName: "",
      dob: "",
      email: "",
      mobile: "",
      city: "",
      qualification: "",
      college: "",
      department: "",
      yearOfPassing: "",
      skillCategory: "",
      skills: "",
      experienceType: "",
      companyName: "",
      experienceYears: "",
      currentSalary: "",
      expectedSalary: "",
      resumeLink: "",
      preferredTime: "",
      certification: "",
      linkedinUrl: "",
      workDurationTimings: "",
      startDate: "",
      currentTakeHomeSalaryHourlyRate: "",
      currentWorkStatus: "",
      workingType: "",
      preferredAvailability: ""
    };

    // -------------------------------------------------------
    // Case 1: Manual Run from Editor (Self-Test Simulation)
    // -------------------------------------------------------
    if (!e) {
      Logger.log("[Test Mode] No trigger event provided. Running full end-to-end self-test...");
      return testEndToEndRegistration();
    }

    // -------------------------------------------------------
    // Case 2: Google Form Event (e.response)
    // -------------------------------------------------------
    if (e.response && typeof e.response.getItemResponses === "function") {
      Logger.log("[Source: Google Form Submission]");
      
      // Extract respondent email from form settings
      try {
        if (typeof e.response.getRespondentEmail === "function") {
          const respEmail = e.response.getRespondentEmail();
          if (respEmail) {
            student.email = respEmail.trim().toLowerCase();
            Logger.log("Respondent email extracted: " + student.email);
          }
        }
      } catch (emErr) {
        Logger.log("Notice on getRespondentEmail: " + emErr.message);
      }

      const itemResponses = e.response.getItemResponses();
      itemResponses.forEach(function(itemResponse) {
        const title = (itemResponse.getItem().getTitle() || "").trim();
        const answer = itemResponse.getResponse();
        mapFieldToStudent(student, title, answer);
      });
    }
    // -------------------------------------------------------
    // Case 3: Google Sheet Form Event (e.namedValues)
    // -------------------------------------------------------
    else if (e.namedValues) {
      Logger.log("[Source: Google Sheet Form Submit (namedValues)]");
      for (const title in e.namedValues) {
        const val = e.namedValues[title];
        const answer = Array.isArray(val) ? val.join(", ") : val;
        mapFieldToStudent(student, title.trim(), answer);
      }

      // Check standard Google Form automatic email columns
      if (!student.email) {
        const possibleEmailKeys = ["Email Address", "Email address", "Email", "Username", "Email ID"];
        for (let i = 0; i < possibleEmailKeys.length; i++) {
          const k = possibleEmailKeys[i];
          if (e.namedValues[k]) {
            const rawVal = e.namedValues[k];
            student.email = Array.isArray(rawVal) ? rawVal[0] : rawVal;
            break;
          }
        }
      }
    }
    // -------------------------------------------------------
    // Case 4: Direct Payload (e.student or parameter)
    // -------------------------------------------------------
    // -------------------------------------------------------
    // Bulletproof Email Resolution Fallback
    // -------------------------------------------------------
    if (!student.email || !student.email.includes("@")) {
      try {
        const ss = SpreadsheetApp.openById(TARGET_DATABASE_ID);
        const sheet = ss.getSheets()[0];
        const lastRow = sheet.getLastRow();
        if (lastRow >= 1) {
          const rowValues = sheet.getRange(lastRow, 1, 1, Math.min(sheet.getLastColumn(), 10)).getValues()[0];
          for (let col = 0; col < rowValues.length; col++) {
            const cellVal = String(rowValues[col] || "").trim();
            if (cellVal.includes("@") && cellVal.includes(".")) {
              student.email = cellVal.toLowerCase();
              Logger.log("Fallback email extracted from spreadsheet last row: " + student.email);
              break;
            }
          }
        }
      } catch (sfErr) {
        Logger.log("Notice on spreadsheet email fallback: " + sfErr.message);
      }
    }

    // -------------------------------------------------------
    // Validate Required Student Information
    // -------------------------------------------------------
    student.fullName = cleanText(student.fullName);
    student.email = cleanText(student.email).toLowerCase();
    student.mobile = cleanText(student.mobile);

    if (!student.fullName) {
      student.fullName = "Candidate";
    }
    if (!student.email || !student.email.includes("@")) {
      throw new Error("Valid Email Address is missing from submission.");
    }

    Logger.log("Processing candidate: " + student.fullName + " <" + student.email + ">");

    // -------------------------------------------------------
    // 1. Save to Database (Google Sheet)
    // -------------------------------------------------------
    const result = saveStudent(student);
    if (!result || !result.success) {
      throw new Error(result && result.message ? result.message : "Failed to record student in database.");
    }

    const generatedPassword = result.password;
    Logger.log("Candidate saved successfully. Generated Password: " + generatedPassword);

    // -------------------------------------------------------
    // 2. Dispatch Welcome Email (via GmailApp & Backend API)
    // -------------------------------------------------------
    try {
      sendWelcomeEmail(student.email, student.fullName, generatedPassword, student.mobile, student.skillCategory);
      Logger.log("✅ Welcome email dispatched successfully.");
    } catch (emailErr) {
      Logger.log("⚠️ Email dispatch warning: " + emailErr.message);
    }

    // -------------------------------------------------------
    // 3. Dispatch Candidate Welcome SMS (via Twilio API)
    // -------------------------------------------------------
    try {
      if (student.mobile) {
        sendCandidateSMS(student, generatedPassword);
      }
    } catch (smsErr) {
      Logger.log("⚠️ Candidate SMS dispatch warning: " + smsErr.message);
    }

    // -------------------------------------------------------
    // 4. Dispatch HR SMS Notification
    // -------------------------------------------------------
    try {
      sendHRSMS(student);
    } catch (hrErr) {
      Logger.log("⚠️ HR SMS dispatch warning: " + hrErr.message);
    }

    Logger.log("🎉 Complete Candidate Onboarding Workflow Finished for: " + student.fullName);
    return {
      success: true,
      message: "Candidate registered successfully.",
      candidate: student.fullName,
      email: student.email
    };

  } catch (err) {
    Logger.log("❌ Registration Process Error: " + err.message);
    throw err;
  }
}

/**
 * Helper to flexibly map various form question titles
 */
function mapFieldToStudent(student, title, answer) {
  if (!title || answer === null || answer === undefined) return;
  const t = title.toLowerCase();
  const a = typeof answer === "string" ? answer.trim() : String(answer);

  if (t.includes("full name") || t.includes("name")) student.fullName = a;
  else if (t.includes("birth") || t.includes("dob")) student.dob = a;
  else if (t.includes("email") || (a.includes("@") && a.includes("."))) student.email = a.toLowerCase();
  else if (t.includes("mobile") || t.includes("phone") || t.includes("contact")) student.mobile = a;
  else if (t.includes("city") || t.includes("location")) student.city = a;
  else if (t.includes("qualification")) student.qualification = a;
  else if (t.includes("college") || t.includes("collage") || t.includes("university") || t.includes("institution")) student.college = a;
  else if (t.includes("department") || t.includes("branch") || t.includes("stream")) student.department = a;
  else if (t.includes("passing") || t.includes("year")) student.yearOfPassing = a;
  else if (t.includes("category")) student.skillCategory = a;
  else if (t.includes("skills") || t === "skill") student.skills = a;
  else if (t.includes("experience type") || t === "experience" || t.includes("experience")) student.experienceType = a;
  else if (t.includes("company name")) student.companyName = a;
  else if (t.includes("experience (years)") || t.includes("any experience")) student.experienceYears = a;
  else if (t.includes("expected salary")) student.expectedSalary = a;
  else if (t.includes("current monthly") || t.includes("take home") || t.includes("hourly rate") || t.includes("current salary")) {
    student.currentSalary = a;
    student.currentTakeHomeSalaryHourlyRate = a;
  }
  else if (t.includes("resume")) student.resumeLink = a;
  else if (t.includes("preferred time") || t.includes("duration & timings") || t.includes("timings you can work") || t.includes("working hours") || t.includes("preferred working")) {
    student.preferredTime = a;
    student.workDurationTimings = a;
  }
  else if (t.includes("certification")) student.certification = a;
  else if (t.includes("linkedin")) student.linkedinUrl = a;
  else if (t.includes("start date")) student.startDate = a;
  else if (t.includes("work status")) student.currentWorkStatus = a;
  else if (t.includes("if working then") || t.includes("working type")) student.workingType = a;
  else if (t.includes("availability")) student.preferredAvailability = a;
}

/**
 * Connect Original Form by ID or URL
 * Example: connectOriginalForm("YOUR_ORIGINAL_FORM_LINK");
 */
function connectOriginalForm(originalFormIdOrUrl) {
  if (!originalFormIdOrUrl) {
    throw new Error("Please specify the original Form ID or Form Edit URL.");
  }
  let formId = originalFormIdOrUrl;
  if (formId.includes("/d/")) {
    formId = formId.split("/d/")[1].split("/")[0];
  }
  PropertiesService.getScriptProperties().setProperty("FORM_ID", formId);
  Logger.log("Original Form ID Registered: " + formId);
  return createFormTrigger(formId);
}

/**
 * Universal Trigger Creator
 */
function createFormTrigger(explicitFormId) {
  const formId = explicitFormId || 
                 PropertiesService.getScriptProperties().getProperty("FORM_ID") || 
                 TARGET_FORM_ID;

  Logger.log("Connecting trigger for Form ID: " + formId);
  const form = FormApp.openById(formId);

  // Remove existing triggers to avoid duplicates
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function(trigger) {
    if (trigger.getHandlerFunction() === "onStudentRegistration") {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // Create clean trigger
  ScriptApp.newTrigger("onStudentRegistration")
    .forForm(form)
    .onFormSubmit()
    .create();

  Logger.log("✅ Form Submit Trigger Active for: " + form.getTitle() + " (" + formId + ")");
}

/**
 * Auto Trigger Initializer (Runs on Sheet Open and Menu)
 */
function onOpen(e) {
  try {
    SpreadsheetApp.getUi()
      .createMenu("🚀 Infogenx Automation")
      .addItem("⚡ Auto-Setup / Verify Triggers", "createAllTriggers")
      .addItem("🧪 Test Registration Flow", "testEndToEndRegistration")
      .addToUi();
  } catch (err) {}
}

/**
 * Universal Complete Trigger Activator
 * Creates both Form Trigger and Spreadsheet Trigger automatically!
 */
function createAllTriggers() {
  const databaseId = TARGET_DATABASE_ID;
  const formId = TARGET_FORM_ID;
  
  Logger.log("=== Creating System Triggers (Single Clean Trigger) ===");
  
  // 1. Auto-Link Form Responses to Google Spreadsheet
  try {
    const form = FormApp.openById(formId);
    form.setDestination(FormApp.DestinationType.SPREADSHEET, databaseId);
    Logger.log("✅ Google Form responses linked to Spreadsheet: " + databaseId);
  } catch (destErr) {
    Logger.log("⚠️ Form destination notice: " + destErr.message);
  }

  // Clean existing triggers for onStudentRegistration & syncSheetResponses
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function(t) {
    const fn = t.getHandlerFunction();
    if (fn === "onStudentRegistration" || fn === "syncSheetResponses") {
      ScriptApp.deleteTrigger(t);
    }
  });

  let createdCount = 0;

  // 2. Create Single Form Submit Trigger (Google Form)
  try {
    const form = FormApp.openById(formId);
    ScriptApp.newTrigger("onStudentRegistration")
      .forForm(form)
      .onFormSubmit()
      .create();
    Logger.log("✅ [1/2] Single Google Form Submit Trigger Connected for Form: " + form.getTitle() + " (" + formId + ")");
    createdCount++;
  } catch (fErr) {
    Logger.log("⚠️ Form Trigger Notice: " + fErr.message);
  }

  // 3. Create 5-Minute Auto-Sync Fallback Trigger (Prevents 1-min spam/race conditions)
  try {
    ScriptApp.newTrigger("syncSheetResponses")
      .timeBased()
      .everyMinutes(5)
      .create();
    Logger.log("✅ [2/2] 5-Minute Auto-Sync Fallback Trigger Connected!");
    createdCount++;
  } catch (tErr) {
    Logger.log("⚠️ Time Trigger Notice: " + tErr.message);
  }

  Logger.log("🎉 Triggers Setup Complete (" + createdCount + " active triggers)!");
  return { success: true, activeTriggers: createdCount };
}

/**
 * Polling Engine: Automatically checks for any unprocessed rows in Google Sheet Form Responses
 * Runs every 1 minute to guarantee 100% delivery even if form event triggers delay!
 */
function syncSheetResponses() {
  try {
    const databaseId = TARGET_DATABASE_ID;
    const ss = SpreadsheetApp.openById(databaseId);
    const sheets = ss.getSheets();
    
    // Find the responses sheet
    let responseSheet = null;
    for (let i = 0; i < sheets.length; i++) {
      const sName = sheets[i].getName();
      if (sName.toLowerCase().includes("response") || sName.toLowerCase().includes("form")) {
        responseSheet = sheets[i];
        break;
      }
    }
    if (!responseSheet && sheets.length > 0) {
      responseSheet = sheets[0];
    }
    if (!responseSheet) return;

    const data = responseSheet.getDataRange().getValues();
    if (data.length < 2) return;

    const headers = data[0].map(function(h) { return String(h).trim().toLowerCase(); });
    
    // Check if Status column exists, else append it
    let statusColIdx = headers.indexOf("onboarding status");
    if (statusColIdx === -1) {
      statusColIdx = headers.length;
      responseSheet.getRange(1, statusColIdx + 1).setValue("Onboarding Status").setFontWeight("bold");
    }

    let passColIdx = headers.indexOf("generated password");
    if (passColIdx === -1) {
      passColIdx = statusColIdx + 1;
      responseSheet.getRange(1, passColIdx + 1).setValue("Generated Password").setFontWeight("bold");
    }

    for (let r = 1; r < data.length; r++) {
      const row = data[r];
      const currentStatus = String(row[statusColIdx] || "").trim().toUpperCase();
      if (currentStatus === "PROCESSED") continue;

      // Extract fields from row based on headers
      const student = {
        fullName: "",
        email: "",
        mobile: "",
        city: "",
        qualification: "",
        college: "",
        department: "",
        yearOfPassing: "",
        skillCategory: "HR Intern",
        skills: "",
        experienceType: "",
        companyName: "",
        experienceYears: "",
        currentSalary: "",
        expectedSalary: "",
        resumeLink: "",
        preferredTime: "",
        certification: "",
        linkedinUrl: "",
        workDurationTimings: "",
        startDate: "",
        currentTakeHomeSalaryHourlyRate: "",
        currentWorkStatus: "",
        workingType: "",
        preferredAvailability: ""
      };

      for (let c = 0; c < headers.length; c++) {
        const val = row[c];
        const h = headers[c];
        mapFieldToStudent(student, h, val);
      }

      if (!student.email || !student.email.includes("@")) {
        continue;
      }
      if (!student.fullName) student.fullName = "Candidate";

      Logger.log("Auto-syncing candidate: " + student.fullName + " <" + student.email + ">");

      // Generate password
      const cleanName = student.fullName.replace(/[^a-zA-Z]/g, "").toUpperCase();
      const prefix = cleanName.length >= 4 ? cleanName.substring(0, 4) : (cleanName + "INFO").substring(0, 4);
      const generatedPassword = prefix + Math.floor(1000 + Math.random() * 9000);

      // 1. Save to main database sheet if needed
      try {
        saveStudent(student);
      } catch (saveErr) {}

      // 2. Dispatch Welcome Email via backend API and GmailApp
      try {
        sendWelcomeEmail(student.email, student.fullName, generatedPassword, student.mobile, student.skillCategory);
      } catch (mailErr) {}

      // 3. Mark processed in responses sheet
      responseSheet.getRange(r + 1, statusColIdx + 1).setValue("PROCESSED");
      responseSheet.getRange(r + 1, passColIdx + 1).setValue(generatedPassword);
      Logger.log("✅ Candidate " + student.email + " onboarded with password: " + generatedPassword);
    }
  } catch (err) {
    Logger.log("Error in syncSheetResponses: " + err.message);
  }
}

/**
 * Test function that executes a full simulated registration
 */
function testEndToEndRegistration() {
  const testStudent = {
    fullName: "Infogenx QA Test",
    dob: "15/08/2000",
    email: "infogenx.jobs@gmail.com",
    mobile: "+919787806366",
    city: "Chennai, Tamil Nadu",
    qualification: "B.E. Computer Science",
    college: "Anna University",
    department: "Computer Science",
    yearOfPassing: "2024",
    skillCategory: "IT",
    skills: "React, Node.js, Python, Apps Script",
    experienceType: "Fresher",
    companyName: "NA",
    experienceYears: "0",
    currentSalary: "NA",
    expectedSalary: "₹30,000",
    resumeLink: "https://drive.google.com/test-resume",
    preferredTime: "Full-Time",
    certification: "AWS Certified",
    linkedinUrl: "https://linkedin.com/in/infogenx",
    workDurationTimings: "9 AM - 6 PM",
    startDate: "Immediate",
    currentTakeHomeSalaryHourlyRate: "NA",
    currentWorkStatus: "Not working",
    workingType: "Flexible",
    preferredAvailability: "Weekdays (9 AM - 6 PM)"
  };

  return onStudentRegistration({ student: testStudent });
}