import { describe, it, expect } from 'vitest'
import { tokenize } from '../tokenizer.js'
import { validateExpression } from '../validator.js'

/** Runs the two front-end stages together and returns the validation result. */
const check = (input) => validateExpression(tokenize(input), input)
const messageOf = (input) => check(input).error?.message

describe('validateExpression - valid expressions', () => {
  const valid = [
    'A', '10', 'price',
    'A + B', 'A - B', 'A * B', 'A / B', 'A % B', 'A ^ B',
    'A + B * C', '(A + B) * C', 'A * (B + C)', '((A + B) * C)',
    'A ^ B ^ C', '10 + 5 * 2', '(10 + 5) * 2', '10 + (5 * (2 + 3))',
    '3.14 * 2', 'price + tax', 'total * quantity',
    'A+B*C', 'A    +    B * C',
    '-5 + 3', '2 * -3', '-(A + B)', '- -A',
  ]

  for (const input of valid) {
    it('accepts ' + JSON.stringify(input), () => {
      expect(check(input).valid).toBe(true)
    })
  }
})

describe('validateExpression - empty input', () => {
  it('rejects an empty expression', () => {
    expect(messageOf('')).toBe('Expression cannot be empty.')
  })

  it('rejects a whitespace-only expression', () => {
    expect(messageOf('     ')).toBe('Expression cannot be empty.')
  })
})

describe('validateExpression - parentheses', () => {
  it('rejects an unclosed "("', () => {
    expect(messageOf('(A + B')).toMatch(/Mismatched parentheses/)
  })

  it('rejects an extra ")"', () => {
    expect(messageOf('A + B)')).toMatch(/Mismatched parentheses/)
  })

  it('rejects deeper unbalanced nesting', () => {
    expect(messageOf('((A + B)')).toMatch(/Mismatched parentheses/)
    expect(messageOf('(A + B))')).toMatch(/Mismatched parentheses/)
  })

  it('rejects empty parentheses', () => {
    expect(messageOf('()')).toBe('Empty parentheses are not allowed.')
    expect(messageOf('A + ()')).toBe('Empty parentheses are not allowed.')
  })

  it('rejects an operator with no right operand before ")"', () => {
    expect(messageOf('(A + )')).toMatch(/missing its right operand/)
  })

  it('rejects an operator directly after "("', () => {
    expect(messageOf('(* A)')).toMatch(/cannot directly follow/)
  })
})

describe('validateExpression - operator placement', () => {
  it('rejects consecutive operators', () => {
    expect(messageOf('A + * B')).toMatch(/Invalid operator sequence/)
    expect(messageOf('A * / B')).toMatch(/Invalid operator sequence/)
    expect(messageOf('A ^ ^ B')).toMatch(/Invalid operator sequence/)
  })

  it('rejects an expression ending with an operator', () => {
    expect(messageOf('A +')).toBe('Expression cannot end with an operator.')
    expect(messageOf('10 *')).toBe('Expression cannot end with an operator.')
    expect(messageOf('A + B -')).toBe('Expression cannot end with an operator.')
  })

  it('rejects an expression beginning with a binary operator', () => {
    expect(messageOf('* A + B')).toBe("Expression cannot begin with the operator '*'.")
    expect(messageOf('/ A')).toBe("Expression cannot begin with the operator '/'.")
    expect(messageOf('^ A')).toBe("Expression cannot begin with the operator '^'.")
  })

  it('still allows a leading unary minus', () => {
    expect(check('-A + B').valid).toBe(true)
  })

  it('rejects an expression ending with a unary minus', () => {
    expect(messageOf('A + -')).toBe('Expression cannot end with an operator.')
  })
})

describe('validateExpression - missing operators', () => {
  it('rejects two operands in a row', () => {
    expect(messageOf('A B')).toMatch(/Missing operator between 'A' and 'B'/)
    expect(messageOf('10 20')).toMatch(/Missing operator between '10' and '20'/)
  })

  it('rejects implicit multiplication', () => {
    expect(messageOf('2(3)')).toMatch(/Missing operator before/)
    expect(messageOf('(A)(B)')).toMatch(/Missing operator between|Missing operator before/)
  })
})

describe('validateExpression - error positions', () => {
  it('points at the offending token so the UI can highlight it', () => {
    const { error } = check('A + * B')
    expect(error.position).toBe(4)
    expect(error.phase).toBe('syntax')
  })
})
