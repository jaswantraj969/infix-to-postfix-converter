import { describe, it, expect } from 'vitest'
import { tokenize } from '../tokenizer.js'
import { assertValidExpression } from '../validator.js'
import { infixToPostfix, shouldPopBeforePushing } from '../infixToPostfix.js'
import { getPrecedence, isRightAssociative, isLeftAssociative } from '../operators.js'

/** Full front end, returning just the postfix string. */
const toPostfix = (input) => {
  const tokens = tokenize(input)
  assertValidExpression(tokens, input)
  return infixToPostfix(tokens).postfix
}

describe('getPrecedence / isRightAssociative', () => {
  it('ranks ^ above * / % above + -', () => {
    expect(getPrecedence('^')).toBeGreaterThan(getPrecedence('*'))
    expect(getPrecedence('*')).toBeGreaterThan(getPrecedence('+'))
    expect(getPrecedence('*')).toBe(getPrecedence('/'))
    expect(getPrecedence('/')).toBe(getPrecedence('%'))
    expect(getPrecedence('+')).toBe(getPrecedence('-'))
  })

  it('returns 0 for anything that is not an operator', () => {
    expect(getPrecedence('(')).toBe(0)
    expect(getPrecedence('A')).toBe(0)
  })

  it('marks ^ right associative and the rest left associative', () => {
    expect(isRightAssociative('^')).toBe(true)
    for (const op of ['+', '-', '*', '/', '%']) {
      expect(isLeftAssociative(op)).toBe(true)
      expect(isRightAssociative(op)).toBe(false)
    }
  })
})

describe('shouldPopBeforePushing', () => {
  it('never pops past a left bracket', () => {
    expect(shouldPopBeforePushing('(', '+')).toBe(false)
    expect(shouldPopBeforePushing('(', '^')).toBe(false)
  })

  it('pops a higher-precedence operator', () => {
    expect(shouldPopBeforePushing('*', '+')).toBe(true)
    expect(shouldPopBeforePushing('^', '*')).toBe(true)
  })

  it('keeps a lower-precedence operator waiting', () => {
    expect(shouldPopBeforePushing('+', '*')).toBe(false)
  })

  it('pops an equal-precedence LEFT associative operator', () => {
    expect(shouldPopBeforePushing('-', '+')).toBe(true)
    expect(shouldPopBeforePushing('/', '*')).toBe(true)
  })

  it('does NOT pop an equal-precedence RIGHT associative operator', () => {
    expect(shouldPopBeforePushing('^', '^')).toBe(false)
  })
})

describe('infixToPostfix - basic expressions', () => {
  const cases = [
    ['A + B', 'A B +'],
    ['A - B', 'A B -'],
    ['A * B', 'A B *'],
    ['A / B', 'A B /'],
    ['A % B', 'A B %'],
    ['A ^ B', 'A B ^'],
    ['A', 'A'],
  ]
  for (const [input, expected] of cases) {
    it(input + '  ->  ' + expected, () => expect(toPostfix(input)).toBe(expected))
  }
})

describe('infixToPostfix - precedence', () => {
  const cases = [
    ['A + B * C', 'A B C * +'],
    ['A * B + C', 'A B * C +'],
    ['A + B * C - D', 'A B C * + D -'],
    ['A + B / C', 'A B C / +'],
    ['A ^ B * C', 'A B ^ C *'],
    ['A * B ^ C', 'A B C ^ *'],
    ['A + B % C', 'A B C % +'],
  ]
  for (const [input, expected] of cases) {
    it(input + '  ->  ' + expected, () => expect(toPostfix(input)).toBe(expected))
  }
})

describe('infixToPostfix - parentheses', () => {
  const cases = [
    ['(A + B) * C', 'A B + C *'],
    ['A * (B + C)', 'A B C + *'],
    ['((A + B) * C)', 'A B + C *'],
    ['10 + (5 * (2 + 3))', '10 5 2 3 + * +'],
    ['(A + B) * (C - D)', 'A B + C D - *'],
    ['((A))', 'A'],
  ]
  for (const [input, expected] of cases) {
    it(input + '  ->  ' + expected, () => expect(toPostfix(input)).toBe(expected))
  }
})

describe('infixToPostfix - associativity', () => {
  it('A ^ B ^ C is RIGHT associative -> A B C ^ ^', () => {
    expect(toPostfix('A ^ B ^ C')).toBe('A B C ^ ^')
  })

  it('A ^ B ^ C ^ D stays right associative', () => {
    expect(toPostfix('A ^ B ^ C ^ D')).toBe('A B C D ^ ^ ^')
  })

  it('(A ^ B) ^ C forces left grouping', () => {
    expect(toPostfix('(A ^ B) ^ C')).toBe('A B ^ C ^')
  })

  it('A - B - C is LEFT associative -> A B - C -', () => {
    expect(toPostfix('A - B - C')).toBe('A B - C -')
  })

  it('A / B / C is LEFT associative -> A B / C /', () => {
    expect(toPostfix('A / B / C')).toBe('A B / C /')
  })
})

describe('infixToPostfix - numbers, identifiers and whitespace', () => {
  const cases = [
    ['10 + 5', '10 5 +'],
    ['10 + 5 * 2', '10 5 2 * +'],
    ['(10 + 5) * 2', '10 5 + 2 *'],
    ['3.14 * 2', '3.14 2 *'],
    ['100 + 250', '100 250 +'],
    ['1000 * 25', '1000 25 *'],
    ['price + tax', 'price tax +'],
    ['total * quantity', 'total quantity *'],
    ['A+B*C', 'A B C * +'],
    ['A    +    B * C', 'A B C * +'],
    ['-5 + 3', '5 u- 3 +'],
    ['-(A + B)', 'A B + u-'],
    ['2 ^ -3', '2 3 u- ^'],
  ]
  for (const [input, expected] of cases) {
    it(JSON.stringify(input) + '  ->  ' + expected, () => expect(toPostfix(input)).toBe(expected))
  }
})

describe('infixToPostfix - step trace', () => {
  it('records one row per token plus a final flush row', () => {
    const tokens = tokenize('A + B * C')
    const { steps } = infixToPostfix(tokens)
    expect(steps).toHaveLength(tokens.length + 1)
    expect(steps[0]).toMatchObject({ step: 1, actionType: 'output', output: ['A'], stack: [] })
    expect(steps[1]).toMatchObject({ actionType: 'push', stack: ['+'] })
    expect(steps.at(-1)).toMatchObject({ actionType: 'flush', stack: [], output: ['A', 'B', 'C', '*', '+'] })
  })

  it('snapshots the stack and output after every step', () => {
    const { steps } = infixToPostfix(tokenize('(A + B) * C'))
    expect(steps.map((s) => s.stack.join(' '))).toEqual(['(', '(', '( +', '( +', '', '*', '*', ''])
  })
})
