import { createClient } from '@supabase/supabase-js'

// These values come from your Supabase project settings
// In production, use environment variables:
// REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Claude API helper for AI coaching moments
export async function getCoachingResponse(systemPrompt, userMessage, conversationHistory = []) {
  const messages = [
    ...conversationHistory,
    { role: 'user', content: userMessage }
  ]

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: systemPrompt,
      messages
    })
  })

  const data = await response.json()
  return data.content?.[0]?.text || ''
}
