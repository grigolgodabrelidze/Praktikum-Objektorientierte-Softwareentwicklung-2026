# backend/src/models.py
from typing import Literal
from pydantic import BaseModel

LeitnerBox = Literal[1, 2, 3]

# --- Kern-Datenmodelle (Persistenz) ---

class Flashcard(BaseModel):
    id: str
    question: str
    answer: str
    chapter: str
    
    def to_dict(self) -> dict:
        return self.model_dump()

    @classmethod
    def from_dict(cls, data: dict) -> 'Flashcard':
        return cls(**data)


class FlashcardProgress(BaseModel):
    card_id: str
    box: int = 1               
    last_reviewed: float = 0.0 
    next_review_due: float = 0.0 

    def to_dict(self) -> dict:
        return self.model_dump()

    @classmethod
    def from_dict(cls, data: dict) -> 'FlashcardProgress':
        return cls(**data)


# --- API Request- & Response-Schemas (Für FastAPI) ---

class Chapter(BaseModel):
    id: str
    title: str

class ProgressRequest(BaseModel):
    card_id: str
    rating: int

class FlashcardWithProgress(Flashcard):
    progress: FlashcardProgress

class AskQuestionRequest(BaseModel):
    chapter_id: str
    question: str

class AskQuestionResponse(BaseModel):
    answer: str

class GenerateCardsRequest(BaseModel):
    chapter_id: str
    num_cards: int = 5
    prompt_detail: str = "short"

class GenerateCardsResponse(BaseModel):
    cards: list[Flashcard]

class ReviewCardRequest(BaseModel):
    rating: LeitnerBox

class EvaluateRequest(BaseModel):
    answer: str

class EvaluateResponse(BaseModel):
    feedback: str
    accuracy: int = 0
    completeness: int = 0
    total_tokens: int = 0