import { useCallback, useEffect, useState } from 'react'
import * as api from '../services/api.js'

/**
 * Owns everything about the conversion history: the list, the loading and
 * offline flags, and the four operations the UI can perform.
 *
 * The important design rule lives in `save()`: a failure to store a conversion
 * is reported, but it never removes the conversion from the screen and never
 * throws into the component tree.
 */
export function useHistory() {
  const [items, setItems] = useState([])
  const [status, setStatus] = useState('loading') // loading | ready | offline
  const [busyId, setBusyId] = useState(null)

  const load = useCallback(async () => {
    try {
      const data = await api.fetchHistory()
      setItems(data)
      setStatus('ready')
      return { ok: true }
    } catch (error) {
      setStatus('offline')
      return { ok: false, message: error.message }
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  /** Saves one conversion. Returns a result object instead of throwing. */
  const save = useCallback(async (entry) => {
    try {
      const saved = await api.saveConversion(entry)
      if (saved) setItems((current) => [saved, ...current])
      setStatus('ready')
      return { ok: true }
    } catch (error) {
      if (error.offline) setStatus('offline')
      return { ok: false, message: error.message }
    }
  }, [])

  const remove = useCallback(async (id) => {
    setBusyId(id)
    try {
      await api.deleteConversion(id)
      setItems((current) => current.filter((item) => item.id !== id))
      return { ok: true }
    } catch (error) {
      if (error.offline) setStatus('offline')
      return { ok: false, message: error.message }
    } finally {
      setBusyId(null)
    }
  }, [])

  const clear = useCallback(async () => {
    try {
      await api.clearHistory()
      setItems([])
      return { ok: true }
    } catch (error) {
      if (error.offline) setStatus('offline')
      return { ok: false, message: error.message }
    }
  }, [])

  return { items, status, busyId, load, save, remove, clear }
}
