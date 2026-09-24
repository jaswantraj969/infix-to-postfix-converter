import { EXAMPLES, INVALID_EXAMPLES } from '../data/examples.js'
import Icon from './Icon.jsx'
import './ExampleChips.css'

/**
 * Clickable examples. Selecting one loads it into the input and converts it
 * immediately - it runs through exactly the same pipeline as typed input,
 * nothing about the result is pre-computed.
 */
export default function ExampleChips({ onSelect, activeExpression }) {
  return (
    <section className="card examples-card" aria-labelledby="examples-heading">
      <div className="card-header">
        <h2 className="card-title" id="examples-heading">
          <Icon name="stack" size={14} />
          Examples
        </h2>
        <span className="examples-hint">Click any expression to run it</span>
      </div>

      <div className="card-body examples-body">
        <ul className="example-list">
          {EXAMPLES.map((example) => (
            <li key={example.infix}>
              <button
                type="button"
                className={
                  'example-chip' + (activeExpression === example.infix ? ' example-chip-active' : '')
                }
                onClick={() => onSelect(example.infix)}
                aria-pressed={activeExpression === example.infix}
              >
                <span className="example-expression">{example.infix}</span>
                <span className="example-note">{example.note}</span>
              </button>
            </li>
          ))}
        </ul>

        <div className="example-invalid">
          <p className="example-invalid-label">
            <Icon name="alert" size={13} />
            Try an invalid one - the validator explains what is wrong:
          </p>
          <ul className="example-invalid-list">
            {INVALID_EXAMPLES.map((example) => (
              <li key={example.infix}>
                <button
                  type="button"
                  className="example-chip example-chip-invalid"
                  onClick={() => onSelect(example.infix)}
                  title={example.note}
                >
                  <span className="example-expression">{example.infix}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
