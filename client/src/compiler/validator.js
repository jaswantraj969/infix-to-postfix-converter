import { CompilerError } from './CompilerError.js'
import { TokenType, isOperandToken } from './tokenizer.js'
import { isUnary, UNARY_MINUS } from './operators.js'

/**
 * SYNTAX VALIDATION
 * =================
 * Runs after the tokenizer and before the conversion. It answers one question:
 * "is this sequence of tokens a well-formed arithmetic expression?"
 *
 * It is a small STATE MACHINE with a single piece of state:
 *
 *      expectOperand = true   -> the next token must be an operand, a '(' or a prefix '-'
 *      expectOperand = false  -> the next token must be a binary operator or a ')'
 *
 * Plus a counter for the parenthesis nesting depth.
 * Catching errors here means the conversion algorithm itself can stay short and
 * assume its input is already valid.
 */

/**
 * @param {Array} tokens - output of tokenize()
 * @param {string} source - original text, used only to report a position
 * @returns {{valid: boolean, error: CompilerError|null}}
 */
export function validateExpression(tokens, source = '') {
  try {
    assertValidExpression(tokens, source)
    return { valid: true, error: null }
  } catch (error) {
    if (error instanceof CompilerError) return { valid: false, error }
    throw error
  }
}

/** Same checks as validateExpression(), but throws instead of returning a result. */
export function assertValidExpression(tokens, source = '') {
  if (!Array.isArray(tokens) || tokens.length === 0) {
    throw new CompilerError('Expression cannot be empty.', { phase: 'syntax', position: 0 })
  }

  let expectOperand = true
  let depth = 0

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    const previous = tokens[i - 1]

    // ---- operands: numbers and identifiers -------------------------------
    if (isOperandToken(token)) {
      if (!expectOperand) {
        // e.g. "A B" or "10 20" - two operands with nothing joining them.
        throw new CompilerError(
          'Missing operator between ' + q(previous.text) + ' and ' + q(token.text) + '.',
          { phase: 'syntax', position: token.position, length: token.length },
        )
      }
      expectOperand = false
      continue
    }

    // ---- '(' -------------------------------------------------------------
    if (token.type === TokenType.LEFT_PAREN) {
      if (!expectOperand) {
        // e.g. "A (B + C)" or "2(3)" - implicit multiplication is not supported.
        throw new CompilerError(
          'Missing operator before ' + q('(') + '.',
          { phase: 'syntax', position: token.position, length: 1 },
        )
      }
      depth++
      expectOperand = true
      continue
    }

    // ---- ')' -------------------------------------------------------------
    if (token.type === TokenType.RIGHT_PAREN) {
      if (expectOperand) {
        if (previous?.type === TokenType.LEFT_PAREN) {
          throw new CompilerError('Empty parentheses are not allowed.', {
            phase: 'syntax', position: previous.position, length: 2,
          })
        }
        // e.g. "(A + )" - an operator with no right-hand operand.
        throw new CompilerError(
          'Operator ' + q(previous?.text ?? '') + ' is missing its right operand.',
          { phase: 'syntax', position: previous?.position ?? token.position, length: previous?.length ?? 1 },
        )
      }
      depth--
      if (depth < 0) {
        // e.g. "A + B)" - a ')' that never had a matching '('.
        throw new CompilerError('Mismatched parentheses: unexpected ' + q(')') + '.', {
          phase: 'syntax', position: token.position, length: 1,
        })
      }
      expectOperand = false
      continue
    }

    // ---- operators -------------------------------------------------------
    if (token.type === TokenType.OPERATOR) {
      if (isUnary(token.value)) {
        // The tokenizer only produces a unary '-' where an operand was expected,
        // and a prefix operator still leaves an operand outstanding.
        expectOperand = true
        continue
      }

      if (expectOperand) {
        if (i === 0) {
          throw new CompilerError(
            'Expression cannot begin with the operator ' + q(token.text) + '.',
            { phase: 'syntax', position: token.position, length: token.length },
          )
        }
        if (previous?.type === TokenType.LEFT_PAREN) {
          throw new CompilerError(
            'An operator cannot directly follow ' + q('(') + '.',
            { phase: 'syntax', position: token.position, length: token.length },
          )
        }
        // e.g. "A + * B" - two binary operators in a row.
        throw new CompilerError(
          'Invalid operator sequence: ' + q(displayText(previous)) + ' followed by ' + q(token.text) + '.',
          { phase: 'syntax', position: token.position, length: token.length },
        )
      }

      expectOperand = true
      continue
    }

    throw new CompilerError('Unrecognised token ' + q(token.text) + '.', {
      phase: 'syntax', position: token.position, length: token.length,
    })
  }

  // ---- end-of-input checks ------------------------------------------------
  const last = tokens[tokens.length - 1]

  if (expectOperand) {
    if (last.type === TokenType.LEFT_PAREN) {
      throw new CompilerError('Mismatched parentheses: ' + q('(') + ' is never closed.', {
        phase: 'syntax', position: last.position, length: 1,
      })
    }
    throw new CompilerError('Expression cannot end with an operator.', {
      phase: 'syntax', position: last.position, length: last.length,
    })
  }

  if (depth > 0) {
    const unclosed = depth === 1 ? 'one unclosed ' + q('(') : depth + ' unclosed ' + q('(') + ' brackets'
    throw new CompilerError('Mismatched parentheses: ' + unclosed + '.', {
      phase: 'syntax', position: findLastUnclosedParen(tokens), length: 1,
    })
  }

  return true
}

const q = (text) => "'" + text + "'"

/** Unary minus is stored internally as 'u-'; show it the way the user typed it. */
function displayText(token) {
  if (!token) return ''
  return token.value === UNARY_MINUS ? '-' : token.text
}

/** Position of the '(' that was never closed, so the UI can point at it. */
function findLastUnclosedParen(tokens) {
  const stack = []
  for (const token of tokens) {
    if (token.type === TokenType.LEFT_PAREN) stack.push(token)
    else if (token.type === TokenType.RIGHT_PAREN) stack.pop()
  }
  return stack.length ? stack[stack.length - 1].position : 0
}
