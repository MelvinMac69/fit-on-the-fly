import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { Button } from '../components/Button.jsx'
import { PillSelector } from '../components/PillSelector.jsx'
import { GOALS, GOAL_LABELS, FITNESS_LEVELS, LEVEL_LABELS, WORKOUT_STYLES, STYLE_LABELS } from '../data/exercises.js'

const STEPS = [
  { id: 1, title: 'Who are you?', subtitle: "Let's personalize your experience." },
  { id: 2, title: 'Your fitness level', subtitle: 'This helps us scale workouts appropriately.' },
  { id: 3, title: "You're all set!", subtitle: "Here's your starting point." },
]

const goalOptions = GOALS.map(g => ({ value: g, label: GOAL_LABELS[g] }))
const levelOptions = FITNESS_LEVELS.map(l => ({ value: l, label: LEVEL_LABELS[l] }))
const styleOptions = WORKOUT_STYLES.map(s => ({ value: s, label: STYLE_LABELS[s] }))

export default function Onboarding() {
  const navigate = useNavigate()
  const setUser = useStore(s => s.setUser)

  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [goal, setGoal] = useState(null)
  const [level, setLevel] = useState(null)
  const [style, setStyle] = useState(null)

  const canProceed = () => {
    if (step === 1) return name.trim().length > 0 && goal
    if (step === 2) return level && style
    return true
  }

  const handleNext = () => {
    if (step === 3) {
      setUser({
        name: name.trim(),
        goal,
        fitnessLevel: level,
        preferredStyle: style,
        accountabilityTone: 'coach',
      })
      navigate('/home')
    } else {
      setStep(s => s + 1)
    }
  }

  const currentStep = STEPS.find(s => s.id === step)

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Progress dots */}
      <div className="flex justify-center gap-2 pt-12 pb-8">
        {STEPS.map(s => (
          <div
            key={s.id}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              s.id === step ? 'bg-primary w-6' : s.id < step ? 'bg-primary' : 'bg-border'
            }`}
          />
        ))}
      </div>

      <div className="flex-1 px-6 max-w-lg mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-primary">{currentStep.title}</h1>
          <p className="text-text-secondary mt-1 text-sm">{currentStep.subtitle}</p>
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Your name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="What should we call you?"
                className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-3">Primary goal</label>
              <PillSelector
                options={goalOptions}
                value={goal}
                onChange={setGoal}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-3">Fitness level</label>
              <PillSelector
                options={levelOptions}
                value={level}
                onChange={setLevel}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-3">Preferred style</label>
              <PillSelector
                options={styleOptions}
                value={style}
                onChange={setStyle}
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-surface border border-border rounded-lg p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Name</span>
                <span className="text-text-primary font-medium">{name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Goal</span>
                <span className="text-text-primary font-medium">{GOAL_LABELS[goal]}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Level</span>
                <span className="text-text-primary font-medium">{LEVEL_LABELS[level]}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Style</span>
                <span className="text-text-primary font-medium">{STYLE_LABELS[style]}</span>
              </div>
            </div>
            <p className="text-text-secondary text-sm">
              Your workouts will adapt to your schedule, equipment, and energy every single day.
              No excuses. Let's go.
            </p>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="p-6 max-w-lg mx-auto w-full">
        <Button
          size="lg"
          className="w-full"
          disabled={!canProceed()}
          onClick={handleNext}
        >
          {step === 3 ? "🚀 Let's Fly" : 'Continue'}
        </Button>
      </div>
    </div>
  )
}
