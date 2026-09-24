/**
 * A single error type used by every stage of the front end
 * (lexical analysis -> syntax validation -> conversion -> evaluation).
 *
 * `position` and `length` point back into the original source text so the UI can
 * underline exactly the character that caused the problem.
 */
export class CompilerError extends Error {
  constructor(message, { phase = 'syntax', position = null, length = 0 } = {}) {
    super(message)
    this.name = 'CompilerError'
    this.phase = phase       // 'lexical' | 'syntax' | 'conversion' | 'evaluation'
    this.position = position // index into the input string, or null
    this.length = length     // how many characters to highlight
  }
}
