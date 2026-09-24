import { useState } from 'react'
import Icon from './Icon.jsx'
import './HistoryPanel.css'

/** "2 minutes ago" / "12 Mar, 14:05" - short and readable. */
function formatTimestamp(isoString) {
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return ''

  const secondsAgo = Math.floor((Date.now() - date.getTime()) / 1000)
  if (secondsAgo < 60) return 'just now'
  if (secondsAgo < 3600) return Math.floor(secondsAgo / 60) + ' min ago'
  if (secondsAgo < 86400) return Math.floor(secondsAgo / 3600) + ' h ago'

  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) +
    ', ' + date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

/**
 * Conversion history, read from SQLite through the REST API.
 * Entries are only ever created by a real conversion - there is no seed data.
 */
export default function HistoryPanel({ items, status, busyId, onReload, onOpen, onDelete, onClear }) {
  const [confirmingClear, setConfirmingClear] = useState(false)

  const handleClear = async () => {
    if (!confirmingClear) {
      setConfirmingClear(true)
      return
    }
    setConfirmingClear(false)
    await onClear()
  }

  return (
    <section className="card history-card" aria-labelledby="history-heading">
      <div className="card-header">
        <h2 className="card-title" id="history-heading">
          <Icon name="history" size={14} />
          Conversion history
        </h2>

        <div className="history-actions">
          <span className="pill history-count">
            {items.length} saved
          </span>
          <button type="button" className="btn btn-sm btn-ghost" onClick={onReload}>
            <Icon name="reload" size={13} />
            Refresh
          </button>
          {items.length > 0 && (
            <button
              type="button"
              className={'btn btn-sm ' + (confirmingClear ? 'btn-confirm-clear' : 'btn-danger-ghost')}
              onClick={handleClear}
              onBlur={() => setConfirmingClear(false)}
            >
              <Icon name="trash" size={13} />
              {confirmingClear ? 'Confirm clear all' : 'Clear all'}
            </button>
          )}
        </div>
      </div>

      {status === 'offline' ? (
        <div className="empty-state">
          <span className="empty-state-icon history-icon-warn">
            <Icon name="alert" size={18} />
          </span>
          <span className="empty-state-title">History server unavailable</span>
          <p className="empty-state-text">
            Conversion and evaluation still work normally &mdash; they run entirely in the browser.
            Start the backend with <code>npm run dev</code> to save history again.
          </p>
          <button type="button" className="btn btn-sm" onClick={onReload}>
            <Icon name="reload" size={13} />
            Try again
          </button>
        </div>
      ) : status === 'loading' ? (
        <div className="history-loading" aria-live="polite">
          {[0, 1, 2].map((row) => (
            <div className="history-skeleton" key={row} />
          ))}
          <span className="visually-hidden">Loading history</span>
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">
            <Icon name="history" size={18} />
          </span>
          <span className="empty-state-title">No conversions saved yet</span>
          <p className="empty-state-text">
            Every successful conversion is stored in the local SQLite database and will still be
            here the next time you start the application.
          </p>
        </div>
      ) : (
        <ul className="history-list">
          {items.map((item) => (
            <li className={'history-item' + (busyId === item.id ? ' history-item-busy' : '')} key={item.id}>
              <button
                type="button"
                className="history-open"
                onClick={() => onOpen(item)}
                aria-label={'Load the expression ' + item.infixExpression}
              >
                <span className="history-expressions">
                  <code className="history-infix">{item.infixExpression}</code>
                  <Icon name="arrowRight" size={13} className="history-arrow" />
                  <code className="history-postfix">{item.postfixExpression}</code>
                </span>
                <span className="history-meta">
                  {item.result !== null && item.result !== undefined ? (
                    <span className="history-result">
                      <Icon name="equals" size={11} />
                      {item.result}
                    </span>
                  ) : (
                    <span className="history-result history-result-none">not evaluated</span>
                  )}
                  <time className="history-time" dateTime={item.createdAt}>
                    {formatTimestamp(item.createdAt)}
                  </time>
                </span>
              </button>

              <button
                type="button"
                className="btn btn-icon btn-danger-ghost history-delete"
                onClick={() => onDelete(item.id)}
                disabled={busyId === item.id}
                aria-label={'Delete the history entry for ' + item.infixExpression}
                title="Delete this entry"
              >
                <Icon name="trash" size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
