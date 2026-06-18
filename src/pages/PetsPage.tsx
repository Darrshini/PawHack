import { useState, useEffect, useRef } from 'react'
import { usePet } from '../contexts/PetContext'
import { useAuth } from '../contexts/AuthContext'
import { createPet, updatePet, deletePet } from '../services/petService'
import { uploadPetPhoto, getPetPhotoUrl } from '../services/storageService'
import type { Pet, ActivityLevel } from '../types'
import { Modal } from '../components/common/Modal'
import { ConfirmationDialog } from '../components/common/ConfirmationDialog'
import { FormField, EmptyState, ErrorMessage, LoadingSpinner } from '../components/common'
import { Plus, Edit2, Trash2, Camera, Check } from 'lucide-react'
import { format } from 'date-fns'

interface PetFormData {
  name: string
  species: string
  breed: string
  birth_date: string
  current_weight_kg: string
  target_weight_kg: string
  activity_level: ActivityLevel
  is_neutered: boolean
  allergies: string
  medical_conditions: string
}

const defaultForm: PetFormData = {
  name: '', species: 'Dog', breed: '', birth_date: '',
  current_weight_kg: '', target_weight_kg: '',
  activity_level: 'moderate', is_neutered: false,
  allergies: '', medical_conditions: '',
}

