from services.groq_services import call_llm
from services.prompt_builder import document_prompt

AGENT_NAME = "document_agent"

async def run(query: str, content: str = None) -> str:
    """Analyzes legal documents for risky or unfair clauses."""
    text_to_analyze = content if content else query
    prompt = document_prompt(text_to_analyze)
    return await call_llm(prompt)
