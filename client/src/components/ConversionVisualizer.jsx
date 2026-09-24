import { useStepPlayer } from '../hooks/useStepPlayer.js'
import TokenStream from './TokenStream.jsx'
import StepTable from './StepTable.jsx'
import Icon from './Icon.jsx'
import './ConversionVisualizer.css'

const ACTION_TONE = {
  output: 'tone-operand',
  push: 'tone-push',
  pop: 'tone-pop',
  'pop-push': 'tone-pop',
  flush: 'tone-flush',
}

/**
 * The step-by-step walkthrough of the shunting-yard algorithm.
 *
 * Everything on screen is read from the `steps` trace that the converter
 * produced - the stack contents, the output, and the reason for each decision.
 * Nothing here re-implements or approximates the algorithm.
 */
export default function ConversionVisualizer({ result }) {
  const steps = result?.steps ?? []
  const player = useStepPlayer(steps)

  if (!result?.success || steps.length === 0) return null

  const { step, index, total } = player
  const tokens = result.tokens
  // Each token contributes one step; the final step is the end-of-input flush.
  const currentTokenIndex = index < tokens.length ? index : tokens.length

  return (
    <div className="viz">
      <div className="viz-controls" role="group" aria-label="Step controls">
        <button
          type="button"
          className="btn btn-icon"
          onClick={player.restart}
          disabled={player.isFirst && !player.playing}
          aria-label="Restart from the first step"
          title="Restart"
        >
          <Icon name="restart" size={15} />
        </button>
        <button
          type="button"
          className="btn btn-icon"
          onClick={player.previous}
          disabled={player.isFirst}
          aria-label="Previous step"
          title="Previous step"
        >
          <Icon name="previous" size={15} />
        </button>
        <button
          type="button"
          className="btn btn-primary viz-play"
          onClick={player.togglePlay}
          aria-label={player.playing ? 'Pause the walkthrough' : 'Play the walkthrough'}
        >
          <Icon name={player.playing ? 'pause' : 'play'} size={15} />
          {player.playing ? 'Pause' : 'Play'}
        </button>
        <button
          type="button"
          className="btn btn-icon"
          onClick={player.next}
          disabled={player.isLast}
          aria-label="Next step"
          title="Next step"
        >
          <Icon name="next" size={15} />
        </button>

        <div className="viz-progress">
          <label className="visually-hidden" htmlFor="step-slider">
            Jump to a step
          </label>
          <input
            id="step-slider"
            className="viz-slider"
            type="range"
            min={0}
            max={Math.max(total - 1, 0)}
            value={index}
            onChange={(event) => player.goTo(Number(event.target.value))}
          />
          <span className="viz-step-count" aria-live="polite">
            Step <strong>{index + 1}</strong> of {total}
          </span>
        </div>
      </div>

      <TokenStream tokens={tokens} currentIndex={currentTokenIndex} />

      <div className="viz-machine">
        <StackColumn stack={step?.stack ?? []} />
        <OutputColumn output={step?.output ?? []} postfix={result.postfix} isLast={player.isLast} />
      </div>

      <div className={'viz-action ' + (ACTION_TONE[step?.actionType] ?? '')} aria-live="polite">
        <span className="viz-action-token">
          {step?.token ? (
            <span className={'token token-' + step.token.type}>{step.token.text}</span>
          ) : (
            <span className="token viz-action-end">END</span>
          )}
        </span>
        <span className="viz-action-text">
          <strong className="viz-action-title">{step?.action}</strong>
          <span className="viz-action-detail">{step?.detail}</span>
        </span>
      </div>

      <StepTable steps={steps} currentIndex={index} onSelect={player.goTo} />
    </div>
  )
}

/** The operator stack, drawn bottom-up the way a stack actually grows. */
function StackColumn({ stack }) {
  return (
    <div className="machine-panel">
      <div className="machine-head">
        <h3 className="panel-title">Operator stack</h3>
        <span className="panel-meta">{stack.length} item{stack.length === 1 ? '' : 's'}</span>
      </div>

      <div className="stack-frame">
        {stack.length === 0 ? (
          <p className="stack-empty">empty</p>
        ) : (
          <ol className="stack-items">
            {[...stack].reverse().map((symbol, reverseIndex) => {
              const isTop = reverseIndex === 0
              return (
                <li
                  key={stack.length - reverseIndex + '-' + symbol}
                  className={
                    'stack-cell' +
                    (symbol === '(' ? ' stack-cell-paren' : '') +
                    (isTop ? ' stack-cell-top' : '')
                  }
                >
                  <span className="stack-symbol">{symbol}</span>
                  {isTop && <span className="stack-top-label">top</span>}
                </li>
              )
            })}
          </ol>
        )}
        <span className="stack-base" aria-hidden="true" />
      </div>
    </div>
  )
}

/** The postfix output as it is being built. */
function OutputColumn({ output, postfix, isLast }) {
  return (
    <div className="machine-panel machine-panel-wide">
      <div className="machine-head">
        <h3 className="panel-title">Postfix output</h3>
        <span className="panel-meta">
          {output.length} of {postfix.split(' ').length} symbols
        </span>
      </div>

      <div className={'output-frame' + (isLast ? ' output-frame-complete' : '')}>
        {output.length === 0 ? (
          <p className="output-empty">nothing emitted yet</p>
        ) : (
          <ol className="output-items">
            {output.map((symbol, position) => (
              <li key={position + '-' + symbol} className="output-cell">
                {symbol}
              </li>
            ))}
          </ol>
        )}
      </div>

      {isLast && (
        <p className="output-complete-note">
          <Icon name="check" size={13} />
          Conversion complete
        </p>
      )}
    </div>
  )
}
