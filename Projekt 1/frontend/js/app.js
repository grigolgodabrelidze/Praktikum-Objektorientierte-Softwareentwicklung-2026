import { fetchDailyMovie, searchMovies, submitGuess, loginUser, registerUser } from "./api.js";

const MAX_GUESSES = 6;

// --- NEU: Dynamische Keys für jeden Nutzer ---
function getStatsKey() {
    const username = localStorage.getItem("username");
    return username ? `filmdle-stats-${username}` : "filmdle-stats-guest";
}

function getGameStateKey() {
    const username = localStorage.getItem("username");
    return username ? `filmdle-game-state-${username}` : "filmdle-game-state-guest";
}

const elements = {
    dailyTitle: document.getElementById("daily-title"),
    searchInput: document.getElementById("movie-search"),
    searchResults: document.getElementById("search-results"),
    guessButton: document.getElementById("guess-btn"),
    attemptHint: document.getElementById("attempt-hint"),
    guessesBody: document.getElementById("guesses-body"),
    gameMessage: document.getElementById("game-message"),
    statAttempts: document.getElementById("stat-attempts"),
    statStreak: document.getElementById("stat-streak"),
    statWinRate: document.getElementById("stat-win-rate"),
    
    // Auth & Profil Elemente
    userName: document.getElementById("user-name"),
    userHandle: document.getElementById("user-handle"),
    userAvatar: document.getElementById("user-avatar"),
    profileCardBtn: document.getElementById("profile-card-btn"),
    authTriggerBtn: document.getElementById("auth-trigger-btn"),
    authModal: document.getElementById("auth-modal"),
    authForm: document.getElementById("auth-form"),
    authModalTitle: document.getElementById("auth-modal-title"),
    authUsername: document.getElementById("auth-username"),
    authPassword: document.getElementById("auth-password"),
    authSubmitBtn: document.getElementById("auth-submit-btn"),
    authToggleLink: document.getElementById("auth-toggle-link"),
    closeAuthBtn: document.getElementById("close-auth-btn"),
    
    // Neue Profil-Bearbeiten Elemente
    profileModal: document.getElementById("profile-modal"),
    closeProfileBtn: document.getElementById("close-profile-btn"),
    profileForm: document.getElementById("profile-form"),
    profileDisplayName: document.getElementById("profile-display-name"),
    deleteAccountBtn: document.getElementById("delete-account-btn")
};

const state = {
    maxGuesses: MAX_GUESSES,
    guesses: [],            
    selectedMovie: null,    
    gameOver: false,
    searchTimeout: null,    
    authMode: "login", 
};

function todayKey() {
    return new Date().toISOString().slice(0, 10);
}

function saveGameState() {
    const gameState = {
        date: todayKey(),
        guesses: state.guesses,
        gameOver: state.gameOver
    };
    localStorage.setItem(getGameStateKey(), JSON.stringify(gameState));
}

function loadGameState() {
    try {
        const saved = JSON.parse(localStorage.getItem(getGameStateKey()));
        if (saved && saved.date === todayKey()) {
            state.guesses = saved.guesses || [];
            state.gameOver = saved.gameOver || false;
        } else {
            localStorage.removeItem(getGameStateKey());
        }
    } catch (e) {
        console.error("Fehler beim Laden des Spielstands:", e);
    }
}

function loadStats() {
    const defaults = { gamesPlayed: 0, gamesWon: 0, currentStreak: 0, attemptsToday: 0, lastPlayedDate: null };
    try { return { ...defaults, ...JSON.parse(localStorage.getItem(getStatsKey()) || "{}") }; } 
    catch { return defaults; }
}

function saveStats(stats) {
    localStorage.setItem(getStatsKey(), JSON.stringify(stats));
}

function renderStats() {
    const stats = loadStats();
    const today = todayKey();
    const attemptsToday = stats.lastPlayedDate === today ? stats.attemptsToday : 0;
    const winRate = stats.gamesPlayed > 0 ? `${Math.round((stats.gamesWon / stats.gamesPlayed) * 100)} %` : "—";

    elements.statAttempts.textContent = String(attemptsToday);
    elements.statStreak.textContent = String(stats.currentStreak);
    elements.statWinRate.textContent = winRate;
}

