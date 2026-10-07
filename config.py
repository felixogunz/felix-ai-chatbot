import os
from pathlib import Path

from dotenv import load_dotenv


# Load variables from the .env file
load_dotenv()


# Get the main project directory
BASE_DIR = Path(__file__).resolve().parent


# Database
DATABASE_NAME = os.getenv(
    "DATABASE_NAME",
    str(BASE_DIR / "felix_ai.db")
)


# Uploaded files
UPLOAD_FOLDER = os.getenv(
    "UPLOAD_FOLDER",
    str(BASE_DIR / "uploads")
)


# Maximum uploaded file size: 10 MB
MAX_FILE_SIZE = 10 * 1024 * 1024


# File types allowed by the chatbot
ALLOWED_EXTENSIONS = {
    "txt",
    "md",
    "csv",
    "json",
    "pdf",
    "docx"
}


# Maximum length of a message
MAX_MESSAGE_LENGTH = 20_000


# Flask secret key
SECRET_KEY = os.getenv(
    "SECRET_KEY",
    "change-this-secret-key-in-production"
)


# AI API settings
AI_API_URL = os.getenv(
    "AI_API_URL"
)

AI_API_KEY = os.getenv(
    "AI_API_KEY"
)

AI_MODEL = os.getenv(
    "AI_MODEL"
)