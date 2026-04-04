import { create } from 'zustand'
import { generateWorkout } from '../utils/workoutGenerator.js'

const STORAGE_KEYS = {
  USER: 'fotf_user',
  WORKOUTS: 'fotf_workouts',
  SETTINGS: 'fotf_settings',
  ACTIVE_SESSION: 'fotf_active_session',
  EXERCISE_LOGS: 'fotf_exercise_logs',
}

function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

function today() {
  return new Date().toISOString().split('T')[0]
}

function countStreak(workouts) {
  const sorted = [...workouts]
    .filter(w => w.status === 'completed')
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  if (sorted.length === 0) return 0

  let streak = 0
  let checkDate = new Date()
  checkDate.setHours(0, 0, 0, 0)

  for (const w of sorted) {
    const wDate = new Date(w.date)
    wDate.setHours(0, 0, 0, 0)
    const diffDays = Math.round((checkDate - wDate) / (1000 * 60 * 60 * 24))
    if (diffDays === 0 || diffDays === 1) {
      streak++
      checkDate.setDate(checkDate.getDate() - 1)
    } else {
      break
    }
  }
  return streak
}

function workoutsThisWeek(workouts) {
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  return workouts.filter(w => {
    const d = new Date(w.date)
    return w.status === 'completed' && d >= startOfWeek
  }).length
}

function resumeSessionFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION)
    if (!raw) return null
    const session = JSON.parse(raw)
    if (session.workout && (session.workout.status === 'completed' || session.workout.status === 'skipped')) {
      try { localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION) } catch {}
      return null
    }
    return session
  } catch {
    return null
  }
}

// ─── Exercise log helpers ─────────────────────────────────────────────────────
// exerciseLogs: { [workoutId]: { [exerciseId]: { sets: [{ weight, reps, completed }] } } }
function loadExerciseLogs() {
  return loadFromStorage(STORAGE_KEYS.EXERCISE_LOGS, {})
}