function updateStatsAfterGuess({ won, lost }) {
    const stats = loadStats();
    const today = todayKey();

    if (stats.lastPlayedDate !== today) {
        stats.attemptsToday = 0;
        stats.lastPlayedDate = today;
    }
    stats.attemptsToday += 1;

    if (won || lost) {
        stats.gamesPlayed += 1;
        if (won) {
            stats.gamesWon += 1;
            stats.currentStreak += 1;
        } else {
            stats.currentStreak = 0;
        }
    }
    saveStats(stats);
    renderStats();
}

function formatValue(value) {
    if (Array.isArray(value)) return value.length > 0 ? value.join(", ") : "—";
    return value ?? "—";
}

function feedbackClass(color) {
    if (color === "green") return "feedback-green";
    if (color === "yellow") return "feedback-yellow";
    if (color === "incorrect") return "feedback-incorrect";
    return "feedback-red";
}

function createFeedbackCell(field) {
    const cell = document.createElement("td");
    cell.classList.add("feedback-cell", feedbackClass(field.color));
    
    const text = document.createElement("span");
    text.textContent = formatValue(field.value);
    cell.appendChild(text);

    if (field.direction) {
        const arrow = document.createElement("span");
        arrow.className = "direction-arrow";
        arrow.textContent = field.direction === "up" ? "↑" : "↓";
        cell.appendChild(arrow);
    }
    return cell;
}

function renderGuessRow(guess, index) {
    const row = document.createElement("tr");
    const { feedback } = guess;
    const attemptCell = document.createElement("td");
    attemptCell.textContent = String(index + 1);
    row.appendChild(attemptCell);

    row.appendChild(createFeedbackCell(feedback.title));
    row.appendChild(createFeedbackCell(feedback.release_year));
    row.appendChild(createFeedbackCell(feedback.genres));
    row.appendChild(createFeedbackCell(feedback.directors));
    return row;
}

function renderEmptyRow(index) {
    const row = document.createElement("tr");
    row.className = "empty-row";
    for (let column = 0; column < 5; column += 1) {
        const cell = document.createElement("td");
        cell.textContent = column === 0 ? String(index + 1) : "—";
        row.appendChild(cell);
    }
    return row;
}

function renderBoard() {
    elements.guessesBody.replaceChildren();
    state.guesses.forEach((guess, index) => {
        elements.guessesBody.appendChild(renderGuessRow(guess, index));
    });
    for (let index = state.guesses.length; index < state.maxGuesses; index += 1) {
        elements.guessesBody.appendChild(renderEmptyRow(index));
    }
}

function updateAttemptHint() {
    const attemptNumber = state.guesses.length + 1;
    if (state.gameOver) {
        elements.attemptHint.textContent = "";
        return;
    }
    elements.attemptHint.textContent = `Versuch ${Math.min(attemptNumber, state.maxGuesses)} von ${state.maxGuesses}`;
    elements.searchInput.placeholder = `Suche Filmtitel... (Versuch ${Math.min(attemptNumber, state.maxGuesses)} von ${state.maxGuesses})`;
}

function setGameMessage(text, type) {
    if (!text) {
        elements.gameMessage.hidden = true;
        elements.gameMessage.textContent = "";
        return;
    }
    elements.gameMessage.hidden = false;
    elements.gameMessage.textContent = text;
    elements.gameMessage.className = `game-message ${type}`;
}

function finishGame({ won, title }) {
    state.gameOver = true;
    elements.searchInput.disabled = true;
    elements.guessButton.disabled = true;
    elements.searchInput.placeholder = "Spiel beendet für heute!";
    hideSearchResults();
    
    if (won) {
        setGameMessage(`Du hast das Filmdle erraten! Der Film war "${title}". Danke fürs Spielen!`, "win");
    } else {
        setGameMessage(`Leider verloren. Der Tagesfilm war "${title}". Danke fürs Spielen!`, "lose");
    }
    updateAttemptHint();
}

function hideSearchResults() {
    elements.searchResults.hidden = true;
    elements.searchResults.replaceChildren();
}

function setSelectedMovie(movie) {
    state.selectedMovie = movie;
    elements.searchInput.value = movie.label;
    elements.guessButton.disabled = state.gameOver;
    hideSearchResults();
}

function renderSearchResults(results) {
    elements.searchResults.replaceChildren();
    if (results.length === 0) {
        elements.searchResults.hidden = true;
        return;
    }
    results.forEach((movie) => {
        const item = document.createElement("li");
        item.textContent = movie.label;
        item.setAttribute("role", "option");
        item.addEventListener("click", () => setSelectedMovie(movie));
        elements.searchResults.appendChild(item);
    });
    elements.searchResults.hidden = false;
}

