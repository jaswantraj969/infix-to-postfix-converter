import { CompilerError } from './CompilerError.js'
import { OPERATOR_CHARACTERS, UNARY_MINUS } from './operators.js'

/**
 * LEXICAL ANALYSIS (the tokenizer / scanner)
 * ==========================================
 * Turns a flat string of characters into a list of meaningful TOKENS.
 *
 *   "10 + price * 5"
 *        |
 *        v
 *   NUMBER(10) OPERATOR(+) IDENTIFIER(price) OPERATOR(*) NUMBER(5)
 *
 * Why this stage exists: the conversion algorithm must never look at raw
 * characters. If it did, "100" would be read as three separate operands 1, 0, 0
 * and "price" as five operands. The tokenizer uses MAXIMAL MUNCH - at each
 * position it consumes the longest run of characters that forms one token.
 */

export const TokenType = {
  NUMBER: 'NUMBER',
  IDENTIFIER: 'IDENTIFIER',
  OPERATOR: 'OPERATOR',
  LEFT_PAREN: 'LEFT_PAREN',
  RIGHT_PAREN: 'RIGHT_PAREN',
}

const isDigit = (ch) => ch >= '0' && ch <= '9'
const isLetter = (ch) => (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_'
const isIdentifierPart = (ch) => isLetter(ch) || isDigit(ch)
const isWhitespace = (ch) => ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r'

/** Operand-like tokens: the things an operator can be applied to. */
export function isOperandToken(token) {
  return token?.type === TokenType.NUMBER || token?.type === TokenType.IDENTIFIER
}

/**
 * @param {string} input - raw infix expression typed by the user
 * @returns {Array} list of token objects
 * @throws {CompilerError} on an invalid character or a malformed number
 */
export function tokenize(input) {
  if (typeof input !== 'string') {
    throw new CompilerError('Expression must be text.', { phase: 'lexical' })
  }

  const tokens = []
  let i = 0

  while (i < input.length) {
    const char = input[i]

    // 1. Whitespace is a separator only - it never becomes a token.
    if (isWhitespace(char)) {
      i++
      continue
    }

    // 2. NUMBER: one or more digits, optionally with a single decimal point.
    if (isDigit(char) || (char === '.' && isDigit(input[i + 1]))) {
      const start = i
      let seenDot = false

      while (i < input.length && (isDigit(input[i]) || input[i] === '.')) {
        if (input[i] === '.') {
          // A second dot means something like "3.14.15" - reject it instead of
          // silently reading only part of the number.
          if (seenDot) {
            const bad = readMalformedNumber(input, start)
            throw new CompilerError(
              'Malformed number ' + quote(bad) + '. A number may contain at most one decimal point.',
              { phase: 'lexical', position: start, length: bad.length },
            )
          }
          seenDot = true
        }
        i++
      }

      const text = input.slice(start, i)

      // "3." has a trailing dot with no fractional digits.
      if (text.endsWith('.')) {
        throw new CompilerError(
          'Malformed number ' + quote(text) + '. A decimal point must be followed by a digit.',
          { phase: 'lexical', position: start, length: text.length },
        )
      }

      // "5x" / "10abc" - a digit run glued to a letter is not a valid operand.
      if (i < input.length && isLetter(input[i])) {
        const bad = readMalformedNumber(input, start)
        throw new CompilerError(
          'Malformed number ' + quote(bad) + '. A number cannot be directly followed by a letter.',
          { phase: 'lexical', position: start, length: bad.length },
        )
      }

      tokens.push({ type: TokenType.NUMBER, value: Number(text), text, position: start, length: text.length })
      continue
    }

    // 3. IDENTIFIER: a letter or '_' followed by letters, digits or '_'.
    //    This is what allows multi-character names like `price` or `total2`.
    if (isLetter(char)) {
      const start = i
      while (i < input.length && isIdentifierPart(input[i])) i++
      const text = input.slice(start, i)
      tokens.push({ type: TokenType.IDENTIFIER, value: text, text, position: start, length: text.length })
      continue
    }

    // 4. PARENTHESES
    if (char === '(') {
      tokens.push({ type: TokenType.LEFT_PAREN, value: '(', text: '(', position: i, length: 1 })
      i++
      continue
    }
    if (char === ')') {
      tokens.push({ type: TokenType.RIGHT_PAREN, value: ')', text: ')', position: i, length: 1 })
      i++
      continue
    }

    // 5. OPERATOR
    if (OPERATOR_CHARACTERS.includes(char)) {
      const previous = tokens[tokens.length - 1]

      /**
       * Deciding between BINARY minus and UNARY (prefix) minus.
       *
       * A '-' is unary when there is no operand to its left - i.e. it appears at
       * the very start, right after another operator, or right after '('.
       *      "-5 + 3"  -> unary        "8 - 5"   -> binary
       *      "2 * -3"  -> unary        "(a) - 3" -> binary
       * This is the classic reason a lexer keeps a little context.
       */
      const hasLeftOperand = isOperandToken(previous) || previous?.type === TokenType.RIGHT_PAREN

      if ((char === '-' || char === '+') && !hasLeftOperand) {
        if (char === '-') {
          tokens.push({ type: TokenType.OPERATOR, value: UNARY_MINUS, text: '-', position: i, length: 1, unary: true })
        }
        // A unary '+' does not change the value, so it is simply dropped.
        i++
        continue
      }

      tokens.push({ type: TokenType.OPERATOR, value: char, text: char, position: i, length: 1 })
      i++
      continue
    }

    // 6. Anything else is not part of the language.
    throw new CompilerError('Invalid character ' + quote(char) + '.', { phase: 'lexical', position: i, length: 1 })
  }

  return tokens
}

const quote = (text) => "'" + text + "'"

/** Reads the whole malformed run (digits, dots and letters) so the error can quote it in full. */
function readMalformedNumber(input, start) {
  let end = start
  while (end < input.length && (isDigit(input[end]) || input[end] === '.' || isLetter(input[end]))) end++
  return input.slice(start, end)
}

/** Every distinct identifier in the token list, in order of first appearance. */
export function collectIdentifiers(tokens) {
  const seen = []
  for (const token of tokens) {
    if (token.type === TokenType.IDENTIFIER && !seen.includes(token.value)) seen.push(token.value)
  }
  return seen
}
