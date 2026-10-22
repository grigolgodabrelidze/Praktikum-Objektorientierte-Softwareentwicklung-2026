# backend/src/learning_engine.py
import time
from typing import List, Dict
from backend.src.models import Flashcard, FlashcardProgress

class LearningEngine:
    def __init__(self, progress_list: List[FlashcardProgress]):
        # Map für schnellen O(1) Zugriff via card_id
        self.progress_map: Dict[str, FlashcardProgress] = {
            p.card_id: p for p in progress_list
        }

    def ensure_cards_registered(self, cards: List[Flashcard]) -> None:
        """Stellt sicher, dass jede Karteikarte einen Fortschrittseintrag in Box 1 hat."""
        current_time = time.time()
        for card in cards:
            if card.id not in self.progress_map:
                new_progress = FlashcardProgress(
                    card_id=card.id,
                    box=1,
                    last_reviewed=0.0,
                    next_review_due=current_time
                )
                self.progress_map[card.id] = new_progress

    def get_all_progress(self) -> List[FlashcardProgress]:
        """Gibt die aktualisierte Liste des gesamten Lernfortschritts zurück."""
        return list(self.progress_map.values())

    def review_card(self, card_id: str, rating: int) -> FlashcardProgress:
        """
        Bewertet eine Karte und verschiebt sie im Leitner-System.
        rating: 1 = Falsch, 2 = Teilweise, 3 = Vollständig richtig
        """
        if card_id not in self.progress_map:
            raise ValueError(f"Karte mit ID {card_id} ist nicht registriert.")
            
        progress = self.progress_map[card_id]
        current_time = time.time()
        
        progress.last_reviewed = current_time
        
        if rating == 3:
            # Vollständig richtig -> eine Box nach oben (maximal Box 3)
            progress.box = min(3, progress.box + 1)
        elif rating == 2:
            # Teilweise richtig -> bleibt in der aktuellen Box
            pass
        else:
            # Komplett falsch -> fällt immer zurück in Box 1
            progress.box = 1
            
        # Festlegen der neuen Fälligkeit (Beispiel-Intervalle für die Demo)
        # Box 1: in 10 Sekunden wieder fällig
        # Box 2: in 60 Sekunden wieder fällig
        # Box 3: in 300 Sekunden wieder fällig
        intervals = {1: 10, 2: 60, 3: 300}
        progress.next_review_due = current_time + intervals[progress.box]
        
        return progress

    def get_due_cards(self, cards: List[Flashcard]) -> List[Flashcard]:
        """Gibt alle Karteikarten zurück, die aktuell zur Wiederholung fällig sind."""
        current_time = time.time()
        due_card_ids = {
            p.card_id for p in self.progress_map.values() 
            if current_time >= p.next_review_due
        }
        return [card for card in cards if card.id in due_card_ids]