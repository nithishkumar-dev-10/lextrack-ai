const API = "http://localhost:8000"; // change to Render URL after deployment

// ─────────────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────────────
let attachedFile = null;
let notifications = [];
let hearingCheckInterval = null;

// ─────────────────────────────────────────────────────
// TAB SWITCHING
// ─────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────
// CHAT
// ─────────────────────────────────────────────────────
function handleKey(e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendQuery();
  }
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
  const container = document.getElementById("attachedFiles");
  container.classList.add("hidden");
  container.innerHTML = "";
  document.getElementById("chatFileInput").value = "";
}

async function sendQuery() {
  const input = document.getElementById("queryInput");
  const query = input.value.trim();
  if (!query && !attachedFile) return;

  const displayText = query || `Analysing: ${attachedFile?.name}`;
  addMessage(displayText, "user");
  input.value = "";
  input.style.height = "auto";
  document.getElementById("sendBtn").disabled = true;

  // Show typing indicator
  const thinkingId = "thinking-" + Date.now();
  addTypingIndicator(thinkingId);

  try {
    let response, data;

    if (attachedFile) {
      // Send file + optional query
      const form = new FormData();
      form.append("file", attachedFile);
      response = await fetch(`${API}/documents/analyze`, { method: "POST", body: form });
      data = await response.json();
      removeTypingIndicator(thinkingId);
      const content = `📄 ${data.filename}\n\n${data.analysis}` + (data.warning ? `\n\n⚠️ ${data.warning}` : "");
      addMessage(content, "bot", data.agent_used || "document", data.confidence, data.warning);
      removeAttachment();
    } else {
      response = await fetch(`${API}/chat/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query })
      });
      data = await response.json();
      removeTypingIndicator(thinkingId);
      addMessage(data.response, "bot", data.agent_used, data.confidence, data.warning);
    }
  } catch (err) {
    removeTypingIndicator(thinkingId);
    addMessage("⚠️ Could not reach the backend. Is it running on port 8000?", "bot");
  }

  document.getElementById("sendBtn").disabled = false;
}

function addMessage(text, role, agent, confidence, warning) {
  const box = document.getElementById("chatMessages");
  const div = document.createElement("div");
  div.className = `message ${role}`;

  const avatar = role === "bot"
    ? `<div class="avatar">⚖️</div>`
    : `<div class="avatar">👤</div>`;

  let html = `${avatar}<div class="message-bubble">${text}`;

  if (agent && confidence !== undefined) {
    const cls = confidence >= 75 ? "green" : confidence >= 50 ? "yellow" : "red";
    html += `<br/><span class="meta-tag ${cls}">Agent: ${agent} | Confidence: ${confidence}%</span>`;
  }
  if (warning) {
    html += `<div class="warning-box">⚠️ ${warning}</div>`;
  }
  html += `</div>`;
  div.innerHTML = html;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

function addTypingIndicator(id) {
  const box = document.getElementById("chatMessages");
  const div = document.createElement("div");
  div.className = "message bot";
  div.id = id;
  div.innerHTML = `
    <div class="avatar">⚖️</div>
    <div class="message-bubble">
      <div class="typing-dots"><span></span><span></span><span></span></div>
    </div>`;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

function removeTypingIndicator(id) {
  document.getElementById(id)?.remove();
}

// ─────────────────────────────────────────────────────
// CASES
// ─────────────────────────────────────────────────────
async function createCase() {
  const title       = document.getElementById("caseTitle").value.trim();
  const description = document.getElementById("caseDesc").value.trim();
  const caseType    = document.getElementById("caseType").value.trim();
  if (!title) return alert("Enter a case title");

  const btn = document.querySelector("#tab-cases .primary-btn");
  btn.textContent = "Registering & Analysing...";
  btn.disabled = true;

  try {
    // 1. Create the case
    const res = await fetch(`${API}/cases/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description: description || caseType })
    });
    const newCase = await res.json();

    // 2. Auto-analyse immediately
    const analysisQuery = `Analyse this legal case and provide:
1. Relevant IPC/BNS sections
2. Required documents list
3. Key points and strategy
4. Important deadlines

Case Title: ${title}
Case Type: ${caseType || "General"}
Facts: ${description || "No additional facts provided"}`;

    const aiRes = await fetch(`${API}/chat/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: analysisQuery })
    });
    const aiData = await aiRes.json();

    // 3. Store analysis in case (store locally for now)
    const caseData = {
      id: newCase.id,
      title,
      caseType,
      description,
      status: newCase.status || "open",
      analysis: aiData.response,
      confidence: aiData.confidence,
      analysedAt: new Date().toISOString()
    };
    saveCaseAnalysis(caseData);

    // 4. Show modal with analysis
    showAnalysisModal(caseData);

    // 5. Add notification
    addNotification({
      type: "analysis",
      title: `✅ Case #${newCase.id} Analysed`,
      body: `"${title}" — AI analysis complete. Key sections and documents identified.`,
      time: new Date()
    });

    // Clear form
    document.getElementById("caseTitle").value = "";
    document.getElementById("caseDesc").value = "";
    document.getElementById("caseType").value = "";

    loadCases();
  } catch (err) {
    alert("Error creating case. Is backend running?");
  }

  btn.textContent = "+ Register Case & Auto-Analyse";
  btn.disabled = false;
}

