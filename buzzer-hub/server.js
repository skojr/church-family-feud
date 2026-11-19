// Buzzer Hub — the one place that decides who pressed first.
//
// Stations (ESP32s or the browser simulator), screens (the bell page, later
// the game) all connect to ws://<this machine>:8090/ws and speak small JSON
// messages. See README.md for the protocol.

import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import { readFile, writeFile } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { WebSocketServer } from 'ws'
import { Bonjour } from 'bonjour-service'
import { oscStatus, sendGameEvent, sendOsc } from './osc.js'

const PORT = Number(process.env.PORT) || 8090
const STATION_IDS = ['A', 'B']
const PUBLIC_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'public')
const HEARTBEAT_MS = 2000 // ping every 2 s; a station missing 2 pongs is marked offline

// ---------------------------------------------------------------- state ----

const stations = Object.fromEntries(
  STATION_IDS.map((id) => [id, { id, online: false, sim: false, ip: null, rssi: null, fw: null, since: null, syncMs: null }]),
)
const stationSockets = new Map() // id -> ws

const game = {
  armed: true,
  winner: null,
  round: 1,
  armedAt: now(),
  presses: [], // this round: { station, at, deltaMs, counted }
}

// ----------------------------------------------------------- teams ----
//
// Team names and scores belong to the game: it sends them here whenever they
// change, and the LED screens (/banner, /small) show them. Team A is buzzer
// Station A (the game's Team 1), Team B is Station B (Team 2).
// The last values are cached in teams.json so the screens show the right
// names even before the game connects after a restart.

const TEAMS_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), 'teams.json')
const teams = Object.fromEntries(STATION_IDS.map((id, i) => [id, { id, name: `Team ${i + 1}`, score: 0 }]))
let answering = null // team id the game is crediting reveals to
try {
  const saved = JSON.parse(readFileSync(TEAMS_FILE, 'utf8'))
  for (const id of STATION_IDS) {
    if (saved[id]) {
      if (typeof saved[id].name === 'string') teams[id].name = saved[id].name.slice(0, 40)
      if (Number.isFinite(saved[id].score)) teams[id].score = Math.trunc(saved[id].score)
    }
  }
} catch {
  /* first run: defaults */
}

let saveTimer
function saveTeams() {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => writeFile(TEAMS_FILE, JSON.stringify(teams, null, 2)).catch(() => {}), 300)
}

// Latest round info from the game.
const board = { round: null, question: '', score: 0 }

// { teams: [{ name, score }, { name, score }], answering: 0 | 1 } from the game.
function updateTeamsFromGame(msg) {
  const list = Array.isArray(msg.teams) ? msg.teams : []
  let changed = false
  STATION_IDS.forEach((id, i) => {
    const incoming = list[i]
    if (!incoming) return
    const team = teams[id]
    const name = String(incoming.name ?? '').trim().slice(0, 40) || `Team ${i + 1}`
    const score = Math.trunc(Number(incoming.score) || 0)
    if (name !== team.name) {
      team.name = name
      changed = true
      sendOsc(`team/${id}/name`, name)
    }
    if (score !== team.score) {
      team.score = score
      changed = true
      sendOsc(`team/${id}/score`, score)
    }
  })
  const nextAnswering = STATION_IDS[msg.answering] ?? null
  if (nextAnswering !== answering) {
    answering = nextAnswering
    changed = true
    if (answering) sendOsc('answering', answering, STATION_IDS.indexOf(answering) + 1)
  }
  if (changed) {
    saveTeams()
    broadcastState()
  }
}

const events = [] // rolling log for the screens
function logEvent(text, kind = 'info') {
  events.unshift({ t: Date.now(), text, kind })
  events.length = Math.min(events.length, 40)
  console.log(`[${new Date().toLocaleTimeString()}] ${text}`)
}

function now() {
  return performance.now()
}

function snapshot() {
  return {
    type: 'state',
    armed: game.armed,
    winner: game.winner,
    round: game.round,
    presses: game.presses,
    stations,
    teams,
    answering,
    board,
    events,
  }
}

// ------------------------------------------------------------- messaging --

const wss = new WebSocketServer({ noServer: true })

function send(ws, msg) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg))
}

function broadcastState() {
  const msg = JSON.stringify(snapshot())
  for (const ws of wss.clients) if (ws.readyState === ws.OPEN && ws.role !== 'station') ws.send(msg)
  pushLeds()
}

