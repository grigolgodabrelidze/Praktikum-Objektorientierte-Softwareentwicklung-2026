import { Clock, Lock, Play } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cardsService } from '../services/CardsService'
import type { FlashcardWithProgress } from '../types/api'

const HISTORY_KEY = 'lernwerkzeug67_quiz_history'
const QUIZ_SIZE = 5
const QUIZ_SECONDS = 600

interface QuizAttempt {
  date: string
  points: number
  maxPoints: number
  grade: string
}

type QuizStatus = 'idle' | 'active' | 'finished'

export function QuizPage() {
  const [status, setStatus] = useState<QuizStatus>('idle')
  const [allCards, setAllCards] = useState<FlashcardWithProgress[]>([])
  const [quizCards, setQuizCards] = useState<FlashcardWithProgress[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [secondsLeft, setSecondsLeft] = useState(QUIZ_SECONDS)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [result, setResult] = useState<{ points: number; maxPoints: number; grade: string } | null>(null)
  const [history, setHistory] = useState<QuizAttempt[]>(() => loadHistory())

  useEffect(() => {
    cardsService.getCards().then(setAllCards)
  }, [])

  async function finishQuiz(finalAnswers: string[]) {
    setIsEvaluating(true)
    let totalPoints = 0
    for (let i = 0; i < quizCards.length; i += 1) {
      const card = quizCards[i]
      const answer = finalAnswers[i] ?? ''
      try {
        const evaluation = await cardsService.evaluateAnswer(card.id, answer)
        totalPoints += Math.round((evaluation.accuracy / 100) * 10)
      } catch {
        // KI-Bewertung evtl. noch nicht verfügbar -> 0 Punkte für diese Frage.
      }
    }
    const maxPoints = quizCards.length * 10
    const percent = maxPoints === 0 ? 0 : (totalPoints / maxPoints) * 100
    const grade = calculateGrade(percent)
    const attempt: QuizAttempt = {
      date: new Date().toLocaleDateString('de-DE'),
      points: totalPoints,
      maxPoints,
      grade,
    }
    const updatedHistory = [attempt, ...history].slice(0, 50)
    setHistory(updatedHistory)
    saveHistory(updatedHistory)
    setResult({ points: totalPoints, maxPoints, grade })
    setIsEvaluating(false)
    setStatus('finished')
  }

  useEffect(() => {
    if (status !== 'active') return
    if (secondsLeft <= 0) {
      const timeout = setTimeout(() => void finishQuiz(answers), 0)
      return () => clearTimeout(timeout)
    }
    const timer = setTimeout(() => setSecondsLeft((seconds) => seconds - 1), 1000)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, secondsLeft])

  function startQuiz() {
    const shuffled = [...allCards].sort(() => Math.random() - 0.5).slice(0, QUIZ_SIZE)
    setQuizCards(shuffled)
    setAnswers(new Array(shuffled.length).fill(''))
    setCurrentIndex(0)
    setCurrentAnswer('')
    setSecondsLeft(QUIZ_SECONDS)
    setResult(null)
    setStatus('active')
  }

  function handleLockAnswer() {
    const updated = [...answers]
    updated[currentIndex] = currentAnswer
    setAnswers(updated)
    setCurrentAnswer('')
    if (currentIndex + 1 < quizCards.length) {
      setCurrentIndex((index) => index + 1)
    } else {
      void finishQuiz(updated)
    }
  }

  if (status === 'idle') {
    const notEnoughCards = allCards.length < QUIZ_SIZE
    return (
      <div className="page-container">
        <h1>Quiz-Modus</h1>

        <div className="flashcard-large">
          <span className="badge-yellow">{QUIZ_SIZE} zufällige Fragen</span>
          <p className="flashcard-question-text">
            Teste dein Wissen mit {QUIZ_SIZE} zufälligen Fragen aus deinen gespeicherten Karten. Keine
            Sofort-Bewertung — die Auswertung kommt erst am Ende.
          </p>
        </div>

        {notEnoughCards ? (
          <p>
            Du brauchst mindestens {QUIZ_SIZE} gespeicherte Karten für ein Quiz (aktuell {allCards.length}).
            Erzeuge welche im Karten-Generator.
          </p>
        ) : (
          <button type="button" className="btn-primary" onClick={startQuiz}>
            <Play size={16} aria-hidden="true" />
            Quiz starten
          </button>
        )}

        {history.length > 0 && <QuizHistoryTable history={history} />}
      </div>
    )
  }

  if (status === 'finished') {
    return (
      <div className="page-container">
        <h1>Quiz-Modus</h1>

        <div className="ai-feedback-box">
          <h2>Quiz beendet</h2>
          <p className="quiz-result-points">
            {result?.points} / {result?.maxPoints} Punkte
          </p>
          <p className="stat-sub">Note: {result?.grade}</p>
        </div>

        <button type="button" className="btn-primary" onClick={() => setStatus('idle')}>
          Neues Quiz starten
        </button>

        {history.length > 0 && <QuizHistoryTable history={history} />}
      </div>
    )
  }

  const currentCard = quizCards[currentIndex]

  return (
    <div className="page-container">
      <h1>Quiz-Modus</h1>

      <div className="quiz-meta-row">
        <StepIndicator total={quizCards.length} current={currentIndex} />
        <span className="quiz-timer">
          <Clock size={15} aria-hidden="true" />
          {formatTime(secondsLeft)}
        </span>
      </div>

      <div className="study-grid">
        <div className="study-sidebar">
          <div className="dashboard-card">
            <h2>Deine Antworten (gesperrt)</h2>
            <ul className="locked-answers">
              {quizCards.map((card, index) => (
                <li key={card.id} className={index === currentIndex ? 'locked-answer-current' : ''}>
                  <span>
                    {index + 1}. {card.question}
                  </span>
                  {answers[index] && <Lock size={13} aria-hidden="true" />}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="study-main">
          <div className="flashcard-large">
            <span className="badge-yellow">
              Frage {currentIndex + 1} von {quizCards.length}
            </span>
            <p className="flashcard-question-text">{currentCard?.question}</p>
          </div>

          <textarea
            className="answer-input"
            placeholder="Antwort eingeben…"
            value={currentAnswer}
            onChange={(event) => setCurrentAnswer(event.target.value)}
            rows={4}
          />

          <button type="button" className="btn-primary" onClick={handleLockAnswer} disabled={isEvaluating || !currentAnswer.trim()}>
            {isEvaluating && <span className="spinner" aria-hidden="true" />}
            {isEvaluating
              ? 'Wird ausgewertet…'
              : currentIndex + 1 === quizCards.length
                ? 'Quiz abschließen'
                : 'Antwort sperren & weiter'}
          </button>
        </div>
      </div>
    </div>
  )
}

function StepIndicator({ total, current }: { total: number; current: number }) {
  return (
    <div className="step-indicator">
      {Array.from({ length: total }).map((_, index) => (
        <span key={index} className={index <= current ? 'step-dot step-dot-active' : 'step-dot'}>
          {index + 1}
        </span>
      ))}
    </div>
  )
}

function QuizHistoryTable({ history }: { history: QuizAttempt[] }) {
  const [showAll, setShowAll] = useState(false)
  const highScore = Math.max(...history.map((attempt) => attempt.points))
  const visibleHistory = showAll ? history : history.slice(0, 5)

  return (
    <div className="dashboard-card quiz-history">
      <h2>Quiz-Historie</h2>
      <p className="stat-sub">Highscore: {highScore} Punkte</p>
      <table className="quiz-history-table">
        <thead>
          <tr>
            <th>Datum</th>
            <th>Punkte</th>
            <th>Note</th>
          </tr>
        </thead>
        <tbody>
          {visibleHistory.map((attempt, index) => (
            <tr key={index}>
              <td>{attempt.date}</td>
              <td>
                {attempt.points}/{attempt.maxPoints}
              </td>
              <td>{attempt.grade}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {history.length > 5 && (
        <button type="button" className="view-all-history-button" onClick={() => setShowAll((prev) => !prev)}>
          {showAll ? 'Weniger anzeigen' : `Gesamte Historie anzeigen (${history.length})`}
        </button>
      )}
    </div>
  )
}

function calculateGrade(percent: number): string {
  if (percent >= 92) return '1,0'
  if (percent >= 81) return '1,7'
  if (percent >= 67) return '2,3'
  if (percent >= 50) return '3,0'
  if (percent >= 30) return '4,0'
  return '5,0'
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function loadHistory(): QuizAttempt[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? (JSON.parse(raw) as QuizAttempt[]) : []
  } catch {
    return []
  }
}

function saveHistory(history: QuizAttempt[]): void {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
}