function saveCaseAnalysis(caseData) {
  const all = JSON.parse(localStorage.getItem("lextrack_analyses") || "{}");
  all[caseData.id] = caseData;
  localStorage.setItem("lextrack_analyses", JSON.stringify(all));
}

function getCaseAnalysis(caseId) {
  const all = JSON.parse(localStorage.getItem("lextrack_analyses") || "{}");
  return all[caseId] || null;
}

async function loadCases() {
  try {
    const res   = await fetch(`${API}/cases/`);
    const cases = await res.json();
    const el    = document.getElementById("casesList");

    if (!cases.length) {
      el.innerHTML = "<p style='color:var(--dim);padding:12px;font-size:13px'>No cases registered yet.</p>";
      return;
    }

    el.innerHTML = cases.map(c => {
      const analysis = getCaseAnalysis(c.id);
      const hasAnalysis = !!analysis;
      return `
        <div class="list-item">
          <div class="list-item-header">
            <h3>📁 #${c.id} — ${c.title}</h3>
            <span class="badge ${c.status === 'open' ? 'open' : 'pending'}">${c.status}</span>
          </div>
          <p>${c.description || "No description"}</p>
          ${hasAnalysis
            ? `<button class="analyse-btn" onclick="showAnalysisModal(getCaseAnalysis(${c.id}))">📊 View Analysis</button>`
            : `<button class="analyse-btn" onclick="reAnalyseCase(${c.id}, '${c.title}', '${(c.description||'').replace(/'/g,"\\'")}')">🔄 Analyse Now</button>`
          }
        </div>`;
    }).join("");
  } catch (e) {
    document.getElementById("casesList").innerHTML =
      "<p style='color:var(--dim);padding:12px;font-size:13px'>Could not load cases.</p>";
  }
}

async function reAnalyseCase(id, title, description) {
  const btn = event.target;
  btn.textContent = "Analysing...";
  btn.disabled = true;

  try {
    const query = `Analyse this legal case:
Case Title: ${title}
Facts: ${description || "No facts provided"}
Provide: relevant IPC/BNS sections, required documents, key points.`;

    const res  = await fetch(`${API}/chat/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query })
    });
    const data = await res.json();
    const caseData = { id, title, description, analysis: data.response, confidence: data.confidence, analysedAt: new Date().toISOString() };
    saveCaseAnalysis(caseData);
    showAnalysisModal(caseData);
    loadCases();
  } catch (e) {
    alert("Analysis failed.");
  }
}

