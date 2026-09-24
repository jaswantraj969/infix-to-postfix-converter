import { createApp } from './app.js'
import { getDatabase, closeDatabase, DATABASE_FILE } from './database/db.js'

const PORT = Number(process.env.PORT) || 4000

// Touching the database here means the file and the table exist before the
// first request arrives, and any setup problem is reported at startup.
getDatabase()

const server = createApp().listen(PORT, () => {
  console.log('')
  console.log('  Infix -> Postfix API')
  console.log('  ---------------------------------------------')
  console.log('  Listening on   http://localhost:' + PORT)
  console.log('  Health check   http://localhost:' + PORT + '/api/health')
  console.log('  Database file  ' + DATABASE_FILE)
  console.log('')
})

function shutdown(signal) {
  console.log('\n[server] ' + signal + ' received, shutting down.')
  server.close(() => {
    closeDatabase()
    process.exit(0)
  })
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
