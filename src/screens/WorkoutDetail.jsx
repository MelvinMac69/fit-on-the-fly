import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { Badge } from '../components/Card.jsx'
import { Button } from '../components/Button.jsx'
import { ConfirmModal, NoteModal } from '../components/Modal.jsx'
import {
  Clock, Dumbbell, Zap, CheckCircle, SkipForward, MessageSquare,
  Play, Pause, Square, ChevronRight, Timer, Trophy,
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

// ─── Rest Timer Component ───────────────────────────────────────────────────────
function RestTimer({ restSeconds, onSkip, onRestart }) {
  const [remaining, setRemaining] = useState(restSeconds)
  const [isPaused, setIsPaused] = useState(false)
  const intervalRef = useRef(null)
  const startedAtRef = useRef(Date.now())
  const initialRef = useRef(restSeconds)

  useEffect(() => {
    setRemaining(restSeconds)
    initialRef.current = restSeconds
    startedAtRef.current = Date.now()
    setIsPaused(false)
    setRemaining(restSeconds)
  }, [restSeconds])

  useEffect(() => {
    if (isPaused) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000)
      const remaining = Math.max(0, initialRef.current - elapsed)
      setRemaining(remaining)
      if (remaining === 0) clearInterval(intervalRef.current)
    }, 250)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isPaused])

  const progress = initialRef.current > 0 ? ((initialRef.current - remaining) / initialRef.current) * 100 : 0
  const isDone = remaining === 0

  return (
    <div className="bg-primary/10 border border-primary/30 rounded-lg px-4 py-3 mb-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Timer size={14} className="text-primary" />
          <span className="text-xs font-medium text-primary uppercase tracking-wider">Rest</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPaused(p => !p)}
            className="w-7 h-7 rounded-full bg-surface border border-border flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
          >
            {isPaused ? <Play size={12} /> : <Pause size={12} />}
          </button>
          <button
            onClick={onRestart}
            className="text-xs text-text-muted hover:text-text-secondary transition-colors px-1"
          >
            +{initialRef.current}s
          </button>
          <button
            onClick={onSkip}
            className="text-xs text-text-muted hover:text-text-secondary transition-colors px-1"
          >
            Skip
          </button>
        </div>
      </div>

      {/* Timer display */}
      <div className="flex items-center gap-3">
        <div className="text-2xl font-mono font-bold text-text-primary tabular-nums">
          {isDone ? 'GO!' : formatTime(remaining)}
        </div>
        <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-250 ${isDone ? 'bg-success' : 'bg-primary'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Set Row Component ─────────────────────────────────────────────────────────
function SetRow({ setNumber, set, exercise, isActive, onComplete, onLog, lastPerformance }) {
  const [showInputs, setShowInputs] = useState(false)
  const [weight, setWeight] = useState(set.weight || '')
  const [reps, setReps] = useState(set.reps || '')
  const [completed, setCompleted] = useState(set.completed || false)

  const handleComplete = () => {
    const w = weight !== '' ? Number(weight) : null
    const r = reps !== '' ? Number(reps) : null
    setCompleted(true)
    onLog({ weight: w, reps: r, completed: true })
    onComplete()
  }

  return (
    <div className={`border-b border-border last:border-0 ${completed ? 'opacity-60' : ''}`}>
      <div className="flex items-center gap-3 py-2.5 px-1">
        {/* Set number */}
        <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
          completed
            ? 'bg-success border-success text-white'
            : 'border-border text-text-muted'
        }`}>
          {completed ? <CheckCircle size={14} /> : setNumber}
        </div>

        {/* Prescription */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-text-primary">
            {exercise.reps ? `${exercise.sets} × ${exercise.reps} reps` : `${exercise.sets} × ${exercise.duration}s`}
          </div>
          {lastPerformance && (
            <div className="text-xs text-text-muted mt-0.5">
              Last: {lastPerformance.weight}kg × {lastPerformance.reps}
            </div>
          )}
        </div>

        {/* Actions */}
        {!completed ? (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowInputs(s => !s)}
              className="text-xs text-text-muted hover:text-primary transition-colors px-2 py-1 border border-border rounded-md"
            >
              Log
            </button>
            <button
              onClick={handleComplete}
              className="w-8 h-8 rounded-full bg-success/20 text-success flex items-center justify-center hover:bg-success/30 transition-colors"
            >
              <CheckCircle size={14} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-success text-xs shrink-0">
            <CheckCircle size={12} />
            <span>{set.weight || '-'}kg × {set.reps || '-'}</span>
          </div>
        )}
      </div>

      {/* Log inputs */}
      {showInputs && !completed && (
        <div className="px-1 pb-3 grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-text-muted mb-1 block">Weight (kg)</label>
            <input
              type="number"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              placeholder={lastPerformance ? `Last: ${lastPerformance.weight}` : '0'}
              className="w-full bg-bg border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
              inputMode="decimal"
            />
          </div>
          <div>
            <label className="text-xs text-text-muted mb-1 block">Reps</label>
            <input
              type="number"
              value={reps}
              onChange={e => setReps(e.target.value)}
              placeholder={lastPerformance ? `Last: ${lastPerformance.reps}` : '0'}
              className="w-full bg-bg border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
              inputMode="numeric"
            />
          </div>
          <button
            onClick={handleComplete}
            className="col-span-2 w-full bg-success text-white rounded-md py-2 text-sm font-semibold hover:bg-success/90 transition-colors"
          >
            Done — Next Set
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Exercise Card Component ───────────────────────────────────────────────────
function ExerciseCard({ exercise, workoutId, isActive, onActivate, sectionTitle }) {
  const { logExerciseSet, getExerciseLog, getLastPerformance } = useStore()
  const [expanded, setExpanded] = useState(false)
  const [showRestTimer, setShowRestTimer] = useState(false)
  const [restSeconds, setRestSeconds] = useState(exercise.rest || 60)

  const log = getExerciseLog(workoutId, exercise.id)
  const sets = log?.sets || []
  const lastPerf = getLastPerformance(exercise.id)

  const handleSetComplete = useCallback((setIndex) => {
    logExerciseSet(workoutId, exercise.id, setIndex, { completed: true })
    setShowRestTimer(true)
    setRestSeconds(exercise.rest || 60)
    onActivate()
  }, [workoutId, exercise.id, logExerciseSet, exercise.rest, onActivate])

  const handleSetLog = useCallback((setIndex, data) => {
    logExerciseSet(workoutId, exercise.id, setIndex, data)
  }, [workoutId, exercise.id, logExerciseSet])

  const handleRestartTimer = () => {
    setRestSeconds(exercise.rest || 60)
    setShowRestTimer(true)
  }

  // Initialize sets array
  const setsArray = Array.from({ length: exercise.sets }, (_, i) =>
    sets[i] || { weight: null, reps: null, completed: false }
  )

  return (
    <div className={`bg-surface border rounded-lg overflow-hidden transition-colors ${isActive ? 'border-primary/50' : 'border-border'}`}>
      {/* Exercise header */}
      <button
        className="w-full flex items-center gap-3 p-4 text-left"
        onClick={() => { setExpanded(e => !e); onActivate() }}
      >
        <div className={`w-2 h-2 rounded-full shrink-0 ${isActive ? 'bg-primary' : 'bg-border'}`} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-text-primary">{exercise.name}</div>
          <div className="text-xs text-text-muted mt-0.5">
            {exercise.reps ? `${exercise.sets} sets × ${exercise.reps} reps` : `${exercise.sets} sets × ${exercise.duration}s`}
            {exercise.type && <span className="ml-1 capitalize">• {exercise.type}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Completed sets count */}
          <span className="text-xs text-text-muted">
            {setsArray.filter(s => s.completed).length}/{exercise.sets}
          </span>
          <ChevronRight className={`text-text-muted transition-transform ${expanded ? 'rotate-90' : ''}`} size={14} />
        </div>
      </button>

      {/* Rest timer */}
      {showRestTimer && (
        <RestTimer
          restSeconds={restSeconds}
          onSkip={() => setShowRestTimer(false)}
          onRestart={handleRestartTimer}
        />
      )}

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4">
          {/* Tip */}
          {exercise.tip && (
            <div className="bg-bg rounded-md px-3 py-2 mb-3 text-xs text-text-secondary leading-relaxed">
              💡 {exercise.tip}
            </div>
          )}

          {/* Last performance */}
          {lastPerf && (
            <div className="flex items-center gap-1.5 mb-3 text-xs text-text-muted">
              <Trophy size={10} className="text-warning" />
              <span>Previous best: {lastPerf.weight}kg × {lastPerf.reps} reps</span>
            </div>
          )}

          {/* Set rows */}
          {setsArray.map((set, i) => (
            <SetRow
              key={i}
              setNumber={i + 1}
              set={set}
              exercise={exercise}
              isActive={isActive}
              onComplete={() => handleSetComplete(i)}
              onLog={(data) => handleSetLog(i, data)}
              lastPerformance={lastPerf}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main WorkoutDetail ───────────────────────────────────────────────────────
export default function WorkoutDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const {
    workouts,
    activeSession,
    startWorkout,
    tickTimer,
    completeExercise,
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

  const isActive = activeSession?.workoutId === workout?.id
  const isCompleted = workout?.status === 'completed'
  const isSkipped = workout?.status === 'skipped'

  // Restore timer on mount
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
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [isRunning, isCompleted, isSkipped, tickTimer])

  const handleActivateExercise = useCallback((exerciseId) => {
    if (isActive) {
      completeExercise(exerciseId)
    }
  }, [isActive, completeExercise])

  const handleStartWorkout = () => {
    startWorkout(workout.id)
    setIsRunning(true)
  }

  const handlePauseResume = () => setIsRunning(r => !r)

  const handleFinishWorkout = () => {
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

  const { generatedWorkout, equipment, energy } = workout
  const { name, splitType, warmup, main, finisher, cooldown, estimatedMinutes } = generatedWorkout
  const energyBadge = ENERGY_BADGE[energy] || ENERGY_BADGE.medium

  const allExercises = [
    ...warmup.map((e, i) => ({ ...e, _key: `warmup-${i}`, _section: 'warmup' })),
    ...main.map((e, i) => ({ ...e, _key: `main-${i}`, _section: 'main' })),
    ...(finisher ? [{ ...finisher, _key: 'finisher-0', _section: 'finisher' }] : []),
    ...cooldown.map((e, i) => ({ ...e, _key: `cooldown-${i}`, _section: 'cooldown' })),
  ]

  const completedCount = isActive && activeSession
    ? allExercises.filter(e => activeSession.completedExerciseIds.includes(e.id)).length
    : 0
  const progress = allExercises.length > 0 ? Math.round((completedCount / allExercises.length) * 100) : 0

  return (
    <div className="min-h-screen bg-bg pb-32">
      {/* Sticky header */}
      <div className="bg-surface border-b border-border px-4 py-3 sticky top-0 z-20">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-1">
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

          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-base font-bold text-text-primary leading-tight">{name}</h1>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                {splitType && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary font-medium capitalize">
                    {splitType}
                  </span>
                )}
                <Badge variant="default"><Clock className="inline mr-1" size={10} />~{estimatedMinutes} min</Badge>
                <Badge variant="default" className="capitalize"><Dumbbell className="inline mr-1" size={10} />{equipment.replace('_', ' ')}</Badge>
                <Badge variant={energyBadge.variant}><Zap className="inline mr-1" size={10} />{energyBadge.label}</Badge>
              </div>
            </div>

            {/* Elapsed timer */}
            <div className="flex items-center gap-1.5 bg-bg border border-border rounded-md px-2.5 py-1.5 shrink-0">
              <Timer size={12} className="text-primary" />
              <span className="text-sm font-mono font-bold text-text-primary tabular-nums">
                {formatTime(elapsed)}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          {isActive && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-text-muted mb-1">
                <span>{completedCount}/{allExercises.length} exercises</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 bg-border rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        {/* Warmup */}
        {warmup.length > 0 && (
          <Section title="🔥 Warm-Up">
            {warmup.map((ex, i) => (
              <ExerciseCard
                key={`warmup-${i}`}
                exercise={ex}
                workoutId={workout.id}
                isActive={isActive && activeSession?.completedExerciseIds.includes(ex.id)}
                onActivate={() => handleActivateExercise(ex.id)}
                sectionTitle="warmup"
              />
            ))}
          </Section>
        )}

        {/* Main Workout */}
        <Section title="💪 Main Workout">
          {main.map((ex, i) => (
            <ExerciseCard
              key={`main-${i}`}
              exercise={ex}
              workoutId={workout.id}
              isActive={isActive && activeSession?.completedExerciseIds.includes(ex.id)}
              onActivate={() => handleActivateExercise(ex.id)}
              sectionTitle="main"
            />
          ))}
        </Section>

        {/* Finisher */}
        {finisher && (
          <Section title="⚡ Finisher">
            <ExerciseCard
              exercise={finisher}
              workoutId={workout.id}
              isActive={isActive && activeSession?.completedExerciseIds.includes(finisher.id)}
              onActivate={() => handleActivateExercise(finisher.id)}
              sectionTitle="finisher"
            />
          </Section>
        )}

        {/* Cooldown */}
        {cooldown.length > 0 && (
          <Section title="🧘 Cooldown">
            {cooldown.map((ex, i) => (
              <ExerciseCard
                key={`cooldown-${i}`}
                exercise={ex}
                workoutId={workout.id}
                isActive={isActive && activeSession?.completedExerciseIds.includes(ex.id)}
                onActivate={() => handleActivateExercise(ex.id)}
                sectionTitle="cooldown"
              />
            ))}
          </Section>
        )}

        {/* Session note */}
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

          {/* Pre-start */}
          {workout.status === 'generated' && !isActive && (
            <div className="space-y-3">
              <Button size="lg" className="w-full" onClick={handleStartWorkout}>
                <Play className="mr-2" size={18} /> Start Workout
              </Button>
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => setShowSkipConfirm(true)}>
                  <SkipForward className="mr-2" size={16} /> Skip
                </Button>
                <Button variant="ghost" className="flex-1" onClick={() => setShowNote(true)}>
                  <MessageSquare className="mr-2" size={16} /> Note
                </Button>
              </div>
            </div>
          )}

          {/* Active session */}
          {isActive && (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-surface border border-border rounded-lg px-4 py-3">
                <div>
                  <div className="text-sm font-medium text-text-primary">Session in progress</div>
                  <div className="text-xs text-text-muted">
                    {formatTimeVerbose(elapsed)} elapsed • {completedCount}/{allExercises.length} exercises
                  </div>
                </div>
                <button
                  onClick={() => setShowAbandonConfirm(true)}
                  className="text-xs text-text-muted hover:text-danger transition-colors"
                >
                  Abandon
                </button>
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => setShowNote(true)}>
                  <MessageSquare className="mr-2" size={16} /> Note
                </Button>
                <Button className="flex-1" onClick={handleFinishWorkout}>
                  <CheckCircle className="mr-2" size={16} /> Finish Workout
                </Button>
              </div>
            </div>
          )}

          {/* Completed / Skipped */}
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
      <ConfirmModal isOpen={showSkipConfirm} onConfirm={handleSkip} onCancel={() => setShowSkipConfirm(false)} title="Skip this workout?" message="This will be logged as skipped. Sometimes rest is the right call." confirmLabel="Skip" />
      <ConfirmModal isOpen={showAbandonConfirm} onConfirm={handleAbandon} onCancel={() => setShowAbandonConfirm(false)} title="Abandon session?" message="Your progress will be lost. The workout won't be logged. Are you sure?" confirmLabel="Abandon" danger />
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="mb-5">
      <h2 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">{title}</h2>
      <div className="space-y-2">{children}</div>
    </div>
  )
}
