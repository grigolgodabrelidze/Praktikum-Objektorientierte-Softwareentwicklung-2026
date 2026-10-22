import {
  Check, ChevronLeft, Flame, MoreVertical,
  RefreshCw, RotateCcw, RotateCw, Star, Volume2
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { QuestionChat } from '../components/QuestionChat'
import { useClickOutside } from '../hooks/useClickOutside'
import { ApiError } from '../services/ApiClient'
import { cardsService } from '../services/CardsService'
import type { EvaluateAnswerResponse, FlashcardWithProgress, ReviewRating } from '../types/api'
import './pages.css'

const FAVORITES_KEY = 'lernwerkzeug67_favorites'

function loadFavorites(): Set<string> {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY)
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set()
  } catch {
    return new Set()
  }
}

function saveFavorites(favorites: Set<string>): void {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites]))
}

function speak(text: string): void {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'de-DE'
  window.speechSynthesis.speak(utterance)
}

type StudyMode = 'karteikarte' | 'frage'

export function StudyRoomPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<StudyMode>('karteikarte')
  const [allCards, setAllCards] = useState<FlashcardWithProgress[]>([])
  const [selectedDeck, setSelectedDeck] = useState<string>('all')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    cardsService
      .getCards()
      .then(setAllCards)
      .catch((err: Error) => setError(err.message))
  }, [])

  // FIX 2: Extrahiere alle eindeutigen Decks/Kapitel aus den geladenen Karten
  const availableDecks = Array.from(
    new Set(allCards.map((card) => card.chapter).filter(Boolean))
  )

  // FIX 2: Filter die Karten basierend auf der Auswahl im Dropdown
  const filteredCards = selectedDeck === 'all'
    ? allCards
    : allCards.filter((card) => card.chapter === selectedDeck)

  const masteredCount = filteredCards.filter((card) => card.progress?.box === 3).length
  const progressPercent = filteredCards.length === 0 ? 0 : Math.round((masteredCount / filteredCards.length) * 100)
  const streakDays = countStreakDays(allCards)

  return (
    <div className="page-container study-room-layout">
      {/* Header Bereich */}
      <div className="study-header">
        <button type="button" className="btn-back" onClick={() => navigate('/')}>
          <ChevronLeft size={20} aria-hidden="true" /> Study Room
        </button>

        {/* Tab-Wechsler zwischen Karteikarte und Chat */}
        <div className="study-tabs-pill">
          <button
            type="button"
            className={mode === 'karteikarte' ? 'tab-pill active' : 'tab-pill'}
            onClick={() => setMode('karteikarte')}
          >
            Karteikarte
          </button>
          <button
            type="button"
            className={mode === 'frage' ? 'tab-pill active' : 'tab-pill'}
            onClick={() => setMode('frage')}
          >
            Frage stellen
          </button>
        </div>

        <button type="button" className="btn-outline" onClick={() => navigate('/')}>
          Study Room verlassen
        </button>
      </div>

      <div className="study-grid">
        {/* Linke Sidebar: Statistiken & Deck-Auswahl */}
        <aside className="study-sidebar">
          {/* FIX 2: Deck-Auswahl Dropdown */}
          <div className="stat-card">
            <span className="stat-label">Deck auswählen</span>
            <select
              value={selectedDeck}
              onChange={(e) => setSelectedDeck(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text-h)',
                fontSize: '14px',
                marginTop: '6px',
                cursor: 'pointer'
              }}
            >
              <option value="all">Alle Decks ({allCards.length} Karten)</option>
              {availableDecks.map((deck) => (
                <option key={deck} value={deck}>
                  {deck} ({allCards.filter((c) => c.chapter === deck).length})
                </option>
              ))}
            </select>
            <span className="stat-sub" style={{ marginTop: '8px', display: 'block' }}>
              {filteredCards.length} Karten gewählt
            </span>
          </div>

          <div className="stat-card progress-card">
            <span className="stat-label">Fortschritt</span>
            <ProgressRing percent={progressPercent} />
            <span className="stat-sub">{masteredCount} / {filteredCards.length} Karten</span>
          </div>

          <div className="stat-card">
            <span className="stat-label">Streak</span>
            <div className="streak-value">
              <Flame size={20} className="icon-fire" aria-hidden="true" />
              <span>{streakDays} {streakDays === 1 ? 'Tag' : 'Tage'}</span>
            </div>
          </div>

          <button type="button" className="btn-outline w-full mt-auto" onClick={() => navigate('/generieren')}>
            Karten generieren
          </button>
        </aside>

        {/* Rechter Hauptbereich: Interaktion */}
        <main className="study-main">
          {error && <p role="alert" className="error-text">Fehler beim Laden: {error}</p>}

          {mode === 'karteikarte' ? (
            /* key={selectedDeck} zwingt die Komponente zum Reset bei Deck-Wechsel */
            <FlashcardReview key={selectedDeck} cards={filteredCards} setCards={setAllCards} />
          ) : (
            <div className="dashboard-card"><QuestionChat /></div>
          )}
        </main>
      </div>
    </div>
  )
}

