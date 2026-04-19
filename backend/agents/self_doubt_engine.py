import json
from services.gemini_service import call_gemini
from services.prompt_builder import self_doubt_prompt
from config import CONFIDENCE_THRESHOLD

AGENT_NAME = "self_doubt_engine"

async def validate(query: str, response: str) -> dict:
    """
    Validates any AI response before it is shown to the user.
    Returns confidence score, flags, and safety decision.

    HOW IT WORKS:
    1. Takes the original query + AI response
    2. Makes a second Gemini call asking it to review its own output
    3. Parses the confidence score (0-100)
    4. If confidence < CONFIDENCE_THRESHOLD (60), sets warning flag
    5. Returns structured validation result
    """
    prompt = self_doubt_prompt(query, response)
    raw    = await call_gemini(prompt)

    try:
        # Clean response in case Gemini adds extra text or markdown
        raw = raw.strip()
        if "```" in raw:
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        result = json.loads(raw)
    except (json.JSONDecodeError, IndexError):
        # Fallback if JSON parsing fails
        result = {
            "confidence": 50,
            "flags":      ["Could not validate response structure"],
            "safe_to_show": True,
            "suggestion": "Manual review recommended"
        }

    # Add low-confidence warning
    if result.get("confidence", 100) < CONFIDENCE_THRESHOLD:
        result["safe_to_show"] = False

    return result