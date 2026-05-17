"""MongoDB connection and collection handles (Motor async driver)."""
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "flashcard_db")

client = AsyncIOMotorClient(MONGO_URI)
db = client[DB_NAME]

# Three conceptual entities of the app:
users_collection = db["users"]            # authentication + role
flashcards_collection = db["flashcards"]  # per-user study cards
history_collection = db["history"]        # per-user learning history
