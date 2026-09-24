import { describe, it, expect } from 'vitest'
import { tokenize } from '../tokenizer.js'
import { assertValidExpression } from '../validator.js'
import { infixToPostfix } from '../infixToPostfix.js'
import { evaluatePostfix, formatNumber } from '../evaluatePostfix.js'
import { CompilerError } from '../CompilerError.js'

/** Convert then evaluate, so the tests exercise the real pipeline. */
const run = (input, variables = {}) => {
  const tokens = tokenize(input)
  assertValidExpression(tokens, input)
  const { postfixTokens } = infixToPostfix(tokens)
  return evaluatePostfix(postfixTokens, variables).value
}

describe('evaluatePostfix - arithmetic', () => {
  const cases = [
    ['10 + 5', 15],
    ['10 - 5', 5],
    ['10 * 5', 50],
    ['10 / 5', 2],
    ['10 % 3', 1],
    ['2 ^ 10', 1024],
    ['10 + 5 * 2', 20],
    ['(10 + 5) * 2', 30],
    ['10 + (5 * (2 + 3))', 35],
    ['100 + 250', 350],
    ['1000 * 25', 25000],
    ['3.14 * 2', 6.28],
    ['(1 + 2) * (3 + 4)', 21],
    ['-5 + 3', -2],
    ['2 * -3', -6],
    ['-(2 + 3)', -5],
  ]
  for (const [input, expected] of cases) {
    it(input + '  =  ' + expected, () => expect(run(input)).toBeCloseTo(expected, 10))
  }
})

describe('evaluatePostfix - operand order matters', () => {
  it('subtracts in the right order (not reversed)', () => {
    expect(run('10 - 3')).toBe(7)
    expect(run('3 - 10')).toBe(-7)
  })

  it('divides in the right order', () => {
    expect(run('20 / 4')).toBe(5)
    expect(run('4 / 20')).toBe(0.2)
  })

  it('applies left associativity correctly', () => {
    expect(run('100 - 20 - 5')).toBe(75)   // (100-20)-5, not 100-(20-5)
    expect(run('100 / 10 / 2')).toBe(5)    // (100/10)/2, not 100/(10/2)
  })

  it('applies right associativity to ^', () => {
    expect(run('2 ^ 3 ^ 2')).toBe(512)     // 2^(3^2) = 2^9, not (2^3)^2 = 64
  })
})

describe('evaluatePostfix - variables', () => {
  it('substitutes supplied values', () => {
    expect(run('A + B * C', { A: 10, B: 5, C: 2 })).toBe(20)
  })

  it('accepts multi-character variable names', () => {
    expect(run('price * quantity', { price: 25.5, quantity: 4 })).toBe(102)
  })

  it('accepts string values from form inputs', () => {
    expect(run('A + B', { A: '10', B: '5' })).toBe(15)
  })

  it('throws when a variable has no value', () => {
    expect(() => run('A + B', { A: 1 })).toThrow(CompilerError)
    expect(() => run('A + B', { A: 1 })).toThrow(/No numeric value was provided for the variable B/)
  })
})

describe('evaluatePostfix - error handling', () => {
  it('rejects division by zero', () => {
    expect(() => run('10 / 0')).toThrow('Division by zero is not defined.')
    expect(() => run('10 / (5 - 5)')).toThrow('Division by zero is not defined.')
  })

  it('rejects modulus by zero', () => {
    expect(() => run('10 % 0')).toThrow('Modulus by zero is not defined.')
  })

  it('rejects a result that is not a finite number', () => {
    expect(() => run('10 ^ 999 * 10 ^ 999')).toThrow(/too large or not a real number/)
  })

  it('rejects a malformed postfix stream with too few operands', () => {
    expect(() => evaluatePostfix([{ text: '+', type: 'OPERATOR' }])).toThrow(/does not have two operands/)
  })

  it('rejects a postfix stream that leaves more than one value', () => {
    const tokens = [
      { text: '1', type: 'NUMBER' },
      { text: '2', type: 'NUMBER' },
    ]
    expect(() => evaluatePostfix(tokens)).toThrow(/did not reduce to a single value/)
  })
})

describe('evaluatePostfix - step trace', () => {
  it('shows each push and each operator application', () => {
    const { postfixTokens } = infixToPostfix(tokenize('10 + 5 * 2'))
    const { value, steps } = evaluatePostfix(postfixTokens)
    expect(value).toBe(20)
    expect(steps.map((s) => s.action)).toEqual([
      'push 10', 'push 5', 'push 2', '5 * 2 = 10', '10 + 10 = 20',
    ])
    expect(steps.at(-1).stack).toEqual(['20'])
  })
})

describe('formatNumber', () => {
  it('prints integers without a decimal point', () => {
    expect(formatNumber(20)).toBe('20')
    expect(formatNumber(-7)).toBe('-7')
  })

  it('hides binary floating point noise', () => {
    expect(formatNumber(0.1 + 0.2)).toBe('0.3')
    expect(formatNumber(6.28)).toBe('6.28')
  })
})
