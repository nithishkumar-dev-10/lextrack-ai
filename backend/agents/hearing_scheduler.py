from services.gemini_service import call_gemini
from services.prompt_builder import hearing_prompt

AGENT_NAME = "hearing_scheduler"

async def run(query: str, content: str = None) -> str:
    """Provides hearing preparation plans and document checklists."""
    case_info = content if content else query
    prompt    = hearing_prompt(case_info)
    return await call_gemini(prompt)