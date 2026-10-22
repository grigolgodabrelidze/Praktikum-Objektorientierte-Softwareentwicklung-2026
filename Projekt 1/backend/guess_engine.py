def compare_movies(guessed_movie: dict, target_movie: dict) -> dict:
    """
    Vergleicht den getippten Film mit dem Ziel-Film.
    Gibt ein detailreiches Feedback mit Farbcodes (green, yellow, red) zurück.
    """
    feedback = {}
    
    # 1. Titel-Abgleich
    if guessed_movie["title"] == target_movie["title"]:
        feedback["title"] = {"value": guessed_movie["title"], "color": "green"}
    else:
        feedback["title"] = {"value": guessed_movie["title"], "color": "red"}
        
    # 2. Erscheinungsjahr-Abgleich
    guessed_year = int(guessed_movie["release_date"][:4])
    target_year = int(target_movie["release_date"][:4])

    if guessed_year == target_year:
        feedback["release_year"] = {"value": guessed_year, "color": "green"}
    else:
        direction = "up" if target_year > guessed_year else "down"
        feedback["release_year"] = {
            "value": guessed_year, 
            "color": "incorrect", 
            "direction": direction
        }

    # 3. Regisseur-Abgleich
    if guessed_movie["directors"] == target_movie["directors"]:
        feedback["directors"] = {"value": guessed_movie["directors"], "color": "green"}
    else:
        # Prüfen, ob zumindest ein Regisseur übereinstimmt (Schnittmenge)
        common_directors = set(guessed_movie["directors"]) & set(target_movie["directors"])
        if common_directors:
            feedback["directors"] = {"value": guessed_movie["directors"], "color": "yellow"}
        else:
            feedback["directors"] = {"value": guessed_movie["directors"], "color": "red"}
        
    # 4. Genre-Abgleich (Teiltreffer möglich!)
    guessed_genres = set(guessed_genres for guessed_genres in guessed_movie["genres"])
    target_genres = set(target_genres for target_genres in target_movie["genres"])
    
    # Schnittmenge berechnen (Welche Genres haben beide?)
    matching_genres = guessed_genres.intersection(target_genres)
    
    if guessed_genres == target_genres:
        feedback["genres"] = {"value": guessed_movie["genres"], "color": "green"}
    elif len(matching_genres) > 0:
        feedback["genres"] = {"value": guessed_movie["genres"], "color": "yellow"} # Mindestens ein Genre stimmt!
    else:
        feedback["genres"] = {"value": guessed_movie["genres"], "color": "red"}
        
    return feedback