import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Claude API helper - routes through Supabase Edge Function proxy
// so the Anthropic API key is never exposed in the browser
export async function getCoachingResponse(systemPrompt, userMessage, conversationHistory = []) {
  const messages = [
    ...conversationHistory,
    { role: 'user', content: userMessage }
  ]

  const response = await fetch(`${supabaseUrl}/functions/v1/claude-proxy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseAnonKey}`,
    },
    body: JSON.stringify({
      system: systemPrompt,
      messages,
      max_tokens: 1000,
    })
  })

  const data = await response.json()
  return data.content?.[0]?.text || ''
}
