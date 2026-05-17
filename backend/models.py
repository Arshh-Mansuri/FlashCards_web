"""Pydantic schemas for request validation and response shaping."""
from typing import List, Optional

from pydantic import BaseModel, Field


# --- Users / auth -----------------------------------------------------------

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=30)
    password: str = Field(..., min_length=6, max_length=128)


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: str
    username: str
    role: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# --- Flashcards -------------------------------------------------------------

class FlashcardCreate(BaseModel):
    question: str = Field(..., min_length=1)
    answer: str = Field(..., min_length=1)
    deck: Optional[str] = "General"


class FlashcardUpdate(BaseModel):
    question: Optional[str] = Field(None, min_length=1)
    answer: Optional[str] = Field(None, min_length=1)
    deck: Optional[str] = None


class FlashcardResponse(BaseModel):
    id: str
    question: str
    answer: str
    deck: str


# --- Learning history -------------------------------------------------------

class HistoryCreate(BaseModel):
    card_id: str
    result: str = Field(..., pattern="^(known|unknown)$")


class HistoryResponse(BaseModel):
    id: str
    card_id: str
    question: str
    deck: str
    result: str
    studied_at: str


class AdminHistoryResponse(HistoryResponse):
    """Same as HistoryResponse but annotated with the owning user."""
    user_id: str
    username: str


class AdminUserSummary(BaseModel):
    id: str
    username: str
    role: str
    card_count: int
    history_count: int
