# Fit-On-The-Fly — Product Specification

## 1. Concept & Vision

Fit-On-The-Fly is a fitness app built for people whose schedules, environments, and energy fluctuate daily — pilots, road warriors, shift workers. The core promise: **you get a real workout in under 10 seconds, every day, no matter what's available**. It's not a program. It's a daily adaptive tool.

The personality is sharp, no-BS, practical. It respects that the user is tired, traveling, or short on time. It doesn't preach. It delivers.

---

## 2. Design Language

**Aesthetic Direction:** Military-grade functional. Think Figma meets a flight deck — clean grids, high contrast, purposeful color. Not "wellness startup." Not pastel. Think dark backgrounds, sharp accent, tight typography.

**Color Palette:**
- Background: `#0D0D0F` (near black)
- Surface: `#18181B` (card backgrounds)
- Border: `#27272A` (subtle separation)
- Primary: `#F97316` (orange — energy, action, aviation orange)
- Primary hover: `#EA580C`
- Text primary: `#FAFAFA`
- Text secondary: `#A1A1AA`
- Text muted: `#52525B`
- Success: `#22C55E`
- Warning: `#EAB308`
- Danger: `#EF4444`
- Low energy: `#3B82F6` (blue)
- Medium energy: `#F97316` (orange)
- High energy: `#22C55E` (green)

**Typography:**
- Font family: Inter (clean, modern, readable on mobile)
- Headings: 700 weight, tight tracking
- Body: 400/500 weight
- Mono accents: JetBrains Mono (for stats/numbers)

**Spatial System:**
- Base unit: 4px
- Spacing scale: 4, 8, 12, 16, 20, 24, 32, 48, 64
- Border radius: 8px (cards), 6px (buttons), 4px (inputs), 9999px (pills)
- Touch targets: minimum 44px height

**Motion Philosophy:**
- Fast and purposeful — 150-250ms transitions
- Easing: ease-out for entries, ease-in-out for state changes
- No decorative animations — every motion serves feedback
- Page transitions: subtle fade + slide (200ms)

**Visual Assets:**
- Icons: Lucide React (consistent, clean stroke icons)
- No stock photos — clean iconography and color blocks
- Decorative elements: subtle gradients on cards, thin borders

---

## 3. Layout & Structure

**Navigation:** Bottom tab bar (mobile-first)
- Home (dashboard)
- Progress
- Settings
- (Onboarding replaces nav during setup)

**Screen Flow:**
```
Splash → Onboarding (3 steps) → Home Dashboard
                                     ↓
                    [Generate] → Workout Detail → Log → Back to Home
                                     ↓
                              Progress Screen
                                     ↓
                               Settings
```

