import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Button, WrapLogo } from '../components/UI'

export default function WelcomePage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setTimeout(() => setVisible(true), 100)
  }, [])

  const firstName = profile?.full_name?.split(' ')[0] || ''

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'clamp(1.25rem, 5vw, 2.5rem)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        background: `
          radial-gradient(ellipse 60% 50% at 85% 15%, rgba(253,155,14,0.09) 0%, transparent 60%),
          radial-gradient(ellipse 40% 40% at 15% 85%, rgba(238,96,11,0.06) 0%, transparent 60%),
          var(--bg-primary)
        `,
      }} />

      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: 560,
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : 'translateY(24px)',
        transition: 'all 0.6s ease',
      }}>
        {/* Logo */}
        <div style={{ marginBottom: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
          <WrapLogo size="md" />
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: 'clamp(1.8rem, 5vw, 3rem)',
          lineHeight: 1.15,
          marginBottom: 'clamp(1rem, 3vw, 1.5rem)',
        }}>
          {firstName ? `${firstName}, before` : 'Before'} we build<br/>
          <span style={{ color: 'var(--accent)' }}>your system</span>,<br/>
          we need your story.
        </h1>

        <p style={{
          fontSize: 'clamp(0.95rem, 2.5vw, 1.1rem)',
          color: 'var(--text-secondary)',
          lineHeight: 1.75,
          marginBottom: 'clamp(1.5rem, 4vw, 2rem)',
        }}>
          The WRAP system isn't a productivity tool you fill out. It's built on a foundation of what you actually want — which means before we touch goals, plans, or weekly actions, we need to go deeper.
        </p>

        {/* What to expect cards */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          marginBottom: 'clamp(1.5rem, 4vw, 2.5rem)',
        }}>
          {[
            {
              icon: '🔥',
              title: 'The 4D Activation',
              desc: 'Dream → Desire → Disturbance → Decision. A guided coaching conversation that surfaces what you really want and why.',
              time: '20–25 min',
              forPath: 'new',
            },
            {
              icon: '⚡',
              title: 'Alumni Fast Path',
              desc: "If you've been through a UWE or the Defiant Code, skip straight to your Anchor Goal and Life Arenas.",
              time: '8–10 min',
              forPath: 'alumni',
            },
          ].map(card => (
            <div key={card.title} style={{
              background: 'var(--bg-secondary)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 'var(--radius-lg)',
              padding: 'clamp(0.875rem, 3vw, 1.25rem)',
              display: 'flex',
              gap: '1rem',
              alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: '1.4rem', flexShrink: 0, marginTop: 2 }}>{card.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, flexWrap: 'wrap', gap: 6 }}>
                  <p style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0, fontSize: '0.95rem' }}>
                    {card.title}
                  </p>
                  <span style={{
                    fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em',
                    color: 'var(--accent)', background: 'rgba(253,155,14,0.12)',
                    padding: '2px 8px', borderRadius: 99,
                  }}>
                    {card.time}
                  </span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.55 }}>
                  {card.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Save progress note */}
        <div style={{
          background: 'rgba(110,231,183,0.07)',
          border: '1px solid rgba(110,231,183,0.15)',
          borderRadius: 'var(--radius-md)',
          padding: '0.875rem 1.125rem',
          marginBottom: 'clamp(1.5rem, 4vw, 2rem)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
        }}>
          <span style={{ fontSize: '1rem', flexShrink: 0 }}>💾</span>
          <p style={{ fontSize: '0.82rem', color: '#6ee7b7', margin: 0, lineHeight: 1.5 }}>
            <strong>Your progress saves automatically.</strong> If life interrupts you, just sign back in and you'll pick up exactly where you left off.
          </p>
        </div>

        {/* What you'll have at the end */}
        <div style={{
          borderLeft: '2px solid rgba(253,155,14,0.4)',
          paddingLeft: '1rem',
          marginBottom: 'clamp(1.5rem, 4vw, 2.5rem)',
        }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8 }}>
            What you'll have when you're done
          </p>
          {[
            'A clear anchor goal tied to what you actually want',
            'Your 4D story captured and saved',
            'Life Arenas mapped and ready for outcomes',
            'A WRAP dashboard built around your life',
          ].map(item => (
            <p key={item} style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '4px 0', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 1 }}>→</span>
              {item}
            </p>
          ))}
        </div>

        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={() => navigate('/onboarding/start')}
        >
          I'm ready — let's go →
        </Button>

        <p style={{
          textAlign: 'center',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          marginTop: '1rem',
          lineHeight: 1.5,
        }}>
          This is the most important thing you'll do today.<br/>
          Give it the time it deserves.
        </p>
      </div>
    </div>
  )
}
