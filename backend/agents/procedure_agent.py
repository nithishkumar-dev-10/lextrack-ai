from services.groq_services import call_llm
from services.prompt_builder import procedure_prompt

AGENT_NAME = "procedure_agent"

async def run(query: str, content: str = None) -> str:
    """Gives step-by-step legal procedure guidance."""
    prompt = procedure_prompt(query)
    return await call_llm(prompt)
