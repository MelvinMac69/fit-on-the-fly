import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { ExerciseRow } from '../components/ExerciseRow.jsx'
import { Badge } from '../components/Card.jsx'
import { Button } from '../components/Button.jsx'
import { NoteModal, ConfirmModal } from '../components/Modal.jsx'
import {
  Clock, Dumbbell, Zap, CheckCircle, SkipForward, MessageSquare,
  Play, Pause, Square, ChevronRight, Timer,
} from 'lucide-react'

const ENERGY_BADGE = {
  low: { label: 'Low Energy', variant: 'default' },
  medium: { label: 'Medium Energy', variant: 'primary' },
  high: { label: 'High Energy', variant: 'success' },
}

function formatTime(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${mins}:${String(secs).padStart(2, '0')}`
}

function formatTimeVerbose(totalSeconds) {
  const hrs = Math.floor(totalSeconds / 3600)
  const mins = Math.floor((totalSeconds % 3600) / 60)
  const secs = totalSeconds % 60
  if (hrs > 0) return `${hrs}h ${mins}m`
  if (mins > 0) return `${mins}m ${secs}s`
  return `${secs}s`
}

export default function WorkoutDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const {
    workouts,
    activeSession,
    startWorkout,
    tickTimer,
    completeExercise,
    setCurrentExerciseIndex,
    updateSessionNote,
    finishWorkout,
    abandonSession,
  } = useStore()

  const workout = workouts.find(w => w.id === id)
  const [expandedExercises, setExpandedExercises] = useState({})
  const [showNote, setShowNote] = useState(false)
  const [showSkipConfirm, setShowSkipConfirm] = useState(false)
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const timerRef = useRef(null)

  // Sync with active session
  const isActive = activeSession?.workoutId === workout?.id
  const isCompleted = workout?.status === 'completed'
  const isSkipped = workout?.status === 'skipped'

  // Restore timer state from session
  useEffect(() => {
    if (isActive && activeSession) {
      setElapsed(activeSession.elapsedSeconds)
      setIsRunning(true)
    }
  }, [isActive, activeSession])

  // Timer tick
  useEffect(() => {
    if (isRunning && !isCompleted && !isSkipped) {
      timerRef.current = setInterval(() => {
        setElapsed(prev => {
          const next = prev + 1
          tickTimer(next)
          return next
        })
      }, 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isRunning, isCompleted, isSkipped, tickTimer])

  // Restore on mount if there's an active session for this workout
  useEffect(() => {
    if (activeSession?.workoutId === id && !isRunning) {
      setElapsed(activeSession.elapsedSeconds)
      setIsRunning(true)
    }
  }, [id])

  const toggleExercise = useCallback((sectionKey, idx) => {
    const key = `${sectionKey}-${idx}`
    setExpandedExercises(prev => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const handleStartWorkout = () => {
    startWorkout(workout.id)
    setIsRunning(true)
  }

  const handlePauseResume = () => {
    setIsRunning(prev => !prev)
  }

  const handleEndSession = () => {
    setIsRunning(false)
    if (timerRef.current) clearInterval(timerRef.current)
    finishWorkout(workout.id, 'completed')
    navigate('/home')
  }

  const handleSkip = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setIsRunning(false)
    finishWorkout(workout.id, 'skipped')
    setShowSkipConfirm(false)
    navigate('/home')
  }

  const handleNoteSave = (noteText) => {
    if (isActive) {
      updateSessionNote(noteText)
    } else {
      finishWorkout(workout.id, isCompleted ? workout.status : 'completed', noteText)
    }
    setShowNote(false)
  }

  const handleAbandon = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    abandonSession()
    setShowAbandonConfirm(false)
    navigate('/home')
  }

  const handleExerciseToggle = (exerciseId) => {
    if (!isActive) return
    completeExercise(exerciseId)
  }

  const allExercises = workout?.generatedWorkout
    ? [
        ...workout.generatedWorkout.warmup.map((e, i) => ({ ...e, _key: `warmup-${i}`, _section: 'warmup' })),
        ...workout.generatedWorkout.main.map((e, i) => ({ ...e, _key: `main-${i}`, _section: 'main' })),
        ...(workout.generatedWorkout.finisher ? [{ ...workout.generatedWorkout.finisher, _key: 'finisher-0', _section: 'finisher' }] : []),
        ...workout.generatedWorkout.cooldown.map((e, i) => ({ ...e, _key: `cooldown-${i}`, _section: 'cooldown' })),
      ]
    : []

  const completedCount = isActive && activeSession
    ? allExercises.filter(e => activeSession.completedExerciseIds.includes(e.id)).length
    : 0

  const progress = allExercises.length > 0 ? Math.round((completedCount / allExercises.length) * 100) : 0

  if (!workout || !workout.generatedWorkout) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center px-6">
          <p className="text-text-secondary mb-4">Workout not found</p>
          <Button onClick={() => navigate('/home')}>Back to Home</Button>
        </div>
      </div>
    )
  }

  const { generatedWorkout, equipment, energy, timeAvailable } = workout
  const { name, warmup, main, finisher, cooldown, estimatedMinutes } = generatedWorkout
  const energyBadge = ENERGY_BADGE[energy] || ENERGY_BADGE.medium

  return (
    <div className="min-h-screen bg-bg pb-32">
      {/* Header */}
      <div className="bg-surface border-b border-border px-4 py-4 sticky top-0 z-20">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => navigate('/home')}
              className="text-text-muted text-sm hover:text-text-primary transition-colors flex items-center gap-1"
            >
              <ChevronRight className="rotate-180" size={14} /> Back
            </button>
            {isActive && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePauseResume}
                  className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary hover:bg-primary/30 transition-colors"
                >
                  {isRunning ? <Pause size={14} /> : <Play size={14} />}
                </button>
              </div>
            )}
          </div>

          <h1 className="text-lg font-bold text-text-primary leading-tight">{name}</h1>

          {/* Timer display */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2 flex-wrap">
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

            {/* Elapsed timer */}
            <div className="flex items-center gap-1.5 bg-bg border border-border rounded-md px-2.5 py-1">
              <Timer size={12} className="text-primary" />
              <span className="text-sm font-mono font-bold text-text-primary">
                {formatTime(elapsed)}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          {isActive && allExercises.length > 0 && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-text-muted mb-1">
                <span>{completedCount}/{allExercises.length} exercises</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
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
                completed={isActive && activeSession?.completedExerciseIds.includes(ex.id)}
                expanded={expandedExercises[`warmup-${i}`]}
                onToggle={() => isActive ? handleExerciseToggle(ex.id) : toggleExercise('warmup', i)}
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
              completed={isActive && activeSession?.completedExerciseIds.includes(ex.id)}
              expanded={expandedExercises[`main-${i}`]}
              onToggle={() => isActive ? handleExerciseToggle(ex.id) : toggleExercise('main', i)}
            />
          ))}
        </Section>

        {/* Finisher */}
        {finisher && (
          <Section title="⚡ Finisher" accent="danger">
            <ExerciseRow
              exercise={finisher}
              completed={isActive && activeSession?.completedExerciseIds.includes(finisher.id)}
              expanded={expandedExercises['finisher-0']}
              onToggle={() => isActive ? handleExerciseToggle(finisher.id) : toggleExercise('finisher', 0)}
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
                completed={isActive && activeSession?.completedExerciseIds.includes(ex.id)}
                expanded={expandedExercises[`cooldown-${i}`]}
                onToggle={() => isActive ? handleExerciseToggle(ex.id) : toggleExercise('cooldown', i)}
              />
            ))}
          </Section>
        )}

        {/* Workout note if completed */}
        {isCompleted && workout.note && (
          <div className="mt-4 px-3 py-3 bg-surface border border-border rounded-lg">
            <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Session Note</div>
            <p className="text-sm text-text-secondary italic">"{workout.note}"</p>
          </div>
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-bg border-t border-border p-4 z-30">
        <div className="max-w-lg mx-auto">
          {/* Pre-start state */}
          {workout.status === 'generated' && !isActive && (
            <div className="space-y-3">
              <Button size="lg" className="w-full" onClick={handleStartWorkout}>
                <Play className="mr-2" size={18} />
                Start Workout
              </Button>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowSkipConfirm(true)}
                >
                  <SkipForward className="mr-2" size={16} />
                  Skip
                </Button>
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={() => setShowNote(true)}
                >
                  <MessageSquare className="mr-2" size={16} />
                  Add Note
                </Button>
              </div>
            </div>
          )}

          {/* Active session state */}
          {isActive && (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-surface border border-border rounded-lg px-4 py-3">
                <div>
                  <div className="text-sm font-medium text-text-primary">
                    Session in progress
                  </div>
                  <div className="text-xs text-text-muted">
                    {formatTimeVerbose(elapsed)} elapsed • {completedCount}/{allExercises.length} exercises
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAbandonConfirm(true)}
                    className="text-xs text-text-muted hover:text-danger transition-colors"
                  >
                    Abandon
                  </button>
                </div>
              </div>
              <div className="flex gap-3">
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
                  onClick={handleEndSession}
                >
                  <CheckCircle className="mr-2" size={16} />
                  Finish Workout
                </Button>
              </div>
            </div>
          )}

          {/* Completed / Skipped state */}
          {(isCompleted || isSkipped) && !isActive && (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 py-3">
                {isCompleted ? (
                  <>
                    <CheckCircle size={20} className="text-success" />
                    <span className="text-success font-medium">Workout Complete</span>
                  </>
                ) : (
                  <>
                    <SkipForward size={20} className="text-text-muted" />
                    <span className="text-text-muted font-medium">Skipped</span>
                  </>
                )}
              </div>
              <Button size="lg" className="w-full" onClick={() => navigate('/home')}>
                Back to Home
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <NoteModal
        isOpen={showNote}
        onSave={handleNoteSave}
        onClose={() => setShowNote(false)}
        initialValue={isActive ? (activeSession?.inProgressNote || '') : (workout.note || '')}
      />

      <ConfirmModal
        isOpen={showSkipConfirm}
        onConfirm={handleSkip}
        onCancel={() => setShowSkipConfirm(false)}
        title="Skip this workout?"
        message="This will be logged as skipped. Sometimes rest is the right call."
        confirmLabel="Skip"
      />

      <ConfirmModal
        isOpen={showAbandonConfirm}
        onConfirm={handleAbandon}
        onCancel={() => setShowAbandonConfirm(false)}
        title="Abandon session?"
        message="Your progress will be lost. The workout won't be logged as completed. Are you sure?"
        confirmLabel="Abandon"
        danger
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
