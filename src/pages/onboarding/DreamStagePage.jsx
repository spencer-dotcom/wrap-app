import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase, getCoachingResponse } from '../../lib/supabase'
import { Button, Textarea, StepIndicator, TypingIndicator, WrapLogo } from '../../components/UI'

const ONBOARDING_STEPS = ['Dream', 'Desire', 'Disturbance', 'Decision', 'Anchor Goal', 'Life Arenas']
const STORAGE_KEY = 'wrap_dream_draft'
const DRAFT_VERSION = 3 // increment this when the draft format changes

const DREAM_SYSTEM_PROMPT = `You are Spencer Combs, author of Momentum & Mastery and creator of the WRAP life management system. You are guiding someone through the Dream stage of the Drift to Drive framework.

YOUR MISSION: Extract their detailed dream state across all 5 Life Arenas in sequence. The conversation should feel like coaching — warm, direct, and challenging — not a checklist.

THE 5 ARENAS (guide them through in this exact order):
1. Spiritual / Purpose — who they're becoming, calling, faith, meaning, what drives them at the deepest level
2. Health — physical state, energy, vitality, what their body can do, how they feel every day
3. Relationships — marriage, family, inner circle, community, how they show up for the people they love
4. Career / Value — the work itself, the impact, who they serve, what a great day looks like, their legacy
5. Financial — income, wealth, what freedom looks like in real numbers and real lifestyle

YOUR PROCESS:
- Start by letting them describe their dream freely
- After their first response, acknowledge what they shared specifically, then guide them toward the FIRST arena they haven't meaningfully covered yet
- Move through one arena at a time — ask one focused question, let them respond fully, then move to the next
- If they naturally cover multiple arenas in one response, acknowledge all and ask about what's still missing
- Keep responses to 3-4 sentences max. One question at a time.
- Reference their exact words back to them — make them feel truly heard before pushing further
- Challenge vague answers ("what does that actually look like on a Tuesday morning?")
- No bullet points — pure conversational coaching language only

ARENA TRANSITION EXAMPLES (adapt naturally):
- To Spiritual: "Before we go further — who are you becoming through all of this? What does your sense of purpose or faith look like in this dream life?"
- To Health: "Paint me a picture of your body and energy. What does your physical life look like when everything is exactly right?"
- To Relationships: "Tell me about the people in this dream. Your marriage, your kids, your inner circle — what does that look like when it's everything you want it to be?"
- To Career: "Describe the work itself. What are you doing, who are you serving, and what does a day of meaningful work feel like?"
- To Financial: "And the financial reality — what does freedom actually look like for you? Give me real numbers and real lifestyle."

WHEN ALL FIVE ARENAS HAVE BEEN COVERED WITH MEANINGFUL RESPONSES:
Say exactly this phrase: "I have everything I need to reflect your dream back to you. Give me a moment."
DO NOT say that phrase until all five arenas have genuine, substantive responses.`

const SYNTHESIS_PROMPT = `Based on the full Dream stage coaching conversation provided, write a vivid, first-person Magic Wand story that captures this person's dream life across all 5 arenas: Spiritual/Purpose, Health, Relationships, Career/Value, and Financial.

REQUIREMENTS:
- Write entirely in first person, present tense ("I wake up...", "I feel...", "I have...")
- Start with "I wake up"
- Make it specific and sensory — use the actual details, situations, and words they shared
- Weave all 5 arenas together naturally as one flowing life — not separate sections
- Length: 4-6 paragraphs. No headers, no bullet points.
- Make it emotionally alive — reading this should create a physical feeling of possibility
- Only output the story itself. Start immediately with "I wake up" — no preamble.`

