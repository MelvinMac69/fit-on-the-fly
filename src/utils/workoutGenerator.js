import {
  EXERCISES,
  WARMUP_POOL,
  COOLDOWN_POOL,
  FINISHER_POOL,
  EQUIPMENT_TYPES,
} from '../data/exercises.js'

// Equipment hierarchy (what's available at each level)
const EQUIPMENT_HIERARCHY = {
  [EQUIPMENT_TYPES.NONE]: ['none'],
  [EQUIPMENT_TYPES.BODYWEIGHT]: ['none', 'bodyweight'],
  [EQUIPMENT_TYPES.DUMBBELLS]: ['none', 'bodyweight', 'dumbbells'],
  [EQUIPMENT_TYPES.HOTEL_GYM]: ['none', 'bodyweight', 'dumbbells', 'hotel_gym'],
  [EQUIPMENT_TYPES.FULL_GYM]: ['none', 'bodyweight', 'dumbbells', 'hotel_gym', 'full_gym'],
}

// Time breakpoints → how many main exercises + set structure
const TIME_CONFIG = {
  10: { exerciseCount: 2, sets: 2, rest: 30 },
  20: { exerciseCount: 3, sets: 2, rest: 45 },
  30: { exerciseCount: 4, sets: 3, rest: 60 },
  45: { exerciseCount: 5, sets: 3, rest: 60 },
  60: { exerciseCount: 6, sets: 4, rest: 75 },
}

// Energy adjustments to reps/sets
const ENERGY_ADJUST = {
  low: { repMult: 0.7, setMult: 0.8, intensity: 0.7 },
  medium: { repMult: 1.0, setMult: 1.0, intensity: 1.0 },
  high: { repMult: 1.15, setMult: 1.0, intensity: 1.1 },
}

// Goal-based exercise type bias
const GOAL_BIAS = {
  fat_loss: ['conditioning', 'strength', 'mixed'],
  muscle_gain: ['strength', 'mixed', 'conditioning'],
  maintain: ['mixed', 'strength', 'conditioning'],
  general_health: ['mixed', 'conditioning', 'strength'],
}

// Muscle group rotation for balanced workouts
const MUSCLE_GROUPS = ['chest', 'back', 'shoulders', 'quads', 'hamstrings', 'core']

// Track recently used exercises (avoid back-to-back repetition)
const recentExerciseIds = []

function pickExercises(equipment, fitnessLevel, goal, timeAvailable, count) {
  const allowedEquipment = EQUIPMENT_HIERARCHY[equipment] || EQUIPMENT_HIERARCHY[EQUIPMENT_TYPES.FULL_GYM]
  const bias = GOAL_BIAS[goal] || GOAL_BIAS.maintain

  // Filter exercises
  let candidates = EXERCISES.filter(ex =>
    ex.equipment.some(eq => allowedEquipment.includes(eq)) &&
    ex.difficulty.includes(fitnessLevel)
  )

  // Score by goal bias
  candidates = candidates.map(ex => {
    let score = bias.indexOf(ex.type) * 10
    // Penalize recently used
    if (recentExerciseIds.includes(ex.id)) score -= 50
    return { ...ex, _score: score }
  })

  // Sort by score (higher = better match)
  candidates.sort((a, b) => b._score - a._score)

  // Pick from top candidates, cycling through muscle groups
  const picked = []
  let muscleGroupIndex = 0

  for (let i = 0; i < count && candidates.length > 0; i++) {
    // Find best candidate that covers next muscle group, or just take top
    const idx = candidates.findIndex(ex =>
      !picked.includes(ex.id) &&
      (ex.muscleGroups.includes(MUSCLE_GROUPS[muscleGroupIndex % MUSCLE_GROUPS.length]) ||
       ex.muscleGroups.includes('full_body') ||
       ex.muscleGroups.includes('cardiovascular'))
    )
    const useIdx = idx !== -1 ? idx : 0
    const exercise = candidates[useIdx]
    picked.push(exercise)
    candidates.splice(useIdx, 1)
    muscleGroupIndex++
  }

  // If we don't have enough, fill with any valid exercises
  while (picked.length < count && candidates.length > 0) {
    const idx = candidates.findIndex(ex => !picked.includes(ex.id))
    if (idx === -1) break
    picked.push(candidates[idx])
    candidates.splice(idx, 1)
  }

  // Track recent
  picked.forEach(ex => {
    if (!recentExerciseIds.includes(ex.id)) {
      recentExerciseIds.push(ex.id)
      if (recentExerciseIds.length > 12) recentExerciseIds.shift()
    }
  })

  return picked
}

function buildExercise(exercise, energy, timeConfig) {
  const adj = ENERGY_ADJUST[energy] || ENERGY_ADJUST.medium
  const isTimeBased = exercise.defaultDuration !== undefined
  const isRepBased = exercise.defaultReps !== undefined

  let sets, reps, duration, rest

  if (isRepBased) {
    const baseReps = exercise.defaultReps[energy === 'low' ? 'beginner' : energy === 'medium' ? 'intermediate' : 'advanced']
    reps = Math.round(baseReps * adj.repMult)
    sets = Math.max(1, Math.round(timeConfig.sets * adj.setMult))
  } else if (isTimeBased) {
    duration = exercise.defaultDuration[energy === 'low' ? 'beginner' : energy === 'medium' ? 'intermediate' : 'advanced']
    sets = 1
    reps = null
  }

  rest = timeConfig.rest

  return {
    id: exercise.id,
    name: exercise.name,
    sets,
    reps: reps || null,
    duration: duration || null,
    rest,
    tip: exercise.tip,
    equipment: exercise.equipment[0],
  }
}

