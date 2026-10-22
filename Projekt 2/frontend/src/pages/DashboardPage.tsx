import { ArrowRight, BookOpen, Brain, Flame, GraduationCap, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cardsService } from '../services/CardsService'
import { chaptersService } from '../services/ChaptersService'
import type { Chapter, FlashcardWithProgress } from '../types/api'

// Hilfsfunktion zur Berechnung der Streak (wie im Study Room)
function countStreakDays(cards: FlashcardWithProgress[]): number {
  const reviewedDays = new Set(
    cards
      .map((card) => card.progress?.last_reviewed)
      .filter((timestamp): timestamp is number => timestamp !== undefined && timestamp > 0)
      .map((timestamp) => new Date(timestamp * 1000).toDateString()),
  )
  return reviewedDays.size
}

export function DashboardPage() {
  const navigate = useNavigate()
  
  // States für echte Daten
  const [cards, setCards] = useState<FlashcardWithProgress[]>([])
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Echte Daten vom Backend laden
  useEffect(() => {
    let active = true
    Promise.all([
      cardsService.getCards().catch(() => []),
      chaptersService.getChapters().catch(() => [])
    ]).then(([loadedCards, loadedChapters]) => {
      if (active) {
        setCards(loadedCards)
        setChapters(loadedChapters)
        setIsLoading(false)
      }
    })
    return () => { active = false }
  }, [])

  // Live-Statistiken berechnen
  const masteredCount = cards.filter((card) => card.progress?.box === 3).length
  const streakDays = countStreakDays(cards)
  const activeDecks = chapters.length

  // Leitner-Box-Verteilung (Box 1/2/3)
  const box1Count = cards.filter((card) => card.progress?.box === 1).length
  const box2Count = cards.filter((card) => card.progress?.box === 2).length
  const box3Count = cards.filter((card) => card.progress?.box === 3).length
  const totalBoxCards = box1Count + box2Count + box3Count

  return (
    <section style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Willkommens-Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-h)', marginBottom: '8px' }}>
          Willkommen zurück! 👋
        </h1>
        <p style={{ fontSize: '16px', color: 'var(--text)' }}>
          Bereit für deine nächste Lern-Session? Hier ist dein aktueller Überblick.
        </p>
      </div>

      {/* Quick Actions (Study Room & Generator) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        <div className="generator-card" style={{ 
          padding: '32px', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'flex-start',
          background: 'linear-gradient(145deg, #eff6ff 0%, #ffffff 100%)',
          border: '1px solid #bfdbfe',
          margin: 0
        }}>
          <div style={{ background: '#3b82f6', padding: '14px', borderRadius: '12px', marginBottom: '20px', color: 'white', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}>
            <GraduationCap size={28} aria-hidden="true" />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '12px', color: '#1e3a8a' }}>
            Ab in den Study Room
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--text)', marginBottom: '32px', lineHeight: 1.6 }}>
            Setze dein Lernen fort. Wiederhole deine fälligen Karteikarten und lass dich vom interaktiven KI-Tutor abfragen.
          </p>
          <button className="btn-primary" onClick={() => navigate('/study-room')} style={{ marginTop: 'auto', width: '100%', justifyContent: 'center', padding: '14px' }}>
            Jetzt lernen <ArrowRight size={18} aria-hidden="true" style={{ marginLeft: '4px' }} />
          </button>
        </div>

        <div className="generator-card" style={{ 
          padding: '32px', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'flex-start',
          margin: 0 
        }}>
          <div style={{ background: 'var(--accent-bg)', padding: '14px', borderRadius: '12px', marginBottom: '20px', color: 'var(--accent)' }}>
            <Sparkles size={28} aria-hidden="true" />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-h)' }}>
            Neuen Content erstellen
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--text)', marginBottom: '32px', lineHeight: 1.6 }}>
            Lade ein neues Skript hoch oder wähle ein Kapitel, um in Sekunden passgenaue Lernkarten generieren zu lassen.
          </p>
          <button className="btn-outline" onClick={() => navigate('/generieren')} style={{ marginTop: 'auto', width: '100%', justifyContent: 'center', padding: '14px', fontSize: '15px' }}>
            Zum Generator <ArrowRight size={18} aria-hidden="true" style={{ marginLeft: '4px' }} />
          </button>
        </div>
      </div>

      {/* Echte Statistik Übersicht */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-h)', margin: 0 }}>
          Deine Lern-Statistiken
        </h2>
        {isLoading && <span className="spinner" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />}
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        
        {/* Streak */}
        <div className="stat-card" style={{ flexDirection: 'row', justifyContent: 'flex-start', padding: '24px', gap: '20px', margin: 0 }}>
          <div style={{ background: '#fef08a', padding: '16px', borderRadius: '50%', color: '#ca8a04' }}>
            <Flame size={28} aria-hidden="true" />
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-h)' }}>
              {isLoading ? '-' : streakDays} {streakDays === 1 ? 'Tag' : 'Tage'}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text)', fontWeight: 500 }}>Aktuelle Streak</div>
          </div>
        </div>

        {/* Mastered Cards */}
        <div className="stat-card" style={{ flexDirection: 'row', justifyContent: 'flex-start', padding: '24px', gap: '20px', margin: 0 }}>
          <div style={{ background: '#dcfce7', padding: '16px', borderRadius: '50%', color: '#16a34a' }}>
            <Brain size={28} aria-hidden="true" />
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-h)' }}>
              {isLoading ? '-' : masteredCount}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text)', fontWeight: 500 }}>Karten gemeistert</div>
          </div>
        </div>

        {/* Active Decks */}
        <div className="stat-card" style={{ flexDirection: 'row', justifyContent: 'flex-start', padding: '24px', gap: '20px', margin: 0 }}>
          <div style={{ background: '#f3e8ff', padding: '16px', borderRadius: '50%', color: '#9333ea' }}>
            <BookOpen size={28} aria-hidden="true" />
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-h)' }}>
              {isLoading ? '-' : activeDecks}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text)', fontWeight: 500 }}>Aktive Decks</div>
          </div>
        </div>

      </div>

      {/* Leitner-Box-Verteilung */}
      {!isLoading && totalBoxCards > 0 && (
        <div className="dashboard-card" style={{ marginTop: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-h)', marginBottom: '16px' }}>
            Verteilung nach Leitner-Box
          </h2>
          <div className="leitner-bar">
            {box1Count > 0 && (
              <span className="leitner-bar-segment leitner-box-1" style={{ width: `${(box1Count / totalBoxCards) * 100}%` }} />
            )}
            {box2Count > 0 && (
              <span className="leitner-bar-segment leitner-box-2" style={{ width: `${(box2Count / totalBoxCards) * 100}%` }} />
            )}
            {box3Count > 0 && (
              <span className="leitner-bar-segment leitner-box-3" style={{ width: `${(box3Count / totalBoxCards) * 100}%` }} />
            )}
          </div>
          <div className="leitner-legend">
            <span className="leitner-legend-item">
              <span className="leitner-legend-dot leitner-box-1" /> Box 1 ({box1Count})
            </span>
            <span className="leitner-legend-item">
              <span className="leitner-legend-dot leitner-box-2" /> Box 2 ({box2Count})
            </span>
            <span className="leitner-legend-item">
              <span className="leitner-legend-dot leitner-box-3" /> Box 3 ({box3Count})
            </span>
          </div>
        </div>
      )}
    </section>
  )
}