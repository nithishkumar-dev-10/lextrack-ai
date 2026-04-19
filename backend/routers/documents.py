from fastapi import APIRouter, UploadFile, File, HTTPException
from agents import document_agent, self_doubt_engine

router = APIRouter()

@router.post("/analyze")
async def analyze_document(file: UploadFile = File(...)):
    """
    User uploads a legal document (PDF or TXT).
    Document Agent analyzes it for risky clauses.
    Self-Doubt Engine validates the analysis.
    """
    allowed = ["text/plain", "application/pdf"]
    if file.content_type not in allowed:
        raise HTTPException(400, "Only PDF and TXT files allowed")

    content = await file.read()
    text    = content.decode("utf-8", errors="ignore")

    if len(text.strip()) < 50:
        raise HTTPException(400, "Document appears to be empty or unreadable")

    response   = await document_agent.run(text)
    validation = await self_doubt_engine.validate(text[:200], response)

    return {
        "filename":   file.filename,
        "analysis":   response,
        "confidence": validation["confidence"],
        "flags":      validation["flags"],
        "warning":    validation.get("suggestion") if validation["confidence"] < 60 else None
    }