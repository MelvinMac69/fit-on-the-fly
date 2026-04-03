import React from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useStore } from './store/useStore.js'
import { BottomNav } from './components/BottomNav.jsx'
import { ErrorBoundary } from './components/ErrorBoundary.jsx'
import Onboarding from './screens/Onboarding.jsx'
import Home from './screens/Home.jsx'
import WorkoutDetail from './screens/WorkoutDetail.jsx'
import Progress from './screens/Progress.jsx'
import Settings from './screens/Settings.jsx'

// ─── Get user from store safely ────────────────────────────────────────────────
function useUserState() {
  return useStore(s => {
    if (!s) return null
    if (!s.user) return null
    return s.user
  })
}

// ─── Loading spinner ───────────────────────────────────────────────────────────
function LoadingSpinner() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0D0D0F',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        width: 32,
        height: 32,
        border: '3px solid #27272A',
        borderTopColor: '#F97316',
        borderRadius: '50%',
        animation: 'fotf-spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes fotf-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ─── Protected route ───────────────────────────────────────────────────────────
function ProtectedRoute({ children }) {
  const user = useUserState()

  // While user is undefined (loading), show spinner — prevents flash of wrong route
  if (user === undefined || user === null) {
    return <LoadingSpinner />
  }

  return children
}

// ─── App shell ─────────────────────────────────────────────────────────────────
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

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const user = useUserState()

  return (
    <ErrorBoundary>
      <HashRouter>
        <Routes>
          {/* Root redirect */}
          <Route
            path="/"
            element={
              user
                ? <Navigate to="/home" replace />
                : <Navigate to="/onboarding" replace />
            }
          />

          {/* Onboarding — always public */}
          <Route path="/onboarding" element={<Onboarding />} />

          {/* Protected — require user */}
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

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </ErrorBoundary>
  )
}
