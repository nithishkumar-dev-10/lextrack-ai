# ⚖️ LexTrack-AI — Smart Legal AI Agent System

<div align="center">

![LexTrack-AI](https://capsule-render.vercel.app/api?type=venom&color=0:020817,50:0c1a3a,100:0a4a6e&height=200&section=header&text=LexTrack-AI&fontSize=60&fontColor=e2f4f7&fontAlignY=40&desc=Safety-First%20Multi-Agent%20Legal%20Intelligence&descColor=7ecfde&descSize=18&animation=fadeIn)

[![Python](https://img.shields.io/badge/Python-020817?style=flat-square&logo=python&logoColor=7ecfde)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-020817?style=flat-square&logo=fastapi&logoColor=7ecfde)](https://fastapi.tiangolo.com)
[![LLM Powered](https://img.shields.io/badge/LLM-Powered-020817?style=flat-square&logoColor=7ecfde)](#)
[![Multi Agent](https://img.shields.io/badge/7-Agents-0a4a6e?style=flat-square)](#architecture)
[![Hackathon](https://img.shields.io/badge/🥇-1st%20Prize%20Winner-gold?style=flat-square)](#origin)
[![License](https://img.shields.io/badge/License-MIT-020817?style=flat-square)](LICENSE)

**An intelligent, safety-first legal assistant designed to reduce human error, improve legal awareness, and prevent costly procedural mistakes.**

[Architecture](#architecture) · [Agents](#the-7-agents) · [Setup](#setup) · [Origin](#origin)

</div>

---

## 🏆 Origin & Hackathon Story

LexTrack-AI was originally built during **Epochon Hackathon** — a 24-hour team sprint — and **won First Prize (Gold)** for its production-grade architecture and real-world applicability.

The project was conceived, architected, and led by **Nithish Kumar S** (team lead), and built collaboratively with the team under a shared team repository during the hackathon.

Following the win, the project was officially **handed over to Nithish Kumar S** as team leader for continued development, scalability improvements, and long-term maintenance. This repository is the independently maintained version of that original build — extended with cleaner code organization, improved modularity, and a focus on production readiness.

> *What started as a 24-hour sprint is now being engineered into a real product.*

---

## 🧠 What is LexTrack-AI?

LexTrack-AI is a **7-agent legal AI system** built with a human-in-the-loop philosophy. Instead of blindly automating legal decisions, it combines AI intelligence with built-in self-awareness — explicitly refusing to act when it isn't confident enough.

The core design principle: **safety over speed**.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    LexTrack-AI System                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   User Input ──► Self-Doubt Engine ──► Route to Agent   │
│                        │                               │
│              Confidence Score (0–100)                  │
│                  Low ──► Escalate                       │
│                  High ──► Proceed                       │
│                                                         │
├──────────┬──────────┬──────────┬──────────┬────────────┤
│ Research │Document  │Procedure │Compliance│   Smart    │
│  Agent   │Analysis  │Guidance  │Monitoring│   Scribe   │
│          │  Agent   │  Agent   │  Agent   │            │
└──────────┴──────────┴──────────┴──────────┴────────────┘
                              │
                   Smart Hearing Scheduler
```

**Backend:** FastAPI (Python) — RESTful agent routing, modular design
**AI Layer:** LLM-based processing per agent
**Frontend:** HTML, CSS, JavaScript, TypeScript
**Deployment:** Shell + Batch scripting for cross-platform startup

---

## 🤖 The 7 Agents

### 1. 🔍 Smart Research Agent
Searches IPC, BNS, and case laws to find the exact legal sections required for a given situation.

**Edge over standard search:**
- Cross-references repealed laws with current statutes
- Warns if a cited case law has been overruled or weakened
- Prevents reliance on outdated or invalid legal provisions

---

### 2. 📄 Document Analysis Agent
Analyzes long legal documents and contracts to detect hidden, unfair, or risky clauses.

**Edge over standard review:**
- Assigns a **risk score** to every clause
- Flags potentially illegal or one-sided terms
- Summarizes complex clauses into plain English

---

### 3. 🗺️ Procedure Guidance Agent
Provides a step-by-step roadmap for filing cases, including deadlines and required forms.

**Edge over generic guidance:**
- Verifies jurisdiction based on user location
- Prevents missed deadlines
- Ensures filings are made in the correct court

---

### 4. 📊 Compliance Monitoring Agent
Continuously tracks regulatory changes relevant to businesses and individuals.

**Edge over manual tracking:**
- Alerts users about new or updated compliance rules
- Predicts potential financial penalties for non-compliance
- Maintains a log of compliant actions for audits

---

### 5. ✍️ Smart Scribe (Petition Generator)
Converts user-provided facts into a court-ready legal petition.

**Edge over template-based drafting:**
- Refuses to draft documents if facts are contradictory
- Detects missing evidence before submission
- Reduces chances of petition rejection

---

### 6. 🧠 Self-Doubt Engine *(Core Safety Logic)*
Calculates a **confidence score (0–100)** based on data completeness and risk level. This is the backbone of the system's safety model.

**Why this matters:**
- Explicitly declines decisions when confidence is low
- Escalates high-risk cases to human professionals
- Prevents blind automation in sensitive legal matters

> *Every agent decision passes through the Self-Doubt Engine before execution.*

---

### 7. 📅 Smart Hearing Scheduler
Tracks court hearing dates and notifies all relevant parties.

**Edge over manual scheduling:**
- Sends automated reminders to lawyers and clients
- Triggers a critical document review 48 hours before hearings
- Identifies missing filings or evidence in advance

---

## ⚙️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python, FastAPI |
| AI / LLM | LLM-based agent processing |
| Frontend | HTML, CSS, JavaScript |
| Startup | Shell script (Linux/Mac), Batch script (Windows) |

---

## 🚀 Setup

### Prerequisites
- Python 3.10+
- pip

### Installation

```bash
# Clone the repository
git clone https://github.com/nithishkumar-dev-10/lextrack-ai.git
cd lextrack-ai

# Install dependencies
pip install -r requirements.txt

# Copy environment variables
cp .env.example .env
# Add your API keys to .env

# Run the backend
cd backend
uvicorn main:app --reload
```

**Or use the startup scripts:**
```bash
# Linux / Mac
./start.sh

# Windows
start.bat
```

Backend runs at: `http://localhost:8000`

---

## 🌿 What Changed from Hackathon Version

| Hackathon Build | This Version |
|---|---|
| Single monolithic script | Modular agent architecture |
| Hardcoded values | Config-driven via `.env` |
| No error handling | Graceful fallbacks per agent |
| Team repo, shared ownership | Independently maintained |
| Prototype-grade code | Production-oriented structure |

---

## 🔭 Roadmap

- [ ] Deploy backend to Render / Railway
- [ ] Add agent-level logging and tracing
- [ ] Build REST API documentation (Swagger auto-generated via FastAPI)
- [ ] Add authentication layer for multi-user access
- [ ] Expand Self-Doubt Engine with calibrated confidence thresholds
- [ ] Connect to live legal databases (IndianKanoon API)

---

## 👨‍💻 Author

**Nithish Kumar S** — Team Lead, Architect, Primary Developer

[![Portfolio](https://img.shields.io/badge/Portfolio-020817?style=flat-square&logoColor=7ecfde)](https://nithishkumar-dev-10.github.io/nithish-dev-portfolio/)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0c1a3a?style=flat-square&logo=linkedin&logoColor=7ecfde)](https://www.linkedin.com/in/nithish-kumar-saravanan10/)
[![GitHub](https://img.shields.io/badge/GitHub-0a4a6e?style=flat-square&logo=github&logoColor=e2f4f7)](https://github.com/nithishkumar-dev-10)
[![Email](https://img.shields.io/badge/Email-020817?style=flat-square&logo=gmail&logoColor=7ecfde)](mailto:nithishkumar.dev10@gmail.com)

*Open to AI/ML engineering internships and collaborations.*

---

<div align="center">

![Footer](https://capsule-render.vercel.app/api?type=waving&color=0:0a4a6e,50:0c1a3a,100:020817&height=110&section=footer&animation=fadeIn)

</div>
