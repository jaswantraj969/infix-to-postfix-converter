/**
 * HTTP CLIENT for the history API.
 *
 * Two rules the whole UI depends on:
 *   1. every call either resolves with data or rejects with an ApiUnavailable /
 *      Error carrying a message that is safe to show a user;
 *   2. nothing here ever touches the compiler - if the server is down, the
 *      converter still works, only the history does not.
 */

const BASE_URL = '/api'
const TIMEOUT_MS = 6000

export class ApiError extends Error {
  constructor(message, { status = 0, offline = false } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.offline = offline
  }
}

async function request(path, options = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  let response
  try {
    response = await fetch(BASE_URL + path, {
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      ...options,
    })
  } catch (error) {
    // Network failure, server not started, or the request timed out.
    throw new ApiError('Cannot reach the history server.', { offline: true })
  } finally {
    clearTimeout(timer)
  }

  let payload = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    throw new ApiError(payload?.error || 'The history server rejected that request.', {
      status: response.status,
    })
  }

  return payload
}

export const checkHealth = () => request('/health')

export const fetchHistory = async (limit = 50) => {
  const payload = await request('/history?limit=' + limit)
  return payload?.data ?? []
}

export const saveConversion = async ({ infixExpression, postfixExpression, result }) => {
  const payload = await request('/history', {
    method: 'POST',
    body: JSON.stringify({ infixExpression, postfixExpression, result: result ?? null }),
  })
  return payload?.data ?? null
}

export const deleteConversion = (id) => request('/history/' + id, { method: 'DELETE' })

export const clearHistory = () => request('/history', { method: 'DELETE' })
