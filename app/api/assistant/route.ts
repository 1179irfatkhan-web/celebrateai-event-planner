import { GoogleGenAI } from '@google/genai'
import { NextResponse } from 'next/server'

const MAX_MESSAGE_LENGTH = 2000
const MAX_MESSAGES = 20
const GEMINI_MODEL = 'gemini-flash-latest'
const REQUEST_TIMEOUT_MS = 20_000
const SYSTEM_INSTRUCTION = 'You are CelebrateAI, a concise and practical wedding planning co-pilot. Use the event context when helpful: Ahmedabad, Gujarati-inspired wedding, 250 guests, vegetarian catering, and an ₹8,00,000 planning budget. Give actionable advice and state assumptions. Do not claim to have saved anything or accessed vendors unless the user provides that information.'

type AssistantMessage = { role: 'user' | 'assistant'; content: string }

function providerErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : ''
  const status = typeof error === 'object' && error !== null && 'status' in error && typeof error.status === 'number'
    ? error.status
    : undefined
  if (status === 401 || status === 403 || message.includes('unauthorized') || message.includes('api key') || message.includes('permission')) {
    return 'Gemini could not authenticate. Check the server-side GCP_API_KEY configuration.'
  }
  if (status === 429 || message.includes('quota') || message.includes('rate limit') || message.includes('resource exhausted')) {
    return 'Gemini is temporarily at its usage limit. Please try again shortly.'
  }
  if (message.includes('timeout') || message.includes('timed out')) {
    return 'Gemini took too long to respond. Please try again.'
  }
  return 'CelebrateAI is temporarily unavailable. Please try again.'
}

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

  const apiKey = process.env.GCP_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Gemini is not configured. Add the server-side GCP_API_KEY value in the project environment.' }, { status: 503 })
  }

  try {
    const ai = new GoogleGenAI({ apiKey })
    const transcript = (messages as AssistantMessage[])
      .map((message) => `${message.role === 'user' ? 'User' : 'CelebrateAI'}: ${message.content}`)
      .join('\n')

    const generation = ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: transcript,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        maxOutputTokens: 700,
        temperature: 0.5,
      },
    })
    const timeout = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Gemini request timed out')), REQUEST_TIMEOUT_MS)
    })
    const response = await Promise.race([generation, timeout])
    const text = response.text?.trim()

    if (!text) {
      return NextResponse.json({ error: 'Gemini returned an empty response. Please try again.' }, { status: 502 })
    }

    return NextResponse.json({ message: { role: 'assistant', content: text } })
  } catch (error) {
    console.error('[assistant] Gemini request failed:', error instanceof Error ? error.name : 'unknown error')
    return NextResponse.json({ error: providerErrorMessage(error) }, { status: 502 })
  }
}
