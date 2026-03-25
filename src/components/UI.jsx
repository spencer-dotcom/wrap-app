import React from 'react'

/* ─── Button ─────────────────────────────────────────────────── */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  style = {},
}) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    fontFamily: 'var(--font-body)',
    fontWeight: 600,
    letterSpacing: '0.02em',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'all var(--transition-base)',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    width: fullWidth ? '100%' : 'auto',
    textDecoration: 'none',
  }

  const sizes = {
    sm: { padding: '0.5rem 1rem',   fontSize: '0.875rem' },
    md: { padding: '0.75rem 1.75rem', fontSize: '1rem' },
    lg: { padding: '1rem 2.5rem',   fontSize: '1.1rem',  borderRadius: 'var(--radius-lg)' },
  }

  const variants = {
    primary: {
      background: 'linear-gradient(135deg, var(--orange-primary), var(--orange-deep))',
      color: '#fff',
      boxShadow: '0 4px 24px rgba(253, 155, 14, 0.3)',
    },
    secondary: {
      background: 'transparent',
      color: 'var(--text-primary)',
      border: '1px solid var(--black-lighter)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-secondary)',
    },
    outline: {
      background: 'transparent',
      color: 'var(--accent)',
      border: '1.5px solid var(--accent)',
    },
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}
      onMouseEnter={e => {
        if (!disabled && !loading) {
          if (variant === 'primary') e.currentTarget.style.transform = 'translateY(-2px)'
          if (variant === 'secondary') e.currentTarget.style.background = 'var(--bg-card)'
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'none'
        if (variant === 'secondary') e.currentTarget.style.background = 'transparent'
      }}
    >
      {loading ? <Spinner /> : children}
    </button>
  )
}

function Spinner() {
  return (
    <span style={{
      width: 16, height: 16,
      border: '2px solid rgba(255,255,255,0.3)',
      borderTopColor: '#fff',
      borderRadius: '50%',
      display: 'inline-block',
      animation: 'spin 0.7s linear infinite',
    }} />
  )
}

/* ─── Input ──────────────────────────────────────────────────── */
export function Input({ label, error, hint, style = {}, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', ...style }}>
      {label && (
        <label style={{
          fontSize: '0.8rem',
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
        }}>
          {label}
        </label>
      )}
      <input
        {...props}
        style={{
          background: 'var(--bg-card)',
          border: `1px solid ${error ? 'var(--orange-deep)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: 'var(--radius-md)',
          padding: '0.75rem 1rem',
          color: 'var(--text-primary)',
          fontSize: '1rem',
          fontFamily: 'var(--font-body)',
          width: '100%',
          transition: 'border-color var(--transition-fast)',
          outline: 'none',
        }}
        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
        onBlur={e => e.target.style.borderColor = error ? 'var(--orange-deep)' : 'rgba(255,255,255,0.08)'}
      />
      {error && <span style={{ fontSize: '0.8rem', color: 'var(--orange-deep)' }}>{error}</span>}
      {hint && !error && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{hint}</span>}
    </div>
  )
}

/* ─── Textarea ───────────────────────────────────────────────── */
export function Textarea({ label, error, hint, rows = 4, style = {}, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', ...style }}>
      {label && (
        <label style={{
          fontSize: '0.8rem',
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
        }}>
          {label}
        </label>
      )}
      <textarea
        rows={rows}
        {...props}
        style={{
          background: 'var(--bg-card)',
          border: `1px solid ${error ? 'var(--orange-deep)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: 'var(--radius-md)',
          padding: '0.875rem 1rem',
          color: 'var(--text-primary)',
          fontSize: '1rem',
          fontFamily: 'var(--font-body)',
          lineHeight: 1.6,
          width: '100%',
          resize: 'vertical',
          transition: 'border-color var(--transition-fast)',
          outline: 'none',
        }}
        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
        onBlur={e => e.target.style.borderColor = error ? 'var(--orange-deep)' : 'rgba(255,255,255,0.08)'}
      />
      {error && <span style={{ fontSize: '0.8rem', color: 'var(--orange-deep)' }}>{error}</span>}
      {hint && !error && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{hint}</span>}
    </div>
  )
}

/* ─── Card ───────────────────────────────────────────────────── */
export function Card({ children, style = {}, glow = false, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-xl)',
        transition: 'all var(--transition-base)',
        cursor: onClick ? 'pointer' : 'default',
        ...(glow ? { animation: 'pulse-glow 3s ease infinite' } : {}),
        ...style,
      }}
      onMouseEnter={e => {
        if (onClick) {
          e.currentTarget.style.borderColor = 'rgba(253,155,14,0.3)'
          e.currentTarget.style.transform = 'translateY(-2px)'
        }
      }}
      onMouseLeave={e => {
        if (onClick) {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
          e.currentTarget.style.transform = 'none'
        }
      }}
    >
      {children}
    </div>
  )
}

