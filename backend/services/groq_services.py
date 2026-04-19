from groq import Groq
import os

# Configure Groq once when module loads
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

async def call_llm(prompt: str) -> str:
    """
    Send a prompt to Groq and return the text response.
    This is the ONLY function that talks to LLM API.
    All agents call this function.
    """
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1000
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return "AI service error: " + str(e)
