import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import './styles/globals.css'

// Pages
import AuthPage from './pages/AuthPage'
import EntryRoutingPage from './pages/EntryRoutingPage'
import DashboardPage from './pages/DashboardPage'

// Onboarding pages
import DreamStagePage from './pages/onboarding/DreamStagePage'
import { DesireStagePage, DisturbanceStagePage, DecisionStagePage } from './pages/onboarding/StagePages'
import { AnchorGoalPage, LifeAreasSetupPage } from './pages/onboarding/AnchorAndAreas'

/* ─── Route Guards ────────────────────────────────────────────── */
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/auth" replace />
  return children
}

function OnboardingRoute({ children }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/auth" replace />
  if (profile?.onboarding_completed) return <Navigate to="/dashboard" replace />
  return children
}

function PublicRoute({ children }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (user) {
    if (profile?.onboarding_completed) return <Navigate to="/dashboard" replace />
    return <Navigate to="/onboarding" replace />
  }
  return children
}

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
    }}>
      <img
        src="/logo.png"
        alt="Defiant Resources"
        style={{
          height: 48,
          width: 'auto',
          animation: 'pulse 1.2s ease infinite',
        }}
      />
      <style>{`@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.7;transform:scale(0.95)} }`}</style>
    </div>
  )
}

/* ─── App ─────────────────────────────────────────────────────── */
function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/auth" element={<PublicRoute><AuthPage /></PublicRoute>} />

      {/* Onboarding flow */}
      <Route path="/onboarding" element={<OnboardingRoute><EntryRoutingPage /></OnboardingRoute>} />
      <Route path="/onboarding/dream" element={<OnboardingRoute><DreamStagePage /></OnboardingRoute>} />
      <Route path="/onboarding/desire" element={<OnboardingRoute><DesireStagePage /></OnboardingRoute>} />
      <Route path="/onboarding/disturbance" element={<OnboardingRoute><DisturbanceStagePage /></OnboardingRoute>} />
      <Route path="/onboarding/decision" element={<OnboardingRoute><DecisionStagePage /></OnboardingRoute>} />
      <Route path="/onboarding/anchor-goal" element={<OnboardingRoute><AnchorGoalPage /></OnboardingRoute>} />
      <Route path="/onboarding/life-areas" element={<OnboardingRoute><LifeAreasSetupPage /></OnboardingRoute>} />

      {/* Protected app */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />

      {/* Redirects */}
      <Route path="/" element={<Navigate to="/auth" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

