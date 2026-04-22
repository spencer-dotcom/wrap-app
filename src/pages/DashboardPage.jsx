import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { WrapLogo } from '../components/UI'

export default function DashboardPage() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [lifeAreas, setLifeAreas] = useState([])
  const [loading, setLoading] = useState(true)
  const [showMenu, setShowMenu] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(() => {
    if (user) fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function fetchData() {
    const { data } = await supabase
      .from('life_areas').select('*').eq('user_id', user.id).order('sort_order')
    setLifeAreas(data || [])
    setLoading(false)
  }

  const firstName = profile?.full_name?.split(' ')[0] || 'there'
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.toLocaleString('default', { month: 'long' })

  const NAV_ITEMS = [
    { label: 'Annual',  route: '/annual' },
    { label: 'Monthly', route: '/monthly' },
    { label: 'Weekly',  route: '/weekly' },
    { label: 'Review',  route: '/desires' },
  ]

  const MENU_ITEMS = [
    { label: '🔄 Revisit 4D Activation', action: () => { setShowMenu(false); navigate('/onboarding/dream?redo=true') } },
    { label: '🎯 Update Anchor Goal',    action: () => { setShowMenu(false); navigate('/onboarding/anchor-goal?redo=true') } },
  ]

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <header style={{
        padding: '0.875rem clamp(1rem, 4vw, 1.5rem)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(33,32,32,0.97)', backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <WrapLogo size="sm" />

        {/* Desktop nav — hidden on mobile via CSS */}
        <nav style={{ display: 'flex', gap: '2rem', alignItems: 'center' }} className="wrap-desktop-nav">
          {NAV_ITEMS.map(item => (
            <button key={item.label} onClick={() => navigate(item.route)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 500,
              color: 'var(--text-muted)', transition: 'color var(--transition-fast)', padding: '4px 0',
            }}
              onMouseEnter={e => e.target.style.color = 'var(--text-primary)'}
              onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
            >{item.label}</button>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
          {/* Hamburger — visible on mobile via CSS */}
          <button className="wrap-mobile-menu-btn" onClick={() => setMobileNavOpen(p => !p)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-secondary)', padding: 4, fontSize: '1.3rem', lineHeight: 1,
          }}>
            {mobileNavOpen ? '✕' : '☰'}
          </button>

          {/* Avatar */}
          <div onClick={() => { setShowMenu(p => !p); setMobileNavOpen(false) }} style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--orange-primary), var(--orange-deep))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.875rem', fontWeight: 700, color: '#fff', cursor: 'pointer', flexShrink: 0,
          }}>
            {firstName[0]?.toUpperCase()}
          </div>

          {/* Account dropdown */}
          {showMenu && (
            <div style={{
              position: 'absolute', top: 42, right: 0, zIndex: 100,
              background: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 'var(--radius-md)', minWidth: 210,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)', overflow: 'hidden',
              animation: 'fadeUp 0.2s ease forwards',
            }}>
              <div style={{ padding: '0.875rem 1.125rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  {profile?.full_name || 'Account'}
                </p>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>{user?.email}</p>
              </div>
              {MENU_ITEMS.map(item => (
                <button key={item.label} onClick={item.action} style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '0.75rem 1.125rem', background: 'none', border: 'none',
                  cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '0.875rem',
                  color: 'var(--text-secondary)', transition: 'all var(--transition-fast)',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.color = 'var(--text-primary)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-secondary)' }}
                >{item.label}</button>
              ))}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <button onClick={async () => { setShowMenu(false); await signOut(); navigate('/auth') }} style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '0.75rem 1.125rem', background: 'none', border: 'none',
                  cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '0.875rem',
                  color: '#fca5a5', transition: 'all var(--transition-fast)',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(252,165,165,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >Sign Out</button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Mobile nav drawer */}
      {mobileNavOpen && (
        <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {NAV_ITEMS.map(item => (
            <button key={item.label} onClick={() => { navigate(item.route); setMobileNavOpen(false) }} style={{
              display: 'block', width: '100%', background: 'none',
              border: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)',
              padding: '1rem clamp(1rem, 4vw, 1.5rem)', textAlign: 'left', cursor: 'pointer',
              fontFamily: 'var(--font-body)', fontSize: '1rem', fontWeight: 500,
              color: 'var(--text-secondary)',
            }}>
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* Main */}
      <main style={{ flex: 1, maxWidth: 1100, width: '100%', margin: '0 auto', padding: 'clamp(1.25rem, 4vw, 3rem) clamp(1rem, 4vw, 2rem)' }}>

        {/* Welcome */}
        <div style={{ marginBottom: 'clamp(1.25rem, 3vw, 2rem)', animation: 'fadeUp 0.4s ease forwards' }}>
          <h1 style={{ fontSize: 'clamp(1.6rem, 5vw, 2.5rem)', marginBottom: 6 }}>
            Welcome, {firstName}.
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {currentMonth} {currentYear} · Your WRAP system is ready.
          </p>
        </div>

        {/* Anchor Goal */}
        {profile?.anchor_goal && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(253,155,14,0.12), rgba(238,96,11,0.08))',
            border: '1px solid rgba(253,155,14,0.25)',
            borderRadius: 'var(--radius-xl)',
            padding: 'clamp(1rem, 3vw, 1.5rem) clamp(1.25rem, 4vw, 2rem)',
            marginBottom: 'clamp(1.25rem, 3vw, 2rem)',
            animation: 'fadeUp 0.5s ease forwards', animationDelay: '0.1s', opacity: 0,
          }}>
            <p style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8 }}>
              Your Anchor Goal · {profile.anchor_goal_timeline}
            </p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(0.95rem, 2.5vw, 1.25rem)', color: 'var(--text-primary)', lineHeight: 1.5, margin: 0 }}>
              {profile.anchor_goal}
            </p>
          </div>
        )}

        {/* Quick action tiles — 2×2 on mobile, 4×1 on desktop */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 'clamp(0.625rem, 2vw, 1rem)',
          marginBottom: 'clamp(1.25rem, 3vw, 2rem)',
          animation: 'fadeUp 0.5s ease forwards', animationDelay: '0.2s', opacity: 0,
        }}>
          {[
            { label: 'Annual Outcomes', icon: '🗓', desc: 'Set yearly targets',    color: 'rgba(253,155,14,0.1)',  border: 'rgba(253,155,14,0.2)',  route: '/annual' },
            { label: 'Monthly Plan',    icon: '📍', desc: currentMonth,            color: 'rgba(99,102,241,0.1)',  border: 'rgba(99,102,241,0.2)',  route: '/monthly' },
            { label: 'Weekly WRAP',     icon: '⚡', desc: "This week's actions",   color: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)', route: '/weekly' },
            { label: 'Desire List',     icon: '✨', desc: 'Future wants & goals',  color: 'rgba(244,114,182,0.1)',border: 'rgba(244,114,182,0.2)',route: '/desires' },
          ].map(card => (
            <div key={card.label} onClick={() => navigate(card.route)} style={{
              background: card.color, border: `1px solid ${card.border}`,
              borderRadius: 'var(--radius-lg)', padding: 'clamp(0.875rem, 3vw, 1.25rem)',
              cursor: 'pointer', transition: 'all var(--transition-base)',
            }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            >
              <div style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', marginBottom: 8 }}>{card.icon}</div>
              <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 'clamp(0.78rem, 2vw, 0.95rem)', margin: '0 0 3px' }}>{card.label}</p>
              <p style={{ fontSize: 'clamp(0.68rem, 1.8vw, 0.8rem)', color: 'var(--text-muted)', margin: 0 }}>{card.desc}</p>
            </div>
          ))}
        </div>

        {/* Life Arenas */}
        <div style={{ animation: 'fadeUp 0.5s ease forwards', animationDelay: '0.3s', opacity: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.1rem' }}>Life Arenas</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{currentYear}</p>
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading…</div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))',
              gap: 'clamp(0.625rem, 2vw, 1rem)',
            }}>
              {lifeAreas.map(area => (
                <div key={area.id} onClick={() => navigate('/annual')} style={{
                  background: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 'var(--radius-lg)', padding: 'clamp(0.875rem, 2vw, 1.25rem)',
                  cursor: 'pointer', transition: 'all var(--transition-base)',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(253,155,14,0.3)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <span style={{ fontSize: '1.25rem' }}>{area.icon}</span>
                    <h3 style={{ fontSize: '0.875rem', fontFamily: 'var(--font-body)', fontWeight: 600 }}>{area.name}</h3>
                  </div>
                  <div style={{ height: 3, background: 'var(--bg-card)', borderRadius: 99, marginBottom: 6 }}>
                    <div style={{ height: '100%', width: '0%', borderRadius: 99, background: 'linear-gradient(90deg, var(--orange-primary), var(--orange-deep))' }} />
                  </div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>
                    No outcomes set · <span style={{ color: 'var(--accent)' }}>Add →</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:none; } }
        .wrap-mobile-menu-btn { display: none !important; }
        @media (max-width: 639px) {
          .wrap-desktop-nav { display: none !important; }
          .wrap-mobile-menu-btn { display: block !important; }
        }
      `}</style>
    </div>
  )
}
