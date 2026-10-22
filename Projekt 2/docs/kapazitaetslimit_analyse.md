# Analyse der Kapazitätslimits und mathematische Abschätzung

**Modell:** Gemini 3.1 Flash Lite (Kostenlose Stufe)

---

## 1. API- und Token-Grenzen des verwendeten Modells

Für unseren Prototypen nutzen wir das Modell `gemini-3.1-flash-lite` in der kostenlosen Stufe. Theoretisch besitzt die Modellfamilie ein Kontextfenster von bis zu 1.000.000 Tokens. Die empirischen Daten aus unserem Google Cloud Dashboard zeigen jedoch die tatsächlichen harten Limits der API in der Free Tier:

* **TPM (Tokens Per Minute):** 250.000 Tokens
* **RPM (Requests Per Minute):** 15 Anfragen
* **RPD (Requests Per Day):** 500 Anfragen
* **Output-Limit (pro Request):** 8.192 Tokens

## 2. Mathematische Abschätzung und Praxis-Benchmark

Um diese Limits in die Praxis zu übersetzen, ziehen wir folgende Durchschnittswerte heran:
* Eine textlastige Skriptseite (A4) enthält im Schnitt 400 Wörter. Das entspricht etwa **550 Tokens pro Seite**.
* Eine Präsentationsfolie enthält deutlich weniger Text, durchschnittlich etwa **150 Tokens pro Folie**.
* Eine generierte Karteikarte im JSON-Format verbraucht rund **80 Tokens**.

### Berechnung des tatsächlichen Input-Flaschenhalses (TPM-Limit):
Da wir maximal 250.000 Tokens pro Minute verarbeiten dürfen, liegt die theoretische absolute Obergrenze für einen einzelnen Skript-Upload bei:
* **Skriptseiten:** 250.000 Tokens / 550 Tokens pro Seite = **ca. 454 Seiten**
* **Präsentationsfolien:** 250.000 Tokens / 150 Tokens pro Folie = **ca. 1.666 Folien**

### Echtes Praxisbeispiel (Stresstest mit dem "Alpro"-Skript):
Ein typisches Vorlesungsskript (ca. 50 bis 150 Seiten) verbraucht meist zwischen 27.500 und 82.500 Tokens. Ein Test-Upload mit unserem realen und sehr umfangreichen "Alpro"-Vorlesungsskript (Algorithmen und Programmierung) ergab einen gemessenen Spitzenwert von **180.000 Tokens**. 

**Fazit der Abschätzung:**
Selbst ein extrem umfangreiches, echtes Uni-Skript mit 180K Tokens lastet das TPM-Limit von 250.000 Tokens "nur" zu 72 % aus. Das bedeutet, wir können selbst solch große Skripte **als Ganzes** an das Modell übergeben. Das verbessert die Usability massiv, da der Nutzer keine manuellen Seitenbereiche auswählen muss. 

Gleichzeitig zeigt dieser Benchmark aber auch die wahren Grenzen auf: Wenn ein Nutzer aus diesem 180K-Skript zweimal innerhalb einer Minute Karten generieren würde (180K + 180K = 360K Tokens), würde die API den zweiten Request sofort blockieren. Der wirkliche Flaschenhals in der Nutzung ist also nicht das eigentliche Kontextfenster des Modells (1 Million Tokens) oder die reine Textmenge, sondern die **Frequenz der Anfragen (15 RPM-Grenze)** sowie das **TPM-Limit bei schneller, paralleler Nutzung**.

## 3. Implementierte und zukünftige Strategien zum Umgang mit den Limits

Um die strengen Ratenbegrenzungen (insbesondere 15 RPM und 500 RPD) nicht zu verletzen, wurden verschiedene Strategien evaluiert und teilweise bereits implementiert:

### Strategie A: Reduktion der API-Calls durch optionale KI-Bewertung (Bereits implementiert!)
* **Konzept:** Ursprünglich feuerte das Frontend bei *jeder* Karteikarte sofort einen API-Call zur KI-Bewertung ab. Bei einem schnellen Lern-Rhythmus wurde das Limit von 15 Anfragen pro Minute (RPM) sofort gesprengt. Wir haben die UI/UX so umgebaut, dass sich die Karte zunächst nur umdreht (Musterlösung anzeigen). Die KI wird *nur* dann angefunkt, wenn der Nutzer explizit auf "KI-Feedback anfordern" klickt.
* **Effekt:** Spart schätzungsweise 80% der API-Calls (RPD) ein und verhindert RPM-Abstürze beim normalen Lernen.
* **Implementierungsaufwand:** Gering. Sehr nutzerfreundlich, da es zudem den manuellen Lernfluss (Flow) beschleunigt.

### Strategie B: Retrieval-Augmented Generation (RAG) für Skalierung (Zukunftsausblick)
* **Konzept:** Sollte die App später auf ganze Lehrbücher (über 454 Seiten) ausgeweitet werden, würde das 250K-TPM-Limit überschritten. Hier müsste das Skript beim Upload in Vektoren unterteilt werden (Vektordatenbank). Bei der Kartengenerierung oder im Chat werden dann nur die relevantesten Text-Chunks (z. B. 2.000 Tokens) an die KI gesendet.
* **Effekt:** Der Token-Verbrauch pro Anfrage sinkt dramatisch, wodurch das TPM-Limit praktisch nie erreicht wird.
* **Implementierungsaufwand:** Hoch. Erfordert eine komplexere Backend-Architektur (Embeddings & VectorDB).