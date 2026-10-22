import { BookOpen, Loader2, MessageSquare, PlusCircle, Send } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'
import 'katex/dist/katex.min.css'
import { chaptersService } from '../services/ChaptersService'
import { chatService } from '../services/ChatService'
import type { Chapter } from '../types/api'

interface Message {
  role: 'user' | 'ai'
  content: string
}

const CHAT_STORAGE_KEY = 'lernwerkzeug_chat_history'
const CHAPTER_STORAGE_KEY = 'lernwerkzeug_chat_chapter'

export function QuestionChat() {
  const [chapters, setChapters] = useState<Chapter[]>([])
  
  // 1. Initialisiere den State direkt aus dem localStorage
  const [selectedChapter, setSelectedChapter] = useState<string>(() => {
    return localStorage.getItem(CHAPTER_STORAGE_KEY) || ''
  })
  
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem(CHAT_STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  })

  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chaptersService.getChapters().then(setChapters)
  }, [])

  // 2. Speichere Nachrichten automatisch bei jeder Änderung
  useEffect(() => {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages))
  }, [messages])

  // Speichere auch das ausgewählte Kapitel
  useEffect(() => {
    localStorage.setItem(CHAPTER_STORAGE_KEY, selectedChapter)
  }, [selectedChapter])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // 3. Funktion zum Zurücksetzen / Starten eines neuen Chats
  function handleNewChat() {
    setMessages([])
    localStorage.removeItem(CHAT_STORAGE_KEY)
  }

  async function handleSend() {
    if (!input.trim() || !selectedChapter) return

    const userMessage = input
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      const response = await chatService.askQuestion({
        chapter_id: selectedChapter,
        question: userMessage,
      })
      setMessages((prev) => [...prev, { role: 'ai', content: response.answer }])
    } catch (err) {
      console.error('Fehler bei /api/chat/ask:', err)
      setMessages((prev) => [
        ...prev,
        { role: 'ai', content: 'Fehler: Konnte keine Antwort generieren.' },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="study-grid" style={{ height: 'calc(100vh - 150px)' }}>
      {/* Linke Seite: Skript-Auswahl & Neuer Chat Button */}
      <aside className="study-sidebar">
        <div
          className="stat-card"
          style={{ padding: '20px', textAlign: 'left', alignItems: 'flex-start' }}
        >
          <h3
            style={{
              fontSize: '14px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <BookOpen size={16} /> Skript auswählen
          </h3>
          <select
            value={selectedChapter}
            onChange={(e) => setSelectedChapter(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
            }}
          >
            <option value="">Kapitel wählen...</option>
            {chapters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
          
          {/* Button für "Neuer Chat" */}
          <button
            type="button"
            className="btn-outline w-full"
            onClick={handleNewChat}
            style={{
              marginTop: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%'
            }}
          >
            <PlusCircle size={16} /> Neuer Chat
          </button>

          <p style={{ fontSize: '12px', color: 'var(--text)', marginTop: '16px' }}>
            Die KI antwortet basierend auf dem ausgewählten Material.
          </p>
        </div>
      </aside>

      {/* Rechte Seite: Chat Interface */}
      <main
        className="study-main"
        style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
      >
        {selectedChapter && (
          <div className="chat-reference-badge">
            <BookOpen size={14} aria-hidden="true" />
            Referenz: {chapters.find((c) => c.id === selectedChapter)?.title}
          </div>
        )}
        <div
          ref={scrollRef}
          className="generator-card"
          style={{
            flex: 1,
            overflowY: 'auto',
            marginBottom: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', marginTop: '60px', color: 'var(--text)' }}>
              <MessageSquare size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
              <p>Stelle eine Frage zu deinem Skript.</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                padding: '12px 16px',
                borderRadius: '12px',
                maxWidth: '80%',
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                background: msg.role === 'user' ? 'var(--accent)' : 'var(--code-bg)',
                color: msg.role === 'user' ? 'white' : 'var(--text-h)',
                lineHeight: '1.6',
              }}
            >
              {msg.role === 'ai' ? (
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {msg.content}
                </ReactMarkdown>
              ) : (
                msg.content
              )}
            </div>
          ))}
          {isLoading && (
            <div
              style={{
                alignSelf: 'flex-start',
                color: 'var(--text)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Loader2
                size={16}
                aria-hidden="true"
                style={{ animation: 'spin 1s linear infinite' }}
              />
              KI denkt nach…
            </div>
          )}
        </div>

        {/* Eingabebereich */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Frage stellen..."
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input || !selectedChapter}
            style={{ padding: '0 20px' }}
          >
            <Send size={18} />
          </button>
        </div>
      </main>
    </div>
  )
}