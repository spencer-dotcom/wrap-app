import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { Button, Textarea, WrapLogo } from '../components/UI'

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']

export default function MonthlyPlanPage() {
  const [lifeAreas, setLifeAreas]         = useState([])
  const [annualOutcomes, setAnnualOutcomes] = useState({})
  const [objectives, setObjectives]       = useState({})
  const [activeArea, setActiveArea]       = useState(null)
  const [newObj, setNewObj]               = useState('')
  const [objType, setObjType]             = useState('outcome')
  const [saving, setSaving]               = useState(false)
  const [loading, setLoading]             = useState(true)

  const { user } = useAuth()
  const navigate = useNavigate()
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const monthName = MONTH_NAMES[month - 1]

  useEffect(() => {
    if (user) fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function fetchData() {
    const { data: areas } = await supabase
      .from('life_areas').select('*').eq('user_id', user.id).order('sort_order')

    const { data: annual } = await supabase
      .from('annual_outcomes').select('*')
      .eq('user_id', user.id).eq('year', year)

    const { data: monthly } = await supabase
      .from('monthly_objectives').select('*')
      .eq('user_id', user.id).eq('year', year).eq('month', month)

    const annualGrouped = {}
    areas?.forEach(a => {
      annualGrouped[a.id] = annual?.filter(o => o.life_area_id === a.id) || []
    })

    const monthlyGrouped = {}
    areas?.forEach(a => {
      monthlyGrouped[a.id] = monthly?.filter(o => o.life_area_id === a.id) || []
    })

    setLifeAreas(areas || [])
    setAnnualOutcomes(annualGrouped)
    setObjectives(monthlyGrouped)
    setActiveArea(areas?.[0]?.id || null)
    setLoading(false)
  }

  async function addObjective(areaId) {
    if (!newObj.trim() || saving) return
    setSaving(true)

    const { data, error } = await supabase.from('monthly_objectives').insert({
      user_id: user.id,
      life_area_id: areaId,
      year, month,
      objective_text: newObj.trim(),
      objective_type: objType,
      sort_order: (objectives[areaId] || []).length + 1,
    }).select().single()

    if (!error && data) {
      setObjectives(prev => ({
        ...prev,
        [areaId]: [...(prev[areaId] || []), data],
      }))
      setNewObj('')
    }
    setSaving(false)
  }

  async function deleteObjective(areaId, objId) {
    await supabase.from('monthly_objectives').delete().eq('id', objId)
    setObjectives(prev => ({
      ...prev,
      [areaId]: prev[areaId].filter(o => o.id !== objId),
    }))
  }

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: 'var(--text-muted)' }}>Loading…</p></div>

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
          <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 2 }}>Monthly Plan</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{monthName} {year}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>← Dashboard</Button>
      </header>

      <div className='sidebar-layout' style={{ flex: 1, display: 'flex', maxWidth: 1100, width: '100%', margin: '0 auto', padding: 'var(--space-xl)' }}>
        {/* Sidebar */}
        <div className='sidebar-panel' style={{ width: 220, flexShrink: 0, marginRight: 'var(--space-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>Life Arenas</p>
          {lifeAreas.map(area => {
            const count = objectives[area.id]?.length || 0
            const isActive = activeArea === area.id
            return (
              <div key={area.id} onClick={() => setActiveArea(area.id)} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.625rem 0.875rem', borderRadius: 'var(--radius-md)',
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
                {count > 0 && (
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent)', background: 'rgba(253,155,14,0.15)', padding: '1px 7px', borderRadius: 99 }}>
                    {count}
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {/* Main */}
        {activeArea && lifeAreas.filter(a => a.id === activeArea).map(area => (
          <div key={area.id} style={{ flex: 1, animation: 'fadeUp 0.3s ease forwards' }}>
            <div style={{ marginBottom: 'var(--space-xl)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <span style={{ fontSize: '2rem' }}>{area.icon}</span>
                <h2 style={{ fontSize: '1.5rem' }}>{area.name}</h2>
              </div>
            </div>

            {/* Annual outcomes context */}
            {(annualOutcomes[area.id] || []).length > 0 && (
              <div style={{
                background: 'rgba(253,155,14,0.06)', border: '1px solid rgba(253,155,14,0.15)',
                borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)', marginBottom: 'var(--space-xl)',
              }}>
                <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 10 }}>
                  Your {year} annual outcomes for this area
                </p>
                {annualOutcomes[area.id].map(o => (
                  <p key={o.id} style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '4px 0', paddingLeft: 12, borderLeft: '2px solid rgba(253,155,14,0.3)' }}>
                    {o.outcome_text}
                  </p>
                ))}
              </div>
            )}

            {/* Guiding question */}
            <div style={{
              background: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)', marginBottom: 'var(--space-xl)',
            }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
                The guiding question
              </p>
              <p style={{ fontSize: '1rem', color: 'var(--text-primary)', fontFamily: 'var(--font-display)', fontStyle: 'italic', lineHeight: 1.6 }}>
                "What needs to happen this month in {area.name.split(' /')[0]} to make progress toward my annual outcome?"
              </p>
            </div>

            {/* Existing objectives */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
              {(objectives[area.id] || []).map((obj, i) => (
                <div key={obj.id} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 'var(--space-md)',
                  background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)',
                }}>
                  <div style={{ flexShrink: 0 }}>
                    <span style={{
                      fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em',
                      textTransform: 'uppercase', padding: '2px 8px', borderRadius: 99,
                      background: obj.objective_type === 'outcome' ? 'rgba(253,155,14,0.15)' : obj.objective_type === 'project' ? 'rgba(99,102,241,0.15)' : 'rgba(110,231,183,0.15)',
                      color: obj.objective_type === 'outcome' ? 'var(--accent)' : obj.objective_type === 'project' ? '#a5b4fc' : '#6ee7b7',
                    }}>
                      {obj.objective_type}
                    </span>
                  </div>
                  <p style={{ flex: 1, color: 'var(--text-primary)', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
                    {obj.objective_text}
                  </p>
                  <button onClick={() => deleteObjective(area.id, obj.id)} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)', fontSize: '1rem', padding: 4, flexShrink: 0,
                  }}
                    onMouseEnter={e => e.target.style.color = '#fca5a5'}
                    onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
                  >×</button>
                </div>
              ))}
            </div>

            {/* Add objective */}
            <div style={{
              background: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)',
            }}>
              <p style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>
                Add {monthName} objective
              </p>

              {/* Type selector */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 'var(--space-md)' }}>
                {[
                  { id: 'outcome', label: 'Outcome', desc: 'A specific result' },
                  { id: 'project', label: 'Project', desc: 'A body of work' },
                  { id: 'task',    label: 'Task',    desc: 'A focused action' },
                ].map(t => (
                  <button key={t.id} onClick={() => setObjType(t.id)} style={{
                    flex: 1, padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)',
                    border: `1.5px solid ${objType === t.id ? 'rgba(253,155,14,0.5)' : 'rgba(255,255,255,0.08)'}`,
                    background: objType === t.id ? 'rgba(253,155,14,0.1)' : 'var(--bg-card)',
                    color: objType === t.id ? 'var(--accent)' : 'var(--text-muted)',
                    fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.8rem',
                    cursor: 'pointer', transition: 'all var(--transition-base)',
                    textAlign: 'center',
                  }}>
                    {t.label}
                  </button>
                ))}
              </div>

              <Textarea
                rows={3}
                placeholder={
                  objType === 'outcome' ? 'What result will you have achieved this month?' :
                  objType === 'project' ? 'What project or body of work will you complete or advance?' :
                  'What specific task must get done this month?'
                }
                value={newObj}
                onChange={e => setNewObj(e.target.value)}
              />
              <Button
                variant="primary"
                style={{ marginTop: 'var(--space-lg)' }}
                disabled={!newObj.trim() || saving}
                loading={saving}
                onClick={() => addObjective(area.id)}
              >
                Add to {monthName}
              </Button>
            </div>
          </div>
        ))}
      </div>
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:none; } }`}</style>
    </div>
  )
}
