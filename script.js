/*
  The Alma Pub event enquiry page
  Static GitHub Pages version.

  Basic setup:
  1) Edit data/availability.json to mark booked or pending dates.
  2) For form delivery, set CONFIG.formEndpoint to a Formspree endpoint or Google Apps Script web app URL.
  3) For live calendar availability, set CONFIG.availabilityApiUrl to a JSON endpoint that returns:
     { "booked": ["2026-07-04"], "pending": ["2026-07-11"] }
*/

const CONFIG = {
  formEndpoint: "", // Example: "https://formspree.io/f/xxxxxxx" or Google Apps Script Web App URL
  availabilityApiUrl: "", // Optional live calendar endpoint. Leave blank to use data/availability.json
  localAvailabilityUrl: "data/availability.json",
  maxMonthsAhead: 18,
  blockedEventTypes: ["18th birthday", "Children party"],
  blockedAgeRanges: ["Includes children", "Mostly under 21"],
  blockedTone: ["Loud party atmosphere"]
};

const state = {
  current: startOfMonth(new Date()),
  selectedDate: "",
  booked: new Set(),
  pending: new Set()
};

const els = {
  title: document.getElementById("calendarTitle"),
  days: document.getElementById("calendarDays"),
  prev: document.getElementById("prevMonth"),
  next: document.getElementById("nextMonth"),
  selectedText: document.getElementById("selectedDateText"),
  selectedInput: document.getElementById("selectedDateInput"),
  form: document.getElementById("eventForm"),
  warning: document.getElementById("formWarning"),
  success: document.getElementById("formSuccess"),
  eventType: document.getElementById("eventType"),
  ageRange: document.getElementById("ageRange"),
  eventTone: document.getElementById("eventTone")
};

