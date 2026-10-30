import { generateText } from 'ai'
import { NextResponse } from 'next/server'

const MAX_MESSAGE_LENGTH = 2000
const MAX_MESSAGES = 20

export async function POST(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Send a valid JSON request.' }, { status: 400 })
  }

  if (!body || typeof body !== 'object' || !Array.isArray((body as { messages?: unknown }).messages)) {
    return NextResponse.json({ error: 'A messages array is required.' }, { status: 400 })
  }

  const messages = (body as { messages: unknown[] }).messages
  if (messages.length === 0 || messages.length > MAX_MESSAGES) {
    return NextResponse.json({ error: `Include between 1 and ${MAX_MESSAGES} messages.` }, { status: 400 })
  }

  const validMessages = messages.every((message) => {
    if (!message || typeof message !== 'object') return false
    const candidate = message as { role?: unknown; content?: unknown }
    return (candidate.role === 'user' || candidate.role === 'assistant') &&
      typeof candidate.content === 'string' &&
      candidate.content.trim().length > 0 &&
      candidate.content.length <= MAX_MESSAGE_LENGTH
  })

  if (!validMessages) {
    return NextResponse.json({ error: 'Each message needs a valid role and text.' }, { status: 400 })
  }

  try {
    const result = await generateText({
      model: 'openai/gpt-4o-mini',
      system: 'You are CelebrateAI, a concise and practical wedding planning co-pilot. Use the event context when helpful: Ahmedabad, Gujarati-inspired wedding, 250 guests, vegetarian catering, and an ₹8,00,000 planning budget. Give actionable advice and state assumptions. Do not claim to have saved anything or accessed vendors unless the user provides that information.',
      messages: messages as Array<{ role: 'user' | 'assistant'; content: string }>,
      maxOutputTokens: 700,
      temperature: 0.5,
    })

    const text = result.text?.trim()
    if (!text) {
      return NextResponse.json({ error: 'The assistant returned an empty response.' }, { status: 502 })
    }

    return NextResponse.json({ message: { role: 'assistant', content: text } })
  } catch (error) {
    console.error('[assistant] generation failed', error instanceof Error ? error.message : 'unknown error')
    return NextResponse.json({ error: 'CelebrateAI is temporarily unavailable. Please try again.' }, { status: 502 })
  }
}
