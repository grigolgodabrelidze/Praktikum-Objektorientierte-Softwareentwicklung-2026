import pytest
from backend.guess_engine import compare_movies

# === ZOMBIES: Z - Zero & I - Interface ===
def test_compare_movies_exact_match():
    movie_a = {
        "title": "Inception",
        "release_date": "2010-07-16",
        "genres": ["Action", "Sci-Fi"],
        "directors": ["Christopher Nolan"]
    }
    
    result = compare_movies(movie_a, movie_a)
    
    # Erwartung: Alles muss grün ("green") sein
    assert result["title"]["color"] == "green"
    assert result["release_year"]["color"] == "green"
    assert result["genres"]["color"] == "green"
    assert result["directors"]["color"] == "green"

# === ZOMBIES: O - One & B - Boundaries ===
def test_compare_movies_year_boundary_older():
    target_movie = {"title": "Inception", "release_date": "2010-01-01", "genres": [], "directors": []}
    guessed_movie = {"title": "Matrix", "release_date": "1999-01-01", "genres": [], "directors": []}
    
    result = compare_movies(guessed_movie, target_movie)
    
    # Der getippte Film ist älter, also muss die Farbe "incorrect" und die Richtung "up" sein
    assert result["release_year"]["color"] == "incorrect"
    assert result["release_year"]["direction"] == "up"

# === ZOMBIES: M - Many ===
def test_compare_movies_partial_genres():
    target_movie = {"title": "A", "release_date": "2000-01-01", "genres": ["Action", "Abenteuer"], "directors": []}
    guessed_movie = {"title": "B", "release_date": "2000-01-01", "genres": ["Action", "Drama"], "directors": []}
    
    result = compare_movies(guessed_movie, target_movie)
    
    # "Action" stimmt überein -> Farbe müsste je nach deiner Engine-Logik "yellow" oder "partial" sein
    # Wir prüfen hier auf das, was deine Engine für Teilübereinstimmungen setzt (meistens "yellow")
    assert result["genres"]["color"] in ["yellow", "partial"]

# === ZOMBIES: E - Exceptions ===
def test_compare_movies_missing_data():
    target_movie = {"title": "Inception", "release_date": "2010-01-01", "genres": [], "directors": []}
    guessed_movie = {"title": "Defekt", "genres": [], "directors": []}
    
    with pytest.raises(KeyError):
        compare_movies(guessed_movie, target_movie)
