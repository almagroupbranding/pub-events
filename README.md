# The Alma Pub — Events Enquiry Microsite

A static GitHub Pages-ready events enquiry page for The Alma Pub.

It is designed to:
- reduce vague email enquiries;
- filter unsuitable events before staff time is wasted;
- show available, booked and pending dates;
- collect the details needed for owner approval;
- make the function room feel more premium, organised and trusted.

## Folder structure

```text
alma-events-booking/
├── index.html
├── style.css
├── script.js
├── data/
│   └── availability.json
├── apps-script-template.js
└── README.md
```

## Quick GitHub Pages deployment

1. Create a new GitHub repository, for example `alma-events-booking`.
2. Upload all files from this folder.
3. Go to **Settings → Pages**.
4. Under **Build and deployment**, choose:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/root`
5. Save.
6. GitHub will give you a live URL.

You can then link to this page from the current Alma website using a button like:
`Function Room Enquiries`

## Basic availability setup

For the simplest version, edit:

```text
data/availability.json
```

Add dates in this format:

```json
{
  "booked": ["2026-07-04"],
  "pending": ["2026-07-11"]
}
```

This is quick, but manual.

## Form sending options

Because GitHub Pages is static, it cannot securely send emails or create private calendar bookings by itself.

Use one of these:

### Option A — Formspree

1. Create a Formspree form.
2. Copy the endpoint.
3. In `script.js`, set:

```js
formEndpoint: "https://formspree.io/f/YOURCODE"
```

This sends enquiries by email.

### Option B — Google Apps Script

Use `apps-script-template.js`.

This can:
- receive the form;
- send an email to the owner;
- optionally add a pending hold to Google Calendar;
- return booked/pending dates to the website.

This is the better route if you want real calendar integration.

## Event filtering

In `script.js`, edit:

```js
blockedEventTypes: ["18th birthday", "Children party"],
blockedAgeRanges: ["Includes children", "Mostly under 21"],
blockedTone: ["Loud party atmosphere"]
```

The wording is deliberately polite rather than aggressive. It protects the pub while keeping the brand warm and professional.

## Recommended transition plan

Start by linking this page from the current website as a separate "Function Room Enquiry" button.

Once it proves useful, move more of the website into this GitHub Pages structure:
- home page;
- food and drink;
- events;
- function room;
- contact;
- gallery;
- local SEO pages.
