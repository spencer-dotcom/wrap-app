import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase, getCoachingResponse } from '../../lib/supabase'
import { Button, Textarea, StepIndicator, TypingIndicator, WrapLogo } from '../../components/UI'

const ONBOARDING_STEPS = ['Dream', 'Desire', 'Disturbance', 'Decision', 'Anchor Goal', 'Life Arenas']
const STORAGE_KEY = 'wrap_dream_draft'

const DREAM_SYSTEM_PROMPT = `You are Spencer Combs, author of Momentum & Mastery and creator of the WRAP life management system. You are guiding someone through the Dream stage of the Drift to Drive framework.

YOUR MISSION: Extract their detailed dream state across all 5 Life Arenas in sequence. The conversation should feel like coaching — warm, direct, and challenging — not a checklist.

THE 5 ARENAS (guide them through in this exact order):
1. Spiritual / Purpose — who they're becoming, calling, faith, meaning, what drives them at the deepest level
2. Health — physical state, energy, vitality, what their body can do, how they feel every day
3. Relationships — marriage, family, inner circle, community, how they show up for the people they love
4. Career / Value — the work itself, the impact, who they serve, what a great day looks like, their legacy
5. Financial — income, wealth, what freedom looks like in real numbers and real lifestyle

YOUR PROCESS:
- Start by letting them describe their dream freely — don't interrupt, just absorb
- After their first response, acknowledge what they shared specifically (name the details they gave you), then guide them toward the FIRST arena they haven't meaningfully covered yet
- Move through one arena at a time — ask one focused question, let them respond fully, then move to the next uncovered arena
- If they naturally cover multiple arenas in one response, acknowledge all of them and only ask about what's still missing
- Keep your responses to 3-4 sentences max. One question at a time.
- Reference their exact words and situations back to them — make them feel truly heard before you push further
- Challenge vague answers ("what does that actually look like on a Tuesday morning?")
- Do NOT use bullet points or numbered lists — pure conversational coaching language only
- Do NOT rush — this conversation should feel complete and unhurried

ARENA TRANSITION EXAMPLES (adapt these naturally, don't copy verbatim):
- To Spiritual: "Before we go further — who are you becoming through all of this? What does your sense of purpose or faith look like in this dream life?"
- To Health: "Paint me a picture of your body and energy. What does your physical life look like when everything is exactly right?"
- To Relationships: "Tell me about the people in this dream. Your marriage, your kids, your inner circle — what does that look like when it's everything you want it to be?"
- To Career: "Describe the work itself. What are you doing, who are you serving, and what does a day of meaningful work feel like?"
- To Financial: "And the financial reality — what does freedom actually look like for you? Give me real numbers and real lifestyle."

WHEN ALL FIVE ARENAS HAVE BEEN COVERED WITH MEANINGFUL RESPONSES:
Say exactly this phrase to signal synthesis is ready:
"I have everything I need to reflect your dream back to you. Give me a moment."

DO NOT say that phrase until all five arenas have genuine, substantive responses. Quality over speed.`

const SYNTHESIS_PROMPT = `Based on the full Dream stage coaching conversation provided, write a vivid, first-person Magic Wand story that captures this person's dream life across all 5 arenas: Spiritual/Purpose, Health, Relationships, Career/Value, and Financial.

REQUIREMENTS:
- Write entirely in first person, present tense ("I wake up...", "I feel...", "I have...")
- Start with "I wake up"
- Make it specific and sensory — use the actual details, situations, and words they shared
- Weave all 5 arenas together naturally — not as separate sections, as one flowing life
- Length: 4-6 paragraphs
- No headers, no bullet points, no labels — pure narrative
- Make it emotionally alive — reading this should create a physical feeling of possibility
- Include the specific details that matter most to them — their waterfront home, their business, their family moments, their faith life — whatever they actually shared
- Only output the story itself. Start immediately with "I wake up" — no preamble, no "here is your story", nothing before the story.`

