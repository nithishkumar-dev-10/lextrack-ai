const API = "http://localhost:8000"; // change to Render URL after deployment

// ── Tab switching ──────────────────────────────────────────────
document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("tab-" + btn.dataset.tab).classList.add("active");
    if (btn.dataset.tab === "cases")    loadCases();
    if (btn.dataset.tab === "hearings") loadHearings();
  });
});

// ── Chat ──────────────────────────────────────────────────────
function handleKey(e) {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendQuery(); }
}

async function sendQuery() {
  const input = document.getElementById("queryInput");
  const query = input.value.trim();
  if (!query) return;

  addMessage(query, "user");
  input.value = "";
  document.getElementById("sendBtn").disabled = true;
  addMessage("Thinking...", "bot", null, null, null, "thinking-msg");

  try {
    const res  = await fetch(`${API}/chat/query`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ query })
    });
    const data = await res.json();
    document.querySelector(".thinking-msg")?.remove();
    addMessage(data.response, "bot", data.agent_used, data.confidence, data.warning);
  } catch (err) {
    document.querySelector(".thinking-msg")?.remove();
    addMessage("Error: Could not reach the backend. Is it running?", "bot");
  }

  document.getElementById("sendBtn").disabled = false;
}

function addMessage(text, role, agent, confidence, warning, extraClass = "") {
  const box = document.getElementById("chatMessages");
  const div = document.createElement("div");
  div.className = `message ${role} ${extraClass}`;

  let html = `<div class="message-bubble">${text}`;

  if (agent && confidence !== undefined) {
    const cls = confidence >= 75 ? "green" : confidence >= 50 ? "yellow" : "red";
    html += `<br/><span class="meta-tag ${cls}">
               Agent: ${agent} | Confidence: ${confidence}%</span>`;
  }
  if (warning) {
    html += `<div class="warning-box">⚠️ ${warning}</div>`;
  }
  html += `</div>`;
  div.innerHTML = html;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

// ── Cases ──────────────────────────────────────────────────────
async function createCase() {
  const title       = document.getElementById("caseTitle").value.trim();
  const description = document.getElementById("caseDesc").value.trim();
  if (!title) return alert("Enter a case title");

  await fetch(`${API}/cases/`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ title, description })
  });
  document.getElementById("caseTitle").value = "";
  document.getElementById("caseDesc").value  = "";
  loadCases();
}

async function loadCases() {
  const res   = await fetch(`${API}/cases/`);
  const cases = await res.json();
  const el    = document.getElementById("casesList");
  el.innerHTML = cases.map(c => `
    <div class="list-item">
      <h3>#${c.id} — ${c.title}</h3>
      <p>${c.description || "No description"} | Status: ${c.status}</p>
    </div>`).join("") || "<p style='color:#8b949e;padding:12px'>No cases yet.</p>";
}

// ── Hearings ───────────────────────────────────────────────────
async function createHearing() {
  const body = {
    case_id:      parseInt(document.getElementById("hCaseId").value),
    title:        document.getElementById("hTitle").value.trim(),
    hearing_date: document.getElementById("hDate").value.trim(),
    court:        document.getElementById("hCourt").value.trim(),
    notes:        document.getElementById("hNotes").value.trim(),
  };
  if (!body.title || !body.hearing_date) return alert("Fill title and date");

  await fetch(`${API}/hearings/`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body)
  });
  loadHearings();
}

async function loadHearings() {
  const res      = await fetch(`${API}/hearings/`);
  const hearings = await res.json();
  const el       = document.getElementById("hearingsList");
  el.innerHTML = hearings.map(h => `
    <div class="list-item">
      <h3>${h.title} — ${h.hearing_date}</h3>
      <p>Court: ${h.court || "TBD"} | Case ID: ${h.case_id}</p>
    </div>`).join("") || "<p style='color:#8b949e;padding:12px'>No hearings scheduled.</p>";
}

// ── Documents ──────────────────────────────────────────────────
async function uploadDocument() {
  const file = document.getElementById("docFile").files[0];
  if (!file) return alert("Select a file first");

  const form = new FormData();
  form.append("file", file);

  const resultEl       = document.getElementById("docResult");
  resultEl.style.display = "block";
  resultEl.textContent   = "Analyzing document...";

  const res  = await fetch(`${API}/documents/analyze`, { method: "POST", body: form });
  const data = await res.json();

  resultEl.textContent =
    `File: ${data.filename}\nConfidence: ${data.confidence}%\n\n${data.analysis}` +
    (data.warning ? `\n\n⚠️ Warning: ${data.warning}` : "");
}