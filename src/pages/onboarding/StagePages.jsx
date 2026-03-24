import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth'
import { supabase, getCoachingResponse } from '../../../lib/supabase'
import { Button, Textarea, StepIndicator, TypingIndicator, WrapLogo } from '../../../components/UI'

const ONBOARDING_STEPS = ['Dream', 'Desire', 'Disturbance', 'Decision', 'Anchor Goal', 'Life Areas']

/* ─── Stage Config ─────────────────────────────────────────────────── */
const STAGES = {
  desire: {
    index: 1,
    title: 'Desire',
    subtitle: 'Understand what really moves you. Not what you should want — what you actually want.',
    accentNote: 'Stage 2 of 4 — Drift to Drive',
    systemPrompt: `You are Spencer Combs, author of Momentum & Mastery. You are guiding the user through the Desire stage of the Drift to Drive framework.

Desire is the emotional engine of progress. It converts abstract dreams into concrete aspirations. Your role: help them understand the difference between means goals and end goals. Help them articulate not just WHAT they want, but WHY they want it.

Ask questions like: "If you had that — what would it give you that you don't have now?" Help them get to the end goal underneath the surface desire.

Keep responses 2-4 sentences. Warm, direct, challenging. One question at a time. After 2-3 exchanges, prompt them to write their summary.`,
    openingMessage: `Good. Now let's go deeper.\n\nYou've described the life you want. But here's the real question — if you had all of it, what would it give you that you don't have now?\n\nBecause most people are pursuing a means goal when there's an end goal underneath it they're not even seeing yet. What's the real thing you're after?`,
    summaryLabel: 'Your core desire',
    summaryPlaceholder: 'In a sentence or two, what do you really want and why does it matter to you?',
    savingField: 'desire_response',
    nextRoute: '/onboarding/disturbance',
    nextLabel: 'Move to Disturbance →',
  },

  disturbance: {
    index: 2,
    title: 'Disturbance',
    subtitle: 'The gap between where you are and where you want to be is about to become impossible to ignore.',
    accentNote: 'Stage 3 of 4 — Drift to Drive',
    systemPrompt: `You are Spencer Combs. You are guiding the user through the Disturbance stage of Drift to Drive.

Disturbance is the uncomfortable catalyst. It emerges when the gap between current reality and desired future becomes too great to ignore. The goal: help them feel the cost of staying the same.

Reference Mel Robbins: "Frustration is a sign that you're growing." Help them tap into the restlessness. Ask: What's the cost of NOT changing? What are you giving up by staying where you are?

The two common beliefs that block disturbance: "I can't achieve it" or "I can't achieve it now." Surface these and challenge them.

Keep responses 2-4 sentences. After 2-3 exchanges, move them to the 100 Reasons Why exercise.`,
    openingMessage: `Here's where things get real.\n\nYou've described what you want and why it matters. Now I need you to sit with something uncomfortable for a minute.\n\nWhat's the actual cost — to you, to the people around you, to your future — if nothing changes? What's the price of staying exactly where you are right now?`,
    summaryLabel: 'Your disturbance (condensed)',
    summaryPlaceholder: 'Write 5–10 reasons why this goal MUST happen, why YOU must be the one, and why it must happen NOW.',
    savingField: 'disturbance_response',
    nextRoute: '/onboarding/decision',
    nextLabel: 'Move to Decision →',
  },

  decision: {
    index: 3,
    title: 'Decision',
    subtitle: 'Not a wish. Not a hope. A commitment at the level of whatever it takes.',
    accentNote: 'Stage 4 of 4 — Drift to Drive',
    systemPrompt: `You are Spencer Combs. You are guiding the user through the Decision stage of Drift to Drive.

Decision is the culmination. Three decision levels: Wish → Hope → Commitment. Real decision manifests through action — starting something or stopping something.

Help them identify: What needs to START? What needs to STOP? And what level are they operating at — wish, hope, or commitment?

Challenge them to step into commitment. "Ambition without implementation is a ridiculous delusion." The decision must be backed by a Start/Stop list.

Keep responses 2-4 sentences. After the exchange, move them to the Start/Stop exercise.`,
    openingMessage: `Last stage.\n\nEverything we've done — the dream, the desire, the disturbance — it all culminates here. In a decision.\n\nNot a wish. Not "I hope this works out." A true commitment is characterized by what you do, not what you say.\n\nSo let me ask: at what level are you deciding right now — wishing, hoping, or committing? And what's the difference for you between those three?`,
    savingField: 'decision_response',
    nextRoute: '/onboarding/anchor-goal',
    nextLabel: 'Set My Anchor Goal →',
    hasStartStop: true,
  },
}