function startOfMonth(date){
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function pad(n){
  return String(n).padStart(2, "0");
}

function toIsoDate(date){
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`;
}

function prettyDate(iso){
  if(!iso) return "No date selected yet.";
  const [y,m,d] = iso.split("-").map(Number);
  return new Date(y, m-1, d).toLocaleDateString("en-GB", {
    weekday:"long", day:"numeric", month:"long", year:"numeric"
  });
}

function monthName(date){
  return date.toLocaleDateString("en-GB", { month:"long", year:"numeric" });
}

async function loadAvailability(){
  const url = CONFIG.availabilityApiUrl || CONFIG.localAvailabilityUrl;

  try{
    const res = await fetch(url, { cache:"no-store" });
    if(!res.ok) throw new Error(`Availability request failed: ${res.status}`);
    const data = await res.json();

    state.booked = new Set(data.booked || []);
    state.pending = new Set(data.pending || []);
  }catch(error){
    console.warn(error);
    state.booked = new Set();
    state.pending = new Set();
  }

  renderCalendar();
}

function renderCalendar(){
  els.title.textContent = monthName(state.current);
  els.days.innerHTML = "";

  const year = state.current.getFullYear();
  const month = state.current.getMonth();
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Monday-based offset
  const firstWeekday = (first.getDay() + 6) % 7;
  const todayIso = toIsoDate(new Date());

  for(let i = 0; i < firstWeekday; i++){
    const blank = document.createElement("button");
    blank.type = "button";
    blank.className = "day other-month";
    blank.disabled = true;
    blank.setAttribute("aria-hidden", "true");
    els.days.appendChild(blank);
  }

  for(let day = 1; day <= daysInMonth; day++){
    const date = new Date(year, month, day);
    const iso = toIsoDate(date);
    const button = document.createElement("button");
    button.type = "button";

    let status = "Available";
    let className = "day";

    const isPast = iso < todayIso;
    const isBooked = state.booked.has(iso);
    const isPending = state.pending.has(iso);

    if(isPast){
      status = "Past";
      className += " past";
      button.disabled = true;
    } else if(isBooked){
      status = "Booked";
      className += " booked";
      button.disabled = true;
    } else if(isPending){
      status = "Pending";
      className += " pending";
    }

    if(state.selectedDate === iso){
      className += " selected";
    }

    button.className = className;
    button.innerHTML = `<span class="num">${day}</span><span class="status">${status}</span>`;
    button.setAttribute("aria-label", `${prettyDate(iso)} - ${status}`);

    if(!button.disabled){
      button.addEventListener("click", () => selectDate(iso));
    }

    els.days.appendChild(button);
  }

  updateMonthButtons();
}

function updateMonthButtons(){
  const thisMonth = startOfMonth(new Date());
  const max = new Date(thisMonth.getFullYear(), thisMonth.getMonth() + CONFIG.maxMonthsAhead, 1);
  els.prev.disabled = state.current <= thisMonth;
  els.next.disabled = state.current >= max;
}

function selectDate(iso){
  state.selectedDate = iso;
  els.selectedText.textContent = prettyDate(iso);
  els.selectedInput.value = iso;
  renderCalendar();
  document.getElementById("enquiry").scrollIntoView({ behavior:"smooth", block:"start" });
}

function showWarning(message){
  els.warning.textContent = message;
  els.warning.hidden = false;
  els.success.hidden = true;
}

function showSuccess(message){
  els.success.textContent = message;
  els.success.hidden = false;
  els.warning.hidden = true;
}

function clearMessages(){
  els.warning.hidden = true;
  els.success.hidden = true;
}

function enquiryIsUnsuitable(){
  const eventType = els.eventType.value;
  const ageRange = els.ageRange.value;
  const eventTone = els.eventTone.value;

  if(CONFIG.blockedEventTypes.includes(eventType)){
    return "Thank you for thinking of The Alma. This type of event is not normally suitable for the function room, so the team are unlikely to accept the enquiry.";
  }

  if(CONFIG.blockedAgeRanges.includes(ageRange)){
    return "Thank you for your enquiry. The Alma’s private-hire space is mainly suited to adult-led events, so this enquiry is unlikely to be accepted.";
  }

  if(CONFIG.blockedTone.includes(eventTone)){
    return "Thank you for your enquiry. The Alma is best suited to warm, well-managed gatherings rather than loud party-style events, so this enquiry may not be suitable.";
  }

  return "";
}

[els.eventType, els.ageRange, els.eventTone].forEach(el => {
  el.addEventListener("change", () => {
    clearMessages();
    const message = enquiryIsUnsuitable();
    if(message) showWarning(message);
  });
});

els.prev.addEventListener("click", () => {
  state.current = new Date(state.current.getFullYear(), state.current.getMonth() - 1, 1);
  renderCalendar();
});

els.next.addEventListener("click", () => {
  state.current = new Date(state.current.getFullYear(), state.current.getMonth() + 1, 1);
  renderCalendar();
});

els.form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessages();

  if(!state.selectedDate){
    showWarning("Please choose an available date before sending the enquiry.");
    document.getElementById("availability").scrollIntoView({ behavior:"smooth", block:"start" });
    return;
  }

  if(state.booked.has(state.selectedDate)){
    showWarning("That date is already booked. Please choose another available date.");
    return;
  }

  const unsuitableMessage = enquiryIsUnsuitable();
  if(unsuitableMessage){
    showWarning(`${unsuitableMessage} If you believe your event is an exception, please phone the pub directly rather than submitting the form.`);
    return;
  }

  if(!els.form.reportValidity()) return;

  const formData = new FormData(els.form);
  const payload = Object.fromEntries(formData.entries());
  payload.submitted_at = new Date().toISOString();

  if(!CONFIG.formEndpoint){
    const subject = encodeURIComponent(`Event enquiry: ${payload.event_name || "The Alma"} - ${payload.selected_date}`);
    const body = encodeURIComponent(Object.entries(payload).map(([key, value]) => `${key}: ${value}`).join("\n"));
    window.location.href = `mailto:events@thealmapub.co.uk?subject=${subject}&body=${body}`;
    showSuccess("Your email app should open with the enquiry details. To send directly from the form, add a form endpoint in script.js.");
    return;
  }

  try{
    const res = await fetch(CONFIG.formEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload)
    });

    if(!res.ok) throw new Error(`Form endpoint returned ${res.status}`);

    showSuccess("Thank you. Your enquiry has been sent for owner approval. The Alma will confirm whether the date can be held.");
    els.form.reset();
    state.pending.add(state.selectedDate);
    state.selectedDate = "";
    els.selectedDateText.textContent = "No date selected yet.";
    els.selectedInput.value = "";
    renderCalendar();
  }catch(error){
    console.error(error);
    showWarning("Sorry, the form could not send just now. Please phone the pub or try again later.");
  }
});

loadAvailability();
