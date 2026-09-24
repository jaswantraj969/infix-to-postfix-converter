import Icon from './Icon.jsx'
import './VariablePanel.css'

/**
 * Optional values for the identifiers found in the expression.
 *
 * Conversion never depends on these: an expression made entirely of variables
 * converts perfectly well. They exist only so that a symbolic expression can
 * also be evaluated, which makes the link between the two halves of the
 * project concrete.
 */
export default function VariablePanel({ identifiers, values, onChange, onClear }) {
  if (identifiers.length === 0) return null

  const filledCount = identifiers.filter((name) => String(values[name] ?? '').trim() !== '').length

  return (
    <section className="card variable-card" aria-labelledby="variables-heading">
      <div className="card-header">
        <h2 className="card-title" id="variables-heading">
          <Icon name="variable" size={14} />
          Variable values
        </h2>
        <div className="variable-header-meta">
          <span className="pill variable-count">
            {filledCount} of {identifiers.length} set
          </span>
          {filledCount > 0 && (
            <button type="button" className="btn btn-sm btn-ghost" onClick={onClear}>
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="card-body variable-body">
        <p className="variable-intro">
          The conversion above is already complete. Assign numbers here to evaluate the postfix
          expression as well.
        </p>

        <div className="variable-grid">
          {identifiers.map((name) => (
            <div className="variable-field" key={name}>
              <label className="variable-name" htmlFor={'var-' + name}>
                {name}
              </label>
              <span className="variable-equals" aria-hidden="true">
                =
              </span>
              <input
                id={'var-' + name}
                className="variable-input"
                type="number"
                inputMode="decimal"
                step="any"
                placeholder="0"
                value={values[name] ?? ''}
                onChange={(event) => onChange(name, event.target.value)}
                autoComplete="off"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
