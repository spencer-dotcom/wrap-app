import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase, getCoachingResponse } from '../../lib/supabase'
import { Button, Textarea, StepIndicator, TypingIndicator, WrapLogo } from '../../components/UI'

const ONBOARDING_STEPS = ['Dream', 'Desire', 'Disturbance', 'Decision', 'Anchor Goal', 'Life Arenas']
const STORAGE_KEY = 'wrap_dream_draft'

const DREAM_SYSTEM_PROMPT = `You are Spencer Combs, author of Momentum & Mastery and creator of the WRAP life management system. You are guiding a new user through the Dream stage of the Drift to Drive framework.

Your role: Help this person expand their vision beyond their current reality. You're warm, direct, and challenging — not a cheerleader, but a coach who wants the truth. 

The Dream stage is about lifting their gaze from where they are to where they could be. Ask questions that expand their thinking. Use the Magic Wand framework — help them envision their ideal life in vivid detail.

Keep responses concise (2-4 sentences max). Ask one powerful question at a time. Be conversational, not clinical. Reference specifics from what they share. Don't use bullet points or lists — just direct, warm coaching language.

After 2-3 exchanges, help them identify 3-5 values embedded in their dream story. Then signal that you're ready to move to the next stage.`

const OPENING_MESSAGE = `Welcome. Before we build anything, I want you to do something most people never give themselves permission to do — dream without limits.\n\nSo let me ask you this: if you woke up tomorrow and everything in your life was exactly the way you'd always wanted it to be — not what you think is possible, but what you actually want — what would that look like?\n\nDon't filter it. Don't edit for practicality. Just describe the life.`

