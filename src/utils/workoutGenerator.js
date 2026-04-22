import {
  EXERCISES,
  WARMUP_POOL,
  COOLDOWN_POOL,
  FINISHER_POOL,
  EQUIPMENT_TYPES,
  getRestDuration,
} from '../data/exercises.js'

// ─── Equipment hierarchy ───────────────────────────────────────────────────────
const EQUIPMENT_HIERARCHY = {
  [EQUIPMENT_TYPES.NONE]: ['none'],
  [EQUIPMENT_TYPES.DUMBBELLS]: ['none', 'dumbbells'],
  [EQUIPMENT_TYPES.HOTEL_GYM]: ['none', 'dumbbells', 'hotel_gym'],
  [EQUIPMENT_TYPES.FULL_GYM]: ['none', 'dumbbells', 'hotel_gym', 'full_gym'],
}

// Equipment score bonus — exact match scores highest
// full_gym → +100 barbell/full, +60 hotel, +30 dumbbells, +10 none
const EQUIP_SCORE = {
  [EQUIPMENT_TYPES.NONE]: { none: 100, dumbbells: 0, hotel_gym: 0, full_gym: 0 },
  [EQUIPMENT_TYPES.DUMBBELLS]: { none: 20, dumbbells: 100, hotel_gym: 0, full_gym: 0 },
  [EQUIPMENT_TYPES.HOTEL_GYM]: { none: 10, dumbbells: 60, hotel_gym: 100, full_gym: 0 },
  [EQUIPMENT_TYPES.FULL_GYM]: { none: 5, dumbbells: 30, hotel_gym: 60, full_gym: 100 },
}

// ─── Muscle group categories ───────────────────────────────────────────────────
function getMuscleCategory(muscleGroups) {
  const groups = new Set(muscleGroups)
  if (groups.has('cardiovascular')) return 'cardio'
  if (groups.has('chest') || groups.has('shoulders') || groups.has('triceps')) return 'push'
  if (groups.has('back') || groups.has('biceps') || groups.has('upper_back')) return 'pull'
  if (groups.has('quads') || groups.has('hamstrings') || groups.has('glutes') || groups.has('calves')) return 'legs'
  if (groups.has('core') || groups.has('lower_back')) return 'core'
  return 'full_body'
}

// ─── Training split rotations ─────────────────────────────────────────────────
// These are ordered sequences — the app picks the next split in the rotation
// after each completed workout, and avoids back-to-back same-muscle sessions
const SPLIT_ROTATIONS = {
  // Fat loss: high frequency, full-body and conditioning, quick sessions
  fat_loss: {
    default: ['full', 'conditioning', 'full', 'conditioning', 'full'],
    equipment: {
      [EQUIPMENT_TYPES.NONE]: ['conditioning', 'full', 'conditioning'],
      [EQUIPMENT_TYPES.DUMBBELLS]: ['full', 'conditioning', 'full'],
      [EQUIPMENT_TYPES.HOTEL_GYM]: ['full', 'cardio', 'full', 'cardio'],
      [EQUIPMENT_TYPES.FULL_GYM]: ['push', 'pull', 'legs', 'conditioning'],
    },
  },
  // Muscle gain: traditional push/pull/legs split
  muscle_gain: {
    default: ['push', 'pull', 'legs', 'push', 'pull'],
    equipment: {
      [EQUIPMENT_TYPES.NONE]: ['full', 'full', 'conditioning'],
      [EQUIPMENT_TYPES.DUMBBELLS]: ['push', 'pull', 'legs', 'push'],
      [EQUIPMENT_TYPES.HOTEL_GYM]: ['push', 'pull', 'legs', 'push'],
      [EQUIPMENT_TYPES.FULL_GYM]: ['push', 'pull', 'legs', 'push', 'pull'],
    },
  },
  // Maintain: balanced
  maintain: {
    default: ['upper', 'legs', 'full', 'upper', 'conditioning'],
    equipment: {
      [EQUIPMENT_TYPES.NONE]: ['full', 'conditioning', 'full'],
      [EQUIPMENT_TYPES.DUMBBELLS]: ['upper', 'legs', 'full', 'upper'],
      [EQUIPMENT_TYPES.HOTEL_GYM]: ['upper', 'legs', 'full', 'cardio'],
      [EQUIPMENT_TYPES.FULL_GYM]: ['push', 'pull', 'legs', 'upper', 'full'],
    },
  },
  // General health: varied, accessible
  general_health: {
    default: ['full', 'conditioning', 'upper', 'legs', 'full'],
    equipment: {
      [EQUIPMENT_TYPES.NONE]: ['full', 'conditioning', 'full'],
      [EQUIPMENT_TYPES.DUMBBELLS]: ['full', 'upper', 'conditioning'],
      [EQUIPMENT_TYPES.HOTEL_GYM]: ['full', 'cardio', 'upper', 'legs'],
      [EQUIPMENT_TYPES.FULL_GYM]: ['push', 'pull', 'legs', 'full', 'conditioning'],
    },
  },
}

