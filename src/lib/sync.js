// Shares game state between windows through the dev server (see the feud-sync plugin in
// vite.config.js). In a production build `import.meta.hot` is undefined and this is a no-op.
const hot = import.meta.hot
const PREFIX = 'igc-feud:'

const listeners = new Map()
// Latest value received for each key, so hooks that subscribe after the snapshot still get it.
const latest = new Map()

let connected = false
const statusListeners = new Set()
function setConnected(value) {
  if (connected === value) return
  connected = value
  statusListeners.forEach((cb) => cb())
}

function receive(key, value) {
  latest.set(key, value)
  listeners.get(key)?.forEach((cb) => cb(value))
}

function localValues() {
  const values = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key?.startsWith(PREFIX)) continue
    try {
      values[key] = JSON.parse(localStorage.getItem(key))
    } catch {
      // Skip unreadable entries.
    }
  }
  return values
}

if (hot) {
  hot.on('feud:snapshot', (snapshot) => {
    for (const [key, value] of Object.entries(snapshot ?? {})) receive(key, value)
    setConnected(true)
  })
  hot.on('feud:update', (data) => {
    if (data?.key) receive(data.key, data.value)
  })
  // Sent again after a reconnect so this window catches up on anything it missed.
  const hello = () => hot.send('feud:hello', localValues())
  hot.on('vite:ws:connect', hello)
  hot.on('vite:ws:disconnect', () => setConnected(false))
  hello()
}

export const syncEnabled = Boolean(hot)

// For useSyncExternalStore: whether this window is currently linked to the dev server.
export function onConnectionChange(cb) {
  statusListeners.add(cb)
  return () => statusListeners.delete(cb)
}
export const isConnected = () => connected

export function subscribe(key, cb) {
  if (!listeners.has(key)) listeners.set(key, new Set())
  listeners.get(key).add(cb)
  if (latest.has(key)) cb(latest.get(key))
  return () => listeners.get(key).delete(cb)
}

export function publish(key, value) {
  latest.set(key, value)
  hot?.send('feud:set', { key, value })
}