export default function PetsPage() {
  const { pets, activePet, setActivePet, refreshPets, petsLoading } = usePet()
  const { user } = useAuth()

  const [formOpen, setFormOpen] = useState(false)
  const [editingPet, setEditingPet] = useState<Pet | null>(null)
  const [form, setForm] = useState<PetFormData>(defaultForm)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<Pet | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [petPhotoUrls, setPetPhotoUrls] = useState<Record<string, string>>({})

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load signed URLs for all pet photos
  useEffect(() => {
    const loadUrls = async () => {
      const urls: Record<string, string> = {}
      for (const pet of pets) {
        if (pet.photo_path) {
          const url = await getPetPhotoUrl(pet.photo_path)
          if (url) urls[pet.id] = url
        }
      }
      setPetPhotoUrls(urls)
    }
    if (pets.length) loadUrls()
  }, [pets])

  const openAdd = () => {
    setEditingPet(null)
    setForm(defaultForm)
    setPhotoFile(null)
    setPhotoPreview(null)
    setFormError('')
    setFormOpen(true)
  }

  const openEdit = (pet: Pet) => {
    setEditingPet(pet)
    setForm({
      name: pet.name,
      species: pet.species,
      breed: pet.breed ?? '',
      birth_date: pet.birth_date ?? '',
      current_weight_kg: pet.current_weight_kg?.toString() ?? '',
      target_weight_kg: pet.target_weight_kg?.toString() ?? '',
      activity_level: pet.activity_level,
      is_neutered: pet.is_neutered,
      allergies: pet.allergies.join(', '),
      medical_conditions: pet.medical_conditions.join(', '),
    })
    setPhotoFile(null)
    setPhotoPreview(petPhotoUrls[pet.id] ?? null)
    setFormError('')
    setFormOpen(true)
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const validate = () => {
    if (!form.name.trim()) return 'Pet name is required.'
    if (!form.species.trim()) return 'Species is required.'
    if (form.current_weight_kg && Number(form.current_weight_kg) <= 0) return 'Weight must be positive.'
    return null
  }

  const handleSave = async () => {
    const err = validate()
    if (err) { setFormError(err); return }

    setSaving(true)
    setFormError('')

    try {
      const payload = {
        name: form.name.trim(),
        species: form.species.trim(),
        breed: form.breed.trim() || undefined,
        birth_date: form.birth_date || undefined,
        current_weight_kg: form.current_weight_kg ? Number(form.current_weight_kg) : undefined,
        target_weight_kg: form.target_weight_kg ? Number(form.target_weight_kg) : undefined,
        activity_level: form.activity_level,
        is_neutered: form.is_neutered,
        allergies: form.allergies ? form.allergies.split(',').map(s => s.trim()).filter(Boolean) : [],
        medical_conditions: form.medical_conditions ? form.medical_conditions.split(',').map(s => s.trim()).filter(Boolean) : [],
      }

      let savedPet: Pet
      if (editingPet) {
        savedPet = await updatePet(editingPet.id, payload)
      } else {
        savedPet = await createPet(payload)
      }

      // Upload photo if selected
      if (photoFile && user) {
        const path = await uploadPetPhoto(user.id, savedPet.id, photoFile)
        await updatePet(savedPet.id, { photo_path: path })
      }

      await refreshPets()
      setFormOpen(false)
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : 'Failed to save pet.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deletePet(deleteTarget.id)
      await refreshPets()
      setDeleteTarget(null)
    } catch (e: unknown) {
      console.error(e)
    } finally {
      setDeleting(false)
    }
  }

  if (petsLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <LoadingSpinner large />
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Pets</h1>
          <p className="page-subtitle">{pets.length} {pets.length === 1 ? 'pet' : 'pets'} registered</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={18} /> Add Pet
        </button>
      </div>

      {pets.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<span style={{ fontSize: '1.75rem' }}>🐾</span>}
            title="No pets yet"
            description="Add your first pet to get started with PawPal."
            action={<button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Pet</button>}
          />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {pets.map(pet => (
            <div key={pet.id} className="card" style={{ position: 'relative' }}>
              {/* Active indicator */}
              {activePet?.id === pet.id && (
                <div style={{
                  position: 'absolute', top: 12, right: 12,
                  background: 'var(--color-success)', color: 'white',
                  borderRadius: 'var(--radius-full)', padding: '2px 8px', fontSize: '0.75rem', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: '0.25rem',
                }}>
                  <Check size={12} /> Active
                </div>
              )}

              <div className="card-body">
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  {/* Photo */}
                  {petPhotoUrls[pet.id] ? (
                    <img src={petPhotoUrls[pet.id]} alt={pet.name} className="pet-avatar" style={{ width: 64, height: 64 }} />
                  ) : (
                    <div className="pet-avatar-placeholder" style={{ width: 64, height: 64, fontSize: '2rem' }}>
                      {pet.species === 'Cat' ? '🐱' : '🐶'}
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: '1.0625rem', fontWeight: 700 }}>{pet.name}</h3>
                    <p className="text-sm text-muted">{pet.species}{pet.breed ? ` · ${pet.breed}` : ''}</p>
                    {pet.birth_date && (
                      <p className="text-xs text-muted">
                        Born {format(new Date(pet.birth_date), 'd MMM yyyy')}
                      </p>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                  {pet.current_weight_kg && (
                    <div style={{ background: 'var(--color-surface-alt)', borderRadius: 'var(--radius-md)', padding: '0.5rem 0.75rem' }}>
                      <p className="text-xs text-muted">Weight</p>
                      <p className="font-semibold text-sm">{pet.current_weight_kg} kg</p>
                    </div>
                  )}
                  {pet.target_weight_kg && (
                    <div style={{ background: 'var(--color-surface-alt)', borderRadius: 'var(--radius-md)', padding: '0.5rem 0.75rem' }}>
                      <p className="text-xs text-muted">Target</p>
                      <p className="font-semibold text-sm">{pet.target_weight_kg} kg</p>
                    </div>
                  )}
                  <div style={{ background: 'var(--color-surface-alt)', borderRadius: 'var(--radius-md)', padding: '0.5rem 0.75rem' }}>
                    <p className="text-xs text-muted">Activity</p>
                    <p className="font-semibold text-sm" style={{ textTransform: 'capitalize' }}>{pet.activity_level}</p>
                  </div>
                  <div style={{ background: 'var(--color-surface-alt)', borderRadius: 'var(--radius-md)', padding: '0.5rem 0.75rem' }}>
                    <p className="text-xs text-muted">Neutered</p>
                    <p className="font-semibold text-sm">{pet.is_neutered ? 'Yes' : 'No'}</p>
                  </div>
                </div>

                {pet.allergies.length > 0 && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <p className="text-xs text-muted" style={{ marginBottom: '0.25rem' }}>Allergies</p>
                    <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                      {pet.allergies.map(a => (
                        <span key={a} className="badge badge-warning">{a}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {activePet?.id !== pet.id && (
                    <button className="btn btn-secondary btn-sm" onClick={() => setActivePet(pet)} style={{ flex: 1 }}>
                      Set Active
                    </button>
                  )}
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(pet)}>
                    <Edit2 size={14} />
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setDeleteTarget(pet)} style={{ color: 'var(--color-danger)' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingPet ? `Edit ${editingPet.name}` : 'Add New Pet'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setFormOpen(false)} disabled={saving}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save Pet'}
            </button>
          </>
        }
      >
        {formError && <ErrorMessage message={formError} />}

        {/* Photo upload */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <div
            style={{
              width: 88, height: 88, borderRadius: '50%',
              background: photoPreview ? 'transparent' : 'var(--color-surface-alt)',
              border: '2px dashed var(--color-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', cursor: 'pointer', position: 'relative',
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            {photoPreview ? (
              <img src={photoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <Camera size={28} style={{ color: 'var(--color-text-muted)' }} />
            )}
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileInputRef.current?.click()}>
            {photoPreview ? 'Change photo' : 'Upload photo'}
          </button>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} style={{ display: 'none' }} />
        </div>

        <div className="form-row">
          <FormField label="Pet name" required>
            <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Buddy" />
          </FormField>
          <FormField label="Species" required>
            <select className="form-select" value={form.species} onChange={e => setForm(f => ({ ...f, species: e.target.value }))}>
              <option>Dog</option>
              <option>Cat</option>
              <option>Rabbit</option>
              <option>Bird</option>
              <option>Other</option>
            </select>
          </FormField>
        </div>

        <div className="form-row">
          <FormField label="Breed">
            <input className="form-input" value={form.breed} onChange={e => setForm(f => ({ ...f, breed: e.target.value }))} placeholder="Golden Retriever" />
          </FormField>
          <FormField label="Date of birth">
            <input type="date" className="form-input" value={form.birth_date} onChange={e => setForm(f => ({ ...f, birth_date: e.target.value }))} />
          </FormField>
        </div>

        <div className="form-row">
          <FormField label="Current weight (kg)">
            <input type="number" step="0.1" min="0" className="form-input" value={form.current_weight_kg} onChange={e => setForm(f => ({ ...f, current_weight_kg: e.target.value }))} placeholder="5.0" />
          </FormField>
          <FormField label="Target weight (kg)">
            <input type="number" step="0.1" min="0" className="form-input" value={form.target_weight_kg} onChange={e => setForm(f => ({ ...f, target_weight_kg: e.target.value }))} placeholder="4.5" />
          </FormField>
        </div>

        <div className="form-row">
          <FormField label="Activity level">
            <select className="form-select" value={form.activity_level} onChange={e => setForm(f => ({ ...f, activity_level: e.target.value as ActivityLevel }))}>
              <option value="low">Low</option>
              <option value="moderate">Moderate</option>
              <option value="high">High</option>
            </select>
          </FormField>
          <FormField label=" ">
            <label className="form-checkbox-label" style={{ marginTop: '0.375rem' }}>
              <input type="checkbox" checked={form.is_neutered} onChange={e => setForm(f => ({ ...f, is_neutered: e.target.checked }))} />
              Neutered / spayed
            </label>
          </FormField>
        </div>

        <FormField label="Allergies" hint="Separate multiple entries with commas">
          <input className="form-input" value={form.allergies} onChange={e => setForm(f => ({ ...f, allergies: e.target.value }))} placeholder="chicken, beef" />
        </FormField>

        <FormField label="Medical conditions" hint="Separate multiple entries with commas">
          <input className="form-input" value={form.medical_conditions} onChange={e => setForm(f => ({ ...f, medical_conditions: e.target.value }))} placeholder="hip dysplasia" />
        </FormField>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Delete ${deleteTarget?.name}?`}
        message={`This will permanently delete ${deleteTarget?.name} and all their records including meals, weight logs, activities, and health data. This cannot be undone.`}
        loading={deleting}
      />
    </div>
  )
}
