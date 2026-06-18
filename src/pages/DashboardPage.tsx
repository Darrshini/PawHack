import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePet } from '../contexts/PetContext'
import { useAuth } from '../contexts/AuthContext'
import { getDashboardData } from '../services/dashboardService'
import { loadDemoData, hasDemoData } from '../services/demoDataService'
import { getPetPhotoUrl } from '../services/storageService'
import type { DashboardData } from '../types'
import { format } from 'date-fns'
import { SummaryCard, ProgressCard, EmptyState, LoadingSpinner, ErrorMessage } from '../components/common'
import {
  Scale, Activity, Pill, Bell, Zap, AlertTriangle, UtensilsCrossed, Droplets
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

export default function DashboardPage() {
  const { activePet, petsLoading, refreshPets } = usePet()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [petPhotoUrl, setPetPhotoUrl] = useState<string | null>(null)
  const [demoLoading, setDemoLoading] = useState(false)
  const [demoMsg, setDemoMsg] = useState('')

  const demoAlreadyLoaded = hasDemoData()

  useEffect(() => {
    if (petsLoading) return
    if (!activePet) { setLoading(false); return }

    setLoading(true)
    setError('')

    getDashboardData(activePet.id)
      .then(d => {
        setData(d)
        if (activePet.photo_path) {
          getPetPhotoUrl(activePet.photo_path).then(url => setPetPhotoUrl(url))
        } else {
          setPetPhotoUrl(null)
        }
      })
      .catch(e => {
        console.error(e)
        setError('Failed to load dashboard data.')
      })
      .finally(() => setLoading(false))
  }, [activePet, petsLoading])

  const handleLoadDemo = async () => {
    setDemoLoading(true)
    setDemoMsg('')
    try {
      await loadDemoData()
      await refreshPets()
      setDemoMsg('Demo data loaded! Meet Milo 🐶')
    } catch (e: unknown) {
      setDemoMsg(e instanceof Error ? e.message : 'Failed to load demo data.')
    } finally {
      setDemoLoading(false)
    }
  }

  if (petsLoading || loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <LoadingSpinner large label="Loading dashboard…" />
      </div>
    )
  }

  // No pets yet
  if (!activePet) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">Welcome to NutriPaw 🐾</h1>
            <p className="page-subtitle">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', maxWidth: '640px' }}>
          <div className="card card-body" style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => navigate('/pets')}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>➕</div>
            <p className="font-semibold">Add your first pet</p>
            <p className="text-sm text-muted" style={{ marginTop: '0.25rem' }}>Set up a profile for your furry friend</p>
          </div>

          {!demoAlreadyLoaded && (
            <div className="card card-body" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🐶</div>
              <p className="font-semibold">Try with demo data</p>
              <p className="text-sm text-muted" style={{ marginTop: '0.25rem', marginBottom: '0.75rem' }}>
                Load a sample dog called Milo to explore all features
              </p>
              <button className="btn btn-primary btn-sm" onClick={handleLoadDemo} disabled={demoLoading}>
                {demoLoading ? 'Loading…' : 'Load Demo Data'}
              </button>
              {demoMsg && <p className="text-sm" style={{ marginTop: '0.5rem', color: demoMsg.includes('!') ? 'var(--color-success)' : 'var(--color-danger)' }}>{demoMsg}</p>}
            </div>
          )}
        </div>
      </div>
    )
  }

  const weightChartData = data?.recentWeightLogs
    .slice().reverse()
    .map(log => ({ date: format(new Date(log.recorded_at), 'MMM d'), weight: log.weight_kg })) ?? []

  const caloriePct = data
    ? Math.min(100, Math.round((data.totalCaloriesToday / data.dailyCalorieTarget) * 100))
    : 0

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Pet avatar */}
          {petPhotoUrl ? (
            <img src={petPhotoUrl} alt={activePet.name} className="pet-avatar" style={{ width: 56, height: 56 }} />
          ) : (
            <div className="pet-avatar-placeholder" style={{ width: 56, height: 56, fontSize: '1.75rem' }}>
              {activePet.species === 'Cat' ? '🐱' : '🐶'}
            </div>
          )}
          <div>
            <h1 className="page-title">{activePet.name}'s Day</h1>
            <p className="page-subtitle">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {!demoAlreadyLoaded && (
            <button className="btn btn-secondary btn-sm" onClick={handleLoadDemo} disabled={demoLoading}>
              {demoLoading ? 'Loading…' : '🐶 Load Demo Data'}
            </button>
          )}
        </div>
      </div>

      {demoMsg && (
        <div className="alert-strip success" style={{ marginBottom: '1rem' }}>
          {demoMsg}
        </div>
      )}

      {error && <ErrorMessage message={error} />}

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {[
          { label: '🍽 Log Meal',        path: '/meal-planner' },
          { label: '⚖️ Record Weight',   path: '/health' },
          { label: '🏃 Add Activity',    path: '/activity' },
          { label: '💊 Medication',      path: '/health' },
          { label: '🔔 Add Reminder',    path: '/reminders' },
        ].map(({ label, path }) => (
          <button key={label} className="btn btn-secondary btn-sm" onClick={() => navigate(path)}>
            {label}
          </button>
        ))}
      </div>

      {/* Summary Row */}
      <div className="dashboard-grid" style={{ marginBottom: '1rem' }}>
        <SummaryCard
          label="Today's Calories"
          value={data?.totalCaloriesToday ?? 0}
          unit={`/ ${data?.dailyCalorieTarget ?? 0} kcal`}
          icon={<UtensilsCrossed size={18} />}
          color="var(--color-brand)"
          subtext={`${caloriePct}% of daily target`}
        />
        <SummaryCard
          label="Activity Today"
          value={data?.totalActivityMinutes ?? 0}
          unit="min"
          icon={<Activity size={18} />}
          color="var(--color-success)"
          subtext={`${data?.todayActivities.length ?? 0} sessions logged`}
        />
        <SummaryCard
          label="Current Weight"
          value={data?.latestWeight ?? activePet.current_weight_kg ?? '—'}
          unit="kg"
          icon={<Scale size={18} />}
          color="var(--color-info)"
          subtext={data?.weightDiff != null
            ? `${data.weightDiff > 0 ? '+' : ''}${data.weightDiff} kg from target`
            : 'No target set'}
        />
        <SummaryCard
          label="Active Medications"
          value={data?.activeMedications.length ?? 0}
          icon={<Pill size={18} />}
          color="var(--color-warning)"
          subtext={data?.activeMedications.map(m => m.name).join(', ') || 'None active'}
        />
      </div>

      {/* Progress Row */}
      <div className="dashboard-grid" style={{ marginBottom: '1rem' }}>
        <ProgressCard
          label="Calories consumed"
          current={data?.totalCaloriesToday ?? 0}
          target={data?.dailyCalorieTarget ?? 1050}
          unit=" kcal"
        />
        <ProgressCard
          label="Activity goal"
          current={data?.totalActivityMinutes ?? 0}
          target={30}
          unit=" min"
          color="var(--color-success)"
        />
        <div className="card card-body col-span-2">
          <p className="text-sm text-muted" style={{ marginBottom: '0.5rem' }}>Meal status today</p>
          {data && data.todayMealLogs.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {data.todayMealLogs.map(log => (
                <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem' }}>
                  <span>{log.food?.product_name ?? 'Unknown food'} – {log.quantity_g}g</span>
                  <span className={`badge badge-${log.status === 'completed' ? 'success' : log.status === 'partial' ? 'warning' : 'neutral'}`}>
                    {log.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">No meals logged today yet.</p>
          )}
        </div>
      </div>

      {/* Charts + Alerts */}
      <div className="dashboard-grid-wide" style={{ marginBottom: '1rem' }}>
        {/* Weight Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Weight Trend</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/health')}>View all</button>
          </div>
          <div className="card-body">
            {weightChartData.length >= 2 ? (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={weightChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} />
                  <YAxis
                    tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }}
                    domain={['dataMin - 0.5', 'dataMax + 0.5']}
                    unit=" kg"
                  />
                  <Tooltip
                    contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8 }}
                    labelStyle={{ color: 'var(--color-text-primary)' }}
                  />
                  <Line
                    type="monotone" dataKey="weight"
                    stroke="var(--color-brand)" strokeWidth={2.5}
                    dot={{ fill: 'var(--color-brand)', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  {activePet.target_weight_kg && (
                    <Line
                      dataKey={() => activePet.target_weight_kg}
                      stroke="var(--color-success)" strokeWidth={1.5}
                      strokeDasharray="5 5" dot={false}
                      name="Target"
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No weight history yet" description="Record at least 2 weights to see a trend." />
            )}
          </div>
        </div>

        {/* Sidebar: Reminders + Alerts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Upcoming Reminders */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Bell size={16} /> Reminders
              </h3>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/reminders')}>All</button>
            </div>
            <div className="card-body" style={{ padding: '0.75rem' }}>
              {data?.upcomingReminders.length ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {data.upcomingReminders.map(r => (
                    <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: 'var(--color-surface-alt)', borderRadius: 'var(--radius-md)' }}>
                      <Bell size={14} style={{ color: 'var(--color-brand)', flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <p className="text-sm font-semibold truncate">{r.title}</p>
                        <p className="text-xs text-muted">{format(new Date(r.due_at), 'MMM d, h:mm a')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted text-center" style={{ padding: '0.75rem' }}>No upcoming reminders</p>
              )}
            </div>
          </div>

          {/* Alerts */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={16} /> Alerts
                {(data?.unreadAlertCount ?? 0) > 0 && (
                  <span className="badge badge-danger">{data?.unreadAlertCount}</span>
                )}
              </h3>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/alerts')}>All</button>
            </div>
            <div className="card-body" style={{ padding: '0.75rem' }}>
              {data?.unreadAlerts.length ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {data.unreadAlerts.slice(0, 3).map(alert => (
                    <div key={alert.id} style={{
                      padding: '0.5rem 0.75rem',
                      background: alert.severity === 'critical' ? 'var(--color-danger-light)' : alert.severity === 'warning' ? 'var(--color-warning-light)' : 'var(--color-info-light)',
                      borderRadius: 'var(--radius-md)',
                    }}>
                      <p className="text-sm font-semibold">{alert.title}</p>
                      <p className="text-xs">{alert.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', color: 'var(--color-success)' }}>
                  <Zap size={16} />
                  <p className="text-sm">All clear!</p>
                </div>
              )}
            </div>
          </div>

          {/* Devices quick view */}
          {data && data.devices.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Devices</h3>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/devices')}>All</button>
              </div>
              <div className="card-body" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {data.devices.slice(0, 3).map(device => (
                  <div key={device.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem' }}>
                    <span className="truncate" style={{ maxWidth: '140px' }}>{device.device_name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className={`badge badge-${device.status === 'online' ? 'success' : 'neutral'}`}>
                        {device.status}
                      </span>
                      <span className="text-xs text-muted">🔋 {device.battery_percent}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
