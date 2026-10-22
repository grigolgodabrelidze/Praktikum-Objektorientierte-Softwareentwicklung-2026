import random
import json
import os
from datetime import date
from pathlib import Path

import requests
import bcrypt
from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from backend.guess_engine import compare_movies
from backend.tmdb_client import (
    BASE_URL,
    TMDB_API_KEY,
    TmdbConfigError,  
    get_movie_details,
    search_movies,
)

## --- FastAPI-Setup ---
app = FastAPI(title="Filmdle API", version="2.0")


FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"
MAX_GUESSES = 6
PUZZLE_START_DATE = date(2025, 1, 1)

# --- Echte Speicherung für Benutzer (überlebt Neustarts) ---
USERS_FILE = "users.json"


# --- Hilfsfunktionen für Benutzerverwaltung ---
def load_users():
    if os.path.exists(USERS_FILE):
        with open(USERS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

def save_users():
    with open(USERS_FILE, "w", encoding="utf-8") as f:
        json.dump(users_db, f, indent=4)

users_db = load_users()

class UserAuth(BaseModel):
    username: str
    password: str

class GuessRequest(BaseModel):
    movie_id: int

# --- TMDB-Integration: Top 500 Filme abrufen ---
def get_top_500_movie_ids():
    """Kombiniert die ersten 25 Seiten der am besten bewerteten Filme von TMDB (500 Filme)."""
    movie_ids = []
    # 25 Seiten * 20 Filme pro Seite = 500 Filme
    for page in range(1, 26):
        url = f"{BASE_URL}/movie/top_rated"
        params = {"api_key": TMDB_API_KEY, "language": "de-DE", "page": page}
        try:
            response = requests.get(url, params=params, timeout=5)
            if response.status_code == 200:
                results = response.json().get("results", [])
                for movie in results:
                    movie_ids.append(movie["id"])
        except Exception:
            continue

    # Fallback, falls die TMDB-API mal offline ist
    return movie_ids if movie_ids else [27205, 603]


# --- Tägliche Logik (Dynamische ID-Auswahl via Seed) ---
GOOD_MOVIE_IDS = get_top_500_movie_ids()

heute_string = str(date.today())
random.seed(heute_string)
DAILY_MOVIE_ID = random.choice(GOOD_MOVIE_IDS)
random.seed(None)  # Seed direkt wieder zurücksetzen


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# REST-API-Endpunkte für Registrierung und Login
@app.post("/api/auth/register", status_code=status.HTTP_201_CREATED)
def register(user: UserAuth):
    """Legt ein neues Benutzerkonto an und speichert das Passwort gehasht."""
    if user.username in users_db:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Benutzername bereits vergeben."
        )
    password_bytes = user.password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password_bytes, salt)
    
    users_db[user.username] = {"password_hash": hashed_password.decode('utf-8')}
    save_users() # Nutzer in der json-Datei abspeichern
    
    return {"message": "Konto erfolgreich angelegt!"}


@app.post("/api/auth/login")
def login(user: UserAuth):
    """Überprüft die Anmeldedaten und gibt ein vorläufiges Session-Token zurück."""
    db_user = users_db.get(user.username)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Ungültiger Benutzername oder Passwort."
        )
    password_bytes = user.password.encode('utf-8')
    hash_bytes = db_user["password_hash"].encode('utf-8')
    if not bcrypt.checkpw(password_bytes, hash_bytes):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Ungültiger Benutzername oder Passwort."
        )
    dummy_token = f"session-token-for-{user.username}"
    return {
        "status": "success",
        "token": dummy_token,
        "message": "Erfolgreich angemeldet!"
    }

# REST-API-Endpunkte für das Spiel
@app.get("/api/daily-movie")
def get_daily_movie_info():
    """Liefert verschleierte Hinweise zum Tagesfilm."""
    try:
        target_movie = get_movie_details(DAILY_MOVIE_ID)
    except Exception as error:  
        raise HTTPException(status_code=503, detail=str(error)) from error

    if not target_movie:
        raise HTTPException(
            status_code=502,
            detail="Tagesfilm konnte nicht von TMDB geladen werden. Prüfe TMDB_API_KEY.",
        )

    puzzle_number = (date.today() - PUZZLE_START_DATE).days + 1

    return {
        "puzzle_number": puzzle_number,
        "title_length": len(target_movie["title"]),
        "genre_count": len(target_movie["genres"]),
        "max_guesses": MAX_GUESSES,
        "status": "playing",
    }


@app.get("/api/search/movies")
def search_movies_endpoint(q: str = Query(min_length=2)):
    """Proxy zur TMDB-Suche, damit der API-Key im Backend bleibt."""
    try:
         return {"results": search_movies(q)}
    except Exception as error:
        raise HTTPException(status_code=503, detail=str(error)) from error


@app.post("/api/guess")
def submit_guess(request: GuessRequest):
    """Vergleicht den Tipp mit dem Tagesfilm und liefert farbiges Feedback."""
    guessed_movie = get_movie_details(request.movie_id)
    if not guessed_movie:
        raise HTTPException(
            status_code=404, detail="Getippter Film wurde bei TMDB nicht gefunden."
        )

    target_movie = get_movie_details(DAILY_MOVIE_ID)
    if not target_movie:
         raise HTTPException(
            status_code=500, detail="Tagesfilm konnte nicht geladen werden."
        )

    feedback_matrix = compare_movies(guessed_movie, target_movie)
    is_correct = request.movie_id == DAILY_MOVIE_ID
    status = "won" if is_correct else "playing"

    return {
        "status": status,
        "feedback": feedback_matrix,
        "guessed_title": guessed_movie["title"],
        "title": target_movie["title"],
    }


@app.get("/")
def serve_index():
    return FileResponse(FRONTEND_DIR / "index.html")


app.mount("/css", StaticFiles(directory=FRONTEND_DIR / "css"), name="css")
app.mount("/js", StaticFiles(directory=FRONTEND_DIR / "js"), name="js")