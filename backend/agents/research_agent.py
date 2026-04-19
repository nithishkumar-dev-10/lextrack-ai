from services.gemini_service import call_gemini
from services.prompt_builder import research_prompt

AGENT_NAME = "research_agent"

async def run(query: str, content: str = None) -> str:
    """Researches IPC/BNS legal sections for the given query."""
    prompt = research_prompt(query)
    return await call_gemini(prompt)