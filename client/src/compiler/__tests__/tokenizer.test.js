import { describe, it, expect } from 'vitest'
import { tokenize, collectIdentifiers, TokenType } from '../tokenizer.js'
import { CompilerError } from '../CompilerError.js'

/** Compact helper: "NUMBER(10) OPERATOR(+)" -> easy to assert on. */
const shape = (input) => tokenize(input).map((t) => t.type + '(' + t.text + ')').join(' ')

describe('tokenize - numbers', () => {
  it('keeps a multi-digit number as ONE token', () => {
    const tokens = tokenize('100')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({ type: TokenType.NUMBER, value: 100, text: '100' })
  })

  it('does not split 100 into 1, 0, 0', () => {
    expect(shape('100 + 250')).toBe('NUMBER(100) OPERATOR(+) NUMBER(250)')
  })

  it('reads decimal numbers', () => {
    expect(tokenize('3.14')[0].value).toBe(3.14)
    expect(shape('3.14 * 2')).toBe('NUMBER(3.14) OPERATOR(*) NUMBER(2)')
  })

  it('reads a leading-dot decimal', () => {
    expect(tokenize('.5 + 1')[0].value).toBe(0.5)
  })

  it('rejects a number with two decimal points', () => {
    expect(() => tokenize('3.14.15')).toThrow(CompilerError)
    expect(() => tokenize('3.14.15')).toThrow(/at most one decimal point/)
  })

  it('rejects a trailing decimal point', () => {
    expect(() => tokenize('3.')).toThrow(/must be followed by a digit/)
  })

  it('rejects a number glued to a letter', () => {
    expect(() => tokenize('5x')).toThrow(/cannot be directly followed by a letter/)
  })
})

describe('tokenize - identifiers', () => {
  it('keeps a multi-character identifier as ONE token', () => {
    const tokens = tokenize('price')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({ type: TokenType.IDENTIFIER, value: 'price' })
  })

  it('handles single-character identifiers', () => {
    expect(shape('A+B')).toBe('IDENTIFIER(A) OPERATOR(+) IDENTIFIER(B)')
  })

  it('allows digits and underscores after the first letter', () => {
    expect(shape('total_2 / n')).toBe('IDENTIFIER(total_2) OPERATOR(/) IDENTIFIER(n)')
  })

  it('collects distinct identifiers in order of first appearance', () => {
    expect(collectIdentifiers(tokenize('A + B * A - C'))).toEqual(['A', 'B', 'C'])
  })
})

describe('tokenize - whitespace', () => {
  it('produces identical tokens regardless of spacing', () => {
    const tight = shape('A+B*C')
    expect(shape('A + B * C')).toBe(tight)
    expect(shape('A    +    B * C')).toBe(tight)
    expect(shape('  A\t+\nB * C  ')).toBe(tight)
  })
})

describe('tokenize - operators and parentheses', () => {
  it('recognises every supported operator', () => {
    for (const op of ['+', '-', '*', '/', '%', '^']) {
      expect(tokenize('A ' + op + ' B')[1]).toMatchObject({ type: TokenType.OPERATOR, value: op })
    }
  })

  it('recognises parentheses', () => {
    expect(shape('(A)')).toBe('LEFT_PAREN(() IDENTIFIER(A) RIGHT_PAREN())')
  })
})

describe('tokenize - unary minus detection', () => {
  it('marks a leading minus as unary', () => {
    expect(tokenize('-5 + 3')[0]).toMatchObject({ unary: true })
  })

  it('marks a minus after an operator as unary', () => {
    expect(tokenize('2 * -3')[2]).toMatchObject({ unary: true })
  })

  it('marks a minus after "(" as unary', () => {
    expect(tokenize('(-3)')[1]).toMatchObject({ unary: true })
  })

  it('treats a minus after an operand as BINARY', () => {
    expect(tokenize('8 - 5')[1].unary).toBeUndefined()
  })

  it('treats a minus after ")" as BINARY', () => {
    expect(tokenize('(a) - 3')[3].unary).toBeUndefined()
  })

  it('drops a redundant unary plus', () => {
    expect(shape('+5')).toBe('NUMBER(5)')
  })
})

describe('tokenize - invalid characters', () => {
  it('rejects an unsupported symbol and reports its position', () => {
    expect(() => tokenize('A + B @ C')).toThrow("Invalid character '@'.")
    try {
      tokenize('A + B @ C')
    } catch (error) {
      expect(error.position).toBe(6)
      expect(error.phase).toBe('lexical')
    }
  })

  it('rejects other stray symbols', () => {
    for (const bad of ['#', '$', '&', '!', '[', '{']) {
      expect(() => tokenize('A ' + bad + ' B')).toThrow(/Invalid character/)
    }
  })

  it('returns an empty token list for empty input', () => {
    expect(tokenize('')).toEqual([])
    expect(tokenize('   ')).toEqual([])
  })
})
