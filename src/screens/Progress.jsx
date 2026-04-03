import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { Card, StatBlock } from '../components/Card.jsx'
import { CheckCircle, SkipForward, Calendar } from 'lucide-react'

export default function Progress() {
  const navigate = useNavigate()
  const { getStreak, getWorkoutsThisWeek, getTotalWorkouts, getRecentWorkouts } = useStore()

  const streak = getStreak()
  const weekWorkouts = getWorkoutsThisWeek()
  const totalWorkouts = getTotalWorkouts()
  const recentWorkouts = getRecentWorkouts(10)

  // Build last 7 days
  const last7Days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    last7Days.push(d.toISOString().split('T')[0])
  }

  const dayLabel = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0)
  }

  const isToday = (dateStr) => {
    return dateStr === new Date().toISOString().split('T')[0]
  }

  const getWorkoutForDay = (dateStr) => {
    return recentWorkouts.find(w => w.date === dateStr)
  }

  const statusIcon = (status) => {
    if (status === 'completed') return <CheckCircle size={12} className="text-success" />
    if (status === 'skipped') return <SkipForward size={12} className="text-text-muted" />
    return null
  }

  return (
    <div className="min-h-screen bg-bg pb-20">
      <div className="max-w-lg mx-auto px-4 pt-10">
        <h1 className="text-2xl font-bold text-text-primary mb-6">Progress</h1>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="p-4">
            <StatBlock value={streak} label="Day Streak" />
          </Card>
          <Card className="p-4">
            <StatBlock value={weekWorkouts} label="This Week" />
          </Card>
          <Card className="p-4">
            <StatBlock value={totalWorkouts} label="All Time" />
          </Card>
        </div>

        {/* Weekly Calendar Strip */}
        <Card className="p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Last 7 Days</h2>
            <span className="text-xs text-text-muted">{weekWorkouts}/7 this week</span>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {last7Days.map(dateStr => {
              const workout = getWorkoutForDay(dateStr)
              const today = isToday(dateStr)
              return (
                <div key={dateStr} className="flex flex-col items-center gap-1.5">
                  <span className={`text-xs font-medium ${today ? 'text-primary' : 'text-text-muted'}`}>
                    {dayLabel(dateStr)}
                  </span>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-colors ${
                    workout?.status === 'completed'
                      ? 'bg-success/15 border-success/30'
                      : workout?.status === 'skipped'
                      ? 'bg-surface border-border'
                      : today
                      ? 'bg-primary/15 border-primary/30'
                      : 'bg-surface border-border'
                  }`}>
                    {workout ? (
                      statusIcon(workout.status)
                    ) : today ? (
                      <Calendar size={14} className="text-primary" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-border" />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Recent History */}
        <div>
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">History</h2>
          {recentWorkouts.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-text-muted text-sm">No workouts logged yet.</p>
              <p className="text-text-muted text-xs mt-1">Complete your first workout to see it here.</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {recentWorkouts.map(w => (
                <Card key={w.id} className="p-3" onClick={() => navigate(`/workout/${w.id}`)}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-text-primary">
                        {w.generatedWorkout?.name || 'Workout'}
                      </div>
                      <div className="text-xs text-text-muted mt-0.5">
                        {new Date(w.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        {w.generatedWorkout && ` • ~${w.generatedWorkout.estimatedMinutes} min`}
                      </div>
                      {w.note && (
                        <div className="text-xs text-text-muted italic mt-1 truncate max-w-xs">"{w.note}"</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {statusIcon(w.status)}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
