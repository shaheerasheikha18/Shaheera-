// ---------- Data ----------
const events = [
  { id: 1, title: "Tech Symposium 2026", category: "Technical", date: "2026-11-05", venue: "Main Auditorium", capacity: 100,
    description: "Paper presentations, project expo and talks from industry experts." },
  { id: 2, title: "Cultural Fest - Kalaivizha", category: "Cultural", date: "2026-11-12", venue: "Open Air Theatre", capacity: 200,
    description: "Dance, music, drama and fine arts competitions across departments." },
  { id: 3, title: "Inter-College Cricket Tournament", category: "Sports", date: "2026-11-18", venue: "College Ground", capacity: 5,
    description: "Knockout cricket tournament. Teams from nearby colleges participate." },
  { id: 4, title: "Web Development Workshop", category: "Workshop", date: "2026-11-22", venue: "Computer Lab 2", capacity: 30,
    description: "Hands-on workshop on HTML, CSS and JavaScript for beginners." },
  { id: 5, title: "Career Guidance Seminar", category: "Seminar", date: "2026-12-02", venue: "Seminar Hall", capacity: 80,
    description: "Placement tips, resume building and interview preparation." },
  { id: 6, title: "Hackathon 24hrs", category: "Technical", date: "2026-12-10", venue: "Innovation Centre", capacity: 3,
    description: "24-hour coding challenge. Build a solution to real-world problems." }
];

const STORAGE_KEY = "collegeEventRegistrations";
let registrations = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

// ---------- Helpers ----------
const $ = (id) => document.getElementById(id);
const saveRegs = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(registrations));
const countFor = (eventId) => registrations.filter(r => r.eventId === eventId).length;
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmtDate = (d) => new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

function toast(msg, type = "success") {
  const t = $("toast");
  t.textContent = msg;
  t.className = "toast " + type;
  setTimeout(() => t.classList.add("hidden"), 2500);
}

// ---------- Events listing ----------
function loadCategories() {
  const cats = [...new Set(events.map(e => e.category))];
  cats.forEach(c => {
    const o = document.createElement("option");
    o.value = c; o.textContent = c;
    $("categoryFilter").appendChild(o);
  });
}

function renderEvents() {
  const q = $("searchInput").value.trim().toLowerCase();
  const cat = $("categoryFilter").value;
  const date = $("dateFilter").value;

  const list = events.filter(e =>
    e.title.toLowerCase().includes(q) &&
    (!cat || e.category === cat) &&
    (!date || e.date === date)
  );

  $("eventsGrid").innerHTML = list.map(e => {
    const count = countFor(e.id);
    const full = count >= e.capacity;
    return `
      <div class="card">
        <span class="badge">${esc(e.category)}</span>
        <h3>${esc(e.title)}</h3>
        <div class="meta">📅 ${fmtDate(e.date)} &nbsp; 📍 ${esc(e.venue)}</div>
        <div class="desc">${esc(e.description)}</div>
        <div class="meta">👥 Registered: <b>${count}</b> / ${e.capacity}
          ${full ? '<span class="badge full">FULL</span>' : ""}</div>
        <button class="btn primary" onclick="openEvent(${e.id})">View Details</button>
      </div>`;
  }).join("");

  $("noEvents").classList.toggle("hidden", list.length > 0);
}

// ---------- Modal: details + registration form ----------
function openEvent(id) {
  const e = events.find(x => x.id === id);
  const count = countFor(id);
  const full = count >= e.capacity;

  $("modalBody").innerHTML = `
    <h2>${esc(e.title)}</h2>
    <span class="badge">${esc(e.category)}</span>
    <p>📅 <b>Date:</b> ${fmtDate(e.date)}</p>
    <p>📍 <b>Venue:</b> ${esc(e.venue)}</p>
    <p>📝 ${esc(e.description)}</p>
    <p>👥 <b>Registrations:</b> ${count} / ${e.capacity}
      ${full ? '<span class="badge full">EVENT FULL</span>' : ""}</p>

    <form id="regForm" novalidate>
      <div>
        <label>Full Name *</label>
        <input type="text" id="fName" placeholder="Your name" />
        <div class="error" id="eName"></div>
      </div>
      <div>
        <label>Email *</label>
        <input type="email" id="fEmail" placeholder="you@college.edu" />
        <div class="error" id="eEmail"></div>
      </div>
      <div>
        <label>Department *</label>
        <input type="text" id="fDept" placeholder="e.g. Computer Science" />
        <div class="error" id="eDept"></div>
      </div>
      <div>
        <label>Phone *</label>
        <input type="tel" id="fPhone" placeholder="10-digit number" />
        <div class="error" id="ePhone"></div>
      </div>
      <button type="submit" class="btn primary" ${full ? "disabled" : ""}>
        ${full ? "Registration Closed" : "Register"}
      </button>
    </form>`;

  $("modal").classList.remove("hidden");
  $("regForm").addEventListener("submit", (ev) => {
    ev.preventDefault();
    register(id);
  });
}