function broadcastScreens(msg) {
  const text = JSON.stringify(msg)
  for (const ws of wss.clients) if (ws.readyState === ws.OPEN && ws.role !== 'station') ws.send(text)
}

// What each station's button light should be doing right now.
function ledModeFor(id) {
  if (game.winner) return game.winner === id ? 'win' : 'lose'
  return game.armed ? 'ready' : 'locked'
}

function pushLeds() {
  for (const [id, ws] of stationSockets) send(ws, { type: 'led', mode: ledModeFor(id) })
}

// --------------------------------------------------------------- actions --

// ------------------------------------------------------------ fair timing --
//
// Wi-Fi delivers packets in bursts, so the order presses *arrive* in is
// meaningless for anything closer than a few tens of ms. Instead each station
// stamps the press with its own clock, and the hub keeps an estimate of every
// station's clock offset (NTP-style: the sample with the smallest round trip
// wins). The first press opens a short decision window; when it closes, the
// earliest *actual* press wins.

const DECISION_WINDOW_MS = Number(process.env.BUZZ_WINDOW_MS) || 150
const SYNC_EVERY_MS = 500
const SYNC_KEEP = 20 // ~10 s of samples

function syncStations() {
  for (const ws of stationSockets.values()) {
    if (!ws.sim) send(ws, { type: 'sync', h: now() })
  }
}
setInterval(syncStations, SYNC_EVERY_MS)

function handleSyncReply(ws, msg) {
  const h1 = now()
  const h0 = Number(msg.h)
  const s = Number(msg.s) / 1000 // station µs -> ms
  if (!Number.isFinite(h0) || !Number.isFinite(s) || h1 < h0) return
  const rtt = h1 - h0
  ws.syncSamples = [...(ws.syncSamples || []), { rtt, offset: s - (h0 + h1) / 2 }].slice(-SYNC_KEEP)
  ws.clock = ws.syncSamples.reduce((best, x) => (x.rtt < best.rtt ? x : best))
  stations[ws.station].syncMs = Math.round(ws.clock.rtt / 2)
}

// Station-clock press time -> hub time. Falls back to arrival time for the
// simulator, old firmware, or before the first sync.
function pressTime(ws, msg, arrival) {
  if (msg.t == null || !ws.clock) return { at: arrival, timed: false }
  const at = Number(msg.t) / 1000 - ws.clock.offset
  if (!Number.isFinite(at) || at > arrival + 1 || at < arrival - 2000) return { at: arrival, timed: false }
  return { at: Math.min(at, arrival), timed: true }
}

function handlePress(ws, msg) {
  const id = ws.station
  const arrival = now()
  const { at, timed } = pressTime(ws, msg, arrival)
  if (game.presses.some((p) => p.station === id)) return // one press per station per round

  // Still deciding, or the very first press of an armed round.
  if (game.armed && !game.winner) {
    game.presses.push({ station: id, at, timed, deltaMs: null, counted: false })
    if (!game.deciding) game.deciding = setTimeout(decide, DECISION_WINDOW_MS)
    return
  }

  // Late or locked presses are recorded so you can see how close it was.
  const win = game.presses.find((p) => p.counted)
  const deltaMs = win ? Math.max(0, Math.round(at - win.at)) : null
  game.presses.push({ station: id, at, timed, deltaMs, counted: false })
  logEvent(win ? `Station ${id} pressed ${deltaMs} ms later` : `Station ${id} pressed while locked`, 'late')
  broadcastState()
}

function decide() {
  game.deciding = null
  if (!game.armed || !game.presses.length) return
  game.presses.sort((a, b) => a.at - b.at)
  const [win] = game.presses
  for (const p of game.presses) {
    p.counted = p === win
    p.deltaMs = Math.round(p.at - win.at)
  }
  game.armed = false
  game.winner = win.station
  const second = game.presses[1]
  logEvent(
    `Station ${win.station} buzzed first${second ? ` (${second.station} +${second.deltaMs} ms${win.timed && second.timed ? '' : ', arrival order'})` : ''}`,
    'win',
  )
  broadcastScreens({ type: 'buzz', station: win.station, round: game.round })
  sendGameEvent('buzz', [win.station, STATION_IDS.indexOf(win.station) + 1])
  broadcastState()
}

function cancelDecision() {
  clearTimeout(game.deciding)
  game.deciding = null
}

