import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, Clock, Dumbbell, Flame, ChevronRight, CheckCircle, Play, AlertTriangle, Scale, TrendingUp } from 'lucide-react'
import { useStore } from '../store/useStore.js'
import { Button } from '../components/Button.jsx'
import { PillSelectorRow } from '../components/PillSelector.jsx'
import { Card, StatBlock } from '../components/Card.jsx'
import {
  TIME_OPTIONS,
  EQUIPMENT_TYPES,
  EQUIPMENT_LABELS,
} from '../data/exercises.js'
import { generateWorkout } from '../utils/workoutGenerator.js'

const timeOptions = TIME_OPTIONS.map(t => ({ value: t, label: `${t} min` }))
const equipmentOptions = Object.entries(EQUIPMENT_TYPES).map(([key, value]) => ({
  value,
  label: EQUIPMENT_LABELS[value],
}))
const energyOptions = [
  { value: 'low', label: '🔵 Low' },
  { value: 'medium', label: '🟠 Medium' },
  { value: 'high', label: '🟢 High' },
]

function formatVolume(kg) {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`
  return `${Math.round(kg)}kg`
}

// ─── Bodyweight Check-in Modal ─────────────────────────────────────────────────
function BodyweightModal({ isOpen, onSave, onClose, currentBodyweight }) {
  const [value, setValue] = useState(currentBodyweight || '')
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-surface border border-border rounded-t-2xl sm:rounded-2xl w-full max-w-sm p-6 mx-4">
        <h3 className="text-base font-bold text-text-primary mb-1">Bodyweight Check-in</h3>
        <p className="text-xs text-text-muted mb-4">Logged daily — used to calibrate your bodyweight workout load.</p>
        <div className="mb-4">
          <label className="text-xs text-text-muted uppercase tracking-wider mb-1 block">Today's weight</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder="e.g. 185"
              className="flex-1 bg-bg border border-border rounded-lg px-4 py-3 text-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
              inputMode="decimal"
              autoFocus
            />
            <span className="text-text-muted text-sm">lbs</span>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" onClick={() => { onSave(value); onClose() }} disabled={!value}>Save</Button>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const store = useStore()
  const { user, generateTodayWorkout, updateUser, workouts, exerciseLogs } = store

  const [contextOpen, setContextOpen] = useState(false)
  const [timeAvailable, setTimeAvailable] = useState(null)
  const [equipment, setEquipment] = useState(null)
  const [energy, setEnergy] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [showBodyweightModal, setShowBodyweightModal] = useState(false)

  const streak = store.getStreak()
  const workoutsThisWeek = store.getWorkoutsThisWeek()
  const recentWorkouts = store.getRecentWorkouts(3)
  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  // Active session — show banner if there's a workout in progress
  const activeSession = store.activeSession
  const activeWorkout = activeSession
    ? store.workouts.find(w => w.id === activeSession.workoutId)
    : null

  // Volume calculations
  const { totalVolume, todayVolume } = useMemo(() => {
    let total = 0
    let today = 0
    const todayDate = new Date().toISOString().split('T')[0]

    Object.entries(exerciseLogs || {}).forEach(([workoutId, exercises]) => {
      const workout = workouts.find(w => w.id === workoutId)
      if (!workout) return
      const isToday = workout.date === todayDate

      Object.values(exercises).forEach(exerciseLog => {
        if (!exerciseLog.sets) return
        exerciseLog.sets.forEach(set => {
          if (set.completed && set.weight && set.reps) {
            const vol = set.weight * set.reps
            total += vol
            if (isToday) today += vol
          }
        })
      })
    })

    return { totalVolume: total, todayVolume: today }
  }, [exerciseLogs, workouts])

  // Find incomplete (started but not finished) workout
  const incompleteWorkout = useMemo(() => {
    // active session workout is the one in progress
    if (activeWorkout) return activeWorkout
    // Otherwise check for a generated-but-never-started workout
    const generated = workouts.find(w => w.status === 'generated')
    return generated || null
  }, [workouts, activeWorkout])

  // Next workout preview (what would be generated based on rotation)
  const nextWorkoutPreview = useMemo(() => {
    if (activeWorkout || incompleteWorkout) return null
    // Show what the next split would be
    const gen = generateWorkout({
      timeAvailable: 30,
      equipment: user?.preferredEquipment || 'full_gym',
      energy: 'medium',
      fitnessLevel: user?.fitnessLevel || 'intermediate',
      goal: user?.goal || 'maintain',
      workouts,
    })
    return gen
  }, [workouts, user, activeWorkout, incompleteWorkout])

  const canGenerate = timeAvailable && equipment && energy

  const handleGenerate = async () => {
    if (!canGenerate) return
    setGenerating(true)
    await new Promise(r => setTimeout(r, 400))
    const workout = generateTodayWorkout({ timeAvailable, equipment, energy })
    setGenerating(false)
    if (workout) {
      navigate(`/workout/${workout.id}`)
    }
  }

  const handleContinueWorkout = () => {
    if (activeWorkout) {
      navigate(`/workout/${activeWorkout.id}`)
    }
  }

  const handleBodyweightSave = (value) => {
    updateUser({ bodyweight: value, bodyweightDate: new Date().toISOString().split('T')[0] })
  }

  // Check if bodyweight needs updating (show prompt if stale)
  const needsBodyweight = !user?.bodyweightDate ||
    user.bodyweightDate !== new Date().toISOString().split('T')[0]

  return (
    <div className="min-h-screen bg-bg pb-24">
      <BodyweightModal
        isOpen={showBodyweightModal}
        onSave={handleBodyweightSave}
        onClose={() => setShowBodyweightModal(false)}
        currentBodyweight={user?.bodyweight || ''}
      />

      <div className="max-w-lg mx-auto px-4 pt-10">
        {/* Header */}
        <div className="mb-5">
          <p className="text-text-muted text-xs uppercase tracking-wider">{todayStr}</p>
          <h1 className="text-2xl font-bold text-text-primary mt-0.5">
            Hey, {user?.name || 'Pilot'}.
          </h1>
        </div>

        {/* ── Incomplete Workout Alert ──────────────────────────────── */}
        {incompleteWorkout && !activeWorkout && (
          <Card
            className="p-4 mb-4 border-warning/40 bg-warning/5 cursor-pointer hover:bg-warning/10 transition-colors"
            onClick={() => navigate(`/workout/${incompleteWorkout.id}`)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-warning/20 flex items-center justify-center shrink-0">
                  <AlertTriangle className="text-warning" size={14} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-warning">Workout Incomplete</div>
                  <div className="text-xs text-text-muted mt-0.5">
                    {incompleteWorkout.generatedWorkout?.name} — tap to continue
                  </div>
                </div>
              </div>
              <ChevronRight className="text-warning shrink-0" size={18} />
            </div>
          </Card>
        )}

        {/* ── Active Session Banner ───────────────────────────────── */}
        {activeWorkout && (
          <Card
            className="p-4 mb-4 border-primary/40 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors"
            onClick={handleContinueWorkout}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Play className="text-primary ml-0.5" size={14} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-primary">Workout in Progress</div>
                  <div className="text-xs text-text-muted mt-0.5">
                    {activeWorkout.generatedWorkout?.name} • Continue where you left off
                  </div>
                </div>
              </div>
              <ChevronRight className="text-primary shrink-0" size={18} />
            </div>
          </Card>
        )}

        {/* ── Streak Hero ─────────────────────────────────────────── */}
        {(!activeWorkout) && (
          <Card className="p-5 mb-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/4" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
                  <Flame className="text-primary" size={20} />
                </div>
                <div>
                  <div className="text-xl font-bold font-mono text-text-primary">
                    {streak} day streak
                  </div>
                  <div className="text-xs text-text-muted">Keep it going</div>
                </div>
              </div>
              <div className="flex gap-4">
                <StatBlock value={workoutsThisWeek} label="This week" />
                <StatBlock value={store.getTotalWorkouts()} label="Total logged" />
              </div>
            </div>
          </Card>
        )}

        {/* ── Volume Stats ────────────────────────────────────────── */}
        {(!activeWorkout) && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <TrendingUp size={13} className="text-primary" />
                <span className="text-xs text-text-muted uppercase tracking-wider">Total Volume</span>
              </div>
              <div className="text-lg font-bold font-mono text-text-primary">
                {formatVolume(totalVolume)}
              </div>
              <div className="text-xs text-text-muted mt-0.5">weight × reps, all time</div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Clock size={13} className="text-success" />
                <span className="text-xs text-text-muted uppercase tracking-wider">Today's Volume</span>
              </div>
              <div className="text-lg font-bold font-mono text-text-primary">
                {formatVolume(todayVolume)}
              </div>
              <div className="text-xs text-text-muted mt-0.5">
                {todayVolume === 0 ? 'no sets logged yet' : 'completed today'}
              </div>
            </Card>
          </div>
        )}

        {/* ── Bodyweight Check-in ──────────────────────────────────── */}
        {(!activeWorkout) && (
          <Card className="p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-surface border border-border flex items-center justify-center shrink-0">
                  <Scale size={14} className="text-text-muted" />
                </div>
                <div>
                  <div className="text-sm font-medium text-text-primary">Bodyweight</div>
                  <div className="text-xs text-text-muted mt-0.5">
                    {user?.bodyweight
                      ? `${user.bodyweight} lbs — logged ${user.bodyweightDate === new Date().toISOString().split('T')[0] ? 'today' : user.bodyweightDate}`
                      : 'Not logged yet'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowBodyweightModal(true)}
                className="text-xs text-primary hover:text-primary/80 transition-colors font-medium px-3 py-1.5 border border-primary/30 rounded-full hover:bg-primary/10 transition-colors"
              >
                {user?.bodyweight ? 'Update' : '+ Log'}
              </button>
            </div>
          </Card>
        )}

        {/* ── Next Workout Preview ────────────────────────────────── */}
        {!activeWorkout && nextWorkoutPreview && (
          <Card className="p-4 mb-4 border-border">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-text-muted uppercase tracking-wider">Up Next</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-text-primary">
                  {nextWorkoutPreview.name}
                </div>
                <div className="text-xs text-text-muted mt-0.5">
                  ~{nextWorkoutPreview.estimatedMinutes} min •{' '}
                  {nextWorkoutPreview.main?.length || 0} exercises
                </div>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary capitalize">
                {nextWorkoutPreview.splitType}
              </span>
            </div>
          </Card>
        )}

        {/* Generate Button */}
        {!activeWorkout && (
          <Button
            size="lg"
            className="w-full mb-4"
            onClick={() => setContextOpen(true)}
          >
            <Zap className="mr-2" size={18} />
            Generate Today's Workout
          </Button>
        )}

        {/* Daily Context Panel */}
        {contextOpen && !activeWorkout && (
          <Card className="p-5 mb-4">
            <div className="space-y-5">
              {/* Time */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={14} className="text-text-muted" />
                  <span className="text-xs text-text-muted uppercase tracking-wider">Time available</span>
                </div>
                <PillSelectorRow
                  options={timeOptions}
                  value={timeAvailable}
                  onChange={setTimeAvailable}
                />
              </div>

              {/* Equipment */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Dumbbell size={14} className="text-text-muted" />
                  <span className="text-xs text-text-muted uppercase tracking-wider">Equipment</span>
                </div>
                <PillSelectorRow
                  options={equipmentOptions}
                  value={equipment}
                  onChange={setEquipment}
                />
              </div>

              {/* Energy */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={14} className="text-text-muted" />
                  <span className="text-xs text-text-muted uppercase tracking-wider">Energy level</span>
                </div>
                <PillSelectorRow
                  options={energyOptions}
                  value={energy}
                  onChange={setEnergy}
                />
              </div>

              {/* Generate */}
              <Button
                size="lg"
                className="w-full"
                disabled={!canGenerate}
                loading={generating}
                onClick={handleGenerate}
              >
                {generating ? 'Generating...' : '🚀 Generate Workout'}
              </Button>

              <button
                onClick={() => setContextOpen(false)}
                className="w-full text-center text-xs text-text-muted hover:text-text-secondary transition-colors"
              >
                Cancel
              </button>
            </div>
          </Card>
        )}

        {/* Recent Workouts */}
        {!activeWorkout && recentWorkouts.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Recent</h2>
            </div>
            <div className="space-y-2">
              {recentWorkouts.map(w => (
                <Card
                  key={w.id}
                  className="p-3 flex items-center justify-between"
                  onClick={() => navigate(`/workout/${w.id}`)}
                >
                  <div>
                    <div className="text-sm font-medium text-text-primary">
                      {w.generatedWorkout?.name || 'Workout'}
                    </div>
                    <div className="text-xs text-text-muted mt-0.5">
                      {w.date}
                      {w.generatedWorkout?.splitType && (
                        <span className="ml-1 capitalize">• {w.generatedWorkout.splitType}</span>
                      )}
                    </div>
                  </div>
                  {w.status === 'completed' && (
                    <CheckCircle className="text-success" size={16} />
                  )}
                  {w.status === 'skipped' && (
                    <span className="text-xs text-text-muted">Skipped</span>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
