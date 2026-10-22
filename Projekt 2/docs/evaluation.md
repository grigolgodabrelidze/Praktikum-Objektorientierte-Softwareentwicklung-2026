# Evaluation – POOSE Projekt 2

## 1. Mehrwert und Einsatz im Selbststudium

Im aktuellen Zustand unterstützt uns das **Lernwerkzeug 67** spürbar im Studium. Der größte Mehrwert liegt vor allem im immensen **Zeitgewinn**: Wir müssen Karteikarten nicht mehr manuell erstellen, da die Generierung automatisiert, zuverlässig und schnell funktioniert. 

Ein wesentlicher Vorteil gegenüber gewöhnlichen KI-Tools ist die **strikte Dokumentenbindung**. Sowohl die generierten Karteikarten als auch die Antworten auf Fragen basieren ausschließlich auf dem hochgeladenen Kontext. Dadurch lernt man exakt mit dem vorgegebenen Stoff der Universität, ohne dass KI-Halluzinationen oder abweichendes externes Wissen den Lernprozess verfälschen. 

Auch das integrierte Lernen nach dem **Leitner-Prinzip** erweist sich als sehr effektiv, da man sich gezielt auf eigene Schwachstellen fokussiert, während bereits gemeisterte Themenbereiche in den Hintergrund rücken.

### Einschränkungen & Grenzen:
* **Mangelnde Mobilität:** Im Vergleich zu herkömmlichen Karteikarten-Apps sind wir an den lokalen Computer gebunden.
* **Textbasiertes Parsing:** Unser `ScriptParser` verarbeitet bisher ausschließlich reinen Text aus PDFs. Visualisierungen wie Diagramme oder Graphen werden ignoriert, was die Nutzung in mathematischen oder visuell geprägten Modulen einschränkt.
* **Generisches Bewertungssystem:** Die KI-gestützte Antwortbewertung gibt zwar einen guten Richtwert zur Selbsteinschätzung, ist inhaltlich jedoch oft noch zu oberflächlich, um als vollwertiger Tutor zu dienen.

---

## 2. Kognitionskompetenzen (Bloom’sche Taxonomie)

Bezüglich der kognitiven Anforderungen spricht das Tool je nach Nutzung unterschiedliche Stufen an. Hierbei sind die **Qualität und Tiefe der Prompts** der entscheidende Faktor:

* **Niedrige Stufen (Erinnern, Verstehen):** Bei kurzen, simplen Anfragen neigt die KI dazu, reine Fakten und Definitionen aus dem Skript zu reproduzieren (z. B. *"Was ist die Definition eines Algorithmus?"*). Das deckt primär die erste und teilweise die zweite Stufe der Bloom’schen Taxonomie ab.
* **Höhere Stufen (Anwenden, Analysieren, Bewerten):** Sobald Anfragen explizit Begründungen, Beispiele oder Vergleiche einfordern, wird die KI zur aktiven Kontextverarbeitung gezwungen, was das Erreichen höherer Taxonomiestufen ermöglicht.

> **Fazit zur Kognition:** Das Tool eignet sich hervorragend, um kognitive Kompetenzen zu stärken – der Lernerfolg hängt jedoch stark vom bewussten und anspruchsvollen Prompting ab.

---

## 3. Technische Limits & Optimierungen

Bei der Analyse der technischen Rahmenbedingungen haben wir festgestellt, dass das Tool in der Lage ist, auch sehr umfangreiche Dokumente (wie das *AlPro*-Skript) als Ganzes zu verarbeiten. Der eigentliche Flaschenhals liegt jedoch in der **Frequenzbegrenzung (Rate Limits)**.

* **Frequenz-Engpass:** Mit einem Limit von 15 Anfragen pro Minute (RPM) schränkt das kostenlose Gemini-Modell ein, wie viele Karteikarten oder Abfragen kurz hintereinander verarbeitet werden können.
* **Implementierte UX-Optimierung:** Um API-Abstürze zu verhindern, wurde die KI-Bewertung bei Karteikarten optional gestaltet. Dadurch werden unnötige API-Calls eingespart und ein flüssiger Lernfluss gewährleistet.

---

## 4. Ausblick & Verbesserungsmöglichkeiten

Für zukünftige Iterationen des Projekts ergeben sich folgende konkrete Ansätze:

1. **Skalierung der Datenmengen (Vectordatenbank):** Einsatz einer Vektordatenbank (wie in der Kapazitätsanalyse beschrieben), um auch riesige Datenmengen effizient zu verarbeiten und Generierungszeiten ohne API-Engpässe zu verkürzen.
2. **Erweiterter Parser:** Ausbau des `ScriptParser`, sodass neben Texten auch Bilder, Formeln und visuelle Darstellungen aus den Dokumenten extrahiert und verstanden werden können.
3. **Ausbau der Benutzeroberfläche (UI):** Erweiterung um zusätzliche Interaktionsformen neben Karteikarten, Quiz und Chat – beispielsweise Multiple-Choice-Fragen oder tägliche KI-generierte Übungsaufgaben, die echten Klausuraufgaben ähneln.