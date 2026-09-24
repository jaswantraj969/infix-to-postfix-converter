/**
 * OPERATOR TABLE
 * ==============
 * A compiler needs to know three things about every operator:
 *
 *   1. precedence    - which operator binds tighter  (* binds tighter than +)
 *   2. associativity - how to group operators of EQUAL precedence
 *   3. arity         - how many operands it consumes (2 = binary, 1 = unary)
 *
 * Keeping this information in one table (instead of scattering `if` statements
 * through the algorithm) is what makes the converter "general purpose": adding a
 * new operator only means adding one row here.
 */

/** Precedence levels. A HIGHER number binds tighter. */
export const PRECEDENCE_LEVELS = {
  ADDITIVE: 1,        // +  -
  MULTIPLICATIVE: 2,  // *  /  %
  UNARY: 3,           // -x   (prefix minus)
  EXPONENT: 4,        // ^
}

/**
 * `u-` is the internal name for a prefix (unary) minus, e.g. the '-' in "-5 + 3".
 * It is deliberately NOT the same token as binary '-', because in postfix
 * notation "5 3 -" (subtract) and "5 u- " (negate) must stay distinguishable.
 */
export const UNARY_MINUS = 'u-'

export const OPERATORS = {
  '+': {
    symbol: '+',
    name: 'Addition',
    precedence: PRECEDENCE_LEVELS.ADDITIVE,
    associativity: 'left',
    arity: 2,
    apply: (a, b) => a + b,
  },
  '-': {
    symbol: '-',
    name: 'Subtraction',
    precedence: PRECEDENCE_LEVELS.ADDITIVE,
    associativity: 'left',
    arity: 2,
    apply: (a, b) => a - b,
  },
  '*': {
    symbol: '*',
    name: 'Multiplication',
    precedence: PRECEDENCE_LEVELS.MULTIPLICATIVE,
    associativity: 'left',
    arity: 2,
    apply: (a, b) => a * b,
  },
  '/': {
    symbol: '/',
    name: 'Division',
    precedence: PRECEDENCE_LEVELS.MULTIPLICATIVE,
    associativity: 'left',
    arity: 2,
    // Division by zero is rejected by the evaluator, not silently turned into Infinity.
    apply: (a, b) => a / b,
  },
  '%': {
    symbol: '%',
    name: 'Modulus',
    precedence: PRECEDENCE_LEVELS.MULTIPLICATIVE,
    associativity: 'left',
    arity: 2,
    apply: (a, b) => a % b,
  },
  '^': {
    symbol: '^',
    name: 'Exponentiation',
    precedence: PRECEDENCE_LEVELS.EXPONENT,
    // RIGHT associative: A ^ B ^ C  means  A ^ (B ^ C)  ->  postfix  A B C ^ ^
    associativity: 'right',
    arity: 2,
    apply: (a, b) => a ** b,
  },
  [UNARY_MINUS]: {
    symbol: UNARY_MINUS,
    name: 'Unary minus (negation)',
    precedence: PRECEDENCE_LEVELS.UNARY,
    associativity: 'right',
    arity: 1,
    apply: (a) => -a,
  },
}

/** Characters that may start a binary operator in the source text. */
export const OPERATOR_CHARACTERS = ['+', '-', '*', '/', '%', '^']

export function isOperator(symbol) {
  return Object.prototype.hasOwnProperty.call(OPERATORS, symbol)
}

/**
 * Returns the binding power of an operator.
 * Unknown symbols return 0 so they can never out-rank a real operator.
 */
export function getPrecedence(symbol) {
  return isOperator(symbol) ? OPERATORS[symbol].precedence : 0
}

export function getAssociativity(symbol) {
  return isOperator(symbol) ? OPERATORS[symbol].associativity : null
}

export function isRightAssociative(symbol) {
  return getAssociativity(symbol) === 'right'
}

export function isLeftAssociative(symbol) {
  return getAssociativity(symbol) === 'left'
}

export function isUnary(symbol) {
  return isOperator(symbol) && OPERATORS[symbol].arity === 1
}

export function getOperatorName(symbol) {
  return isOperator(symbol) ? OPERATORS[symbol].name : symbol
}

/** Table used by the "Operator precedence" panel in the UI. */
export const PRECEDENCE_TABLE = [
  { level: 4, operators: ['^'], associativity: 'Right', description: 'Exponentiation' },
  { level: 3, operators: ['-x'], associativity: 'Right', description: 'Unary minus (negation)' },
  { level: 2, operators: ['*', '/', '%'], associativity: 'Left', description: 'Multiplication, division, modulus' },
  { level: 1, operators: ['+', '-'], associativity: 'Left', description: 'Addition, subtraction' },
]
