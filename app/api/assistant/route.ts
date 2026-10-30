import { GoogleGenAI } from '@google/genai'
import { NextResponse } from 'next/server'

const MAX_MESSAGE_LENGTH = 2000
const MAX_MESSAGES = 20
const GEMINI_MODEL = 'gemini-flash-latest'
const REQUEST_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS ?? 45_000)

// Keep the provider deadline below this route's platform execution ceiling.
export const maxDuration = 60
const SYSTEM_INSTRUCTION = 'You are CelebrateAI, a concise and practical wedding planning co-pilot. Use the event context when helpful: Ahmedabad, Gujarati-inspired wedding, 250 guests, vegetarian catering, and an ₹8,00,000 planning budget. Give actionable advice and state assumptions. Do not claim to have saved anything or accessed vendors unless the user provides that information.'

type AssistantMessage = { role: 'user' | 'assistant'; content: string }
type FailureCategory = 'missing-key' | 'invalid-key' | 'quota-rate-limit' | 'model-unavailable' | 'provider-error' | 'network-error' | 'aborted' | 'timeout' | 'empty-response' | 'unknown'
type Failure = { category: FailureCategory; status: number; publicMessage: string; diagnostic: string }

function getProviderStatus(error: unknown) {
  if (typeof error !== 'object' || error === null) return undefined
  const candidate = error as { status?: unknown; statusCode?: unknown }
  if (typeof candidate.status === 'number') return candidate.status
  if (typeof candidate.statusCode === 'number') return candidate.statusCode
  return undefined
}

function classifyFailure(error: unknown, elapsedMs: number): Failure {
  const message = error instanceof Error ? error.message : ''
  const normalized = message.toLowerCase()
  const errorName = error instanceof Error ? error.name : ''
  const status = getProviderStatus(error)
  const isAbort = errorName === 'AbortError' || normalized.includes('aborted') || normalized.includes('abort')

  if (status === 504 || normalized.includes('timed out') || normalized.includes('timeout') || (isAbort && elapsedMs >= REQUEST_TIMEOUT_MS - 1000)) {
    return { category: 'timeout', status: 504, publicMessage: 'Gemini took too long to respond. Please try again.', diagnostic: `The Gemini request exceeded its ${REQUEST_TIMEOUT_MS}ms provider deadline.` }
  }
  if (isAbort) {
    return { category: 'aborted', status: 499, publicMessage: 'The Gemini request was cancelled. Please try again.', diagnostic: 'The Gemini request was aborted before the provider deadline.' }
  }
  if (status === 401 || status === 403 || normalized.includes('unauthorized') || normalized.includes('api key') || normalized.includes('permission')) {
    return { category: 'invalid-key', status: status ?? 502, publicMessage: 'Gemini could not authenticate. Check the server-side GCP_API_KEY configuration.', diagnostic: `Gemini rejected the request${status ? ` with HTTP ${status}` : ''}.` }
  }
  if (status === 429 || normalized.includes('quota') || normalized.includes('rate limit') || normalized.includes('resource exhausted')) {
    return { category: 'quota-rate-limit', status: 429, publicMessage: 'Gemini is temporarily at its usage limit. Please try again shortly.', diagnostic: `Gemini reported a quota or rate-limit failure${status ? ` with HTTP ${status}` : ''}.` }
  }
  if (status !== undefined && status >= 500) {
    return { category: 'provider-error', status: 502, publicMessage: 'Gemini is temporarily unavailable. Please try again.', diagnostic: `Gemini returned a provider/server error (HTTP ${status}).` }
  }
  if (status === 404 || (status === undefined && (normalized.includes('not found') || normalized.includes('model')))) {
    return { category: 'model-unavailable', status: 404, publicMessage: 'The configured Gemini model is unavailable for this API key.', diagnostic: `Gemini could not access model ${GEMINI_MODEL}${status ? ` (HTTP ${status})` : ''}.` }
  }
  if (normalized.includes('fetch') || normalized.includes('network') || normalized.includes('socket') || normalized.includes('connection')) {
    return { category: 'network-error', status: 502, publicMessage: 'The connection to Gemini failed. Please try again.', diagnostic: 'The Gemini request failed at the network layer.' }
  }
  return { category: 'unknown', status: 502, publicMessage: 'Gemini is temporarily unavailable. Please try again.', diagnostic: 'Gemini returned an unclassified provider failure.' }
}

function failureResponse(failure: Failure, requestId: string) {
  const payload: { error: string; code: FailureCategory; requestId: string; diagnostic?: string } = {
    error: failure.publicMessage,
    code: failure.category,
    requestId,
  }
  if (process.env.NODE_ENV !== 'production') payload.diagnostic = failure.diagnostic
  return NextResponse.json(payload, { status: failure.status, headers: { 'x-request-id': requestId } })
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID()
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Send a valid JSON request.', code: 'invalid-request', requestId }, { status: 400, headers: { 'x-request-id': requestId } })
  }

  if (!body || typeof body !== 'object' || !Array.isArray((body as { messages?: unknown }).messages)) {
    return NextResponse.json({ error: 'A messages array is required.', code: 'invalid-request', requestId }, { status: 400, headers: { 'x-request-id': requestId } })
  }

  const messages = (body as { messages: unknown[] }).messages
  if (messages.length === 0 || messages.length > MAX_MESSAGES) {
    return NextResponse.json({ error: `Include between 1 and ${MAX_MESSAGES} messages.`, code: 'invalid-request', requestId }, { status: 400, headers: { 'x-request-id': requestId } })
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
    return NextResponse.json({ error: 'Each message needs a valid role and text.', code: 'invalid-request', requestId }, { status: 400, headers: { 'x-request-id': requestId } })
  }

  const apiKey = process.env.GCP_API_KEY
  if (!apiKey) {
    const failure: Failure = { category: 'missing-key', status: 503, publicMessage: 'Gemini is not configured. Add the server-side GCP_API_KEY value in the project environment.', diagnostic: 'GCP_API_KEY is missing from the server environment.' }
    return failureResponse(failure, requestId)
  }

  const startedAt = Date.now()
  console.info(`[assistant] requestId=${requestId} event=start model=${GEMINI_MODEL} keyConfigured=true`)

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        timeout: REQUEST_TIMEOUT_MS,
        retryOptions: { attempts: 1 },
      },
    })
    const transcript = (messages as AssistantMessage[])
      .map((message) => `${message.role === 'user' ? 'User' : 'CelebrateAI'}: ${message.content}`)
      .join('\n')

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: transcript,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        maxOutputTokens: 700,
        temperature: 0.5,
      },
    })
    const text = response.text?.trim()

    if (!text) {
      const failure: Failure = { category: 'empty-response', status: 502, publicMessage: 'Gemini returned an empty response. Please try again.', diagnostic: 'Gemini completed without response text.' }
      console.warn(`[assistant] requestId=${requestId} event=empty-response elapsedMs=${Date.now() - startedAt}`)
      return failureResponse(failure, requestId)
    }

    console.info(`[assistant] requestId=${requestId} event=success elapsedMs=${Date.now() - startedAt}`)
    return NextResponse.json({ message: { role: 'assistant', content: text }, requestId }, { headers: { 'x-request-id': requestId } })
  } catch (error) {
    const elapsedMs = Date.now() - startedAt
    const failure = classifyFailure(error, elapsedMs)
    console.error(`[assistant] requestId=${requestId} event=failure category=${failure.category} status=${getProviderStatus(error) ?? 'unknown'} elapsedMs=${elapsedMs}`)
    return failureResponse(failure, requestId)
  }

}