function FlashcardReview({
  cards,
  setCards,
}: {
  cards: FlashcardWithProgress[]
  setCards: (updater: (prev: FlashcardWithProgress[]) => FlashcardWithProgress[]) => void
}) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [feedback, setFeedback] = useState<EvaluateAnswerResponse | null>(null)
  const [evaluationUnavailable, setEvaluationUnavailable] = useState(false)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [favorites, setFavorites] = useState<Set<string>>(() => loadFavorites())
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isFlipped, setIsFlipped] = useState(false)
  const menuRef = useClickOutside<HTMLDivElement>(() => setIsMenuOpen(false))

  const currentCard = cards[currentIndex]
  const isFavorite = currentCard ? favorites.has(currentCard.id) : false

  function toggleFavorite() {
    if (!currentCard) return
    const updated = new Set(favorites)
    if (updated.has(currentCard.id)) {
      updated.delete(currentCard.id)
    } else {
      updated.add(currentCard.id)
    }
    setFavorites(updated)
    saveFavorites(updated)
  }

  function handleSkip() {
    setIsMenuOpen(false)
    setUserAnswer('')
    setFeedback(null)
    setEvaluationUnavailable(false)
    setIsFlipped(false)
    setCurrentIndex((index) => (index + 1) % Math.max(cards.length, 1))
  }

  // Diese Funktion wird JETZT erst auf Wunsch für die KI aufgerufen
  async function handleCheckAnswer() {
    if (!currentCard) return
    setIsEvaluating(true)
    setEvaluationUnavailable(false)
    try {
      const result = await cardsService.evaluateAnswer(currentCard.id, userAnswer)
      setFeedback(result)
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setEvaluationUnavailable(true)
      }
    } finally {
      setIsEvaluating(false)
    }
  }

  async function handleRate(rating: ReviewRating) {
    if (!currentCard) return
    const updatedProgress = await cardsService.reviewCard(currentCard.id, rating)
    setCards((prev) =>
      prev.map((card) => (card.id === currentCard.id ? { ...card, progress: updatedProgress } : card)),
    )
    setUserAnswer('')
    setFeedback(null)
    setEvaluationUnavailable(false)
    setIsFlipped(false)
    setCurrentIndex((index) => (index + 1) % Math.max(cards.length, 1))
  }

  if (cards.length === 0) {
    return (
      <div className="dashboard-card text-center" style={{ padding: '40px' }}>
        <p style={{ color: 'var(--text)' }}>
          In diesem Deck befinden sich aktuell keine Karteikarten.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className={isFlipped ? 'flashcard-flip flipped' : 'flashcard-flip'}>
        <div className="flashcard-flip-inner">
          <div className="flashcard-large flashcard-flip-front">
            <div className="flashcard-header">
              <span className="badge-yellow">Frage</span>
              <div className="flashcard-actions">
                <button
                  type="button"
                  className="icon-btn-action"
                  onClick={() => speak(currentCard.question)}
                  aria-label="Frage vorlesen"
                >
                  <Volume2 size={18} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="icon-btn-action"
                  onClick={toggleFavorite}
                  style={{ color: isFavorite ? '#eab308' : 'inherit' }}
                >
                  <Star size={18} aria-hidden="true" fill={isFavorite ? '#eab308' : 'none'} />
                </button>
                <button
                  type="button"
                  className="icon-btn-action"
                  onClick={() => setIsFlipped(true)}
                  aria-label="Antwort anzeigen"
                >
                  <RotateCw size={18} aria-hidden="true" />
                </button>
                <div className="dropdown" ref={menuRef}>
                  <button
                    type="button"
                    className="icon-btn-action"
                    onClick={() => setIsMenuOpen((open) => !open)}
                  >
                    <MoreVertical size={18} aria-hidden="true" />
                  </button>
                  {isMenuOpen && (
                    <div className="dropdown-panel dropdown-panel-menu">
                      <button type="button" className="dropdown-menu-item" onClick={handleSkip}>
                        Karte überspringen
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <h2 className="flashcard-question-text">{currentCard.question}</h2>
          </div>

          <div className="flashcard-large flashcard-flip-back">
            <div className="flashcard-header">
              <span className="badge-green">Antwort</span>
              <button
                type="button"
                className="icon-btn-action"
                onClick={() => setIsFlipped(false)}
                aria-label="Zurück zur Frage"
              >
                <RotateCcw size={18} aria-hidden="true" />
              </button>
            </div>
            <h2 className="flashcard-question-text">{currentCard.answer}</h2>
          </div>
        </div>
      </div>

      {/* Eingabefeld für den Studierenden */}
      <textarea
        className="answer-input"
        placeholder="Deine Antwort eingeben (optional für KI-Feedback)…"
        value={userAnswer}
        onChange={(event) => setUserAnswer(event.target.value)}
        rows={4}
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-8px', marginBottom: '16px', gap: '12px' }}>
        {/* Hauptbutton: Dreht die Karte einfach nur ohne API-Verbindung um */}
        {!isFlipped && (
          <button 
            type="button" 
            className="btn-primary" 
            onClick={() => setIsFlipped(true)}
          >
            Antwort anzeigen
          </button>
        )}

        {/* Optionaler KI-Button: Wird erst sichtbar, wenn die Musterlösung aufgedeckt ist */}
        {isFlipped && !feedback && !evaluationUnavailable && (
          <button 
            type="button" 
            className="btn-outline" 
            onClick={handleCheckAnswer} 
            disabled={isEvaluating || !userAnswer.trim()}
            style={{ display: 'inline-flex', alignItems: 'center', height: '38px' }}
          >
            {isEvaluating && <span className="spinner" aria-hidden="true" style={{ marginRight: '8px', borderTopColor: 'var(--accent)' }} />}
            {isEvaluating ? 'KI prüft…' : '🤖 KI-Feedback anfordern'}
          </button>
        )}
      </div>

      {/* KI-Feedback mit echten Fortschrittsbalken */}
      {feedback && (
        <div className="ai-feedback-box">
          <div className="feedback-header">
            <span className="ai-icon" aria-hidden="true">🤖</span>
            <strong>KI-Feedback</strong>
          </div>
          <div className="feedback-content">
            <div className="sliders" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* Genauigkeit */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px', fontWeight: 500 }}>
                  <span>Genauigkeit</span>
                  <span>{feedback.accuracy}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div 
                    style={{ 
                      width: `${feedback.accuracy}%`, 
                      height: '100%', 
                      backgroundColor: feedback.accuracy > 70 ? '#22c55e' : feedback.accuracy > 40 ? '#eab308' : '#ef4444',
                      borderRadius: '4px',
                      transition: 'width 0.4s ease'
                    }} 
                  />
                </div>
              </div>

              {/* Vollständigkeit */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px', fontWeight: 500 }}>
                  <span>Vollständigkeit</span>
                  <span>{feedback.completeness}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div 
                    style={{ 
                      width: `${feedback.completeness}%`, 
                      height: '100%', 
                      backgroundColor: feedback.completeness > 70 ? '#22c55e' : feedback.completeness > 40 ? '#eab308' : '#ef4444',
                      borderRadius: '4px',
                      transition: 'width 0.4s ease'
                    }} 
                  />
                </div>
              </div>

            </div>
            <div className="feedback-text" style={{ marginTop: '16px' }}>
              <p>{feedback.feedback}</p>
            </div>
          </div>
        </div>
      )}

      {evaluationUnavailable && (
        <div className="ai-feedback-box" style={{ borderColor: '#fca5a5', backgroundColor: '#fef2f2' }}>
          <p style={{ color: '#991b1b' }}>
            Die KI-Bewertung ist im Backend noch nicht verfügbar. Du kannst die Karte trotzdem selbst bewerten.
          </p>
        </div>
      )}

      {/* Die Leitner-Box-Buttons sind JETZT direkt nach dem Umdrehen der Karte benutzbar! */}
      {isFlipped && (
        <div className="action-buttons" style={{ animation: 'fadeIn 0.2s ease-in' }}>
          <button type="button" className="btn-retry" onClick={() => handleRate(1)}>
            <RotateCcw size={18} aria-hidden="true" /> Nochmal
          </button>
          <button type="button" className="btn-keep" onClick={() => handleRate(2)}>
            <RefreshCw size={18} aria-hidden="true" /> Weiter üben
          </button>
          <button type="button" className="btn-mastered" onClick={() => handleRate(3)}>
            <Check size={18} aria-hidden="true" /> Gemeistert
          </button>
        </div>
      )}
    </>
  )
}

function ProgressRing({ percent }: { percent: number }) {
  const size = 80
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - percent / 100)

  return (
    <div className="circular-progress-svg">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--border)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <span className="progress-ring-label">{percent}%</span>
    </div>
  )
}

function countStreakDays(cards: FlashcardWithProgress[]): number {
  const reviewedDays = new Set(
    cards
      .map((card) => card.progress?.last_reviewed)
      .filter((timestamp): timestamp is number => timestamp !== undefined && timestamp > 0)
      .map((timestamp) => new Date(timestamp * 1000).toDateString()),
  )
  return reviewedDays.size
}