export const useStore = create((set, get) => ({
  // ─── User ────────────────────────────────────────────────────────────────
  user: loadFromStorage(STORAGE_KEYS.USER, null),

  setUser: (userData) => {
    const user = {
      ...userData,
      id: userData.id || crypto.randomUUID(),
      createdAt: userData.createdAt || new Date().toISOString(),
    }
    saveToStorage(STORAGE_KEYS.USER, user)
    set({ user })
  },

  updateUser: (updates) => {
    const current = get().user
    if (!current) return
    const updated = { ...current, ...updates }
    saveToStorage(STORAGE_KEYS.USER, updated)
    set({ user: updated })
  },

  isOnboarded: () => !!get().user,

  // ─── Workouts ───────────────────────────────────────────────────────────
  workouts: loadFromStorage(STORAGE_KEYS.WORKOUTS, []),

  addWorkout: (workoutData) => {
    const workout = {
      ...workoutData,
      id: workoutData.id || crypto.randomUUID(),
      date: workoutData.date || today(),
      status: 'generated',
      note: null,
      completedAt: null,
    }
    const workouts = [workout, ...get().workouts]
    saveToStorage(STORAGE_KEYS.WORKOUTS, workouts)
    set({ workouts, currentWorkout: workout })
    return workout
  },

  logWorkout: (workoutId, status, note = null) => {
    const workouts = get().workouts.map(w => {
      if (w.id !== workoutId) return w
      return {
        ...w,
        status,
        note,
        completedAt: status === 'completed' ? new Date().toISOString() : null,
      }
    })
    saveToStorage(STORAGE_KEYS.WORKOUTS, workouts)
    set({ workouts })
  },

  // ─── Exercise Logs ──────────────────────────────────────────────────────
  exerciseLogs: loadExerciseLogs(),

  // Log a specific set for an exercise within a workout
  // setData: { weight, reps, completed }
  logExerciseSet: (workoutId, exerciseId, setIndex, setData) => {
    const logs = { ...get().exerciseLogs }
    if (!logs[workoutId]) logs[workoutId] = {}
    if (!logs[workoutId][exerciseId]) {
      logs[workoutId][exerciseId] = { sets: [] }
    }
    const workoutLogs = logs[workoutId][exerciseId]
    // Ensure array is long enough
    while (workoutLogs.sets.length <= setIndex) {
      workoutLogs.sets.push({ weight: null, reps: null, completed: false })
    }
    workoutLogs.sets[setIndex] = { ...workoutLogs.sets[setIndex], ...setData }
    saveToStorage(STORAGE_KEYS.EXERCISE_LOGS, logs)
    set({ exerciseLogs: logs })
  },

  // Get the log for a specific exercise in a workout
  getExerciseLog: (workoutId, exerciseId) => {
    return get().exerciseLogs?.[workoutId]?.[exerciseId] || null
  },

  // Get all logs for a workout
  getWorkoutLogs: (workoutId) => {
    return get().exerciseLogs?.[workoutId] || {}
  },

  // Get last performance for an exercise across all workouts (for progression)
  getLastPerformance: (exerciseId) => {
    const logs = get().exerciseLogs
    const workouts = get().workouts

    for (const workout of workouts) {
      if (workout.status !== 'completed') continue
      const exerciseLog = logs?.[workout.id]?.[exerciseId]
      if (exerciseLog && exerciseLog.sets) {
        const completedSets = exerciseLog.sets.filter(s => s.completed)
        if (completedSets.length > 0) {
          const bestWeight = Math.max(...completedSets.map(s => s.weight || 0))
          const bestReps = Math.max(...completedSets.filter(s => s.weight === bestWeight).map(s => s.reps || 0))
          return { weight: bestWeight, reps: bestReps, date: workout.date }
        }
      }
    }
    return null
  },

  // ─── Stats ───────────────────────────────────────────────────────────────
  getStreak: () => countStreak(get().workouts),
  getWorkoutsThisWeek: () => workoutsThisWeek(get().workouts),
  getTotalWorkouts: () => get().workouts.filter(w => w.status === 'completed').length,

  getRecentWorkouts: (limit = 10) => {
    return [...get().workouts]
      .filter(w => w.status !== 'generated')
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit)
  },

  // ─── Generate today ─────────────────────────────────────────────────────
  currentWorkout: null,

  generateTodayWorkout: ({ timeAvailable, equipment, energy }) => {
    const user = get().user
    if (!user) return null

    const generated = generateWorkout({
      timeAvailable,
      equipment,
      energy,
      fitnessLevel: user.fitnessLevel,
      goal: user.goal,
      workouts: get().workouts,
    })

    const workout = {
      id: crypto.randomUUID(),
      date: today(),
      timeAvailable,
      equipment,
      energy,
      generatedWorkout: generated,
      status: 'generated',
      note: null,
      completedAt: null,
    }

    const workouts = [workout, ...get().workouts]
    saveToStorage(STORAGE_KEYS.WORKOUTS, workouts)
    set({ workouts, currentWorkout: workout })
    return workout
  },

  clearCurrentWorkout: () => set({ currentWorkout: null }),

  // ─── Active Session ──────────────────────────────────────────────────────
  activeSession: resumeSessionFromStorage(),

  startWorkout: (workoutId) => {
    const session = {
      workoutId,
      startedAt: new Date().toISOString(),
      elapsedSeconds: 0,
      completedExerciseIds: [],
      currentExerciseIndex: 0,
      inProgressNote: '',
    }
    saveToStorage(STORAGE_KEYS.ACTIVE_SESSION, session)
    set({ activeSession: session })
  },

  tickTimer: (seconds) => {
    const session = get().activeSession
    if (!session) return
    const updated = { ...session, elapsedSeconds: seconds }
    saveToStorage(STORAGE_KEYS.ACTIVE_SESSION, updated)
    set({ activeSession: updated })
  },

  completeExercise: (exerciseId) => {
    const session = get().activeSession
    if (!session) return
    if (!session.completedExerciseIds.includes(exerciseId)) {
      const updated = {
        ...session,
        completedExerciseIds: [...session.completedExerciseIds, exerciseId],
        currentExerciseIndex: session.currentExerciseIndex + 1,
      }
      saveToStorage(STORAGE_KEYS.ACTIVE_SESSION, updated)
      set({ activeSession: updated })
    }
  },

  setCurrentExerciseIndex: (index) => {
    const session = get().activeSession
    if (!session) return
    const updated = { ...session, currentExerciseIndex: index }
    saveToStorage(STORAGE_KEYS.ACTIVE_SESSION, updated)
    set({ activeSession: updated })
  },

  updateSessionNote: (note) => {
    const session = get().activeSession
    if (!session) return
    const updated = { ...session, inProgressNote: note }
    saveToStorage(STORAGE_KEYS.ACTIVE_SESSION, updated)
    set({ activeSession: updated })
  },

  finishWorkout: (workoutId, status, note = null) => {
    const workouts = get().workouts.map(w => {
      if (w.id !== workoutId) return w
      return {
        ...w,
        status,
        note: note || get().activeSession?.inProgressNote || null,
        completedAt: status === 'completed' ? new Date().toISOString() : null,
      }
    })
    saveToStorage(STORAGE_KEYS.WORKOUTS, workouts)
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION)
    set({ workouts, activeSession: null, currentWorkout: null })
  },

  abandonSession: () => {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION)
    set({ activeSession: null })
  },

  // ─── Settings ───────────────────────────────────────────────────────────
  settings: loadFromStorage(STORAGE_KEYS.SETTINGS, {
    reminderEnabled: false,
    reminderTime: '07:00',
  }),

  updateSettings: (updates) => {
    const settings = { ...get().settings, ...updates }
    saveToStorage(STORAGE_KEYS.SETTINGS, settings)
    set({ settings })
  },

  // ─── Reset ───────────────────────────────────────────────────────────────
  resetAllData: () => {
    localStorage.removeItem(STORAGE_KEYS.USER)
    localStorage.removeItem(STORAGE_KEYS.WORKOUTS)
    localStorage.removeItem(STORAGE_KEYS.SETTINGS)
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION)
    localStorage.removeItem(STORAGE_KEYS.EXERCISE_LOGS)
    set({
      user: null,
      workouts: [],
      currentWorkout: null,
      activeSession: null,
      exerciseLogs: {},
      settings: { reminderEnabled: false, reminderTime: '07:00' },
    })
  },
}))
