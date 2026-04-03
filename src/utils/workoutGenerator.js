import {
  EXERCISES,
  WARMUP_POOL,
  COOLDOWN_POOL,
  FINISHER_POOL,
  EQUIPMENT_TYPES,
} from '../data/exercises.js'

// ─── Equipment hierarchy ───────────────────────────────────────────────────────
// full_gym: everything
// hotel_gym: no barbells, no hack squat; includes dumbbells, machines, cables
// dumbbells: dumbbells + bodyweight
// bodyweight: bodyweight only
// none: no equipment
const EQUIPMENT_HIERARCHY = {
  [EQUIPMENT_TYPES.NONE]: ['none'],
  [EQUIPMENT_TYPES.BODYWEIGHT]: ['none', 'bodyweight'],
  [EQUIPMENT_TYPES.DUMBBELLS]: ['none', 'bodyweight', 'dumbbells'],
  [EQUIPMENT_TYPES.HOTEL_GYM]: ['none', 'bodyweight', 'dumbbells', 'hotel_gym'],
  [EQUIPMENT_TYPES.FULL_GYM]: ['none', 'bodyweight', 'dumbbells', 'hotel_gym', 'full_gym'],
}

// ─── Equipment scoring ────────────────────────────────────────────────────────
// When user selects equipment X, exercises tagged exactly with X score highest.
// Each step down in hierarchy gets a lower bonus.
// full_gym (5): +100 for full_gym, +60 for hotel_gym, +30 for dumbbells, +10 for bodyweight, 0 for none
// hotel_gym (4): +100 for hotel_gym, +50 for dumbbells, +20 for bodyweight, 0 for none
// dumbbells (3): +100 for dumbbells, +40 for bodyweight, 0 for none
// bodyweight (2): +100 for bodyweight, +20 for none
// none (1): +100 for none
const EQUIPMENT_SCORE_BONUS = {
  [EQUIPMENT_TYPES.NONE]: { none: 100, bodyweight: 0, dumbbells: 0, hotel_gym: 0, full_gym: 0 },
  [EQUIPMENT_TYPES.BODYWEIGHT]: { none: 20, bodyweight: 100, dumbbells: 0, hotel_gym: 0, full_gym: 0 },
  [EQUIPMENT_TYPES.DUMBBELLS]: { none: 0, bodyweight: 40, dumbbells: 100, hotel_gym: 0, full_gym: 0 },
  [EQUIPMENT_TYPES.HOTEL_GYM]: { none: 0, bodyweight: 20, dumbbells: 50, hotel_gym: 100, full_gym: 0 },
  [EQUIPMENT_TYPES.FULL_GYM]: { none: 0, bodyweight: 10, dumbbells: 30, hotel_gym: 60, full_gym: 100 },
}

// ─── Muscle group tags ─────────────────────────────────────────────────────────
const PUSH_MUSCLES = new Set(['chest', 'shoulders', 'triceps'])
const PULL_MUSCLES = new Set(['back', 'biceps', 'upper_back'])
const LEGS_MUSCLES = new Set(['quads', 'hamstrings', 'glutes', 'calves'])
const CORE_MUSCLES = new Set(['core'])
const CARDIO_MUSCLES = new Set(['cardiovascular'])

function getMuscleCategory(muscleGroups) {
  const groups = new Set(muscleGroups)
  if ([...groups].every(g => CARDIO_MUSCLES.has(g))) return 'cardio'
  if ([...groups].some(g => PUSH_MUSCLES.has(g))) return 'push'
  if ([...groups].some(g => PULL_MUSCLES.has(g))) return 'pull'
  if ([...groups].some(g => LEGS_MUSCLES.has(g))) return 'legs'
  if ([...groups].some(g => CORE_MUSCLES.has(g))) return 'core'
  return 'full_body'
}

// ─── Training split ────────────────────────────────────────────────────────────
// Maps each split type to the muscle categories it should include
const SPLIT_MUSCLES = {
  push: ['push', 'core'],
  pull: ['pull', 'core'],
  legs: ['legs', 'core'],
  upper: ['push', 'pull', 'core'],
  full: ['push', 'pull', 'legs', 'core'],
  conditioning: ['cardio', 'core', 'legs'],
}

