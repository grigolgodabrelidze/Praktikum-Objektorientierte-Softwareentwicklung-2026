# Lernwerkzeug 67 – KI-gestützte Karteikarten aus Vorlesungsskripten

Ein Lernwerkzeug, entstanden im Praktikum *Objektorientierte Softwareentwicklung* (POOSE, Universität Bonn, SoSe 2026). Es liest Vorlesungsskripte ein, erzeugt daraus mit einem Sprachmodell (Google Gemini) Karteikarten und Quizfragen und verwaltet sie in einem Wiederholungssystem nach dem Leitner-Prinzip.

## Funktionen

- **Fragen zum Skript:** Chat, der Fragen zu einem ausgewählten Kapitel beantwortet, auf Basis des Skripttextes
- **Karteikarten generieren:** Kapitel auswählen, Anzahl festlegen, Karten erzeugen und gezielt in die Sammlung speichern
- **Lernmodus (Leitner-System):** Karten wandern je nach Bewertung (richtig, teilweise, falsch) zwischen den Boxen
- **Quiz-Modus:** Antworten werden vom Sprachmodell bewertet
- **Kapitel hochladen:** eigene Skripte als PDF oder Textdatei, die im Ordner `data/` abgelegt werden
- **Tests** für Lernlogik und Skript-Parser (`pytest`)

## Technologien

| Bereich | Technologie |
|---|---|
| Backend | Python, FastAPI, Uvicorn, pypdf |
| KI | Google Gemini API (`google-genai`) |
| Frontend | React 19, TypeScript, Vite, React Router |
| Datenhaltung | JSON-Dateien im Ordner `data/` |
| Tests | pytest |

## Starten

Voraussetzungen: Python 3.11 oder neuer, Node.js und ein kostenloser Gemini-API-Schlüssel aus [Google AI Studio](https://aistudio.google.com/apikey).

**1. Schlüssel eintragen:** `.env.example` nach `.env` kopieren (im Ordner `Projekt 2`) und `GEMINI_API_KEY` setzen.

**2. Skripte bereitstellen:** Die Vorlesungsskripte sind nicht im Repository enthalten. Lege eigene PDFs oder Textdateien in den Ordner `data/` (wird beim ersten Start angelegt) oder lade sie in der App hoch.

**3. Backend starten** (im Ordner `Projekt 2`):

```bash
python -m venv .venv
# Windows: .venv\Scripts\activate    macOS/Linux: source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.src.main:app --reload --port 8000
```

**4. Frontend starten** (in einem zweiten Terminal):

```bash
cd frontend
npm install
npm run dev
```

Die App ist danach unter <http://localhost:5173> erreichbar. Das Frontend leitet Anfragen unter `/api` an das Backend auf Port 8000 weiter.

**Tests** (im Ordner `Projekt 2`):

```bash
pytest
```

## Aufbau

```
Projekt 2/
├── backend/
│   ├── requirements.txt
│   └── src/
│       ├── main.py             # FastAPI-App mit den REST-Endpunkten
│       ├── llm_client.py       # Anbindung an die Gemini API (Prompts, Antworten parsen)
│       ├── learning_engine.py  # Leitner-System und Bewertung
│       ├── script_parser.py    # Skripte (PDF/Text) einlesen
│       ├── storage_manager.py  # Karten und Fortschritt als JSON speichern
│       └── models.py           # Datenmodelle
├── frontend/                   # React-App (Vite, TypeScript)
├── tests/                      # pytest-Tests
├── scripts/try_llm_client.py   # manuelles Testskript für die Gemini-Anbindung
└── docs/                       # Projektplan und Analysen
```

Wichtige API-Endpunkte: `GET /api/chapters`, `POST /api/chat/ask`, `POST /api/generate`, `GET /api/cards`, `POST /api/cards/save`, `PUT /api/cards/{id}/review`, `POST /api/cards/{id}/evaluate`.

## Dokumentation

- [`docs/projektplan.md`](docs/projektplan.md): ursprünglicher Projektplan mit UML-Diagramm
- [`docs/kapazitaetslimit_analyse.md`](docs/kapazitaetslimit_analyse.md): Analyse der Kapazitätsgrenzen des Sprachmodells
- [`docs/kognitionskompetenzen_analyse_alpro.txt`](docs/kognitionskompetenzen_analyse_alpro.txt): Analyse nach der Bloom'schen Taxonomie
- [`docs/evaluation.md`](docs/evaluation.md): kritische Evaluation des Werkzeugs

