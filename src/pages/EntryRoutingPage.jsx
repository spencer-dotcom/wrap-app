import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Button, WrapLogo } from '../components/UI'

const ENTRY_OPTIONS = [
  {
    id: 'new',
    icon: '🔥',
    title: 'New to WRAP',
    description: "I want to build my life management system from the ground up. Take me through the full experience.",
    label: 'Full onboarding — ~20 min',
  },
  {
    id: 'alumni',
    icon: '⚡',
    title: 'Defiant Code or UWE Alumni',
    description: "I've been through the process with Spencer. I'm ready to set up my system and get moving.",
    label: 'Fast setup — ~8 min',
  },
  {
    id: 'coaching_client',
    icon: '🎯',
    title: '1:1 Coaching Client',
    description: "Spencer sent me here as part of our coaching relationship. I'm set up with a coach.",
    label: 'Guided setup — coordinated with your coach',
  },
]

export default function EntryRoutingPage() {
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)
  const { updateProfile } = useAuth()
  const navigate = useNavigate()

  async function handleContinue() {
    if (!selected) return
    setLoading(true)
    await updateProfile({ entry_type: selected, onboarding_step: 'entry_routing' })
    
    if (selected === 'new') {
      navigate('/onboarding/dream')
    } else if (selected === 'alumni') {
      navigate('/onboarding/anchor-goal')
    } else {
      navigate('/onboarding/anchor-goal')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-xl)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        background: `
          radial-gradient(ellipse 50% 60% at 90% 10%, rgba(253,155,14,0.07) 0%, transparent 60%),
          var(--bg-primary)
        `,
      }} />

      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: 600,
        animation: 'fadeUp 0.5s ease forwards',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)' }}>
          <WrapLogo size="md" />
          <h1 style={{
            marginTop: 'var(--space-xl)',
            fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
          }}>
            Where are you<br/>
            <span style={{ color: 'var(--accent)' }}>starting from?</span>
          </h1>
          <p style={{
            marginTop: 'var(--space-md)',
            color: 'var(--text-muted)',
            maxWidth: 420,
            margin: 'var(--space-md) auto 0',
          }}>
            Your path through the WRAP system depends on where you are in the Defiant journey.
          </p>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-md)',
          marginBottom: 'var(--space-xl)',
        }}>
          {ENTRY_OPTIONS.map(option => (
            <div
              key={option.id}
              onClick={() => setSelected(option.id)}
              style={{
                background: selected === option.id
                  ? 'rgba(253,155,14,0.08)'
                  : 'var(--bg-secondary)',
                border: `1.5px solid ${selected === option.id
                  ? 'var(--accent)'
                  : 'rgba(255,255,255,0.06)'}`,
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-lg) var(--space-xl)',
                cursor: 'pointer',
                transition: 'all var(--transition-base)',
                display: 'flex',
                gap: 'var(--space-lg)',
                alignItems: 'flex-start',
              }}
              onMouseEnter={e => {
                if (selected !== option.id) {
                  e.currentTarget.style.borderColor = 'rgba(253,155,14,0.3)'
                  e.currentTarget.style.background = 'var(--bg-card)'
                }
              }}
              onMouseLeave={e => {
                if (selected !== option.id) {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
                  e.currentTarget.style.background = 'var(--bg-secondary)'
                }
              }}
            >
              {/* Icon */}
              <div style={{
                fontSize: '1.75rem',
                lineHeight: 1,
                flexShrink: 0,
                marginTop: 2,
              }}>
                {option.icon}
              </div>

              {/* Content */}
              <div style={{ flex: 1 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 6,
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}>
                  <h3 style={{
                    fontSize: '1.1rem',
                    fontFamily: 'var(--font-display)',
                  }}>
                    {option.title}
                  </h3>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    color: selected === option.id ? 'var(--accent)' : 'var(--text-muted)',
                    background: selected === option.id
                      ? 'rgba(253,155,14,0.15)'
                      : 'rgba(255,255,255,0.05)',
                    padding: '2px 10px',
                    borderRadius: 99,
                    transition: 'all var(--transition-base)',
                  }}>
                    {option.label}
                  </span>
                </div>
                <p style={{
                  fontSize: '0.9rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                  margin: 0,
                }}>
                  {option.description}
                </p>
              </div>

              {/* Selection indicator */}
              <div style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                border: `2px solid ${selected === option.id ? 'var(--accent)' : 'rgba(255,255,255,0.2)'}`,
                background: selected === option.id
                  ? 'linear-gradient(135deg, var(--orange-primary), var(--orange-deep))'
                  : 'transparent',
                flexShrink: 0,
                marginTop: 4,
                transition: 'all var(--transition-base)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.6rem',
                color: '#fff',
              }}>
                {selected === option.id ? '✓' : ''}
              </div>
            </div>
          ))}
        </div>

        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={!selected}
          loading={loading}
          onClick={handleContinue}
        >
          Continue →
        </Button>
      </div>

      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:none; } }`}</style>
    </div>
  )
}
