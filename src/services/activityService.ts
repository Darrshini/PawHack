import { supabase } from '../lib/supabase'
import type { ActivityLog, ActivityType } from '../types'

export async function getActivityLogs(petId: string, limit?: number): Promise<ActivityLog[]> {
  let query = supabase
    .from('activity_logs')
    .select('*')
    .eq('pet_id', petId)
    .order('started_at', { ascending: false })

  if (limit) query = query.limit(limit)

  const { data, error } = await query
  if (error) throw new Error('Failed to load activity logs.')
  return data as ActivityLog[]
}

export async function getActivityLogsForWeek(petId: string, weekStart: string): Promise<ActivityLog[]> {
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 7)

  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('pet_id', petId)
    .gte('started_at', weekStart)
    .lt('started_at', weekEnd.toISOString())
    .order('started_at')

  if (error) throw new Error('Failed to load weekly activities.')
  return data as ActivityLog[]
}

export async function createActivityLog(input: {
  pet_id: string
  activity_type: ActivityType
  duration_minutes: number
  distance_km?: number
  steps?: number
  sleep_hours?: number
  started_at: string
  notes?: string
}): Promise<ActivityLog> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated.')

  const { data, error } = await supabase
    .from('activity_logs')
    .insert({ ...input, owner_id: user.id })
    .select()
    .single()

  if (error) throw new Error('Failed to log activity.')
  return data as ActivityLog
}

export async function updateActivityLog(id: string, input: Partial<ActivityLog>): Promise<ActivityLog> {
  const { data, error } = await supabase
    .from('activity_logs')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error('Failed to update activity log.')
  return data as ActivityLog
}

export async function deleteActivityLog(id: string): Promise<void> {
  const { error } = await supabase.from('activity_logs').delete().eq('id', id)
  if (error) throw new Error('Failed to delete activity log.')
}

export async function getTodayActivityLogs(petId: string): Promise<ActivityLog[]> {
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('pet_id', petId)
    .gte('started_at', `${today}T00:00:00`)
    .lte('started_at', `${today}T23:59:59`)

  if (error) throw new Error('Failed to load today\'s activities.')
  return data as ActivityLog[]
}