**Visual Pacing:**
- Dashboard: Breathing hero card (today's status), tight data grid below
- Workout detail: Dense but scannable — exercises in compact rows
- Progress: Clean stat blocks with visual history

---

## 4. Features & Interactions

### Onboarding (3 steps)
**Step 1 — Who you are:**
- Name (text input)
- Fitness goal (pill selection: Fat Loss / Muscle Gain / Maintain / General Health)
- Tap to select, tap again to change

**Step 2 — Your fitness level:**
- Fitness level (pill selection: Beginner / Intermediate / Advanced)
- Preferred style (pill selection: Strength / Conditioning / Mixed)

**Step 3 — Ready:**
- Brief summary of what they selected
- "Let's Fly" CTA

**Validation:** Can't proceed without selections. Tapping a pill highlights it (orange border + fill).

### Home Dashboard
**Hero card:**
- Greeting with name + date
- Current streak badge
- "Generate Today's Workout" prominent button (orange, full-width on mobile)

**Below the fold:**
- Quick stats: workouts this week, streak, next reminder
- Last workout summary (if exists)
- "How are you feeling today?" context inputs (collapsed, expandable)

**Daily Context Panel (collapsible):**
- Time available: 10 / 20 / 30 / 45 / 60 min (pill row)
- Equipment: Full Gym / Hotel Gym / Dumbbells Only / Bodyweight / None (pill row)
- Energy: Low / Medium / High (pill row with color indicators)
- "Generate" button activates only when all 3 are selected

### Workout Detail Screen
**Header:**
- Workout name (adaptive based on inputs)
- Time estimate + equipment tag
- Energy indicator pill

**Sections:**
1. **Warm-up** (3-5 exercises, 2-3 min)
2. **Main Workout** (exercise list with sets/reps or duration)
3. **Finisher** (optional, based on energy/time)
4. **Cooldown** (2-3 mobility moves)

**Each exercise row:**
- Exercise name (bold)
- Sets × Reps OR Duration
- Equipment tag (muted)
- Tap to expand: brief form tip

**Bottom action bar:**
- "Start Workout" (marks workout as started)
- "Log Complete" / "Skip" / "Add Note"
- If completed: green checkmark + note option

### Log Flow
- Three options: ✅ Complete / ⏭️ Skip / 📝 Add Note
- Note modal: textarea + save
- After logging: redirect to Home, update streak/stats

### Progress Screen
**Stats row:**
- Workouts this week (X/7)
- Current streak (days)
- Total workouts (all time)

**Weekly view:**
- 7-day horizontal calendar strip (dots: completed/skipped/missed)

**Recent history:**
- Last 10 workouts as compact list
- Each: date, workout name, status (✓/⏭/📝)

### Settings Screen
- Edit profile (name, goal, fitness level, style)
- Accountability tone (Coach / Friend / Tough Love) — with preview snippet
- Reminder time (mock toggle + time picker)
- Reset data (danger zone, with confirmation)

### Accountability Tones (display text)
- **Coach:** "Consistency beats perfection. Let's get this done."
- **Friend:** "Hey! Ready to move today? No pressure, but it'd be awesome."
- **Tough Love:** "Stop scrolling. Your workout isn't doing itself. Let's go."

---

## 5. Component Inventory

### PillSelector
- Horizontal scrollable row of pill buttons
- States: default (border only), selected (orange fill + white text), disabled (muted)
- Single or multi-select mode

### WorkoutCard
- Surface background, rounded 8px, subtle border
- Header: workout name + meta tags
- Body: exercise count, estimated duration
- States: default, active (current workout highlighted), completed (green left border)

### ExerciseRow
- Compact row: icon + name + prescription + equipment tag
- Expanded state: adds form cues
- Completed state: strikethrough + green check

### StatBlock
- Large number (mono font), label below
- Used in dashboard and progress

### StreakBadge
- Flame icon + number
- Orange when active, muted when zero

### BottomNav
- 3 items: Home, Progress, Settings
- Active state: orange icon + label
- Inactive: muted icon + label

### Modal
- Backdrop blur overlay
- Centered card, rounded 12px
- Used for notes, confirmations

### Button
- Primary: orange fill, white text, 44px height min
- Secondary: transparent, orange border + text
- Ghost: transparent, white text
- States: default, hover, active, disabled, loading

---

## 6. Technical Approach

**Framework:** React 18 + Vite
**Styling:** Tailwind CSS
**State:** Zustand (lightweight, simple)
**Routing:** React Router v6
**Persistence:** localStorage (key: `fotf_user`, `fotf_workouts`, `fotf_settings`)
**Icons:** Lucide React
**Build output:** Static SPA (can be deployed to Vercel, Netlify, or wrapped with Capacitor later)

**Data Model:**

```typescript
User {
  id: string
  name: string
  goal: 'fat_loss' | 'muscle_gain' | 'maintain' | 'general_health'
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced'
  preferredStyle: 'strength' | 'conditioning' | 'mixed'
  accountabilityTone: 'coach' | 'friend' | 'tough_love'
  reminderTime: string | null  // "07:00"
  createdAt: string
}

Workout {
  id: string
  date: string  // "2026-04-03"
  timeAvailable: number  // minutes
  equipment: EquipmentType
  energy: EnergyLevel
  generatedWorkout: GeneratedWorkout
  status: 'generated' | 'completed' | 'skipped'
  note: string | null
  completedAt: string | null
}

GeneratedWorkout {
  name: string
  warmup: Exercise[]
  main: Exercise[]
  finisher: Exercise[] | null
  cooldown: Exercise[]
  estimatedMinutes: number
}

Exercise {
  id: string
  name: string
  sets: number | null
  reps: number | null
  duration: number | null  // seconds
  rest: number  // seconds
  tip: string
  equipment: EquipmentType
}
```

**Workout Generation Logic:**
Rules-based engine with 3 input axes:
- `timeAvailable`: 10/20/30/45/60 → maps to exercise count + rest durations
- `equipment`: 5 levels → maps to exercise pool
- `energy`: Low/Medium/High → adjusts volume (sets/reps) and intensity

Exercise pool is a curated list of ~60 exercises tagged with:
- Equipment required
- Difficulty (beginner/intermediate/advanced)
- Muscle groups (for balanced programming)
- Metabolic demand (conditioning vs strength)

Generator algorithm:
1. Filter exercises by available equipment
2. Filter by fitness level (remove advanced for beginners)
3. Pick balanced muscle group sequence
4. Adjust volume based on time + energy
5. Add appropriate warmup (movement prep) and cooldown (mobility)

---

## 7. Screens

1. `/` — Splash → redirect to `/onboarding` or `/home`
2. `/onboarding` — 3-step onboarding wizard
3. `/home` — Dashboard with generate button + context inputs
4. `/workout/:id` — Workout detail + logging
5. `/progress` — Stats + history
6. `/settings` — Profile + tone + reminders