async function handleSearchInput() {
    const query = elements.searchInput.value.trim();
    state.selectedMovie = null;
    elements.guessButton.disabled = true;

    if (query.length < 2) {
        hideSearchResults();
        return;
    }
    try {
        const data = await searchMovies(query);
        renderSearchResults(data.results);
    } catch (error) {
        hideSearchResults();
        setGameMessage(error.message, "lose");
    }
}

async function handleGuessSubmit() {
    if (state.gameOver || !state.selectedMovie) return;
    elements.guessButton.disabled = true;

    try {
        const result = await submitGuess(state.selectedMovie.id);
        state.guesses.push(result);
        renderBoard();
        updateAttemptHint();

        const won = result.status === "won";
        const lost = !won && state.guesses.length >= state.maxGuesses;

        updateStatsAfterGuess({ won, lost });

        if (won) {
            finishGame({ won: true, title: result.title || result.guessed_title });
            saveGameState();
            return;
        }
        if (lost) {
            finishGame({ won: false, title: result.title });
            saveGameState();
            return;
        }

        saveGameState();
        state.selectedMovie = null;
        elements.searchInput.value = "";
        elements.searchInput.focus();
    } catch (error) {
        setGameMessage(error.message, "lose");
    } finally {
        if (!state.gameOver) {
            elements.guessButton.disabled = !state.selectedMovie;
        }
    }
}

function updateAuthUI() {
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");
    const displayName = localStorage.getItem("displayName") || username;

    if (token && username) {
        if (elements.userName) elements.userName.textContent = displayName;
        if (elements.userHandle) elements.userHandle.textContent = `@${username.toLowerCase()}`;
        if (elements.userAvatar) elements.userAvatar.textContent = displayName.slice(0, 2).toUpperCase();
        
        elements.authTriggerBtn.textContent = "Abmelden";
        elements.authTriggerBtn.style.background = "var(--gray)";
        
        if (elements.profileCardBtn) {
            elements.profileCardBtn.style.pointerEvents = "auto";
            elements.profileCardBtn.style.opacity = "1";
        }
    } else {
        if (elements.userName) elements.userName.textContent = "Gastspieler";
        if (elements.userHandle) elements.userHandle.textContent = "@gast";
        if (elements.userAvatar) elements.userAvatar.textContent = "GS";
        
        elements.authTriggerBtn.textContent = "Einloggen";
        elements.authTriggerBtn.style.background = "var(--accent)";
        
        if (elements.profileCardBtn) {
            elements.profileCardBtn.style.pointerEvents = "none";
            elements.profileCardBtn.style.opacity = "0.7";
        }
    }
}

function toggleAuthMode(event) {
    event.preventDefault();
    if (state.authMode === "login") {
        state.authMode = "register";
        elements.authModalTitle.textContent = "Konto erstellen";
        elements.authSubmitBtn.textContent = "Registrieren";
        elements.authToggleLink.textContent = "Zurück zum Login";
    } else {
        state.authMode = "login";
        elements.authModalTitle.textContent = "Einloggen";
        elements.authSubmitBtn.textContent = "Anmelden";
        elements.authToggleLink.textContent = "Jetzt registrieren";
    }
}

