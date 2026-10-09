const HOTEL_NAME = "The Outspan Hotel";
const MANAGEMENT_EMAIL = "management@yourhotel.com"; // Replace with the real address.

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
    const ratings = {};

    ratingFields.forEach(function (field) {
      const raw = field[1];
      const rating = Number(raw);
      if (raw === undefined || raw === null || String(raw).trim() === "" ||
          !Number.isInteger(rating) || rating < 1 || rating > 5) {
        throw new Error(field[0] + " must be between 1 and 5.");
      }
      ratings[field[0]] = rating;
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
    const ratingLines = ratingFields.map(function (field) {
      return field[0] + ": " + ratings[field[0]] + " / 5";
    });

    const plainBody = [
      "New Guest Feedback", HOTEL_NAME, "",
      "Date: " + submittedAt.toLocaleString(), "",
      "GUEST CONTACT DETAILS",
      "Name: " + guestName,
      "Phone: " + (phone || "Not provided"),
      "Email: " + (email || "Not provided"), "",
      "GUEST RATINGS", ratingLines.join("\n"), "",
      "FOLLOW-UP",
      "Requested: " + followUp,
      "Preferred contact method: " + (followUp === "Yes" ? contactMethod : "Not required"), "",
      "AREA OF SERVICE", department || "Not specified", "",
      "COMMENTS", comments || "No comments provided"
    ].join("\n");

    const htmlBody = [
      "<h2>New Guest Feedback</h2>",
      "<p><strong>" + escapeHtml(HOTEL_NAME) + "</strong></p>",
      "<p><strong>Date:</strong> " + escapeHtml(submittedAt.toLocaleString()) + "</p>",
      "<h3>Guest Contact Details</h3>",
      "<p><strong>Name:</strong> " + escapeHtml(guestName) + "<br>",
      "<strong>Phone:</strong> " + escapeHtml(phone || "Not provided") + "<br>",
      "<strong>Email:</strong> " + escapeHtml(email || "Not provided") + "</p>",
      "<h3>Guest Ratings</h3>",
      "<ul>" + ratingFields.map(function (field) {
        return "<li><strong>" + escapeHtml(field[0]) + "</strong>: " + ratings[field[0]] + " / 5</li>";
      }).join("") + "</ul>",
      "<h3>Follow-up</h3>",
      "<p><strong>Requested:</strong> " + escapeHtml(followUp) + "<br>",
      "<strong>Preferred method:</strong> " + escapeHtml(followUp === "Yes" ? contactMethod : "Not required") + "</p>",
      "<h3>Area of Service</h3><p>" + escapeHtml(department || "Not specified") + "</p>",
      "<h3>Comments</h3><p>" + escapeHtml(comments || "No comments provided").replace(/\n/g, "<br>") + "</p>"
    ].join("");

    MailApp.sendEmail({
      to: MANAGEMENT_EMAIL,
      subject: "Guest Feedback - " + guestName + " - " + HOTEL_NAME,
      body: plainBody,
      htmlBody: htmlBody,
      name: HOTEL_NAME + " Feedback Form"
    });

    return jsonResponse({ success: true, message: "Feedback emailed successfully." });
  } catch (error) {
    console.error(error);
    return jsonResponse({ success: false, message: error.message || "An unexpected error occurred." });
  }
}

function cleanText(value) {
  if (value === undefined || value === null) return "";
  return String(value).trim().slice(0, 5000);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function jsonResponse(result) {
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
