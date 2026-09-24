import { test, describe, before, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { rmSync } from 'node:fs'

// Point the data layer at a throwaway database BEFORE anything imports it,
// so these tests can never delete the history the application is using.
const TEST_DB = join(tmpdir(), 'infix-postfix-test-' + process.pid + '.db')
process.env.SQLITE_DB_PATH = TEST_DB

const { createApp } = await import('../src/app.js')
const { clearConversions } = await import('../src/services/history.service.js')
const { closeDatabase } = await import('../src/database/db.js')

/**
 * Real HTTP tests: the app is started on an ephemeral port and driven with
 * fetch(), so routing, JSON parsing, status codes and SQLite are all exercised
 * exactly as they are in the running application.
 */

let server
let baseUrl

const api = (path, options) => fetch(baseUrl + path, options)

const postJson = (path, body) =>
  api(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })

before(async () => {
  server = createApp().listen(0)
  await new Promise((resolve) => server.once('listening', resolve))
  baseUrl = 'http://127.0.0.1:' + server.address().port
})

after(() => {
  server.close()
  closeDatabase()
  for (const suffix of ['', '-wal', '-shm']) {
    rmSync(TEST_DB + suffix, { force: true })
  }
})

beforeEach(() => clearConversions())

describe('GET /api/health', () => {
  test('reports that the API and database are reachable', async () => {
    const response = await api('/api/health')
    const body = await response.json()
    assert.equal(response.status, 200)
    assert.equal(body.status, 'ok')
    assert.equal(typeof body.storedConversions, 'number')
  })
})

describe('GET /api/history', () => {
  test('returns an empty list when nothing is stored', async () => {
    const response = await api('/api/history')
    const body = await response.json()
    assert.equal(response.status, 200)
    assert.deepEqual(body.data, [])
    assert.equal(body.count, 0)
  })

  test('returns newest entries first', async () => {
    await postJson('/api/history', { infixExpression: 'A + B', postfixExpression: 'A B +' })
    await postJson('/api/history', { infixExpression: 'C * D', postfixExpression: 'C D *' })

    const { data } = await (await api('/api/history')).json()
    assert.equal(data.length, 2)
    assert.equal(data[0].infixExpression, 'C * D')
    assert.equal(data[1].infixExpression, 'A + B')
  })

  test('honours the limit query parameter', async () => {
    for (let i = 0; i < 5; i++) {
      await postJson('/api/history', { infixExpression: 'A + ' + i, postfixExpression: 'A ' + i + ' +' })
    }
    const { data } = await (await api('/api/history?limit=2')).json()
    assert.equal(data.length, 2)
  })

  test('ignores a nonsense limit instead of failing', async () => {
    await postJson('/api/history', { infixExpression: 'A + B', postfixExpression: 'A B +' })
    const response = await api('/api/history?limit=notanumber')
    assert.equal(response.status, 200)
  })
})

