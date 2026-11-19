// OSC output — sends game and buzzer events to other apps on the network
// (QLab, Resolume, ProPresenter, Companion, lighting desks, TouchDesigner…).
//
// Browsers can't send UDP, so the game reports events to the hub over its
// WebSocket and the hub turns them into OSC packets here.
//
// Targets live in osc.config.json next to this file. It is created from
// osc.config.example.json on first run and re-read whenever it is saved, so
// targets can be changed while the hub is running.

import dgram from 'node:dgram'
import path from 'node:path'
import { copyFileSync, existsSync, readFileSync, watchFile } from 'node:fs'
import { fileURLToPath } from 'node:url'

const DIR = path.dirname(fileURLToPath(import.meta.url))
const CONFIG_PATH = process.env.OSC_CONFIG || path.join(DIR, 'osc.config.json')
const EXAMPLE_PATH = path.join(DIR, 'osc.config.example.json')

let config = { enabled: false, prefix: '/feud', targets: [] }
const socket = dgram.createSocket('udp4')
socket.on('error', (err) => console.warn(`  OSC socket error: ${err.message}`))

// ------------------------------------------------------------ encoding ----

function oscString(str) {
  const bytes = Buffer.from(String(str), 'utf8')
  const len = Math.ceil((bytes.length + 1) / 4) * 4 // null-terminated, padded to 4
  const out = Buffer.alloc(len)
  bytes.copy(out)
  return out
}

function encode(address, args) {
  let tags = ','
  const parts = []
  for (const arg of args) {
    if (typeof arg === 'boolean') {
      tags += arg ? 'T' : 'F'
    } else if (typeof arg === 'number' && Number.isInteger(arg) && Math.abs(arg) <= 0x7fffffff) {
      tags += 'i'
      const b = Buffer.alloc(4)
      b.writeInt32BE(arg)
      parts.push(b)
    } else if (typeof arg === 'number' && Number.isFinite(arg)) {
      tags += 'f'
      const b = Buffer.alloc(4)
      b.writeFloatBE(arg)
      parts.push(b)
    } else {
      tags += 's'
      parts.push(oscString(arg ?? ''))
    }
  }
  return Buffer.concat([oscString(address), oscString(tags), ...parts])
}

// -------------------------------------------------------------- config ----

function loadConfig() {
  try {
    if (!existsSync(CONFIG_PATH) && existsSync(EXAMPLE_PATH) && !process.env.OSC_CONFIG) {
      copyFileSync(EXAMPLE_PATH, CONFIG_PATH)
      console.log(`  OSC: created ${path.basename(CONFIG_PATH)} — put your target app's IP and port in it`)
    }
    const raw = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'))
    const prefix = '/' + String(raw.prefix ?? '/feud').replace(/^\/+|\/+$/g, '')
    const targets = (Array.isArray(raw.targets) ? raw.targets : [])
      .filter((t) => t && t.host && Number(t.port) > 0 && t.enabled !== false)
      .map((t) => ({ name: t.name || `${t.host}:${t.port}`, host: String(t.host), port: Number(t.port) }))
    config = { enabled: raw.enabled !== false, prefix: prefix === '/' ? '' : prefix, targets }
    const list = config.targets.map((t) => `${t.name} (${t.host}:${t.port})`).join(', ')
    console.log(
      config.enabled && targets.length
        ? `  OSC: sending ${config.prefix || '/'}… to ${list}`
        : '  OSC: off (no enabled targets in osc.config.json)',
    )
  } catch (err) {
    console.warn(`  OSC: could not read ${path.basename(CONFIG_PATH)} (${err.message}) — OSC is off`)
    config = { ...config, enabled: false }
  }
}

loadConfig()
watchFile(CONFIG_PATH, { interval: 1000 }, loadConfig)

// ---------------------------------------------------------------- send ----

const SAFE_PATH = /^[A-Za-z0-9_\-/]+$/

// sendOsc('strike', 2) -> "/feud/strike" with int 2, to every target.
export function sendOsc(pathPart, ...args) {
  if (!config.enabled || !config.targets.length) return
  const clean = String(pathPart).replace(/^\/+/, '')
  if (!SAFE_PATH.test(clean)) return
  const packet = encode(`${config.prefix}/${clean}`, args)
  for (const t of config.targets) socket.send(packet, t.port, t.host)
}

export function oscStatus() {
  return { enabled: config.enabled, prefix: config.prefix || '/', targets: config.targets, configFile: CONFIG_PATH }
}

// Every game event goes out on its main address with its values, and (for
// events that carry a number) also on a per-value address with no arguments,
// e.g. /feud/reveal 3 "Good Health" 32  and  /feud/reveal/3.
// Apps that can only match an exact address (QLab, Companion triggers) use the
// second form; apps that read arguments (TouchDesigner, Resolume) use the first.
const PER_VALUE = new Set(['reveal', 'hide', 'strike', 'round', 'buzz'])

export function sendGameEvent(event, args = []) {
  const name = String(event || '')
  if (!SAFE_PATH.test(name)) return
  const values = (Array.isArray(args) ? args : [args]).filter(
    (a) => ['number', 'string', 'boolean'].includes(typeof a),
  )
  sendOsc(name, ...values)
  if (PER_VALUE.has(name) && values.length) sendOsc(`${name}/${values[0]}`)
}