export default function DreamStagePage() {
  const [messages, setMessages]               = useState([])
  const [input, setInput]                     = useState('')
  const [aiLoading, setAiLoading]             = useState(false)
  const [dreamResponse, setDreamResponse]     = useState('')
  const [magicWandStory, setMagicWandStory]   = useState('')
  const [showMagicWand, setShowMagicWand]     = useState(false)
  const [valuesIdentified, setValuesIdentified] = useState([])
  const [showValuesStep, setShowValuesStep]   = useState(false)
  const [currentValue, setCurrentValue]       = useState('')
  const [canProceed, setCanProceed]           = useState(false)
  const [saving, setSaving]                   = useState(false)
  const [resumedFrom, setResumedFrom]         = useState(false)

  const { user, updateProfile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const isRedo = new URLSearchParams(location.search).get('redo') === 'true'

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const draft = JSON.parse(saved)
        if (draft.messages?.length > 1) {
          setMessages(draft.messages)
          setDreamResponse(draft.dreamResponse || '')
          setMagicWandStory(draft.magicWandStory || '')
          setValuesIdentified(draft.valuesIdentified || [])
          setShowMagicWand(draft.showMagicWand || false)
          setShowValuesStep(draft.showValuesStep || false)
          if ((draft.valuesIdentified || []).length >= 3) setCanProceed(true)
          setResumedFrom(true)
          return
        }
      } catch (e) {}
    }
    // Fresh start
    setMessages([{ role: 'assistant', content: OPENING_MESSAGE }])
  }, [])

  // Auto-save to localStorage whenever state changes
  useEffect(() => {
    if (messages.length === 0) return
    const draft = { messages, dreamResponse, magicWandStory, valuesIdentified, showMagicWand, showValuesStep }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
  }, [messages, dreamResponse, magicWandStory, valuesIdentified, showMagicWand, showValuesStep])

  async function sendMessage() {
    if (!input.trim() || aiLoading) return
    const userMsg = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setAiLoading(true)

    if (!dreamResponse && input.trim().length > 50) {
      setDreamResponse(input.trim())
    }

    const history = newMessages.slice(0, -1).map(m => ({ role: m.role, content: m.content }))
    const aiResponse = await getCoachingResponse(DREAM_SYSTEM_PROMPT, input.trim(), history)
    setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }])
    setAiLoading(false)

    const userCount = newMessages.filter(m => m.role === 'user').length
    if (userCount >= 3 && !showMagicWand) {
      setTimeout(() => setShowMagicWand(true), 800)
    }
  }

  function addValue() {
    if (!currentValue.trim() || valuesIdentified.length >= 5) return
    const updated = [...valuesIdentified, currentValue.trim()]
    setValuesIdentified(updated)
    setCurrentValue('')
    if (updated.length >= 3) setCanProceed(true)
  }

  async function handleProceed() {
    if (!canProceed || saving) return
    setSaving(true)

    const { error } = await supabase.from('drift_to_drive').upsert({
      user_id: user.id,
      dream_response: dreamResponse,
      magic_wand_story: magicWandStory,
      values_identified: valuesIdentified,
    }, { onConflict: 'user_id' })

    if (!error) {
      localStorage.removeItem(STORAGE_KEY)
      if (isRedo) {
        navigate('/dashboard')
      } else {
        await updateProfile({ onboarding_step: 'desire' })
        navigate('/onboarding/desire')
      }
    }
    setSaving(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        padding: '0.875rem clamp(1rem, 4vw, 1.5rem)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(33,32,32,0.95)', backdropFilter: 'blur(12px)',
      }}>
        <div onClick={() => navigate(isRedo ? '/dashboard' : '#')} style={{ cursor: isRedo ? 'pointer' : 'default' }}>
          <WrapLogo size="sm" />
        </div>
        {!isRedo && <StepIndicator steps={ONBOARDING_STEPS} currentStep={0} />}
        {isRedo && <p style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600 }}>Revisiting Your Dream</p>}
        <div style={{ width: 80 }} />
      </header>

      <div style={{
        flex: 1, maxWidth: 680, width: '100%', margin: '0 auto',
        padding: 'clamp(1rem, 4vw, 1.5rem)', display: 'flex', flexDirection: 'column', gap: '1.25rem',
      }}>
        {/* Stage header */}
        <div style={{ animation: 'fadeUp 0.4s ease forwards' }}>
          <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 6 }}>
            Stage 1 of 4 — Drift to Drive
          </p>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Dream</h1>
          <p style={{ marginTop: 6, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Expand your vision beyond current reality. No filters.
          </p>
        </div>

        {/* Resume banner */}
        {resumedFrom && (
          <div style={{
            background: 'rgba(110,231,183,0.08)', border: '1px solid rgba(110,231,183,0.2)',
            borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span>💾</span>
            <p style={{ fontSize: '0.82rem', color: '#6ee7b7', margin: 0 }}>
              We saved your progress. Picking up where you left off.
            </p>
            <button onClick={() => {
              localStorage.removeItem(STORAGE_KEY)
              setMessages([{ role: 'assistant', content: OPENING_MESSAGE }])
              setDreamResponse(''); setMagicWandStory(''); setValuesIdentified([])
              setShowMagicWand(false); setShowValuesStep(false); setCanProceed(false)
              setResumedFrom(false)
            }} style={{
              marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '0.75rem', color: 'var(--text-muted)', padding: 0,
            }}>
              Start over
            </button>
          </div>
        )}

        {/* Conversation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', animation: 'fadeUp 0.3s ease forwards' }}>
              {msg.role === 'assistant' && (
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--orange-primary), var(--orange-deep))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: 700, color: '#fff',
                  flexShrink: 0, marginRight: 8, marginTop: 4,
                }}>S</div>
              )}
              <div style={{
                maxWidth: '82%',
                padding: 'clamp(0.75rem, 2vw, 0.875rem) clamp(0.875rem, 2vw, 1.125rem)',
                borderRadius: msg.role === 'user'
                  ? 'var(--radius-lg) var(--radius-md) var(--radius-sm) var(--radius-lg)'
                  : 'var(--radius-md) var(--radius-lg) var(--radius-lg) var(--radius-sm)',
                background: msg.role === 'user'
                  ? 'linear-gradient(135deg, var(--orange-primary), var(--orange-deep))'
                  : 'var(--bg-card)',
                color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
                fontSize: 'clamp(0.875rem, 2.5vw, 0.95rem)',
                lineHeight: 1.65, whiteSpace: 'pre-wrap',
              }}>
                {msg.content}
              </div>
            </div>
          ))}

          {aiLoading && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, var(--orange-primary), var(--orange-deep))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>S</div>
              <TypingIndicator />
            </div>
          )}
        </div>

        {/* Message input */}
        {!showValuesStep && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
              placeholder="Share what comes to mind… (Enter to send)"
              rows={3}
              style={{
                flex: 1, background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 'var(--radius-md)', padding: '0.875rem 1rem',
                color: 'var(--text-primary)', fontSize: 'clamp(0.875rem, 2.5vw, 0.95rem)',
                fontFamily: 'var(--font-body)', lineHeight: 1.6, resize: 'none', outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
            />
            <Button variant="primary" onClick={sendMessage} disabled={!input.trim() || aiLoading} style={{ alignSelf: 'flex-end', padding: '0.875rem 1.25rem' }}>
              Send
            </Button>
          </div>
        )}

        {/* Magic Wand */}
        {showMagicWand && !showValuesStep && (
          <div style={{
            background: 'rgba(253,155,14,0.06)', border: '1px solid rgba(253,155,14,0.2)',
            borderRadius: 'var(--radius-lg)', padding: 'clamp(1rem, 3vw, 1.5rem)',
            animation: 'fadeUp 0.4s ease forwards',
          }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8 }}>
              The Magic Wand Exercise
            </p>
            <h3 style={{ marginBottom: '0.875rem', fontSize: 'clamp(1rem, 2.5vw, 1.25rem)' }}>Write your ideal day in vivid detail</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              You wake up tomorrow and everything is exactly as you've always wanted. What does the bed feel like? What floor do your feet touch? What does your bank statement show? How is your health? Don't edit. Just write.
            </p>
            <Textarea rows={6} placeholder="Start with 'I wake up and…'" value={magicWandStory} onChange={e => setMagicWandStory(e.target.value)} />
            <Button variant="primary" style={{ marginTop: '1rem' }} disabled={magicWandStory.trim().length < 80} onClick={() => setShowValuesStep(true)}>
              I've written my story →
            </Button>
          </div>
        )}

        {/* Values */}
        {showValuesStep && (
          <div style={{ animation: 'fadeUp 0.4s ease forwards' }}>
            <div style={{
              background: 'rgba(253,155,14,0.06)', border: '1px solid rgba(253,155,14,0.2)',
              borderRadius: 'var(--radius-lg)', padding: 'clamp(1rem, 3vw, 1.5rem)', marginBottom: '1rem',
            }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8 }}>Find Your Values</p>
              <h3 style={{ marginBottom: '0.875rem', fontSize: 'clamp(1rem, 2.5vw, 1.2rem)' }}>Look at your story. What values does it represent?</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Freedom? Impact? Connection? Add 3–5 values you see in your dream.
              </p>
              {valuesIdentified.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: '0.875rem' }}>
                  {valuesIdentified.map((v, i) => (
                    <span key={i} onClick={() => setValuesIdentified(prev => prev.filter((_, j) => j !== i))} style={{
                      padding: '4px 12px', background: 'rgba(253,155,14,0.15)', border: '1px solid rgba(253,155,14,0.3)',
                      borderRadius: 99, fontSize: '0.875rem', color: 'var(--accent)', cursor: 'pointer', fontWeight: 500,
                    }}>
                      {v} ×
                    </span>
                  ))}
                </div>
              )}
              {valuesIdentified.length < 5 && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={currentValue} onChange={e => setCurrentValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && addValue()}
                    placeholder="e.g. Freedom, Purpose, Adventure…"
                    style={{
                      flex: 1, background: 'var(--bg-primary)', border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 'var(--radius-md)', padding: '0.625rem 0.875rem',
                      color: 'var(--text-primary)', fontSize: '0.9rem', fontFamily: 'var(--font-body)', outline: 'none',
                    }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                  <Button variant="outline" size="sm" onClick={addValue} disabled={!currentValue.trim()}>Add</Button>
                </div>
              )}
            </div>

            <Button variant="primary" size="lg" fullWidth disabled={valuesIdentified.length < 3 || saving} loading={saving} onClick={handleProceed}>
              {isRedo ? 'Save & Return to Dashboard →' : 'Move to Desire →'}
            </Button>
            {valuesIdentified.length < 3 && (
              <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 8 }}>Add at least 3 values to continue</p>
            )}
          </div>
        )}
      </div>
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:none; } }`}</style>
    </div>
  )
}
