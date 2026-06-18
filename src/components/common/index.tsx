import type { AlertSeverity } from '../../types'

// ─── LoadingSpinner ───────────────────────────────────────────────────────────

interface SpinnerProps { large?: boolean; label?: string }

export function LoadingSpinner({ large, label }: SpinnerProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
      <span className={`spinner${large ? ' spinner-lg' : ''}`} role="status" aria-label={label ?? 'Loading'} />
      {label && <span className="text-sm text-muted">{label}</span>}
    </div>
  )
}

export function LoadingPage({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="loading-page">
      <LoadingSpinner large label={label} />
    </div>
  )
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state-icon">{icon}</div>}
      <p className="empty-state-title">{title}</p>
      {description && <p className="empty-state-desc">{description}</p>}
      {action && <div style={{ marginTop: '0.75rem' }}>{action}</div>}
    </div>
  )
}

// ─── ErrorMessage ─────────────────────────────────────────────────────────────

export function ErrorMessage({ message }: { message: string }) {
  if (!message) return null
  return (
    <div className="alert-strip danger" role="alert">
      <span>⚠</span>
      <span>{message}</span>
    </div>
  )
}

export function SuccessMessage({ message }: { message: string }) {
  if (!message) return null
  return (
    <div className="alert-strip success" role="status">
      <span>✓</span>
      <span>{message}</span>
    </div>
  )
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────

const severityClass: Record<AlertSeverity, string> = {
  info: 'badge-info',
  warning: 'badge-warning',
  critical: 'badge-danger',
}

export function StatusBadge({
  label, variant = 'neutral'
}: {
  label: string
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral'
}) {
  return <span className={`badge badge-${variant}`}>{label}</span>
}

export function SeverityBadge({ severity }: { severity: AlertSeverity }) {
  return (
    <span className={`badge ${severityClass[severity]}`}>
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </span>
  )
}

// ─── SummaryCard ─────────────────────────────────────────────────────────────

interface SummaryCardProps {
  label: string
  value: string | number
  unit?: string
  icon?: React.ReactNode
  color?: string
  subtext?: string
}

export function SummaryCard({ label, value, unit, icon, color = 'var(--color-brand)', subtext }: SummaryCardProps) {
  return (
    <div className="card card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="text-sm text-muted">{label}</span>
        {icon && (
          <div style={{
            width: 36, height: 36, borderRadius: 'var(--radius-md)',
            background: `${color}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color,
          }}>
            {icon}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
        <span style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: 'var(--font-display)', lineHeight: 1 }}>
          {value}
        </span>
        {unit && <span className="text-sm text-muted">{unit}</span>}
      </div>
      {subtext && <p className="text-xs text-muted">{subtext}</p>}
    </div>
  )
}

// ─── ProgressCard ─────────────────────────────────────────────────────────────

interface ProgressCardProps {
  label: string
  current: number
  target: number
  unit?: string
  color?: string
}

export function ProgressCard({ label, current, target, unit, color }: ProgressCardProps) {
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0
  const fillClass = pct >= 100 ? 'success' : pct >= 60 ? '' : 'warning'

  return (
    <div className="card card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="text-sm text-muted">{label}</span>
        <span className="text-sm font-semibold">{pct}%</span>
      </div>
      <div className="progress-bar-track">
        <div
          className={`progress-bar-fill ${fillClass}`}
          style={{ width: `${pct}%`, ...(color ? { background: color } : {}) }}
        />
      </div>
      <p className="text-xs text-muted">
        {current}{unit ?? ''} / {target}{unit ?? ''}
      </p>
    </div>
  )
}

// ─── FormField ────────────────────────────────────────────────────────────────

interface FormFieldProps {
  label: string
  required?: boolean
  hint?: string
  error?: string
  children: React.ReactNode
}

export function FormField({ label, required, hint, error, children }: FormFieldProps) {
  return (
    <div className="form-group">
      <label className={`form-label${required ? ' form-label-required' : ''}`}>{label}</label>
      {children}
      {hint && !error && <p className="form-hint">{hint}</p>}
      {error && <p className="form-error">⚠ {error}</p>}
    </div>
  )
}
