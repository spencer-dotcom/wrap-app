import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import './styles/globals.css'

// Pages
import AuthPage from './pages/AuthPage'
import WelcomePage from './pages/WelcomePage'
import EntryRoutingPage from './pages/EntryRoutingPage'
import DashboardPage from './pages/DashboardPage'
import AnnualOutcomesPage from './pages/AnnualOutcomesPage'
import MonthlyPlanPage from './pages/MonthlyPlanPage'
import WeeklyWrapPage from './pages/WeeklyWrapPage'
import DesireListPage from './pages/DesireListPage'

// Onboarding pages
import DreamStagePage from './pages/onboarding/DreamStagePage'
import { DesireStagePage, DisturbanceStagePage, DecisionStagePage } from './pages/onboarding/StagePages'
import { AnchorGoalPage, LifeAreasSetupPage } from './pages/onboarding/AnchorAndAreas'

/* ─── Resume Detection ────────────────────────────────────────── */
// Maps onboarding_step value to the correct route
const RESUME_ROUTES = {
  'entry_routing': '/onboarding/start',
  'dream':         '/onboarding/dream',
  'desire':        '/onboarding/desire',
  'disturbance':   '/onboarding/disturbance',
  'decision':      '/onboarding/decision',
  'anchor_goal':   '/onboarding/anchor-goal',
  'life_areas':    '/onboarding/life-areas',
}

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
    // Resume detection — send user back to where they left off
    const step = profile?.onboarding_step
    if (step && RESUME_ROUTES[step]) return <Navigate to={RESUME_ROUTES[step]} replace />
    return <Navigate to="/onboarding" replace />
  }
  return children
}

// Smart onboarding index — shows welcome or resumes
function OnboardingIndex() {
  const { profile } = useAuth()
  const step = profile?.onboarding_step
  if (step && step !== 'entry_routing' && RESUME_ROUTES[step]) {
    return <Navigate to={RESUME_ROUTES[step]} replace />
  }
  return <WelcomePage />
}

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg-primary)',
    }}>
      <img
        src="/logo.png"
        alt="Defiant Resources"
        style={{ height: 48, width: 'auto', animation: 'pulse 1.2s ease infinite' }}
      />
      <style>{`@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.7;transform:scale(0.95)} }`}</style>
    </div>
  )
}

/* ─── App Routes ──────────────────────────────────────────────── */
function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/auth" element={<PublicRoute><AuthPage /></PublicRoute>} />

      {/* Onboarding — welcome + entry routing */}
      <Route path="/onboarding" element={<OnboardingRoute><OnboardingIndex /></OnboardingRoute>} />
      <Route path="/onboarding/start" element={<OnboardingRoute><EntryRoutingPage /></OnboardingRoute>} />

      {/* 4D Activation stages — also accessible for redo by logged-in users */}
      <Route path="/onboarding/dream"        element={<ProtectedRoute><DreamStagePage /></ProtectedRoute>} />
      <Route path="/onboarding/desire"       element={<ProtectedRoute><DesireStagePage /></ProtectedRoute>} />
      <Route path="/onboarding/disturbance"  element={<ProtectedRoute><DisturbanceStagePage /></ProtectedRoute>} />
      <Route path="/onboarding/decision"     element={<ProtectedRoute><DecisionStagePage /></ProtectedRoute>} />
      <Route path="/onboarding/anchor-goal"  element={<ProtectedRoute><AnchorGoalPage /></ProtectedRoute>} />
      <Route path="/onboarding/life-areas"   element={<OnboardingRoute><LifeAreasSetupPage /></OnboardingRoute>} />

      {/* Protected app */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/annual"    element={<ProtectedRoute><AnnualOutcomesPage /></ProtectedRoute>} />
      <Route path="/monthly"   element={<ProtectedRoute><MonthlyPlanPage /></ProtectedRoute>} />
      <Route path="/weekly"    element={<ProtectedRoute><WeeklyWrapPage /></ProtectedRoute>} />
      <Route path="/desires"   element={<ProtectedRoute><DesireListPage /></ProtectedRoute>} />

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