const GOAL_SPLITS = {
  fat_loss: ['full', 'conditioning', 'full', 'conditioning', 'full'],
  muscle_gain: ['push', 'pull', 'legs', 'push', 'pull'],
  maintain: ['upper', 'legs', 'full', 'upper', 'conditioning'],
  general_health: ['full', 'conditioning', 'full', 'upper', 'legs'],
}

// ─── Time config ───────────────────────────────────────────────────────────────
const TIME_CONFIG = {
  10: { exerciseCount: 2, sets: 2, rest: 30 },
  20: { exerciseCount: 3, sets: 2, rest: 45 },
  30: { exerciseCount: 4, sets: 3, rest: 60 },
  45: { exerciseCount: 5, sets: 3, rest: 60 },
  60: { exerciseCount: 6, sets: 4, rest: 75 },
}

const ENERGY_ADJUST = {
  low: { repMult: 0.7, setMult: 0.8, intensity: 0.7 },
  medium: { repMult: 1.0, setMult: 1.0, intensity: 1.0 },
  high: { repMult: 1.15, setMult: 1.0, intensity: 1.1 },
}

// ─── Recent exercise tracking ─────────────────────────────────────────────────
const recentExerciseIds = []
const recentSplitTypes = [] // last N workout split types

function getRecommendedSplit(workouts, goal) {
  const goalRotation = GOAL_SPLITS[goal] || GOAL_SPLITS.maintain

  // Find the most recent completed workout
  const completedWorkouts = workouts
    .filter(w => w.status === 'completed' && w.splitType)
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  const lastWorkout = completedWorkouts[0]
  const lastSplit = lastWorkout?.splitType || null

  if (!lastSplit) {
    // First workout — use the first rotation item
    return goalRotation[0]
  }

  // Find where lastSplit appears in rotation and pick the next one
  const lastIdx = goalRotation.indexOf(lastSplit)
  const nextIdx = (lastIdx + 1) % goalRotation.length
  const nextSplit = goalRotation[nextIdx]

  // If only 1 day has passed since last workout, don't repeat the same split
  if (lastWorkout && lastSplit === nextSplit) {
    return goalRotation[(lastIdx + 2) % goalRotation.length]
  }

  return nextSplit
}

// ─── Exercise selection ────────────────────────────────────────────────────────
function pickExercises(equipment, fitnessLevel, goal, timeAvailable, splitType, count) {
  const allowedEquipment = EQUIPMENT_HIERARCHY[equipment] || EQUIPMENT_HIERARCHY[EQUIPMENT_TYPES.FULL_GYM]
  const targetMuscles = SPLIT_MUSCLES[splitType] || SPLIT_MUSCLES.full
  const equipmentBonus = EQUIPMENT_SCORE_BONUS[equipment] || {}

  // Filter: exercise must be doable with available equipment and appropriate difficulty
  let candidates = EXERCISES.filter(ex =>
    ex.equipment.some(eq => allowedEquipment.includes(eq)) &&
    ex.difficulty.includes(fitnessLevel)
  )

  // Score each candidate
  candidates = candidates.map(ex => {
    let score = 0

    // 1. Equipment match bonus (strongest factor)
    const exactEquipment = ex.equipment[0] // primary equipment tag
    score += equipmentBonus[exactEquipment] || 0

    // 2. Split/muscle group match
    const muscleCat = getMuscleCategory(ex.muscleGroups)
    if (targetMuscles.includes(muscleCat)) {
      score += 50
    } else if (muscleCat === 'full_body') {
      score += 20
    }

    // 3. Penalize recently used exercises
    if (recentExerciseIds.includes(ex.id)) {
      score -= 60
    }

    // 4. Goal bias: strength type for muscle_gain, conditioning for fat_loss
    if (goal === 'muscle_gain' && ex.type === 'strength') score += 20
    if (goal === 'fat_loss' && ex.type === 'conditioning') score += 20

    return { ...ex, _score: score, _muscleCategory: muscleCat }
  })

  candidates.sort((a, b) => b._score - a._score)

  // Pick exercises, cycling through target muscle categories to ensure balance
  const picked = []
  let muscleIndex = 0

  for (let i = 0; i < count && candidates.length > 0; i++) {
    const target = targetMuscles[muscleIndex % targetMuscles.length]

    // Try to find a candidate matching the target muscle category
    let idx = candidates.findIndex(ex =>
      !picked.includes(ex.id) &&
      (ex._muscleCategory === target || ex._muscleCategory === 'full_body' || target === 'conditioning')
    )

    // Fallback: take the highest scoring remaining
    if (idx === -1) {
      idx = candidates.findIndex(ex => !picked.includes(ex.id))
    }

    if (idx === -1) break
    const exercise = candidates[idx]
    picked.push(exercise)
    candidates.splice(idx, 1)
    muscleIndex++
  }

  // Track recent
  picked.forEach(ex => {
    if (!recentExerciseIds.includes(ex.id)) {
      recentExerciseIds.push(ex.id)
      if (recentExerciseIds.length > 16) recentExerciseIds.shift()
    }
  })

  return picked
}

