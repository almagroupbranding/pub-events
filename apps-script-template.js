/*
  Google Apps Script template for The Alma Pub events.

  What it does:
  - GET request returns booked/pending dates as JSON.
  - POST request receives event enquiry.
  - Sends an owner email.
  - Optionally creates a pending calendar hold.

  Setup:
  1) Go to script.google.com
  2) Create a new project.
  3) Paste this code.
  4) Set OWNER_EMAIL and CALENDAR_ID.
  5) Deploy → New deployment → Web app.
  6) Execute as: Me.
  7) Who has access: Anyone.
  8) Copy the Web App URL into script.js:
     availabilityApiUrl: "YOUR_WEB_APP_URL",
     formEndpoint: "YOUR_WEB_APP_URL"

  Important:
  The first time you run it, Google will ask you to authorise email/calendar access.
*/

const OWNER_EMAIL = "events@thealmapub.co.uk";
const CALENDAR_ID = "primary"; // Or paste the venue hire Google Calendar ID here.
const HOLD_PENDING_EVENTS = true;

function doGet() {
  const calendar = CalendarApp.getCalendarById(CALENDAR_ID);
  const now = new Date();
  const future = new Date();
  future.setMonth(future.getMonth() + 18);

  const events = calendar.getEvents(now, future);
  const booked = [];
  const pending = [];

  events.forEach(event => {
    const date = Utilities.formatDate(event.getStartTime(), Session.getScriptTimeZone(), "yyyy-MM-dd");
    const title = event.getTitle().toLowerCase();

    if (title.includes("pending") || title.includes("hold")) {
      pending.push(date);
    } else {
      booked.push(date);
    }
  });

  return jsonResponse({
    booked: [...new Set(booked)],
    pending: [...new Set(pending)]
  });
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents || "{}");

  const required = ["selected_date", "event_type", "event_name", "guest_count", "first_name", "last_name", "email", "phone"];
  const missing = required.filter(key => !data[key]);

  if (missing.length) {
    return jsonResponse({ ok: false, error: "Missing required fields: " + missing.join(", ") }, 400);
  }

  const ownerSubject = "New Alma event enquiry — owner approval required";
  const ownerBody = Object.keys(data)
    .sort()
    .map(key => `${key}: ${data[key]}`)
    .join("\n");

  MailApp.sendEmail({
    to: OWNER_EMAIL,
    replyTo: data.email,
    subject: ownerSubject,
    body: ownerBody
  });

  if (HOLD_PENDING_EVENTS) {
    const calendar = CalendarApp.getCalendarById(CALENDAR_ID);
    const start = new Date(data.selected_date + "T12:00:00");
    const end = new Date(data.selected_date + "T13:00:00");

    calendar.createEvent(
      "PENDING HOLD — " + data.event_name,
      start,
      end,
      {
        description: ownerBody,
        guests: OWNER_EMAIL
      }
    );
  }

  return jsonResponse({ ok: true });
}

function jsonResponse(obj, status) {
  const output = ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);

  // Apps Script does not let ContentService set every CORS header directly.
  // If you hit browser CORS issues, use Formspree for form delivery and a manual availability JSON,
  // or deploy through a small Cloudflare Worker / Netlify Function.
  return output;
}
