from services.groq_services import call_llm
from services.prompt_builder import compliance_prompt

AGENT_NAME = "compliance_agent"

async def run(query: str, content: str = None) -> str:
    """Tracks regulatory compliance requirements and penalties."""
    prompt = compliance_prompt(query)
    return await call_llm(prompt)
