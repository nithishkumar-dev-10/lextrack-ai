const API = "http://localhost:8000";

// ─────────────────────────────────────────
// STATE
// ─────────────────────────────────────────
let attachedFile = null;
let notifications = [];

// ─────────────────────────────────────────
// TAB SWITCHING
// ─────────────────────────────────────────
document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("tab-" + btn.dataset.tab).classList.add("active");
    if (btn.dataset.tab === "cases") loadCases();
  });
});

// ─────────────────────────────────────────
// CHAT
// ─────────────────────────────────────────
function handleKey(e) {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendQuery(); }
}

function autoResize(el) {
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, 140) + "px";
}

function handleFileAttach(event) {
  const file = event.target.files[0];
  if (!file) return;
  attachedFile = file;
  const container = document.getElementById("attachedFiles");
  container.classList.remove("hidden");
  container.innerHTML = `
    <div class="attached-file">
      📎 ${file.name}
      <button onclick="removeAttachment()">✕</button>
    </div>`;
}

function removeAttachment() {
  attachedFile = null;
  document.getElementById("attachedFiles").classList.add("hidden");
  document.getElementById("attachedFiles").innerHTML = "";
  document.getElementById("chatFileInput").value = "";
}

async function sendQuery() {
  const input = document.getElementById("queryInput");
  const query = input.value.trim();
  if (!query && !attachedFile) return;

  addMessage(query || `Analysing: ${attachedFile?.name}`, "user");
  input.value = "";
  input.style.height = "auto";
  document.getElementById("sendBtn").disabled = true;

  const thinkingId = "thinking-" + Date.now();
  addTypingIndicator(thinkingId);

  try {
    let data;
    if (attachedFile) {
      const form = new FormData();
      form.append("file", attachedFile);
      const res = await fetch(`${API}/documents/analyze`, { method: "POST", body: form });
      data = await res.json();
      removeTypingIndicator(thinkingId);
      addMessage(`📄 ${data.filename}\n\n${data.analysis}${data.warning ? `\n\n⚠️ ${data.warning}` : ""}`,
        "bot", data.agent_used || "document", data.confidence, data.warning);
      removeAttachment();
    } else {
      const res = await fetch(`${API}/chat/query`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query })
      });
      data = await res.json();
      removeTypingIndicator(thinkingId);
      addMessage(data.response, "bot", data.agent_used, data.confidence, data.warning);
    }
  } catch (err) {
    removeTypingIndicator(thinkingId);
    addMessage("⚠️ Could not reach backend. Is it running on port 8000?", "bot");
  }

  document.getElementById("sendBtn").disabled = false;
}

