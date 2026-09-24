/**
 * The clickable examples shown under the input box.
 * `note` is what the example is meant to demonstrate - each one earns its place.
 */
export const EXAMPLES = [
  { infix: 'A + B * C',          note: 'Precedence: * before +' },
  { infix: '(A + B) * C',        note: 'Brackets override precedence' },
  { infix: 'A * (B + C)',        note: 'Bracketed right operand' },
  { infix: 'A ^ B ^ C',          note: 'Right associativity' },
  { infix: '10 + 5 * 2',         note: 'Evaluates to 20' },
  { infix: '(10 + 5) * 2',       note: 'Evaluates to 30' },
  { infix: '10 + (5 * (2 + 3))', note: 'Nested brackets, = 35' },
  { infix: '100 + 250 * 2',      note: 'Multi-digit numbers' },
  { infix: '3.14 * 2 ^ 2',       note: 'Decimals and exponent' },
  { infix: 'price + tax * 2',    note: 'Multi-character identifiers' },
  { infix: 'total % 7',          note: 'Modulus operator' },
  { infix: '-5 + 3 * 2',         note: 'Unary minus' },
]

/** Deliberately broken inputs, used by the "error handling" examples. */
export const INVALID_EXAMPLES = [
  { infix: 'A + * B', note: 'Consecutive operators' },
  { infix: '(A + B',  note: 'Unclosed bracket' },
  { infix: 'A +',     note: 'Trailing operator' },
  { infix: 'A @ B',   note: 'Invalid character' },
]
