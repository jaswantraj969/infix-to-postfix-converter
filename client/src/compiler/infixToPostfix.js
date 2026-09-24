import { CompilerError } from './CompilerError.js'
import { TokenType, isOperandToken } from './tokenizer.js'
import { getPrecedence, isRightAssociative, isUnary, getOperatorName, UNARY_MINUS } from './operators.js'

/**
 * INFIX -> POSTFIX CONVERSION  (Dijkstra's "shunting-yard" algorithm)
 * ===================================================================
 * Two containers do all the work:
 *
 *   output[]        the postfix expression being built, left to right
 *   operatorStack[] operators waiting until it is their turn to be emitted
 *
 * The rules, one sentence each:
 *
 *   operand   -> send it straight to the output (operand order never changes)
 *   '('       -> push it; it acts as a fence that nothing may be popped past
 *   ')'       -> pop operators into the output until the matching '(' is found,
 *                then throw both brackets away (postfix needs no brackets)
 *   operator  -> first pop every stacked operator that must be applied BEFORE
 *                this one, then push this one
 *   end       -> pop whatever is left on the stack into the output
 *
 * "Must be applied before this one" is decided by shouldPopBeforePushing(),
 * which is where precedence and associativity actually matter.
 *
 * Every rule also appends a row to `steps`, which is what the UI animates.
 */

/**
 * Decides whether the operator on top of the stack must be emitted before we
 * push `incoming`.
 *
 *   A + B * C   at '*': top '+' has precedence 1, '*' has 2 -> keep '+' waiting,
 *               so '*' is applied first.      Postfix: A B C * +
 *
 *   A - B + C   at '+': equal precedence, '+' is LEFT associative
 *               -> pop '-' first.             Postfix: A B - C +   ((A-B)+C)
 *
 *   A ^ B ^ C   at the 2nd '^': equal precedence, '^' is RIGHT associative
 *               -> do NOT pop.                Postfix: A B C ^ ^   (A^(B^C))
 */
export function shouldPopBeforePushing(stackTop, incoming) {
  if (stackTop === '(') return false

  // A prefix operator binds to the operand that comes AFTER it, so nothing
  // already on the stack can be applied first.
  if (isUnary(incoming)) return false

  const topPrecedence = getPrecedence(stackTop)
  const incomingPrecedence = getPrecedence(incoming)

  if (topPrecedence > incomingPrecedence) return true
  if (topPrecedence === incomingPrecedence && !isRightAssociative(incoming)) return true
  return false
}

/**
 * @param {Array} tokens - a token list that has already passed validation
 * @returns {{postfix: string, postfixTokens: Array, steps: Array}}
 */
export function infixToPostfix(tokens) {
  const operatorStack = []
  const output = []
  const steps = []

  const record = (token, action, actionType, detail) => {
    steps.push({
      step: steps.length + 1,
      token: token ? { text: displayToken(token), type: token.type, unary: Boolean(token.unary) } : null,
      action,
      actionType,
      detail,
      stack: operatorStack.map(displaySymbol),
      output: output.map((entry) => entry.text),
    })
  }

  for (const token of tokens) {
    // ---- 1. operand: straight to the output -------------------------------
    if (isOperandToken(token)) {
      output.push({ text: token.text, type: token.type })
      record(token, 'Append operand to output', 'output',
        'Operands keep their original left-to-right order in postfix notation.')
      continue
    }

    // ---- 2. '(' : push as a fence -----------------------------------------
    if (token.type === TokenType.LEFT_PAREN) {
      operatorStack.push('(')
      record(token, 'Push ( onto the stack', 'push',
        'A left bracket marks a boundary: no operator below it may be popped until its match arrives.')
      continue
    }

    // ---- 3. ')' : unwind back to the matching '(' -------------------------
    if (token.type === TokenType.RIGHT_PAREN) {
      const popped = []
      while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== '(') {
        const operator = operatorStack.pop()
        output.push({ text: displaySymbol(operator), type: TokenType.OPERATOR })
        popped.push(displaySymbol(operator))
      }

      if (operatorStack.length === 0) {
        throw new CompilerError('Mismatched parentheses: unexpected right bracket.', {
          phase: 'conversion', position: token.position, length: 1,
        })
      }

      operatorStack.pop() // discard the '(' itself - postfix needs no brackets

      record(token,
        popped.length ? 'Pop until ( : ' + popped.join(', ') : 'Discard the empty bracket pair',
        'pop',
        'The bracketed sub-expression is complete, so both brackets are discarded.')
      continue
    }

    // ---- 4. operator: pop what must come first, then push -----------------
    if (token.type === TokenType.OPERATOR) {
      const popped = []
      while (operatorStack.length > 0 &&
             shouldPopBeforePushing(operatorStack[operatorStack.length - 1], token.value)) {
        const operator = operatorStack.pop()
        output.push({ text: displaySymbol(operator), type: TokenType.OPERATOR })
        popped.push(displaySymbol(operator))
      }

      operatorStack.push(token.value)

      record(token,
        popped.length
          ? 'Pop ' + popped.join(', ') + ', then push ' + displaySymbol(token.value)
          : 'Push ' + displaySymbol(token.value) + ' onto the stack',
        popped.length ? 'pop-push' : 'push',
        explainOperatorDecision(token.value, popped))
      continue
    }
  }

  // ---- 5. end of input: flush the stack -----------------------------------
  const flushed = []
  while (operatorStack.length > 0) {
    const operator = operatorStack.pop()
    if (operator === '(') {
      throw new CompilerError('Mismatched parentheses: a left bracket is never closed.', { phase: 'conversion' })
    }
    output.push({ text: displaySymbol(operator), type: TokenType.OPERATOR })
    flushed.push(displaySymbol(operator))
  }

  record(null,
    flushed.length ? 'End of input - pop remaining: ' + flushed.join(', ') : 'End of input - stack already empty',
    'flush',
    'Anything still waiting on the stack is applied last, from the top down.')

  return {
    postfix: output.map((entry) => entry.text).join(' '),
    postfixTokens: output,
    steps,
  }
}

/** Unary minus is 'u-' internally so that postfix stays unambiguous. */
function displaySymbol(symbol) {
  return symbol === UNARY_MINUS ? 'u-' : symbol
}

function displayToken(token) {
  return token.value === UNARY_MINUS ? '-' : token.text
}

/** Plain-English reason for each precedence decision, shown in the step table. */
function explainOperatorDecision(symbol, popped) {
  const name = getOperatorName(symbol)
  const rank = getPrecedence(symbol)
  const associativity = isRightAssociative(symbol) ? 'right' : 'left'

  if (isUnary(symbol)) {
    return name + ' is a prefix operator, so it is always pushed and waits for the operand that follows it.'
  }
  if (popped.length === 0) {
    return name + ' (precedence ' + rank + ', ' + associativity +
      '-associative) binds tighter than the stack top, so nothing is popped first.'
  }
  return 'Popped ' + popped.join(', ') + ' because they bind at least as tightly as ' + name +
    ' (precedence ' + rank + ', ' + associativity + '-associative).'
}
