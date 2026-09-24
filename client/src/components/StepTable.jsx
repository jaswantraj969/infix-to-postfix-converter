import './StepTable.css'

/**
 * The complete conversion trace as a table - the form a lecturer expects to see
 * in a compiler-construction assignment. Every row is clickable, so the
 * animation above and the table stay in sync.
 */
export default function StepTable({ steps, currentIndex, onSelect }) {
  return (
    <div className="step-table-wrap">
      <div className="machine-head step-table-head">
        <h3 className="panel-title">Conversion trace</h3>
        <span className="panel-meta">Select a row to jump to that step</span>
      </div>

      <div className="step-table-scroll">
        <table className="step-table">
          <caption className="visually-hidden">
            Step-by-step trace of the infix to postfix conversion
          </caption>
          <thead>
            <tr>
              <th scope="col" className="col-step">#</th>
              <th scope="col" className="col-token">Token</th>
              <th scope="col" className="col-action">Action</th>
              <th scope="col" className="col-stack">Operator stack</th>
              <th scope="col" className="col-output">Output</th>
            </tr>
          </thead>
          <tbody>
            {steps.map((step, index) => (
              <tr
                key={step.step}
                className={index === currentIndex ? 'step-row step-row-current' : 'step-row'}
                onClick={() => onSelect(index)}
                aria-current={index === currentIndex ? 'step' : undefined}
              >
                <td className="col-step">
                  <button
                    type="button"
                    className="step-jump"
                    onClick={(event) => {
                      event.stopPropagation()
                      onSelect(index)
                    }}
                    aria-label={'Jump to step ' + step.step}
                  >
                    {step.step}
                  </button>
                </td>
                <td className="col-token">
                  {step.token ? (
                    <span className={'token token-' + step.token.type}>{step.token.text}</span>
                  ) : (
                    <span className="step-end">END</span>
                  )}
                </td>
                <td className="col-action">{step.action}</td>
                <td className="col-stack">
                  {step.stack.length ? (
                    <span className="step-cells">
                      {step.stack.map((symbol, position) => (
                        <span className="step-cell step-cell-stack" key={position}>
                          {symbol}
                        </span>
                      ))}
                    </span>
                  ) : (
                    <span className="step-dash">&mdash;</span>
                  )}
                </td>
                <td className="col-output">
                  {step.output.length ? (
                    <span className="step-cells">
                      {step.output.map((symbol, position) => (
                        <span className="step-cell" key={position}>
                          {symbol}
                        </span>
                      ))}
                    </span>
                  ) : (
                    <span className="step-dash">&mdash;</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
