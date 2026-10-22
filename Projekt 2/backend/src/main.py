"""Echte API-Implementierung fuer Lernwerkzeug 67.

Ersetzt das Mock-Skelett von Person C durch die echten Services von Person A/B
(StorageManager, LLMClient, LearningEngine, ScriptParser).
"""

import os
import shutil
import time
from typing import Literal, List
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.src.models import (
    Flashcard, 
    FlashcardProgress, 
    Chapter, 
    ProgressRequest, 
    FlashcardWithProgress, 
    AskQuestionRequest, 
    AskQuestionResponse, 
    GenerateCardsRequest, 
    GenerateCardsResponse, 
    ReviewCardRequest, 
    EvaluateRequest, 
    EvaluateResponse
)
from backend.src.storage_manager import StorageManager
from backend.src.learning_engine import LearningEngine
from backend.src.llm_client import LLMClient
from backend.src.script_parser import ScriptParser

# --- Instanziierung der Backend-Dienste ---
app = FastAPI(title="Lernwerkzeug 67 API")

# CORS konfigurieren
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

storage = StorageManager()
parser = ScriptParser()
llm = LLMClient()


# --- API Endpunkte ---

# Dieser Endpunkt listet alle Kapitel auf, die im data/-Ordner verfügbar sind, damit der Nutzer sie im Frontend auswählen kann.
@app.get("/api/chapters", response_model=list[Chapter])
def get_chapters() -> list[Chapter]:
    """Liest die echten Skriptdateien aus dem data/-Ordner aus."""
    try:
        files = os.listdir(parser.data_dir)
        script_files = [f for f in files if f.endswith((".txt", ".tex", ".pdf"))]
        
        return [
            Chapter(
                id=f, 
                title=f.replace(".txt", "").replace(".tex", "").replace(".pdf", "").replace("_", " ").capitalize()
            ) for f in script_files
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fehler beim Laden der Kapitel: {str(e)}")

# Dieser Endpunkt ermöglicht das Hochladen von Skriptdateien (Text, LaTeX oder PDF) in den data/-Ordner, wo sie dann vom Parser verarbeitet werden können.
@app.post("/api/chapters/upload")
def upload_chapters(files: List[UploadFile] = File(...)):
    try:
        uploaded_files = []
        for file in files:
            file_path = os.path.join(parser.data_dir, file.filename)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            uploaded_files.append({"id": file.filename, "title": file.filename})
            
        # Gibt das erste hochgeladene Kapitel zur automatischen Auswahl im Frontend zurück
        last_file = uploaded_files[-1] if uploaded_files else {"id": "", "title": ""}
        return {
            "id": last_file["id"], 
            "message": f"{len(uploaded_files)} Datei(en) erfolgreich hochgeladen",
            "files": uploaded_files
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Upload fehlgeschlagen: {str(exc)}")


# Dieser Endpunkt beantwortet Fragen basierend auf dem echten Skript-Kontext. 
# Er ruft den Parser auf, um den Text des ausgewählten Kapitels zu laden, und verwendet dann den LLM-Client, um die Frage zu beantworten.
@app.post("/api/chat/ask", response_model=AskQuestionResponse)
def ask_question(request: AskQuestionRequest) -> AskQuestionResponse:
    try:
        context = parser.load_chapter_text(request.chapter_id)
        answer = llm.ask_question(context, request.question)
        return AskQuestionResponse(answer=answer)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    
# Dieser Endpunkt aktualisiert den Leitner-Fortschritt einer Karte basierend auf der Bewertung des Nutzers.
@app.post("/api/progress")
def update_progress(request: ProgressRequest):
    try:
        progress_data = storage.load_progress()
        card_progress = progress_data.get(request.card_id, {"box": 1, "last_reviewed": 0.0, "next_review_due": 0.0})
        
        if request.rating == 0:  
            card_progress["box"] = 1
        elif request.rating == 1:  
            card_progress["box"] = min(3, card_progress.get("box", 1) + 1)
        elif request.rating >= 2:  
            card_progress["box"] = min(5, card_progress.get("box", 1) + 2)
            
        card_progress["last_reviewed"] = time.time()
        progress_data[request.card_id] = card_progress
        storage.save_progress(progress_data)
        
        return {
            "status": "success", 
            "message": "Fortschritt gespeichert", 
            "new_box": card_progress["box"]
        }
    except Exception as exc:
        print(f"Fehler beim Speichern des Fortschritts: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))

# Dieser Endpunkt generiert Karteikarten basierend auf dem ausgewählten Kapitel und der gewünschten Anzahl von Karten.
@app.post("/api/generate", response_model=GenerateCardsResponse)
def generate_cards(request: GenerateCardsRequest) -> GenerateCardsResponse:
    try:
        context = parser.load_chapter_text(request.chapter_id)
        
        raw_cards, tokens = llm.generate_flashcards(
            request.chapter_id, 
            context, 
            request.num_cards,
            request.prompt_detail
        )
        
        cards = [Flashcard(**card) for card in raw_cards]
        
        # Tokens an das Frontend zurückgeben, damit der Ladebalken gefüllt wird
        return GenerateCardsResponse(
            cards=cards,
            tokens_used=tokens,
            token_limit=250000
        )
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

# Dieser Endpunkt lädt alle gespeicherten Karteikarten und deren Fortschritt.
@app.get("/api/cards", response_model=list[FlashcardWithProgress])
def get_cards() -> list[FlashcardWithProgress]:
    cards = storage.load_flashcards()
    progress_list = storage.load_progress()
    
    engine = LearningEngine(progress_list)
    engine.ensure_cards_registered(cards)
    storage.save_progress(engine.get_all_progress())
    
    progress_map = {p.card_id: p for p in engine.get_all_progress()}
    
    return [
        FlashcardWithProgress(**card.model_dump(), progress=progress_map[card.id])
        for card in cards
    ]

# Dieser Endpunkt speichert eine Karteikarte dauerhaft in der JSON-Datei. Wenn die Karte bereits existiert, wird sie nicht erneut gespeichert.
@app.post("/api/cards/save", response_model=Flashcard)
def save_card(card: Flashcard) -> Flashcard:
    """Persistent in JSON sichern."""
    try:
        cards = storage.load_flashcards()
        if not any(c.id == card.id for c in cards):
            cards.append(card)
            storage.save_flashcards(cards)
        return card
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Speicherfehler: {str(e)}")

# Dieser Endpunkt aktualisiert den Leitner-Fortschritt einer Karte basierend auf der Bewertung des Nutzers.
@app.put("/api/cards/{card_id}/review", response_model=FlashcardProgress)
def review_card(card_id: str, request: ReviewCardRequest) -> FlashcardProgress:
    """Aktualisiert das Leitner-Intervall."""
    progress_list = storage.load_progress()
    engine = LearningEngine(progress_list)
    
    try:
        updated_progress = engine.review_card(card_id, request.rating)
        storage.save_progress(engine.get_all_progress())
        return updated_progress
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

# Dieser Endpunkt analysiert die Texteingabe des Nutzers mithilfe der KI und gibt Feedback, Genauigkeit und Vollständigkeit zurück.
@app.post("/api/cards/{card_id}/evaluate", response_model=EvaluateResponse)
def evaluate_user_answer(card_id: str, request: EvaluateRequest) -> EvaluateResponse:
    try:
        all_cards = storage.load_flashcards()
        card = next((c for c in all_cards if c.id == card_id), None)
        
        if not card:
            raise HTTPException(status_code=404, detail="Karte nicht gefunden")

        # Rufen jetzt die aktualisierte Methode auf, die ein Dict liefert
        eval_data, tokens = llm.evaluate_answer(
            question=card.question,
            correct_answer=card.answer,
            user_answer=request.answer 
        )

        return EvaluateResponse(
            feedback=eval_data.get("feedback", ""),
            accuracy=int(eval_data.get("accuracy", 0)),
            completeness=int(eval_data.get("completeness", 0)),
            total_tokens=tokens
        )
    except Exception as exc:
        print(f"Fehler bei der KI-Bewertung: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))