import { useCallback, useRef, useState } from 'react'

const DISMISS_AFTER_MS = 4500

/**
 * Small transient notifications ("saved", "could not save", ...).
 * One at a time is enough for this application, which keeps it predictable.
 */
export function useToast() {
  const [toast, setToast] = useState(null)
  const timerRef = useRef(null)

  const dismiss = useCallback(() => {
    clearTimeout(timerRef.current)
    setToast(null)
  }, [])

  const show = useCallback((message, tone = 'info') => {
    clearTimeout(timerRef.current)
    setToast({ message, tone, id: Date.now() })
    timerRef.current = setTimeout(() => setToast(null), DISMISS_AFTER_MS)
  }, [])

  return { toast, show, dismiss }
}
