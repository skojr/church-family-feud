import { useEffect, useState } from 'react'

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

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Storage full or disabled; the game still works for this session.
    }
  }, [key, value])

  return [value, setValue]
}
