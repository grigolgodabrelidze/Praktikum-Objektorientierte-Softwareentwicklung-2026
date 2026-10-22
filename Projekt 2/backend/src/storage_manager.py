# backend/src/storage_manager.py
import json
import os
from typing import List
from backend.src.models import Flashcard, FlashcardProgress

class StorageManager:
    def __init__(self, data_dir: str = "data"):
        self.data_dir = data_dir
        self.cards_file = os.path.join(data_dir, "flashcards.json")
        
        # Sicherstellen, dass der Datenordner existiert
        os.makedirs(self.data_dir, exist_ok=True)

    def save_flashcards(self, cards: List[Flashcard]) -> None:
        """Speichert eine Liste von Flashcard-Objekten als JSON ab."""
        with open(self.cards_file, "w", encoding="utf-8") as f:
            json.dump([card.to_dict() for card in cards], f, indent=4, ensure_ascii=False)

    def load_flashcards(self) -> List[Flashcard]:
        """Lädt alle Karteikarten aus der JSON-Datei."""
        if not os.path.exists(self.cards_file):
            return []
        
        with open(self.cards_file, "r", encoding="utf-8") as f:
            try:
                data = json.load(f)
                return [Flashcard.from_dict(item) for item in data]
            except json.JSONDecodeError:
                return []

    def save_progress(self, progress_list: List[FlashcardProgress]) -> None:
        """Speichert den Leitner-Lernfortschritt in progress.json."""
        progress_file = os.path.join(self.data_dir, "progress.json")
        with open(progress_file, "w", encoding="utf-8") as f:
            json.dump([p.to_dict() for p in progress_list], f, indent=4, ensure_ascii=False)

    def load_progress(self) -> List[FlashcardProgress]:
        """Lädt den Leitner-Lernfortschritt aus progress.json."""
        progress_file = os.path.join(self.data_dir, "progress.json")
        if not os.path.exists(progress_file):
            return []
        
        with open(progress_file, "r", encoding="utf-8") as f:
            try:
                data = json.load(f)
                return [FlashcardProgress.from_dict(item) for item in data]
            except json.JSONDecodeError:
                return []        
    