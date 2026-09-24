import Icon from './Icon.jsx'
import './Toast.css'

const TONE_ICON = { success: 'check', error: 'alert', info: 'info' }

/** A single transient notification, announced to assistive technology. */
export default function Toast({ toast, onDismiss }) {
  if (!toast) return null

  return (
    <div className="toast-region" role="status" aria-live="polite">
      <div className={'toast toast-' + toast.tone} key={toast.id}>
        <Icon name={TONE_ICON[toast.tone] ?? 'info'} size={15} />
        <span className="toast-message">{toast.message}</span>
        <button
          type="button"
          className="toast-close"
          onClick={onDismiss}
          aria-label="Dismiss notification"
        >
          <Icon name="close" size={12} />
        </button>
      </div>
    </div>
  )
}