/* ─── Shared Stage Component ─────────────────────────────────────── */
export default function StageComponent({ stage }) {
  const config = STAGES[stage]
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [summaryText, setSummaryText] = useState('')
  const [showSummary, setShowSummary] = useState(false)
  const [starts, setStarts] = useState([''])
  const [stops, setStops] = useState([''])
  const [decisionLevel, setDecisionLevel] = useState('')
  const [saving, setSaving] = useState(false)

  const { user, updateProfile } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    setMessages([{ role: 'assistant', content: config.openingMessage }])
  }, [stage])

  async function sendMessage() {
    if (!input.trim() || aiLoading) return
    const userMsg = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setAiLoading(true)

    const history = newMessages.slice(0, -1).map(m => ({ role: m.role, content: m.content }))
    const aiResponse = await getCoachingResponse(config.systemPrompt, input.trim(), history)
    setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }])
    setAiLoading(false)

    const userCount = newMessages.filter(m => m.role === 'user').length
    if (userCount >= 2 && !showSummary) {
      setTimeout(() => setShowSummary(true), 600)
    }
  }

  async function handleProceed() {
    if (saving) return
    setSaving(true)

    const updateData = { [config.savingField]: summaryText || input }
    if (stage === 'decision') {
      updateData.decision_starts = starts.filter(s => s.trim())
      updateData.decision_stops = stops.filter(s => s.trim())
      updateData.decision_level = decisionLevel
    }

    await supabase.from('drift_to_drive')
      .update(updateData)
      .eq('user_id', user.id)

    await updateProfile({ onboarding_step: stage === 'decision' ? 'anchor_goal' : config.nextRoute.split('/').pop() })
    navigate(config.nextRoute)
    setSaving(false)
  }

  const canProceed = stage === 'decision'
    ? starts.some(s => s.trim()) && stops.some(s => s.trim()) && decisionLevel
    : summaryText.trim().length > 20

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        padding: 'var(--space-lg) var(--space-xl)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(33,32,32,0.95)', backdropFilter: 'blur(12px)',
      }}>
        <WrapLogo size="sm" />
        <StepIndicator steps={ONBOARDING_STEPS} currentStep={config.index} />
        <div style={{ width: 80 }} />
      </header>

      <div style={{
        flex: 1, maxWidth: 680, width: '100%', margin: '0 auto',
        padding: 'var(--space-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)',
      }}>
        <div style={{ animation: 'fadeUp 0.4s ease forwards' }}>
          <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8 }}>
            {config.accentNote}
          </p>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>{config.title}</h1>
          {config.subtitle && <p style={{ marginTop: 8, color: 'var(--text-muted)', fontSize: '0.9rem' }}>{config.subtitle}</p>}
        </div>

        {/* Conversation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', animation: 'fadeUp 0.3s ease forwards' }}>
              {msg.role === 'assistant' && (
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--orange-primary), var(--orange-deep))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: '#fff', flexShrink: 0, marginRight: 10, marginTop: 4 }}>S</div>
              )}
              <div style={{
                maxWidth: '80%', padding: '0.875rem 1.125rem',
                borderRadius: msg.role === 'user' ? 'var(--radius-lg) var(--radius-md) var(--radius-sm) var(--radius-lg)' : 'var(--radius-md) var(--radius-lg) var(--radius-lg) var(--radius-sm)',
                background: msg.role === 'user' ? 'linear-gradient(135deg, var(--orange-primary), var(--orange-deep))' : 'var(--bg-card)',
                color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
                fontSize: '0.95rem', lineHeight: 1.65, whiteSpace: 'pre-wrap',
              }}>
                {msg.content}
              </div>
            </div>
          ))}
          {aiLoading && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--orange-primary), var(--orange-deep))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>S</div>
              <TypingIndicator />
            </div>
          )}
        </div>

        {/* Input */}
        {!showSummary && (
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
              placeholder="Your response… (Enter to send)" rows={3}
              style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--radius-md)', padding: '0.875rem 1rem', color: 'var(--text-primary)', fontSize: '0.95rem', fontFamily: 'var(--font-body)', lineHeight: 1.6, resize: 'none', outline: 'none' }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
            />
            <Button variant="primary" onClick={sendMessage} disabled={!input.trim() || aiLoading} style={{ alignSelf: 'flex-end', padding: '0.875rem 1.25rem' }}>Send</Button>
          </div>
        )}

        {/* Summary / exercises */}
        {showSummary && (
          <div style={{ animation: 'fadeUp 0.4s ease forwards' }}>
            {/* Standard summary textarea */}
            {!config.hasStartStop && (
              <div style={{ background: 'rgba(253,155,14,0.06)', border: '1px solid rgba(253,155,14,0.2)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)', marginBottom: 'var(--space-lg)' }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 10 }}>Capture it</p>
                <h3 style={{ marginBottom: 'var(--space-md)' }}>{config.summaryLabel}</h3>
                <Textarea rows={5} placeholder={config.summaryPlaceholder} value={summaryText} onChange={e => setSummaryText(e.target.value)} />
              </div>
            )}

            {/* Decision Start/Stop */}
            {config.hasStartStop && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
                {/* Decision level */}
                <div style={{ background: 'rgba(253,155,14,0.06)', border: '1px solid rgba(253,155,14,0.2)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)' }}>
                  <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 10 }}>Your commitment level</p>
                  <h3 style={{ marginBottom: 'var(--space-lg)' }}>How are you deciding?</h3>
                  <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
                    {['wish', 'hope', 'commitment'].map(level => (
                      <button key={level} onClick={() => setDecisionLevel(level)} style={{
                        flex: 1, minWidth: 100, padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
                        border: `1.5px solid ${decisionLevel === level ? 'var(--accent)' : 'rgba(255,255,255,0.1)'}`,
                        background: decisionLevel === level ? 'rgba(253,155,14,0.1)' : 'var(--bg-card)',
                        color: decisionLevel === level ? 'var(--accent)' : 'var(--text-secondary)',
                        fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.875rem',
                        cursor: 'pointer', transition: 'all var(--transition-base)',
                        textTransform: 'capitalize',
                      }}>
                        {level === 'commitment' ? '🔥 ' : level === 'hope' ? '🌤 ' : '💭 '}{level}
                      </button>
                    ))}
                  </div>
                  {decisionLevel === 'commitment' && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--accent)', marginTop: 10, fontStyle: 'italic' }}>
                      That's the only level that moves you forward. Let's make it real.
                    </p>
                  )}
                </div>

                {/* Start list */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)' }}>
                  <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6ee7b7', marginBottom: 10 }}>START doing</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {starts.map((s, i) => (
                      <input key={i} value={s} onChange={e => setStarts(prev => prev.map((v, j) => j === i ? e.target.value : v))}
                        placeholder={`Thing to start #${i + 1}`}
                        style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--radius-sm)', padding: '0.625rem 0.875rem', color: 'var(--text-primary)', fontSize: '0.9rem', fontFamily: 'var(--font-body)', outline: 'none', width: '100%' }}
                        onFocus={e => e.target.style.borderColor = '#6ee7b7'}
                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                      />
                    ))}
                    {starts.length < 5 && <Button variant="ghost" size="sm" onClick={() => setStarts(p => [...p, ''])} style={{ alignSelf: 'flex-start', color: '#6ee7b7' }}>+ Add another</Button>}
                  </div>
                </div>

                {/* Stop list */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)' }}>
                  <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#fca5a5', marginBottom: 10 }}>STOP doing</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {stops.map((s, i) => (
                      <input key={i} value={s} onChange={e => setStops(prev => prev.map((v, j) => j === i ? e.target.value : v))}
                        placeholder={`Thing to stop #${i + 1}`}
                        style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--radius-sm)', padding: '0.625rem 0.875rem', color: 'var(--text-primary)', fontSize: '0.9rem', fontFamily: 'var(--font-body)', outline: 'none', width: '100%' }}
                        onFocus={e => e.target.style.borderColor = '#fca5a5'}
                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                      />
                    ))}
                    {stops.length < 5 && <Button variant="ghost" size="sm" onClick={() => setStops(p => [...p, ''])} style={{ alignSelf: 'flex-start', color: '#fca5a5' }}>+ Add another</Button>}
                  </div>
                </div>
              </div>
            )}

            <Button variant="primary" size="lg" fullWidth disabled={!canProceed || saving} loading={saving} onClick={handleProceed}>
              {config.nextLabel}
            </Button>
          </div>
        )}
      </div>
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:none; } }`}</style>
    </div>
  )
}

// Named exports for each stage
export function DesireStagePage() { return <StageComponent stage="desire" /> }
export function DisturbanceStagePage() { return <StageComponent stage="disturbance" /> }
export function DecisionStagePage() { return <StageComponent stage="decision" /> }
