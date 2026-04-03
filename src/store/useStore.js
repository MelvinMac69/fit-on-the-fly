import { create } from 'zustand'
import { generateWorkout } from '../utils/workoutGenerator.js'

const STORAGE_KEYS = {
  USER: 'fotf_user',
  WORKOUTS: 'fotf_workouts',
  SETTINGS: 'fotf_settings',
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
  } catch {
    // storage full or unavailable
  }
}

const today = () => new Date().toISOString().split('T')[0]

function countStreak(workouts) {
  const sorted = [...workouts]
    .filter(w => w.status === 'completed')
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  if (sorted.length === 0) return 0

  let streak = 0
  let checkDate = new Date(today())
  checkDate.setHours(0, 0, 0, 0)

  for (const w of sorted) {
    const wDate = new Date(w.date)
    wDate.setHours(0, 0, 0, 0)
    const diffDays = Math.round((checkDate - wDate) / (1000 * 60 * 60 * 24))

    if (diffDays === 0 || diffDays === 1) {
      streak++
      checkDate = wDate
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

export const useStore = create((set, get) => ({
  // === User ===
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

  // === Workouts ===
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

  getCurrentWorkout: () => get().currentWorkout || null,

  // === Current Workout (in-session) ===
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

  // === Stats ===
  getStreak: () => countStreak(get().workouts),
  getWorkoutsThisWeek: () => workoutsThisWeek(get().workouts),
  getTotalWorkouts: () => get().workouts.filter(w => w.status === 'completed').length,

  getRecentWorkouts: (limit = 10) => {
    return [...get().workouts]
      .filter(w => w.status !== 'generated')
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit)
  },

  // === Settings ===
  settings: loadFromStorage(STORAGE_KEYS.SETTINGS, {
    reminderEnabled: false,
    reminderTime: '07:00',
  }),

  updateSettings: (updates) => {
    const settings = { ...get().settings, ...updates }
    saveToStorage(STORAGE_KEYS.SETTINGS, settings)
    set({ settings })
  },

  // === Reset ===
  resetAllData: () => {
    localStorage.removeItem(STORAGE_KEYS.USER)
    localStorage.removeItem(STORAGE_KEYS.WORKOUTS)
    localStorage.removeItem(STORAGE_KEYS.SETTINGS)
    set({ user: null, workouts: [], currentWorkout: null, settings: { reminderEnabled: false, reminderTime: '07:00' } })
  },
}))