function addMessage(text, role, agent, confidence, warning) {
  const box = document.getElementById("chatMessages");
  const div = document.createElement("div");
  div.className = `message ${role}`;

  const avatar = `<div class="avatar">${role === "bot" ? "⚖️" : "👤"}</div>`;
  let html = `${avatar}<div class="message-bubble">${text}`;
  if (agent && confidence !== undefined) {
    const cls = confidence >= 75 ? "green" : confidence >= 50 ? "yellow" : "red";
    html += `<br/><span class="meta-tag ${cls}">Agent: ${agent} | Confidence: ${confidence}%</span>`;
  }
  if (warning) html += `<div class="warning-box">⚠️ ${warning}</div>`;
  html += `</div>`;
  div.innerHTML = html;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

function addTypingIndicator(id) {
  const box = document.getElementById("chatMessages");
  const div = document.createElement("div");
  div.className = "message bot"; div.id = id;
  div.innerHTML = `<div class="avatar">⚖️</div><div class="message-bubble"><div class="typing-dots"><span></span><span></span><span></span></div></div>`;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

function removeTypingIndicator(id) { document.getElementById(id)?.remove(); }

// ─────────────────────────────────────────
// LOCAL STORAGE HELPERS
// ─────────────────────────────────────────
function getLocalCases() {
  return JSON.parse(localStorage.getItem("lextrack_cases") || "{}");
}
function saveLocalCase(data) {
  const all = getLocalCases();
  all[data.id] = data;
  localStorage.setItem("lextrack_cases", JSON.stringify(all));
}
function getLocalCase(id) {
  return getLocalCases()[id] || null;
}

// ─────────────────────────────────────────
// CASES
// ─────────────────────────────────────────
async function createCase() {
  const title       = document.getElementById("caseTitle").value.trim();
  const description = document.getElementById("caseDesc").value.trim();
  const caseType    = document.getElementById("caseType").value.trim();
  const hearingDate = document.getElementById("caseHearingDate").value;
  const court       = document.getElementById("caseCourt").value.trim();

  if (!title) return alert("Enter a case title");

  const btn = document.querySelector("#tab-cases .primary-btn");
  btn.textContent = "Registering & Analysing...";
  btn.disabled = true;

  try {
    // 1. Register case in backend
    const res = await fetch(`${API}/cases/`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description: `${caseType ? "["+caseType+"] " : ""}${description}` })
    });
    const newCase = await res.json();

    // 2. Schedule hearing if date provided
    let hearingId = null;
    if (hearingDate) {
      try {
        const hRes = await fetch(`${API}/hearings/`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            case_id: newCase.id, title: `Hearing — ${title}`,
            hearing_date: hearingDate, court: court || null, notes: ""
          })
        });
        const hData = await hRes.json();
        hearingId = hData.id;
      } catch(e) { /* hearing endpoint may not exist, store locally */ }
    }

    // 3. Auto-analyse via AI
    const analysisQuery = `Analyse this legal case thoroughly:
Case Title: ${title}
Case Type: ${caseType || "General"}
Facts: ${description || "No additional facts provided"}

Provide:
1. Relevant IPC/BNS sections with brief explanation
2. Required documents checklist
3. Key legal points and strategy
4. Important deadlines to watch
5. Potential risks`;

    const aiRes = await fetch(`${API}/chat/query`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: analysisQuery })
    });
    const aiData = await aiRes.json();

    // 4. Save everything locally
    const localData = {
      id: newCase.id, title, caseType, description, court,
      status: newCase.status || "open",
      hearingDate: hearingDate || null,
      hearingId,
      analysis: aiData.response,
      confidence: aiData.confidence,
      analysedAt: new Date().toISOString()
    };
    saveLocalCase(localData);

    // 5. Show analysis modal
    showAnalysisModal(localData);

    // 6. Notify
    addNotification({
      type: "success",
      title: `✅ Case #${newCase.id} Registered & Analysed`,
      body: `"${title}" — AI analysis complete.${hearingDate ? ` Hearing: ${new Date(hearingDate).toLocaleString()}` : ""}`,
      time: new Date()
    });

    // 7. Schedule 24hr check if hearing date set
    if (hearingDate) scheduleHearingAlert(localData);

    // Clear form
    ["caseTitle","caseDesc","caseType","caseHearingDate","caseCourt"].forEach(id => {
      document.getElementById(id).value = "";
    });

    loadCases();
  } catch(err) {
    alert("Error creating case. Is backend running?");
    console.error(err);
  }

  btn.textContent = "+ Register Case & Auto-Analyse";
  btn.disabled = false;
}

