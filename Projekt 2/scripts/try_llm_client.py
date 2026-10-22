# scripts/try_llm_client.py – manuelles Testskript (ruft die echte Gemini-API auf, braucht GEMINI_API_KEY)
import json
import sys
import os
from typing import List, Dict

# Pfad-Anpassung, damit Python sowohl 'backend' als auch 'backend/src' zuverlässig findet
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(current_dir)
sys.path.insert(0, root_dir)

from backend.src.llm_client import LLMClient


class FlashcardTester:
    """Service-Klasse zum isolierten Testen der LLM-Karteikartengenerierung."""

    def __init__(self):
        print("🔧 Initialisiere LLMClient...")
        try:
            self.client = LLMClient()
        except Exception as e:
            print(f"❌ Fehler bei der Initialisierung: {e}")
            sys.exit(1)

    def run_test(self, chapter: str, context: str, num_cards: int = 3) -> None:
        """Führt den Testlauf aus und delegiert die Ausgabe."""
        print(f"📡 Sende Kontext aus Kapitel '{chapter}' an Gemini...")
        print(f"⏳ Generiere {num_cards} Karteikarten. Bitte warten...\n")

        # Aufruf der zu testenden Methode
        cards: List[Dict] = self.client.generate_flashcards(
            chapter=chapter,
            context=context,
            num_cards=num_cards
        )

        self._print_results(cards)

    def _print_results(self, cards: List[Dict]) -> None:
        """Gekapselte Methode für die formatierte Konsolenausgabe."""
        print("=" * 60)
        print("🎉 GENERIERTER JSON-OUTPUT 🎉")
        print("=" * 60)

        if not cards:
            print("❌ FEHLER: Es wurden keine gültigen Karteikarten zurückgegeben.")
            return

        # Schön formatierte JSON-Ausgabe
        print(json.dumps(cards, indent=4, ensure_ascii=False))
        print("=" * 60)
        print(f"✅ Erfolgreich {len(cards)} Karteikarten generiert.")


if __name__ == "__main__":
    # Ein simulierter Textausschnitt aus eurem AlPro-Skript (inklusive LaTeX-Resten)
    TEST_CHAPTER = "3.4 Speicherverwaltung: Stack und Heap"
    TEST_CONTEXT = """<s
    Zur Laufzeit eines Programms wird der Arbeitsspeicher grob in zwei Bereiche unterteilt: den Stack und den Heap.
    Der Stack (Stapelspeicher) verwaltet Methodenaufrufe und lokale Variablen. Er arbeitet nach dem LIFO-Prinzip (Last-In-First-Out) und ist extrem schnell, aber in seiner Kapazität streng begrenzt.
    Der Heap (Haldenspeicher) hingegen wird für dynamisch erzeugte Objekte (z.B. mit dem \\textbf{new}-Schlüsselwort in Java) verwendet. Er ist deutlich größer, aber Zugriffe sind etwas langsamer. Ein sogenannter Garbage Collector räumt den Heap im Hintergrund automatisch auf, indem er Objekte löscht, auf die keine Referenzen mehr zeigen.
    """

    # Instanziierung und Ausführung des Services
    tester = FlashcardTester()
    tester.run_test(chapter=TEST_CHAPTER, context=TEST_CONTEXT, num_cards=3)