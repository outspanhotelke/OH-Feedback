/**
 * The Outspan Hotel Guest Feedback backend.
 * Deploy this project as a Google Apps Script Web App.
 * Run setupSpreadsheet() once before publishing the form.
 */
const HOTEL_NAME = "The Outspan Hotel";
const SHEET_TAB_NAME = "Guest Feedback";
// Optional: enter a real management email to also receive feedback by email.
// Leave blank to save feedback only to Google Sheets.
const MANAGEMENT_EMAIL = "";

const HEADERS = [
  "Timestamp",
  "Guest Name",
  "Phone Number",
  "Email Address",
  "Overall Rating",
  "Staff Attitude",
  "Cleanliness",
  "Food Quality",
  "Room Service",
  "Follow-up Requested",
  "Preferred Contact Method",
  "Area of Service",
  "Comments"
];

/** Run manually once. Creates the response spreadsheet if needed and logs its URL. */
function setupSpreadsheet() {
  const spreadsheet = getOrCreateSpreadsheet_();
  const sheet = getOrCreateResponseSheet_(spreadsheet);
  Logger.log("Feedback spreadsheet URL: " + spreadsheet.getUrl());
  Logger.log("Response sheet tab: " + sheet.getName());
  return spreadsheet.getUrl();
}

function doGet() {
  return ContentService
    .createTextOutput("The Outspan Hotel feedback service is running.")
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("No feedback data was received.");
    }

    const data = JSON.parse(e.postData.contents);
    const guestName = cleanText(data.guestName);
    const phone = cleanText(data.phone);
    const email = cleanText(data.email);
    const followUp = cleanText(data.followUp);
    const contactMethod = cleanText(data.contactMethod);
    const department = cleanText(data.department);
    const comments = cleanText(data.comments);

    if (!guestName) throw new Error("Guest name is required.");
    if (!["Yes", "No"].includes(followUp)) {
      throw new Error("Please select a valid follow-up option.");
    }

    const ratingFields = [
      ["Overall Rating", data.overallRating],
      ["Staff Attitude", data.staffAttitude],
      ["Cleanliness", data.cleanliness],
      ["Food Quality", data.foodQuality],
      ["Room Service", data.roomService]
    ];
    const ratings = [];

    ratingFields.forEach(function (field) {
      const raw = field[1];
      const rating = Number(raw);
      if (raw === undefined || raw === null || String(raw).trim() === "" ||
          !Number.isInteger(rating) || rating < 1 || rating > 5) {
        throw new Error(field[0] + " must be between 1 and 5.");
      }
      ratings.push(rating);
    });

    if (followUp === "Yes") {
      if (!["Email", "Phone", "Any"].includes(contactMethod)) {
        throw new Error("Please select a contact method.");
      }
      if ((contactMethod === "Phone" || contactMethod === "Any") && !phone) {
        throw new Error("A phone number is required for follow-up.");
      }
      if ((contactMethod === "Email" || contactMethod === "Any") && !isValidEmail(email)) {
        throw new Error("A valid email address is required for follow-up.");
      }
    }

    const submittedAt = new Date();
    const spreadsheet = getOrCreateSpreadsheet_();
    const sheet = getOrCreateResponseSheet_(spreadsheet);

    // Prevent two submissions from writing to the same row simultaneously.
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      sheet.appendRow([
        submittedAt,
        safeSheetText_(guestName),
        safeSheetText_(phone),
        safeSheetText_(email),
        ratings[0],
        ratings[1],
        ratings[2],
        ratings[3],
        ratings[4],
        followUp,
        followUp === "Yes" ? contactMethod : "Not required",
        safeSheetText_(department),
        safeSheetText_(comments)
      ]);
    } finally {
      lock.releaseLock();
    }

    // Email notification is optional. The spreadsheet row is saved first.
    if (MANAGEMENT_EMAIL && isValidEmail(MANAGEMENT_EMAIL)) {
      const body = [
        "New guest feedback - " + HOTEL_NAME,
        "Submitted: " + submittedAt.toLocaleString(),
        "Guest: " + guestName,
        "Phone: " + (phone || "Not provided"),
        "Email: " + (email || "Not provided"),
        "Overall Rating: " + ratings[0] + " / 5",
        "Staff Attitude: " + ratings[1] + " / 5",
        "Cleanliness: " + ratings[2] + " / 5",
        "Food Quality: " + ratings[3] + " / 5",
        "Room Service: " + ratings[4] + " / 5",
        "Follow-up: " + followUp,
        "Preferred contact: " + (followUp === "Yes" ? contactMethod : "Not required"),
        "Area of service: " + (department || "Not specified"),
        "Comments: " + (comments || "No comments provided"),
        "Spreadsheet: " + spreadsheet.getUrl()
      ].join("\n");

      MailApp.sendEmail({
        to: MANAGEMENT_EMAIL,
        subject: "Guest Feedback - " + guestName + " - " + HOTEL_NAME,
        body: body,
        name: HOTEL_NAME + " Feedback Form"
      });
    }

    console.log("Feedback saved to: " + spreadsheet.getUrl());
    return jsonResponse({ success: true, message: "Feedback saved successfully." });
  } catch (error) {
    console.error(error);
    return jsonResponse({ success: false, message: error.message || "An unexpected error occurred." });
  }
}

function getOrCreateSpreadsheet_() {
  const properties = PropertiesService.getScriptProperties();
  let spreadsheetId = properties.getProperty("FEEDBACK_SPREADSHEET_ID");

  if (spreadsheetId) {
    try {
      return SpreadsheetApp.openById(spreadsheetId);
    } catch (error) {
      throw new Error("Cannot open the saved feedback spreadsheet. Run setupSpreadsheet() and check access.");
    }
  }

  const spreadsheet = SpreadsheetApp.create(HOTEL_NAME + " - Guest Feedback Responses");
  properties.setProperty("FEEDBACK_SPREADSHEET_ID", spreadsheet.getId());
  return spreadsheet;
}

function getOrCreateResponseSheet_(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(SHEET_TAB_NAME);
  if (!sheet) {
    sheet = spreadsheet.getSheets()[0];
    sheet.setName(SHEET_TAB_NAME);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
    sheet.getRange("A:A").setNumberFormat("yyyy-mm-dd hh:mm:ss");
    sheet.autoResizeColumns(1, HEADERS.length);
  }
  return sheet;
}

function cleanText(value) {
  if (value === undefined || value === null) return "";
  return String(value).trim().slice(0, 5000);
}

// Prevent submitted text from being interpreted as a spreadsheet formula.
function safeSheetText_(value) {
  const text = String(value == null ? "" : value);
  return /^[=+@\-]/.test(text) ? "'" + text : text;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function jsonResponse(result) {
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
