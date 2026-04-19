from agents import (
    research_agent, document_agent, procedure_agent,
    compliance_agent, smart_scribe, self_doubt_engine, hearing_scheduler
)

AGENT_MAP = {
    "research":   research_agent,
    "document":   document_agent,
    "procedure":  procedure_agent,
    "compliance": compliance_agent,
    "scribe":     smart_scribe,
    "hearing":    hearing_scheduler,
}

KEYWORDS = {
    "research":   ["section", "ipc", "bns", "law", "legal section", "charge", "offence", "crpc", "article"],
    "document":   ["contract", "agreement", "clause", "document", "analyze", "review", "sign", "terms"],
    "procedure":  ["how to file", "steps", "procedure", "process", "filing", "court", "fir", "complaint"],
    "compliance": ["compliance", "regulation", "penalty", "rule", "gst", "tax", "rbi", "sebi"],
    "scribe":     ["petition", "draft", "write", "generate", "application", "letter"],
    "hearing":    ["hearing", "date", "schedule", "reminder", "court date", "prepare", "preparation"],
}

def route(query: str) -> str:
    """Returns agent name based on keywords in the query."""
    q = query.lower()
    for agent_name, keywords in KEYWORDS.items():
        if any(kw in q for kw in keywords):
            return agent_name
    return "research"  # default fallback

async def run(query: str, content: str = None) -> dict:
    """Main entry point. Routes query and returns full response dict."""
    agent_name   = route(query)
    agent_module = AGENT_MAP[agent_name]

    if content:
        raw_response = await agent_module.run(query, content)
    else:
        raw_response = await agent_module.run(query)

    # Always pass through Self-Doubt Engine
    validation = await self_doubt_engine.validate(query, raw_response)

    return {
        "response":     raw_response,
        "agent_used":   agent_name,
        "confidence":   validation["confidence"],
        "flags":        validation["flags"],
        "safe_to_show": validation["safe_to_show"],
        "warning":      validation.get("suggestion") if validation["confidence"] < 60 else None
    }