function buildExercise(exercise, energy, timeConfig) {
  const adj = ENERGY_ADJUST[energy] || ENERGY_ADJUST.medium
  const isTimeBased = exercise.defaultDuration !== undefined
  const isRepBased = exercise.defaultReps !== undefined

  let reps, rest

  if (isRepBased) {
    reps = Math.round((exercise.defaultReps[energy] || exercise.defaultReps.intermediate) * adj.repMult)
  }

  rest = timeConfig.rest

  return {
    id: exercise.id,
    name: exercise.name,
    sets: Math.max(1, Math.round(timeConfig.sets * adj.setMult)),
    reps: reps || null,
    duration: null,
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
      tip: 'Go hard. Short burst.',
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

function generateWorkoutName(equipment, splitType, timeAvailable) {
  const equipmentNames = {
    [EQUIPMENT_TYPES.NONE]: 'No-Equipment',
    [EQUIPMENT_TYPES.BODYWEIGHT]: 'Bodyweight',
    [EQUIPMENT_TYPES.DUMBBELLS]: 'Dumbbell',
    [EQUIPMENT_TYPES.HOTEL_GYM]: 'Hotel Gym',
    [EQUIPMENT_TYPES.FULL_GYM]: 'Full Gym',
  }

  const splitNames = {
    push: 'Push Day',
    pull: 'Pull Day',
    legs: 'Legs & Core',
    upper: 'Upper Body',
    full: 'Full Body',
    conditioning: 'Conditioning',
  }

  const timeNames = {
    10: 'Quick 10',
    20: 'Express',
    30: 'Standard',
    45: 'Extended',
    60: 'Full Session',
  }

  return `${timeNames[timeAvailable] || `${timeAvailable}min`} ${splitNames[splitType] || 'Workout'}`
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function generateWorkout({ timeAvailable, equipment, energy, fitnessLevel, goal, workouts = [] }) {
  const timeConfig = TIME_CONFIG[timeAvailable] || TIME_CONFIG[30]
  const exerciseCount = timeConfig.exerciseCount

  // Determine today's split based on recent history + goal
  const splitType = getRecommendedSplit(workouts, goal)

  const exercisePool = pickExercises(equipment, fitnessLevel, goal, timeAvailable, splitType, exerciseCount)
  const mainWorkout = exercisePool.map(ex => buildExercise(ex, energy, timeConfig))
  const warmup = pickWarmup(equipment)
  const cooldown = pickCooldown(equipment)
  const finisher = maybeAddFinisher(equipment, energy, timeAvailable)

  // Estimate total time
  const warmupTime = warmup.reduce((sum, w) => sum + (w.duration || 30), 0)
  const mainTime = mainWorkout.reduce((sum, ex) => {
    const workTime = ex.reps ? ex.reps * 3 : ex.duration || 0
    const restTime = ex.rest * (ex.sets - 1)
    return sum + (workTime * ex.sets) + restTime
  }, 0)
  const finisherTime = finisher ? (finisher.duration || finisher.reps * 3) : 0
  const cooldownTime = cooldown.reduce((sum, c) => sum + (c.duration || 30), 0)
  const estimatedMinutes = Math.ceil((warmupTime + mainTime + finisherTime + cooldownTime) / 60)

  // Track this split
  if (!recentSplitTypes.includes(splitType)) {
    recentSplitTypes.push(splitType)
    if (recentSplitTypes.length > 6) recentSplitTypes.shift()
  }

  return {
    name: generateWorkoutName(equipment, splitType, timeAvailable),
    splitType,
    warmup,
    main: mainWorkout,
    finisher,
    cooldown,
    estimatedMinutes,
  }
}

export function resetWorkoutGenerator() {
  recentExerciseIds.length = 0
  recentSplitTypes.length = 0
}
