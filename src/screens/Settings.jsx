import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { Card } from '../components/Card.jsx'
import { PillSelector } from '../components/PillSelector.jsx'
import { ConfirmModal } from '../components/Modal.jsx'
import { GOALS, GOAL_LABELS, FITNESS_LEVELS, LEVEL_LABELS, WORKOUT_STYLES, STYLE_LABELS, ACCOUNTABILITY_TONES, TONE_LABELS, TONE_MESSAGES } from '../data/exercises.js'

const goalOptions = GOALS.map(g => ({ value: g, label: GOAL_LABELS[g] }))
const levelOptions = FITNESS_LEVELS.map(l => ({ value: l, label: LEVEL_LABELS[l] }))
const styleOptions = WORKOUT_STYLES.map(s => ({ value: s, label: STYLE_LABELS[s] }))
const toneOptions = ACCOUNTABILITY_TONES.map(t => ({ value: t, label: TONE_LABELS[t] }))

export default function Settings() {
  const navigate = useNavigate()
  const { user, updateUser, resetAllData, settings, updateSettings } = useStore()

  const [name, setName] = useState(user?.name || '')
  const [goal, setGoal] = useState(user?.goal || '')
  const [level, setLevel] = useState(user?.fitnessLevel || '')
  const [style, setStyle] = useState(user?.preferredStyle || '')
  const [tone, setTone] = useState(user?.accountabilityTone || 'coach')
  const [reminderEnabled, setReminderEnabled] = useState(settings.reminderEnabled)
  const [reminderTime, setReminderTime] = useState(settings.reminderTime)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    updateUser({
      name: name.trim() || user?.name,
      goal,
      fitnessLevel: level,
      preferredStyle: style,
      accountabilityTone: tone,
    })
    updateSettings({ reminderEnabled, reminderTime })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleReset = () => {
    resetAllData()
    navigate('/')
  }

  const hasChanges = () => {
    return (
      name !== user?.name ||
      goal !== user?.goal ||
      level !== user?.fitnessLevel ||
      style !== user?.preferredStyle ||
      tone !== user?.accountabilityTone ||
      reminderEnabled !== settings.reminderEnabled ||
      reminderTime !== settings.reminderTime
    )
  }

  return (
    <div className="min-h-screen bg-bg pb-20">
      <div className="max-w-lg mx-auto px-4 pt-10">
        <h1 className="text-2xl font-bold text-text-primary mb-6">Settings</h1>

        {/* Profile */}
        <div className="space-y-5">
          <Section title="Profile">
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-text-muted uppercase tracking-wider mb-2">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-bg border border-border rounded-md px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-text-muted uppercase tracking-wider mb-2">Goal</label>
                <PillSelector options={goalOptions} value={goal} onChange={setGoal} />
              </div>
              <div>
                <label className="block text-xs text-text-muted uppercase tracking-wider mb-2">Fitness Level</label>
                <PillSelector options={levelOptions} value={level} onChange={setLevel} />
              </div>
              <div>
                <label className="block text-xs text-text-muted uppercase tracking-wider mb-2">Workout Style</label>
                <PillSelector options={styleOptions} value={style} onChange={setStyle} />
              </div>
            </div>
          </Section>

          {/* Accountability */}
          <Section title="Accountability Tone">
            <div className="space-y-4">
              <PillSelector options={toneOptions} value={tone} onChange={setTone} />
              <div className="bg-bg rounded-md px-4 py-3 border border-border">
                <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Preview</div>
                <p className="text-sm text-text-secondary italic">
                  "{TONE_MESSAGES[tone]}"
                </p>
              </div>
            </div>
          </Section>

          {/* Reminders */}
          <Section title="Daily Reminder">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-text-primary">Workout reminder</div>
                  <div className="text-xs text-text-muted">Get a daily nudge (mock for MVP)</div>
                </div>
                <button
                  onClick={() => setReminderEnabled(!reminderEnabled)}
                  className={`w-12 h-7 rounded-full transition-colors relative ${
                    reminderEnabled ? 'bg-primary' : 'bg-border'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                      reminderEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              {reminderEnabled && (
                <div>
                  <label className="block text-xs text-text-muted uppercase tracking-wider mb-2">Reminder Time</label>
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={e => setReminderTime(e.target.value)}
                    className="bg-bg border border-border rounded-md px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-primary"
                  />
                </div>
              )}
            </div>
          </Section>

          {/* Save Button */}
          {hasChanges() && (
            <button
              onClick={handleSave}
              className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors"
            >
              {saved ? '✓ Saved!' : 'Save Changes'}
            </button>
          )}

          {/* Danger Zone */}
          <Section title="Danger Zone">
            <button
              onClick={() => setShowResetConfirm(true)}
              className="w-full py-2.5 border border-danger/50 text-danger text-sm font-medium rounded-md hover:bg-danger/10 transition-colors"
            >
              Reset All Data
            </button>
          </Section>
        </div>
      </div>

      <ConfirmModal
        isOpen={showResetConfirm}
        onConfirm={handleReset}
        onCancel={() => setShowResetConfirm(false)}
        title="Reset all data?"
        message="This will delete your profile, all workout history, and settings. This cannot be undone."
        confirmLabel="Reset Everything"
        danger
      />
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="mb-6">
      <h2 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">{title}</h2>
      <Card className="p-4">{children}</Card>
    </div>
  )
}
