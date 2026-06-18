import { useState, useEffect } from 'react'
import { usePet } from '../contexts/PetContext'
import {
  getWeightLogs, createWeightLog, deleteWeightLog,
  getHealthRecords, createHealthRecord, updateHealthRecord, deleteHealthRecord,
  getMedications, createMedication, updateMedication, deleteMedication,
} from '../services/healthService'
import type { WeightLog, HealthRecord, Medication, HealthRecordType } from '../types'
import { Modal } from '../components/common/Modal'
import { ConfirmationDialog } from '../components/common/ConfirmationDialog'
import { FormField, EmptyState, LoadingSpinner, ErrorMessage } from '../components/common'
import { Plus, Trash2, Edit2, Scale, FileText, Pill } from 'lucide-react'
import { format } from 'date-fns'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

type Tab = 'weight' | 'records' | 'medications'

const RECORD_TYPES: HealthRecordType[] = [
  'vaccination', 'checkup', 'surgery', 'dental', 'allergy_test',
  'blood_test', 'xray', 'prescription', 'other',
]

export default function HealthPage() {
  const { activePet } = usePet()
  const [tab, setTab] = useState<Tab>('weight')

  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([])
  const [records, setRecords] = useState<HealthRecord[]>([])
  const [medications, setMedications] = useState<Medication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Weight form
  const [weightOpen, setWeightOpen] = useState(false)
  const [weightForm, setWeightForm] = useState({ weight_kg: '', recorded_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"), notes: '' })
  const [savingWeight, setSavingWeight] = useState(false)
  const [deleteWeight, setDeleteWeight] = useState<WeightLog | null>(null)

  // Record form
  const [recordOpen, setRecordOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<HealthRecord | null>(null)
  const [recordForm, setRecordForm] = useState({
    record_type: 'checkup' as HealthRecordType, title: '', record_date: format(new Date(), 'yyyy-MM-dd'),
    veterinarian: '', notes: '', next_due_date: '',
  })
  const [savingRecord, setSavingRecord] = useState(false)
  const [deleteRecord, setDeleteRecord] = useState<HealthRecord | null>(null)

  // Medication form
  const [medOpen, setMedOpen] = useState(false)
  const [editingMed, setEditingMed] = useState<Medication | null>(null)
  const [medForm, setMedForm] = useState({
    name: '', dosage: '', instructions: '', start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: '', scheduled_time: '', is_active: true,
  })
  const [savingMed, setSavingMed] = useState(false)
  const [deleteMed, setDeleteMed] = useState<Medication | null>(null)
  const [deletingItem, setDeletingItem] = useState(false)

  const loadData = async () => {
    if (!activePet) return
    setLoading(true)
    try {
      const [wLogs, recs, meds] = await Promise.all([
        getWeightLogs(activePet.id),
        getHealthRecords(activePet.id),
        getMedications(activePet.id),
      ])
      setWeightLogs(wLogs)
      setRecords(recs)
      setMedications(meds)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load health data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [activePet])

  // ─── Weight ───────────────────────────────────────────────────────────────

  const handleSaveWeight = async () => {
    if (!activePet || !weightForm.weight_kg) return
    setSavingWeight(true)
    try {
      await createWeightLog({
        pet_id: activePet.id,
        weight_kg: Number(weightForm.weight_kg),
        recorded_at: new Date(weightForm.recorded_at).toISOString(),
        notes: weightForm.notes || undefined,
      })
      setWeightOpen(false)
      setWeightForm({ weight_kg: '', recorded_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"), notes: '' })
      const wLogs = await getWeightLogs(activePet.id)
      setWeightLogs(wLogs)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save weight.')
    } finally {
      setSavingWeight(false)
    }
  }

  const handleDeleteWeight = async () => {
    if (!deleteWeight) return
    setDeletingItem(true)
    try {
      await deleteWeightLog(deleteWeight.id)
      setWeightLogs(prev => prev.filter(w => w.id !== deleteWeight.id))
      setDeleteWeight(null)
    } finally {
      setDeletingItem(false)
    }
  }

  // ─── Records ──────────────────────────────────────────────────────────────

  const openAddRecord = () => {
    setEditingRecord(null)
    setRecordForm({ record_type: 'checkup', title: '', record_date: format(new Date(), 'yyyy-MM-dd'), veterinarian: '', notes: '', next_due_date: '' })
    setRecordOpen(true)
  }

  const openEditRecord = (r: HealthRecord) => {
    setEditingRecord(r)
    setRecordForm({
      record_type: r.record_type, title: r.title, record_date: r.record_date,
      veterinarian: r.veterinarian ?? '', notes: r.notes ?? '', next_due_date: r.next_due_date ?? '',
    })
    setRecordOpen(true)
  }

  const handleSaveRecord = async () => {
    if (!activePet || !recordForm.title) return
    setSavingRecord(true)
    try {
      if (editingRecord) {
        await updateHealthRecord(editingRecord.id, {
          ...recordForm,
          veterinarian: recordForm.veterinarian || undefined,
          notes: recordForm.notes || undefined,
          next_due_date: recordForm.next_due_date || undefined,
        })
      } else {
        await createHealthRecord({ pet_id: activePet.id, ...recordForm })
      }
      setRecordOpen(false)
      const recs = await getHealthRecords(activePet.id)
      setRecords(recs)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save record.')
    } finally {
      setSavingRecord(false)
    }
  }

  const handleDeleteRecord = async () => {
    if (!deleteRecord) return
    setDeletingItem(true)
    try {
      await deleteHealthRecord(deleteRecord.id)
      setRecords(prev => prev.filter(r => r.id !== deleteRecord.id))
      setDeleteRecord(null)
    } finally {
      setDeletingItem(false)
    }
  }

  // ─── Medications ──────────────────────────────────────────────────────────

  const openAddMed = () => {
    setEditingMed(null)
    setMedForm({ name: '', dosage: '', instructions: '', start_date: format(new Date(), 'yyyy-MM-dd'), end_date: '', scheduled_time: '', is_active: true })
    setMedOpen(true)
  }

  const openEditMed = (m: Medication) => {
    setEditingMed(m)
    setMedForm({
      name: m.name, dosage: m.dosage ?? '', instructions: m.instructions ?? '',
      start_date: m.start_date, end_date: m.end_date ?? '', scheduled_time: m.scheduled_time ?? '', is_active: m.is_active,
    })
    setMedOpen(true)
  }

  const handleSaveMed = async () => {
    if (!activePet || !medForm.name) return
    setSavingMed(true)
    try {
      if (editingMed) {
        await updateMedication(editingMed.id, { ...medForm, end_date: medForm.end_date || undefined, scheduled_time: medForm.scheduled_time || undefined })
      } else {
        await createMedication({ pet_id: activePet.id, ...medForm })
      }
      setMedOpen(false)
      const meds = await getMedications(activePet.id)
      setMedications(meds)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save medication.')
    } finally {
      setSavingMed(false)
    }
  }

  const handleDeleteMed = async () => {
    if (!deleteMed) return
    setDeletingItem(true)
    try {
      await deleteMedication(deleteMed.id)
      setMedications(prev => prev.filter(m => m.id !== deleteMed.id))
      setDeleteMed(null)
    } finally {
      setDeletingItem(false)
    }
  }

  if (!activePet) return <div><h1 className="page-title">Health</h1><p className="text-muted" style={{ marginTop: '1rem' }}>No pet selected.</p></div>
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><LoadingSpinner large /></div>

  const weightChartData = [...weightLogs].reverse().map(w => ({
    date: format(new Date(w.recorded_at), 'MMM d'),
    weight: w.weight_kg,
  }))

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Health</h1>
          <p className="page-subtitle">{activePet.name}'s health records</p>
        </div>
        <div>
          {tab === 'weight' && <button className="btn btn-primary" onClick={() => setWeightOpen(true)}><Plus size={16} /> Log Weight</button>}
          {tab === 'records' && <button className="btn btn-primary" onClick={openAddRecord}><Plus size={16} /> Add Record</button>}
          {tab === 'medications' && <button className="btn btn-primary" onClick={openAddMed}><Plus size={16} /> Add Medication</button>}
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0' }}>
        {([
          { key: 'weight', label: 'Weight', icon: Scale },
          { key: 'records', label: 'Records', icon: FileText },
          { key: 'medications', label: 'Medications', icon: Pill },
        ] as { key: Tab; label: string; icon: typeof Scale }[]).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.375rem',
              padding: '0.625rem 1rem', border: 'none', background: 'none', cursor: 'pointer',
              fontSize: '0.9rem', fontWeight: 600,
              color: tab === key ? 'var(--color-brand)' : 'var(--color-text-secondary)',
              borderBottom: tab === key ? '2px solid var(--color-brand)' : '2px solid transparent',
              marginBottom: '-1px',
            }}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {/* Weight Tab */}
      {tab === 'weight' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {weightChartData.length >= 2 && (
            <div className="card">
              <div className="card-header"><h3 className="card-title">Weight Trend</h3></div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={weightChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} />
                    <YAxis tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} domain={['dataMin - 0.5', 'dataMax + 0.5']} unit=" kg" />
                    <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8 }} />
                    <Line type="monotone" dataKey="weight" stroke="var(--color-brand)" strokeWidth={2.5} dot={{ fill: 'var(--color-brand)', r: 4 }} activeDot={{ r: 6 }} />
                    {activePet.target_weight_kg && (
                      <Line dataKey={() => activePet.target_weight_kg} stroke="var(--color-success)" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="Target" />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-header"><h3 className="card-title">Weight History</h3></div>
            {weightLogs.length === 0 ? (
              <EmptyState title="No weight logs yet" description="Start logging weights to see trends over time." />
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Weight</th>
                      <th>Change</th>
                      <th>Notes</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {weightLogs.map((log, i) => {
                      const prev = weightLogs[i + 1]
                      const diff = prev ? Math.round((log.weight_kg - prev.weight_kg) * 100) / 100 : null
                      return (
                        <tr key={log.id}>
                          <td>{format(new Date(log.recorded_at), 'd MMM yyyy')}</td>
                          <td><strong>{log.weight_kg} kg</strong></td>
                          <td>
                            {diff !== null && (
                              <span style={{ color: diff > 0 ? 'var(--color-danger)' : diff < 0 ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                                {diff > 0 ? '+' : ''}{diff} kg
                              </span>
                            )}
                          </td>
                          <td className="text-muted text-sm">{log.notes ?? '—'}</td>
                          <td>
                            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => setDeleteWeight(log)}>
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Records Tab */}
      {tab === 'records' && (
        <div className="card">
          {records.length === 0 ? (
            <EmptyState title="No health records yet" description="Add vet visits, vaccinations, and other health events." action={<button className="btn btn-primary" onClick={openAddRecord}><Plus size={16} /> Add Record</button>} />
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr><th>Date</th><th>Type</th><th>Title</th><th>Vet</th><th>Next due</th><th></th></tr>
                </thead>
                <tbody>
                  {records.map(r => (
                    <tr key={r.id}>
                      <td>{format(new Date(r.record_date), 'd MMM yyyy')}</td>
                      <td><span className="badge badge-info" style={{ textTransform: 'capitalize' }}>{r.record_type.replace(/_/g, ' ')}</span></td>
                      <td>
                        <p className="font-semibold text-sm">{r.title}</p>
                        {r.notes && <p className="text-xs text-muted">{r.notes}</p>}
                      </td>
                      <td className="text-sm text-muted">{r.veterinarian ?? '—'}</td>
                      <td className="text-sm">{r.next_due_date ? format(new Date(r.next_due_date), 'd MMM yyyy') : '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => openEditRecord(r)}><Edit2 size={14} /></button>
                          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => setDeleteRecord(r)}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Medications Tab */}
      {tab === 'medications' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {medications.length === 0 ? (
            <div className="card">
              <EmptyState title="No medications" description="Track active medications and supplements." action={<button className="btn btn-primary" onClick={openAddMed}><Plus size={16} /> Add Medication</button>} />
            </div>
          ) : medications.map(med => (
            <div key={med.id} className="card card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Pill size={16} style={{ color: 'var(--color-brand)' }} />
                  <p className="font-semibold">{med.name}</p>
                  <span className={`badge badge-${med.is_active ? 'success' : 'neutral'}`}>{med.is_active ? 'Active' : 'Inactive'}</span>
                </div>
                {med.dosage && <p className="text-sm text-muted" style={{ marginTop: '0.25rem' }}>Dosage: {med.dosage}</p>}
                {med.instructions && <p className="text-sm text-muted">Instructions: {med.instructions}</p>}
                <p className="text-xs text-muted" style={{ marginTop: '0.25rem' }}>
                  Started {format(new Date(med.start_date), 'd MMM yyyy')}
                  {med.end_date ? ` · Ends ${format(new Date(med.end_date), 'd MMM yyyy')}` : ' · Ongoing'}
                  {med.scheduled_time && ` · Daily at ${med.scheduled_time}`}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => openEditMed(med)}><Edit2 size={14} /></button>
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => setDeleteMed(med)}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Weight Modal */}
      <Modal open={weightOpen} onClose={() => setWeightOpen(false)} title="Log Weight"
        footer={<><button className="btn btn-secondary" onClick={() => setWeightOpen(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSaveWeight} disabled={savingWeight}>{savingWeight ? 'Saving…' : 'Save'}</button></>}>
        <div className="form-row">
          <FormField label="Weight (kg)" required>
            <input type="number" step="0.1" min="0" className="form-input" value={weightForm.weight_kg} onChange={e => setWeightForm(f => ({ ...f, weight_kg: e.target.value }))} placeholder="5.0" />
          </FormField>
          <FormField label="Recorded at">
            <input type="datetime-local" className="form-input" value={weightForm.recorded_at} onChange={e => setWeightForm(f => ({ ...f, recorded_at: e.target.value }))} />
          </FormField>
        </div>
        <FormField label="Notes">
          <input className="form-input" value={weightForm.notes} onChange={e => setWeightForm(f => ({ ...f, notes: e.target.value }))} placeholder="e.g. Vet visit, home scale" />
        </FormField>
      </Modal>

      {/* Record Modal */}
      <Modal open={recordOpen} onClose={() => setRecordOpen(false)} title={editingRecord ? 'Edit Record' : 'Add Health Record'}
        footer={<><button className="btn btn-secondary" onClick={() => setRecordOpen(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSaveRecord} disabled={savingRecord}>{savingRecord ? 'Saving…' : 'Save Record'}</button></>}>
        <div className="form-row">
          <FormField label="Type">
            <select className="form-select" value={recordForm.record_type} onChange={e => setRecordForm(f => ({ ...f, record_type: e.target.value as HealthRecordType }))}>
              {RECORD_TYPES.map(t => <option key={t} value={t} style={{ textTransform: 'capitalize' }}>{t.replace(/_/g, ' ')}</option>)}
            </select>
          </FormField>
          <FormField label="Date" required>
            <input type="date" className="form-input" value={recordForm.record_date} onChange={e => setRecordForm(f => ({ ...f, record_date: e.target.value }))} />
          </FormField>
        </div>
        <FormField label="Title" required>
          <input className="form-input" value={recordForm.title} onChange={e => setRecordForm(f => ({ ...f, title: e.target.value }))} placeholder="Annual wellness exam" />
        </FormField>
        <div className="form-row">
          <FormField label="Veterinarian">
            <input className="form-input" value={recordForm.veterinarian} onChange={e => setRecordForm(f => ({ ...f, veterinarian: e.target.value }))} placeholder="Dr. Smith" />
          </FormField>
          <FormField label="Next due date">
            <input type="date" className="form-input" value={recordForm.next_due_date} onChange={e => setRecordForm(f => ({ ...f, next_due_date: e.target.value }))} />
          </FormField>
        </div>
        <FormField label="Notes">
          <textarea className="form-textarea" value={recordForm.notes} onChange={e => setRecordForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any additional notes…" />
        </FormField>
      </Modal>

      {/* Medication Modal */}
      <Modal open={medOpen} onClose={() => setMedOpen(false)} title={editingMed ? 'Edit Medication' : 'Add Medication'}
        footer={<><button className="btn btn-secondary" onClick={() => setMedOpen(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSaveMed} disabled={savingMed}>{savingMed ? 'Saving…' : 'Save'}</button></>}>
        <FormField label="Medication name" required>
          <input className="form-input" value={medForm.name} onChange={e => setMedForm(f => ({ ...f, name: e.target.value }))} placeholder="Omega-3 capsules" />
        </FormField>
        <div className="form-row">
          <FormField label="Dosage">
            <input className="form-input" value={medForm.dosage} onChange={e => setMedForm(f => ({ ...f, dosage: e.target.value }))} placeholder="1 capsule" />
          </FormField>
          <FormField label="Daily time">
            <input type="time" className="form-input" value={medForm.scheduled_time} onChange={e => setMedForm(f => ({ ...f, scheduled_time: e.target.value }))} />
          </FormField>
        </div>
        <div className="form-row">
          <FormField label="Start date" required>
            <input type="date" className="form-input" value={medForm.start_date} onChange={e => setMedForm(f => ({ ...f, start_date: e.target.value }))} />
          </FormField>
          <FormField label="End date">
            <input type="date" className="form-input" value={medForm.end_date} onChange={e => setMedForm(f => ({ ...f, end_date: e.target.value }))} />
          </FormField>
        </div>
        <FormField label="Instructions">
          <textarea className="form-textarea" value={medForm.instructions} onChange={e => setMedForm(f => ({ ...f, instructions: e.target.value }))} placeholder="Give with food" />
        </FormField>
        <label className="form-checkbox-label">
          <input type="checkbox" checked={medForm.is_active} onChange={e => setMedForm(f => ({ ...f, is_active: e.target.checked }))} />
          Currently active
        </label>
      </Modal>

      {/* Delete confirmations */}
      <ConfirmationDialog open={!!deleteWeight} onClose={() => setDeleteWeight(null)} onConfirm={handleDeleteWeight} title="Delete weight log?" message="This weight entry will be permanently removed." loading={deletingItem} />
      <ConfirmationDialog open={!!deleteRecord} onClose={() => setDeleteRecord(null)} onConfirm={handleDeleteRecord} title="Delete health record?" message={`"${deleteRecord?.title}" will be permanently deleted.`} loading={deletingItem} />
      <ConfirmationDialog open={!!deleteMed} onClose={() => setDeleteMed(null)} onConfirm={handleDeleteMed} title="Delete medication?" message={`"${deleteMed?.name}" will be permanently removed.`} loading={deletingItem} />
    </div>
  )
}
