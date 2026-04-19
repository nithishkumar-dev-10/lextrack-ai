from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models.schemas import ChatRequest, ChatResponse
from database import get_db, ChatHistory
from agents import orchestrator

router = APIRouter()

@router.post("/query", response_model=ChatResponse)
async def legal_query(request: ChatRequest, db: Session = Depends(get_db)):
    """
    Main endpoint. User sends a legal question.
    Orchestrator routes to correct agent.
    Self-Doubt Engine validates the response.
    Result is saved to chat history.
    """
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    result = await orchestrator.run(request.query, request.context)

    # Save to database
    history = ChatHistory(
        query      = request.query,
        response   = result["response"],
        agent_used = result["agent_used"],
        confidence = result["confidence"]
    )
    db.add(history)
    db.commit()

    return ChatResponse(
        response   = result["response"],
        agent_used = result["agent_used"],
        confidence = result["confidence"],
        warning    = result.get("warning")
    )

@router.get("/history")
def get_history(db: Session = Depends(get_db)):
    """Returns last 20 chat messages."""
    history = db.query(ChatHistory).order_by(
        ChatHistory.created_at.desc()
    ).limit(20).all()
    return history

@router.get("/agents")
def list_agents():
    """Lists all 7 agents and their purpose."""
    return {
        "agents": [
            {"name": "research_agent",    "purpose": "IPC/BNS legal section research"},
            {"name": "document_agent",    "purpose": "Contract and document risk analysis"},
            {"name": "procedure_agent",   "purpose": "Step-by-step legal filing guidance"},
            {"name": "compliance_agent",  "purpose": "Regulatory compliance monitoring"},
            {"name": "smart_scribe",      "purpose": "Legal petition generation"},
            {"name": "self_doubt_engine", "purpose": "AI response confidence validation"},
            {"name": "hearing_scheduler", "purpose": "Court hearing preparation planning"},
        ]
    }