function setError(inputId, errId, msg) {
  $(errId).textContent = msg;
  $(inputId).classList.toggle("invalid", !!msg);
  return !msg;
}

function register(eventId) {
  const name = $("fName").value.trim();
  const email = $("fEmail").value.trim().toLowerCase();
  const dept = $("fDept").value.trim();
  const phone = $("fPhone").value.trim();

  let ok = true;
  ok = setError("fName", "eName", name ? "" : "Name is required") && ok;
  ok = setError("fEmail", "eEmail", !email ? "Email is required" : (!isEmail(email) ? "Enter a valid email" : "")) && ok;
  ok = setError("fDept", "eDept", dept ? "" : "Department is required") && ok;
  ok = setError("fPhone", "ePhone", !phone ? "Phone is required" : (!/^\d{10}$/.test(phone) ? "Enter a 10-digit number" : "")) && ok;
  if (!ok) return;

  const ev = events.find(x => x.id === eventId);

  // Capacity validation
  if (countFor(eventId) >= ev.capacity) {
    toast("Sorry, this event is full!", "error");
    return;
  }
  // Duplicate registration prevention
  if (registrations.some(r => r.eventId === eventId && r.email === email)) {
    toast("You have already registered for this event!", "error");
    return;
  }

  registrations.push({ eventId, name, email, dept, phone, registeredOn: new Date().toISOString() });
  saveRegs();
  $("myEmail").value = email;
  closeModal();
  renderEvents();
  toast("Registered successfully for " + ev.title);
}

function closeModal() { $("modal").classList.add("hidden"); }

// ---------- My registrations ----------
function renderMine() {
  const email = $("myEmail").value.trim().toLowerCase();
  if (!isEmail(email)) {
    $("myGrid").innerHTML = "";
    $("noMine").textContent = "Enter a valid email to view your registrations.";
    $("noMine").classList.remove("hidden");
    return;
  }
  const mine = registrations.filter(r => r.email === email);
  $("myGrid").innerHTML = mine.map(r => {
    const e = events.find(x => x.id === r.eventId);
    return `
      <div class="card">
        <span class="badge">${esc(e.category)}</span>
        <h3>${esc(e.title)}</h3>
        <div class="meta">📅 ${fmtDate(e.date)} &nbsp; 📍 ${esc(e.venue)}</div>
        <div class="meta">👤 ${esc(r.name)} (${esc(r.dept)})</div>
        <div class="meta">👥 Total registrations: ${countFor(e.id)} / ${e.capacity}</div>
        <button class="btn danger" onclick="cancelReg(${r.eventId}, '${esc(r.email)}')">Cancel Registration</button>
      </div>`;
  }).join("");

  $("noMine").textContent = "No registrations found for this email.";
  $("noMine").classList.toggle("hidden", mine.length > 0);
}

function cancelReg(eventId, email) {
  const ev = events.find(x => x.id === eventId);
  if (!confirm("Cancel your registration for " + ev.title + "?")) return;
  registrations = registrations.filter(r => !(r.eventId === eventId && r.email === email));
  saveRegs();
  renderMine();
  renderEvents();
  toast("Registration cancelled", "success");
}

// ---------- Tabs & listeners ----------
function showTab(tab) {
  const eventsTab = tab === "events";
  $("eventsSection").classList.toggle("hidden", !eventsTab);
  $("mineSection").classList.toggle("hidden", eventsTab);
  $("tabEvents").classList.toggle("active", eventsTab);
  $("tabMine").classList.toggle("active", !eventsTab);
  if (eventsTab) renderEvents(); else renderMine();
}

$("tabEvents").onclick = () => showTab("events");
$("tabMine").onclick = () => showTab("mine");
$("searchInput").addEventListener("input", renderEvents);
$("categoryFilter").addEventListener("change", renderEvents);
$("dateFilter").addEventListener("change", renderEvents);
$("clearFilters").onclick = () => {
  $("searchInput").value = ""; $("categoryFilter").value = ""; $("dateFilter").value = "";
  renderEvents();
};
$("showMine").onclick = renderMine;
$("closeModal").onclick = closeModal;
$("modal").addEventListener("click", (e) => { if (e.target.id === "modal") closeModal(); });

loadCategories();
renderEvents();
