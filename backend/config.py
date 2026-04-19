from dotenv import load_dotenv
import os

load_dotenv()  # reads .env file automatically

GEMINI_API_KEY       = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
DATABASE_URL         = os.getenv("DATABASE_URL", "sqlite:///./lextrack.db")
ALLOWED_ORIGINS      = os.getenv("ALLOWED_ORIGINS", "*").split(",")
CONFIDENCE_THRESHOLD = int(os.getenv("CONFIDENCE_THRESHOLD", "60"))
APP_NAME             = os.getenv("APP_NAME", "LexTrack-AI")
DEBUG                = os.getenv("DEBUG", "True") == "True"