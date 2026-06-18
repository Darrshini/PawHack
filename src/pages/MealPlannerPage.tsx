import { useState, useEffect } from 'react'
import { usePet } from '../contexts/PetContext'
import {
  getFoods, getMealPlans, getMealPlanItems, getMealLogs,
  createMealLog, updateMealLog, deleteMealLog,
  createMealPlan, createMealPlanItem, deleteMealPlanItem,
  calculateDailyFoodGrams, estimatedDaysRemaining,
} from '../services/mealService'
import type { Food, MealPlan, MealPlanItem, MealLog, MealGoal, MealType, MealStatus } from '../types'
import { Modal } from '../components/common/Modal'
import { FormField, EmptyState, LoadingSpinner, ErrorMessage, ProgressCard } from '../components/common'
import { Plus, Trash2, AlertTriangle, CheckCircle, Clock, SkipForward } from 'lucide-react'
import { format } from 'date-fns'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner']

export default function MealPlannerPage() {
  const { activePet } = usePet()
  const today = new Date().getDay() // 0=Sun

  const [foods, setFoods] = useState<Food[]>([])
  const [plans, setPlans] = useState<MealPlan[]>([])
  const [activePlan, setActivePlan] = useState<MealPlan | null>(null)
  const [items, setItems] = useState<MealPlanItem[]>([])
  const [todayLogs, setTodayLogs] = useState<MealLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [selectedDay, setSelectedDay] = useState(today)
  const [logModalOpen, setLogModalOpen] = useState(false)
  const [logItem, setLogItem] = useState<MealPlanItem | null>(null)
  const [logStatus, setLogStatus] = useState<MealStatus>('completed')
  const [logQty, setLogQty] = useState('')
  const [logNotes, setLogNotes] = useState('')
  const [logging, setLogging] = useState(false)

  const [newPlanOpen, setNewPlanOpen] = useState(false)
  const [planForm, setPlanForm] = useState({ name: '', goal: 'maintenance' as MealGoal, daily_kcal_target: '1050', vet_notes: '' })
  const [creatingPlan, setCreatingPlan] = useState(false)

  const [addItemOpen, setAddItemOpen] = useState(false)
  const [itemForm, setItemForm] = useState({
    food_id: '', day_of_week: today.toString(), meal_type: 'breakfast' as MealType,
    meal_time: '08:00', quantity_g: '', notes: ''
  })
  const [addingItem, setAddingItem] = useState(false)

  const loadData = async () => {
    if (!activePet) return
    setLoading(true)
    try {
      const [foodsData, plansData] = await Promise.all([
        getFoods(),
        getMealPlans(activePet.id),
      ])
      setFoods(foodsData)
      setPlans(plansData)
      const active = plansData.find(p => p.is_active) ?? plansData[0] ?? null
      setActivePlan(active)

      if (active) {
        const [itemsData, logsData] = await Promise.all([
          getMealPlanItems(active.id),
          getMealLogs(activePet.id, format(new Date(), 'yyyy-MM-dd')),
        ])
        setItems(itemsData)
        setTodayLogs(logsData)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load meal data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [activePet])

  const dayItems = items.filter(it => it.day_of_week === selectedDay)
  const totalCaloriesToday = todayLogs.reduce((s, l) => s + l.calories, 0)
  const dailyTarget = activePlan?.daily_kcal_target ?? 1050

  const getLogForItem = (itemId: string) => todayLogs.find(l => l.meal_plan_item_id === itemId)

  const openLogModal = (item: MealPlanItem) => {
    setLogItem(item)
    const existing = getLogForItem(item.id)
    setLogStatus(existing?.status ?? 'completed')
    setLogQty(existing?.quantity_g.toString() ?? item.quantity_g.toString())
    setLogNotes(existing?.notes ?? '')
    setLogModalOpen(true)
  }

  const handleLogMeal = async () => {
    if (!activePet || !logItem) return
    setLogging(true)
    try {
      const existing = getLogForItem(logItem.id)
      const food = foods.find(f => f.id === logItem.food_id)
      const qty = Number(logQty) || logItem.quantity_g
      const calories = food ? Math.round((food.kcal_per_100g / 100) * qty) : logItem.calories

      if (existing) {
        await updateMealLog(existing.id, { quantity_g: qty, calories, status: logStatus, notes: logNotes || null })
      } else {
        await createMealLog({
          pet_id: activePet.id,
          meal_plan_item_id: logItem.id,
          food_id: logItem.food_id ?? undefined,
          served_at: new Date().toISOString(),
          quantity_g: qty,
          calories,
          status: logStatus,
          notes: logNotes || undefined,
        })
      }

      const logsData = await getMealLogs(activePet.id, format(new Date(), 'yyyy-MM-dd'))
      setTodayLogs(logsData)
      setLogModalOpen(false)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to log meal.')
    } finally {
      setLogging(false)
    }
  }

  const handleCreatePlan = async () => {
    if (!activePet) return
    setCreatingPlan(true)
    try {
      await createMealPlan({
        pet_id: activePet.id,
        name: planForm.name || `${activePet.name}'s Plan`,
        goal: planForm.goal,
        daily_kcal_target: Number(planForm.daily_kcal_target) || 1050,
        is_active: true,
        veterinarian_notes: planForm.vet_notes || undefined,
        start_date: format(new Date(), 'yyyy-MM-dd'),
      })
      setNewPlanOpen(false)
      setPlanForm({ name: '', goal: 'maintenance', daily_kcal_target: '1050', vet_notes: '' })
      await loadData()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create plan.')
    } finally {
      setCreatingPlan(false)
    }
  }

  const handleAddItem = async () => {
    if (!activePlan) return
    setAddingItem(true)
    try {
      const food = foods.find(f => f.id === itemForm.food_id)
      const qty = Number(itemForm.quantity_g) || 100
      const calories = food ? Math.round((food.kcal_per_100g / 100) * qty) : 0
      await createMealPlanItem({
        meal_plan_id: activePlan.id,
        food_id: itemForm.food_id || undefined,
        day_of_week: Number(itemForm.day_of_week),
        meal_time: itemForm.meal_time,
        meal_type: itemForm.meal_type,
        quantity_g: qty,
        calories,
        notes: itemForm.notes || undefined,
      })
      setAddItemOpen(false)
      const newItems = await getMealPlanItems(activePlan.id)
      setItems(newItems)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to add meal item.')
    } finally {
      setAddingItem(false)
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    try {
      await deleteMealPlanItem(itemId)
      setItems(prev => prev.filter(i => i.id !== itemId))
    } catch (e: unknown) {
      setError('Failed to delete item.')
    }
  }

  if (!activePet) {
    return (
      <div>
        <h1 className="page-title">Meal Planner</h1>
        <div className="card" style={{ marginTop: '1rem' }}>
          <EmptyState title="No pet selected" description="Please select or add a pet first." />
        </div>
      </div>
    )
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><LoadingSpinner large /></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Meal Planner</h1>
          <p className="page-subtitle">{activePet.name}'s nutrition plan</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {activePlan && (
            <button className="btn btn-secondary" onClick={() => setAddItemOpen(true)}>
              <Plus size={16} /> Add Meal
            </button>
          )}
          <button className="btn btn-primary" onClick={() => setNewPlanOpen(true)}>
            <Plus size={16} /> New Plan
          </button>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Vet disclaimer */}
      <div className="alert-strip warning" style={{ marginBottom: '1rem', fontSize: '0.8125rem' }}>
        <AlertTriangle size={16} style={{ flexShrink: 0 }} />
        Meal recommendations are estimates only. Consult your veterinarian before making major dietary or weight-management changes.
      </div>

      {!activePlan ? (
        <div className="card">
          <EmptyState
            icon={<span style={{ fontSize: '2rem' }}>🍽</span>}
            title="No meal plan yet"
            description={`Create a personalised meal plan for ${activePet.name}.`}
            action={<button className="btn btn-primary" onClick={() => setNewPlanOpen(true)}><Plus size={16} /> Create Plan</button>}
          />
        </div>
      ) : (
        <>
          {/* Plan overview */}
          <div className="dashboard-grid" style={{ marginBottom: '1rem' }}>
            <div className="card card-body col-span-2">
              <p className="text-sm text-muted">Active Plan</p>
              <p className="font-bold" style={{ fontSize: '1rem' }}>{activePlan.name}</p>
              <p className="text-sm" style={{ textTransform: 'capitalize', color: 'var(--color-brand)' }}>
                Goal: {activePlan.goal.replace(/_/g, ' ')}
              </p>
              {activePlan.veterinarian_notes && (
                <p className="text-xs text-muted" style={{ marginTop: '0.25rem' }}>📋 {activePlan.veterinarian_notes}</p>
              )}
            </div>

            <ProgressCard
              label="Today's calories"
              current={totalCaloriesToday}
              target={dailyTarget}
              unit=" kcal"
            />

            {/* Food stock */}
            {foods[0] && (
              <div className="card card-body">
                <p className="text-sm text-muted">Food stock</p>
                <p className="font-bold">{foods[0].stock_quantity_g}g remaining</p>
                <p className="text-xs text-muted">
                  ≈ {estimatedDaysRemaining(
                    foods[0].stock_quantity_g,
                    calculateDailyFoodGrams(dailyTarget, foods[0].kcal_per_100g)
                  )} days left
                </p>
              </div>
            )}
          </div>

          {/* Calorie calculator hint */}
          {foods[0] && (
            <div className="card card-body" style={{ marginBottom: '1rem', background: 'var(--color-brand-light)' }}>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-brand)', marginBottom: '0.25rem' }}>📊 Daily food calculation</p>
              <p className="text-sm" style={{ color: 'var(--color-brand)' }}>
                {dailyTarget} kcal ÷ {foods[0].kcal_per_100g} kcal/100g × 100
                = <strong>{calculateDailyFoodGrams(dailyTarget, foods[0].kcal_per_100g)}g</strong> per day of {foods[0].product_name}
              </p>
            </div>
          )}

          {/* Day selector */}
          <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '1rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
            {DAYS.map((day, i) => (
              <button
                key={day}
                onClick={() => setSelectedDay(i)}
                className="btn btn-sm"
                style={{
                  background: selectedDay === i ? 'var(--color-brand)' : 'var(--color-surface)',
                  color: selectedDay === i ? 'white' : 'var(--color-text-secondary)',
                  border: '1.5px solid',
                  borderColor: selectedDay === i ? 'var(--color-brand)' : 'var(--color-border)',
                  whiteSpace: 'nowrap',
                  fontWeight: today === i ? 700 : 500,
                }}
              >
                {day.slice(0, 3)}{today === i ? ' ✦' : ''}
              </button>
            ))}
          </div>

          {/* Meal items for selected day */}
          {dayItems.length === 0 ? (
            <div className="card">
              <EmptyState
                title={`No meals on ${DAYS[selectedDay]}`}
                description="Add meals to this day's plan."
                action={
                  <button className="btn btn-secondary btn-sm" onClick={() => { setItemForm(f => ({ ...f, day_of_week: selectedDay.toString() })); setAddItemOpen(true) }}>
                    <Plus size={14} /> Add Meal
                  </button>
                }
              />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {MEAL_TYPES.map(mealType => {
                const typeItems = dayItems.filter(it => it.meal_type === mealType)
                if (typeItems.length === 0) return null
                return (
                  <div key={mealType}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'capitalize', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                      {mealType}
                    </h3>
                    {typeItems.map(item => {
                      const log = selectedDay === today ? getLogForItem(item.id) : null
                      const food = foods.find(f => f.id === item.food_id)
                      const hasAllergyConflict = food?.allergens.some(a => activePet.allergies.includes(a.toLowerCase()))

                      return (
                        <div key={item.id} className="card card-body" style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <Clock size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                              <span className="font-semibold text-sm">{item.meal_time}</span>
                              {food && <span className="text-sm truncate">{food.product_name}</span>}
                              {hasAllergyConflict && (
                                <span className="badge badge-danger" title="Contains allergen">⚠ Allergen</span>
                              )}
                            </div>
                            <p className="text-xs text-muted" style={{ marginTop: '0.25rem' }}>
                              {item.quantity_g}g · {item.calories} kcal
                            </p>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {log && (
                              <span className={`badge badge-${log.status === 'completed' ? 'success' : log.status === 'partial' ? 'warning' : 'neutral'}`}>
                                {log.status === 'completed' ? '✓' : log.status === 'partial' ? '½' : '✗'} {log.status}
                              </span>
                            )}
                            {selectedDay === today && (
                              <button className="btn btn-secondary btn-sm" onClick={() => openLogModal(item)}>
                                {log ? 'Update' : 'Log'}
                              </button>
                            )}
                            <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteItem(item.id)} style={{ color: 'var(--color-danger)' }}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Log Meal Modal */}
      <Modal
        open={logModalOpen}
        onClose={() => setLogModalOpen(false)}
        title="Log Meal"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setLogModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleLogMeal} disabled={logging}>
              {logging ? 'Saving…' : 'Save Log'}
            </button>
          </>
        }
      >
        <FormField label="Amount served (g)">
          <input type="number" min="0" step="1" className="form-input" value={logQty} onChange={e => setLogQty(e.target.value)} />
        </FormField>
        <FormField label="Status">
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {(['completed', 'partial', 'skipped'] as MealStatus[]).map(s => (
              <button
                key={s}
                className="btn btn-sm"
                style={{
                  flex: 1,
                  background: logStatus === s ? 'var(--color-brand)' : 'var(--color-surface-alt)',
                  color: logStatus === s ? 'white' : 'var(--color-text-secondary)',
                  border: '1.5px solid',
                  borderColor: logStatus === s ? 'var(--color-brand)' : 'var(--color-border)',
                  textTransform: 'capitalize',
                }}
                onClick={() => setLogStatus(s)}
              >
                {s === 'completed' ? <CheckCircle size={14} /> : s === 'partial' ? <Clock size={14} /> : <SkipForward size={14} />}
                {s}
              </button>
            ))}
          </div>
        </FormField>
        <FormField label="Notes">
          <input className="form-input" value={logNotes} onChange={e => setLogNotes(e.target.value)} placeholder="Any observations…" />
        </FormField>
      </Modal>

      {/* New Plan Modal */}
      <Modal
        open={newPlanOpen}
        onClose={() => setNewPlanOpen(false)}
        title="Create Meal Plan"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setNewPlanOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreatePlan} disabled={creatingPlan}>
              {creatingPlan ? 'Creating…' : 'Create Plan'}
            </button>
          </>
        }
      >
        <FormField label="Plan name">
          <input className="form-input" value={planForm.name} onChange={e => setPlanForm(f => ({ ...f, name: e.target.value }))} placeholder={`${activePet.name}'s Plan`} />
        </FormField>
        <FormField label="Goal">
          <select className="form-select" value={planForm.goal} onChange={e => setPlanForm(f => ({ ...f, goal: e.target.value as MealGoal }))}>
            <option value="maintenance">Maintenance</option>
            <option value="gradual_weight_loss">Gradual weight loss</option>
            <option value="weight_gain">Weight gain</option>
            <option value="puppy_growth">Puppy growth</option>
            <option value="kitten_growth">Kitten growth</option>
            <option value="senior_diet">Senior diet</option>
          </select>
        </FormField>
        <FormField label="Daily calorie target (kcal)" required>
          <input type="number" min="100" className="form-input" value={planForm.daily_kcal_target} onChange={e => setPlanForm(f => ({ ...f, daily_kcal_target: e.target.value }))} />
        </FormField>
        <FormField label="Veterinarian notes">
          <textarea className="form-textarea" value={planForm.vet_notes} onChange={e => setPlanForm(f => ({ ...f, vet_notes: e.target.value }))} placeholder="Any dietary notes from your vet…" />
        </FormField>
      </Modal>

      {/* Add Item Modal */}
      <Modal
        open={addItemOpen}
        onClose={() => setAddItemOpen(false)}
        title="Add Meal to Plan"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setAddItemOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAddItem} disabled={addingItem}>
              {addingItem ? 'Adding…' : 'Add Meal'}
            </button>
          </>
        }
      >
        <div className="form-row">
          <FormField label="Day">
            <select className="form-select" value={itemForm.day_of_week} onChange={e => setItemForm(f => ({ ...f, day_of_week: e.target.value }))}>
              {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
            </select>
          </FormField>
          <FormField label="Meal type">
            <select className="form-select" value={itemForm.meal_type} onChange={e => setItemForm(f => ({ ...f, meal_type: e.target.value as MealType }))}>
              {MEAL_TYPES.map(t => <option key={t} value={t} style={{ textTransform: 'capitalize' }}>{t}</option>)}
            </select>
          </FormField>
        </div>
        <div className="form-row">
          <FormField label="Time">
            <input type="time" className="form-input" value={itemForm.meal_time} onChange={e => setItemForm(f => ({ ...f, meal_time: e.target.value }))} />
          </FormField>
          <FormField label="Quantity (g)" required>
            <input type="number" min="1" className="form-input" value={itemForm.quantity_g} onChange={e => setItemForm(f => ({ ...f, quantity_g: e.target.value }))} placeholder="100" />
          </FormField>
        </div>
        <FormField label="Food">
          <select className="form-select" value={itemForm.food_id} onChange={e => setItemForm(f => ({ ...f, food_id: e.target.value }))}>
            <option value="">— Select food —</option>
            {foods.map(food => (
              <option key={food.id} value={food.id}>{food.product_name} ({food.kcal_per_100g} kcal/100g)</option>
            ))}
          </select>
        </FormField>
        <FormField label="Notes">
          <input className="form-input" value={itemForm.notes} onChange={e => setItemForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional note" />
        </FormField>
      </Modal>
    </div>
  )
}
