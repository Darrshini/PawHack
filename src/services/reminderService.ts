import { supabase } from '../lib/supabase'
import type { Reminder, ReminderType } from '../types'

export async function getReminders(petId?: string): Promise<Reminder[]> {
  let query = supabase
    .from('reminders')
    .select('*')
    .order('due_at', { ascending: true })

  if (petId) query = query.eq('pet_id', petId)

  const { data, error } = await query
  if (error) throw new Error('Failed to load reminders.')
  return data as Reminder[]
}

export async function getUpcomingReminders(limit = 5): Promise<Reminder[]> {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('is_completed', false)
    .gte('due_at', now)
    .order('due_at')
    .limit(limit)

  if (error) throw new Error('Failed to load upcoming reminders.')
  return data as Reminder[]
}

export async function createReminder(input: {
  pet_id: string
  reminder_type: ReminderType
  title: string
  due_at: string
  repeat_rule?: string
}): Promise<Reminder> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated.')

  const { data, error } = await supabase
    .from('reminders')
    .insert({ ...input, owner_id: user.id, is_completed: false })
    .select()
    .single()

  if (error) throw new Error('Failed to create reminder.')
  return data as Reminder
}

export async function updateReminder(id: string, input: Partial<Reminder>): Promise<Reminder> {
  const { data, error } = await supabase
    .from('reminders')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error('Failed to update reminder.')
  return data as Reminder
}

export async function completeReminder(id: string): Promise<void> {
  const { error } = await supabase
    .from('reminders')
    .update({ is_completed: true })
    .eq('id', id)

  if (error) throw new Error('Failed to complete reminder.')
}

export async function deleteReminder(id: string): Promise<void> {
  const { error } = await supabase.from('reminders').delete().eq('id', id)
  if (error) throw new Error('Failed to delete reminder.')
}
