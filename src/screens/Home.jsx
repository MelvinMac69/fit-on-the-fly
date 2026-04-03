import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, Clock, Dumbbell, Flame, ChevronRight, CheckCircle, Play } from 'lucide-react'
import { useStore } from '../store/useStore.js'
import { Button } from '../components/Button.jsx'
import { PillSelectorRow } from '../components/PillSelector.jsx'
import { Card, StatBlock } from '../components/Card.jsx'
import {
  TIME_OPTIONS,
  EQUIPMENT_TYPES,
  EQUIPMENT_LABELS,
} from '../data/exercises.js'

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

export default function Home() {
  const navigate = useNavigate()
  const store = useStore()
  const { user, generateTodayWorkout } = store

  const [contextOpen, setContextOpen] = useState(false)
  const [timeAvailable, setTimeAvailable] = useState(null)
  const [equipment, setEquipment] = useState(null)
  const [energy, setEnergy] = useState(null)
  const [generating, setGenerating] = useState(false)

  const streak = store.getStreak()
  const workoutsThisWeek = store.getWorkoutsThisWeek()
  const recentWorkouts = store.getRecentWorkouts(3)
  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  // Active session — show banner if there's a workout in progress
  const activeSession = store.activeSession
  const activeWorkout = activeSession
    ? store.workouts.find(w => w.id === activeSession.workoutId)
    : null

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

  return (
    <div className="min-h-screen bg-bg pb-24">
      <div className="max-w-lg mx-auto px-4 pt-10">
        {/* Header */}
        <div className="mb-6">
          <p className="text-text-muted text-xs uppercase tracking-wider">{todayStr}</p>
          <h1 className="text-2xl font-bold text-text-primary mt-0.5">
            Hey, {user?.name || 'Pilot'}.
          </h1>
        </div>

        {/* Active Session Banner */}
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

        {/* Streak Hero */}
        {!activeWorkout && (
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
