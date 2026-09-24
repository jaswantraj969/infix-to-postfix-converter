/**
 * Error plumbing shared by every route.
 * The client is told WHAT went wrong, never HOW the server is built:
 * no stack traces and no raw SQLite messages ever cross the wire.
 */

export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export const badRequest = (message) => new ApiError(400, message)
export const notFound = (message) => new ApiError(404, message)

/** 404 for any path that is not one of our routes. */
export function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Unknown endpoint: ' + req.method + ' ' + req.originalUrl })
}

/** Final error handler - Express calls this for anything thrown in a route. */
export function errorHandler(error, req, res, _next) {
  if (error instanceof ApiError) {
    return res.status(error.status).json({ error: error.message })
  }

  // Malformed JSON body produced by express.json()
  if (error?.type === 'entity.parse.failed' || error instanceof SyntaxError) {
    return res.status(400).json({ error: 'Request body must be valid JSON.' })
  }

  // Unexpected: log the detail on the server, return a neutral message.
  console.error('[server] unhandled error:', error)
  res.status(500).json({ error: 'The server could not complete that request.' })
}
