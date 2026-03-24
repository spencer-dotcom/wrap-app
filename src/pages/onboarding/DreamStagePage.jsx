import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase, getCoachingResponse } from '../../lib/supabase'
import { Button, Textarea, StepIndicator, TypingIndicator, WrapLogo } from '../../components/UI'

const ONBOARDING_STEPS = ['Dream', 'Desire', 'Disturbance', 'Decision', 'Anchor Goal', 'Life Areas']

const DREAM_SYSTEM_PROMPT = `You are Spencer Combs, author of Momentum & Mastery and creator of the WRAP life management system. You are guiding a new user through the Dream stage of the Drift to Drive framework.

Your role: Help this person expand their vision beyond their current reality. You're warm, direct, and challenging — not a cheerleader, but a coach who wants the truth. 

The Dream stage is about lifting their gaze from where they are to where they could be. Ask questions that expand their thinking. Use the Magic Wand framework — help them envision their ideal life in vivid detail.

Keep responses concise (2-4 sentences max). Ask one powerful question at a time. Be conversational, not clinical. Reference specifics from what they share. Don't use bullet points or lists — just direct, warm coaching language.

After 2-3 exchanges, help them identify 3-5 values embedded in their dream story. Then signal that you're ready to move to the next stage.`

export default function DreamStagePage() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [dreamResponse, setDreamResponse] = useState('')
  const [magicWandStory, setMagicWandStory] = useState('')
  const [showMagicWand, setShowMagicWand] = useState(false)
  const [valuesIdentified, setValuesIdentified] = useState([])
  const [showValuesStep, setShowValuesStep] = useState(false)
  const [currentValue, setCurrentValue] = useState('')
  const [canProceed, setCanProceed] = useState(false)
  const [saving, setSaving] = useState(false)

  const { user, updateProfile } = useAuth()
  const navigate = useNavigate()

  // Initialize with coach's opening message
  React.useEffect(() => {
    const opening = {
      role: 'assistant',
      content: `Welcome. Before we build anything, I want you to do something most people never give themselves permission to do — dream without limits.\n\nSo let me ask you this: if you woke up tomorrow and everything in your life was exactly the way you'd always wanted it to be — not what you think is possible, but what you actually want — what would that look like?\n\nDon't filter it. Don't edit for practicality. Just describe the life.`,
    }
    setMessages([opening])
  }, [])

  async function sendMessage() {
    if (!input.trim() || aiLoading) return

    const userMsg = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setAiLoading(true)

    // Track the first substantial response as the dream response
    if (!dreamResponse && input.trim().length > 50) {
      setDreamResponse(input.trim())
    }

    // Build conversation history for API (exclude the first AI message which is the system prompt opening)
    const history = newMessages.slice(0, -1).map(m => ({
      role: m.role,
      content: m.content,
    }))

    const aiResponse = await getCoachingResponse(
      DREAM_SYSTEM_PROMPT,
      input.trim(),
      history
    )

    const assistantMsg = { role: 'assistant', content: aiResponse }
    setMessages(prev => [...prev, assistantMsg])
    setAiLoading(false)

    // After 3 user messages, show the Magic Wand exercise
    const userMessageCount = newMessages.filter(m => m.role === 'user').length
    if (userMessageCount >= 3 && !showMagicWand) {
      setTimeout(() => setShowMagicWand(true), 800)
    }
  }

  function addValue() {
    if (!currentValue.trim() || valuesIdentified.length >= 5) return
    setValuesIdentified(prev => [...prev, currentValue.trim()])
    setCurrentValue('')
    if (valuesIdentified.length >= 2) setCanProceed(true)
  }

  async function handleProceed() {
    if (!canProceed || saving) return
    setSaving(true)

    // Save Dream stage data
    const { error } = await supabase.from('drift_to_drive').upsert({
      user_id: user.id,
      dream_response: dreamResponse,
      magic_wand_story: magicWandStory,
      values_identified: valuesIdentified,
    }, { onConflict: 'user_id' })

    if (!error) {
      await updateProfile({ onboarding_step: 'desire' })
      navigate('/onboarding/desire')
    }
    setSaving(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        padding: 'var(--space-lg) var(--space-xl)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(33,32,32,0.95)',
        backdropFilter: 'blur(12px)',
      }}>
        <WrapLogo size="sm" />
        <StepIndicator steps={ONBOARDING_STEPS} currentStep={0} />
        <div style={{ width: 80 }} />
      </header>

      {/* Main content */}
      <div style={{
        flex: 1,
        maxWidth: 680,
        width: '100%',
        margin: '0 auto',
        padding: 'var(--space-xl)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-xl)',
      }}>

        {/* Stage header */}
        <div style={{ animation: 'fadeUp 0.4s ease forwards' }}>
          <p style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'var(--accent)',
            marginBottom: 8,
          }}>
            Stage 1 of 4 — Drift to Drive
          </p>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
            Dream
          </h1>
          <p style={{ marginTop: 8, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Expand your vision beyond current reality. No filters. No practicality edits.
          </p>
        </div>

        {/* Conversation */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-md)',
        }}>
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                animation: 'fadeUp 0.3s ease forwards',
              }}
            >
              {msg.role === 'assistant' && (
                <div style={{
                  width: 32, height: 32,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--orange-primary), var(--orange-deep))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.8rem', fontWeight: 700, color: '#fff',
                  flexShrink: 0, marginRight: 10, marginTop: 4,
                }}>
                  S
                </div>
              )}
              <div style={{
                maxWidth: '80%',
                padding: '0.875rem 1.125rem',
                borderRadius: msg.role === 'user'
                  ? 'var(--radius-lg) var(--radius-md) var(--radius-sm) var(--radius-lg)'
                  : 'var(--radius-md) var(--radius-lg) var(--radius-lg) var(--radius-sm)',
                background: msg.role === 'user'
                  ? 'linear-gradient(135deg, var(--orange-primary), var(--orange-deep))'
                  : 'var(--bg-card)',
                color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
                fontSize: '0.95rem',
                lineHeight: 1.65,
                whiteSpace: 'pre-wrap',
              }}>
                {msg.content}
              </div>
            </div>
          ))}

          {aiLoading && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--orange-primary), var(--orange-deep))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.8rem', fontWeight: 700, color: '#fff', flexShrink: 0,
              }}>S</div>
              <TypingIndicator />
            </div>
          )}
        </div>

        {/* Message input */}
        {!showValuesStep && (
          <div style={{
            display: 'flex',
            gap: 'var(--space-sm)',
            position: 'sticky',
            bottom: 'var(--space-lg)',
          }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
              placeholder="Share what comes to mind… (Enter to send)"
              rows={3}
              style={{
                flex: 1,
                background: 'var(--bg-card)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 'var(--radius-md)',
                padding: '0.875rem 1rem',
                color: 'var(--text-primary)',
                fontSize: '0.95rem',
                fontFamily: 'var(--font-body)',
                lineHeight: 1.6,
                resize: 'none',
                outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
            />
            <Button
              variant="primary"
              onClick={sendMessage}
              disabled={!input.trim() || aiLoading}
              style={{ alignSelf: 'flex-end', padding: '0.875rem 1.25rem' }}
            >
              Send
            </Button>
          </div>
        )}

        {/* Magic Wand Exercise */}
        {showMagicWand && !showValuesStep && (
          <div style={{
            background: 'rgba(253,155,14,0.06)',
            border: '1px solid rgba(253,155,14,0.2)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-xl)',
            animation: 'fadeUp 0.4s ease forwards',
          }}>
            <p style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--accent)',
              marginBottom: 10,
            }}>
              The Magic Wand Exercise
            </p>
            <h3 style={{ marginBottom: 'var(--space-md)' }}>
              Write your ideal day in vivid detail
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 'var(--space-lg)' }}>
              You wake up tomorrow and everything is exactly as you've always wanted. What does the bed feel like? What floor do your feet touch? What do you see, hear, feel? What does your bank statement show? How is your health? Don't edit. Just write.
            </p>
            <Textarea
              rows={8}
              placeholder="Start with 'I wake up and…'"
              value={magicWandStory}
              onChange={e => setMagicWandStory(e.target.value)}
            />
            <Button
              variant="primary"
              style={{ marginTop: 'var(--space-lg)' }}
              disabled={magicWandStory.trim().length < 80}
              onClick={() => setShowValuesStep(true)}
            >
              I've written my story →
            </Button>
          </div>
        )}

        {/* Values identification */}
        {showValuesStep && (
          <div style={{ animation: 'fadeUp 0.4s ease forwards' }}>
            <div style={{
              background: 'rgba(253,155,14,0.06)',
              border: '1px solid rgba(253,155,14,0.2)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-xl)',
              marginBottom: 'var(--space-lg)',
            }}>
              <p style={{
                fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 10,
              }}>
                Find Your Values
              </p>
              <h3 style={{ marginBottom: 'var(--space-md)' }}>
                Look at your story. What values does it represent?
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 'var(--space-lg)' }}>
                When you picture yourself in that story, what would you have a sense of? Freedom? Impact? Connection? Add 3–5 values you see in your dream.
              </p>

              {/* Added values */}
              {valuesIdentified.length > 0 && (
                <div style={{
                  display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 'var(--space-md)',
                }}>
                  {valuesIdentified.map((v, i) => (
                    <span
                      key={i}
                      onClick={() => setValuesIdentified(prev => prev.filter((_, j) => j !== i))}
                      style={{
                        padding: '4px 14px',
                        background: 'rgba(253,155,14,0.15)',
                        border: '1px solid rgba(253,155,14,0.3)',
                        borderRadius: 99,
                        fontSize: '0.875rem',
                        color: 'var(--accent)',
                        cursor: 'pointer',
                        fontWeight: 500,
                      }}
                      title="Click to remove"
                    >
                      {v} ×
                    </span>
                  ))}
                </div>
              )}

              {valuesIdentified.length < 5 && (
                <div style={{ display: 'flex', gap: 10 }}>
                  <input
                    value={currentValue}
                    onChange={e => setCurrentValue(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addValue()}
                    placeholder="e.g. Freedom, Purpose, Adventure…"
                    style={{
                      flex: 1,
                      background: 'var(--bg-primary)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.625rem 0.875rem',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      fontFamily: 'var(--font-body)',
                      outline: 'none',
                    }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                  <Button variant="outline" size="sm" onClick={addValue} disabled={!currentValue.trim()}>
                    Add
                  </Button>
                </div>
              )}
            </div>

            <Button
              variant="primary"
              size="lg"
              fullWidth
              disabled={valuesIdentified.length < 3 || saving}
              loading={saving}
              onClick={handleProceed}
            >
              Move to Desire →
            </Button>

            {valuesIdentified.length < 3 && (
              <p style={{
                textAlign: 'center',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                marginTop: 10,
              }}>
                Add at least 3 values to continue
              </p>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:none; } }
      `}</style>
    </div>
  )
}
