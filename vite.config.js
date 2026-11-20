import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const SNAPSHOT_FILE =
  process.env.FEUD_SYNC_FILE || fileURLToPath(new URL('./.feud-sync.json', import.meta.url))
const KEY_PREFIX = 'igc-feud:'

// Relays game state between every open window (laptop display, phone host page) over the
// dev server's WebSocket. The server keeps the latest value of each key, saved to disk so a
// restart can't let a stale device overwrite newer data.
function feudSync() {
  let snapshot = {}
  try {
    if (existsSync(SNAPSHOT_FILE)) snapshot = JSON.parse(readFileSync(SNAPSHOT_FILE, 'utf8'))
  } catch {
    snapshot = {}
  }

  const save = () => {
    try {
      writeFileSync(SNAPSHOT_FILE, JSON.stringify(snapshot))
    } catch {
      // Sync still works in memory.
    }
  }

  const isGameKey = (key) => typeof key === 'string' && key.startsWith(KEY_PREFIX)

  return {
    name: 'feud-sync',
    apply: 'serve',
    configureServer(server) {
      server.ws.on('feud:hello', (data, client) => {
        if (Object.keys(snapshot).length === 0 && data && typeof data === 'object') {
          for (const [key, value] of Object.entries(data)) {
            if (isGameKey(key)) snapshot[key] = value
          }
          save()
        }
        client.send('feud:snapshot', snapshot)
      })

      server.ws.on('feud:set', (data, sender) => {
        if (!data || !isGameKey(data.key)) return
        snapshot[data.key] = data.value
        save()
        // Not back to the sender: it already has this value, and an echo arriving after its
        // next change would briefly roll that window back (board flicker, repeated sounds,
        // repeated OSC cues).
        for (const client of server.ws.clients) {
          if (client !== sender) client.send('feud:update', data)
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), feudSync()],
  server: {
    watch: { ignored: ['**/.feud-sync.json'] },
  },
})
