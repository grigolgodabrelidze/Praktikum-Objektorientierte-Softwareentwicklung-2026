import os

import requests
from dotenv import load_dotenv

load_dotenv()

TMDB_API_KEY = os.getenv("TMDB_API_KEY")
BASE_URL = "https://api.themoviedb.org/3"


class TmdbConfigError(Exception):
    """TMDB ist nicht konfiguriert oder der Key fehlt."""

# Funktion, die sicherstellt, dass der TMDB-API-Key gesetzt ist. Wenn nicht, wird eine TmdbConfigError-Ausnahme ausgelöst.
def _ensure_api_key():
    if not TMDB_API_KEY or not TMDB_API_KEY.strip():
        raise TmdbConfigError(
            "TMDB_API_KEY fehlt. Lege eine .env-Datei im Projektroot an "
            "(siehe .env.example) und starte den Server neu."
        )

# Funktion, die eine GET-Anfrage an die TMDB-API sendet und die API-Key-Überprüfung durchführt.
def _tmdb_get(url: str, params: dict = None):
    _ensure_api_key()
    request_params = {"api_key": TMDB_API_KEY, **(params or {})}
    return requests.get(url, params=request_params, timeout=10)

# Funktion, welche die Filmdetails von TMDB abruft und in einem Format zurückgibt, das die Guess-Engine erwartet.
def get_movie_details(movie_id: int):
    try:
        movie_url = f"{BASE_URL}/movie/{movie_id}"
        response = _tmdb_get(movie_url)
    except TmdbConfigError:
        raise

    if response.status_code != 200:
        return None

    movie_data = response.json()
    release_date = movie_data.get("release_date", "")
    genres = [genre["name"] for genre in movie_data.get("genres", [])]

    credits_url = f"{BASE_URL}/movie/{movie_id}/credits"
    credits_response = _tmdb_get(credits_url)
    directors = []

    if credits_response.status_code == 200:
        crew = credits_response.json().get("crew", [])
        for member in crew:
            if member.get("job") == "Director":
                directors.append(member.get("name"))

    return {
        "title": movie_data.get("title"),
        "release_date": release_date,
        "genres": genres,
        "directors": directors,
    }

# Funktion, die Filme über TMDB für die Autocomplete-Suche im Frontend sucht.
def search_movies(query: str, limit: int = 8):
    """Sucht Filme über TMDB für die Autocomplete-Suche im Frontend."""
    cleaned_query = query.strip()
    if len(cleaned_query) < 2:
        return []

    search_url = f"{BASE_URL}/search/movie"
    params = {
        "query": cleaned_query,
        "include_adult": "false",
        "language": "de-DE",
    }

    try:
        response = _tmdb_get(search_url, params)
    except TmdbConfigError:
        raise

    if response.status_code != 200:
        return []

    results = []
    for movie in response.json().get("results", [])[:limit]:
        release_date = movie.get("release_date", "")
        year = release_date[:4] if release_date else "?"
        title = movie.get("title", "Unbekannt")
        results.append(
            {
                "id": movie["id"],
                "title": title,
                "year": year,
                "label": f"{title} ({year})",
            }
        )

    return results
