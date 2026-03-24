import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Button, Input, WrapLogo } from '../components/UI'

export default function AuthPage() {
  const [mode, setMode] = useState('signup') // 'signup' | 'signin'
  const [fullName, setFullName] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [success, setSuccess]   = useState('')

  const { signUp, signIn } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (mode === 'signup') {
      if (!fullName.trim()) { setError('Please enter your name.'); setLoading(false); return }
      const { error } = await signUp(email, password, fullName)
      if (error) { setError(error.message); setLoading(false); return }
      setSuccess('Check your email to confirm your account, then sign in.')
      setMode('signin')
    } else {
      const { error } = await signIn(email, password)
      if (error) { setError(error.message); setLoading(false); return }
      navigate('/onboarding')
    }

    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-xl)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background texture */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        background: `
          radial-gradient(ellipse 60% 50% at 80% 20%, rgba(253,155,14,0.08) 0%, transparent 60%),
          radial-gradient(ellipse 40% 40% at 20% 80%, rgba(238,96,11,0.06) 0%, transparent 60%),
          var(--bg-primary)
        `,
      }} />

      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: 440,
        animation: 'fadeUp 0.5s ease forwards',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)' }}>
          <WrapLogo size="lg" />
          <p style={{
            marginTop: 'var(--space-md)',
            color: 'var(--text-muted)',
            fontSize: '0.9rem',
            letterSpacing: '0.04em',
          }}>
            Life Management System
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-2xl)',
        }}>
          {/* Mode toggle */}
          <div style={{
            display: 'flex',
            background: 'var(--bg-primary)',
            borderRadius: 'var(--radius-md)',
            padding: 4,
            marginBottom: 'var(--space-xl)',
          }}>
            {['signup', 'signin'].map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); setSuccess('') }}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  borderRadius: 'calc(var(--radius-md) - 2px)',
                  border: 'none',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all var(--transition-base)',
                  background: mode === m
                    ? 'linear-gradient(135deg, var(--orange-primary), var(--orange-deep))'
                    : 'transparent',
                  color: mode === m ? '#fff' : 'var(--text-muted)',
                }}
              >
                {m === 'signup' ? 'Create Account' : 'Sign In'}
              </button>
            ))}
          </div>

          {success && (
            <div style={{
              background: 'rgba(253,155,14,0.1)',
              border: '1px solid rgba(253,155,14,0.3)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-md)',
              marginBottom: 'var(--space-lg)',
              fontSize: '0.875rem',
              color: 'var(--accent)',
            }}>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
            {mode === 'signup' && (
              <Input
                label="Full Name"
                type="text"
                placeholder="Spencer Combs"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
              />
            )}

            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder={mode === 'signup' ? 'At least 8 characters' : '••••••••'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              hint={mode === 'signup' ? 'Minimum 8 characters' : ''}
            />

            {error && (
              <p style={{
                fontSize: '0.875rem',
                color: 'var(--orange-deep)',
                textAlign: 'center',
              }}>
                {error}
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
            >
              {mode === 'signup' ? 'Start Your WRAP Journey' : 'Sign In'}
            </Button>
          </form>

          {mode === 'signup' && (
            <p style={{
              textAlign: 'center',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              marginTop: 'var(--space-lg)',
              lineHeight: 1.5,
            }}>
              By creating an account you're committing to your growth.<br/>
              No spam. Cancel anytime.
            </p>
          )}
        </div>
      </div>

      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:none; } }`}</style>
    </div>
  )
}
