import { supabase } from '../lib/supabase'
import type { Pet, ActivityLevel } from '../types'

export interface PetInput {
  name: string
  species: string
  breed?: string
  birth_date?: string
  current_weight_kg?: number
  target_weight_kg?: number
  activity_level: ActivityLevel
  is_neutered: boolean
  allergies: string[]
  medical_conditions: string[]
  photo_path?: string
}

export async function getPets(): Promise<Pet[]> {
  const { data, error } = await supabase
    .from('pets')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('getPets error:', error)
    throw new Error('Failed to load pets.')
  }
  return data as Pet[]
}

export async function getPet(id: string): Promise<Pet | null> {
  const { data, error } = await supabase
    .from('pets')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('getPet error:', error)
    return null
  }
  return data as Pet
}

export async function createPet(input: PetInput): Promise<Pet> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated.')

  const { data, error } = await supabase
    .from('pets')
    .insert({ ...input, owner_id: user.id })
    .select()
    .single()

  if (error) {
    console.error('createPet error:', error)
    throw new Error('Failed to create pet.')
  }
  return data as Pet
}

export async function updatePet(id: string, input: Partial<PetInput>): Promise<Pet> {
  const { data, error } = await supabase
    .from('pets')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('updatePet error:', error)
    throw new Error('Failed to update pet.')
  }
  return data as Pet
}

export async function deletePet(id: string): Promise<void> {
  const { error } = await supabase.from('pets').delete().eq('id', id)
  if (error) {
    console.error('deletePet error:', error)
    throw new Error('Failed to delete pet.')
  }
}
