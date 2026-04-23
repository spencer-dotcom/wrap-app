import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { Button, Textarea, StepIndicator, WrapLogo } from '../../components/UI'

const ONBOARDING_STEPS = ['Dream', 'Desire', 'Disturbance', 'Decision', 'Anchor Goal', 'Life Arenas']

const DEFAULT_LIFE_AREAS = [
  { name: 'Spiritual / Purpose', icon: '🙏', selected: true },
  { name: 'Health',               icon: '💪', selected: true },
  { name: 'Relationships',        icon: '❤️', selected: true },
  { name: 'Career / Value',       icon: '🎯', selected: true },
  { name: 'Financial',            icon: '💰', selected: true },
  { name: 'Overflow / Lifestyle', icon: '✨', selected: true },
]

/* ── Shared Onboarding Header ────────────────────────────────── */
function OnboardingHeader({ stepIndex, isRedo, profile, user, onSaveAndClose, onSignOut }) {
  const [showMenu, setShowMenu] = useState(false)
  const navigate = useNavigate()
  const firstName = profile?.full_name?.split(' ')[0] || ''

  return (
    <header style={{
      padding: '0.875rem clamp(1rem, 4vw, 1.5rem)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 10,
      background: 'rgba(33,32,32,0.95)', backdropFilter: 'blur(12px)',
    }}>
      <div onClick={() => isRedo && navigate('/dashboard')} style={{ cursor: isRedo ? 'pointer' : 'default' }}>
        <WrapLogo size="sm" />
      </div>
      {!isRedo
        ? <StepIndicator steps={ONBOARDING_STEPS} currentStep={stepIndex} />
        : <p style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600 }}>Update Anchor Goal</p>
      }
      <div style={{ position: 'relative' }}>
        <div onClick={() => setShowMenu(p => !p)} style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--orange-primary), var(--orange-deep))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.8rem', fontWeight: 700, color: '#fff', cursor: 'pointer',
        }}>
          {(firstName[0] || '?').toUpperCase()}
        </div>
        {showMenu && (
          <div style={{
            position: 'absolute', top: 40, right: 0, zIndex: 100,
            background: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 'var(--radius-md)', minWidth: 210,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)', overflow: 'hidden',
            animation: 'fadeUp 0.2s ease forwards',
          }}>
            <div style={{ padding: '0.875rem 1.125rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{profile?.full_name || 'Account'}</p>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>{user?.email}</p>
            </div>
            {!isRedo && (
              <button onClick={() => { setShowMenu(false); onSaveAndClose() }} style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '0.75rem 1.125rem', background: 'none', border: 'none',
                cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '0.875rem',
                color: 'var(--text-secondary)', transition: 'all var(--transition-fast)',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.color = 'var(--text-primary)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-secondary)' }}
              >
                💾 Save & Continue Later
              </button>
            )}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button onClick={() => { setShowMenu(false); onSignOut() }} style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '0.75rem 1.125rem', background: 'none', border: 'none',
                cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '0.875rem',
                color: '#fca5a5', transition: 'all var(--transition-fast)',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(252,165,165,0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

/* ── Anchor Goal Page ─────────────────────────────────────────── */
export function AnchorGoalPage() {
  const [anchorGoal, setAnchorGoal] = useState('')
  const [timeline, setTimeline]     = useState('3')
  const [saving, setSaving]         = useState(false)
  const [saved, setSaved]           = useState(false)

  const { profile, user, signOut, updateProfile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const isRedo = new URLSearchParams(location.search).get('redo') === 'true'

  async function handleSaveAndClose() {
    await updateProfile({ onboarding_step: 'anchor_goal' })
    setSaved(true)
    setTimeout(() => navigate('/dashboard'), 1500)
  }

  async function handleSignOut() {
    await signOut()
    navigate('/auth')
  }

  async function handleContinue() {
    if (!anchorGoal.trim() || saving) return
    setSaving(true)
    await updateProfile({
      anchor_goal: anchorGoal,
      anchor_goal_timeline: `${timeline} years`,
      onboarding_step: isRedo ? 'complete' : 'life_areas',
    })
    navigate(isRedo ? '/dashboard' : '/onboarding/life-areas')
    setSaving(false)
  }

  if (saved) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', padding: '2rem' }}>
        <div style={{ fontSize: '3rem' }}>💾</div>
        <h2 style={{ textAlign: 'center' }}>Your progress is saved.</h2>
        <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Sign back in anytime and we'll pick up exactly where you left off.</p>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Returning to dashboard…</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <OnboardingHeader stepIndex={4} isRedo={isRedo} profile={profile} user={user} onSaveAndClose={handleSaveAndClose} onSignOut={handleSignOut} />

      <div style={{ flex: 1, maxWidth: 620, width: '100%', margin: '0 auto', padding: 'clamp(1rem, 4vw, 2rem)', display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)', animation: 'fadeUp 0.4s ease forwards' }}>
        <div>
          <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8 }}>
            {isRedo ? 'Update your anchor goal' : 'Almost there'}
          </p>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', marginBottom: 'var(--space-md)' }}>Your Anchor Goal</h1>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            Everything in the WRAP system points here. Your anchor goal is the single most significant outcome you want to achieve — the one that, if accomplished, would pull you through every smaller goal along the way.
          </p>
        </div>

        <div style={{ borderLeft: '3px solid var(--accent)', paddingLeft: 'var(--space-lg)' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--text-primary)', fontStyle: 'italic', lineHeight: 1.6 }}>
            "Without a commitment to a specific outcome, you are operating without a clear purpose."
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 8 }}>— Momentum & Mastery</p>
        </div>

        <div>
          <p style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>Timeline</p>
          <div style={{ display: 'flex', gap: 10 }}>
            {['1', '2', '3', '5'].map(yr => (
              <button key={yr} onClick={() => setTimeline(yr)} style={{
                flex: 1, padding: '0.625rem', borderRadius: 'var(--radius-md)',
                border: `1.5px solid ${timeline === yr ? 'var(--accent)' : 'rgba(255,255,255,0.1)'}`,
                background: timeline === yr ? 'rgba(253,155,14,0.1)' : 'var(--bg-card)',
                color: timeline === yr ? 'var(--accent)' : 'var(--text-secondary)',
                fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.875rem',
                cursor: 'pointer', transition: 'all var(--transition-base)',
              }}>
                {yr} yr{yr !== '1' ? 's' : ''}
              </button>
            ))}
          </div>
        </div>

        <Textarea
          label={`My ${timeline}-year anchor goal`}
          rows={5}
          placeholder="Write it as an outcome, not a task. Make it specific and emotionally compelling. What does winning look like?"
          value={anchorGoal}
          onChange={e => setAnchorGoal(e.target.value)}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Button variant="primary" size="lg" fullWidth disabled={anchorGoal.trim().length < 20 || saving} loading={saving} onClick={handleContinue}>
            {isRedo ? 'Save My Anchor Goal →' : 'Set My Life Arenas →'}
          </Button>
          <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            You can refine this anytime from your dashboard.
          </p>
        </div>
      </div>
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:none; } }`}</style>
    </div>
  )
}

/* ── Life Arenas Setup Page ───────────────────────────────────── */
export function LifeAreasSetupPage() {
  const [areas, setAreas]   = useState(DEFAULT_LIFE_AREAS)
  const [custom, setCustom] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)

  const { user, profile, signOut, updateProfile } = useAuth()
  const navigate = useNavigate()

  const selectedCount = areas.filter(a => a.selected).length

  async function handleSaveAndClose() {
    await updateProfile({ onboarding_step: 'life_areas' })
    setSaved(true)
    setTimeout(() => navigate('/dashboard'), 1500)
  }

  async function handleSignOut() {
    await signOut()
    navigate('/auth')
  }

  function toggleArea(i) {
    setAreas(prev => prev.map((a, j) => j === i ? { ...a, selected: !a.selected } : a))
  }

  function addCustom() {
    if (!custom.trim() || areas.length >= 9) return
    setAreas(prev => [...prev, { name: custom.trim(), icon: '⭐', selected: true }])
    setCustom('')
  }

  async function handleFinish() {
    const selected = areas.filter(a => a.selected)
    if (selected.length < 5 || selected.length > 9 || saving) return
    setSaving(true)

    const { error } = await supabase.from('life_areas').insert(
      selected.map((a, i) => ({ user_id: user.id, name: a.name, icon: a.icon, sort_order: i + 1 }))
    )

    if (!error) {
      await updateProfile({ onboarding_completed: true, onboarding_step: 'complete' })
      navigate('/dashboard')
    }
    setSaving(false)
  }

  if (saved) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', padding: '2rem' }}>
        <div style={{ fontSize: '3rem' }}>💾</div>
        <h2 style={{ textAlign: 'center' }}>Your progress is saved.</h2>
        <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Sign back in anytime and we'll pick up exactly where you left off.</p>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Returning to dashboard…</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <OnboardingHeader stepIndex={5} isRedo={false} profile={profile} user={user} onSaveAndClose={handleSaveAndClose} onSignOut={handleSignOut} />

      <div style={{ flex: 1, maxWidth: 620, width: '100%', margin: '0 auto', padding: 'clamp(1rem, 4vw, 2rem)', display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)', animation: 'fadeUp 0.4s ease forwards' }}>
        <div>
          <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8 }}>Final step</p>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', marginBottom: 'var(--space-md)' }}>Your Life Arenas</h1>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            These are the 5–9 domains your WRAP system will track. Everything you do weekly connects back to one of these. Choose what matters most right now.
          </p>
        </div>

        {/* Counter */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: 'var(--space-md) var(--space-lg)',
          background: selectedCount >= 5 && selectedCount <= 9 ? 'rgba(253,155,14,0.08)' : 'var(--bg-card)',
          border: `1px solid ${selectedCount >= 5 && selectedCount <= 9 ? 'rgba(253,155,14,0.3)' : 'rgba(255,255,255,0.06)'}`,
          borderRadius: 'var(--radius-md)', transition: 'all var(--transition-base)',
        }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Selected: <strong style={{ color: selectedCount >= 5 && selectedCount <= 9 ? 'var(--accent)' : 'var(--text-primary)' }}>{selectedCount}</strong> / target 5–9
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {selectedCount < 5 ? `Need ${5 - selectedCount} more` : selectedCount > 9 ? 'Too many — deselect some' : '✓ Good range'}
          </span>
        </div>

        {/* Areas grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-sm)' }}>
          {areas.map((area, i) => (
            <div key={i} onClick={() => toggleArea(i)} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: 'var(--space-md) var(--space-lg)',
              background: area.selected ? 'rgba(253,155,14,0.08)' : 'var(--bg-card)',
              border: `1.5px solid ${area.selected ? 'var(--accent)' : 'rgba(255,255,255,0.06)'}`,
              borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'all var(--transition-base)',
            }}
              onMouseEnter={e => { if (!area.selected) e.currentTarget.style.borderColor = 'rgba(253,155,14,0.3)' }}
              onMouseLeave={e => { if (!area.selected) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}
            >
              <span style={{ fontSize: '1.25rem' }}>{area.icon}</span>
              <span style={{ fontSize: '0.9rem', fontWeight: area.selected ? 600 : 400, color: area.selected ? 'var(--text-primary)' : 'var(--text-secondary)', flex: 1 }}>{area.name}</span>
              <div style={{
                width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                background: area.selected ? 'linear-gradient(135deg, var(--orange-primary), var(--orange-deep))' : 'transparent',
                border: `1.5px solid ${area.selected ? 'var(--accent)' : 'rgba(255,255,255,0.2)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.6rem', color: '#fff', transition: 'all var(--transition-base)',
              }}>
                {area.selected ? '✓' : ''}
              </div>
            </div>
          ))}
        </div>

        {/* Custom area */}
        {areas.length < 9 && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 10 }}>Add a custom life arena</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <input value={custom} onChange={e => setCustom(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCustom()}
                placeholder="e.g. Creativity, Community, Faith…"
                style={{ flex: 1, background: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--radius-sm)', padding: '0.625rem 0.875rem', color: 'var(--text-primary)', fontSize: '0.9rem', fontFamily: 'var(--font-body)', outline: 'none' }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
              />
              <Button variant="outline" size="sm" onClick={addCustom} disabled={!custom.trim()}>Add</Button>
            </div>
          </div>
        )}

        <Button variant="primary" size="lg" fullWidth disabled={selectedCount < 5 || selectedCount > 9 || saving} loading={saving} onClick={handleFinish}>
          Enter My WRAP Dashboard →
        </Button>
      </div>
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:none; } }`}</style>
    </div>
  )
}