function pickWarmup(equipment) {
  const allowedEquipment = EQUIPMENT_HIERARCHY[equipment] || ['none']
  const candidates = WARMUP_POOL.filter(w =>
    w.equipment.some(eq => allowedEquipment.includes(eq))
  )
  // Pick 3-4 warmups
  const count = 3
  const picked = []
  for (let i = 0; i < count && candidates.length > 0; i++) {
    const idx = Math.floor(Math.random() * candidates.length)
    picked.push(candidates[idx])
    candidates.splice(idx, 1)
  }
  return picked.map(w => ({
    id: w.id,
    name: w.name,
    sets: 1,
    reps: null,
    duration: w.defaultDuration,
    rest: 0,
    tip: w.tip,
    equipment: 'none',
  }))
}

function pickCooldown(equipment) {
  const allowedEquipment = EQUIPMENT_HIERARCHY[equipment] || ['none']
  const candidates = COOLDOWN_POOL.filter(c =>
    c.equipment.some(eq => allowedEquipment.includes(eq))
  )
  const count = 2
  const picked = []
  for (let i = 0; i < count && candidates.length > 0; i++) {
    const idx = Math.floor(Math.random() * candidates.length)
    picked.push(candidates[idx])
    candidates.splice(idx, 1)
  }
  return picked.map(c => ({
    id: c.id,
    name: c.name,
    sets: 1,
    reps: null,
    duration: c.defaultDuration,
    rest: 0,
    tip: c.tip,
    equipment: 'none',
  }))
}

function maybeAddFinisher(equipment, energy, timeAvailable) {
  // Only if time allows and energy is medium/high
  if (timeAvailable < 20 || energy === 'low') return null

  const allowedEquipment = EQUIPMENT_HIERARCHY[equipment] || ['none']
  const candidates = FINISHER_POOL.filter(f =>
    f.equipment.some(eq => allowedEquipment.includes(eq))
  )
  if (candidates.length === 0) return null

  const finisher = candidates[Math.floor(Math.random() * candidates.length)]
  const isTimeBased = finisher.defaultDuration !== undefined

  if (isTimeBased) {
    return {
      id: finisher.id,
      name: finisher.name,
      sets: 1,
      reps: null,
      duration: finisher.defaultDuration[energy] || 20,
      rest: 0,
      tip: finisher.type === 'conditioning' ? 'Go hard. Short burst.' : finisher.tip,
      equipment: 'none',
    }
  } else {
    return {
      id: finisher.id,
      name: finisher.name,
      sets: 1,
      reps: finisher.defaultReps[energy] || 8,
      duration: null,
      rest: 0,
      tip: finisher.tip,
      equipment: 'none',
    }
  }
}

function generateWorkoutName(equipment, energy, timeAvailable, goal) {
  const equipmentNames = {
    [EQUIPMENT_TYPES.NONE]: 'No-Equipment',
    [EQUIPMENT_TYPES.BODYWEIGHT]: 'Bodyweight',
    [EQUIPMENT_TYPES.DUMBBELLS]: 'Dumbbell',
    [EQUIPMENT_TYPES.HOTEL_GYM]: 'Hotel Gym',
    [EQUIPMENT_TYPES.FULL_GYM]: 'Full Gym',
  }

  const energyNames = {
    low: 'Light',
    medium: 'Steady',
    high: 'Intense',
  }

  const timeNames = {
    10: 'Quick 10',
    20: 'Express',
    30: 'Standard',
    45: 'Extended',
    60: 'Full Session',
  }

  const eq = equipmentNames[equipment] || 'Travel'
  const en = energyNames[energy] || 'Standard'
  const tm = timeNames[timeAvailable] || `${timeAvailable} Min`

  return `${tm} ${en} ${eq} Workout`
}

export function generateWorkout({ timeAvailable, equipment, energy, fitnessLevel, goal }) {
  const timeConfig = TIME_CONFIG[timeAvailable] || TIME_CONFIG[30]
  const exerciseCount = timeConfig.exerciseCount

  const exercisePool = pickExercises(equipment, fitnessLevel, goal, timeAvailable, exerciseCount)
  const mainWorkout = exercisePool.map(ex => buildExercise(ex, energy, timeConfig))
  const warmup = pickWarmup(equipment)
  const cooldown = pickCooldown(equipment)
  const finisher = maybeAddFinisher(equipment, energy, timeAvailable)

  // Estimate total time: warmup time + (exercises * sets * (work + rest)) + finisher + cooldown
  const warmupTime = warmup.reduce((sum, w) => sum + (w.duration || 30), 0)
  const mainTime = mainWorkout.reduce((sum, ex) => {
    const workTime = ex.duration || (ex.reps * 3) // ~3 sec per rep estimate
    const restTime = ex.rest * (ex.sets - 1)
    return sum + (workTime * ex.sets) + restTime
  }, 0)
  const finisherTime = finisher ? (finisher.duration || finisher.reps * 3) : 0
  const cooldownTime = cooldown.reduce((sum, c) => sum + (c.duration || 30), 0)
  const estimatedMinutes = Math.ceil((warmupTime + mainTime + finisherTime + cooldownTime) / 60)

  return {
    name: generateWorkoutName(equipment, energy, timeAvailable, goal),
    warmup,
    main: mainWorkout,
    finisher,
    cooldown,
    estimatedMinutes,
  }
}

export function resetWorkoutGenerator() {
  recentExerciseIds.length = 0
}
