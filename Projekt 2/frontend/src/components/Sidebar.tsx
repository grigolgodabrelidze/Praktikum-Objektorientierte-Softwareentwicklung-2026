import { HelpCircle, LayoutDashboard, NotebookText, Sparkles } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import './Sidebar.css'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/generieren', label: 'Karten-Generator', icon: Sparkles },
  { to: '/study-room', label: 'Study Room', icon: NotebookText },
  { to: '/quiz-modus', label: 'Quiz-Modus', icon: HelpCircle },
]

export function Sidebar() {
  return (
    <nav className="sidebar" aria-label="Hauptnavigation">
      <div className="sidebar-brand">
        <span className="sidebar-logo">67</span>
        Lernwerkzeug
      </div>
      <ul className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <li key={item.to}>
            <NavLink to={item.to} end={item.end}>
              <item.icon size={17} aria-hidden="true" />
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
