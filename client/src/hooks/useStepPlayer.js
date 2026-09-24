import { useCallback, useEffect, useRef, useState } from 'react'

const PLAY_INTERVAL_MS = 900

/**
 * Drives the step-by-step visualiser: which step is on screen, and the
 * play / pause / next / previous controls around it.
 *
 * The index is clamped to the steps array, so loading a different expression
 * can never leave the player pointing at a step that no longer exists.
 */
export function useStepPlayer(steps) {
  const total = steps.length
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const timerRef = useRef(null)

  // A new conversion restarts the walkthrough at the beginning.
  useEffect(() => {
    setIndex(0)
    setPlaying(false)
  }, [steps])

  const stop = useCallback(() => setPlaying(false), [])

  const next = useCallback(() => {
    setIndex((current) => Math.min(current + 1, Math.max(total - 1, 0)))
  }, [total])

  const previous = useCallback(() => {
    setPlaying(false)
    setIndex((current) => Math.max(current - 1, 0))
  }, [])

  const goTo = useCallback(
    (value) => {
      setPlaying(false)
      setIndex(Math.min(Math.max(value, 0), Math.max(total - 1, 0)))
    },
    [total],
  )

  const restart = useCallback(() => {
    setPlaying(false)
    setIndex(0)
  }, [])

  const togglePlay = useCallback(() => {
    if (total === 0) return
    setPlaying((current) => {
      // Pressing play at the end starts again from the top.
      if (!current) setIndex((i) => (i >= total - 1 ? 0 : i))
      return !current
    })
  }, [total])

  useEffect(() => {
    if (!playing || total === 0) return undefined

    timerRef.current = setInterval(() => {
      setIndex((current) => {
        if (current >= total - 1) {
          setPlaying(false)
          return current
        }
        return current + 1
      })
    }, PLAY_INTERVAL_MS)

    return () => clearInterval(timerRef.current)
  }, [playing, total])

  const safeIndex = Math.min(index, Math.max(total - 1, 0))

  return {
    index: safeIndex,
    step: steps[safeIndex] ?? null,
    total,
    playing,
    isFirst: safeIndex === 0,
    isLast: total === 0 || safeIndex >= total - 1,
    next,
    previous,
    goTo,
    restart,
    togglePlay,
    stop,
  }
}
