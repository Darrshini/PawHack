import { supabase } from '../lib/supabase'
import type { DashboardData, Pet, MealLog, WeightLog, ActivityLog, Reminder, Medication, Device, Alert } from '../types'
import { getUpcomingReminders } from './reminderService'

export async function getDashboardData(petId: string): Promise<DashboardData> {
  const today = new Date().toISOString().split('T')[0]
  const todayStart = `${today}T00:00:00`
  const todayEnd = `${today}T23:59:59`

  // Run all queries in parallel
  const [
    petResult,
    mealLogsResult,
    weightLogsResult,
    activitiesResult,
    remindersResult,
    medsResult,
    devicesResult,
    alertsResult,
    activePlanResult,
  ] = await Promise.all([
    supabase.from('pets').select('*').eq('id', petId).single(),
    supabase.from('meal_logs').select('*, food:foods(*)').eq('pet_id', petId)
      .gte('served_at', todayStart).lte('served_at', todayEnd),
    supabase.from('weight_logs').select('*').eq('pet_id', petId)
      .order('recorded_at', { ascending: false }).limit(10),
    supabase.from('activity_logs').select('*').eq('pet_id', petId)
      .gte('started_at', todayStart).lte('started_at', todayEnd),
    getUpcomingReminders(5),
    supabase.from('medications').select('*').eq('pet_id', petId).eq('is_active', true),
    supabase.from('devices').select('*').eq('pet_id', petId),
    supabase.from('alerts').select('*').eq('is_read', false)
      .order('created_at', { ascending: false }).limit(10),
    supabase.from('meal_plans').select('*').eq('pet_id', petId).eq('is_active', true).limit(1),
  ])

  const pet = petResult.data as Pet | null
  const todayMealLogs = (mealLogsResult.data ?? []) as unknown as MealLog[]
  const recentWeightLogs = (weightLogsResult.data ?? []) as WeightLog[]
  const todayActivities = (activitiesResult.data ?? []) as ActivityLog[]
  const upcomingReminders = remindersResult as Reminder[]
  const activeMedications = (medsResult.data ?? []) as Medication[]
  const devices = (devicesResult.data ?? []) as Device[]
  const unreadAlerts = (alertsResult.data ?? []) as Alert[]
  const activePlan = (activePlanResult.data ?? [])[0]

  // Calculations
  const totalCaloriesToday = todayMealLogs.reduce((sum, log) => sum + (log.calories || 0), 0)
  const dailyCalorieTarget = activePlan?.daily_kcal_target ?? pet?.current_weight_kg
    ? Math.round((pet?.current_weight_kg ?? 25) * 40)
    : 1000

  const totalActivityMinutes = todayActivities.reduce(
    (sum, act) => sum + (act.duration_minutes || 0), 0
  )

  const latestWeight = recentWeightLogs[0]?.weight_kg ?? pet?.current_weight_kg ?? null
  const weightDiff = latestWeight && pet?.target_weight_kg
    ? Math.round((latestWeight - pet.target_weight_kg) * 10) / 10
    : null

  const unreadAlertCount = unreadAlerts.length

  // Food stock calculation (if we have active plan data would be better,
  // but for dashboard use a rough estimate from device data)
  const feeder = devices.find(d => d.device_type === 'smart_feeder')
  const foodStockRemainingG = feeder?.metadata?.food_level_percent != null
    ? null // will show device level instead
    : null

  const estimatedFoodDaysRemaining = null // Calculated on meal planner page

  return {
    pet,
    todayMealLogs,
    recentWeightLogs,
    todayActivities,
    upcomingReminders,
    activeMedications,
    devices,
    unreadAlerts,
    totalCaloriesToday,
    dailyCalorieTarget,
    totalActivityMinutes,
    latestWeight,
    weightDiff,
    unreadAlertCount,
    foodStockRemainingG,
    estimatedFoodDaysRemaining,
  }
}
