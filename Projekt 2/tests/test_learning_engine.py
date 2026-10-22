# tests/test_learning_engine.py
import pytest
import sys
import os
import time

# Pfad-Anpassung, damit die Module im backend/src Ordner gefunden werden
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "src")))

from models import Flashcard, FlashcardProgress
from learning_engine import LearningEngine

# =====================================================================
# Z - ZERO: Testen mit leeren Datenstrukturen oder 0 Elementen
# =====================================================================

def test_zero_cards_registration():
    """ZOMBIES - Zero: Keine Karten übergeben -> Progress-Liste bleibt leer."""
    engine = LearningEngine([])
    engine.ensure_cards_registered([])  # Leere Liste übergeben
    assert len(engine.get_all_progress()) == 0


# =====================================================================
# O - ONE: Testen mit genau 1 Element
# =====================================================================

def test_one_card_registration():
    """ZOMBIES - One: Genau eine Karte übergeben -> Korrekt in Box 1 registriert."""
    card = Flashcard(id="card-1", question="Was ist FIFO?", answer="First In First Out", chapter="Kapitel 1")
    engine = LearningEngine([])
    
    engine.ensure_cards_registered([card])
    progress = engine.get_all_progress()
    
    assert len(progress) == 1
    assert progress[0].card_id == "card-1"
    assert progress[0].box == 1


# =====================================================================
# M - MANY: Testen mit mehreren Elementen
# =====================================================================

def test_many_cards_registration_skips_duplicates():
    """ZOMBIES - Many: Mehrere Karten übergeben, aber Duplikate werden nicht doppelt registriert."""
    card1 = Flashcard(id="card-1", question="Q1", answer="A1", chapter="Cap 1")
    card2 = Flashcard(id="card-2", question="Q2", answer="A2", chapter="Cap 1")
    
    # Bereits existierender Fortschritt für card-1
    existing_progress = FlashcardProgress(card_id="card-1", box=2, last_reviewed=10.0, next_review_due=20.0)
    
    engine = LearningEngine([existing_progress])
    
    # Registriere beide Karten (card-1 existiert schon, card-2 ist neu)
    engine.ensure_cards_registered([card1, card2])
    
    progress_map = {p.card_id: p for p in engine.get_all_progress()}
    
    assert len(progress_map) == 2
    # card-1 darf NICHT auf Box 1 überschrieben werden, sondern muss in Box 2 bleiben
    assert progress_map["card-1"].box == 2
    # card-2 muss neu in Box 1 angelegt werden
    assert progress_map["card-2"].box == 1


# =====================================================================
# B - BOUNDARY BEHAVIORS: Grenzwerte testen (Boxen-Limits 1 und 3)
# =====================================================================

def test_boundary_box_upper_limit():
    """ZOMBIES - Boundary: Eine Karte in Box 3 darf bei Rating 3 (richtig) nicht über Box 3 aufsteigen."""
    progress = FlashcardProgress(card_id="card-1", box=3, last_reviewed=0.0, next_review_due=0.0)
    engine = LearningEngine([progress])
    
    updated = engine.review_card("card-1", rating=3)
    assert updated.box == 3  # Bleibt auf dem Maximum von 3 begränzt


def test_boundary_box_lower_limit_falls_to_one():
    """ZOMBIES - Boundary: Eine falsche Antwort (Rating 1) wirft eine Karte aus Box 3 komplett zurück in Box 1."""
    progress = FlashcardProgress(card_id="card-1", box=3, last_reviewed=0.0, next_review_due=0.0)
    engine = LearningEngine([progress])
    
    updated = engine.review_card("card-1", rating=1)
    assert updated.box == 1  # Fällt ganz nach unten


# =====================================================================
# I - INTERFACE DEFINITIONS: Fehlerbehandlung und korrekte API-Schnittstellen
# =====================================================================

def test_interface_raises_value_error_for_unknown_card():
    """ZOMBIES - Interface: Bewertung einer nicht registrierten Karte wirft einen ValueError."""
    engine = LearningEngine([])
    
    with pytest.raises(ValueError) as exc_info:
        engine.review_card("unknown-id", rating=3)
        
    assert "nicht registriert" in str(exc_info.value)


# =====================================================================
# S - SIMPLE SCENARIOS: Typische Standard-Lernabläufe und Intervalle
# =====================================================================

def test_simple_review_flow_and_intervals():
    """ZOMBIES - Simple Scenario: Normaler Durchlauf einer Karte von Box 1 nach Box 2 mit Intervall-Berechnung."""
    progress = FlashcardProgress(card_id="card-1", box=1, last_reviewed=0.0, next_review_due=0.0)
    engine = LearningEngine([progress])
    
    current_time = time.time()
    updated = engine.review_card("card-1", rating=3)  # Richtig beantwortet
    
    assert updated.box == 2
    assert updated.last_reviewed >= current_time
    # Für Box 2 ist das Intervall 60 Sekunden. Das Fälligkeitsdatum muss also ca. current_time + 60 sein
    assert updated.next_review_due >= current_time + 59
    assert updated.next_review_due <= current_time + 61


def test_simple_get_due_cards():
    """ZOMBIES - Simple Scenario: Holt nur die Karten, deren Fälligkeitsdatum abgelaufen ist."""
    card1 = Flashcard(id="card-1", question="Q1", answer="A1", chapter="C1")
    card2 = Flashcard(id="card-2", question="Q2", answer="A2", chapter="C1")
    
    current_time = time.time()
    
    # card-1 ist fällig (next_review_due liegt in der Vergangenheit)
    p1 = FlashcardProgress(card_id="card-1", box=1, last_reviewed=0.0, next_review_due=current_time - 10)
    # card-2 ist noch nicht fällig (next_review_due liegt in der Zukunft)
    p2 = FlashcardProgress(card_id="card-2", box=1, last_reviewed=0.0, next_review_due=current_time + 100)
    
    engine = LearningEngine([p1, p2])
    due_cards = engine.get_due_cards([card1, card2])
    
    assert len(due_cards) == 1
    assert due_cards[0].id == "card-1"