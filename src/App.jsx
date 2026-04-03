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

// ─── Safe store selectors ──────────────────────────────────────────────────────
function useUser() {
  return useStore(s => s?.user ?? null)
}

// ─── Protected route — guards authenticated pages ───────────────────────────────
function ProtectedRoute({ children }) {
  const user = useUser()
  if (user === undefined) return null // Loading — don't redirect yet
  if (!user) return <Navigate to="/onboarding" replace />
  return children
}

// ─── App shell with bottom nav ─────────────────────────────────────────────────
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

// ─── Root — handles loading and auth redirects ─────────────────────────────────
function AppInner() {
  const user = useUser()

  // Show nothing while loading (brief — from localStorage)
  if (user === undefined) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0D0D0F',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          width: 32, height: 32,
          border: '3px solid #27272A',
          borderTopColor: '#F97316',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
      </div>
    )
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          user
            ? <Navigate to="/home" replace />
            : <Navigate to="/onboarding" replace />
        }
      />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route
        path="/home"
        element={<ProtectedRoute><AppShell><Home /></AppShell></ProtectedRoute>}
      />
      <Route
        path="/workout/:id"
        element={<ProtectedRoute><WorkoutDetail /></ProtectedRoute>}
      />
      <Route
        path="/progress"
        element={<ProtectedRoute><AppShell><Progress /></AppShell></ProtectedRoute>}
      />
      <Route
        path="/settings"
        element={<ProtectedRoute><AppShell><Settings /></AppShell></ProtectedRoute>}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

// ─── Root component with global error catch ────────────────────────────────────
function RootErrorCatcher({ children }) {
  const [rootError, setRootError] = React.useState(null)

  // Catch errors thrown during render
  if (rootError) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0D0D0F',
        color: '#FAFAFA',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif',
        padding: '24px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <h1 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>
          App Error
        </h1>
        <p style={{ fontSize: '14px', color: '#A1A1AA', marginBottom: '24px', maxWidth: '400px' }}>
          The app encountered an error loading. Try refreshing.
        </p>
        <pre style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: '#18181B',
          borderRadius: '6px',
          fontSize: '11px',
          color: '#EF4444',
          textAlign: 'left',
          overflow: 'auto',
          maxWidth: '100%',
          maxHeight: '300px',
          width: '100%',
        }}>
          {rootError.toString()}
          {'\n\n'}
          {rootError.stack}
        </pre>
        <button
          onClick={() => { localStorage.clear(); window.location.reload() }}
          style={{
            marginTop: '16px',
            backgroundColor: '#F97316',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          Clear Data & Reload
        </button>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <React.Fragment>
        {/* CSS keyframe for spinner */}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        {children}
      </React.Fragment>
    </ErrorBoundary>
  )
}

export default function App() {
  return (
    <RootErrorCatcher>
      <HashRouter>
        <AppInner />
      </HashRouter>
    </RootErrorCatcher>
  )
}
