import { getDatabase } from '../database/db.js'

/**
 * DATA ACCESS
 * ===========
 * Every statement below uses ? placeholders. The values are passed separately
 * to SQLite and are never concatenated into the SQL text, which is what makes
 * SQL injection impossible here.
 */

const MAX_LIMIT = 200
const DEFAULT_LIMIT = 50

/** The database stores snake_case columns; the API speaks camelCase. */
function toApiShape(row) {
  if (!row) return null
  return {
    id: row.id,
    infixExpression: row.infix_expression,
    postfixExpression: row.postfix_expression,
    result: row.result,
    createdAt: row.created_at,
  }
}

export function listConversions(limit = DEFAULT_LIMIT) {
  const safeLimit = Math.min(Math.max(Number(limit) || DEFAULT_LIMIT, 1), MAX_LIMIT)
  const rows = getDatabase()
    .prepare('SELECT * FROM conversions ORDER BY id DESC LIMIT ?')
    .all(safeLimit)
  return rows.map(toApiShape)
}

export function createConversion({ infixExpression, postfixExpression, result }) {
  const createdAt = new Date().toISOString()

  const info = getDatabase()
    .prepare(
      `INSERT INTO conversions (infix_expression, postfix_expression, result, created_at)
       VALUES (?, ?, ?, ?)`,
    )
    .run(infixExpression, postfixExpression, result ?? null, createdAt)

  return findConversion(info.lastInsertRowid)
}

export function findConversion(id) {
  const row = getDatabase().prepare('SELECT * FROM conversions WHERE id = ?').get(id)
  return toApiShape(row)
}

/** @returns {number} how many rows were removed (0 means "not found") */
export function deleteConversion(id) {
  return getDatabase().prepare('DELETE FROM conversions WHERE id = ?').run(id).changes
}

/** @returns {number} how many rows were removed */
export function clearConversions() {
  return getDatabase().prepare('DELETE FROM conversions').run().changes
}

export function countConversions() {
  return getDatabase().prepare('SELECT COUNT(*) AS total FROM conversions').get().total
}