async function loadCases() {
  const el = document.getElementById("casesList");
  try {
    const res   = await fetch(`${API}/cases/`);
    const cases = await res.json();
    const local = getLocalCases();

    if (!cases.length) {
      el.innerHTML = "<p style='color:var(--dim);padding:4px;font-size:13px'>No cases registered yet.</p>";
      return;
    }

    el.innerHTML = cases.map(c => {
      const ld       = local[c.id] || {};
      const hDate    = ld.hearingDate ? new Date(ld.hearingDate) : null;
      const now      = new Date();
      const diffH    = hDate ? (hDate - now) / 36e5 : null;
      const isUrgent = diffH !== null && diffH > 0 && diffH <= 24;
      const isPast   = diffH !== null && diffH <= 0;

      return `
        <div class="case-card ${isUrgent ? 'urgent' : ''}">
          <!-- Top section -->
          <div class="case-card-top">
            <div class="case-info">
              <h3>${isUrgent ? "🚨 " : "📁 "}#${c.id} — ${c.title}</h3>
              <p>${ld.caseType ? `[${ld.caseType}] ` : ""}${c.description || "No description"}</p>
            </div>
            <span class="badge ${isUrgent ? 'urgent' : isPast ? 'done' : 'open'}">
              ${isUrgent ? "< 24hrs" : isPast && hDate ? "Past" : c.status}
            </span>
          </div>

          <!-- Hearing strip -->
          ${hDate ? `
          <div class="hearing-strip ${isUrgent ? 'urgent-strip' : ''}">
            <span class="hearing-strip-info">
              📅 <strong>${hDate.toLocaleString()}</strong>
              ${ld.court ? ` &nbsp;|&nbsp; 🏛 ${ld.court}` : ""}
              ${isUrgent ? " &nbsp;|&nbsp; ⚡ HEARING SOON" : ""}
            </span>
            <button class="action-btn" onclick="showSetHearing(${c.id})">✏️ Change</button>
          </div>` : `
          <div class="hearing-strip">
            <span class="hearing-strip-info" style="color:var(--dim)">No hearing date set</span>
            <button class="action-btn" onclick="showSetHearing(${c.id})">+ Set Hearing Date</button>
          </div>`}

          <!-- Set hearing inline form (hidden by default) -->
          <div class="set-hearing-form hidden" id="hearing-form-${c.id}">
            <input type="datetime-local" id="hdate-${c.id}" style="color-scheme:dark"/>
            <input placeholder="Court name" id="hcourt-${c.id}" style="max-width:160px"/>
            <button onclick="saveHearingDate(${c.id}, '${c.title.replace(/'/g,"\\'")}')">Save</button>
          </div>

          <!-- Actions -->
          <div class="case-actions">
            ${ld.analysis
              ? `<button class="action-btn" onclick="showAnalysisModal(getLocalCase(${c.id}))">📊 View Analysis</button>`
              : `<button class="action-btn" onclick="reAnalyse(${c.id}, '${c.title.replace(/'/g,"\\'")}', '${(c.description||'').replace(/'/g,"\\'")}')">🔄 Analyse</button>`
            }
            ${isUrgent
              ? `<button class="action-btn" style="border-color:var(--red);color:var(--red)" onclick="get24hrBrief(${c.id})">🔔 Get 24hr Brief</button>`
              : ""
            }
          </div>
        </div>`;
    }).join("");
  } catch(e) {
    el.innerHTML = "<p style='color:var(--dim);padding:4px;font-size:13px'>Could not load cases.</p>";
  }
}

function showSetHearing(caseId) {
  const form = document.getElementById(`hearing-form-${caseId}`);
  form.classList.toggle("hidden");
}

async function saveHearingDate(caseId, caseTitle) {
  const dateVal = document.getElementById(`hdate-${caseId}`).value;
  const court   = document.getElementById(`hcourt-${caseId}`).value.trim();
  if (!dateVal) return alert("Pick a date and time");

  // Update local storage
  const ld = getLocalCase(caseId) || { id: caseId, title: caseTitle };
  ld.hearingDate = dateVal;
  ld.court       = court;
  saveLocalCase(ld);

  // Try to create/update hearing in backend
  try {
    await fetch(`${API}/hearings/`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        case_id: caseId, title: `Hearing — ${caseTitle}`,
        hearing_date: dateVal, court: court || null, notes: ""
      })
    });
  } catch(e) { /* backend may not support, local is enough */ }

  // Schedule 24hr alert
  scheduleHearingAlert(ld);

  addNotification({
    type: "success",
    title: `📅 Hearing Set — Case #${caseId}`,
    body: `"${caseTitle}" hearing on ${new Date(dateVal).toLocaleString()}`,
    time: new Date()
  });

  document.getElementById(`hearing-form-${caseId}`).classList.add("hidden");
  loadCases();
}

async function reAnalyse(caseId, title, description) {
  const query = `Analyse this legal case:
Title: ${title}
Facts: ${description || "No facts provided"}
Provide: relevant IPC/BNS sections, required documents, key points.`;

  try {
    const res  = await fetch(`${API}/chat/query`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query })
    });
    const data = await res.json();
    const ld   = getLocalCase(caseId) || { id: caseId, title };
    ld.analysis    = data.response;
    ld.confidence  = data.confidence;
    ld.analysedAt  = new Date().toISOString();
    saveLocalCase(ld);
    showAnalysisModal(ld);
    loadCases();
  } catch(e) { alert("Analysis failed."); }
}

async function get24hrBrief(caseId) {
  const ld = getLocalCase(caseId);
  if (!ld) return;

  const query = `Generate a 24-hour hearing preparation brief:
Case: ${ld.title}
Hearing: ${ld.hearingDate ? new Date(ld.hearingDate).toLocaleString() : "Soon"}
Court: ${ld.court || "TBD"}
${ld.analysis ? `Previous Analysis:\n${ld.analysis}` : ""}

Include:
1. Complete documents checklist to bring
2. Key legal arguments to make
3. Last-minute preparation steps (48hr, 24hr, day-of)
4. What NOT to forget`;

  try {
    const res  = await fetch(`${API}/chat/query`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query })
    });
    const data = await res.json();
    showAnalysisModal({
      title: `24hr Brief — ${ld.title}`,
      analysis: data.response,
      confidence: data.confidence,
      analysedAt: new Date().toISOString()
    });
  } catch(e) { alert("Could not generate brief."); }
}

