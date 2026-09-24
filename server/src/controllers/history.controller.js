import * as historyService from '../services/history.service.js'
import { badRequest, notFound } from '../middleware/errorHandler.js'

const MAX_EXPRESSION_LENGTH = 500
const MAX_RESULT_LENGTH = 100

/**
 * Request handling: validate the input, call the service, shape the response.
 * Keeping validation here means the service layer only ever sees clean data.
 */

function requireExpression(value, fieldName) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw badRequest(fieldName + ' is required and must be a non-empty string.')
  }
  const trimmed = value.trim()
  if (trimmed.length > MAX_EXPRESSION_LENGTH) {
    throw badRequest(fieldName + ' must be at most ' + MAX_EXPRESSION_LENGTH + ' characters.')
  }
  return trimmed
}

/** `result` is optional: a conversion with variables has no numeric answer. */
function optionalResult(value) {
  if (value === undefined || value === null || value === '') return null
  const text = String(value).trim()
  if (text.length > MAX_RESULT_LENGTH) {
    throw badRequest('result must be at most ' + MAX_RESULT_LENGTH + ' characters.')
  }
  return text
}

function requireId(rawId) {
  const id = Number(rawId)
  if (!Number.isInteger(id) || id < 1) {
    throw badRequest('id must be a positive whole number.')
  }
  return id
}

export function getHistory(req, res) {
  const items = historyService.listConversions(req.query.limit)
  res.status(200).json({ data: items, count: items.length })
}

export function postHistory(req, res) {
  const body = req.body ?? {}

  const record = historyService.createConversion({
    infixExpression: requireExpression(body.infixExpression, 'infixExpression'),
    postfixExpression: requireExpression(body.postfixExpression, 'postfixExpression'),
    result: optionalResult(body.result),
  })

  res.status(201).json({ data: record })
}

export function deleteHistoryItem(req, res) {
  const id = requireId(req.params.id)
  const removed = historyService.deleteConversion(id)

  if (removed === 0) {
    throw notFound('No history entry with id ' + id + '.')
  }

  res.status(200).json({ deleted: removed, id })
}

export function deleteAllHistory(req, res) {
  const removed = historyService.clearConversions()
  res.status(200).json({ deleted: removed })
}
