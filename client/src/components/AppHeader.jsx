import Icon from './Icon.jsx'
import './AppHeader.css'

const BACKEND_STATE = {
  loading: { dot: 'dot', label: 'Connecting to history server' },
  ready:   { dot: 'dot dot-ok', label: 'History server connected' },
  offline: { dot: 'dot dot-warn', label: 'History server offline' },
}

/**
 * The header carries the project identity and one genuinely useful piece of
 * live information: whether the backend is reachable. The status is real - it
 * comes from the history request, not from a hard-coded value.
 */
export default function AppHeader({ backendStatus }) {
  const state = BACKEND_STATE[backendStatus] ?? BACKEND_STATE.loading

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <span className="brand-bar brand-bar-1" />
            <span className="brand-bar brand-bar-2" />
            <span className="brand-bar brand-bar-3" />
          </span>
          <span className="brand-text">
            <h1 className="brand-title">
              Infix <span className="brand-arrow" aria-hidden="true">&rarr;</span>
              <span className="visually-hidden"> to </span> Postfix
            </h1>
            <p className="brand-subtitle">Interactive expression conversion and evaluation</p>
          </span>
        </div>

        <div className="header-meta">
          <span className="pill header-status" title={state.label}>
            <span className={state.dot} aria-hidden="true" />
            {state.label}
          </span>
          <span className="pill header-course">
            <Icon name="code" size={13} />
            Compiler Construction
          </span>
        </div>
      </div>
    </header>
  )
}
