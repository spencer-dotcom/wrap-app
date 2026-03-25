import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { Button, Textarea, WrapLogo } from '../components/UI'

const TASK_PHRASES = [
  'call ', 'schedule ', 'send ', 'email ', 'buy ', 'get ', 'make ',
  'create ', 'build ', 'finish ', 'complete ', 'do ', 'hire ', 'find ',
]

function looksLikeTask(text) {
  const lower = text.toLowerCase().trim()
  return TASK_PHRASES.some(p => lower.startsWith(p))
}

export default function AnnualOutcomesPage() {
  const [lifeAreas, setLifeAreas]       = useState([])
  const [outcomes, setOutcomes]         = useState({}) // { areaId: [outcome, ...] }
  const [activeArea, setActiveArea]     = useState(null)
  const [newOutcome, setNewOutcome]     = useState('')
  const [taskWarning, setTaskWarning]   = useState(false)
  const [saving, setSaving]             = useState(false)
  const [loading, setLoading]           = useState(true)

  const { user } = useAuth()
  const navigate = useNavigate()
  const year = new Date().getFullYear()

  useEffect(() => {
    if (user) fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function fetchData() {
    const { data: areas } = await supabase
      .from('life_areas').select('*').eq('user_id', user.id).order('sort_order')

    const { data: existingOutcomes } = await supabase
      .from('annual_outcomes')
      .select('*')
      .eq('user_id', user.id)
      .eq('year', year)

    const grouped = {}
    areas?.forEach(a => {
      grouped[a.id] = existingOutcomes?.filter(o => o.life_area_id === a.id) || []
    })

    setLifeAreas(areas || [])
    setOutcomes(grouped)
    setActiveArea(areas?.[0]?.id || null)
    setLoading(false)
  }

  function handleOutcomeInput(val) {
    setNewOutcome(val)
    setTaskWarning(looksLikeTask(val))
  }

  async function addOutcome(areaId) {
    if (!newOutcome.trim() || saving) return
    const areaOutcomes = outcomes[areaId] || []
    if (areaOutcomes.length >= 3) return

    setSaving(true)
    const { data, error } = await supabase.from('annual_outcomes').insert({
      user_id: user.id,
      life_area_id: areaId,
      year,
      outcome_text: newOutcome.trim(),
      sort_order: areaOutcomes.length + 1,
    }).select().single()

    if (!error && data) {
      setOutcomes(prev => ({
        ...prev,
        [areaId]: [...(prev[areaId] || []), data],
      }))
      setNewOutcome('')
      setTaskWarning(false)
    }
    setSaving(false)
  }

  async function deleteOutcome(areaId, outcomeId) {
    await supabase.from('annual_outcomes').delete().eq('id', outcomeId)
    setOutcomes(prev => ({
      ...prev,
      [areaId]: prev[areaId].filter(o => o.id !== outcomeId),
    }))
  }

  const totalOutcomes = Object.values(outcomes).flat().length

  if (loading) return <LoadingState />

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
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
            Annual Outcomes
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{year}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
          ← Dashboard
        </Button>
      </header>

      <div style={{ flex: 1, display: 'flex', maxWidth: 1100, width: '100%', margin: '0 auto', padding: 'var(--space-xl)' }}>
        {/* Life area sidebar */}
        <div style={{
          width: 220, flexShrink: 0, marginRight: 'var(--space-xl)',
          display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)',
        }}>
          <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
            Life Arenas
          </p>
          {lifeAreas.map(area => {
            const count = outcomes[area.id]?.length || 0
            const isActive = activeArea === area.id
            return (
              <div
                key={area.id}
                onClick={() => setActiveArea(area.id)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.625rem 0.875rem',
                  borderRadius: 'var(--radius-md)',
                  background: isActive ? 'rgba(253,155,14,0.1)' : 'transparent',
                  border: `1px solid ${isActive ? 'rgba(253,155,14,0.3)' : 'transparent'}`,
                  cursor: 'pointer', transition: 'all var(--transition-base)',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-card)' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '1rem' }}>{area.icon}</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: isActive ? 600 : 400, color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    {area.name.split(' /')[0]}
                  </span>
                </div>
                <span style={{
                  fontSize: '0.7rem', fontWeight: 700,
                  color: count > 0 ? 'var(--accent)' : 'var(--text-muted)',
                  background: count > 0 ? 'rgba(253,155,14,0.15)' : 'rgba(255,255,255,0.05)',
                  padding: '1px 7px', borderRadius: 99,
                }}>
                  {count}/3
                </span>
              </div>
            )
          })}

          {/* Progress summary */}
          <div style={{
            marginTop: 'auto', paddingTop: 'var(--space-lg)',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>
              Total outcomes: <strong style={{ color: totalOutcomes >= 5 ? 'var(--accent)' : 'var(--text-primary)' }}>{totalOutcomes}</strong>
            </p>
            {totalOutcomes < 5 && (
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Minimum 5 recommended
              </p>
            )}
          </div>
        </div>

        {/* Main area */}
        {activeArea && (
          <div style={{ flex: 1, animation: 'fadeUp 0.3s ease forwards' }}>
            {lifeAreas.filter(a => a.id === activeArea).map(area => (
              <div key={area.id}>
                <div style={{ marginBottom: 'var(--space-xl)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <span style={{ fontSize: '2rem' }}>{area.icon}</span>
                    <h2 style={{ fontSize: '1.5rem' }}>{area.name}</h2>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    What does winning look like in this area by end of {year}? Set 1–3 outcomes. Make them specific and quantifiable where possible.
                  </p>
                </div>

                {/* Guiding question */}
                <div style={{
                  background: 'rgba(253,155,14,0.06)',
                  border: '1px solid rgba(253,155,14,0.15)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-md) var(--space-lg)',
                  marginBottom: 'var(--space-xl)',
                }}>
                  <p style={{ fontSize: '0.875rem', color: 'var(--accent)', fontStyle: 'italic' }}>
                    "If I did everything I needed to do in {area.name} this year, what would I have achieved?"
                  </p>
                </div>

                {/* Existing outcomes */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
                  {(outcomes[area.id] || []).map((outcome, i) => (
                    <div key={outcome.id} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 'var(--space-md)',
                      background: 'var(--bg-card)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 'var(--radius-md)',
                      padding: 'var(--space-lg)',
                    }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                        background: 'linear-gradient(135deg, var(--orange-primary), var(--orange-deep))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.75rem', fontWeight: 700, color: '#fff',
                      }}>
                        {i + 1}
                      </div>
                      <p style={{ flex: 1, color: 'var(--text-primary)', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
                        {outcome.outcome_text}
                      </p>
                      <button
                        onClick={() => deleteOutcome(area.id, outcome.id)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: 'var(--text-muted)', fontSize: '1rem', padding: 4,
                          transition: 'color var(--transition-fast)', flexShrink: 0,
                        }}
                        onMouseEnter={e => e.target.style.color = '#fca5a5'}
                        onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
                        title="Remove outcome"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add new outcome */}
                {(outcomes[area.id] || []).length < 3 && (
                  <div style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-xl)',
                  }}>
                    <p style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>
                      Add outcome {(outcomes[area.id] || []).length + 1} of 3
                    </p>
                    <Textarea
                      rows={3}
                      placeholder="Write it as an outcome, not a task. What will you have achieved? (e.g. 'Revenue of $300K' not 'Make more sales calls')"
                      value={newOutcome}
                      onChange={e => handleOutcomeInput(e.target.value)}
                    />

                    {/* Task warning */}
                    {taskWarning && (
                      <div style={{
                        marginTop: 'var(--space-md)',
                        padding: 'var(--space-md)',
                        background: 'rgba(252,165,165,0.08)',
                        border: '1px solid rgba(252,165,165,0.2)',
                        borderRadius: 'var(--radius-md)',
                      }}>
                        <p style={{ fontSize: '0.85rem', color: '#fca5a5', margin: 0 }}>
                          ⚠️ That sounds like a task, not an outcome. Try asking: <em>"If I did that, what would I have achieved?"</em> Write the achievement, not the action.
                        </p>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-lg)', alignItems: 'center' }}>
                      <Button
                        variant="primary"
                        disabled={!newOutcome.trim() || saving}
                        loading={saving}
                        onClick={() => addOutcome(area.id)}
                      >
                        Add Outcome
                      </Button>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                        {3 - (outcomes[area.id] || []).length} slot{3 - (outcomes[area.id] || []).length !== 1 ? 's' : ''} remaining
                      </p>
                    </div>
                  </div>
                )}

                {(outcomes[area.id] || []).length === 3 && (
                  <div style={{
                    padding: 'var(--space-lg)',
                    background: 'rgba(110,231,183,0.08)',
                    border: '1px solid rgba(110,231,183,0.2)',
                    borderRadius: 'var(--radius-md)',
                    textAlign: 'center',
                  }}>
                    <p style={{ color: '#6ee7b7', fontWeight: 600, margin: 0 }}>
                      ✓ {area.name} is set for {year}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:none; } }`}</style>
    </div>
  )
}

function LoadingState() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'var(--text-muted)' }}>Loading…</p>
    </div>
  )
}
