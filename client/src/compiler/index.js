import { CompilerError } from './CompilerError.js'
import { tokenize, collectIdentifiers, TokenType } from './tokenizer.js'
import { assertValidExpression, validateExpression } from './validator.js'
import { infixToPostfix } from './infixToPostfix.js'
import { evaluatePostfix, formatNumber } from './evaluatePostfix.js'

/**
 * THE COMPILER DRIVER
 * ===================
 * Runs the four stages in order and collects everything the UI needs:
 *
 *   1. tokenize()            characters  -> tokens          (lexical analysis)
 *   2. assertValidExpression() tokens    -> ok / error      (syntax analysis)
 *   3. infixToPostfix()      tokens      -> postfix + trace (translation)
 *   4. evaluatePostfix()     postfix     -> a number        (execution)
 *
 * Each stage either succeeds or throws a CompilerError; this driver is the one
 * place that catches them, so the rest of the application never sees an
 * exception and never sees a stack trace.
 */

export const EVALUATION_STATUS = {
  OK: 'ok',
  NEEDS_VARIABLES: 'needs-variables',
  ERROR: 'error',
}

/**
 * @param {string} expression - raw infix text
 * @param {Object} variables - optional values for identifiers, e.g. { A: 10 }
 * @returns {Object} a plain result object; it never throws
 */
export function convert(expression, variables = {}) {
  const infix = typeof expression === 'string' ? expression.trim() : ''

  if (infix.length === 0) {
    return failure(new CompilerError('Expression cannot be empty.', { phase: 'syntax', position: 0 }), infix)
  }

  try {
    // --- 1 & 2: front end --------------------------------------------------
    const tokens = tokenize(infix)
    assertValidExpression(tokens, infix)

    // --- 3: translation ----------------------------------------------------
    const { postfix, postfixTokens, steps } = infixToPostfix(tokens)
    const identifiers = collectIdentifiers(tokens)

    // --- 4: execution ------------------------------------------------------
    const evaluation = runEvaluation(postfixTokens, identifiers, variables)

    return {
      success: true,
      infix,
      tokens,
      postfix,
      postfixTokens,
      steps,
      identifiers,
      evaluation,
      error: null,
    }
  } catch (error) {
    if (error instanceof CompilerError) return failure(error, infix)
    // Anything unexpected is reported as a generic message - never a raw stack trace.
    return failure(new CompilerError('The expression could not be processed.', { phase: 'syntax' }), infix)
  }
}

/**
 * Evaluation is optional: an expression full of variables is still a perfectly
 * good conversion, it just has no numeric answer until values are supplied.
 */
function runEvaluation(postfixTokens, identifiers, variables) {
  const missing = identifiers.filter((name) => {
    const value = variables?.[name]
    return value === undefined || value === null || String(value).trim() === '' || Number.isNaN(Number(value))
  })

  if (missing.length > 0) {
    return {
      status: EVALUATION_STATUS.NEEDS_VARIABLES,
      value: null,
      formatted: null,
      steps: [],
      missingVariables: missing,
      message: missing.length === 1
        ? 'Assign a value to ' + missing[0] + ' to evaluate this expression.'
        : 'Assign values to ' + missing.join(', ') + ' to evaluate this expression.',
    }
  }

  try {
    const { value, steps } = evaluatePostfix(postfixTokens, variables)
    return {
      status: EVALUATION_STATUS.OK,
      value,
      formatted: formatNumber(value),
      steps,
      missingVariables: [],
      message: null,
    }
  } catch (error) {
    return {
      status: EVALUATION_STATUS.ERROR,
      value: null,
      formatted: null,
      steps: [],
      missingVariables: [],
      message: error instanceof CompilerError ? error.message : 'The expression could not be evaluated.',
    }
  }
}

function failure(error, infix) {
  return {
    success: false,
    infix,
    tokens: [],
    postfix: null,
    postfixTokens: [],
    steps: [],
    identifiers: [],
    evaluation: null,
    error: {
      message: error.message,
      phase: error.phase,
      position: error.position,
      length: error.length,
    },
  }
}

export {
  tokenize,
  collectIdentifiers,
  TokenType,
  validateExpression,
  assertValidExpression,
  infixToPostfix,
  evaluatePostfix,
  formatNumber,
  CompilerError,
}
export * from './operators.js'
