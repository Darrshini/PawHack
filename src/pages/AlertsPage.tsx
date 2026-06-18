import { useState, useEffect } from 'react'
import { getAlerts, markAlertRead, markAllAlertsRead, deleteAlert } from '../services/deviceService'
import type { Alert, AlertSeverity } from '../types'
import { ConfirmationDialog } from '../components/common/ConfirmationDialog'
import { EmptyState, LoadingSpinner, ErrorMessage, SeverityBadge } from '../components/common'
import { Trash2, CheckCheck, Bell } from 'lucide-react'
import { format } from 'date-fns'

const ALERT_EMOJI: Record<string, string> = {
  missed_medication: '💊', missed_meal: '🍽', low_food: '📦',
  low_water: '💧', low_battery: '🔋', unusual_inactivity: '😴',
  outside_safe_zone: '📍', high_temperature: '🌡',
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterSeverity, setFilterSeverity] = useState<AlertSeverity | 'all'>('all')
  const [markingAll, setMarkingAll] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Alert | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await getAlerts()
      setAlerts(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load alerts.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const handleMarkRead = async (id: string) => {
    try {
      await markAlertRead(id)
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_read: true } : a))
    } catch {
      setError('Failed to mark as read.')
    }
  }

  const handleMarkAllRead = async () => {
    setMarkingAll(true)
    try {
      await markAllAlertsRead()
      setAlerts(prev => prev.map(a => ({ ...a, is_read: true })))
    } catch {
      setError('Failed to mark all as read.')
    } finally {
      setMarkingAll(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteAlert(deleteTarget.id)
      setAlerts(prev => prev.filter(a => a.id !== deleteTarget.id))
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  const filtered = filterSeverity === 'all'
    ? alerts
    : alerts.filter(a => a.severity === filterSeverity)

  const unreadCount = alerts.filter(a => !a.is_read).length

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><LoadingSpinner large /></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Alerts</h1>
          <p className="page-subtitle">{unreadCount} unread · {alerts.length} total</p>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-secondary" onClick={handleMarkAllRead} disabled={markingAll}>
            <CheckCheck size={16} /> {markingAll ? 'Marking…' : 'Mark all read'}
          </button>
        )}
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Severity filter */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {(['all', 'critical', 'warning', 'info'] as const).map(s => (
          <button
            key={s}
            className="btn btn-sm"
            onClick={() => setFilterSeverity(s)}
            style={{
              background: filterSeverity === s ? 'var(--color-brand)' : 'var(--color-surface)',
              color: filterSeverity === s ? 'white' : 'var(--color-text-secondary)',
              border: '1.5px solid',
              borderColor: filterSeverity === s ? 'var(--color-brand)' : 'var(--color-border)',
            }}
          >
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            {s !== 'all' && (
              <span style={{ marginLeft: '0.375rem', opacity: 0.8 }}>
                ({alerts.filter(a => a.severity === s).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Bell size={28} style={{ color: 'var(--color-success)' }} />}
            title={filterSeverity === 'all' ? 'No alerts' : `No ${filterSeverity} alerts`}
            description="Everything looks good for your pet."
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {filtered.map(alert => (
            <div
              key={alert.id}
              className="card card-body"
              style={{
                opacity: alert.is_read ? 0.7 : 1,
                borderLeft: `3px solid ${alert.severity === 'critical' ? 'var(--color-danger)' : alert.severity === 'warning' ? 'var(--color-warning)' : 'var(--color-info)'}`,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                flexWrap: 'wrap',
              }}
            >
              <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>{ALERT_EMOJI[alert.alert_type] ?? '🔔'}</span>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <p className="font-semibold text-sm">{alert.title}</p>
                  <SeverityBadge severity={alert.severity} />
                  {!alert.is_read && (
                    <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>Unread</span>
                  )}
                </div>
                <p className="text-sm text-muted" style={{ marginTop: '0.125rem' }}>{alert.message}</p>
                <p className="text-xs text-muted" style={{ marginTop: '0.25rem' }}>
                  {format(new Date(alert.created_at), 'd MMM yyyy, h:mm a')}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}>
                {!alert.is_read && (
                  <button className="btn btn-secondary btn-sm" onClick={() => handleMarkRead(alert.id)}>
                    <CheckCheck size={14} /> Read
                  </button>
                )}
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ color: 'var(--color-danger)' }}
                  onClick={() => setDeleteTarget(alert)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmationDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete alert?"
        message={`"${deleteTarget?.title}" will be permanently deleted.`}
        loading={deleting}
      />
    </div>
  )
}
