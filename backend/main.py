"""Flashcard Learning App — FastAPI backend.

Three conceptual entities, each with full CRUD-style operations:
  * users      — registration / login (JWT + bcrypt), roles: user | admin
  * flashcards — per-user study cards (create / read / update / delete)
  * history    — per-user learning history; admins can read every user's history
"""
from datetime import datetime, timezone
from typing import List, Optional

from bson import ObjectId
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from auth import (
    create_access_token,
    get_current_user,
    hash_password,
    require_admin,
    verify_password,
)
from database import (
    flashcards_collection,
    history_collection,
    users_collection,
)
from models import (
    AdminHistoryResponse,
    AdminUserSummary,
    FlashcardCreate,
    FlashcardResponse,
    FlashcardUpdate,
    HistoryCreate,
    HistoryResponse,
    Token,
    UserCreate,
    UserLogin,
    UserResponse,
)

app = FastAPI(title="Flashcard Learning API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Serialisers ------------------------------------------------------------

def user_to_response(doc) -> dict:
    return {"id": str(doc["_id"]), "username": doc["username"], "role": doc["role"]}


def card_to_response(doc) -> dict:
    return {
        "id": str(doc["_id"]),
        "question": doc["question"],
        "answer": doc["answer"],
        "deck": doc.get("deck", "General"),
    }


def history_to_response(doc) -> dict:
    return {
        "id": str(doc["_id"]),
        "card_id": str(doc["card_id"]),
        "question": doc["question"],
        "deck": doc.get("deck", "General"),
        "result": doc["result"],
        "studied_at": doc["studied_at"].isoformat(),
    }


# --- Auth -------------------------------------------------------------------

@app.post("/auth/register", response_model=Token, status_code=201)
async def register(payload: UserCreate):
    existing = await users_collection.find_one({"username": payload.username})
    if existing:
        raise HTTPException(status_code=409, detail="Username already taken")

    # First account created becomes the admin so the demo always has one.
    role = "admin" if await users_collection.count_documents({}) == 0 else "user"
    result = await users_collection.insert_one(
        {
            "username": payload.username,
            "password": hash_password(payload.password),
            "role": role,
            "created_at": datetime.now(timezone.utc),
        }
    )
    doc = await users_collection.find_one({"_id": result.inserted_id})
    token = create_access_token(str(doc["_id"]), doc["role"])
    return {"access_token": token, "user": user_to_response(doc)}


@app.post("/auth/login", response_model=Token)
async def login(payload: UserLogin):
    doc = await users_collection.find_one({"username": payload.username})
    if not doc or not verify_password(payload.password, doc["password"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    token = create_access_token(str(doc["_id"]), doc["role"])
    return {"access_token": token, "user": user_to_response(doc)}


@app.get("/auth/me", response_model=UserResponse)
async def me(user: dict = Depends(get_current_user)):
    return user_to_response(user)


# --- Flashcards (scoped to the authenticated owner) -------------------------

@app.get("/flashcards", response_model=List[FlashcardResponse])
async def list_flashcards(user: dict = Depends(get_current_user)):
    cards = []
    async for doc in flashcards_collection.find({"owner_id": user["_id"]}):
        cards.append(card_to_response(doc))
    return cards


@app.post("/flashcards", response_model=FlashcardResponse, status_code=201)
async def create_flashcard(
    card: FlashcardCreate, user: dict = Depends(get_current_user)
):
    data = card.model_dump()
    data["deck"] = data.get("deck") or "General"
    data["owner_id"] = user["_id"]
    data["created_at"] = datetime.now(timezone.utc)
    result = await flashcards_collection.insert_one(data)
    doc = await flashcards_collection.find_one({"_id": result.inserted_id})
    return card_to_response(doc)


async def _owned_card_or_404(card_id: str, user: dict) -> dict:
    if not ObjectId.is_valid(card_id):
        raise HTTPException(status_code=400, detail="Invalid card ID")
    doc = await flashcards_collection.find_one(
        {"_id": ObjectId(card_id), "owner_id": user["_id"]}
    )
    if doc is None:
        raise HTTPException(status_code=404, detail="Flashcard not found")
    return doc


@app.put("/flashcards/{card_id}", response_model=FlashcardResponse)
async def update_flashcard(
    card_id: str, card: FlashcardUpdate, user: dict = Depends(get_current_user)
):
    await _owned_card_or_404(card_id, user)
    update_data = {k: v for k, v in card.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    await flashcards_collection.update_one(
        {"_id": ObjectId(card_id)}, {"$set": update_data}
    )
    doc = await flashcards_collection.find_one({"_id": ObjectId(card_id)})
    return card_to_response(doc)


@app.delete("/flashcards/{card_id}", status_code=204)
async def delete_flashcard(card_id: str, user: dict = Depends(get_current_user)):
    await _owned_card_or_404(card_id, user)
    await flashcards_collection.delete_one({"_id": ObjectId(card_id)})
    # Keep history consistent when a card is removed.
    await history_collection.delete_many({"card_id": ObjectId(card_id)})


# --- Learning history -------------------------------------------------------

@app.post("/history", response_model=HistoryResponse, status_code=201)
async def record_history(
    payload: HistoryCreate, user: dict = Depends(get_current_user)
):
    card = await _owned_card_or_404(payload.card_id, user)
    entry = {
        "user_id": user["_id"],
        "card_id": card["_id"],
        "question": card["question"],
        "deck": card.get("deck", "General"),
        "result": payload.result,
        "studied_at": datetime.now(timezone.utc),
    }
    result = await history_collection.insert_one(entry)
    doc = await history_collection.find_one({"_id": result.inserted_id})
    return history_to_response(doc)


@app.get("/history", response_model=List[HistoryResponse])
async def my_history(user: dict = Depends(get_current_user)):
    items = []
    cursor = history_collection.find({"user_id": user["_id"]}).sort("studied_at", -1)
    async for doc in cursor:
        items.append(history_to_response(doc))
    return items


@app.delete("/history", status_code=204)
async def clear_my_history(user: dict = Depends(get_current_user)):
    await history_collection.delete_many({"user_id": user["_id"]})


# --- Admin: view every user's learning history ------------------------------

@app.get("/admin/users", response_model=List[AdminUserSummary])
async def admin_list_users(_admin: dict = Depends(require_admin)):
    summaries = []
    async for u in users_collection.find().sort("created_at", 1):
        summaries.append(
            {
                "id": str(u["_id"]),
                "username": u["username"],
                "role": u["role"],
                "card_count": await flashcards_collection.count_documents(
                    {"owner_id": u["_id"]}
                ),
                "history_count": await history_collection.count_documents(
                    {"user_id": u["_id"]}
                ),
            }
        )
    return summaries


@app.get("/admin/history", response_model=List[AdminHistoryResponse])
async def admin_history(
    user_id: Optional[str] = None, _admin: dict = Depends(require_admin)
):
    query = {}
    if user_id:
        if not ObjectId.is_valid(user_id):
            raise HTTPException(status_code=400, detail="Invalid user ID")
        query["user_id"] = ObjectId(user_id)

    # Map user ids -> usernames once, then annotate each history row.
    names = {u["_id"]: u["username"] async for u in users_collection.find()}
    items = []
    cursor = history_collection.find(query).sort("studied_at", -1)
    async for doc in cursor:
        row = history_to_response(doc)
        row["user_id"] = str(doc["user_id"])
        row["username"] = names.get(doc["user_id"], "(deleted user)")
        items.append(row)
    return items
