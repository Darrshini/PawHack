import { supabase } from '../lib/supabase'
import type { Food, MealPlan, MealPlanItem, MealLog, FoodType, MealGoal, MealType, MealStatus } from '../types'

// ─── Foods ───────────────────────────────────────────────────────────────────

export async function getFoods(): Promise<Food[]> {
  const { data, error } = await supabase
    .from('foods')
    .select('*')
    .order('product_name')

  if (error) throw new Error('Failed to load foods.')
  return data as Food[]
}

export async function createFood(input: {
  brand?: string
  product_name: string
  food_type: FoodType
  kcal_per_100g: number
  ingredients: string[]
  allergens: string[]
  stock_quantity_g: number
}): Promise<Food> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated.')

  const { data, error } = await supabase
    .from('foods')
    .insert({ ...input, owner_id: user.id })
    .select()
    .single()

  if (error) throw new Error('Failed to create food.')
  return data as Food
}

export async function updateFood(id: string, input: Partial<{
  brand: string
  product_name: string
  food_type: FoodType
  kcal_per_100g: number
  ingredients: string[]
  allergens: string[]
  stock_quantity_g: number
}>): Promise<Food> {
  const { data, error } = await supabase
    .from('foods')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error('Failed to update food.')
  return data as Food
}

export async function deleteFood(id: string): Promise<void> {
  const { error } = await supabase.from('foods').delete().eq('id', id)
  if (error) throw new Error('Failed to delete food.')
}

// ─── Meal Plans ──────────────────────────────────────────────────────────────

export async function getMealPlans(petId: string): Promise<MealPlan[]> {
  const { data, error } = await supabase
    .from('meal_plans')
    .select('*')
    .eq('pet_id', petId)
    .order('created_at', { ascending: false })

  if (error) throw new Error('Failed to load meal plans.')
  return data as MealPlan[]
}

export async function createMealPlan(input: {
  pet_id: string
  name: string
  goal: MealGoal
  daily_kcal_target: number
  start_date?: string
  end_date?: string
  veterinarian_notes?: string
  is_active?: boolean
}): Promise<MealPlan> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated.')

  const { data, error } = await supabase
    .from('meal_plans')
    .insert({ ...input, owner_id: user.id })
    .select()
    .single()

  if (error) throw new Error('Failed to create meal plan.')
  return data as MealPlan
}

export async function updateMealPlan(id: string, input: Partial<MealPlan>): Promise<MealPlan> {
  const { data, error } = await supabase
    .from('meal_plans')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error('Failed to update meal plan.')
  return data as MealPlan
}

export async function deleteMealPlan(id: string): Promise<void> {
  const { error } = await supabase.from('meal_plans').delete().eq('id', id)
  if (error) throw new Error('Failed to delete meal plan.')
}

// ─── Meal Plan Items ──────────────────────────────────────────────────────────

export async function getMealPlanItems(mealPlanId: string): Promise<MealPlanItem[]> {
  const { data, error } = await supabase
    .from('meal_plan_items')
    .select('*, food:foods(*)')
    .eq('meal_plan_id', mealPlanId)
    .order('day_of_week')

  if (error) throw new Error('Failed to load meal plan items.')
  return data as unknown as MealPlanItem[]
}

export async function createMealPlanItem(input: {
  meal_plan_id: string
  food_id?: string
  day_of_week: number
  meal_time: string
  meal_type: MealType
  quantity_g: number
  calories: number
  notes?: string
}): Promise<MealPlanItem> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated.')

  const { data, error } = await supabase
    .from('meal_plan_items')
    .insert({ ...input, owner_id: user.id })
    .select('*, food:foods(*)')
    .single()

  if (error) throw new Error('Failed to create meal plan item.')
  return data as unknown as MealPlanItem
}

export async function updateMealPlanItem(id: string, input: Partial<MealPlanItem>): Promise<MealPlanItem> {
  const { data, error } = await supabase
    .from('meal_plan_items')
    .update(input)
    .eq('id', id)
    .select('*, food:foods(*)')
    .single()

  if (error) throw new Error('Failed to update meal plan item.')
  return data as unknown as MealPlanItem
}

export async function deleteMealPlanItem(id: string): Promise<void> {
  const { error } = await supabase.from('meal_plan_items').delete().eq('id', id)
  if (error) throw new Error('Failed to delete meal plan item.')
}

// ─── Meal Logs ────────────────────────────────────────────────────────────────

export async function getMealLogs(petId: string, date?: string): Promise<MealLog[]> {
  let query = supabase
    .from('meal_logs')
    .select('*, food:foods(*)')
    .eq('pet_id', petId)
    .order('served_at', { ascending: false })

  if (date) {
    const start = `${date}T00:00:00`
    const end = `${date}T23:59:59`
    query = query.gte('served_at', start).lte('served_at', end)
  }

  const { data, error } = await query
  if (error) throw new Error('Failed to load meal logs.')
  return data as unknown as MealLog[]
}

export async function createMealLog(input: {
  pet_id: string
  meal_plan_item_id?: string
  food_id?: string
  served_at: string
  quantity_g: number
  calories: number
  status: MealStatus
  notes?: string
}): Promise<MealLog> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated.')

  const { data, error } = await supabase
    .from('meal_logs')
    .insert({ ...input, owner_id: user.id })
    .select('*, food:foods(*)')
    .single()

  if (error) throw new Error('Failed to log meal.')
  return data as unknown as MealLog
}

export async function updateMealLog(id: string, input: Partial<MealLog>): Promise<MealLog> {
  const { data, error } = await supabase
    .from('meal_logs')
    .update(input)
    .eq('id', id)
    .select('*, food:foods(*)')
    .single()

  if (error) throw new Error('Failed to update meal log.')
  return data as unknown as MealLog
}

export async function deleteMealLog(id: string): Promise<void> {
  const { error } = await supabase.from('meal_logs').delete().eq('id', id)
  if (error) throw new Error('Failed to delete meal log.')
}

// ─── Calorie Calculations ─────────────────────────────────────────────────────

export function calculateDailyFoodGrams(dailyCalories: number, kcalPer100g: number): number {
  if (kcalPer100g <= 0) return 0
  return Math.round((dailyCalories / kcalPer100g) * 100)
}

export function estimatedDaysRemaining(stockG: number, dailyG: number): number {
  if (dailyG <= 0) return 0
  return Math.floor(stockG / dailyG)
}
