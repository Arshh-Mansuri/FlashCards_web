"""Seed the database with demo accounts and starter flashcards.

Run from the backend/ directory:  python seed.py

Creates:
  * admin / admin123   (role: admin  — can view every user's history)
  * student / student123 (role: user — owns the starter deck below)

Re-running is safe: existing demo users are reset to a known state.
"""
import asyncio
import json
import os
from datetime import datetime, timezone

from auth import hash_password
from database import flashcards_collection, history_collection, users_collection

SEED_FILE = os.path.join(os.path.dirname(__file__), "..", "flashcards.json")


async def upsert_user(username: str, password: str, role: str):
    await users_collection.update_one(
        {"username": username},
        {
            "$set": {
                "username": username,
                "password": hash_password(password),
                "role": role,
            },
            "$setOnInsert": {"created_at": datetime.now(timezone.utc)},
        },
        upsert=True,
    )
    return await users_collection.find_one({"username": username})


async def main():
    admin = await upsert_user("admin", "admin123", "admin")
    student = await upsert_user("student", "student123", "user")
    print(f"Admin account ready:   admin / admin123  ({admin['_id']})")
    print(f"Student account ready: student / student123  ({student['_id']})")

    # Give the student a fresh starter deck from flashcards.json.
    await flashcards_collection.delete_many({"owner_id": student["_id"]})
    await history_collection.delete_many({"user_id": student["_id"]})

    with open(SEED_FILE, encoding="utf-8") as f:
        cards = json.load(f)

    now = datetime.now(timezone.utc)
    docs = [
        {
            "question": c["question"],
            "answer": c["answer"],
            "deck": c.get("deck", "General"),
            "owner_id": student["_id"],
            "created_at": now,
        }
        for c in cards
    ]
    await flashcards_collection.insert_many(docs)
    print(f"Inserted {len(docs)} flashcards for 'student'.")


if __name__ == "__main__":
    asyncio.run(main())