const VALUES_ELICITATION_PROMPT = `You are Spencer Combs doing a values elicitation exercise with someone who just described their dream life and wrote their Magic Wand story.

YOUR PROCESS (NLP chunking up technique):
1. Read their dream story carefully and identify the 3-5 most vivid, emotionally charged elements
2. For the first element, ask: "By having [that specific thing from their story], that gives you a sense of what?"
3. Their answer is often the value — or you may need one more level: "And by having that sense of [X], what does that give you at your core?"
4. Name the value you heard, confirm it, then move to the next emotionally charged element
5. After covering 3-5 elements, you have their values

RULES:
- Ask about ONE element at a time — never list multiple questions
- Use their EXACT words from the story
- Keep responses short — 2-3 sentences max
- Be warm and affirming when they identify a value — "Yes, that's it exactly."
- When you have extracted and confirmed 3-5 values through the conversation, end your message with this exact format on its own line:
VALUES_COMPLETE:[Value1,Value2,Value3]
Only include that line when you have genuinely confirmed at least 3 values. Not before.`

const OPENING_MESSAGE = `Welcome. Before we build anything, I want you to do something most people never give themselves permission to do — dream without limits.

So let me ask you this: if you woke up tomorrow and everything in your life was exactly the way you'd always wanted it to be — not what you think is possible, but what you actually want — what would that look like?

Don't filter it. Don't edit for practicality. Just describe the life.`