function reset() {
  cancelDecision()
  game.armed = true
  game.winner = null
  game.presses = []
  game.round += 1
  game.armedAt = now()
  logEvent(`Round ${game.round} armed`)
  sendOsc('buzzer/armed')
  broadcastState()
}

function lock() {
  if (!game.armed) return
  cancelDecision()
  game.presses = []
  game.armed = false
  logEvent('Buzzers locked by host')
  sendOsc('buzzer/locked')
  broadcastState()
}

// Two physical boards both set to the same letter will keep replacing each
// other. Say so clearly instead of just flickering online/offline.
const lastDuplicateWarn = {}
function warnDuplicate(id, ipA, ipB) {
  if (Date.now() - (lastDuplicateWarn[id] || 0) < 60000) return
  lastDuplicateWarn[id] = Date.now()
  logEvent(`Two boards are both set to Station ${id} (${ipA} and ${ipB}) — re-run setup on one and choose the other letter`, 'warn')
}

function identify(id) {
  const ws = stationSockets.get(id)
  if (!ws) return logEvent(`Identify ${id}: station offline`, 'warn')
  send(ws, { type: 'led', mode: 'identify' })
  logEvent(`Identify Station ${id}`)
}

// ----------------------------------------------------------- connections --

wss.on('connection', (ws, req) => {
  ws.role = 'screen'
  ws.alive = true
  ws.ip = (req.socket.remoteAddress || '').replace('::ffff:', '')
  ws.on('pong', () => (ws.alive = true))

  send(ws, snapshot())

  ws.on('message', (raw) => {
    let msg
    try {
      msg = JSON.parse(raw.toString())
    } catch {
      return
    }
    const id = String(msg.station || '').toUpperCase()

    switch (msg.type) {
      case 'hello':
        if (msg.role === 'station') {
          if (!STATION_IDS.includes(id)) return send(ws, { type: 'error', error: `unknown station ${id}` })
          const sim = Boolean(msg.sim)
          const old = stationSockets.get(id)
          if (old && old !== ws) {
            // A real station always beats the simulator, and the simulator
            // never kicks a real station off (they'd fight forever).
            if (sim && !old.sim) {
              send(ws, { type: 'error', error: `Real Station ${id} is connected` })
              ws.close(4000, 'real station connected')
              return
            }
            if (!sim && !old.sim && old.ip !== ws.ip) warnDuplicate(id, old.ip, ws.ip)
            old.close(old.sim ? 4001 : 4002, 'replaced')
            old.replaced = true
          }
          ws.sim = sim
          ws.role = 'station'
          ws.station = id
          stationSockets.set(id, ws)
          Object.assign(stations[id], {
            online: true,
            sim: Boolean(msg.sim),
            ip: ws.ip,
            fw: msg.fw || null,
            rssi: msg.rssi ?? null,
            since: Date.now(),
            syncMs: null,
          })
          if (!ws.sim) send(ws, { type: 'sync', h: now() }) // start syncing right away
          logEvent(`Station ${id} online${msg.sim ? ' (simulator)' : ` from ${ws.ip}`}`, 'online')
          broadcastState()
        } else {
          ws.role = msg.role || 'screen'
        }
        break
      case 'press':
        if (ws.role === 'station') handlePress(ws, msg)
        break
      case 'sync':
        if (ws.role === 'station') handleSyncReply(ws, msg)
        break
      case 'status':
        if (ws.role === 'station') {
          stations[ws.station].rssi = msg.rssi ?? null
          broadcastScreens({ type: 'stations', stations })
        }
        break
      case 'reset':
        reset()
        break
      case 'lock':
        lock()
        break
      case 'identify':
        identify(id)
        break
      case 'game':
        // Events from the Family Feud game, passed on as OSC.
        sendGameEvent(msg.event, msg.args)
        if (msg.event === 'score' && Number.isFinite(msg.args?.[0])) board.score = msg.args[0]
        if (msg.event === 'round' && Number.isFinite(msg.args?.[0])) {
          board.round = msg.args[0]
          board.question = String(msg.args[1] ?? '')
        }
        if (msg.event === 'score' || msg.event === 'round') broadcastScreens({ type: 'board', board })
        break
      case 'teams':
        // Team names, totals and the answering team, from the game.
        updateTeamsFromGame(msg)
        break
    }
  })

  ws.on('close', () => {
    if (ws.role === 'station' && stationSockets.get(ws.station) === ws) {
      stationSockets.delete(ws.station)
      stations[ws.station].online = false
      stations[ws.station].rssi = null
      logEvent(`Station ${ws.station} offline`, 'warn')
      broadcastState()
    }
  })
})