describe('POST /api/history', () => {
  test('stores a conversion and returns 201 with the saved record', async () => {
    const response = await postJson('/api/history', {
      infixExpression: '10 + 5 * 2',
      postfixExpression: '10 5 2 * +',
      result: '20',
    })
    const { data } = await response.json()

    assert.equal(response.status, 201)
    assert.ok(Number.isInteger(data.id))
    assert.equal(data.infixExpression, '10 + 5 * 2')
    assert.equal(data.postfixExpression, '10 5 2 * +')
    assert.equal(data.result, '20')
    assert.ok(!Number.isNaN(Date.parse(data.createdAt)))
  })

  test('stores null when the expression could not be evaluated', async () => {
    const { data } = await (
      await postJson('/api/history', { infixExpression: 'A + B', postfixExpression: 'A B +' })
    ).json()
    assert.equal(data.result, null)
  })

  test('rejects a missing infixExpression with 400', async () => {
    const response = await postJson('/api/history', { postfixExpression: 'A B +' })
    const body = await response.json()
    assert.equal(response.status, 400)
    assert.match(body.error, /infixExpression is required/)
  })

  test('rejects a missing postfixExpression with 400', async () => {
    const response = await postJson('/api/history', { infixExpression: 'A + B' })
    assert.equal(response.status, 400)
  })

  test('rejects an empty or non-string expression with 400', async () => {
    for (const bad of ['', '   ', 42, null, { nested: true }]) {
      const response = await postJson('/api/history', { infixExpression: bad, postfixExpression: 'A B +' })
      assert.equal(response.status, 400)
    }
  })

  test('rejects an over-long expression with 400', async () => {
    const response = await postJson('/api/history', {
      infixExpression: 'A'.repeat(501),
      postfixExpression: 'A B +',
    })
    assert.equal(response.status, 400)
  })

  test('rejects a malformed JSON body with 400, not 500', async () => {
    const response = await postJson('/api/history', '{ this is not json ')
    const body = await response.json()
    assert.equal(response.status, 400)
    assert.match(body.error, /valid JSON/)
  })

  test('treats SQL-like text as plain data (parameterised queries)', async () => {
    const injection = "A + B'); DROP TABLE conversions; --"
    const created = await postJson('/api/history', {
      infixExpression: injection,
      postfixExpression: 'A B +',
    })
    assert.equal(created.status, 201)

    // The table must still exist and hold the text verbatim.
    const { data } = await (await api('/api/history')).json()
    assert.equal(data.length, 1)
    assert.equal(data[0].infixExpression, injection)
  })
})

describe('DELETE /api/history/:id', () => {
  test('deletes a single entry and leaves the others alone', async () => {
    const { data: keep } = await (
      await postJson('/api/history', { infixExpression: 'keep', postfixExpression: 'keep' })
    ).json()
    const { data: remove } = await (
      await postJson('/api/history', { infixExpression: 'remove', postfixExpression: 'remove' })
    ).json()

    const response = await api('/api/history/' + remove.id, { method: 'DELETE' })
    const body = await response.json()
    assert.equal(response.status, 200)
    assert.equal(body.deleted, 1)

    const { data } = await (await api('/api/history')).json()
    assert.equal(data.length, 1)
    assert.equal(data[0].id, keep.id)
  })

  test('returns 404 for an id that does not exist', async () => {
    const response = await api('/api/history/999999', { method: 'DELETE' })
    const body = await response.json()
    assert.equal(response.status, 404)
    assert.match(body.error, /No history entry/)
  })

  test('returns 400 for an id that is not a positive integer', async () => {
    for (const bad of ['abc', '-1', '0', '1.5']) {
      const response = await api('/api/history/' + bad, { method: 'DELETE' })
      assert.equal(response.status, 400, 'id ' + bad + ' should be rejected')
    }
  })
})

describe('DELETE /api/history', () => {
  test('clears every entry and reports how many were removed', async () => {
    for (let i = 0; i < 3; i++) {
      await postJson('/api/history', { infixExpression: 'A + ' + i, postfixExpression: 'A ' + i + ' +' })
    }

    const response = await api('/api/history', { method: 'DELETE' })
    const body = await response.json()
    assert.equal(response.status, 200)
    assert.equal(body.deleted, 3)

    const { data } = await (await api('/api/history')).json()
    assert.deepEqual(data, [])
  })

  test('is safe to call when the history is already empty', async () => {
    const response = await api('/api/history', { method: 'DELETE' })
    assert.equal(response.status, 200)
    assert.equal((await response.json()).deleted, 0)
  })
})

describe('unknown routes', () => {
  test('returns a JSON 404 rather than an HTML error page', async () => {
    const response = await api('/api/does-not-exist')
    const body = await response.json()
    assert.equal(response.status, 404)
    assert.match(body.error, /Unknown endpoint/)
  })
})

describe('error responses', () => {
  test('never include a stack trace', async () => {
    const response = await postJson('/api/history', { postfixExpression: 'A B +' })
    const body = await response.json()
    assert.deepEqual(Object.keys(body), ['error'])
    assert.doesNotMatch(body.error, /at .*\.js:\d+/)
  })
})