async function init() {
    renderStats();
    loadGameState(); 
    renderBoard();
    updateAttemptHint();
    updateAuthUI(); 

    if (state.gameOver && state.guesses.length > 0) {
        const lastGuess = state.guesses[state.guesses.length - 1];
        const won = lastGuess.status === "won";
        finishGame({ won, title: lastGuess.title || lastGuess.guessed_title });
    }

    try {
        const dailyMovie = await fetchDailyMovie();
        state.maxGuesses = dailyMovie.max_guesses || MAX_GUESSES;
        elements.dailyTitle.textContent = `Täglicher Film #${dailyMovie.puzzle_number}`;
        renderBoard(); 
        updateAttemptHint();
    } catch (error) {
        setGameMessage(error.message, "lose");
    }

    elements.searchInput.addEventListener("input", () => {
        clearTimeout(state.searchTimeout);
        state.searchTimeout = setTimeout(handleSearchInput, 300);
    });

    elements.guessButton.addEventListener("click", handleGuessSubmit);

    document.addEventListener("click", (event) => {
        const wrapper = elements.searchInput.closest(".search-wrapper");
        if (wrapper && !wrapper.contains(event.target)) {
            hideSearchResults();
        }
    });

    const btnHistory = document.getElementById("btn-history");
    if (btnHistory) {
        btnHistory.addEventListener("click", (event) => {
            event.preventDefault();
            const stats = loadStats();
            const winRate = stats.gamesPlayed > 0 ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0;
            alert(`🎬 MEIN SPIELVERLAUF 🎬\n\nGespielte Runden gesamt: ${stats.gamesPlayed}\nDavon erfolgreich erraten: ${stats.gamesWon}\nDeine persönliche Erfolgsquote: ${winRate} %\n\nKomm morgen wieder für das nächste Filmdle!`);
        });
    }

    const btnStreak = document.getElementById("btn-streak");
    if (btnStreak) {
        btnStreak.addEventListener("click", (event) => {
            event.preventDefault();
            const stats = loadStats();
            alert(`🔥 DEINE SIEGESSERIEN 🔥\n\nAktuelle Siegesserie: ${stats.currentStreak} Spiele in Folge!\n\n` + (stats.currentStreak > 2 ? "Wahnsinn! Du bist ein echter Film-Experte." : "Bleib dran, um deine Serie weiter auszubauen!"));
        });
    }

    elements.authTriggerBtn.addEventListener("click", () => {
        const token = localStorage.getItem("token");
        if (token) {
            // Abmelden
            localStorage.removeItem("token");
            localStorage.removeItem("username");
            localStorage.removeItem("displayName");
            location.reload(); // Erzwingt kompletten Neustart als Gastspieler
        } else {
            // Login öffnen
            state.authMode = "login";
            elements.authModalTitle.textContent = "Einloggen";
            elements.authSubmitBtn.textContent = "Anmelden";
            elements.authToggleLink.textContent = "Jetzt registrieren";
            elements.authForm.reset();
            elements.authModal.style.display = "grid"; 
        }
    });

    elements.closeAuthBtn.addEventListener("click", () => elements.authModal.style.display = "none");
    elements.authToggleLink.addEventListener("click", toggleAuthMode);

    elements.authForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const username = elements.authUsername.value.trim();
        const password = elements.authPassword.value;

        if (!username || !password) { alert("Bitte alle Felder ausfüllen!"); return; }

        try {
            if (state.authMode === "login") {
                const data = await loginUser(username, password);
                localStorage.setItem("token", data.token);
                localStorage.setItem("username", username);
                alert(`Eingeloggt als @${username}!`);
                location.reload(); // Lädt alle Spielfelder und Stats für DIESEN Nutzer frisch!
            } else {
                const data = await registerUser(username, password);
                alert(data.message || "Registrierung erfolgreich!");
                state.authMode = "login";
                elements.authModalTitle.textContent = "Einloggen";
                elements.authSubmitBtn.textContent = "Anmelden";
                elements.authToggleLink.textContent = "Jetzt registrieren";
                elements.authForm.reset();
            }
        } catch (error) {
            alert("Fehler: " + error.message);
        }
    });

    if (elements.profileCardBtn) {
        elements.profileCardBtn.addEventListener("click", () => {
            const token = localStorage.getItem("token");
            if (token) {
                elements.profileDisplayName.value = localStorage.getItem("displayName") || localStorage.getItem("username");
                elements.profileModal.style.display = "grid";
            }
        });
    }

    if (elements.closeProfileBtn) {
        elements.closeProfileBtn.addEventListener("click", () => {
            elements.profileModal.style.display = "none";
        });
    }

    if (elements.profileForm) {
        elements.profileForm.addEventListener("submit", (event) => {
            event.preventDefault();
            const newName = elements.profileDisplayName.value.trim();
            if (newName) {
                localStorage.setItem("displayName", newName);
                updateAuthUI(); 
                elements.profileModal.style.display = "none";
            }
        });
    }

    if (elements.deleteAccountBtn) {
        elements.deleteAccountBtn.addEventListener("click", () => {
            const confirmed = confirm("ACHTUNG: Bist du sicher, dass du dein Konto unwiderruflich löschen möchtest?");
            if (confirmed) {
                const currentStatsKey = getStatsKey();
                const currentGameStateKey = getGameStateKey();
                
                localStorage.removeItem("token");
                localStorage.removeItem("username");
                localStorage.removeItem("displayName");
                localStorage.removeItem(currentStatsKey); // Löscht nur die Daten DIESES Nutzers
                localStorage.removeItem(currentGameStateKey);
                
                alert("Dein Konto wurde erfolgreich gelöscht.");
                location.reload(); // Zurück zum leeren Gast-Board
            }
        });
    }
}

init();