// ─────────────────────────────────────────
// ANALYSIS MODAL
// ─────────────────────────────────────────
function showAnalysisModal(caseData) {
  document.getElementById("modalTitle").textContent = `🤖 ${caseData.title || "Case Analysis"}`;
  document.getElementById("modalContent").innerHTML = `
    <div class="modal-section">
      <h3>🤖 AI Analysis</h3>
      <p>${caseData.analysis || "No analysis available."}</p>
    </div>
    ${caseData.confidence ? `
    <div class="modal-section">
      <h3>📊 Confidence Score</h3>
      <p>${caseData.confidence}%</p>
    </div>` : ""}
    ${caseData.analysedAt ? `
    <div class="modal-section">
      <h3>🕐 Analysed At</h3>
      <p style="font-family:'DM Mono',monospace;font-size:12px">${new Date(caseData.analysedAt).toLocaleString()}</p>
    </div>` : ""}
  `;
  document.getElementById("analysisModal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("analysisModal").classList.add("hidden");
}

// ─────────────────────────────────────────
// DOCUMENTS
// ─────────────────────────────────────────
async function uploadDocument() {
  const file = document.getElementById("docFile").files[0];
  if (!file) return;

  const resultEl = document.getElementById("docResult");
  resultEl.classList.remove("hidden");
  resultEl.textContent = "⏳ Analysing document...";

  try {
    const form = new FormData();
    form.append("file", file);
    const res  = await fetch(`${API}/documents/analyze`, { method: "POST", body: form });
    const data = await res.json();
    resultEl.textContent =
      `📄 File: ${data.filename}\n📊 Confidence: ${data.confidence}%\n\n${data.analysis}` +
      (data.warning ? `\n\n⚠️ Warning: ${data.warning}` : "");
  } catch(e) {
    resultEl.textContent = "❌ Error analysing document.";
  }
}

function handleDrop(event) {
  event.preventDefault();
  document.getElementById("uploadZone").classList.remove("drag-over");
  const file = event.dataTransfer.files[0];
  if (file) {
    document.getElementById("docFile").files = event.dataTransfer.files;
    uploadDocument();
  }
}

// ─────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────
function addNotification(notif) {
  notifications.unshift({ ...notif, id: Date.now() });
  updateNotifBadge();
}

function updateNotifBadge() {
  const badge = document.getElementById("notifCount");
  if (notifications.length > 0) {
    badge.textContent = notifications.length;
    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
  }
}

function toggleNotif() {
  const panel = document.getElementById("notifPanel");
  panel.classList.toggle("hidden");
  if (!panel.classList.contains("hidden")) renderNotifications();
}

function closeNotif() {
  document.getElementById("notifPanel").classList.add("hidden");
}

function renderNotifications() {
  const list = document.getElementById("notifList");
  if (!notifications.length) {
    list.innerHTML = `<div class="notif-empty">No notifications yet</div>`;
    return;
  }
  list.innerHTML = notifications.map(n => `
    <div class="notif-item ${n.type === 'urgent' ? 'urgent' : n.type === 'success' ? 'success' : ''}">
      <div class="notif-title">${n.title}</div>
      <div class="notif-body">${n.body}</div>
      <div class="notif-time">${new Date(n.time).toLocaleString()}</div>
    </div>`).join("");
}

// ─────────────────────────────────────────
// 24HR ALERT SYSTEM
// ─────────────────────────────────────────
function scheduleHearingAlert(caseData) {
  if (!caseData.hearingDate) return;
  const hDate   = new Date(caseData.hearingDate);
  const now     = new Date();
  const diffMs  = hDate - now;
  const alertAt = diffMs - (24 * 60 * 60 * 1000); // 24hrs before

  if (alertAt > 0) {
    setTimeout(() => fireHearingAlert(caseData), alertAt);
  } else if (diffMs > 0 && diffMs <= 24 * 60 * 60 * 1000) {
    // Already within 24hrs window, alert now
    fireHearingAlert(caseData);
  }
}

function fireHearingAlert(caseData) {
  const storageKey = `alerted_${caseData.id}_${caseData.hearingDate}`;
  if (sessionStorage.getItem(storageKey)) return;
  sessionStorage.setItem(storageKey, "1");

  addNotification({
    type: "urgent",
    title: `🚨 Hearing in < 24hrs — ${caseData.title}`,
    body: `📅 ${new Date(caseData.hearingDate).toLocaleString()}${caseData.court ? ` | 🏛 ${caseData.court}` : ""}\nOpen case to get your 24hr preparation brief.`,
    time: new Date()
  });

  loadCases(); // refresh to show urgent badge
}

// ─────────────────────────────────────────
// BOOT — check existing cases on load
// ─────────────────────────────────────────
function bootHearingChecks() {
  const all = getLocalCases();
  Object.values(all).forEach(c => {
    if (c.hearingDate) scheduleHearingAlert(c);
  });
}

// Modal backdrop close
document.getElementById("analysisModal").addEventListener("click", function(e) {
  if (e.target === this) closeModal();
});

bootHearingChecks();
