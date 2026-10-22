import { Bookmark, BookmarkCheck, HelpCircle, Sparkles, UploadCloud } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cardsService } from '../services/CardsService'
import { chaptersService } from '../services/ChaptersService'
import type { Chapter, Flashcard, PromptDetail } from '../types/api'

export function GeneratePage() {
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [chapterId, setChapterId] = useState('')
  const [numCards, setNumCards] = useState(5)
  const [promptDetail, setPromptDetail] = useState<PromptDetail>('short')
  const [generatedCards, setGeneratedCards] = useState<Flashcard[]>([])
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())

  const [tokensUsed, setTokensUsed] = useState<number | undefined>(undefined)
  const [tokenLimit, setTokenLimit] = useState<number | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Funktion zum Laden der Kapitel
  const loadChapters = async (autoSelectId?: string) => {
    try {
      const loaded = await chaptersService.getChapters()
      setChapters(loaded)
      if (loaded.length > 0) {
        setChapterId(autoSelectId || loaded[0].id)
      }
    } catch (err) {
      console.error('Fehler beim Laden der Skripte:', err)
    }
  }

  useEffect(() => {
    let active = true
    chaptersService
      .getChapters()
      .then((loaded) => {
        if (!active) return
        setChapters(loaded)
        if (loaded.length > 0) {
          setChapterId(loaded[0].id)
        }
      })
      .catch((err) => {
        console.error('Fehler beim Laden der Skripte:', err)
      })
    return () => { active = false }
  }, [])

  // NEU: Verarbeitet mehrere Dateien gleichzeitig
  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = event.target.files
    if (!selectedFiles || selectedFiles.length === 0) return

    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      
      // Füge alle ausgewählten Dateien zum FormData hinzu
      Array.from(selectedFiles).forEach((file) => {
        formData.append('files', file)
      })

      const response = await fetch('/api/chapters/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.status === 404) {
        throw new Error('Upload-Funktion ist im Backend noch nicht verfügbar.')
      }
      if (!response.ok) {
        throw new Error('Upload im Backend fehlgeschlagen.')
      }

      const result = await response.json()
      
      // Kapitelliste neu abfragen und die ID der zuletzt geladenen Datei auswählen
      await loadChapters(result.id)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Hochladen der Datei(en).')
    } finally {
      setIsUploading(false)
      event.target.value = ''
    }
  }

  async function handleGenerate() {
    setIsLoading(true)
    setError(null)
    try {
      const response = await cardsService.generateCards({
        chapter_id: chapterId,
        num_cards: numCards,
        prompt_detail: promptDetail,
      })
      setGeneratedCards(response.cards)
      setTokensUsed(response.tokens_used)
      setTokenLimit(response.token_limit)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler bei der Generierung')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSave(card: Flashcard) {
    try {
      await cardsService.saveCard(card)
      setSavedIds((prev) => new Set(prev).add(card.id))
    } catch (err) {
      console.error('Fehler beim Speichern der Karte:', err)
    }
  }

  const hasTokenInfo = tokensUsed !== undefined && tokenLimit !== undefined && tokenLimit > 0
  const tokenPercent = hasTokenInfo ? Math.round((tokensUsed / tokenLimit) * 100) : 0
  const tokenStatus = tokenPercent >= 90 ? 'Limit fast erreicht' : 'OK'

  return (
    <section>
      <h1 style={{ fontSize: '26px', fontWeight: 700, marginBottom: '24px', color: 'var(--text-h)' }}>
        Karten-Generator
      </h1>

      <div className="generator-card" style={{ padding: '28px' }}>
        <div className="card-header" style={{ marginBottom: '24px' }}>
          <span className="card-icon-badge">
            <Sparkles size={18} aria-hidden="true" />
          </span>
          <h2 className="card-title" style={{ fontSize: '18px', fontWeight: 600 }}>Content Generator</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr auto auto', gap: '24px', alignItems: 'flex-end' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-h)' }}>Skripte wählen oder hochladen</span>
            <div style={{ display: 'flex', gap: '12px' }}>
              <select value={chapterId} onChange={(event) => setChapterId(event.target.value)} style={{ padding: '10px 12px', borderRadius: '8px', flex: 1 }}>
                {chapters.length === 0 && <option value="">Keine Skripte gefunden</option>}
                {chapters.map((chapter) => (
                  <option key={chapter.id} value={chapter.id}>{chapter.title}</option>
                ))}
              </select>

              <label style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 16px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                cursor: 'pointer',
                color: 'var(--text-h)',
                fontSize: '14px',
                fontWeight: 500,
                boxShadow: 'var(--shadow)'
              }}>
                {isUploading ? <span className="spinner" aria-hidden="true" style={{ marginRight: '8px' }} /> : <UploadCloud size={18} style={{ marginRight: '8px' }} aria-hidden="true" />}
                {isUploading ? 'Lädt…' : 'PDF-Upload'}
                <input
                  type="file"
                  accept=".pdf,.txt"
                  multiple // ERMÖGLICHT MULTI-FILE SELECTION
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </label>

          <label>
            Anzahl Karten
            <input
              type="number"
              min={1}
              max={20}
              value={numCards}
              onChange={(event) => setNumCards(Number(event.target.value))}
              style={{ padding: '10px 12px', borderRadius: '8px' }}
            />
          </label>

          <label className="toggle" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '10px', paddingBottom: '6px' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-h)' }}>Kurzer vs. ausführlicher Prompt</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="checkbox"
                checked={promptDetail === 'detailed'}
                onChange={(event) => setPromptDetail(event.target.checked ? 'detailed' : 'short')}
              />
              <span className="toggle-track" style={{ width: '40px', height: '24px', borderRadius: '12px' }}>
                <span className="toggle-thumb" style={{ width: '20px', height: '20px' }} />
              </span>
            </div>
          </label>

          <button
            type="button"
            className="btn-primary"
            onClick={handleGenerate}
            disabled={isLoading || !chapterId}
            style={{ height: '42px', padding: '0 20px', fontSize: '14px', fontWeight: 600 }}
          >
            {isLoading ? <span className="spinner" aria-hidden="true" /> : <Sparkles size={16} aria-hidden="true" />}
            {isLoading ? 'Wird generiert…' : 'Karten generieren'}
          </button>
        </div>

        {hasTokenInfo && (
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', marginTop: '24px' }}>
            <div className="token-usage-row" style={{ marginBottom: '8px' }}>
              <span style={{ color: 'var(--text)' }}>Token-Nutzung</span>
              <span style={{ color: 'var(--text)' }}>
                {tokenPercent}% ({tokensUsed.toLocaleString()} / {tokenLimit.toLocaleString()} Tokens)
              </span>
            </div>
            <span className="box-progress-track" style={{ height: '8px', background: 'var(--code-bg)' }}>
              <span
                className={`box-progress-fill${tokenPercent >= 90 ? ' token-usage-fill-warn' : ' token-usage-fill-ok'}`}
                style={{ width: `${tokenPercent}%` }}
              />
            </span>
            <div className="token-usage-row" style={{ marginTop: '8px', justifyContent: 'flex-end' }}>
              <span className={tokenPercent >= 90 ? 'token-status-warn' : 'token-status-ok'} style={{ fontWeight: 500 }}>
                Status: {tokenStatus}
              </span>
            </div>
          </div>
        )}
        {error && <p role="alert" style={{ color: '#ef4444', marginTop: '16px' }}>{error}</p>}
      </div>

      {generatedCards.length > 0 && (
        <div className="generator-card" style={{ padding: '28px' }}>
          <h2 className="card-title" style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px' }}>
            Flashcard Preview
          </h2>

          <ul className="generated-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', flexDirection: 'row' }}>
            {generatedCards.map((card) => (
              <li key={card.id} className="generated-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '24px' }}>
                <div>
                  <span style={{ display: 'inline-flex', background: 'var(--accent-bg)', padding: '6px', borderRadius: '8px', margin: '0 0 16px 0' }}>
                    <HelpCircle size={20} color="var(--accent)" aria-hidden="true" />
                  </span>
                  <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-h)', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                    {card.question}
                  </p>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '16px' }}>
                  <label className="save-checkbox">
                    <input
                      type="checkbox"
                      checked={savedIds.has(card.id)}
                      disabled={savedIds.has(card.id)}
                      onChange={() => handleSave(card)}
                    />
                    {savedIds.has(card.id) ? (
                      <BookmarkCheck size={16} aria-hidden="true" />
                    ) : (
                      <Bookmark size={16} aria-hidden="true" />
                    )}
                    {savedIds.has(card.id) ? 'Gespeichert' : 'In Sammlung speichern'}
                  </label>
                </div>
              </li>
            ))}
          </ul>

          <p style={{ fontSize: '13px', color: 'var(--text)', marginTop: '24px', textAlign: 'center' }}>
            {generatedCards.length} {generatedCards.length === 1 ? 'Karte' : 'Karten'} generiert
          </p>
        </div>
      )}
    </section>
  )
}