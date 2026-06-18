import { useState, useEffect } from 'react'
import { usePet } from '../contexts/PetContext'
import { getActivityLogs, createActivityLog, updateActivityLog, deleteActivityLog } from '../services/activityService'
import type { ActivityLog, ActivityType } from '../types'
import { Modal } from '../components/common/Modal'
import { ConfirmationDialog } from '../components/common/ConfirmationDialog'
import { FormField, EmptyState, LoadingSpinner, ErrorMessage } from '../components/common'
import { Plus, Trash2, Edit2, Timer } from 'lucide-react'
import { format, startOfWeek, eachDayOfInterval, endOfWeek, isSameDay } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const ACTIVITY_TYPES: ActivityType[] = ['walk', 'run', 'play', 'swim', 'training', 'other']

const ACTIVITY_EMOJI: Record<ActivityType, string> = {
  walk: '🚶', run: '🏃', play: '🎾', swim: '🏊', training: '🎓', other: '⭐',
}

export default function ActivityPage() {
  const { activePet } = usePet()
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingLog, setEditingLog] = useState<ActivityLog | null>(null)
  const [form, setForm] = useState({
    activity_type: 'walk' as ActivityType,
    duration_minutes: '',
    distance_km: '',
    steps: '',
    sleep_hours: '',
    started_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ActivityLog | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadData = async () => {
    if (!activePet) return
    setLoading(true)
    try {
      const data = await getActivityLogs(activePet.id, 60)
      setLogs(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load activity logs.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [activePet])

  // Build weekly chart data (last 7 days)
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }) // Mon
  const weekDays = eachDayOfInterval({ start: weekStart, end: endOfWeek(new Date(), { weekStartsOn: 1 }) })
  const weekChartData = weekDays.map(day => {
    const dayLogs = logs.filter(l => isSameDay(new Date(l.started_at), day))
    return {
      day: format(day, 'EEE'),
      minutes: dayLogs.reduce((s, l) => s + l.duration_minutes, 0),
    }
  })

  const totalMinutesThisWeek = weekChartData.reduce((s, d) => s + d.minutes, 0)

  const openAdd = () => {
    setEditingLog(null)
    setForm({ activity_type: 'walk', duration_minutes: '', distance_km: '', steps: '', sleep_hours: '', started_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"), notes: '' })
    setModalOpen(true)
  }

  const openEdit = (log: ActivityLog) => {
    setEditingLog(log)
    setForm({
      activity_type: log.activity_type,
      duration_minutes: log.duration_minutes.toString(),
      distance_km: log.distance_km?.toString() ?? '',
      steps: log.steps?.toString() ?? '',
      sleep_hours: log.sleep_hours?.toString() ?? '',
      started_at: format(new Date(log.started_at), "yyyy-MM-dd'T'HH:mm"),
      notes: log.notes ?? '',
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!activePet || !form.duration_minutes) return
    setSaving(true)
    try {
      const payload = {
        pet_id: activePet.id,
        activity_type: form.activity_type,
        duration_minutes: Number(form.duration_minutes),
        distance_km: form.distance_km ? Number(form.distance_km) : undefined,
        steps: form.steps ? Number(form.steps) : undefined,
        sleep_hours: form.sleep_hours ? Number(form.sleep_hours) : undefined,
        started_at: new Date(form.started_at).toISOString(),
        notes: form.notes || undefined,
      }
      if (editingLog) {
        await updateActivityLog(editingLog.id, payload)
      } else {
        await createActivityLog(payload)
      }
      setModalOpen(false)
      await loadData()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save activity.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteActivityLog(deleteTarget.id)
      setLogs(prev => prev.filter(l => l.id !== deleteTarget.id))
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  if (!activePet) return <div><h1 className="page-title">Activity</h1><p className="text-muted" style={{ marginTop: '1rem' }}>No pet selected.</p></div>
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><LoadingSpinner large /></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Activity</h1>
          <p className="page-subtitle">{activePet.name}'s movement & exercise</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Log Activity</button>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Weekly Summary */}
      <div className="dashboard-grid" style={{ marginBottom: '1rem' }}>
        <div className="card card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <p className="text-sm text-muted">This week</p>
          <p style={{ fontSize: '1.75rem', fontWeight: 700 }}>{totalMinutesThisWeek}</p>
          <p className="text-xs text-muted">minutes of activity</p>
        </div>
        <div className="card card-body col-span-3">
          <p className="text-sm text-muted" style={{ marginBottom: '0.5rem' }}>Daily activity (min)</p>
          <ResponsiveContainer width="100%" height={90}>
            <BarChart data={weekChartData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8 }}
                cursor={{ fill: 'var(--color-surface-alt)' }}
                formatter={(v: number) => [`${v} min`, 'Activity']}
              />
              <Bar dataKey="minutes" fill="var(--color-brand)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Log List */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Activity Log</h3>
        </div>
        {logs.length === 0 ? (
          <EmptyState
            title="No activities logged"
            description="Start tracking walks, runs, and play sessions."
            action={<button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Log Activity</button>}
          />
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr><th>Date</th><th>Type</th><th>Duration</th><th>Distance</th><th>Steps</th><th>Notes</th><th></th></tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td>{format(new Date(log.started_at), 'd MMM yyyy, HH:mm')}</td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <span>{ACTIVITY_EMOJI[log.activity_type]}</span>
                        <span className="badge badge-info" style={{ textTransform: 'capitalize' }}>
                          {log.activity_type}
                        </span>
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Timer size={14} style={{ color: 'var(--color-text-muted)' }} />
                        {log.duration_minutes} min
                      </div>
                    </td>
                    <td>{log.distance_km != null ? `${log.distance_km} km` : '—'}</td>
                    <td>{log.steps != null ? log.steps.toLocaleString() : '—'}</td>
                    <td className="text-sm text-muted">{log.notes ?? '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(log)}><Edit2 size={14} /></button>
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => setDeleteTarget(log)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingLog ? 'Edit Activity' : 'Log Activity'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </>
        }
      >
        <div className="form-row">
          <FormField label="Activity type">
            <select className="form-select" value={form.activity_type} onChange={e => setForm(f => ({ ...f, activity_type: e.target.value as ActivityType }))}>
              {ACTIVITY_TYPES.map(t => (
                <option key={t} value={t}>{ACTIVITY_EMOJI[t]} {t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Started at">
            <input type="datetime-local" className="form-input" value={form.started_at} onChange={e => setForm(f => ({ ...f, started_at: e.target.value }))} />
          </FormField>
        </div>
        <div className="form-row">
          <FormField label="Duration (minutes)" required>
            <input type="number" min="1" className="form-input" value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))} placeholder="30" />
          </FormField>
          <FormField label="Distance (km)">
            <input type="number" step="0.1" min="0" className="form-input" value={form.distance_km} onChange={e => setForm(f => ({ ...f, distance_km: e.target.value }))} placeholder="2.5" />
          </FormField>
        </div>
        <div className="form-row">
          <FormField label="Steps">
            <input type="number" min="0" className="form-input" value={form.steps} onChange={e => setForm(f => ({ ...f, steps: e.target.value }))} placeholder="3500" />
          </FormField>
          <FormField label="Sleep hours">
            <input type="number" step="0.5" min="0" max="24" className="form-input" value={form.sleep_hours} onChange={e => setForm(f => ({ ...f, sleep_hours: e.target.value }))} placeholder="12" />
          </FormField>
        </div>
        <FormField label="Notes">
          <input className="form-input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Morning walk around the park" />
        </FormField>
      </Modal>

      <ConfirmationDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete activity log?"
        message="This activity entry will be permanently removed."
        loading={deleting}
      />
    </div>
  )
}
