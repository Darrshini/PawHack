import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { usePet } from '../contexts/PetContext'
import { clearDemoData, hasDemoData } from '../services/demoDataService'
import { supabase } from '../lib/supabase'
import { ConfirmationDialog } from '../components/common/ConfirmationDialog'
import { useNavigate } from 'react-router-dom'
import { Sun, Moon, LogOut, Trash2, User } from 'lucide-react'

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { refreshPets } = usePet()
  const navigate = useNavigate()

  const [displayName, setDisplayName] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [nameMsg, setNameMsg] = useState('')

  const [clearOpen, setClearOpen] = useState(false)
  const [clearing, setClearing] = useState(false)

  const [signOutOpen, setSignOutOpen] = useState(false)

  const demoLoaded = hasDemoData()

  const handleSaveName = async () => {
    if (!displayName.trim() || !user) return
    setSavingName(true)
    setNameMsg('')
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: displayName.trim() })
        .eq('id', user.id)
      if (error) throw error
      setNameMsg('Name updated!')
      setTimeout(() => setNameMsg(''), 2500)
    } catch {
      setNameMsg('Failed to update name.')
    } finally {
      setSavingName(false)
    }
  }

  const handleClearDemo = async () => {
    setClearing(true)
    try {
      await clearDemoData()
      await refreshPets()
      setClearOpen(false)
      navigate('/dashboard')
    } catch (e: unknown) {
      console.error(e)
    } finally {
      setClearing(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '560px' }}>

        {/* Account */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={17} /> Account
            </h2>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <p className="form-label">Email</p>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>{user?.email}</p>
            </div>

            <div className="form-group">
              <label className="form-label">Display name</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  className="form-input"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  style={{ flex: 1 }}
                />
                <button className="btn btn-primary" onClick={handleSaveName} disabled={savingName || !displayName.trim()}>
                  {savingName ? 'Saving…' : 'Save'}
                </button>
              </div>
              {nameMsg && (
                <p style={{ fontSize: '0.8125rem', color: nameMsg.includes('!') ? 'var(--color-success)' : 'var(--color-danger)' }}>
                  {nameMsg}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {theme === 'light' ? <Sun size={17} /> : <Moon size={17} />} Appearance
            </h2>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p className="font-semibold text-sm">Theme</p>
                <p className="text-sm text-muted">{theme === 'light' ? 'Light mode is active' : 'Dark mode is active'}</p>
              </div>
              <button
                className="btn btn-secondary"
                onClick={toggleTheme}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                {theme === 'light' ? <><Moon size={16} /> Switch to Dark</> : <><Sun size={16} /> Switch to Light</>}
              </button>
            </div>
          </div>
        </div>

        {/* Demo data */}
        {demoLoaded && (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                🐶 Demo Data
              </h2>
            </div>
            <div className="card-body">
              <p className="text-sm text-muted" style={{ marginBottom: '1rem' }}>
                Demo data (Milo the Golden Retriever and all associated records) is currently loaded. Clear it to start fresh with your own pet data.
              </p>
              <button
                className="btn btn-danger btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                onClick={() => setClearOpen(true)}
              >
                <Trash2 size={15} /> Clear Demo Data
              </button>
            </div>
          </div>
        )}

        {/* Sign out */}
        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p className="font-semibold text-sm">Sign out</p>
                <p className="text-sm text-muted">You'll need to sign back in to access your data.</p>
              </div>
              <button
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                onClick={() => setSignOutOpen(true)}
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* App info */}
        <p className="text-xs text-muted" style={{ textAlign: 'center', padding: '0.5rem' }}>
          PawPal v1.0.0 · Built with React + Supabase · Data is stored securely in your Supabase project.
        </p>
      </div>

      <ConfirmationDialog
        open={clearOpen}
        onClose={() => setClearOpen(false)}
        onConfirm={handleClearDemo}
        title="Clear demo data?"
        message="This will permanently delete Milo and all associated meal plans, health records, activity logs, and devices. This cannot be undone."
        confirmLabel="Clear Data"
        loading={clearing}
      />

      <ConfirmationDialog
        open={signOutOpen}
        onClose={() => setSignOutOpen(false)}
        onConfirm={handleSignOut}
        title="Sign out?"
        message="You'll be signed out of PawPal and redirected to the login screen."
        confirmLabel="Sign Out"
      />
    </div>
  )
}
