import { describe, it, expect } from 'vitest'
import { convert, EVALUATION_STATUS } from '../index.js'

/**
 * End-to-end tests of the driver: these are the exact guarantees the UI relies
 * on. convert() must NEVER throw - every failure comes back as a result object.
 */

describe('convert - the documented example expressions', () => {
  const examples = [
    { infix: 'A + B * C', postfix: 'A B C * +' },
    { infix: '(A + B) * C', postfix: 'A B + C *' },
    { infix: 'A * (B + C)', postfix: 'A B C + *' },
    { infix: '10 + 5 * 2', postfix: '10 5 2 * +', result: '20' },
    { infix: '(10 + 5) * 2', postfix: '10 5 + 2 *', result: '30' },
    { infix: '10 + (5 * (2 + 3))', postfix: '10 5 2 3 + * +', result: '35' },
    { infix: 'A ^ B ^ C', postfix: 'A B C ^ ^' },
  ]

  for (const example of examples) {
    it(example.infix + '  ->  ' + example.postfix, () => {
      const result = convert(example.infix)
      expect(result.success).toBe(true)
      expect(result.postfix).toBe(example.postfix)
      if (example.result) {
        expect(result.evaluation.status).toBe(EVALUATION_STATUS.OK)
        expect(result.evaluation.formatted).toBe(example.result)
      }
    })
  }
})

describe('convert - evaluation status', () => {
  it('evaluates a fully numeric expression', () => {
    const { evaluation } = convert('(10 + 5) * 2')
    expect(evaluation.status).toBe(EVALUATION_STATUS.OK)
    expect(evaluation.value).toBe(30)
  })

  it('converts a variable expression but reports the values it needs', () => {
    const result = convert('A + B * C')
    expect(result.success).toBe(true)
    expect(result.postfix).toBe('A B C * +')
    expect(result.evaluation.status).toBe(EVALUATION_STATUS.NEEDS_VARIABLES)
    expect(result.evaluation.missingVariables).toEqual(['A', 'B', 'C'])
    expect(result.evaluation.message).toMatch(/Assign values to A, B, C/)
  })

  it('evaluates once the variable values are supplied', () => {
    const { evaluation } = convert('A + B * C', { A: 10, B: 5, C: 2 })
    expect(evaluation.status).toBe(EVALUATION_STATUS.OK)
    expect(evaluation.formatted).toBe('20')
  })

  it('reports partially supplied variables', () => {
    const { evaluation } = convert('A + B', { A: 10 })
    expect(evaluation.status).toBe(EVALUATION_STATUS.NEEDS_VARIABLES)
    expect(evaluation.missingVariables).toEqual(['B'])
  })

  it('reports an evaluation error without losing the conversion', () => {
    const result = convert('10 / 0')
    expect(result.success).toBe(true)
    expect(result.postfix).toBe('10 0 /')
    expect(result.evaluation.status).toBe(EVALUATION_STATUS.ERROR)
    expect(result.evaluation.message).toBe('Division by zero is not defined.')
  })
})

describe('convert - invalid input never throws', () => {
  const invalid = [
    ['', 'Expression cannot be empty.'],
    ['   ', 'Expression cannot be empty.'],
    ['A + * B', /Invalid operator sequence/],
    ['A +', 'Expression cannot end with an operator.'],
    ['* A', "Expression cannot begin with the operator '*'."],
    ['(A + B', /Mismatched parentheses/],
    ['A + B)', /Mismatched parentheses/],
    ['A @ B', "Invalid character '@'."],
    ['3.14.15', /Malformed number/],
    ['5x + 1', /Malformed number/],
    ['A B', /Missing operator/],
  ]

  for (const [input, expected] of invalid) {
    it('rejects ' + JSON.stringify(input), () => {
      const result = convert(input)
      expect(result.success).toBe(false)
      expect(result.postfix).toBeNull()
      if (expected instanceof RegExp) expect(result.error.message).toMatch(expected)
      else expect(result.error.message).toBe(expected)
    })
  }

  it('handles non-string input safely', () => {
    for (const input of [null, undefined, 42, {}, []]) {
      expect(convert(input).success).toBe(false)
    }
  })

  it('never leaks a stack trace into the result', () => {
    const result = convert('A @ B')
    expect(result.error.stack).toBeUndefined()
    expect(Object.keys(result.error).sort()).toEqual(['length', 'message', 'phase', 'position'])
  })
})

describe('convert - result payload', () => {
  it('returns tokens, steps and identifiers for the UI', () => {
    const result = convert('10 + price * 5')
    expect(result.tokens.map((t) => t.type)).toEqual([
      'NUMBER', 'OPERATOR', 'IDENTIFIER', 'OPERATOR', 'NUMBER',
    ])
    expect(result.identifiers).toEqual(['price'])
    expect(result.steps.length).toBe(result.tokens.length + 1)
    expect(result.infix).toBe('10 + price * 5')
  })

  it('trims the incoming expression', () => {
    expect(convert('   A + B   ').infix).toBe('A + B')
  })
})
