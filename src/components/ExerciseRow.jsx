import React from 'react'

export function ExerciseRow({ exercise, completed = false, expanded = false, onToggle }) {
  const prescription = exercise.duration
    ? `${exercise.sets} × ${exercise.duration}s`
    : exercise.reps
    ? `${exercise.sets} × ${exercise.reps} reps`
    : `${exercise.sets} sets`

  return (
    <div
      className={`border-b border-border last:border-0 ${completed ? 'opacity-50' : ''}`}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 py-3 px-1 text-left"
      >
        {/* Status indicator */}
        <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
          completed ? 'bg-success border-success' : 'border-border'
        }`}>
          {completed && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>

        {/* Exercise info */}
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-medium ${completed ? 'line-through text-text-muted' : 'text-text-primary'}`}>
            {exercise.name}
          </div>
          <div className="text-xs text-text-muted mt-0.5">
            {prescription}
            {exercise.rest > 0 && <span className="ml-2">• {exercise.rest}s rest</span>}
          </div>
        </div>

        {/* Equipment tag */}
        <span className="text-xs text-text-muted shrink-0 capitalize">
          {exercise.equipment.replace('_', ' ')}
        </span>

        {/* Expand indicator */}
        <svg
          className={`w-4 h-4 text-text-muted shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded tip */}
      {expanded && (
        <div className="px-8 pb-3 text-xs text-text-secondary leading-relaxed">
          💡 {exercise.tip}
        </div>
      )}
    </div>
  )
}
