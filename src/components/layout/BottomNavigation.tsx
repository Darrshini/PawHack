import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, UtensilsCrossed, Plus, HeartPulse, Cat, MoreHorizontal } from 'lucide-react'
import { useState } from 'react'

export function BottomNavigation() {
  const navigate = useNavigate()
  const [moreOpen, setMoreOpen] = useState(false)

  return (
    <>
      {moreOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 150, background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setMoreOpen(false)}
        >
          <div
            style={{
              position: 'absolute',
              bottom: 'calc(var(--bottomnav-height) + 8px)',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius-lg)',
              padding: '0.75rem',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.5rem',
              width: '280px',
              boxShadow: 'var(--shadow-lg)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {[
              { to: '/activity',  emoji: '🏃', label: 'Activity' },
              { to: '/reminders', emoji: '🔔', label: 'Reminders' },
              { to: '/devices',   emoji: '📡', label: 'Devices' },
              { to: '/alerts',    emoji: '⚠️',  label: 'Alerts' },
              { to: '/settings',  emoji: '⚙️',  label: 'Settings' },
            ].map(({ to, emoji, label }) => (
              <button
                key={to}
                onClick={() => { navigate(to); setMoreOpen(false) }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem',
                  background: 'var(--color-surface-alt)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'var(--color-text-primary)',
                }}
              >
                <span>{emoji}</span>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <nav className="bottom-nav">
        <div className="bottom-nav-inner">
          <NavLink to="/dashboard" className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}>
            <LayoutDashboard size={22} />
            <span>Home</span>
          </NavLink>

          <NavLink to="/meal-planner" className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}>
            <UtensilsCrossed size={22} />
            <span>Meals</span>
          </NavLink>

          <div className="bottom-nav-add">
            <button
              className="bottom-nav-add-btn"
              aria-label="Quick add"
              onClick={() => navigate('/health')}
            >
              <Plus size={24} />
            </button>
          </div>

          <NavLink to="/health" className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}>
            <HeartPulse size={22} />
            <span>Health</span>
          </NavLink>

          <NavLink to="/pets" className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}>
            <Cat size={22} />
            <span>Pets</span>
          </NavLink>
        </div>
      </nav>
    </>
  )
}
