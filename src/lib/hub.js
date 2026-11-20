// Connection to the buzzer hub (buzzer-hub/server.js).
//
// The game reports what happens (reveals, strikes, rounds, team scores) and the
// hub shows it on the LED screens and sends it out as OSC. The hub reports
// buzzer presses back.
//
// The hub address defaults to port 8090 on the same machine the game page was
// opened from (so a phone on http://<laptop-ip>:5173 reaches the hub on the
// laptop too). Set VITE_HUB_URL (e.g. ws://192.168.1.50:8090/ws) in a
// .env.local file to point somewhere else.
//
// Events are live cues: if the hub is not connected they are dropped rather
// than queued, so a reconnect never fires a burst of stale cues. The game
// resends its current state on every (re)connect instead.

const HUB_URL =
  import.meta.env.VITE_HUB_URL || `ws://${window.location.hostname || 'localhost'}:8090/ws`

let ws = null
let retryMs = 1000
const openListeners = new Set()
const messageListeners = new Set()

function connect() {
  try {
    ws = new WebSocket(HUB_URL)
  } catch {
    scheduleRetry()
    return
  }
  ws.addEventListener('open', () => {
    retryMs = 1000
    ws.send(JSON.stringify({ type: 'hello', role: 'game' }))
    for (const fn of openListeners) fn()
  })
  ws.addEventListener('message', (e) => {
    let msg
    try {
      msg = JSON.parse(e.data)
    } catch {
      return
    }
    for (const fn of messageListeners) fn(msg)
  })
  ws.addEventListener('close', scheduleRetry)
  ws.addEventListener('error', () => ws.close())
}

function scheduleRetry() {
  ws = null
  setTimeout(connect, retryMs)
  retryMs = Math.min(retryMs * 2, 10000)
}

connect()

export function sendToHub(msg) {
  if (ws?.readyState !== WebSocket.OPEN) return
  ws.send(JSON.stringify(msg))
}

// emit('strike', 2) -> hub sends OSC /feud/strike 2 (and /feud/strike/2)
export function emit(event, ...args) {
  sendToHub({ type: 'game', event, args })
}

// Run fn every time the hub (re)connects, e.g. to resend the current state.
// Also runs right away if the hub is already connected.
export function onHubConnect(fn) {
  openListeners.add(fn)
  if (ws?.readyState === WebSocket.OPEN) fn()
  return () => openListeners.delete(fn)
}

// Messages from the hub, e.g. { type: 'buzz', station: 'A' }.
export function onHubMessage(fn) {
  messageListeners.add(fn)
  return () => messageListeners.delete(fn)
}
