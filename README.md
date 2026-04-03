# Fit-On-The-Fly

A mobile-first adaptive fitness app for pilots, travelers, and busy professionals.

## Quick Start

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`

## Tech Stack

- **React 18** + **Vite** — fast dev, builds to static SPA
- **Tailwind CSS** — utility-first styling
- **Zustand** — lightweight state management
- **React Router v6** — client-side routing
- **localStorage** — data persistence (no backend needed for MVP)

## Project Structure

```
src/
  data/exercises.js       — Exercise pool + config constants
  utils/workoutGenerator.js — Rules-based workout engine
  store/useStore.js        — Zustand store (user, workouts, settings)
  components/              — Reusable UI components
  screens/                 — Page-level components
    Onboarding.jsx        — 3-step onboarding wizard
    Home.jsx              — Dashboard + context inputs + generate
    WorkoutDetail.jsx     — Workout view + logging
    Progress.jsx          — Stats + history
    Settings.jsx          — Profile + tone + reminders
```

## App Flow

1. **Onboarding** — name, goal, fitness level, preferred style
2. **Home** — view streak, quick stats, tap to generate
3. **Generate** — select time + equipment + energy → workout is created
4. **Workout Detail** — view exercises, mark complete/skip/add note
5. **Progress** — weekly calendar, streak, history
6. **Settings** — edit profile, change accountability tone, reminders

## Workout Generation

Rules-based engine maps 3 inputs to structured workouts:
- **Time**: 10 / 20 / 30 / 45 / 60 min
- **Equipment**: No Equipment / Bodyweight / Dumbbells / Hotel Gym / Full Gym
- **Energy**: Low / Medium / High

Each workout has:
- Warm-up (3-4 movement prep exercises)
- Main workout (balanced by muscle group, scaled by level)
- Optional finisher (high energy + enough time)
- Cooldown (2-3 mobility moves)

## Build for Production

```bash
npm run build
# Output in dist/
```

## Future (not MVP)

- Real push notifications
- Backend / auth
- Video exercise library
- Wearable integrations
- Social / challenges