// Map split types to the muscle categories they exercise
const SPLIT_MUSCLES = {
  push: ['push', 'core'],
  pull: ['pull', 'core'],
  legs: ['legs', 'core'],
  upper: ['push', 'pull', 'core'],
  full: ['push', 'pull', 'legs', 'core'],
  conditioning: ['cardio', 'core', 'legs'],
}

// Split display names
const SPLIT_NAMES = {
  push: 'Push Day',
  pull: 'Pull Day',
  legs: 'Legs & Core',
  upper: 'Upper Body',
  full: 'Full Body',
  conditioning: 'Conditioning',
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

// ─── Smart split picker ───────────────────────────────────────────────────────
export function getNextSplit(workouts, goal, equipment) {
  const goalSplits = SPLIT_ROTATIONS[goal] || SPLIT_ROTATIONS.maintain
  // Use equipment-specific rotation if available
  const rotation = goalSplits.equipment?.[equipment] || goalSplits.default

  // Get last completed workout split type
  const completed = workouts
    .filter(w => w.status === 'completed' && w.generatedWorkout?.splitType)
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  const lastWorkout = completed[0]
  const lastSplit = lastWorkout?.generatedWorkout?.splitType || null

  // Check how many days since last workout
  let daysSince = 99
  if (lastWorkout?.date) {
    daysSince = Math.round((Date.now() - new Date(lastWorkout.date)) / (1000 * 60 * 60 * 24))
  }

  if (!lastSplit) {
    // First workout ever — start with 'full' or first rotation item
    return rotation[0]
  }

  // If more than 4 days missed, reset rotation to start fresh
  // This prevents forcing the user through a rigid cycle after a break
  if (daysSince > 4) {
    return rotation[0]
  }

  // Find last split position in rotation and advance
  const lastIdx = rotation.indexOf(lastSplit)
  if (lastIdx === -1) return rotation[0]

  const nextIdx = (lastIdx + 1) % rotation.length
  let nextSplit = rotation[nextIdx]

  // If we'd repeat the same split (only one item in rotation or odd-length)
  if (nextSplit === lastSplit) {
    nextSplit = rotation[(lastIdx + 2) % rotation.length]
  }

  // If the same muscle was hit yesterday (consecutive), skip to different one
  const lastMuscles = SPLIT_MUSCLES[lastSplit] || []
  const nextMuscles = SPLIT_MUSCLES[nextSplit] || []
  const overlap = lastMuscles.some(m => nextMuscles.includes(m))

  if (overlap && rotation.length > 1) {
    const altIdx = (lastIdx + 2) % rotation.length
    const altSplit = rotation[altIdx]
    if (altSplit !== lastSplit) nextSplit = altSplit
  }

  return nextSplit
}

// ─── Exercise selection ────────────────────────────────────────────────────────
const recentExerciseIds = []

function pickExercises(equipment, fitnessLevel, goal, timeAvailable, splitType, count, prevSameSplitExerciseIds = [], forcedExerciseIds = null) {
  const allowedEquipment = EQUIPMENT_HIERARCHY[equipment] || ['none']
  const targetMuscles = SPLIT_MUSCLES[splitType] || SPLIT_MUSCLES.full
  const eqScore = EQUIP_SCORE[equipment] || {}

  let candidates = EXERCISES.filter(ex =>
    ex.equipment.some(eq => allowedEquipment.includes(eq)) &&
    ex.difficulty.includes(fitnessLevel)
  )

  candidates = candidates.map(ex => {
    let score = 0

    // 1. Equipment match (strongest factor)
    const primaryEq = ex.equipment[0]
    score += eqScore[primaryEq] || 0

    // 2. Split/muscle group match
    const muscleCat = getMuscleCategory(ex.muscleGroups)
    if (targetMuscles.includes(muscleCat)) {
      score += 60
    } else if (muscleCat === 'full_body' || muscleCat === 'cardio') {
      score += 20
    }

    // 3. Strongly prefer exercises from the same split last time (carries forward weight/rep history)
    if (prevSameSplitExerciseIds.includes(ex.id)) {
      score += 500
    }

    // 4. Penalize recently used (only for exercises NOT from the same split)
    if (recentExerciseIds.includes(ex.id) && !prevSameSplitExerciseIds.includes(ex.id)) {
      score -= 70
    }

    // 5. Goal bias
    if (goal === 'muscle_gain' && ex.type === 'strength') score += 15
    if (goal === 'fat_loss' && ex.type === 'conditioning') score += 15

    return { ...ex, _score: score, _muscleCategory: muscleCat }
  })

  candidates.sort((a, b) => b._score - a._score)

  // Pick exercises, cycling through target muscle groups for balance
  const picked = []
  let muscleIdx = 0

  // When forcedExerciseIds is provided (from stored split pool), use ONLY those exercises
  // in the order specified, filtering by equipment/fitnessLevel compatibility
  if (forcedExerciseIds && forcedExerciseIds.length > 0) {
    const forcedSet = new Set(forcedExerciseIds)
    const forcedCandidates = candidates.filter(ex => forcedSet.has(ex.id))
    // Maintain the order from forcedExerciseIds
    forcedCandidates.sort((a, b) => forcedExerciseIds.indexOf(a.id) - forcedExerciseIds.indexOf(b.id))
    const compatibleForced = forcedCandidates.slice(0, count)
    if (compatibleForced.length > 0) {
      compatibleForced.forEach(ex => {
        picked.push(ex)
        candidates = candidates.filter(c => c.id !== ex.id)
      })
    }
    // If we don't have enough from forced pool, fill rest with normal logic
    if (picked.length < count) {
      const remainingCount = count - picked.length
      for (let i = 0; i < remainingCount && candidates.length > 0; i++) {
        const target = targetMuscles[muscleIdx % targetMuscles.length]
        const targetSet = new Set(targetMuscles)
        let idx = candidates.findIndex(ex =>
          !picked.map(p => p.id).includes(ex.id) &&
          (ex._muscleCategory === target || ex._muscleCategory === 'full_body' || targetSet.has('cardio'))
        )
        if (idx === -1) {
          idx = candidates.findIndex(ex => !picked.map(p => p.id).includes(ex.id))
        }
        if (idx === -1) break
        const exercise = candidates[idx]
        picked.push(exercise)
        candidates.splice(idx, 1)
        muscleIdx++
      }
    }
  } else {
    for (let i = 0; i < count && candidates.length > 0; i++) {
      const target = targetMuscles[muscleIdx % targetMuscles.length]
      const targetSet = new Set(targetMuscles)

      let idx = candidates.findIndex(ex =>
        !picked.includes(ex.id) &&
        (ex._muscleCategory === target || ex._muscleCategory === 'full_body' || targetSet.has('cardio'))
      )

      if (idx === -1) {
        idx = candidates.findIndex(ex => !picked.includes(ex.id))
      }
      if (idx === -1) break

      const exercise = candidates[idx]
      picked.push(exercise)
      candidates.splice(idx, 1)
      muscleIdx++
    }
  }

  picked.forEach(ex => {
    if (!recentExerciseIds.includes(ex.id)) {
      recentExerciseIds.push(ex.id)
      if (recentExerciseIds.length > 18) recentExerciseIds.shift()
    }
  })

  return picked
}

function buildExercise(exercise, energy, timeConfig, workoutGoal) {
  const adj = ENERGY_ADJUST[energy] || ENERGY_ADJUST.medium
  const isTimeBased = exercise.defaultDuration !== undefined
  const isRepBased = exercise.defaultReps !== undefined

  let reps
  if (isRepBased) {
    reps = Math.round((exercise.defaultReps[energy] || 10) * adj.repMult)
  }

  const rest = getRestDuration(exercise.id, exercise.type, energy)

  return {
    id: exercise.id,
    name: exercise.name,
    sets: Math.max(1, Math.round(timeConfig.sets * adj.setMult)),
    reps: reps || null,
    duration: null,
    rest,
    tip: exercise.tip,
    equipment: exercise.equipment[0],
    type: exercise.type,
  }
}

function pickWarmup(equipment) {
  const allowed = EQUIPMENT_HIERARCHY[equipment] || ['none']
  const candidates = WARMUP_POOL.filter(w =>
    w.equipment.some(eq => allowed.includes(eq))
  )
  const count = 3
  const picked = []
  const pool = [...candidates]
  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length)
    picked.push(pool[idx])
    pool.splice(idx, 1)
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
  const allowed = EQUIPMENT_HIERARCHY[equipment] || ['none']
  const candidates = COOLDOWN_POOL.filter(c =>
    c.equipment.some(eq => allowed.includes(eq))
  )
  const count = 2
  const picked = []
  const pool = [...candidates]
  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length)
    picked.push(pool[idx])
    pool.splice(idx, 1)
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

  const allowed = EQUIPMENT_HIERARCHY[equipment] || ['none']
  const candidates = FINISHER_POOL.filter(f =>
    f.equipment.some(eq => allowed.includes(eq))
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
  const timeNames = {
    10: 'Quick 10',
    20: 'Express',
    30: 'Standard',
    45: 'Extended',
    60: 'Full Session',
  }
  return `${timeNames[timeAvailable] || `${timeAvailable}min`} ${SPLIT_NAMES[splitType] || 'Workout'}`
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function generateWorkout({ timeAvailable, equipment, energy, fitnessLevel, goal, workouts = [], forcedExerciseIds = null, exerciseLogs = {}, exerciseSwaps = {} }) {
  const timeConfig = TIME_CONFIG[timeAvailable] || TIME_CONFIG[30]
  const exerciseCount = timeConfig.exerciseCount
  const splitType = getNextSplit(workouts, goal, equipment)

  // Find exercises from the most recent completed workout with the same split type
  // This ensures the same exercises are picked each week → weight/rep history carries forward
  const completedSameSplit = workouts
    .filter(w => w.status === 'completed' && w.generatedWorkout?.splitType === splitType)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
  const prevSameSplitExerciseIds = completedSameSplit[0]?.generatedWorkout?.main?.map(ex => ex.id) || []

  const exercisePool = pickExercises(equipment, fitnessLevel, goal, timeAvailable, splitType, exerciseCount, prevSameSplitExerciseIds, forcedExerciseIds)

  // Helper: find the last weight/reps for an exercise from completed workouts (respects swaps)
  const completedWorkouts = workouts
    .filter(w => w.status === 'completed')
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  const getLastWeightReps = (exerciseId) => {
    // Check if this exercise was swapped from another
    const swappedFrom = Object.entries(exerciseSwaps).find(([, to]) => to === exerciseId)?.[0]
    const searchIds = swappedFrom ? [exerciseId, swappedFrom] : [exerciseId]

    for (const wid of completedWorkouts.map(w => w.id)) {
      const log = exerciseLogs?.[wid]
      for (const eid of searchIds) {
        const entry = log?.[eid]
        if (entry?.sets) {
          const completedSets = entry.sets.filter(s => s.completed && (s.weight > 0 || s.reps > 0))
          if (completedSets.length > 0) {
            const bestWeight = Math.max(...completedSets.map(s => s.weight || 0))
            const bestReps = Math.max(...completedSets.filter(s => s.weight === bestWeight).map(s => s.reps || 0))
            if (bestWeight > 0) return { weight: bestWeight, reps: bestReps }
          }
        }
      }
    }
    return null
  }

  const mainWorkout = exercisePool.map(ex => {
    const built = buildExercise(ex, energy, timeConfig, goal)
    const last = getLastWeightReps(ex.id)
    if (last) {
      built.sets = Array.from({ length: built.sets }, () => ({ weight: last.weight, reps: last.reps, completed: false }))
    }
    return built
  })
  const warmup = pickWarmup(equipment)
  const cooldown = pickCooldown(equipment)
  const finisher = maybeAddFinisher(equipment, energy, timeAvailable)

  const warmupTime = warmup.reduce((sum, w) => sum + (w.duration || 30), 0)
  const mainTime = mainWorkout.reduce((sum, ex) => {
    const workTime = ex.reps ? ex.reps * 3 : ex.duration || 0
    const restTime = ex.rest * (ex.sets - 1)
    return sum + (workTime * ex.sets) + restTime
  }, 0)
  const finisherTime = finisher ? (finisher.duration || finisher.reps * 3) : 0
  const cooldownTime = cooldown.reduce((sum, c) => sum + (c.duration || 30), 0)
  const estimatedMinutes = Math.ceil((warmupTime + mainTime + finisherTime + cooldownTime) / 60)

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
}

export { SPLIT_NAMES }
