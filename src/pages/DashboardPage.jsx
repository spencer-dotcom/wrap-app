import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { WrapLogo } from '../components/UI'

export default function DashboardPage() {
  const { user, profile } = useAuth()
  const [lifeAreas, setLifeAreas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function fetchData() {
    const { data } = await supabase
      .from('life_areas')
      .select('*')
      .eq('user_id', user.id)
      .order('sort_order')

    setLifeAreas(data || [])
    setLoading(false)
  }

  const firstName = profile?.full_name?.split(' ')[0] || 'there'
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.toLocaleString('default', { month: 'long' })

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top nav */}
      <header style={{
        padding: 'var(--space-lg) var(--space-xl)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(33,32,32,0.95)', backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <WrapLogo size="md" />
        <nav style={{ display: 'flex', gap: 'var(--space-xl)', alignItems: 'center' }}>
          {['Annual', 'Monthly', 'Weekly', 'Review'].map(item => (
            <button key={item} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 500,
              color: 'var(--text-muted)', transition: 'color var(--transition-fast)',
              padding: '4px 0',
            }}
              onMouseEnter={e => e.target.style.color = 'var(--text-primary)'}
              onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
            >
              {item}
            </button>
          ))}
        </nav>
        <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--orange-primary), var(--orange-deep))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.875rem', fontWeight: 700, color: '#fff',
            cursor: 'pointer',
          }}>
            {firstName[0]?.toUpperCase()}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main style={{ flex: 1, maxWidth: 1100, width: '100%', margin: '0 auto', padding: 'var(--space-2xl) var(--space-xl)' }}>

        {/* Welcome header */}
        <div style={{ marginBottom: 'var(--space-2xl)', animation: 'fadeUp 0.4s ease forwards' }}>
          <h1 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', marginBottom: 8 }}>
            Welcome, {firstName}.
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            {currentMonth} {currentYear} · Your WRAP system is ready.
          </p>
        </div>

        {/* Anchor Goal banner */}
        {profile?.anchor_goal && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(253,155,14,0.12), rgba(238,96,11,0.08))',
            border: '1px solid rgba(253,155,14,0.25)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-xl) var(--space-2xl)',
            marginBottom: 'var(--space-2xl)',
            animation: 'fadeUp 0.5s ease forwards',
            animationDelay: '0.1s', opacity: 0,
          }}>
            <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8 }}>
              Your Anchor Goal · {profile.anchor_goal_timeline}
            </p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1rem, 2vw, 1.3rem)', color: 'var(--text-primary)', lineHeight: 1.5 }}>
              {profile.anchor_goal}
            </p>
          </div>
        )}

        {/* Quick actions */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-md)',
          marginBottom: 'var(--space-2xl)',
          animation: 'fadeUp 0.5s ease forwards', animationDelay: '0.2s', opacity: 0,
        }}>
          {[
            { label: 'Annual Outcomes', icon: '🗓', desc: 'Set yearly targets', color: 'rgba(253,155,14,0.1)', border: 'rgba(253,155,14,0.2)' },
            { label: 'Monthly Plan', icon: '📍', desc: currentMonth + ' objectives', color: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.2)' },
            { label: 'Weekly WRAP', icon: '⚡', desc: 'This week\'s actions', color: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)' },
            { label: 'Desire List', icon: '✨', desc: 'Future wants & goals', color: 'rgba(244,114,182,0.1)', border: 'rgba(244,114,182,0.2)' },
          ].map(card => (
            <div key={card.label} style={{
              background: card.color, border: `1px solid ${card.border}`,
              borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)',
              cursor: 'pointer', transition: 'all var(--transition-base)',
            }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: 10 }}>{card.icon}</div>
              <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, fontSize: '0.95rem' }}>{card.label}</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>{card.desc}</p>
            </div>
          ))}
        </div>

        {/* Life Areas grid */}
        <div style={{ animation: 'fadeUp 0.5s ease forwards', animationDelay: '0.3s', opacity: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
            <h2 style={{ fontSize: '1.2rem' }}>Life Areas</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {lifeAreas.length} areas · {currentYear}
            </p>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--text-muted)' }}>Loading…</div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 'var(--space-md)',
            }}>
              {lifeAreas.map(area => (
                <div key={area.id} style={{
                  background: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)',
                  cursor: 'pointer', transition: 'all var(--transition-base)',
                  position: 'relative', overflow: 'hidden',
                }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(253,155,14,0.3)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
                    e.currentTarget.style.transform = 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 'var(--space-md)' }}>
                    <span style={{ fontSize: '1.4rem' }}>{area.icon}</span>
                    <h3 style={{ fontSize: '0.95rem', fontFamily: 'var(--font-body)', fontWeight: 600 }}>{area.name}</h3>
                  </div>

                  {/* Placeholder for outcomes */}
                  <div style={{
                    height: 3, background: 'var(--bg-card)', borderRadius: 99, marginBottom: 8,
                  }}>
                    <div style={{
                      height: '100%', width: '0%', borderRadius: 99,
                      background: 'linear-gradient(90deg, var(--orange-primary), var(--orange-deep))',
                    }} />
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    No outcomes set yet · <span style={{ color: 'var(--accent)', cursor: 'pointer' }}>Add annual outcome →</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Coming soon note */}
        <div style={{
          marginTop: 'var(--space-3xl)',
          padding: 'var(--space-xl)',
          background: 'var(--bg-secondary)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 'var(--radius-lg)',
          textAlign: 'center',
          animation: 'fadeUp 0.5s ease forwards', animationDelay: '0.4s', opacity: 0,
        }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
            Sprint 2 coming soon: Annual outcome setting, monthly planning, and the weekly WRAP session.
          </p>
        </div>
      </main>

      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:none; } }
      `}</style>
    </div>
  )
}

