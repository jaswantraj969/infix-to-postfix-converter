import { useId } from 'react'
import Icon from './Icon.jsx'
import './ExpressionInput.css'

const MAX_LENGTH = 200

/**
 * The expression editor: a code-style input, the error report, and the two
 * actions. The error report deliberately imitates a compiler diagnostic -
 * the source line with a caret under the exact character that failed.
 */
export default function ExpressionInput({ value, onChange, onConvert, onClear, error, hasResult }) {
  const inputId = useId()
  const errorId = useId()
  const hintId = useId()

  const handleKeyDown = (event) => {
    // Expressions are single-line, so Enter is the natural "convert" key.
    if (event.key === 'Enter') {
      event.preventDefault()
      onConvert()
    }
  }

  const isEmpty = value.trim().length === 0

  return (
    <section className="card input-card" aria-labelledby={inputId + '-label'}>
      <div className="card-header">
        <h2 className="card-title" id={inputId + '-label'}>
          <Icon name="code" size={14} />
          Infix expression
        </h2>
        <span className="input-counter" aria-hidden="true">
          {value.length}/{MAX_LENGTH}
        </span>
      </div>

      <div className="card-body input-body">
        <label className="visually-hidden" htmlFor={inputId}>
          Enter an infix arithmetic expression
        </label>

        <div className={'input-shell' + (error ? ' input-shell-error' : '')}>
          <span className="input-prompt" aria-hidden="true">
            &gt;
          </span>
          <textarea
            id={inputId}
            className="input-field"
            value={value}
            onChange={(event) => onChange(event.target.value.slice(0, MAX_LENGTH))}
            onKeyDown={handleKeyDown}
            placeholder="A + B * C"
            rows={2}
            spellCheck="false"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : hintId}
          />
        </div>

        {error ? (
          <div className="input-error" id={errorId} role="alert">
            <span className="input-error-head">
              <Icon name="alert" size={14} />
              <span className="input-error-phase">{error.phase} error</span>
            </span>
            <p className="input-error-message">{error.message}</p>
            {Number.isInteger(error.position) && value.length > 0 && (
              <pre className="input-error-caret" aria-hidden="true">
                <span className="caret-source">{value}</span>
                {'\n'}
                <span className="caret-marker">
                  {' '.repeat(Math.min(error.position, value.length))}
                  {'^'.repeat(Math.max(error.length || 1, 1))}
                </span>
              </pre>
            )}
          </div>
        ) : (
          <p className="input-hint" id={hintId}>
            Operators <code>+ - * / % ^</code> and brackets. Operands can be numbers
            (<code>10</code>, <code>3.14</code>) or names (<code>A</code>, <code>price</code>).
          </p>
        )}

        <div className="input-actions">
          <button type="button" className="btn btn-primary" onClick={onConvert} disabled={isEmpty}>
            <Icon name="arrowRight" size={15} />
            Convert
          </button>
          <button
            type="button"
            className="btn"
            onClick={onClear}
            disabled={isEmpty && !hasResult && !error}
          >
            <Icon name="close" size={14} />
            Clear
          </button>
          <span className="input-kbd-hint" aria-hidden="true">
            <kbd>Enter</kbd> to convert
          </span>
        </div>
      </div>
    </section>
  )
}
