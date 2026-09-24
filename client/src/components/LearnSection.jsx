import { PRECEDENCE_TABLE } from '../compiler/operators.js'
import Icon from './Icon.jsx'
import './LearnSection.css'

const NOTATIONS = [
  {
    name: 'Infix',
    example: 'A + B * C',
    description:
      'The operator sits between its operands. It is what people write, but a machine cannot read it left to right: it must also know precedence rules and track brackets.',
  },
  {
    name: 'Postfix',
    example: 'A B C * +',
    description:
      'The operator comes after its operands. The order of operations is already baked into the order of the symbols, so no brackets and no precedence rules are needed to read it.',
  },
]

const ALGORITHM_RULES = [
  { token: 'operand', rule: 'Append it to the output. Operand order never changes.' },
  { token: '(', rule: 'Push it. It fences off everything below it on the stack.' },
  { token: ')', rule: 'Pop operators into the output until the matching ( appears, then discard both brackets.' },
  { token: 'operator', rule: 'Pop every stacked operator that must be applied first, then push this one.' },
  { token: 'end', rule: 'Pop whatever is left on the stack into the output.' },
]

/**
 * The teaching panel. It states the concepts the project is assessed on, using
 * the same colours and token styling as the live visualiser above.
 */
export default function LearnSection() {
  return (
    <div className="learn">
      <div className="learn-grid">
        {NOTATIONS.map((notation) => (
          <article className="card learn-card" key={notation.name}>
            <div className="card-body">
              <h3 className="learn-card-title">{notation.name} notation</h3>
              <code className="learn-example">{notation.example}</code>
              <p className="learn-text">{notation.description}</p>
            </div>
          </article>
        ))}
      </div>

      <article className="card learn-card">
        <div className="card-header">
          <h3 className="card-title">
            <Icon name="stack" size={14} />
            Operator precedence and associativity
          </h3>
        </div>
        <div className="learn-table-scroll">
          <table className="learn-table">
            <thead>
              <tr>
                <th scope="col">Level</th>
                <th scope="col">Operators</th>
                <th scope="col">Associativity</th>
                <th scope="col">Meaning</th>
              </tr>
            </thead>
            <tbody>
              {PRECEDENCE_TABLE.map((row) => (
                <tr key={row.level}>
                  <td className="learn-level">{row.level}</td>
                  <td>
                    <span className="step-cells">
                      {row.operators.map((symbol) => (
                        <span className="token token-OPERATOR" key={symbol}>
                          {symbol}
                        </span>
                      ))}
                    </span>
                  </td>
                  <td className="learn-assoc">{row.associativity}</td>
                  <td className="learn-desc">{row.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card-body learn-assoc-note">
          <p className="learn-text">
            <strong>Left associative</strong> means equal-precedence operators group from the left:
            <code className="learn-inline">A - B - C</code> is <code className="learn-inline">(A - B) - C</code>,
            so the first <code className="learn-inline">-</code> is popped when the second arrives.
          </p>
          <p className="learn-text">
            <strong>Right associative</strong> means they group from the right:
            <code className="learn-inline">A ^ B ^ C</code> is <code className="learn-inline">A ^ (B ^ C)</code>,
            so the first <code className="learn-inline">^</code> stays on the stack and the postfix
            form is <code className="learn-inline">A B C ^ ^</code>.
          </p>
        </div>
      </article>

      <article className="card learn-card">
        <div className="card-header">
          <h3 className="card-title">
            <Icon name="code" size={14} />
            The conversion algorithm, one rule per token
          </h3>
        </div>
        <div className="card-body">
          <ol className="learn-rules">
            {ALGORITHM_RULES.map((item) => (
              <li className="learn-rule" key={item.token}>
                <span className="learn-rule-token">{item.token}</span>
                <span className="learn-rule-text">{item.rule}</span>
              </li>
            ))}
          </ol>
          <p className="learn-text learn-why">
            <Icon name="info" size={13} />
            <span>
              Why a stack? Because an operator can only be emitted once it is certain that nothing
              to its right binds more tightly. The stack is exactly the set of operators still
              waiting for that decision, and the most recently postponed one is always the first to
              be resolved &mdash; last in, first out.
            </span>
          </p>
        </div>
      </article>
    </div>
  )
}
