# Filmdle – tägliches Film-Ratespiel

Eine Web-App im Stil von Wordle, entstanden im Praktikum *Objektorientierte Softwareentwicklung* (POOSE, Universität Bonn, SoSe 2026). Man tippt einen Film, und der Server vergleicht ihn mit dem gesuchten Film: Jede Kategorie wird grün (richtig), gelb (teilweise richtig) oder rot (falsch) eingefärbt.

## Funktionen

- **Registrierung und Anmeldung** (Passwörter werden mit bcrypt gehasht)
- **Filmsuche mit Autocomplete** über die TMDB-API (der API-Schlüssel bleibt im Backend)
- **Rateversuch mit Feedback** je Kategorie: Titel, Erscheinungsjahr (mit Pfeil nach oben oder unten), Regisseur und Genres
- **Statistiken** (gespielte Spiele, Siege, Siegesserie, Versuche heute), im Browser gespeichert
- **Tests** für die Vergleichslogik (`pytest`)

## Technologien

| Bereich | Technologie |
|---|---|
| Backend | Python, FastAPI, Uvicorn |
| Externe Daten | [TMDB API](https://developer.themoviedb.org/docs) |
| Frontend | HTML, CSS, JavaScript (wird vom Backend ausgeliefert) |
| Tests | pytest |

## Starten

Voraussetzungen: Python 3.10 oder neuer und ein kostenloser TMDB-API-Schlüssel.

```bash
cd "Projekt 1"
python -m venv .venv
# Windows: .venv\Scripts\activate    macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt

# Schlüssel eintragen: .env.example nach .env kopieren und TMDB_API_KEY setzen
uvicorn backend.main:app --reload
```

Danach ist die App unter <http://127.0.0.1:8000> erreichbar.

Tests ausführen (im Ordner `Projekt 1`):

```bash
pytest
```

## Aufbau

```
Projekt 1/
├── backend/
│   ├── main.py               # FastAPI-App: Endpunkte und Auslieferung des Frontends
│   ├── guess_engine.py       # Vergleichslogik (Feedback je Kategorie)
│   ├── tmdb_client.py        # Anbindung an die TMDB-API
│   └── test_guess_engine.py  # Tests der Vergleichslogik
├── frontend/                 # index.html, css/, js/
├── docs/projektplan.md       # ursprünglicher Projektplan
├── UML.md                    # UML-Diagramm
└── FilmdleMockup.png         # Mockup aus der Planung
```

Wichtige API-Endpunkte: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/daily-movie`, `GET /api/search/movies?q=…`, `POST /api/guess`.

## Bekannte Einschränkungen

- Der gesuchte Film ist aktuell fest im Code hinterlegt und wechselt nicht täglich.
- Die Anmeldung ist vereinfacht (Dummy-Token) und nicht für den Produktivbetrieb gedacht.
- Nutzerdaten liegen lokal in einer `users.json`, die beim ersten Registrieren erzeugt wird. Es gibt keine Datenbank.

