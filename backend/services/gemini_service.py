import google.generativeai as genai
from config import GEMINI_API_KEY, GEMINI_MODEL

# Configure Gemini once when module loads
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel(GEMINI_MODEL)

async def call_gemini(prompt: str) -> str:
    """
    Send a prompt to Gemini and return the text response.
    This is the ONLY function that talks to Gemini API.
    All agents call this function.
    """
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        return "AI service error: " + str(e)