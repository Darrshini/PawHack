import { supabase } from '../lib/supabase'
import { subDays, subWeeks, addDays, format } from 'date-fns'

const DEMO_FLAG_KEY = 'NutriPaw_demo_loaded'

export function hasDemoData(): boolean {
  return localStorage.getItem(DEMO_FLAG_KEY) === 'true'
}

export async function loadDemoData(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated.')

  if (hasDemoData()) {
    throw new Error('Demo data has already been loaded for this account.')
  }

  // ─── Pet ─────────────────────────────────────────────────────────────────
  const { data: petData, error: petError } = await supabase
    .from('pets')
    .insert({
      owner_id: user.id,
      name: 'Milo',
      species: 'Dog',
      breed: 'Golden Retriever',
      birth_date: '2022-04-18',
      current_weight_kg: 28.4,
      target_weight_kg: 27.5,
      activity_level: 'moderate',
      is_neutered: true,
      allergies: ['chicken'],
      medical_conditions: [],
    })
    .select()
    .single()

  if (petError || !petData) throw new Error('Failed to create demo pet.')
  const petId = petData.id

  // ─── Food ─────────────────────────────────────────────────────────────────
  const { data: foodData, error: foodError } = await supabase
    .from('foods')
    .insert({
      owner_id: user.id,
      brand: 'Demo Pet Food',
      product_name: 'Salmon Adult Formula',
      food_type: 'dry',
      kcal_per_100g: 360,
      ingredients: ['salmon', 'rice', 'peas'],
      allergens: [],
      stock_quantity_g: 2400,
    })
    .select()
    .single()

  if (foodError || !foodData) throw new Error('Failed to create demo food.')
  const foodId = foodData.id

  // ─── Meal Plan ────────────────────────────────────────────────────────────
  const { data: planData, error: planError } = await supabase
    .from('meal_plans')
    .insert({
      owner_id: user.id,
      pet_id: petId,
      name: "Milo's Maintenance Plan",
      goal: 'gradual_weight_loss',
      daily_kcal_target: 1050,
      is_active: true,
      start_date: format(new Date(), 'yyyy-MM-dd'),
      veterinarian_notes: 'Reduce treats. Keep daily walks consistent.',
    })
    .select()
    .single()

  if (planError || !planData) throw new Error('Failed to create demo meal plan.')
  const planId = planData.id

  // ─── Meal Plan Items (7 days) ──────────────────────────────────────────────
  const mealItems = []
  for (let dow = 0; dow <= 6; dow++) {
    mealItems.push(
      {
        owner_id: user.id, meal_plan_id: planId, food_id: foodId,
        day_of_week: dow, meal_time: '08:00', meal_type: 'breakfast',
        quantity_g: 117, calories: 420, notes: null,
      },
      {
        owner_id: user.id, meal_plan_id: planId, food_id: foodId,
        day_of_week: dow, meal_time: '19:00', meal_type: 'dinner',
        quantity_g: 175, calories: 630, notes: null,
      }
    )
  }
  await supabase.from('meal_plan_items').insert(mealItems)

  // ─── Weight Logs ──────────────────────────────────────────────────────────
  await supabase.from('weight_logs').insert([
    { owner_id: user.id, pet_id: petId, weight_kg: 29.2, recorded_at: subWeeks(new Date(), 6).toISOString(), notes: 'Vet visit' },
    { owner_id: user.id, pet_id: petId, weight_kg: 28.8, recorded_at: subWeeks(new Date(), 3).toISOString(), notes: 'Home scale' },
    { owner_id: user.id, pet_id: petId, weight_kg: 28.4, recorded_at: new Date().toISOString(), notes: 'Home scale – losing nicely!' },
  ])

  // ─── Activity Logs ────────────────────────────────────────────────────────
  const activities = []
  for (let i = 6; i >= 0; i--) {
    const date = subDays(new Date(), i)
    activities.push({
      owner_id: user.id, pet_id: petId, activity_type: 'walk',
      duration_minutes: 30 + Math.floor(Math.random() * 20),
      distance_km: 2.0 + Math.round(Math.random() * 10) / 10,
      steps: 3000 + Math.floor(Math.random() * 1500),
      sleep_hours: 12,
      started_at: new Date(date.setHours(7, 30)).toISOString(),
      notes: null,
    })
  }
  await supabase.from('activity_logs').insert(activities)

  // ─── Meal Logs (today) ────────────────────────────────────────────────────
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  await supabase.from('meal_logs').insert([
    {
      owner_id: user.id, pet_id: petId, food_id: foodId, meal_plan_item_id: null,
      served_at: `${todayStr}T08:00:00`, quantity_g: 117, calories: 420,
      status: 'completed', notes: null,
    },
  ])

  // ─── Medications ──────────────────────────────────────────────────────────
  await supabase.from('medications').insert([
    {
      owner_id: user.id, pet_id: petId, name: 'NexGard (Flea & Tick)',
      dosage: '1 chew', instructions: 'Give with food once a month',
      start_date: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
      end_date: null, scheduled_time: '08:00', is_active: true,
    },
    {
      owner_id: user.id, pet_id: petId, name: 'Omega-3 Fish Oil',
      dosage: '1 capsule', instructions: 'Added to evening meal for coat health',
      start_date: format(subDays(new Date(), 60), 'yyyy-MM-dd'),
      end_date: null, scheduled_time: '19:00', is_active: true,
    },
  ])

  // ─── Health Records ───────────────────────────────────────────────────────
  await supabase.from('health_records').insert([
    {
      owner_id: user.id, pet_id: petId, record_type: 'vaccination',
      title: 'Annual Vaccines (DHPP + Bordetella)',
      record_date: format(subDays(new Date(), 45), 'yyyy-MM-dd'),
      veterinarian: 'Dr. Sarah Tan', notes: 'All vaccinations up to date.',
      next_due_date: format(addDays(new Date(), 320), 'yyyy-MM-dd'),
    },
    {
      owner_id: user.id, pet_id: petId, record_type: 'checkup',
      title: 'Annual Wellness Exam',
      record_date: format(subDays(new Date(), 45), 'yyyy-MM-dd'),
      veterinarian: 'Dr. Sarah Tan', notes: 'Weight trending slightly high. Reduced calorie plan recommended.',
      next_due_date: format(addDays(new Date(), 320), 'yyyy-MM-dd'),
    },
    {
      owner_id: user.id, pet_id: petId, record_type: 'dental',
      title: 'Dental Cleaning',
      record_date: format(subDays(new Date(), 180), 'yyyy-MM-dd'),
      veterinarian: 'Dr. Sarah Tan', notes: 'Mild tartar. Schedule cleaning in 12 months.',
      next_due_date: format(addDays(new Date(), 185), 'yyyy-MM-dd'),
    },
  ])

  // ─── Reminders ────────────────────────────────────────────────────────────
  await supabase.from('reminders').insert([
    {
      owner_id: user.id, pet_id: petId, reminder_type: 'medication',
      title: 'Give NexGard monthly dose', due_at: addDays(new Date(), 1).toISOString(),
      repeat_rule: 'Monthly', is_completed: false,
    },
    {
      owner_id: user.id, pet_id: petId, reminder_type: 'vet_appointment',
      title: '6-month weight check with Dr. Tan', due_at: addDays(new Date(), 14).toISOString(),
      repeat_rule: null, is_completed: false,
    },
    {
      owner_id: user.id, pet_id: petId, reminder_type: 'grooming',
      title: 'Bath and brush', due_at: addDays(new Date(), 3).toISOString(),
      repeat_rule: 'Every 2 weeks', is_completed: false,
    },
    {
      owner_id: user.id, pet_id: petId, reminder_type: 'food_restock',
      title: 'Order more Salmon Adult Formula', due_at: addDays(new Date(), 5).toISOString(),
      repeat_rule: null, is_completed: false,
    },
  ])

  // ─── Devices ─────────────────────────────────────────────────────────────
  const now = new Date().toISOString()
  await supabase.from('devices').insert([
    {
      owner_id: user.id, pet_id: petId, device_name: "Milo's GPS Collar",
      device_type: 'gps_collar', status: 'online', battery_percent: 78,
      last_seen_at: now,
      metadata: { latitude: 1.3521, longitude: 103.8198, location_name: 'Bishan Park', temperature_c: 28 },
    },
    {
      owner_id: user.id, pet_id: petId, device_name: 'Smart Feeder Pro',
      device_type: 'smart_feeder', status: 'online', battery_percent: 100,
      last_seen_at: now,
      metadata: { food_level_percent: 65, total_dispensed_today_g: 117, last_dispensed: `${format(new Date(), 'yyyy-MM-dd')}T08:00:00` },
    },
    {
      owner_id: user.id, pet_id: petId, device_name: 'AquaPaw Bowl',
      device_type: 'smart_water_bowl', status: 'online', battery_percent: 55,
      last_seen_at: now,
      metadata: { water_level_percent: 72 },
    },
    {
      owner_id: user.id, pet_id: petId, device_name: 'Room Sensor',
      device_type: 'temperature_sensor', status: 'online', battery_percent: 34,
      last_seen_at: now,
      metadata: { temperature_c: 26, humidity_percent: 58 },
    },
  ])

  // ─── Alerts ───────────────────────────────────────────────────────────────
  await supabase.from('alerts').insert([
    {
      owner_id: user.id, pet_id: petId, alert_type: 'low_battery',
      severity: 'warning', title: 'Room Sensor battery low',
      message: 'Room Sensor battery is at 34%. Consider replacing or charging it soon.',
      is_read: false,
    },
    {
      owner_id: user.id, pet_id: petId, alert_type: 'missed_meal',
      severity: 'info', title: 'Dinner not logged yet',
      message: "Milo's 7:00 PM dinner hasn't been marked yet.",
      is_read: false,
    },
  ])

  localStorage.setItem(DEMO_FLAG_KEY, 'true')
}

export async function clearDemoData(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated.')

  // Delete all user data (RLS ensures only own data is deleted)
  await Promise.all([
    supabase.from('alerts').delete().eq('owner_id', user.id),
    supabase.from('reminders').delete().eq('owner_id', user.id),
    supabase.from('devices').delete().eq('owner_id', user.id),
    supabase.from('medications').delete().eq('owner_id', user.id),
    supabase.from('health_records').delete().eq('owner_id', user.id),
    supabase.from('activity_logs').delete().eq('owner_id', user.id),
    supabase.from('weight_logs').delete().eq('owner_id', user.id),
    supabase.from('meal_logs').delete().eq('owner_id', user.id),
  ])

  await supabase.from('meal_plan_items').delete().eq('owner_id', user.id)
  await supabase.from('meal_plans').delete().eq('owner_id', user.id)
  await supabase.from('foods').delete().eq('owner_id', user.id)
  await supabase.from('pets').delete().eq('owner_id', user.id)

  localStorage.removeItem(DEMO_FLAG_KEY)
}
