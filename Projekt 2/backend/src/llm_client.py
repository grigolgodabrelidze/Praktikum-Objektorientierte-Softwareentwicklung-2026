# backend/src/llm_client.py
import os
import json
import re
import uuid
from google import genai
from typing import List, Dict
from dotenv import load_dotenv, find_dotenv

class LLMClient:
    def __init__(self):
        # Lade Umgebungsvariablen aus der .env Datei
        load_dotenv(find_dotenv())
        api_key = os.getenv("GEMINI_API_KEY")
        
        if not api_key:
            raise ValueError("GEMINI_API_KEY wurde nicht in den Umgebungsvariablen gefunden.")
        
        # Konfiguriere Gemini SDK (v1 API)
        self.client = genai.Client(
            api_key=api_key, 
            http_options={'api_version': 'v1'}
        )
        
        # Den Modellnamen als einfachen String speichern
        self.model_name = 'gemini-3.1-flash-lite'

    def ask_question(self, context: str, question: str) -> str:       
        prompt = f"""
        Du bist ein hilfreicher und kompetenter Uni-Tutor.
        Beantworte die folgende Frage des Studierenden AUSSCHLIESSLICH basierend auf dem unten stehenden Kontext.
        Wenn die Antwort nicht im Kontext enthalten ist, antworte ehrlich, dass du es basierend auf dem Material nicht beantworten kannst.
        Erfinde keine Informationen.

        WICHTIGE REGELN FÜR DEINE ANTWORT:
        - Fasse dich kurz, präzise und leicht verständlich (max. 2-3 Absätze).
        - Nutze gerne Markdown-Aufzählungszeichen, um komplexe Sachverhalte zu strukturieren.
        - Verwende KEIN LaTeX (keine $-Zeichen). Schreibe mathematische Formeln und Sonderzeichen als reinen Text aus.

        Kontext:
        {context}

        Frage: {question}
        """
        
        response = self.client.models.generate_content(model=self.model_name, contents=prompt)
        return response.text.strip()

    def generate_flashcards(self, chapter: str, context: str, num_cards: int = 5, prompt_detail: str = "short") -> tuple[List[Dict], int]:
        """
        Generiert Karteikarten im strikten JSON-Format und passt die Ausführlichkeit
        anhand des Frontend-Schalters (prompt_detail) an.
        """
        
        # 1. Basis-Regeln für die saubere Technik (Bleiben immer gleich)
        base_rules = f"""
        TECHNISCHE REGELN FÜR DEN OUTPUT:
        1. Gib AUSSCHLIESSLICH ein valides JSON-Array zurück.
        2. Keine Einleitung, kein Fazit, keine Markdown-Codeblöcke (wie ```json).
        3. Jedes Objekt im Array muss exakt folgende Keys haben:
           - "id": Eine eindeutige UUID (als String)
           - "question": Die Frage zur Karte
           - "answer": Die Antwort
           - "chapter": Der Wert "{chapter}"
        4. WICHTIG: Vermeide komplexe LaTeX-Befehle, Formel-Umgebungen oder Sonderzeichen, die Parsing-Fehler verursachen könnten. Formuliere mathematische Konzepte als reinen Text.
        """
        
        # 2. Inhaltliche Regeln je nach Schalter-Position
        if prompt_detail == "detailed":
            content_rules = """
            INHALTLICHE REGELN FÜR GUTE KARTEIKARTEN (AUSFÜHRLICH):
            - Gehe tief ins Detail und erkläre die Konzepte umfassend.
            - Die Antworten ("answer") dürfen gerne 3-5 Sätze lang sein und konkrete Beispiele aus dem Text enthalten.
            - Konzentriere dich nicht nur auf Definitionen, sondern auch auf das "Warum" und "Wie" der Konzepte.
            """
        else:
            content_rules = """
            INHALTLICHE REGELN FÜR GUTE KARTEIKARTEN (KURZ & KNAPP):
            - Konzentriere dich auf die absolut wichtigsten Kernkonzepte und Definitionen.
            - Halte die Antworten ("answer") extrem prägnant und leicht lernbar (maximal 1-2 kurze Sätze oder Stichpunkte).
            - Die Karteikarten müssen schnell lesbar sein (klassischer Flashcard-Stil).
            """

        # 3. Den endgültigen Prompt für die KI zusammensetzen
        prompt = f"""
        Erstelle genau {num_cards} Karteikarten aus dem folgenden Vorlesungsmaterial zum Kapitel "{chapter}".
        
        {content_rules}
        
        {base_rules}

        Kontext:
        {context}
        """
        
        # KI aufrufen
        response = self.client.models.generate_content(model=self.model_name, contents=prompt)
        
        # Tokens auslesen
        tokens = response.usage_metadata.total_token_count if response.usage_metadata else 0
        
        raw_text = response.text.strip()
        
        # Parser-Schritt 1: Bereinige den Output von Markdown-Rückständen
        clean_json_str = re.sub(r'^```json\s*', '', raw_text)
        clean_json_str = re.sub(r'\s*```$', '', clean_json_str)
        
        # Parser-Schritt 2: Filter für LaTeX-Reste
        clean_json_str = re.sub(r'\\textbf\{([^}]+)\}', r'\1', clean_json_str)
        clean_json_str = re.sub(r'\\textit\{([^}]+)\}', r'\1', clean_json_str)
        
        try:
            cards = json.loads(clean_json_str)
            for card in cards:
                if not card.get("id"):
                    card["id"] = str(uuid.uuid4())
                if not card.get("chapter"):
                    card["chapter"] = chapter
            return cards, tokens
            
        except json.JSONDecodeError as e:
            print(f"JSON Parsing-Fehler: {e}")
            print(f"Roher Text der KI war: {clean_json_str}")
            return [], tokens
    
    def evaluate_answer(self, question: str, correct_answer: str, user_answer: str) -> tuple[dict, int]:
        prompt = f"""
        Du bist ein strenger, aber fairer Tutor für Informatik.
        Bewerte die folgende Antwort eines Studierenden auf die gestellte Karteikarten-Frage.

        Frage: {question}
        Musterantwort: {correct_answer}
        Antwort des Studierenden: {user_answer}

        Bitte erstelle eine Bewertung im JSON-Format mit genau folgenden Feldern:
        1. "accuracy": Eine Zahl von 0 bis 100 für die Genauigkeit/Richtigkeit der Antwort.
        2. "completeness": Eine Zahl von 0 bis 100 für die Vollständigkeit der Antwort.
        3. "feedback": Ein kurzes, konstruktives Feedback (max. 2-3 Sätze, reiner Text ohne Markdown/LaTeX).

        Gib AUSSCHLIESSLICH das valide JSON-Objekt zurück, sonst nichts.
        """
        response = self.client.models.generate_content(
            model=self.model_name,
            contents=prompt
        )

        tokens = response.usage_metadata.total_token_count if response.usage_metadata else 0
        raw_text = response.text.strip()

        # JSON aus der KI-Antwort parsen
        try:
            # Entferne eventuelle Markdown-Codeblock-Formtierungen ```json ... ```
            clean_json = raw_text.replace("```json", "").replace("```", "").strip()
            data = json.loads(clean_json)
        except Exception:
            # Fallback, falls die KI kein sauberes JSON geliefert hat
            data = {
                "accuracy": 50,
                "completeness": 50,
                "feedback": raw_text
            }

        return data, tokens 