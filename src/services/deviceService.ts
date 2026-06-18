import { supabase } from '../lib/supabase'
import type { Device, DeviceType, DeviceStatus, DeviceMetadata, Alert, AlertSeverity, AlertType } from '../types'

// ─── Devices ──────────────────────────────────────────────────────────────────

export async function getDevices(petId?: string): Promise<Device[]> {
  let query = supabase.from('devices').select('*').order('device_name')
  if (petId) query = query.eq('pet_id', petId)

  const { data, error } = await query
  if (error) throw new Error('Failed to load devices.')
  return data as Device[]
}

export async function createDevice(input: {
  pet_id: string
  device_name: string
  device_type: DeviceType
  status: DeviceStatus
  battery_percent: number
  last_seen_at: string
  metadata: DeviceMetadata
}): Promise<Device> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated.')

  const { data, error } = await supabase
    .from('devices')
    .insert({ ...input, owner_id: user.id })
    .select()
    .single()

  if (error) throw new Error('Failed to create device.')
  return data as Device
}

export async function updateDevice(id: string, input: Partial<Device>): Promise<Device> {
  const { data, error } = await supabase
    .from('devices')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error('Failed to update device.')
  return data as Device
}

export async function deleteDevice(id: string): Promise<void> {
  const { error } = await supabase.from('devices').delete().eq('id', id)
  if (error) throw new Error('Failed to delete device.')
}

export async function simulateDeviceUpdate(id: string, metadata: DeviceMetadata): Promise<Device> {
  const { data, error } = await supabase
    .from('devices')
    .update({ metadata, last_seen_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error('Failed to simulate device update.')
  return data as Device
}

// ─── Alerts ───────────────────────────────────────────────────────────────────

export async function getAlerts(filters?: { severity?: AlertSeverity; is_read?: boolean }): Promise<Alert[]> {
  let query = supabase
    .from('alerts')
    .select('*')
    .order('created_at', { ascending: false })

  if (filters?.severity) query = query.eq('severity', filters.severity)
  if (filters?.is_read !== undefined) query = query.eq('is_read', filters.is_read)

  const { data, error } = await query
  if (error) throw new Error('Failed to load alerts.')
  return data as Alert[]
}

export async function createAlert(input: {
  pet_id: string
  alert_type: AlertType
  severity: AlertSeverity
  title: string
  message: string
}): Promise<Alert> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated.')

  const { data, error } = await supabase
    .from('alerts')
    .insert({ ...input, owner_id: user.id, is_read: false })
    .select()
    .single()

  if (error) throw new Error('Failed to create alert.')
  return data as Alert
}

export async function markAlertRead(id: string): Promise<void> {
  const { error } = await supabase
    .from('alerts')
    .update({ is_read: true })
    .eq('id', id)

  if (error) throw new Error('Failed to mark alert as read.')
}

export async function markAllAlertsRead(): Promise<void> {
  const { error } = await supabase
    .from('alerts')
    .update({ is_read: true })
    .eq('is_read', false)

  if (error) throw new Error('Failed to mark all alerts as read.')
}

export async function deleteAlert(id: string): Promise<void> {
  const { error } = await supabase.from('alerts').delete().eq('id', id)
  if (error) throw new Error('Failed to delete alert.')
}

export async function getUnreadAlertCount(): Promise<number> {
  const { count, error } = await supabase
    .from('alerts')
    .select('*', { count: 'exact', head: true })
    .eq('is_read', false)

  if (error) return 0
  return count ?? 0
}
