// Shared WebSocket helper for the bell screen and the simulator.
// connectHub({ hello, onMessage, onStatus }) keeps reconnecting until closed.

export function hubUrl() {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws'
  return `${proto}://${location.host}/ws`
}

// Close codes 4000–4099 mean the hub deliberately turned us away (e.g. a real
// station owns that letter), so don't reconnect; onRejected gets the reason.
export function connectHub({ hello, onMessage, onStatus = () => {}, onRejected = () => {} }) {
  let ws
  let closed = false
  let retry

  const open = () => {
    ws = new WebSocket(hubUrl())
    ws.onopen = () => {
      onStatus(true)
      if (hello) ws.send(JSON.stringify(hello))
    }
    ws.onmessage = (e) => {
      try {
        onMessage(JSON.parse(e.data))
      } catch {
        /* ignore malformed */
      }
    }
    ws.onclose = (e) => {
      onStatus(false)
      if (e.code >= 4000 && e.code < 4100) {
        closed = true
        onRejected(e.code, e.reason)
        return
      }
      if (!closed) retry = setTimeout(open, 1000)
    }
  }
  open()

  return {
    send(msg) {
      if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg))
    },
    close() {
      closed = true
      clearTimeout(retry)
      ws?.close()
    },
  }
}
