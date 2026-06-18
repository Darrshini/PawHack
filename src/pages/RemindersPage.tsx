import { useState, useEffect } from 'react'
import { usePet } from '../contexts/PetContext'
import { getReminders, createReminder, updateReminder, completeReminder, deleteReminder } from '../services/reminderService'
import type { Reminder, ReminderType } from '../types'
import { Modal } from '../components/common/Modal'
import { ConfirmationDialog } from '../components/common/ConfirmationDialog'
import { FormField, EmptyState, LoadingSpinner, ErrorMessage } from '../components/common'
import { Plus, Trash2, Edit2, Check, Bell, AlertTriangle } from 'lucide-react'
import { format, isPast, isToday } from 'date-fns'

const REMINDER_TYPES: ReminderType[] = [
  'meal', 'medication', 'grooming', 'vaccination', 'vet_appointment', 'food_restock', 'device_charging',
]

const REMINDER_EMOJI: Record<ReminderType, string> = {
  meal: '🍽', medication: '💊', grooming: '✂️', vaccination: '💉',
  vet_appointment: '🏥', food_restock: '🛒', device_charging: '🔋',
}

export default function RemindersPage() {
  const { activePet } = usePet()
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCompleted, setShowCompleted] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null)
  const [form, setForm] = useState({
    reminder_type: 'medication' as ReminderType,
    title: '',
    due_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    repeat_rule: '',
  })
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Reminder | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadData = async () => {
    if (!activePet) return
    setLoading(true)
    try {
      const data = await getReminders(activePet.id)
      setReminders(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load reminders.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [activePet])

  const pending = reminders.filter(r => !r.is_completed)
  const completed = reminders.filter(r => r.is_completed)
  const overdue = pending.filter(r => isPast(new Date(r.due_at)) && !isToday(new Date(r.due_at)))
  const upcoming = pending.filter(r => !isPast(new Date(r.due_at)) || isToday(new Date(r.due_at)))

  const openAdd = () => {
    setEditingReminder(null)
    setForm({ reminder_type: 'medication', title: '', due_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"), repeat_rule: '' })
    setModalOpen(true)
  }

  const openEdit = (r: Reminder) => {
    setEditingReminder(r)
    setForm({
      reminder_type: r.reminder_type,
      title: r.title,
      due_at: format(new Date(r.due_at), "yyyy-MM-dd'T'HH:mm"),
      repeat_rule: r.repeat_rule ?? '',
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!activePet || !form.title) return
    setSaving(true)
    try {
      const payload = {
        pet_id: activePet.id,
        reminder_type: form.reminder_type,
        title: form.title,
        due_at: new Date(form.due_at).toISOString(),
        repeat_rule: form.repeat_rule || undefined,
      }
      if (editingReminder) {
        await updateReminder(editingReminder.id, payload)
      } else {
        await createReminder(payload)
      }
      setModalOpen(false)
      await loadData()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save reminder.')
    } finally {
      setSaving(false)
    }
  }

  const handleComplete = async (id: string) => {
    try {
      await completeReminder(id)
      setReminders(prev => prev.map(r => r.id === id ? { ...r, is_completed: true } : r))
    } catch (e: unknown) {
      setError('Failed to complete reminder.')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteReminder(deleteTarget.id)
      setReminders(prev => prev.filter(r => r.id !== deleteTarget.id))
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  const ReminderRow = ({ r }: { r: Reminder }) => {
    const overdueBool = !r.is_completed && isPast(new Date(r.due_at)) && !isToday(new Date(r.due_at))
    return (
      <div className="card card-body" style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        opacity: r.is_completed ? 0.6 : 1,
        borderLeft: overdueBool ? '3px solid var(--color-danger)' : isToday(new Date(r.due_at)) ? '3px solid var(--color-warning)' : '3px solid transparent',
        flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>{REMINDER_EMOJI[r.reminder_type]}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className={`font-semibold text-sm${r.is_completed ? ' text-muted' : ''}`} style={{ textDecoration: r.is_completed ? 'line-through' : 'none' }}>
            {r.title}
          </p>
          <p className={`text-xs ${overdueBool ? 'text-danger' : 'text-muted'}`}>
            {overdueBool && <AlertTriangle size={11} style={{ display: 'inline', marginRight: 3 }} />}
            {format(new Date(r.due_at), 'd MMM yyyy, h:mm a')}
            {r.repeat_rule && ` · ${r.repeat_rule}`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.375rem' }}>
          {!r.is_completed && (
            <button className="btn btn-secondary btn-sm" onClick={() => handleComplete(r.id)} title="Mark complete">
              <Check size={14} />
            </button>
          )}
          {!r.is_completed && (
            <button className="btn btn-ghost btn-sm" onClick={() => openEdit(r)}><Edit2 size={14} /></button>
          )}
          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => setDeleteTarget(r)}><Trash2 size={14} /></button>
        </div>
      </div>
    )
  }

  if (!activePet) return <div><h1 className="page-title">Reminders</h1><p className="text-muted" style={{ marginTop: '1rem' }}>No pet selected.</p></div>
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><LoadingSpinner large /></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reminders</h1>
          <p className="page-subtitle">{pending.length} pending · {overdue.length} overdue</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Reminder</button>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Overdue */}
      {overdue.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-danger)', marginBottom: '0.625rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <AlertTriangle size={15} /> Overdue
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {overdue.map(r => <ReminderRow key={r.id} r={r} />)}
          </div>
        </div>
      )}

      {/* Upcoming */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.625rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <Bell size={15} /> Upcoming
        </h2>
        {upcoming.length === 0 ? (
          <div className="card">
            <EmptyState
              title="All caught up!"
              description="No upcoming reminders. Add one to stay on track."
              action={<button className="btn btn-primary btn-sm" onClick={openAdd}><Plus size={14} /> Add Reminder</button>}
            />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {upcoming.map(r => <ReminderRow key={r.id} r={r} />)}
          </div>
        )}
      </div>

      {/* Completed */}
      {completed.length > 0 && (
        <div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setShowCompleted(!showCompleted)}
            style={{ marginBottom: '0.625rem', color: 'var(--color-text-secondary)' }}
          >
            {showCompleted ? '▲' : '▼'} Completed ({completed.length})
          </button>
          {showCompleted && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {completed.map(r => <ReminderRow key={r.id} r={r} />)}
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingReminder ? 'Edit Reminder' : 'Add Reminder'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </>
        }
      >
        <FormField label="Type">
          <select className="form-select" value={form.reminder_type} onChange={e => setForm(f => ({ ...f, reminder_type: e.target.value as ReminderType }))}>
            {REMINDER_TYPES.map(t => (
              <option key={t} value={t}>{REMINDER_EMOJI[t]} {t.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Title" required>
          <input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Monthly NexGard dose" />
        </FormField>
        <FormField label="Due date & time" required>
          <input type="datetime-local" className="form-input" value={form.due_at} onChange={e => setForm(f => ({ ...f, due_at: e.target.value }))} />
        </FormField>
        <FormField label="Repeat" hint="e.g. Monthly, Every 2 weeks">
          <input className="form-input" value={form.repeat_rule} onChange={e => setForm(f => ({ ...f, repeat_rule: e.target.value }))} placeholder="Monthly" />
        </FormField>
      </Modal>

      <ConfirmationDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete reminder?"
        message={`"${deleteTarget?.title}" will be permanently deleted.`}
        loading={deleting}
      />
    </div>
  )
}