/* ─── Progress Bar ───────────────────────────────────────────── */
export function ProgressBar({ value, max = 100, label, showPercent = true }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div>
      {(label || showPercent) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          {label && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{label}</span>}
          {showPercent && <span style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600 }}>{pct}%</span>}
        </div>
      )}
      <div style={{
        height: 6,
        background: 'var(--bg-card)',
        borderRadius: 99,
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: 'linear-gradient(90deg, var(--orange-primary), var(--orange-deep))',
          borderRadius: 99,
          transition: 'width 0.6s ease',
        }} />
      </div>
    </div>
  )
}

/* ─── Step Indicator ─────────────────────────────────────────── */
export function StepIndicator({ steps, currentStep }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      justifyContent: 'center',
    }}>
      {steps.map((step, i) => {
        const isDone = i < currentStep
        const isCurrent = i === currentStep
        return (
          <React.Fragment key={i}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
            }}>
              <div style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 700,
                background: isDone
                  ? 'linear-gradient(135deg, var(--orange-primary), var(--orange-deep))'
                  : isCurrent
                    ? 'transparent'
                    : 'transparent',
                border: isCurrent
                  ? '2px solid var(--accent)'
                  : isDone
                    ? 'none'
                    : '2px solid rgba(255,255,255,0.15)',
                color: isDone ? '#fff' : isCurrent ? 'var(--accent)' : 'var(--text-muted)',
                transition: 'all var(--transition-base)',
              }}>
                {isDone ? '✓' : i + 1}
              </div>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: isCurrent ? 600 : 400,
                color: isCurrent ? 'var(--text-primary)' : 'var(--text-muted)',
                display: 'none', // show on larger screens via media query
              }}>
                {step}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                flex: 1,
                maxWidth: 40,
                height: 1,
                background: isDone
                  ? 'var(--accent)'
                  : 'rgba(255,255,255,0.1)',
                transition: 'background var(--transition-slow)',
              }} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

/* ─── Section Header ─────────────────────────────────────────── */
export function SectionHeader({ eyebrow, title, subtitle, align = 'center' }) {
  return (
    <div style={{ textAlign: align, marginBottom: 'var(--space-xl)' }}>
      {eyebrow && (
        <p style={{
          fontSize: '0.7rem',
          fontWeight: 700,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: 'var(--accent)',
          marginBottom: 'var(--space-sm)',
        }}>
          {eyebrow}
        </p>
      )}
      <h2 style={{ marginBottom: subtitle ? 'var(--space-md)' : 0 }}>{title}</h2>
      {subtitle && <p style={{ maxWidth: 540, margin: '0 auto', lineHeight: 1.7 }}>{subtitle}</p>}
    </div>
  )
}

/* ─── AI Typing Indicator ────────────────────────────────────── */
export function TypingIndicator() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '1rem 1.25rem',
      background: 'var(--bg-card)',
      borderRadius: 'var(--radius-md)',
      width: 'fit-content',
    }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: 'var(--accent)',
          animation: `bounce 1.2s ease infinite`,
          animationDelay: `${i * 0.2}s`,
        }} />
      ))}
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

/* ─── Logo ───────────────────────────────────────────────────── */
export function WrapLogo({ size = 'md' }) {
  const heights = { sm: 28, md: 38, lg: 52 }
  const h = heights[size]
  return (
    <img
      src="/logo.png"
      alt="Defiant Resources"
      style={{
        height: h,
        width: 'auto',
        objectFit: 'contain',
        display: 'block',
      }}
    />
  )
}