function showAnalysisModal(caseData) {
  document.getElementById("modalContent").innerHTML = `
    <div class="modal-section">
      <h3>📁 Case</h3>
      <p><strong>${caseData.title}</strong>${caseData.caseType ? ` — ${caseData.caseType}` : ""}</p>
    </div>
    <div class="modal-section">
      <h3>🤖 AI Analysis</h3>
      <p style="white-space:pre-wrap;line-height:1.7">${caseData.analysis || "No analysis available."}</p>
    </div>
    ${caseData.confidence ? `
    <div class="modal-section">
      <h3>📊 Confidence</h3>
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

// ─────────────────────────────────────────────────────
// HEARINGS
// ─────────────────────────────────────────────────────
async function createHearing() {
  const body = {
    case_id:      parseInt(document.getElementById("hCaseId").value) || null,
    title:        document.getElementById("hTitle").value.trim(),
    hearing_date: document.getElementById("hDate").value,
    court:        document.getElementById("hCourt").value.trim(),
    notes:        document.getElementById("hNotes").value.trim(),
  };
  if (!body.title || !body.hearing_date) return alert("Fill title and date");

  try {
    await fetch(`${API}/hearings/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    // Clear form
    ["hCaseId","hTitle","hDate","hCourt","hNotes"].forEach(id => {
      document.getElementById(id).value = "";
    });

    addNotification({
      type: "hearing",
      title: "📅 Hearing Scheduled",
      body: `"${body.title}" on ${new Date(body.hearing_date).toLocaleString()}`,
      time: new Date()
    });

    loadHearings();
  } catch(e) {
    alert("Could not schedule hearing.");
  }
}

async function loadHearings() {
  try {
    const res      = await fetch(`${API}/hearings/`);
    const hearings = await res.json();
    const el       = document.getElementById("hearingsList");

    if (!hearings.length) {
      el.innerHTML = "<p style='color:var(--dim);padding:12px;font-size:13px'>No hearings scheduled.</p>";
      return;
    }

    const now = new Date();
    el.innerHTML = hearings.map(h => {
      const hDate     = new Date(h.hearing_date);
      const diffMs    = hDate - now;
      const diffHours = diffMs / (1000 * 60 * 60);
      const isUrgent  = diffHours > 0 && diffHours <= 24;
      const isPast    = diffMs < 0;

      return `
        <div class="list-item ${isUrgent ? 'urgent' : ''}">
          <div class="list-item-header">
            <h3>${isUrgent ? "🚨 " : "📅 "}${h.title}</h3>
            <span class="badge ${isUrgent ? 'urgent' : isPast ? 'pending' : 'open'}">
              ${isUrgent ? "< 24hrs" : isPast ? "Past" : "Upcoming"}
            </span>
          </div>
          <p>
            🕐 ${hDate.toLocaleString()} &nbsp;|&nbsp;
            🏛 ${h.court || "TBD"} &nbsp;|&nbsp;
            📁 Case #${h.case_id || "—"}
          </p>
          ${h.notes ? `<p style="margin-top:4px">📝 ${h.notes}</p>` : ""}
          ${isUrgent ? `<button class="analyse-btn" style="border-color:var(--red);color:var(--red)" onclick="get24hrBrief('${h.title}', ${h.case_id || 'null'})">🔔 Get 24hr Brief</button>` : ""}
        </div>`;
    }).join("");
  } catch(e) {
    document.getElementById("hearingsList").innerHTML =
      "<p style='color:var(--dim);padding:12px;font-size:13px'>Could not load hearings.</p>";
  }
}

async function get24hrBrief(hearingTitle, caseId) {
  const btn = event.target;
  btn.textContent = "Generating brief...";
  btn.disabled = true;

  const analysis = caseId ? getCaseAnalysis(caseId) : null;
  const query = `Generate a 24-hour hearing preparation brief for:
Hearing: ${hearingTitle}
${analysis ? `Case Analysis: ${analysis.analysis}` : ""}

Include:
1. Documents to bring (checklist)
2. Key legal points to argue
3. Last-minute preparation steps
4. What NOT to forget`;

  try {
    const res  = await fetch(`${API}/chat/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query })
    });
    const data = await res.json();

    showAnalysisModal({
      title: `24hr Brief: ${hearingTitle}`,
      analysis: data.response,
      confidence: data.confidence,
      analysedAt: new Date().toISOString()
    });
  } catch(e) {
    alert("Could not generate brief.");
  }

  btn.textContent = "🔔 Get 24hr Brief";
  btn.disabled = false;
}

// ─────────────────────────────────────────────────────
// DOCUMENTS
// ─────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────────────
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
    <div class="notif-item ${n.type === 'urgent' ? 'urgent' : ''}">
      <div class="notif-title">${n.title}</div>
      <div class="notif-body">${n.body}</div>
      <div class="notif-time">${new Date(n.time).toLocaleString()}</div>
    </div>`).join("");
}

// ─────────────────────────────────────────────────────
// 24HR HEARING CHECKER (runs every 5 minutes)
// ─────────────────────────────────────────────────────
async function checkUpcomingHearings() {
  try {
    const res      = await fetch(`${API}/hearings/`);
    const hearings = await res.json();
    const now      = new Date();

    hearings.forEach(h => {
      const hDate     = new Date(h.hearing_date);
      const diffMs    = hDate - now;
      const diffHours = diffMs / (1000 * 60 * 60);
      const storageKey = `notified_${h.id}`;

      if (diffHours > 0 && diffHours <= 24 && !sessionStorage.getItem(storageKey)) {
        sessionStorage.setItem(storageKey, "1");
        const analysis = h.case_id ? getCaseAnalysis(h.case_id) : null;

        addNotification({
          type: "urgent",
          title: `🚨 Hearing in ${Math.round(diffHours)}hrs: ${h.title}`,
          body: analysis
            ? `Key points ready. Court: ${h.court || "TBD"}. Tap 'Get 24hr Brief' for full prep.`
            : `Court: ${h.court || "TBD"}. Register your case for AI-generated prep checklist.`,
          time: new Date()
        });
      }
    });
  } catch(e) {
    // Backend not available, skip silently
  }
}

// ─────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────
checkUpcomingHearings();
hearingCheckInterval = setInterval(checkUpcomingHearings, 5 * 60 * 1000); // every 5 min

// Close modal on backdrop click
document.getElementById("analysisModal").addEventListener("click", function(e) {
  if (e.target === this) closeModal();
});
