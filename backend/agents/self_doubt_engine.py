import json
from services.groq_services import call_llm
from services.prompt_builder import self_doubt_prompt
from config import CONFIDENCE_THRESHOLD

AGENT_NAME = "self_doubt_engine"

async def validate(query: str, response: str) -> dict:
    """
    Validates any AI response before it is shown to the user.
    Returns confidence score, flags, and safety decision.
    """
    prompt = self_doubt_prompt(query, response)
    raw    = await call_llm(prompt)

    try:
        raw = raw.strip()
        if "```" in raw:
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        result = json.loads(raw)
    except (json.JSONDecodeError, IndexError):
        result = {
            "confidence": 50,
            "flags":      ["Could not validate response structure"],
            "safe_to_show": True,
            "suggestion": "Manual review recommended"
        }

    if result.get("confidence", 100) < CONFIDENCE_THRESHOLD:
        result["safe_to_show"] = False

    return result
