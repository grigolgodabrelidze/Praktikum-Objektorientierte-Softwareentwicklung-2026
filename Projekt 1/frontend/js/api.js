const API_BASE = "";

async function requestJson(url, options = {}) {
    const response = await fetch(`${API_BASE}${url}`, {
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
        },
        ...options,
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || "Anfrage fehlgeschlagen.");
    }

    return response.json();
}

export function fetchDailyMovie() {
    return requestJson("/api/daily-movie");
}

export function searchMovies(query) {
    const params = new URLSearchParams({ q: query });
    return requestJson(`/api/search/movies?${params.toString()}`);
}

export function submitGuess(movieId) {
    return requestJson("/api/guess", {
        method: "POST",
        body: JSON.stringify({ movie_id: movieId }),
    });
}

// --- NEU: Auth Endpunkte ---
export function registerUser(username, password) {
    return requestJson("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ username, password }),
    });
}

export function loginUser(username, password) {
    return requestJson("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
    });
}