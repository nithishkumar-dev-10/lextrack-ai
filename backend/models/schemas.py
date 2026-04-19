from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# ── Chat ──────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    query:   str
    context: Optional[str] = None

class ChatResponse(BaseModel):
    response:   str
    agent_used: str
    confidence: float
    warning:    Optional[str] = None

# ── Cases ─────────────────────────────────────────────────────
class CaseCreate(BaseModel):
    title:       str
    description: Optional[str] = None
    status:      Optional[str] = "active"

class CaseOut(BaseModel):
    id:          int
    title:       str
    description: Optional[str]
    status:      str
    created_at:  datetime
    class Config:
        from_attributes = True

# ── Hearings ──────────────────────────────────────────────────
class HearingCreate(BaseModel):
    case_id:      int
    title:        str
    hearing_date: str
    court:        Optional[str] = None
    notes:        Optional[str] = None

class HearingOut(BaseModel):
    id:           int
    case_id:      int
    title:        str
    hearing_date: str
    court:        Optional[str]
    notes:        Optional[str]
    class Config:
        from_attributes = True