import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

const storedValues = new Map()
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (key) => storedValues.get(key) ?? null,
    setItem: (key, value) => storedValues.set(key, String(value)),
    removeItem: (key) => storedValues.delete(key),
    clear: () => storedValues.clear(),
  },
})

window.scrollTo = () => {}

afterEach(() => {
  cleanup()
  localStorage.clear()
})
