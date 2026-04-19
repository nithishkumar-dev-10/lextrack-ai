from services.gemini_service import call_gemini
from services.prompt_builder import scribe_prompt

AGENT_NAME = "smart_scribe"

async def run(query: str, content: str = None) -> str:
    """
    Generates legal petitions from user facts.
    Refuses if facts are incomplete or contradictory.
    """
    facts = content if content else query
    prompt = scribe_prompt(facts)
    return await call_gemini(prompt)