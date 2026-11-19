import { useEffect, useRef, useState } from 'react'
import { publish, subscribe } from '../lib/sync'

export function useLocalStorage(key, initialValue, validate) {
  const [value, setValue] = useState(() => {
    const fallback = typeof initialValue === 'function' ? initialValue() : initialValue
    try {
      const raw = localStorage.getItem(key)
      if (raw == null) return fallback
      const parsed = JSON.parse(raw)
      return validate && !validate(parsed) ? fallback : parsed
    } catch {
      return fallback
    }
  })

  // JSON of the last value sent to or received from other windows. Starts as the loaded value
  // so a window never pushes its (possibly stale) saved state just by opening.
  const [initialJson] = useState(() => JSON.stringify(value))
  const lastSynced = useRef(initialJson)
  const validateRef = useRef(validate)

  useEffect(() => {
    validateRef.current = validate
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Storage full or disabled; the game still works for this session.
    }
    const json = JSON.stringify(value)
    if (json !== lastSynced.current) {
      lastSynced.current = json
      publish(key, value)
    }
  }, [key, value])

  useEffect(
    () =>
      subscribe(key, (remote) => {
        if (validateRef.current && !validateRef.current(remote)) return
        const json = JSON.stringify(remote)
        if (json === lastSynced.current) return
        lastSynced.current = json
        setValue(remote)
      }),
    [key],
  )

  return [value, setValue]
}
