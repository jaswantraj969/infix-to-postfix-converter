import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * SQLITE CONNECTION
 * =================
 * The database is a single file on disk (server/data/history.db), so the
 * history survives restarts with no database server to install or configure.
 * The schema is created on first start - nothing has to be set up by hand.
 */

const here = dirname(fileURLToPath(import.meta.url))
export const DATA_DIRECTORY = join(here, '..', '..', 'data')

/**
 * The automated tests set SQLITE_DB_PATH to a throwaway file so that running
 * them can never touch the real history.db the application uses.
 */
export const DATABASE_FILE = process.env.SQLITE_DB_PATH || join(DATA_DIRECTORY, 'history.db')

let db = null

export function getDatabase() {
  if (db) return db

  mkdirSync(dirname(DATABASE_FILE), { recursive: true })
  db = new Database(DATABASE_FILE)

  // WAL keeps reads fast while a write is in progress; foreign_keys is good hygiene.
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  initialiseSchema(db)
  return db
}

function initialiseSchema(connection) {
  connection.exec(`
    CREATE TABLE IF NOT EXISTS conversions (
      id                 INTEGER PRIMARY KEY AUTOINCREMENT,
      infix_expression   TEXT NOT NULL,
      postfix_expression TEXT NOT NULL,
      result             TEXT,
      created_at         TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_conversions_created_at
      ON conversions (created_at DESC);
  `)
}

/** Used by the tests and by a clean shutdown. */
export function closeDatabase() {
  if (db) {
    db.close()
    db = null
  }
}
