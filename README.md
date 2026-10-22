# POOSE 2026 – zwei Teamprojekte

Dieses Repository enthält die beiden Projekte aus dem Praktikum **Objektorientierte Softwareentwicklung (POOSE)** an der Universität Bonn im Sommersemester 2026. Beide Projekte sind im Team entstanden: eine Python-/FastAPI-Anwendung mit Web-Oberfläche, die eine externe API anbindet, mit eigenem Webdienst, Tests und Dokumentation.

| Projekt | Beschreibung | Technologien |
|---|---|---|
| [**Projekt 1 – Filmdle**](Projekt%201) | Tägliches Film-Ratespiel im Stil von Wordle: Man rät Filme, der Server vergleicht Jahr, Genre und Regisseur mit dem gesuchten Film und gibt farbiges Feedback. | Python, FastAPI, TMDB-API, HTML/CSS/JavaScript, pytest |
| [**Projekt 2 – Lernwerkzeug 67**](Projekt%202) | KI-gestütztes Lernwerkzeug: Aus Vorlesungsskripten werden mit einem Sprachmodell Karteikarten und Quizfragen erzeugt, die in einem Leitner-System wiederholt werden. | Python, FastAPI, Google Gemini API, React, TypeScript, Vite, pytest |

Wie man die Projekte startet, steht in der README des jeweiligen Ordners.

## Hinweise

- **API-Schlüssel** sind nicht im Repository. Beide Projekte brauchen einen eigenen kostenlosen Schlüssel (TMDB bzw. Google AI Studio), siehe die jeweilige `.env.example`.
- **Vorlesungsskripte** (Datengrundlage von Projekt 2) sind aus Urheberrechtsgründen nicht enthalten. Eigene Texte oder PDFs lassen sich im Ordner `data/` von Projekt 2 ablegen.
