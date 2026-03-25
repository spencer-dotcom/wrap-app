import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { Button, WrapLogo } from '../components/UI'

export default function DesireListPage() {
  const [desires, setDesires]   = useState([])
  const [done, setDone]         = useState([])
  const [newDesire, setNewDesire] = useState('')
  const [newDone, setNewDone]   = useState('')
  const [tab, setTab]           = useState('desire')
  const [saving, setSaving]     = useState(false)
  const [loading, setLoading]   = useState(true)

  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function fetchData() {
    const { data: d } = await supabase.from('desire_list').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    const { data: dn } = await supabase.from('done_list').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    setDesires(d || [])
    setDone(dn || [])
    setLoading(false)
  }

  async function addDesire() {
    if (!newDesire.trim() || saving) return
    setSaving(true)
    const { data, error } = await supabase.from('desire_list').insert({ user_id: user.id, item_text: newDesire.trim() }).select().single()
    if (!error && data) setDesires(prev => [data, ...prev])
    setNewDesire('')
    setSaving(false)
  }

  async function addDone() {
    if (!newDone.trim() || saving) return
    setSaving(true)
    const { data, error } = await supabase.from('done_list').insert({
      user_id: user.id,
      item_text: newDone.trim(),
      completed_date: new Date().toISOString().split('T')[0],
    }).select().single()
    if (!error && data) setDone(prev => [data, ...prev])
    setNewDone('')
    setSaving(false)
  }

  async function markDesireDone(desire) {
    // Move from desire to done
    await supabase.from('desire_list').update({ is_completed: true }).eq('id', desire.id)
    const { data } = await supabase.from('done_list').insert({
      user_id: user.id,
      item_text: desire.item_text,
      completed_date: new Date().toISOString().split('T')[0],
    }).select().single()
    setDesires(prev => prev.filter(d => d.id !== desire.id))
    if (data) setDone(prev => [data, ...prev])
  }

  async function deleteDesire(id) {
    await supabase.from('desire_list').delete().eq('id', id)
    setDesires(prev => prev.filter(d => d.id !== id))
  }

  async function deleteDone(id) {
    await supabase.from('done_list').delete().eq('id', id)
    setDone(prev => prev.filter(d => d.id !== id))
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
        <div onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}><WrapLogo size="sm" /></div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 2 }}>Lists</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Desire & Done</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>← Dashboard</Button>
      </header>

      <div style={{ flex: 1, maxWidth: 720, width: '100%', margin: '0 auto', padding: 'var(--space-xl)' }}>
        {/* Tab toggle */}
        <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: 4, marginBottom: 'var(--space-xl)' }}>
          {[
            { id: 'desire', label: '✨ Desire List', count: desires.length },
            { id: 'done',   label: '✓ Done List',   count: done.length },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: '0.625rem', borderRadius: 'calc(var(--radius-md) - 2px)',
              border: 'none', fontFamily: 'var(--font-body)', fontSize: '0.9rem', fontWeight: 600,
              cursor: 'pointer', transition: 'all var(--transition-base)',
              background: tab === t.id ? 'linear-gradient(135deg, var(--orange-primary), var(--orange-deep))' : 'transparent',
              color: tab === t.id ? '#fff' : 'var(--text-muted)',
            }}>
              {t.label} <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>({t.count})</span>
            </button>
          ))}
        </div>

        {/* Desire List */}
        {tab === 'desire' && (
          <div style={{ animation: 'fadeUp 0.3s ease forwards' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 'var(--space-xl)' }}>
              Things you want that aren't in the plan yet. Not goals, not tasks — just wants. These feed your next annual planning cycle.
            </p>

            {/* Add */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 'var(--space-xl)' }}>
              <input
                value={newDesire}
                onChange={e => setNewDesire(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addDesire()}
                placeholder="Something you want… (Enter to add)"
                style={{
                  flex: 1, background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem',
                  color: 'var(--text-primary)', fontSize: '0.9rem', fontFamily: 'var(--font-body)', outline: 'none',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
              />
              <Button variant="primary" onClick={addDesire} disabled={!newDesire.trim() || saving}>Add</Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {desires.map(d => (
                <div key={d.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 'var(--radius-md)', padding: 'var(--space-md) var(--space-lg)',
                }}>
                  <span style={{ fontSize: '1rem' }}>✨</span>
                  <p style={{ flex: 1, fontSize: '0.95rem', color: 'var(--text-primary)', margin: 0 }}>{d.item_text}</p>
                  <button onClick={() => markDesireDone(d)} title="Mark as done" style={{
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                    fontSize: '0.8rem', padding: '2px 8px', borderRadius: 99,
                    transition: 'all var(--transition-fast)',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(110,231,183,0.1)'; e.currentTarget.style.color = '#6ee7b7' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)' }}
                  >
                    ✓ Done
                  </button>
                  <button onClick={() => deleteDesire(d.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1rem', padding: 4 }}
                    onMouseEnter={e => e.target.style.color = '#fca5a5'}
                    onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
                  >×</button>
                </div>
              ))}
              {desires.length === 0 && (
                <div style={{ textAlign: 'center', padding: 'var(--space-3xl)', color: 'var(--text-muted)' }}>
                  <p style={{ fontSize: '2rem', marginBottom: 12 }}>✨</p>
                  <p>Nothing on the desire list yet. What do you want?</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Done List */}
        {tab === 'done' && (
          <div style={{ animation: 'fadeUp 0.3s ease forwards' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 'var(--space-xl)' }}>
              Everything you've accomplished. High performers underestimate their own progress — this is your record.
            </p>

            {/* Add */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 'var(--space-xl)' }}>
              <input
                value={newDone}
                onChange={e => setNewDone(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addDone()}
                placeholder="Something you accomplished… (Enter to add)"
                style={{
                  flex: 1, background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem',
                  color: 'var(--text-primary)', fontSize: '0.9rem', fontFamily: 'var(--font-body)', outline: 'none',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
              />
              <Button variant="primary" onClick={addDone} disabled={!newDone.trim() || saving}>Add</Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {done.map(d => (
                <div key={d.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: 'var(--bg-card)', border: '1px solid rgba(110,231,183,0.1)',
                  borderRadius: 'var(--radius-md)', padding: 'var(--space-md) var(--space-lg)',
                }}>
                  <span style={{ color: '#6ee7b7', fontSize: '1rem', flexShrink: 0 }}>✓</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', margin: 0 }}>{d.item_text}</p>
                    {d.completed_date && (
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                        {new Date(d.completed_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                  <button onClick={() => deleteDone(d.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1rem', padding: 4 }}
                    onMouseEnter={e => e.target.style.color = '#fca5a5'}
                    onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
                  >×</button>
                </div>
              ))}
              {done.length === 0 && (
                <div style={{ textAlign: 'center', padding: 'var(--space-3xl)', color: 'var(--text-muted)' }}>
                  <p style={{ fontSize: '2rem', marginBottom: 12 }}>🏆</p>
                  <p>Nothing logged yet. Mark something done from your Desire List, or add it directly.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:none; } }`}</style>
    </div>
  )
}
