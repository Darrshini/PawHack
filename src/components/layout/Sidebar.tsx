import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Cat, UtensilsCrossed, HeartPulse, Activity,
  Bell, Cpu, AlertTriangle, Settings, LogOut, ChevronDown
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { usePet } from '../../contexts/PetContext'
import { useState } from 'react'

interface SidebarProps {
  onClose?: () => void
  alertCount?: number
}

const navLinks = [
  { to: '/dashboard',    icon: LayoutDashboard,  label: 'Dashboard' },
  { to: '/pets',         icon: Cat,              label: 'Pets' },
  { to: '/meal-planner', icon: UtensilsCrossed,  label: 'Meal Planner' },
  { to: '/health',       icon: HeartPulse,       label: 'Health' },
  { to: '/activity',     icon: Activity,         label: 'Activity' },
  { to: '/reminders',    icon: Bell,             label: 'Reminders' },
  { to: '/devices',      icon: Cpu,              label: 'Devices' },
  { to: '/alerts',       icon: AlertTriangle,    label: 'Alerts', badge: true },
  { to: '/settings',     icon: Settings,         label: 'Settings' },
]

export function Sidebar({ onClose, alertCount = 0 }: SidebarProps) {
  const { signOut } = useAuth()
  const { pets, activePet, setActivePet } = usePet()
  const navigate = useNavigate()
  const [petDropOpen, setPetDropOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <aside className="app-sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">🐾</div>
        <span className="sidebar-brand-name">PawPal</span>
      </div>

      {/* Pet Switcher */}
      {pets.length > 0 && (
        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            className="btn"
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.08)',
              color: 'var(--color-sidebar-text-active)',
              justifyContent: 'space-between',
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              minHeight: '40px',
            }}
            onClick={() => setPetDropOpen(!petDropOpen)}
            aria-expanded={petDropOpen}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1rem' }}>{activePet?.species === 'Cat' ? '🐱' : '🐶'}</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {activePet?.name ?? 'Select pet'}
              </span>
            </span>
            <ChevronDown size={14} style={{ flexShrink: 0, transform: petDropOpen ? 'rotate(180deg)' : 'none', transition: '150ms' }} />
          </button>

          {petDropOpen && (
            <div style={{
              marginTop: '0.375rem',
              background: 'rgba(255,255,255,0.06)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
            }}>
              {pets.map(pet => (
                <button
                  key={pet.id}
                  onClick={() => { setActivePet(pet); setPetDropOpen(false); onClose?.() }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    background: activePet?.id === pet.id ? 'rgba(91,110,245,0.3)' : 'transparent',
                    color: activePet?.id === pet.id ? 'white' : 'var(--color-sidebar-text)',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    border: 'none',
                  }}
                >
                  <span>{pet.species === 'Cat' ? '🐱' : '🐶'}</span>
                  {pet.name}
                </button>
              ))}
              <button
                onClick={() => { navigate('/pets'); onClose?.(); setPetDropOpen(false) }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  background: 'transparent',
                  color: 'var(--color-brand)',
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  border: 'none',
                  borderTop: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                + Add pet
              </button>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navLinks.map(({ to, icon: Icon, label, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            onClick={onClose}
          >
            <Icon size={18} />
            {label}
            {badge && alertCount > 0 && (
              <span className="sidebar-link-badge">{alertCount > 99 ? '99+' : alertCount}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <button
          onClick={handleSignOut}
          className="sidebar-link"
          style={{ width: '100%', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
