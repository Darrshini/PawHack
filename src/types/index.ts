// ─── Auth / Profile ──────────────────────────────────────────────────────────

export interface Profile {
  id: string
  display_name: string | null
  created_at: string
}

// ─── Pet ─────────────────────────────────────────────────────────────────────

export type ActivityLevel = 'low' | 'moderate' | 'high'

export interface Pet {
  id: string
  owner_id: string
  name: string
  species: string
  breed: string | null
  birth_date: string | null
  current_weight_kg: number | null
  target_weight_kg: number | null
  activity_level: ActivityLevel
  is_neutered: boolean
  allergies: string[]
  medical_conditions: string[]
  photo_path: string | null
  created_at: string
}

// ─── Food ────────────────────────────────────────────────────────────────────

export type FoodType = 'dry' | 'wet' | 'raw' | 'treats' | 'supplement' | 'other'

export interface Food {
  id: string
  owner_id: string
  brand: string | null
  product_name: string
  food_type: FoodType
  kcal_per_100g: number
  ingredients: string[]
  allergens: string[]
  stock_quantity_g: number
  created_at: string
}

// ─── Meal Plan ───────────────────────────────────────────────────────────────

export type MealGoal =
  | 'maintenance'
  | 'gradual_weight_loss'
  | 'weight_gain'
  | 'puppy_growth'
  | 'kitten_growth'
  | 'senior_diet'

export interface MealPlan {
  id: string
  owner_id: string
  pet_id: string
  name: string
  goal: MealGoal
  daily_kcal_target: number
  start_date: string | null
  end_date: string | null
  veterinarian_notes: string | null
  is_active: boolean
  created_at: string
}

// ─── Meal Plan Item ──────────────────────────────────────────────────────────

export type MealType = 'breakfast' | 'lunch' | 'snack' | 'dinner'

export interface MealPlanItem {
  id: string
  owner_id: string
  meal_plan_id: string
  food_id: string | null
  day_of_week: number // 0 = Sunday, 6 = Saturday
  meal_time: string   // HH:MM
  meal_type: MealType
  quantity_g: number
  calories: number
  notes: string | null
  created_at: string
  food?: Food
}

// ─── Meal Log ────────────────────────────────────────────────────────────────

export type MealStatus = 'completed' | 'partial' | 'skipped'

export interface MealLog {
  id: string
  owner_id: string
  pet_id: string
  meal_plan_item_id: string | null
  food_id: string | null
  served_at: string
  quantity_g: number
  calories: number
  status: MealStatus
  notes: string | null
  food?: Food
  meal_plan_item?: MealPlanItem
}

// ─── Weight Log ──────────────────────────────────────────────────────────────

export interface WeightLog {
  id: string
  owner_id: string
  pet_id: string
  weight_kg: number
  recorded_at: string
  notes: string | null
}

// ─── Activity Log ────────────────────────────────────────────────────────────

export type ActivityType =
  | 'walk'
  | 'run'
  | 'play'
  | 'swim'
  | 'training'
  | 'other'

export interface ActivityLog {
  id: string
  owner_id: string
  pet_id: string
  activity_type: ActivityType
  duration_minutes: number
  distance_km: number | null
  steps: number | null
  sleep_hours: number | null
  started_at: string
  notes: string | null
}

// ─── Health Record ───────────────────────────────────────────────────────────

export type HealthRecordType =
  | 'vaccination'
  | 'checkup'
  | 'surgery'
  | 'dental'
  | 'allergy_test'
  | 'blood_test'
  | 'xray'
  | 'prescription'
  | 'other'

export interface HealthRecord {
  id: string
  owner_id: string
  pet_id: string
  record_type: HealthRecordType
  title: string
  record_date: string
  veterinarian: string | null
  notes: string | null
  next_due_date: string | null
  created_at: string
}

// ─── Medication ──────────────────────────────────────────────────────────────

export interface Medication {
  id: string
  owner_id: string
  pet_id: string
  name: string
  dosage: string | null
  instructions: string | null
  start_date: string
  end_date: string | null
  scheduled_time: string | null
  is_active: boolean
}

// ─── Reminder ────────────────────────────────────────────────────────────────

export type ReminderType =
  | 'meal'
  | 'medication'
  | 'grooming'
  | 'vaccination'
  | 'vet_appointment'
  | 'food_restock'
  | 'device_charging'

export interface Reminder {
  id: string
  owner_id: string
  pet_id: string
  reminder_type: ReminderType
  title: string
  due_at: string
  repeat_rule: string | null
  is_completed: boolean
  created_at: string
}

// ─── Device ──────────────────────────────────────────────────────────────────

export type DeviceStatus = 'online' | 'offline'

export type DeviceType =
  | 'gps_collar'
  | 'smart_feeder'
  | 'smart_water_bowl'
  | 'pet_camera'
  | 'temperature_sensor'
  | 'humidity_sensor'

export interface DeviceMetadata {
  food_level_percent?: number
  water_level_percent?: number
  temperature_c?: number
  humidity_percent?: number
  latitude?: number
  longitude?: number
  location_name?: string
  last_dispensed?: string
  total_dispensed_today_g?: number
}

export interface Device {
  id: string
  owner_id: string
  pet_id: string
  device_name: string
  device_type: DeviceType
  status: DeviceStatus
  battery_percent: number
  last_seen_at: string
  metadata: DeviceMetadata
}

// ─── Alert ───────────────────────────────────────────────────────────────────

export type AlertSeverity = 'info' | 'warning' | 'critical'

export type AlertType =
  | 'missed_medication'
  | 'missed_meal'
  | 'low_food'
  | 'low_water'
  | 'low_battery'
  | 'unusual_inactivity'
  | 'outside_safe_zone'
  | 'high_temperature'

export interface Alert {
  id: string
  owner_id: string
  pet_id: string
  alert_type: AlertType
  severity: AlertSeverity
  title: string
  message: string
  is_read: boolean
  created_at: string
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export interface DashboardData {
  pet: Pet | null
  todayMealLogs: MealLog[]
  recentWeightLogs: WeightLog[]
  todayActivities: ActivityLog[]
  upcomingReminders: Reminder[]
  activeMedications: Medication[]
  devices: Device[]
  unreadAlerts: Alert[]
  totalCaloriesToday: number
  dailyCalorieTarget: number
  totalActivityMinutes: number
  latestWeight: number | null
  weightDiff: number | null
  unreadAlertCount: number
  foodStockRemainingG: number | null
  estimatedFoodDaysRemaining: number | null
}
