import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { ExerciseRow } from '../components/ExerciseRow.jsx'
import { Badge } from '../components/Card.jsx'
import { Button } from '../components/Button.jsx'
import { NoteModal, ConfirmModal } from '../components/Modal.jsx'
import { Clock, Dumbbell, Zap, CheckCircle, SkipForward, MessageSquare } from 'lucide-react'

const ENERGY_BADGE = {
  low: { label: 'Low Energy', variant: 'default' },
  medium: { label: 'Medium Energy', variant: 'primary' },
  high: { label: 'High Energy', variant: 'success' },
}

export default function WorkoutDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { workouts, logWorkout } = useStore()

  const workout = workouts.find(w => w.id === id)
  const [expandedExercises, setExpandedExercises] = useState({})
  const [showNote, setShowNote] = useState(false)
  const [showSkipConfirm, setShowSkipConfirm] = useState(false)
  const [logged, setLogged] = useState(workout?.status !== 'generated')

  if (!workout || !workout.generatedWorkout) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-secondary mb-4">Workout not found</p>
          <Button onClick={() => navigate('/home')}>Back to Home</Button>
        </div>
      </div>
    )
  }

  const { generatedWorkout, equipment, energy, timeAvailable } = workout
  const { name, warmup, main, finisher, cooldown, estimatedMinutes } = generatedWorkout

  const toggleExercise = (sectionKey, idx) => {
    const key = `${sectionKey}-${idx}`
    setExpandedExercises(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleComplete = () => {
    logWorkout(workout.id, 'completed')
    setLogged(true)
  }

  const handleSkip = () => {
    logWorkout(workout.id, 'skipped')
    setShowSkipConfirm(false)
    navigate('/home')
  }

  const handleNote = (noteText) => {
    logWorkout(workout.id, logged ? workout.status : 'completed', noteText)
    setShowNote(false)
    if (!logged) setLogged(true)
  }

  const energyBadge = ENERGY_BADGE[energy] || ENERGY_BADGE.medium

  return (
    <div className="min-h-screen bg-bg pb-28">
      {/* Header */}
      <div className="bg-surface border-b border-border px-4 py-5">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => navigate('/home')}
            className="text-text-muted text-sm hover:text-text-primary transition-colors mb-3"
          >
            ← Back
          </button>
          <h1 className="text-xl font-bold text-text-primary">{name}</h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge variant="default">
              <Clock className="inline mr-1" size={10} />~{estimatedMinutes} min
            </Badge>
            <Badge variant="default" className="capitalize">
              <Dumbbell className="inline mr-1" size={10} />{equipment.replace('_', ' ')}
            </Badge>
            <Badge variant={energyBadge.variant}>
              <Zap className="inline mr-1" size={10} />{energyBadge.label}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        {/* Warmup */}
        {warmup.length > 0 && (
          <Section title="🔥 Warm-Up" accent="warning">
            {warmup.map((ex, i) => (
              <ExerciseRow
                key={`warmup-${i}`}
                exercise={ex}
                completed={false}
                expanded={expandedExercises[`warmup-${i}`]}
                onToggle={() => toggleExercise('warmup', i)}
              />
            ))}
          </Section>
        )}

        {/* Main Workout */}
        <Section title="💪 Main Workout" accent="primary">
          {main.map((ex, i) => (
            <ExerciseRow
              key={`main-${i}`}
              exercise={ex}
              completed={false}
              expanded={expandedExercises[`main-${i}`]}
              onToggle={() => toggleExercise('main', i)}
            />
          ))}
        </Section>

        {/* Finisher */}
        {finisher && (
          <Section title="⚡ Finisher" accent="danger">
            <ExerciseRow
              exercise={finisher}
              completed={false}
              expanded={expandedExercises['finisher-0']}
              onToggle={() => toggleExercise('finisher', 0)}
            />
          </Section>
        )}

        {/* Cooldown */}
        {cooldown.length > 0 && (
          <Section title="🧘 Cooldown" accent="default">
            {cooldown.map((ex, i) => (
              <ExerciseRow
                key={`cooldown-${i}`}
                exercise={ex}
                completed={false}
                expanded={expandedExercises[`cooldown-${i}`]}
                onToggle={() => toggleExercise('cooldown', i)}
              />
            ))}
          </Section>
        )}
      </div>

      {/* Bottom Action Bar */}
      {workout.status === 'generated' && (
        <div className="fixed bottom-0 left-0 right-0 bg-bg border-t border-border p-4 z-30">
          <div className="max-w-lg mx-auto flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setShowSkipConfirm(true)}
            >
              <SkipForward className="mr-2" size={16} />
              Skip
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setShowNote(true)}
            >
              <MessageSquare className="mr-2" size={16} />
              Note
            </Button>
            <Button
              className="flex-1"
              onClick={handleComplete}
            >
              <CheckCircle className="mr-2" size={16} />
              Complete
            </Button>
          </div>
        </div>
      )}

      {workout.status !== 'generated' && (
        <div className="fixed bottom-0 left-0 right-0 bg-bg border-t border-border p-4 z-30">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-success">
                <CheckCircle size={20} />
                <span className="text-sm font-medium">Logged as {workout.status}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNote(true)}
              >
                <MessageSquare className="mr-1" size={14} />
                Edit Note
              </Button>
            </div>
            {workout.note && (
              <p className="text-xs text-text-muted mt-2 italic">"{workout.note}"</p>
            )}
          </div>
        </div>
      )}

      <NoteModal
        isOpen={showNote}
        onSave={handleNote}
        onClose={() => setShowNote(false)}
        initialValue={workout.note || ''}
      />

      <ConfirmModal
        isOpen={showSkipConfirm}
        onConfirm={handleSkip}
        onCancel={() => setShowSkipConfirm(false)}
        title="Skip this workout?"
        message="This will be logged as skipped. No judgment — sometimes rest is the right call."
        confirmLabel="Skip"
      />
    </div>
  )
}

function Section({ title, accent, children }) {
  const accentColors = {
    primary: 'text-primary',
    warning: 'text-warning',
    danger: 'text-danger',
    default: 'text-text-secondary',
  }

  return (
    <div className="mb-5">
      <h2 className={`text-xs font-bold uppercase tracking-wider mb-2 ${accentColors[accent] || accentColors.default}`}>
        {title}
      </h2>
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        {children}
      </div>
    </div>
  )
}
