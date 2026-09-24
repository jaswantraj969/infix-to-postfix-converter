import { useState } from 'react'
import Icon from './Icon.jsx'
import { EVALUATION_STATUS } from '../compiler/index.js'
import './ResultPanel.css'

/**
 * The three outputs of a conversion: the expression that was read, the postfix
 * translation, and the evaluation. Each evaluation outcome gets its own honest
 * presentation - a value, a request for variable values, or an error. A failed
 * evaluation never fabricates a number.
 */
export default function ResultPanel({ result }) {
  const [copied, setCopied] = useState(false)

  if (!result || !result.success) {
    return (
      <section className="card result-card" aria-labelledby="result-heading">
        <div className="card-header">
          <h2 className="card-title" id="result-heading">
            <Icon name="arrowRight" size={14} />
            Result
          </h2>
        </div>
        <div className="empty-state">
          <span className="empty-state-icon">
            <Icon name="code" size={18} />
          </span>
          <span className="empty-state-title">Nothing converted yet</span>
          <p className="empty-state-text">
            Enter an infix expression above, or pick one of the examples, to see its postfix
            form and the step-by-step conversion.
          </p>
        </div>
      </section>
    )
  }

  const { infix, postfix, evaluation } = result

  const copyPostfix = async () => {
    try {
      await navigator.clipboard.writeText(postfix)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // Clipboard access can be blocked; the expression is on screen regardless.
      setCopied(false)
    }
  }

  return (
    <section className="card result-card" aria-labelledby="result-heading">
      <div className="card-header">
        <h2 className="card-title" id="result-heading">
          <Icon name="arrowRight" size={14} />
          Result
        </h2>
        <span className="pill result-ok">
          <span className="dot dot-ok" aria-hidden="true" />
          Converted
        </span>
      </div>

      <div className="card-body result-body">
        <div className="result-row">
          <span className="result-label">Infix</span>
          <code className="result-value result-value-muted">{infix}</code>
        </div>

        <div className="result-row result-row-primary">
          <span className="result-label">Postfix</span>
          <div className="result-postfix-line">
            <code className="result-value result-postfix">{postfix}</code>
            <button
              type="button"
              className="btn btn-sm btn-ghost result-copy"
              onClick={copyPostfix}
              aria-label="Copy the postfix expression"
            >
              <Icon name={copied ? 'check' : 'stack'} size={13} />
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        <EvaluationRow evaluation={evaluation} />
      </div>
    </section>
  )
}

function EvaluationRow({ evaluation }) {
  if (!evaluation) return null

  if (evaluation.status === EVALUATION_STATUS.OK) {
    return (
      <div className="result-row result-row-value">
        <span className="result-label">Result</span>
        <code className="result-value result-number">{evaluation.formatted}</code>
      </div>
    )
  }

  if (evaluation.status === EVALUATION_STATUS.NEEDS_VARIABLES) {
    return (
      <div className="result-row">
        <span className="result-label">Result</span>
        <p className="result-note result-note-info">
          <Icon name="variable" size={14} />
          {evaluation.message}
        </p>
      </div>
    )
  }

  return (
    <div className="result-row">
      <span className="result-label">Result</span>
      <p className="result-note result-note-error" role="alert">
        <Icon name="alert" size={14} />
        {evaluation.message}
      </p>
    </div>
  )
}