const OPENING_MESSAGE = `Welcome. Before we build anything, I want you to do something most people never give themselves permission to do — dream without limits.

So let me ask you this: if you woke up tomorrow and everything in your life was exactly the way you'd always wanted it to be — not what you think is possible, but what you actually want — what would that look like?

Don't filter it. Don't edit for practicality. Just describe the life.`

export default function DreamStagePage() {
  const [messages, setMessages]                 = useState([])
  const [input, setInput]                       = useState('')
  const [aiLoading, setAiLoading]               = useState(false)
  const [phase, setPhase]                       = useState('conversation')
  const [generatedStory, setGeneratedStory]     = useState('')
  const [editedStory, setEditedStory]           = useState('')
  const [valuesIdentified, setValuesIdentified] = useState([])
  const [currentValue, setCurrentValue]         = useState('')
  const [canProceed, setCanProceed]             = useState(false)
  const [saving, setSaving]                     = useState(false)
  const [resumedFrom, setResumedFrom]           = useState(false)
  const bottomRef = useRef(null)

  const { user, updateProfile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const isRedo = new URLSearchParams(location.search).get('redo') === 'true'

  const TRANSITION_PHRASE = "I have everything I need to reflect your dream back to you"

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const draft = JSON.parse(saved)
        if (draft.messages?.length > 1) {
          setMessages(draft.messages)
          setPhase(draft.phase || 'conversation')
          setGeneratedStory(draft.generatedStory || '')
          setEditedStory(draft.editedStory || '')
          setValuesIdentified(draft.valuesIdentified || [])
          if ((draft.valuesIdentified || []).length >= 3) setCanProceed(true)
          setResumedFrom(true)
          return
        }
      } catch (e) {}
    }
    setMessages([{ role: 'assistant', content: OPENING_MESSAGE }])
  }, [])

  // Auto-save
  useEffect(() => {
    if (messages.length === 0) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      messages, phase, generatedStory, editedStory, valuesIdentified
    }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, phase, generatedStory, editedStory, valuesIdentified])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, aiLoading, phase])

  async function sendMessage() {
    if (!input.trim() || aiLoading) return
    const userMsg = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setAiLoading(true)

    const history = newMessages.slice(0, -1).map(m => ({ role: m.role, content: m.content }))
    const aiResponse = await getCoachingResponse(DREAM_SYSTEM_PROMPT, input.trim(), history)

    const assistantMsg = { role: 'assistant', content: aiResponse }
    setMessages(prev => [...prev, assistantMsg])
    setAiLoading(false)

    if (aiResponse.includes(TRANSITION_PHRASE)) {
      setTimeout(() => synthesizeStory([...newMessages, assistantMsg]), 1000)
    }
  }

  async function synthesizeStory(conversationMessages) {
    setPhase('synthesizing')

    const conversationText = conversationMessages
      .map(m => `${m.role === 'user' ? 'Person' : 'Spencer'}: ${m.content}`)
      .join('\n\n')

    const story = await getCoachingResponse(
      SYNTHESIS_PROMPT,
      `Here is the full Dream stage coaching conversation:\n\n${conversationText}`,
      []
    )

    setGeneratedStory(story)
    setEditedStory(story)
    setPhase('confirm')
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
      dream_response: messages.filter(m => m.role === 'user').map(m => m.content).join('\n\n'),
      magic_wand_story: editedStory,
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

  function resetDraft() {
    localStorage.removeItem(STORAGE_KEY)
    setMessages([{ role: 'assistant', content: OPENING_MESSAGE }])
    setPhase('conversation')
    setGeneratedStory('')
    setEditedStory('')
    setValuesIdentified([])
    setCanProceed(false)
    setResumedFrom(false)
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
        {!isRedo
          ? <StepIndicator steps={ONBOARDING_STEPS} currentStep={0} />
          : <p style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600 }}>Revisiting Your Dream</p>
        }
        <div style={{ width: 80 }} />
      </header>

      <div style={{
        flex: 1, maxWidth: 680, width: '100%', margin: '0 auto',
        padding: 'clamp(1rem, 4vw, 1.5rem)',
        display: 'flex', flexDirection: 'column', gap: '1.25rem',
      }}>

        {/* Stage header */}
        {phase === 'conversation' && (
          <div style={{ animation: 'fadeUp 0.4s ease forwards' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 6 }}>
              Stage 1 of 4 — Drift to Drive
            </p>
            <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Dream</h1>
            <p style={{ marginTop: 6, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              A coaching conversation across your 5 Life Arenas. Be specific. Don't edit yourself.
            </p>
          </div>
        )}

        {/* Arena progress indicator */}
        {phase === 'conversation' && messages.filter(m => m.role === 'user').length > 0 && (
          <div style={{ display: 'flex', gap: 6 }}>
            {['🙏 Purpose', '💪 Health', '❤️ Relationships', '🎯 Career', '💰 Financial'].map((arena, i) => (
              <div key={i} style={{
                flex: 1, height: 3, borderRadius: 99,
                background: messages.filter(m => m.role === 'user').length > i * 1.5
                  ? 'linear-gradient(90deg, var(--orange-primary), var(--orange-deep))'
                  : 'var(--bg-card)',
                transition: 'background 0.5s ease',
              }} title={arena} />
            ))}
          </div>
        )}

        {/* Resume banner */}
        {resumedFrom && phase === 'conversation' && (
          <div style={{
            background: 'rgba(110,231,183,0.08)', border: '1px solid rgba(110,231,183,0.2)',
            borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span>💾</span>
            <p style={{ fontSize: '0.82rem', color: '#6ee7b7', margin: 0 }}>
              We saved your progress. Picking up where you left off.
            </p>
            <button onClick={resetDraft} style={{
              marginLeft: 'auto', background: 'none', border: 'none',
              cursor: 'pointer', fontSize: '0.75rem', color: 'var(--text-muted)', padding: 0,
            }}>
              Start over
            </button>
          </div>
        )}

        {/* ── CONVERSATION PHASE ── */}
        {phase === 'conversation' && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {messages.map((msg, i) => (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  animation: 'fadeUp 0.3s ease forwards',
                }}>
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
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--orange-primary), var(--orange-deep))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.75rem', fontWeight: 700, color: '#fff', flexShrink: 0,
                  }}>S</div>
                  <TypingIndicator />
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                placeholder="Share what comes to mind… (Enter to send, Shift+Enter for new line)"
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
              <Button
                variant="primary"
                onClick={sendMessage}
                disabled={!input.trim() || aiLoading}
                style={{ alignSelf: 'flex-end', padding: '0.875rem 1.25rem' }}
              >
                Send
              </Button>
            </div>
          </>
        )}

        {/* ── SYNTHESIZING PHASE ── */}
        {phase === 'synthesizing' && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', minHeight: '50vh', gap: '1.5rem',
            animation: 'fadeUp 0.4s ease forwards',
          }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--orange-primary), var(--orange-deep))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.4rem', fontWeight: 700, color: '#fff',
              animation: 'pulse 1.5s ease infinite',
            }}>S</div>
            <div style={{ textAlign: 'center', maxWidth: 360 }}>
              <h2 style={{ fontSize: '1.3rem', marginBottom: 10 }}>Writing your dream story…</h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Spencer is weaving everything you shared across all 5 arenas into your Magic Wand story.
              </p>
            </div>
            <TypingIndicator />
          </div>
        )}

        {/* ── CONFIRM STORY PHASE ── */}
        {phase === 'confirm' && (
          <div style={{ animation: 'fadeUp 0.4s ease forwards' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 6 }}>
                Your Magic Wand Story
              </p>
              <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', marginBottom: 8 }}>
                Here's what you told me.
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Read this carefully. Edit anything that doesn't feel exactly right — this is your foundation for everything we build.
              </p>
            </div>

            <div style={{
              background: 'rgba(253,155,14,0.06)', border: '1px solid rgba(253,155,14,0.2)',
              borderRadius: 'var(--radius-lg)', padding: 'clamp(1rem, 3vw, 1.5rem)',
              marginBottom: '1.25rem',
            }}>
              <Textarea
                rows={14}
                value={editedStory}
                onChange={e => setEditedStory(e.target.value)}
              />
            </div>

            <Button
              variant="primary" size="lg" fullWidth
              disabled={editedStory.trim().length < 50}
              onClick={() => setPhase('values')}
            >
              This is my dream → Find my values
            </Button>
          </div>
        )}

        {/* ── VALUES PHASE ── */}
        {phase === 'values' && (
          <div style={{ animation: 'fadeUp 0.4s ease forwards' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 6 }}>
                Final Step
              </p>
              <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', marginBottom: 8 }}>
                What does this dream represent?
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Look at your story. When you picture yourself living that life — what would you have a deep sense of? Freedom? Impact? Connection? Legacy? These are your values. Add 3–5.
              </p>
            </div>

            {/* Story preview */}
            <div style={{
              background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem',
              marginBottom: '1.25rem', maxHeight: 140, overflowY: 'auto',
            }}>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>
                {editedStory.slice(0, 350)}{editedStory.length > 350 ? '…' : ''}
              </p>
            </div>

            {/* Values input */}
            <div style={{
              background: 'rgba(253,155,14,0.06)', border: '1px solid rgba(253,155,14,0.2)',
              borderRadius: 'var(--radius-lg)', padding: 'clamp(1rem, 3vw, 1.5rem)',
              marginBottom: '1.25rem',
            }}>
              {valuesIdentified.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: '1rem' }}>
                  {valuesIdentified.map((v, i) => (
                    <span key={i} onClick={() => {
                      const updated = valuesIdentified.filter((_, j) => j !== i)
                      setValuesIdentified(updated)
                      if (updated.length < 3) setCanProceed(false)
                    }} style={{
                      padding: '4px 14px', background: 'rgba(253,155,14,0.15)',
                      border: '1px solid rgba(253,155,14,0.3)', borderRadius: 99,
                      fontSize: '0.875rem', color: 'var(--accent)', cursor: 'pointer', fontWeight: 500,
                    }}>
                      {v} ×
                    </span>
                  ))}
                </div>
              )}

              {valuesIdentified.length < 5 && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    value={currentValue}
                    onChange={e => setCurrentValue(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addValue()}
                    placeholder="e.g. Freedom, Impact, Legacy, Connection, Faith…"
                    style={{
                      flex: 1, background: 'var(--bg-primary)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 'var(--radius-md)', padding: '0.625rem 0.875rem',
                      color: 'var(--text-primary)', fontSize: '0.9rem',
                      fontFamily: 'var(--font-body)', outline: 'none',
                    }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                  <Button variant="outline" size="sm" onClick={addValue} disabled={!currentValue.trim()}>
                    Add
                  </Button>
                </div>
              )}

              {valuesIdentified.length < 3 && (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 10 }}>
                  Add at least 3 values to continue
                </p>
              )}
            </div>

            <Button
              variant="primary" size="lg" fullWidth
              disabled={valuesIdentified.length < 3 || saving}
              loading={saving}
              onClick={handleProceed}
            >
              {isRedo ? 'Save & Return to Dashboard →' : 'Move to Desire →'}
            </Button>
          </div>
        )}

        <div ref={phase !== 'conversation' ? bottomRef : null} />
      </div>

      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:none; } }
        @keyframes pulse  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.8;transform:scale(0.96)} }
      `}</style>
    </div>
  )
}
