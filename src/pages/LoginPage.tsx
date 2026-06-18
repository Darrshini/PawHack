import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const validate = () => {
    if (!email.trim()) return 'Email is required.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address.'
    if (password.length < 6) return 'Password must be at least 6 characters.'
    if (mode === 'signup' && !displayName.trim()) return 'Your name is required.'
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const validationError = validate()
    if (validationError) { setError(validationError); return }

    setLoading(true)
    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password)
        if (error) { setError(error); return }
        navigate('/dashboard')
      } else {
        const { error } = await signUp(email, password, displayName)
        if (error) { setError(error); return }
        navigate('/dashboard')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      background: 'var(--color-bg)',
    }}>
      {/* Left panel – branding */}
      <div style={{
        display: 'none',
        flex: 1,
        background: 'linear-gradient(135deg, #3a4fd4 0%, #5b6ef5 50%, #8b5cf6 100%)',
        padding: '3rem',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: '2rem',
        color: 'white',
      }} id="login-left">
        <div>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🐾</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.25rem', fontWeight: 800, lineHeight: 1.2 }}>
            PawPal
          </h1>
          <p style={{ fontSize: '1.125rem', opacity: 0.85, marginTop: '0.5rem' }}>
            The pet-care dashboard for devoted owners
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[
            { icon: '🥩', text: 'Personalised meal plans and calorie tracking' },
            { icon: '⚖️', text: 'Weight trend charts to celebrate progress' },
            { icon: '💊', text: 'Medication reminders you\'ll never miss' },
            { icon: '📡', text: 'Smart device integration at a glance' },
          ].map(({ icon, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
              <span style={{ fontSize: '1.375rem' }}>{icon}</span>
              <span style={{ opacity: 0.9 }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel – form */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
      }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          {/* Mobile logo */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }} id="login-mobile-logo">
            <div style={{ fontSize: '2.5rem' }}>🐾</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800 }}>PawPal</h1>
            <p className="text-muted text-sm" style={{ marginTop: '0.25rem' }}>Pet care, simplified</p>
          </div>

          <div className="card">
            <div className="card-body">
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.25rem' }}>
                {mode === 'login' ? 'Welcome back' : 'Create your account'}
              </h2>

              {error && (
                <div className="alert-strip danger" style={{ marginBottom: '1rem' }}>
                  <span>⚠</span> {error}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {mode === 'signup' && (
                  <div className="form-group">
                    <label className="form-label form-label-required">Your name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Jane Smith"
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      autoComplete="name"
                      disabled={loading}
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label form-label-required">Email address</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete={mode === 'login' ? 'current-password' : 'email'}
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label form-label-required">Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPass ? 'text' : 'password'}
                      className="form-input"
                      placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      disabled={loading}
                      style={{ paddingRight: '2.75rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      style={{
                        position: 'absolute', right: '0.75rem',
                        top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none',
                        color: 'var(--color-text-muted)', cursor: 'pointer',
                        padding: '0.25rem',
                      }}
                      aria-label={showPass ? 'Hide password' : 'Show password'}
                    >
                      {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                  {loading
                    ? (mode === 'login' ? 'Signing in…' : 'Creating account…')
                    : (mode === 'login' ? 'Sign In' : 'Create Account')
                  }
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
                <p className="text-sm text-muted">
                  {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
                  <button
                    type="button"
                    onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
                    style={{ background: 'none', border: 'none', color: 'var(--color-brand)', fontWeight: 600, cursor: 'pointer', fontSize: 'inherit' }}
                  >
                    {mode === 'login' ? 'Sign Up' : 'Sign In'}
                  </button>
                </p>
              </div>

              {mode === 'signup' && (
                <div style={{
                  marginTop: '1rem',
                  padding: '0.875rem',
                  background: 'var(--color-brand-light)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.8125rem',
                  color: 'var(--color-brand)',
                  textAlign: 'center',
                }}>
                  💡 After signing up, you can load <strong>demo data</strong> to explore all features with a sample dog called Milo.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          #login-left { display: flex !important; }
          #login-mobile-logo { display: none !important; }
        }
      `}</style>
    </div>
  )
}
