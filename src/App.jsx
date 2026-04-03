import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useStore } from './store/useStore.js'
import { BottomNav } from './components/BottomNav.jsx'
import Onboarding from './screens/Onboarding.jsx'
import Home from './screens/Home.jsx'
import WorkoutDetail from './screens/WorkoutDetail.jsx'
import Progress from './screens/Progress.jsx'
import Settings from './screens/Settings.jsx'

function ProtectedRoute({ children }) {
  const user = useStore(s => s.user)
  if (!user) return <Navigate to="/onboarding" replace />
  return children
}

function AppShell({ children }) {
  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-lg mx-auto">
        {children}
      </div>
      <BottomNav />
    </div>
  )
}

export default function App() {
  const user = useStore(s => s.user)

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={user ? <Navigate to="/home" replace /> : <Navigate to="/onboarding" replace />}
        />
        <Route path="/onboarding" element={<Onboarding />} />

        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <AppShell><Home /></AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/workout/:id"
          element={
            <ProtectedRoute>
              <WorkoutDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="/progress"
          element={
            <ProtectedRoute>
              <AppShell><Progress /></AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <AppShell><Settings /></AppShell>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
