import express from 'express'
import cors from 'cors'
import historyRoutes from './routes/history.routes.js'
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js'
import { countConversions } from './services/history.service.js'

/**
 * The Express application.
 *
 * It is created in its own module (separate from the listen() call in index.js)
 * so the automated API tests can start it on a throwaway port.
 */
export function createApp() {
  const app = express()

  // The Vite dev server proxies /api to this port, but CORS is enabled so the
  // API also works if the frontend is opened from a different origin.
  app.use(cors())
  app.use(express.json({ limit: '16kb' }))

  // Simple liveness probe - the frontend uses it to detect that the backend is up.
  app.get('/api/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      storedConversions: countConversions(),
      time: new Date().toISOString(),
    })
  })

  app.use('/api/history', historyRoutes)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
