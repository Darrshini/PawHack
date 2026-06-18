import { supabase } from '../lib/supabase'
import type { HealthRecord, WeightLog, Medication, HealthRecordType } from '../types'

// ─── Health Records ───────────────────────────────────────────────────────────

export async function getHealthRecords(petId: string): Promise<HealthRecord[]> {
  const { data, error } = await supabase
    .from('health_records')
    .select('*')
    .eq('pet_id', petId)
    .order('record_date', { ascending: false })

  if (error) throw new Error('Failed to load health records.')
  return data as HealthRecord[]
}

export async function createHealthRecord(input: {
  pet_id: string
  record_type: HealthRecordType
  title: string
  record_date: string
  veterinarian?: string
  notes?: string
  next_due_date?: string
}): Promise<HealthRecord> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated.')

  const { data, error } = await supabase
    .from('health_records')
    .insert({ ...input, owner_id: user.id })
    .select()
    .single()

  if (error) throw new Error('Failed to create health record.')
  return data as HealthRecord
}

export async function updateHealthRecord(id: string, input: Partial<HealthRecord>): Promise<HealthRecord> {
  const { data, error } = await supabase
    .from('health_records')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error('Failed to update health record.')
  return data as HealthRecord
}

export async function deleteHealthRecord(id: string): Promise<void> {
  const { error } = await supabase.from('health_records').delete().eq('id', id)
  if (error) throw new Error('Failed to delete health record.')
}

// ─── Weight Logs ──────────────────────────────────────────────────────────────

export async function getWeightLogs(petId: string, limit?: number): Promise<WeightLog[]> {
  let query = supabase
    .from('weight_logs')
    .select('*')
    .eq('pet_id', petId)
    .order('recorded_at', { ascending: false })

  if (limit) query = query.limit(limit)

  const { data, error } = await query
  if (error) throw new Error('Failed to load weight logs.')
  return data as WeightLog[]
}

export async function createWeightLog(input: {
  pet_id: string
  weight_kg: number
  recorded_at: string
  notes?: string
}): Promise<WeightLog> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated.')

  const { data, error } = await supabase
    .from('weight_logs')
    .insert({ ...input, owner_id: user.id })
    .select()
    .single()

  if (error) throw new Error('Failed to log weight.')
  return data as WeightLog
}

export async function updateWeightLog(id: string, input: Partial<WeightLog>): Promise<WeightLog> {
  const { data, error } = await supabase
    .from('weight_logs')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error('Failed to update weight log.')
  return data as WeightLog
}

export async function deleteWeightLog(id: string): Promise<void> {
  const { error } = await supabase.from('weight_logs').delete().eq('id', id)
  if (error) throw new Error('Failed to delete weight log.')
}

// ─── Medications ──────────────────────────────────────────────────────────────

export async function getMedications(petId: string): Promise<Medication[]> {
  const { data, error } = await supabase
    .from('medications')
    .select('*')
    .eq('pet_id', petId)
    .order('start_date', { ascending: false })

  if (error) throw new Error('Failed to load medications.')
  return data as Medication[]
}

export async function createMedication(input: {
  pet_id: string
  name: string
  dosage?: string
  instructions?: string
  start_date: string
  end_date?: string
  scheduled_time?: string
  is_active?: boolean
}): Promise<Medication> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated.')

  const { data, error } = await supabase
    .from('medications')
    .insert({ ...input, owner_id: user.id, is_active: input.is_active ?? true })
    .select()
    .single()

  if (error) throw new Error('Failed to create medication.')
  return data as Medication
}

export async function updateMedication(id: string, input: Partial<Medication>): Promise<Medication> {
  const { data, error } = await supabase
    .from('medications')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error('Failed to update medication.')
  return data as Medication
}

export async function deleteMedication(id: string): Promise<void> {
  const { error } = await supabase.from('medications').delete().eq('id', id)
  if (error) throw new Error('Failed to delete medication.')
}
