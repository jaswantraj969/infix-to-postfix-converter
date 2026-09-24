import Icon from './Icon.jsx'
import { EVALUATION_STATUS } from '../compiler/index.js'
import './EvaluationTrace.css'

/**
 * How the postfix expression is evaluated: one stack, one left-to-right pass.
 * Shown only when a numeric answer actually exists.
 */
export default function EvaluationTrace({ result }) {
  const evaluation = result?.evaluation
  if (!result?.success || evaluation?.status !== EVALUATION_STATUS.OK) return null
  if (evaluation.steps.length === 0) return null

  return (
    <div className="eval">
      <div className="eval-intro">
        <code className="eval-source">{result.postfix}</code>
        <Icon name="arrowRight" size={15} className="eval-arrow" />
        <code className="eval-answer">{evaluation.formatted}</code>
      </div>

      <ol className="eval-steps">
        {evaluation.steps.map((step) => {
          const isOperator = /^(u-|[+\-*/%^])$/.test(step.token)
          return (
            <li className="eval-step" key={step.step}>
              <span className="eval-step-index">{step.step}</span>

              <span className={'token ' + (isOperator ? 'token-OPERATOR' : 'token-NUMBER')}>
                {step.token}
              </span>

              <span className="eval-step-action">{step.action}</span>

              <span className="eval-step-stack">
                <span className="eval-stack-label">stack</span>
                {step.stack.length ? (
                  step.stack.map((value, position) => (
                    <span
                      className={
                        'eval-stack-cell' +
                        (position === step.stack.length - 1 ? ' eval-stack-cell-top' : '')
                      }
                      key={position}
                    >
                      {value}
                    </span>
                  ))
                ) : (
                  <span className="step-dash">&mdash;</span>
                )}
              </span>
            </li>
          )
        })}
      </ol>

      <p className="eval-footnote">
        <Icon name="info" size={13} />
        One value is left on the stack at the end &mdash; that is the answer. No brackets and no
        precedence rules were needed, and <code>eval()</code> is never used.
      </p>
    </div>
  )
}