/* ── Onboarding Nav Header ─────────────────────────────────── */
function OnboardingHeader({ stepIndex, isRedo, profile, user, onSaveAndClose, onSignOut }) {
  const [showMenu, setShowMenu] = useState(false)
  const navigate = useNavigate()
  const firstName = profile?.full_name?.split(' ')[0] || ''

  return (
    <header style={{
      padding: '0.875rem clamp(1rem, 4vw, 1.5rem)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 10,
      background: 'rgba(33,32,32,0.95)', backdropFilter: 'blur(12px)',
    }}>
      <div onClick={() => isRedo && navigate('/dashboard')} style={{ cursor: isRedo ? 'pointer' : 'default' }}>
        <WrapLogo size="sm" />
      </div>

      {!isRedo
        ? <StepIndicator steps={ONBOARDING_STEPS} currentStep={stepIndex} />
        : <p style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600 }}>Revisiting Your Dream</p>
      }

      {/* Avatar with dropdown */}
      <div style={{ position: 'relative' }}>
        <div onClick={() => setShowMenu(p => !p)} style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--orange-primary), var(--orange-deep))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.8rem', fontWeight: 700, color: '#fff', cursor: 'pointer',
        }}>
          {(firstName[0] || '?').toUpperCase()}
        </div>

        {showMenu && (
          <div style={{
            position: 'absolute', top: 40, right: 0, zIndex: 100,
            background: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 'var(--radius-md)', minWidth: 210,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)', overflow: 'hidden',
            animation: 'fadeUp 0.2s ease forwards',
          }}>
            {/* User info */}
            <div style={{ padding: '0.875rem 1.125rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                {profile?.full_name || 'Account'}
              </p>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>{user?.email}</p>
            </div>

            {/* Save & Continue Later */}
            <button onClick={() => { setShowMenu(false); onSaveAndClose() }} style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '0.75rem 1.125rem', background: 'none', border: 'none',
              cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '0.875rem',
              color: 'var(--text-secondary)', transition: 'all var(--transition-fast)',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.color = 'var(--text-primary)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-secondary)' }}
            >
              💾 Save & Continue Later
            </button>

            {/* Sign out */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button onClick={() => { setShowMenu(false); onSignOut() }} style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '0.75rem 1.125rem', background: 'none', border: 'none',
                cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '0.875rem',
                color: '#fca5a5', transition: 'all var(--transition-fast)',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(252,165,165,0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

/* ── Main Component ─────────────────────────────────────────── */
export default function DreamStagePage() {
  const [messages, setMessages]                 = useState([])
  const [valuesMessages, setValuesMessages]     = useState([])
  const [input, setInput]                       = useState('')
  const [valuesInput, setValuesInput]           = useState('')
  const [aiLoading, setAiLoading]               = useState(false)
  const [phase, setPhase]                       = useState('conversation')
  const [editedStory, setEditedStory]           = useState('')
  const [valuesIdentified, setValuesIdentified] = useState([])
  const [saving, setSaving]                     = useState(false)
  const [saveError, setSaveError]               = useState('')
  const [resumedFrom, setResumedFrom]           = useState(false)
  const [saved, setSaved]                       = useState(false)
  const bottomRef = useRef(null)

  const { user, profile, signOut, updateProfile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const isRedo = new URLSearchParams(location.search).get('redo') === 'true'
  const TRANSITION_PHRASE = "I have everything I need to reflect your dream back to you"

  // Load from localStorage — with version check
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const draft = JSON.parse(saved)
        // Version mismatch — discard stale draft
        if (draft.version !== DRAFT_VERSION) {
          localStorage.removeItem(STORAGE_KEY)
        } else if (draft.messages?.length > 1) {
          setMessages(draft.messages)
          setPhase(draft.phase || 'conversation')
          setEditedStory(draft.editedStory || '')
          setValuesMessages(draft.valuesMessages || [])
          setValuesIdentified(draft.valuesIdentified || [])
          setResumedFrom(true)
          return
        }
      } catch (e) {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
    setMessages([{ role: 'assistant', content: OPENING_MESSAGE }])
  }, [])

  // Auto-save with version
  useEffect(() => {
    if (messages.length === 0) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: DRAFT_VERSION,
      messages, phase, editedStory, valuesMessages, valuesIdentified,
    }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, phase, editedStory, valuesMessages, valuesIdentified])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, valuesMessages, aiLoading, phase])

  // Save & Continue Later
  async function handleSaveAndClose() {
    setSaving(true)
    // Save current onboarding_step so resume detection works
    await updateProfile({ onboarding_step: 'dream' })
    setSaving(false)
    setSaved(true)
    setTimeout(() => navigate('/dashboard'), 1500)
  }

  async function handleSignOut() {
    await signOut()
    navigate('/auth')
  }

  // ── CONVERSATION ──────────────────────────────────────────────
  async function sendMessage() {
    if (!input.trim() || aiLoading) return
    const userMsg = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setAiLoading(true)

    const history = newMessages.slice(0, -1).map(m => ({ role: m.role, content: m.content }))
    const aiResponse = await getCoachingResponse(DREAM_SYSTEM_PROMPT, input.trim(), history)
    setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }])
    setAiLoading(false)

    if (aiResponse.includes(TRANSITION_PHRASE)) {
      setTimeout(() => synthesizeStory([...newMessages, { role: 'assistant', content: aiResponse }]), 1000)
    }
  }

  // ── SYNTHESIS ─────────────────────────────────────────────────
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
    setEditedStory(story)
    setPhase('confirm')
  }

  // ── VALUES ELICITATION ────────────────────────────────────────
  async function startValuesElicitation() {
    setPhase('values')
    setAiLoading(true)

    const openingPrompt = `Here is the person's Magic Wand story:\n\n${editedStory}\n\nBegin the values elicitation. Identify the most emotionally vivid element from their story and ask the first chunking-up question.`
    const aiResponse = await getCoachingResponse(VALUES_ELICITATION_PROMPT, openingPrompt, [])
    setValuesMessages([{ role: 'assistant', content: aiResponse }])
    setAiLoading(false)
  }

  async function sendValuesMessage() {
    if (!valuesInput.trim() || aiLoading) return
    const userMsg = { role: 'user', content: valuesInput.trim() }
    const newMessages = [...valuesMessages, userMsg]
    setValuesMessages(newMessages)
    setValuesInput('')
    setAiLoading(true)

    const history = newMessages.slice(0, -1).map(m => ({ role: m.role, content: m.content }))
    const aiResponse = await getCoachingResponse(VALUES_ELICITATION_PROMPT, valuesInput.trim(), history)

    if (aiResponse.includes('VALUES_COMPLETE:')) {
      const match = aiResponse.match(/VALUES_COMPLETE:\[([^\]]+)\]/)
      if (match) {
        const extracted = match[1].split(',').map(v => v.trim()).filter(Boolean)
        setValuesIdentified(extracted)
      }
      const cleanResponse = aiResponse.replace(/VALUES_COMPLETE:\[[^\]]+\]/g, '').trim()
      setValuesMessages(prev => [...prev, { role: 'assistant', content: cleanResponse }])
    } else {
      setValuesMessages(prev => [...prev, { role: 'assistant', content: aiResponse }])
    }
    setAiLoading(false)
  }

  // ── SAVE & PROCEED ────────────────────────────────────────────
  async function handleProceed() {
    if (saving) return
    setSaving(true)
    setSaveError('')

    try {
      const payload = {
        user_id: user.id,
        dream_response: messages.filter(m => m.role === 'user').map(m => m.content).join('\n\n'),
        magic_wand_story: editedStory,
        values_identified: valuesIdentified,
      }

      // Try update first (row likely exists for returning users)
      const { error: updateError, data: updateData } = await supabase
        .from('drift_to_drive')
        .update(payload)
        .eq('user_id', user.id)
        .select()

      // If no row existed, insert instead
      if (!updateError && (!updateData || updateData.length === 0)) {
        const { error: insertError } = await supabase
          .from('drift_to_drive')
          .insert(payload)
        if (insertError) {
          setSaveError('Something went wrong saving. Please try again.')
          setSaving(false)
          return
        }
      } else if (updateError) {
        setSaveError('Something went wrong saving. Please try again.')
        setSaving(false)
        return
      }

      localStorage.removeItem(STORAGE_KEY)
      if (isRedo) {
        navigate('/dashboard')
      } else {
        await updateProfile({ onboarding_step: 'desire' })
        navigate('/onboarding/desire')
      }
    } catch (e) {
      setSaveError('Connection error. Please check your internet and try again.')
      setSaving(false)
    }
  }

  function resetDraft() {
    localStorage.removeItem(STORAGE_KEY)
    setMessages([{ role: 'assistant', content: OPENING_MESSAGE }])
    setValuesMessages([])
    setPhase('conversation')
    setEditedStory('')
    setValuesIdentified([])
    setResumedFrom(false)
  }

  // ── SAVED CONFIRMATION ────────────────────────────────────────
  if (saved) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', padding: '2rem' }}>
        <div style={{ fontSize: '3rem' }}>💾</div>
        <h2 style={{ textAlign: 'center' }}>Your progress is saved.</h2>
        <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
          Sign back in anytime and we'll pick up exactly where you left off.
        </p>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Returning to dashboard…</p>
      </div>
    )
  }

  // ── RENDER ────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <OnboardingHeader
        stepIndex={0}
        isRedo={isRedo}
        profile={profile}
        user={user}
        onSaveAndClose={handleSaveAndClose}
        onSignOut={handleSignOut}
      />

      <div style={{
        flex: 1, maxWidth: 680, width: '100%', margin: '0 auto',
        padding: 'clamp(1rem, 4vw, 1.5rem)',
        display: 'flex', flexDirection: 'column', gap: '1.25rem',
      }}>

        {/* ── CONVERSATION PHASE ── */}
        {phase === 'conversation' && (
          <>
            <div style={{ animation: 'fadeUp 0.4s ease forwards' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 6 }}>
                Stage 1 of 4 — Drift to Drive
              </p>
              <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Dream</h1>
              <p style={{ marginTop: 6, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                A coaching conversation across your 5 Life Arenas. Be specific. Don't edit yourself.
              </p>
            </div>

            {/* Arena progress */}
            {messages.filter(m => m.role === 'user').length > 0 && (
              <div style={{ display: 'flex', gap: 5 }}>
                {['Purpose', 'Health', 'Relationships', 'Career', 'Financial'].map((arena, i) => (
                  <div key={i} title={arena} style={{
                    flex: 1, height: 3, borderRadius: 99,
                    background: messages.filter(m => m.role === 'user').length > i * 1.5
                      ? 'linear-gradient(90deg, var(--orange-primary), var(--orange-deep))'
                      : 'var(--bg-card)',
                    transition: 'background 0.5s ease',
                  }} />
                ))}
              </div>
            )}

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
                <button onClick={resetDraft} style={{
                  marginLeft: 'auto', background: 'none', border: 'none',
                  cursor: 'pointer', fontSize: '0.75rem', color: 'var(--text-muted)', padding: 0,
                }}>
                  Start over
                </button>
              </div>
            )}

            {/* Messages */}
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
              <Button variant="primary" onClick={sendMessage} disabled={!input.trim() || aiLoading}
                style={{ alignSelf: 'flex-end', padding: '0.875rem 1.25rem' }}>
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
              <Textarea rows={14} value={editedStory} onChange={e => setEditedStory(e.target.value)} />
            </div>

            <Button
              variant="primary" size="lg" fullWidth
              disabled={editedStory.trim().length < 50 || aiLoading}
              loading={aiLoading}
              onClick={startValuesElicitation}
            >
              This is my dream → Discover my values
            </Button>
          </div>
        )}

        {/* ── VALUES ELICITATION PHASE ── */}
        {phase === 'values' && (
          <div style={{ animation: 'fadeUp 0.4s ease forwards' }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 6 }}>
                Values Elicitation
              </p>
              <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', marginBottom: 8 }}>
                What does this dream represent?
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Spencer will ask you about the most meaningful parts of your dream. Answer honestly — your values are in your answers.
              </p>
            </div>

            {/* Values conversation */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
              {valuesMessages.map((msg, i) => (
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
                    maxWidth: '82%', padding: '0.75rem 1.125rem',
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

            {/* Extracted values */}
            {valuesIdentified.length >= 3 && (
              <div style={{
                background: 'rgba(110,231,183,0.08)', border: '1px solid rgba(110,231,183,0.25)',
                borderRadius: 'var(--radius-lg)', padding: '1.25rem',
                marginBottom: '1.25rem', animation: 'fadeUp 0.4s ease forwards',
              }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6ee7b7', marginBottom: 12 }}>
                  Your Core Values
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {valuesIdentified.map((v, i) => (
                    <span key={i} style={{
                      padding: '6px 16px', background: 'rgba(110,231,183,0.12)',
                      border: '1px solid rgba(110,231,183,0.3)', borderRadius: 99,
                      fontSize: '0.9rem', color: '#6ee7b7', fontWeight: 600,
                    }}>{v}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            {!aiLoading && valuesMessages.length > 0 && (
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <textarea
                  value={valuesInput}
                  onChange={e => setValuesInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendValuesMessage() } }}
                  placeholder={valuesIdentified.length >= 3 ? "Add anything or confirm you're done…" : "Your answer… (Enter to send)"}
                  rows={2}
                  style={{
                    flex: 1, background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 'var(--radius-md)', padding: '0.875rem 1rem',
                    color: 'var(--text-primary)', fontSize: '0.95rem',
                    fontFamily: 'var(--font-body)', lineHeight: 1.6, resize: 'none', outline: 'none',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                />
                <Button
                  variant={valuesIdentified.length >= 3 ? 'secondary' : 'primary'}
                  onClick={sendValuesMessage}
                  disabled={!valuesInput.trim() || aiLoading}
                  style={{ alignSelf: 'flex-end', padding: '0.875rem 1.25rem' }}
                >
                  Send
                </Button>
              </div>
            )}

            {saveError && (
              <p style={{ fontSize: '0.85rem', color: '#fca5a5', textAlign: 'center', marginBottom: '1rem' }}>
                {saveError}
              </p>
            )}

            {valuesIdentified.length >= 3 && (
              <Button variant="primary" size="lg" fullWidth disabled={saving} loading={saving} onClick={handleProceed}>
                {isRedo ? 'Save & Return to Dashboard →' : 'Move to Desire →'}
              </Button>
            )}
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
