import { Menu, Sun, Moon, Bell } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { usePet } from '../../contexts/PetContext'
import { useNavigate } from 'react-router-dom'

interface TopBarProps {
  onMenuToggle: () => void
  alertCount?: number
}

export function TopBar({ onMenuToggle, alertCount = 0 }: TopBarProps) {
  const { theme, toggleTheme } = useTheme()
  const { activePet } = usePet()
  const navigate = useNavigate()

  return (
    <header className="app-topbar">
      {/* Mobile menu button */}
      <button
        className="btn btn-ghost btn-icon"
        onClick={onMenuToggle}
        aria-label="Toggle navigation"
        style={{ display: 'none' }}
        id="mobile-menu-btn"
      >
        <Menu size={22} />
      </button>

      {/* Title / pet name */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>
          {activePet ? `${activePet.name}'s Dashboard` : 'PawPal'}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {/* Alerts */}
        <button
          className="btn btn-ghost btn-icon"
          onClick={() => navigate('/alerts')}
          aria-label={`Alerts (${alertCount} unread)`}
          style={{ position: 'relative' }}
        >
          <Bell size={20} />
          {alertCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '6px',
              right: '6px',
              width: '8px',
              height: '8px',
              background: 'var(--color-danger)',
              borderRadius: '50%',
              border: '1.5px solid var(--color-surface)',
            }} />
          )}
        </button>

        {/* Theme toggle */}
        <button
          className="btn btn-ghost btn-icon"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>

      {/* CSS to show mobile menu button below 1024px */}
      <style>{`
        @media (max-width: 1023px) {
          #mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </header>
  )
}