// Drop stations that stop answering pings (power pulled, Wi-Fi gone).
setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.alive) {
      ws.terminate()
      continue
    }
    ws.alive = false
    ws.ping()
  }
}, HEARTBEAT_MS)

// ------------------------------------------------------------------ http --

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://hub')

  // Tiny HTTP API so other tools (Companion, a phone, the game) can drive it.
  if (url.pathname.startsWith('/api/')) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    const action = url.pathname.slice(5)
    if (action === 'reset') reset()
    else if (action === 'lock') lock()
    else if (action === 'osc') {
      res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(oscStatus()))
      return
    } else if (action === 'osc/test') {
      sendOsc('test', 1)
      res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ sent: true, ...oscStatus() }))
      return
    } else if (action !== 'state') {
      res.writeHead(404).end('{"error":"unknown action"}')
      return
    }
    res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(snapshot()))
    return
  }

  const routes = {
    '/': 'index.html',
    '/sim': 'sim.html',
    '/banner': 'banner.html',
    '/small': 'small.html',
    '/control': 'control.html',
  }
  const file = routes[url.pathname] || url.pathname.slice(1)
  const full = path.join(PUBLIC_DIR, path.normalize(file))
  if (!full.startsWith(PUBLIC_DIR)) return res.writeHead(403).end()
  try {
    const body = await readFile(full)
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(full)] || 'application/octet-stream' }).end(body)
  } catch {
    res.writeHead(404).end('Not found')
  }
})

server.on('upgrade', (req, socket, head) => {
  if (new URL(req.url, 'http://hub').pathname !== '/ws') return socket.destroy()
  wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req))
})

server.listen(PORT, '0.0.0.0', () => {
  const ips = Object.values(os.networkInterfaces())
    .flat()
    .filter((i) => i && i.family === 'IPv4' && !i.internal)
    .map((i) => i.address)
  console.log('\n  Buzzer Hub is running\n')
  console.log(`  Bell screen   http://localhost:${PORT}`)
  console.log(`  Simulator     http://localhost:${PORT}/sim`)
  console.log(`  Control       http://localhost:${PORT}/control   (LED screens and buzzers)`)
  console.log(`  LED banner    http://localhost:${PORT}/banner`)
  console.log(`  LED small     http://localhost:${PORT}/small`)
  for (const ip of ips) console.log(`  On network    http://${ip}:${PORT}   (stations find this automatically)`)
  console.log('')
  logEvent('Hub started — round 1 armed')

  // Announce the hub on the network (mDNS / Bonjour, service "_buzzer._tcp")
  // so stations find it without anyone typing an IP address.
  // A failure here must never take the hub down: stations can still be given
  // the IP by hand in their setup page.
  const warn = (err) => {
    if (warnedMdns) return
    warnedMdns = true
    console.warn(`  mDNS announce problem (${err.code || err.message}) — if stations can't find the hub, type ${ips[0]}:${PORT} in their setup page`)
  }
  if (process.env.NO_MDNS) return // e.g. a private test hub that stations shouldn't find
  try {
    // Send on the main LAN interface (multicast on VPN/virtual interfaces
    // fails), but listen on 0.0.0.0: a socket bound to a unicast address never
    // hears the multicast queries stations send, so it could announce but not answer.
    bonjour = new Bonjour(ips[0] ? { interface: ips[0], bind: '0.0.0.0' } : {}, warn)
    // Own host name (not the OS one): macOS answers for its own name itself,
    // and os.hostname() can be stale (e.g. "Mac-3.local"), which left
    // stations with a service but no address.
    bonjour.publish({
      name: `Buzzer Hub (${os.hostname().replace(/\.local$/, '')})`,
      type: 'buzzer',
      port: PORT,
      host: 'buzzer-hub.local',
    })
  } catch (err) {
    warn(err)
  }
})

let warnedMdns = false

let bonjour
const shutdown = () => {
  if (!bonjour) process.exit(0)
  bonjour.unpublishAll(() => {
    bonjour.destroy()
    process.exit(0)
  })
  setTimeout(() => process.exit(0), 1000)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
