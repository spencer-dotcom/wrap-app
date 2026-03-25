import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { Button, Textarea, WrapLogo } from '../components/UI'

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']

function getWeekNumber(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), 1)
  const dayOfMonth = date.getDate()
  return Math.ceil((dayOfMonth + d.getDay()) / 7)
}

export default function WeeklyWrapPage() {
  const [lifeAreas, setLifeAreas]         = useState([])
  const [monthlyObjectives, setMonthlyObjectives] = useState({})
  const [actions, setActions]             = useState({}) // { areaId: [action, ...] }
  const [session, setSession]             = useState(null)
  const [phase, setPhase]                 = useState('review') // review | reflect | plan | commit
  const [activeArea, setActiveArea]       = useState(null)
  const [newAction, setNewAction]         = useState('')
  const [responseType, setResponseType]   = useState('binary')
  const [targetNumber, setTargetNumber]   = useState('')
  const [whatWorked, setWhatWorked]       = useState('')
  const [whatToAdjust, setWhatToAdjust]   = useState('')
  const [commitments, setCommitments]     = useState(['', '', ''])
  const [saving, setSaving]               = useState(false)
  const [loading, setLoading]             = useState(true)

  const { user } = useAuth()
  const navigate = useNavigate()
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const weekNumber = getWeekNumber(now)
  const monthName = MONTH_NAMES[month - 1]

  useEffect(() => {
    if (user) fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function fetchData() {
    const { data: areas } = await supabase
      .from('life_areas').select('*').eq('user_id', user.id).order('sort_order')

    const { data: monthly } = await supabase
      .from('monthly_objectives').select('*')
      .eq('user_id', user.id).eq('year', year).eq('month', month)

    const { data: weeklyActions } = await supabase
      .from('weekly_actions').select('*')
      .eq('user_id', user.id).eq('year', year).eq('month', month).eq('week_number', weekNumber)

    const { data: existingSession } = await supabase
      .from('wrap_sessions').select('*')
      .eq('user_id', user.id).eq('year', year).eq('month', month).eq('week_number', weekNumber)
      .single()

    const monthlyGrouped = {}
    const actionsGrouped = {}
    areas?.forEach(a => {
      monthlyGrouped[a.id] = monthly?.filter(o => o.life_area_id === a.id) || []
      actionsGrouped[a.id] = weeklyActions?.filter(ac => ac.life_area_id === a.id) || []
    })

    setLifeAreas(areas || [])
    setMonthlyObjectives(monthlyGrouped)
    setActions(actionsGrouped)
    setActiveArea(areas?.[0]?.id || null)

    if (existingSession) {
      setSession(existingSession)
      setWhatWorked(existingSession.what_worked || '')
      setWhatToAdjust(existingSession.what_to_adjust || '')
      setCommitments(existingSession.top_commitments || ['', '', ''])
      if (existingSession.completed_at) setPhase('done')
    }

    setLoading(false)
  }

  async function addAction(areaId) {
    if (!newAction.trim() || saving) return
    setSaving(true)

    const { data, error } = await supabase.from('weekly_actions').insert({
      user_id: user.id,
      life_area_id: areaId,
      year, month, week_number: weekNumber,
      action_text: newAction.trim(),
      response_type: responseType,
      target_number: responseType === 'progress' && targetNumber ? parseFloat(targetNumber) : null,
      sort_order: (actions[areaId] || []).length + 1,
    }).select().single()

    if (!error && data) {
      setActions(prev => ({ ...prev, [areaId]: [...(prev[areaId] || []), data] }))
      setNewAction('')
      setTargetNumber('')
    }
    setSaving(false)
  }

  async function updateActionStatus(areaId, actionId, updates) {
    await supabase.from('weekly_actions').update(updates).eq('id', actionId)
    setActions(prev => ({
      ...prev,
      [areaId]: prev[areaId].map(a => a.id === actionId ? { ...a, ...updates } : a),
    }))
  }

  async function deleteAction(areaId, actionId) {
    await supabase.from('weekly_actions').delete().eq('id', actionId)
    setActions(prev => ({ ...prev, [areaId]: prev[areaId].filter(a => a.id !== actionId) }))
  }

  async function saveSession() {
    if (saving) return
    setSaving(true)

    const sessionData = {
      user_id: user.id, year, month, week_number: weekNumber,
      session_date: now.toISOString().split('T')[0],
      what_worked: whatWorked,
      what_to_adjust: whatToAdjust,
      top_commitments: commitments.filter(c => c.trim()),
    }

    if (session) {
      await supabase.from('wrap_sessions').update(sessionData).eq('id', session.id)
    } else {
      const { data } = await supabase.from('wrap_sessions').insert(sessionData).select().single()
      setSession(data)
    }
    setSaving(false)
  }

  async function completeSession() {
    if (saving) return
    setSaving(true)
    await saveSession()
    await supabase.from('wrap_sessions')
      .update({ completed_at: new Date().toISOString() })
      .eq('user_id', user.id).eq('year', year).eq('month', month).eq('week_number', weekNumber)
    setPhase('done')
    setSaving(false)
  }

  const PHASES = ['review', 'reflect', 'plan', 'commit']
  const phaseIndex = PHASES.indexOf(phase)

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: 'var(--text-muted)' }}>Loading…</p></div>

  if (phase === 'done') return <CompletedSession navigate={navigate} monthName={monthName} weekNumber={weekNumber} />

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        padding: 'var(--space-lg) var(--space-xl)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(33,32,32,0.95)', backdropFilter: 'blur(12px)',
      }}>
        <div onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
          <WrapLogo size="sm" />
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 2 }}>
            Weekly WRAP
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{monthName} · Week {weekNumber}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>← Dashboard</Button>
      </header>

      {/* Phase nav */}
      <div style={{
        display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'var(--bg-secondary)',
      }}>
        {[
          { id: 'review',  label: '1. Review',  desc: 'What happened?' },
          { id: 'reflect', label: '2. Reflect',  desc: 'What did you learn?' },
          { id: 'plan',    label: '3. Plan',     desc: "Next week's actions" },
          { id: 'commit',  label: '4. Commit',   desc: 'Lock it in' },
        ].map((p, i) => (
          <button key={p.id} onClick={() => setPhase(p.id)} style={{
            flex: 1, padding: 'var(--space-md)',
            background: 'none', border: 'none', borderBottom: `2px solid ${phase === p.id ? 'var(--accent)' : 'transparent'}`,
            cursor: 'pointer', transition: 'all var(--transition-base)',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 700, color: phase === p.id ? 'var(--accent)' : i < phaseIndex ? 'var(--text-secondary)' : 'var(--text-muted)', margin: 0, marginBottom: 2 }}>
              {p.label} {i < phaseIndex ? '✓' : ''}
            </p>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>{p.desc}</p>
          </button>
        ))}
      </div>

      <div style={{ flex: 1, maxWidth: 900, width: '100%', margin: '0 auto', padding: 'var(--space-xl)' }}>

        {/* ── REVIEW ── */}
        {phase === 'review' && (
          <div style={{ animation: 'fadeUp 0.3s ease forwards' }}>
            <div style={{ marginBottom: 'var(--space-xl)' }}>
              <h2 style={{ marginBottom: 8 }}>Review Last Week</h2>
              <p style={{ color: 'var(--text-muted)' }}>Mark what happened. Be honest — this is data, not judgment.</p>
            </div>

            {/* Area tabs */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 'var(--space-xl)' }}>
              {lifeAreas.map(area => (
                <button key={area.id} onClick={() => setActiveArea(area.id)} style={{
                  padding: '0.4rem 0.875rem', borderRadius: 99,
                  border: `1.5px solid ${activeArea === area.id ? 'var(--accent)' : 'rgba(255,255,255,0.1)'}`,
                  background: activeArea === area.id ? 'rgba(253,155,14,0.1)' : 'transparent',
                  color: activeArea === area.id ? 'var(--accent)' : 'var(--text-muted)',
                  fontFamily: 'var(--font-body)', fontSize: '0.8rem', fontWeight: 600,
                  cursor: 'pointer', transition: 'all var(--transition-base)',
                }}>
                  {area.icon} {area.name.split(' /')[0]}
                </button>
              ))}
            </div>

            {activeArea && lifeAreas.filter(a => a.id === activeArea).map(area => (
              <div key={area.id}>
                {/* Monthly objective context */}
                {(monthlyObjectives[area.id] || []).length > 0 && (
                  <div style={{ background: 'rgba(253,155,14,0.06)', border: '1px solid rgba(253,155,14,0.15)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md) var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
                    <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 6 }}>This month's objective</p>
                    {monthlyObjectives[area.id].map(o => (
                      <p key={o.id} style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>{o.objective_text}</p>
                    ))}
                  </div>
                )}

                {/* Existing actions to review */}
                {(actions[area.id] || []).length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
                    {actions[area.id].map(action => (
                      <ActionReviewCard key={action.id} action={action} onUpdate={updates => updateActionStatus(area.id, action.id, updates)} onDelete={() => deleteAction(area.id, action.id)} />
                    ))}
                  </div>
                )}

                {/* Add new action */}
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)' }}>
                  <p style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>
                    Add action for this week
                  </p>

                  {/* Response type */}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 'var(--space-md)' }}>
                    {[
                      { id: 'binary',   label: '✓ Done / Not done' },
                      { id: 'progress', label: '📊 Track progress' },
                    ].map(t => (
                      <button key={t.id} onClick={() => setResponseType(t.id)} style={{
                        flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-md)',
                        border: `1.5px solid ${responseType === t.id ? 'rgba(253,155,14,0.5)' : 'rgba(255,255,255,0.08)'}`,
                        background: responseType === t.id ? 'rgba(253,155,14,0.1)' : 'var(--bg-card)',
                        color: responseType === t.id ? 'var(--accent)' : 'var(--text-muted)',
                        fontFamily: 'var(--font-body)', fontSize: '0.8rem', fontWeight: 600,
                        cursor: 'pointer', transition: 'all var(--transition-base)',
                      }}>
                        {t.label}
                      </button>
                    ))}
                  </div>

                  <input
                    value={newAction}
                    onChange={e => setNewAction(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addAction(area.id)}
                    placeholder="What needs to happen this week? (specific enough to schedule)"
                    style={{
                      width: '100%', background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem',
                      color: 'var(--text-primary)', fontSize: '0.9rem', fontFamily: 'var(--font-body)', outline: 'none',
                      marginBottom: responseType === 'progress' ? 'var(--space-sm)' : 0,
                    }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                  />

                  {responseType === 'progress' && (
                    <input
                      value={targetNumber}
                      onChange={e => setTargetNumber(e.target.value)}
                      placeholder="Target number (e.g. 100 for '100 contacts')"
                      type="number"
                      style={{
                        width: '100%', background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', marginTop: 8,
                        color: 'var(--text-primary)', fontSize: '0.9rem', fontFamily: 'var(--font-body)', outline: 'none',
                      }}
                      onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                    />
                  )}

                  <Button variant="primary" style={{ marginTop: 'var(--space-md)' }} disabled={!newAction.trim() || saving} loading={saving} onClick={() => addAction(area.id)}>
                    Add Action
                  </Button>
                </div>
              </div>
            ))}

            <div style={{ marginTop: 'var(--space-2xl)', display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="primary" size="lg" onClick={() => setPhase('reflect')}>
                Move to Reflect →
              </Button>
            </div>
          </div>
        )}

        {/* ── REFLECT ── */}
        {phase === 'reflect' && (
          <div style={{ animation: 'fadeUp 0.3s ease forwards' }}>
            <div style={{ marginBottom: 'var(--space-xl)' }}>
              <h2 style={{ marginBottom: 8 }}>Reflect</h2>
              <p style={{ color: 'var(--text-muted)' }}>High performers value feedback over validation. What does the data tell you?</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)' }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6ee7b7', marginBottom: 12 }}>What worked?</p>
                <Textarea rows={4} placeholder="What moved? What surprised you? Where did you show up well?" value={whatWorked} onChange={e => setWhatWorked(e.target.value)} />
              </div>

              <div style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)' }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#fca5a5', marginBottom: 12 }}>What to adjust?</p>
                <Textarea rows={4} placeholder="Where were you over-committed? Under-committed? What pattern do you see?" value={whatToAdjust} onChange={e => setWhatToAdjust(e.target.value)} />
              </div>
            </div>

            <div style={{ marginTop: 'var(--space-2xl)', display: 'flex', justifyContent: 'space-between' }}>
              <Button variant="secondary" onClick={() => setPhase('review')}>← Back</Button>
              <Button variant="primary" size="lg" onClick={async () => { await saveSession(); setPhase('plan') }}>Move to Plan →</Button>
            </div>
          </div>
        )}

        {/* ── PLAN ── */}
        {phase === 'plan' && (
          <div style={{ animation: 'fadeUp 0.3s ease forwards' }}>
            <div style={{ marginBottom: 'var(--space-xl)' }}>
              <h2 style={{ marginBottom: 8 }}>Plan Next Week</h2>
              <p style={{ color: 'var(--text-muted)' }}>Go back to each life area and set your actions for the coming week. Use the Review tab to add or adjust.</p>
            </div>

            {/* Summary of all current actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
              {lifeAreas.map(area => (
                <div key={area.id} style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 'var(--space-md)' }}>
                    <span style={{ fontSize: '1.1rem' }}>{area.icon}</span>
                    <h3 style={{ fontSize: '0.95rem', fontFamily: 'var(--font-body)', fontWeight: 600 }}>{area.name}</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                      {(actions[area.id] || []).length} action{(actions[area.id] || []).length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {(actions[area.id] || []).length > 0 ? (
                    actions[area.id].map(a => (
                      <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0, flex: 1 }}>{a.action_text}</p>
                        {a.response_type === 'progress' && a.target_number && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>target: {a.target_number}</span>
                        )}
                      </div>
                    ))
                  ) : (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No actions added — go to Review to add some</p>
                  )}
                </div>
              ))}
            </div>

            <div style={{ marginTop: 'var(--space-2xl)', display: 'flex', justifyContent: 'space-between' }}>
              <Button variant="secondary" onClick={() => setPhase('reflect')}>← Back</Button>
              <Button variant="primary" size="lg" onClick={() => setPhase('commit')}>Move to Commit →</Button>
            </div>
          </div>
        )}

        {/* ── COMMIT ── */}
        {phase === 'commit' && (
          <div style={{ animation: 'fadeUp 0.3s ease forwards' }}>
            <div style={{ marginBottom: 'var(--space-xl)' }}>
              <h2 style={{ marginBottom: 8 }}>Commit</h2>
              <p style={{ color: 'var(--text-muted)' }}>Of everything on your list, what are the 3 things that absolutely must happen this week? These are your non-negotiables.</p>
            </div>

            <div style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)', marginBottom: 'var(--space-xl)' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 'var(--space-lg)' }}>
                My top 3 commitments this week
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                {commitments.map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg, var(--orange-primary), var(--orange-deep))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.75rem', fontWeight: 700, color: '#fff',
                    }}>
                      {i + 1}
                    </div>
                    <input
                      value={c}
                      onChange={e => setCommitments(prev => prev.map((v, j) => j === i ? e.target.value : v))}
                      placeholder={`Commitment ${i + 1}…`}
                      style={{
                        flex: 1, background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem',
                        color: 'var(--text-primary)', fontSize: '0.95rem', fontFamily: 'var(--font-body)', outline: 'none',
                      }}
                      onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: 'rgba(253,155,14,0.06)', border: '1px solid rgba(253,155,14,0.2)', borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--accent)', fontStyle: 'italic', margin: 0 }}>
                "Progress is greater than achievement. You will never be more than 7 days from your scorecard."
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Button variant="secondary" onClick={() => setPhase('plan')}>← Back</Button>
              <Button
                variant="primary" size="lg"
                disabled={commitments.filter(c => c.trim()).length === 0 || saving}
                loading={saving}
                onClick={completeSession}
              >
                Complete This WRAP Session ✓
              </Button>
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:none; } }`}</style>
    </div>
  )
}

/* ─── Action Review Card ─────────────────────────────────────────── */
function ActionReviewCard({ action, onUpdate, onDelete }) {
  const [progressVal, setProgressVal] = useState(action.progress_value || '')

  function handleProgressSave() {
    if (progressVal === '') return
    onUpdate({ progress_value: parseFloat(progressVal) })
  }

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-md)' }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', margin: '0 0 8px' }}>{action.action_text}</p>
          {action.target_number && (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Target: {action.target_number}</p>
          )}
        </div>
        <button onClick={onDelete} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1rem', padding: 4 }}
          onMouseEnter={e => e.target.style.color = '#fca5a5'}
          onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
        >×</button>
      </div>

      {/* Response controls */}
      <div style={{ marginTop: 'var(--space-md)', paddingTop: 'var(--space-md)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        {action.response_type === 'binary' ? (
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { val: true,  label: '✓ Done',       color: '#6ee7b7', bg: 'rgba(110,231,183,0.1)',  border: 'rgba(110,231,183,0.3)' },
              { val: false, label: '✗ Not done',    color: '#fca5a5', bg: 'rgba(252,165,165,0.1)',  border: 'rgba(252,165,165,0.3)' },
              { val: null,  label: '→ Carry forward', color: 'var(--text-muted)', bg: 'var(--bg-secondary)', border: 'rgba(255,255,255,0.1)' },
            ].map(opt => (
              <button key={String(opt.val)} onClick={() => onUpdate(opt.val === null ? { carried_forward: true, completed: null } : { completed: opt.val, carried_forward: false })} style={{
                flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-sm)',
                border: `1px solid ${
                  (opt.val === true && action.completed === true) || (opt.val === false && action.completed === false) || (opt.val === null && action.carried_forward)
                    ? opt.border : 'rgba(255,255,255,0.08)'}`,
                background: (opt.val === true && action.completed === true) || (opt.val === false && action.completed === false) || (opt.val === null && action.carried_forward)
                  ? opt.bg : 'transparent',
                color: opt.color, fontFamily: 'var(--font-body)', fontSize: '0.75rem', fontWeight: 600,
                cursor: 'pointer', transition: 'all var(--transition-base)',
              }}>
                {opt.label}
              </button>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="number"
              value={progressVal}
              onChange={e => setProgressVal(e.target.value)}
              placeholder="Log your progress…"
              style={{
                flex: 1, background: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 'var(--radius-sm)', padding: '0.5rem 0.75rem',
                color: 'var(--text-primary)', fontSize: '0.875rem', fontFamily: 'var(--font-body)', outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; handleProgressSave() }}
            />
            {action.target_number && (
              <div style={{ flexShrink: 0, textAlign: 'right' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>
                  {action.progress_value || 0} / {action.target_number}
                </p>
                <div style={{ width: 80, height: 4, background: 'var(--bg-card)', borderRadius: 99, marginTop: 4 }}>
                  <div style={{
                    height: '100%', borderRadius: 99,
                    width: `${Math.min(100, ((action.progress_value || 0) / action.target_number) * 100)}%`,
                    background: 'linear-gradient(90deg, var(--orange-primary), var(--orange-deep))',
                    transition: 'width 0.4s ease',
                  }} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Completed Session ──────────────────────────────────────────── */
function CompletedSession({ navigate, monthName, weekNumber }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-xl)' }}>
      <div style={{ textAlign: 'center', maxWidth: 480, animation: 'fadeUp 0.5s ease forwards' }}>
        <div style={{ fontSize: '3rem', marginBottom: 'var(--space-lg)' }}>🔥</div>
        <h2 style={{ marginBottom: 'var(--space-md)' }}>WRAP Session Complete</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-2xl)' }}>
          {monthName} · Week {weekNumber} is locked in. You are never more than 7 days from your scorecard.
        </p>
        <Button variant="primary" size="lg" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:none; } }`}</style>
    </div>
  )
}
