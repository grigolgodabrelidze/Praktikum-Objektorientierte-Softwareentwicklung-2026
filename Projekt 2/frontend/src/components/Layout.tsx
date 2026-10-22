import { Bell, Moon, Sun, User } from 'lucide-react'
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useClickOutside } from '../hooks/useClickOutside'
import { useTheme } from '../hooks/useTheme'
import { Sidebar } from './Sidebar'
import './Layout.css'
import '../pages/pages.css'

export function Layout() {
  const [isBellOpen, setIsBellOpen] = useState(false)
  const [isAvatarOpen, setIsAvatarOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()

  const bellRef = useClickOutside<HTMLDivElement>(() => setIsBellOpen(false))
  const avatarRef = useClickOutside<HTMLDivElement>(() => setIsAvatarOpen(false))

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <header className="app-header">
          <button
            type="button"
            className="icon-button"
            aria-label={theme === 'light' ? 'Dark Mode aktivieren' : 'Light Mode aktivieren'}
            onClick={toggleTheme}
          >
            {theme === 'light' ? <Moon size={17} aria-hidden="true" /> : <Sun size={17} aria-hidden="true" />}
          </button>

          <div className="dropdown" ref={bellRef}>
            <button
              type="button"
              className="icon-button"
              aria-label="Benachrichtigungen"
              onClick={() => setIsBellOpen((open) => !open)}
            >
              <Bell size={17} aria-hidden="true" />
            </button>
            {isBellOpen && (
              <div className="dropdown-panel">
                <p className="dropdown-title">Benachrichtigungen</p>
                <p className="dropdown-empty">Keine neuen Benachrichtigungen.</p>
              </div>
            )}
          </div>

          <div className="dropdown" ref={avatarRef}>
            <button
              type="button"
              className="avatar"
              aria-label="Profilmenü"
              onClick={() => setIsAvatarOpen((open) => !open)}
            >
              <User size={16} aria-hidden="true" />
            </button>
            {isAvatarOpen && (
              <div className="dropdown-panel">
                <p className="dropdown-title">Gast</p>
                <p className="dropdown-empty">Login noch nicht implementiert.</p>
              </div>
            )}
          </div>
        </header>
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
