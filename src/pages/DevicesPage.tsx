import { useState, useEffect } from 'react'
import { usePet } from '../contexts/PetContext'
import { getDevices, simulateDeviceUpdate, deleteDevice } from '../services/deviceService'
import type { Device } from '../types'
import { ConfirmationDialog } from '../components/common/ConfirmationDialog'
import { EmptyState, LoadingSpinner, ErrorMessage } from '../components/common'
import { Trash2, RefreshCw, Wifi, WifiOff, Battery, BatteryLow } from 'lucide-react'
import { format } from 'date-fns'

const DEVICE_EMOJI: Record<string, string> = {
  gps_collar: '📍', smart_feeder: '🍽', smart_water_bowl: '💧',
  pet_camera: '📷', temperature_sensor: '🌡', humidity_sensor: '💨',
}

function MetadataDisplay({ device }: { device: Device }) {
  const { metadata, device_type } = device

  const items: { label: string; value: string }[] = []

  if (metadata.food_level_percent !== undefined)
    items.push({ label: 'Food level', value: `${metadata.food_level_percent}%` })
  if (metadata.water_level_percent !== undefined)
    items.push({ label: 'Water level', value: `${metadata.water_level_percent}%` })
  if (metadata.temperature_c !== undefined)
    items.push({ label: 'Temperature', value: `${metadata.temperature_c}°C` })
  if (metadata.humidity_percent !== undefined)
    items.push({ label: 'Humidity', value: `${metadata.humidity_percent}%` })
  if (metadata.location_name)
    items.push({ label: 'Location', value: metadata.location_name })
  if (metadata.total_dispensed_today_g !== undefined)
    items.push({ label: 'Dispensed today', value: `${metadata.total_dispensed_today_g}g` })
  if (metadata.last_dispensed)
    items.push({ label: 'Last dispensed', value: format(new Date(metadata.last_dispensed), 'h:mm a') })

  if (items.length === 0) return null

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.375rem', marginTop: '0.75rem' }}>
      {items.map(item => (
        <div key={item.label} style={{ background: 'var(--color-surface-alt)', borderRadius: 'var(--radius-sm)', padding: '0.375rem 0.625rem' }}>
          <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{item.label}</p>
          <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>{item.value}</p>
        </div>
      ))}
    </div>
  )
}

function BatteryIndicator({ percent }: { percent: number }) {
  const low = percent < 25
  const color = percent < 15 ? 'var(--color-danger)' : percent < 25 ? 'var(--color-warning)' : 'var(--color-success)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color }}>
      {low ? <BatteryLow size={15} /> : <Battery size={15} />}
      <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{percent}%</span>
    </div>
  )
}

export default function DevicesPage() {
  const { activePet } = usePet()
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [simulating, setSimulating] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Device | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadData = async () => {
    if (!activePet) return
    setLoading(true)
    try {
      const data = await getDevices(activePet.id)
      setDevices(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load devices.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [activePet])

  const handleSimulate = async (device: Device) => {
    setSimulating(device.id)
    try {
      // Produce a random plausible update for the device type
      const newMeta = { ...device.metadata }
      if (newMeta.food_level_percent !== undefined)
        newMeta.food_level_percent = Math.max(0, Math.min(100, (newMeta.food_level_percent ?? 50) - Math.floor(Math.random() * 8)))
      if (newMeta.water_level_percent !== undefined)
        newMeta.water_level_percent = Math.max(0, Math.min(100, (newMeta.water_level_percent ?? 60) - Math.floor(Math.random() * 5)))
      if (newMeta.temperature_c !== undefined)
        newMeta.temperature_c = Math.round(((newMeta.temperature_c ?? 25) + (Math.random() - 0.5)) * 10) / 10
      if (newMeta.humidity_percent !== undefined)
        newMeta.humidity_percent = Math.min(100, Math.max(0, Math.round((newMeta.humidity_percent ?? 55) + (Math.random() - 0.5) * 4)))

      const updated = await simulateDeviceUpdate(device.id, newMeta)
      setDevices(prev => prev.map(d => d.id === device.id ? updated : d))
    } catch {
      setError('Failed to simulate device update.')
    } finally {
      setSimulating(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteDevice(deleteTarget.id)
      setDevices(prev => prev.filter(d => d.id !== deleteTarget.id))
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  if (!activePet) return <div><h1 className="page-title">Devices</h1><p className="text-muted" style={{ marginTop: '1rem' }}>No pet selected.</p></div>
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><LoadingSpinner large /></div>

  const onlineCount = devices.filter(d => d.status === 'online').length

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Devices</h1>
          <p className="page-subtitle">{onlineCount} of {devices.length} online</p>
        </div>
        <button className="btn btn-secondary" onClick={loadData}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {error && <ErrorMessage message={error} />}

      {devices.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<span style={{ fontSize: '2rem' }}>📡</span>}
            title="No devices paired"
            description="Devices are added automatically via the demo data, or through your smart device integrations."
          />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {devices.map(device => (
            <div key={device.id} className="card card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>{DEVICE_EMOJI[device.device_type] ?? '📟'}</span>
                    <div>
                      <p className="font-semibold" style={{ fontSize: '0.9375rem' }}>{device.device_name}</p>
                      <p className="text-xs text-muted" style={{ textTransform: 'capitalize' }}>
                        {device.device_type.replace(/_/g, ' ')}
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleSimulate(device)}
                    disabled={simulating === device.id}
                    title="Simulate device update"
                  >
                    <RefreshCw size={14} style={{ animation: simulating === device.id ? 'spin 0.7s linear infinite' : 'none' }} />
                  </button>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => setDeleteTarget(device)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem' }}>
                  {device.status === 'online'
                    ? <Wifi size={14} style={{ color: 'var(--color-success)' }} />
                    : <WifiOff size={14} style={{ color: 'var(--color-text-muted)' }} />
                  }
                  <span style={{ color: device.status === 'online' ? 'var(--color-success)' : 'var(--color-text-muted)', fontWeight: 600 }}>
                    {device.status === 'online' ? 'Online' : 'Offline'}
                  </span>
                </div>
                <BatteryIndicator percent={device.battery_percent} />
              </div>

              <MetadataDisplay device={device} />

              <p className="text-xs text-muted" style={{ marginTop: '0.75rem' }}>
                Last seen {format(new Date(device.last_seen_at), 'd MMM, HH:mm')}
              </p>
            </div>
          ))}
        </div>
      )}

      <ConfirmationDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remove device?"
        message={`"${deleteTarget?.device_name}" will be removed from your dashboard.`}
        loading={deleting}
      />
    </div>
  )
}
