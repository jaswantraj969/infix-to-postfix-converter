import { CompilerError } from './CompilerError.js'
import { TokenType } from './tokenizer.js'
import { OPERATORS, UNARY_MINUS, isOperator, isUnary, getOperatorName } from './operators.js'

/**
 * POSTFIX EVALUATION
 * ==================
 * This is the payoff of the whole conversion: postfix needs no brackets and no
 * precedence rules, so it can be evaluated by one left-to-right scan and a
 * single stack.
 *
 *   operand   -> push its value
 *   operator  -> pop the operands it needs, apply it, push the result back
 *   end       -> exactly one value must remain: the answer
 *
 *   "10 5 2 * +"   push 10 | push 5 | push 2 | '*' pops 5,2 -> push 10
 *                  | '+' pops 10,10 -> push 20 | result 20
 *
 * Note the pop order for binary operators: the SECOND operand is popped first,
 * because it was pushed last. Getting this backwards silently breaks '-' and
 * '/', which is exactly why the step trace below shows both operands.
 *
 * JavaScript's eval() is deliberately not used anywhere: the point of the
 * project is to run the algorithm, not to hand the work to the language.
 */

/**
 * @param {Array} postfixTokens - output of infixToPostfix()
 * @param {Object} variables - e.g. { A: 10, B: 5 }
 * @returns {{value: number, steps: Array}}
 * @throws {CompilerError}
 */
export function evaluatePostfix(postfixTokens, variables = {}) {
  const stack = []
  const steps = []

  const record = (token, action, detail) => {
    steps.push({
      step: steps.length + 1,
      token,
      action,
      detail,
      stack: stack.map(formatNumber),
    })
  }

  for (const entry of postfixTokens) {
    const text = entry.text

    // ---- operator: pop, apply, push back ----------------------------------
    if (entry.type === TokenType.OPERATOR || isOperator(normalise(text))) {
      const symbol = normalise(text)
      const definition = OPERATORS[symbol]

      if (isUnary(symbol)) {
        if (stack.length < 1) {
          throw new CompilerError('Operator ' + text + ' is missing its operand.', { phase: 'evaluation' })
        }
        const operand = stack.pop()
        const result = definition.apply(operand)
        stack.push(result)
        record(text, 'negate ' + formatNumber(operand) + ' = ' + formatNumber(result),
          'Unary minus consumes one operand.')
        continue
      }

      if (stack.length < 2) {
        throw new CompilerError('Operator ' + text + ' does not have two operands to work with.', {
          phase: 'evaluation',
        })
      }

      // Right operand comes off first - it was pushed last.
      const right = stack.pop()
      const left = stack.pop()

      if ((symbol === '/' || symbol === '%') && right === 0) {
        const what = symbol === '/' ? 'Division by zero' : 'Modulus by zero'
        throw new CompilerError(what + ' is not defined.', { phase: 'evaluation' })
      }

      const result = definition.apply(left, right)

      if (!Number.isFinite(result)) {
        throw new CompilerError(
          'The result of ' + formatNumber(left) + ' ' + text + ' ' + formatNumber(right) +
          ' is too large or not a real number.',
          { phase: 'evaluation' },
        )
      }

      stack.push(result)
      record(text,
        formatNumber(left) + ' ' + text + ' ' + formatNumber(right) + ' = ' + formatNumber(result),
        'Pop two operands (right first), apply ' + getOperatorName(symbol) + ', push the result.')
      continue
    }

    // ---- operand: push its value ------------------------------------------
    if (entry.type === TokenType.NUMBER) {
      stack.push(Number(text))
      record(text, 'push ' + text, 'A literal number goes straight onto the stack.')
      continue
    }

    // identifier - needs a value supplied by the user
    const value = variables[text]
    if (value === undefined || value === null || value === '' || Number.isNaN(Number(value))) {
      throw new CompilerError('No numeric value was provided for the variable ' + text + '.', {
        phase: 'evaluation',
      })
    }
    stack.push(Number(value))
    record(text, 'push ' + text + ' = ' + formatNumber(Number(value)),
      'The variable is replaced by the value you supplied.')
  }

  if (stack.length !== 1) {
    throw new CompilerError('The expression did not reduce to a single value.', { phase: 'evaluation' })
  }

  return { value: stack[0], steps }
}

/** The postfix string shows unary minus as 'u-'; map it back to the operator table key. */
function normalise(text) {
  return text === 'u-' ? UNARY_MINUS : text
}

/**
 * Keeps floating point noise out of the UI: 0.1 + 0.2 shows as 0.3,
 * not 0.30000000000000004.
 */
export function formatNumber(value) {
  if (!Number.isFinite(value)) return String(value)
  if (Number.isInteger(value)) return String(value)
  return String(Number(value.toPrecision(12)))
}
