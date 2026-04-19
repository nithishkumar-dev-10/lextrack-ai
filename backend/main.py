from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import APP_NAME, ALLOWED_ORIGINS
from database import Base, engine
from routers import chat, cases, hearings, documents

# Create all database tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=APP_NAME,
    description="Safety-first legal AI with 7 specialized agents",
    version="2.0.0"
)

# Allow frontend to talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routers
app.include_router(chat.router,      prefix="/chat",      tags=["Chat"])
app.include_router(cases.router,     prefix="/cases",     tags=["Cases"])
app.include_router(hearings.router,  prefix="/hearings",  tags=["Hearings"])
app.include_router(documents.router, prefix="/documents", tags=["Documents"])

@app.get("/")
def root():
    return {"app": APP_NAME, "status": "running", "agents": 7}

@app.get("/health")
def health():
    return {
        "status": "ok",
        "agents": [
            "research_agent", "document_agent", "procedure_agent",
            "compliance_agent", "smart_scribe",
            "self_doubt_engine", "hearing_scheduler"
        ]
    }

# Run with: uvicorn main:app --reload