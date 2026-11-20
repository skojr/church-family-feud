// OSC output — sends game and buzzer events to other apps on the network
// (QLab, Resolume, ProPresenter, Companion, lighting desks, TouchDesigner…).
//
// Browsers can't send UDP, so the game reports events to the hub over its
// WebSocket and the hub turns them into OSC packets here.
//
// Three kinds of output, all set in osc.config.json (or on the /osc page):
//  - Moment cues: one fixed address per moment, e.g. /feud/cue/strike3 with
//    1.0 then 0.0 (a button press). Made for lighting apps that "learn" a cue:
//    put the app in learn mode and press Send next to the moment on /osc.
//  - Built-in cues: every event on a fixed address under the prefix
//    (/feud/strike 2, /feud/strike/2 …). Handy for apps you program to match.
//  - Mapped cues: for each trigger (strike, reveal, buzz…) send exactly the
//    address and values another app expects, e.g. a lighting desk's
//    "/eos/cue/1/5/fire" or "/gma3/cmd 'Go+ Sequence 5'".
//
// The file is created from osc.config.example.json on first run and re-read
// whenever it is saved, so everything can be changed while the hub is running.

import dgram from 'node:dgram'
import path from 'node:path'
import { copyFileSync, existsSync, readFileSync, watchFile, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const DIR = path.dirname(fileURLToPath(import.meta.url))
const CONFIG_PATH = process.env.OSC_CONFIG || path.join(DIR, 'osc.config.json')
const EXAMPLE_PATH = path.join(DIR, 'osc.config.example.json')

// What the file holds, cleaned up (all targets and cues, enabled or not).
let raw = { enabled: true, prefix: '/feud', moments: true, momentValue: 'press', builtIn: true, targets: [], cues: [] }
// What is actually used for sending.
let config = { enabled: false, prefix: '/feud', moments: true, momentValue: 'press', builtIn: true, targets: [] }
const MOMENT_VALUES = ['press', 'one', 'none']
const socket = dgram.createSocket('udp4')
socket.on('error', (err) => console.warn(`  OSC socket error: ${err.message}`))

// ------------------------------------------------------------ triggers ----

// Everything a mapped cue can be attached to. `vars` are the {placeholders}
// that can be used in its address and values; `sample` is used by Test.
// `sound: true` marks the moments that play a sound effect.
export const TRIGGERS = [
  { id: 'buzz', group: 'Buzzers', label: 'Someone buzzed in (either team)', sound: true, vars: ['team', 'teamNumber', 'teamName'] },
  { id: 'buzzA', group: 'Buzzers', label: 'Team 1 buzzed in (buzzer A)', sound: true, vars: ['team', 'teamNumber', 'teamName'] },
  { id: 'buzzB', group: 'Buzzers', label: 'Team 2 buzzed in (buzzer B)', sound: true, vars: ['team', 'teamNumber', 'teamName'] },
  { id: 'armed', group: 'Buzzers', label: 'Buzzers reset & armed', vars: [] },
  { id: 'locked', group: 'Buzzers', label: 'Buzzers locked', vars: [] },
  { id: 'reveal', group: 'Answers', label: 'Correct answer revealed', sound: true, vars: ['slot', 'text', 'votes'] },
  // One per board position, for lighting apps that learn a fixed address per look.
  ...[1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
    id: `reveal${n}`,
    group: 'Answers',
    label: `Answer ${n} revealed`,
    vars: ['slot', 'text', 'votes'],
  })),
  { id: 'hide', group: 'Answers', label: 'Answer hidden again', vars: ['slot'] },
  { id: 'revealall', group: 'Answers', label: 'Reveal all', vars: [] },
  { id: 'hideall', group: 'Answers', label: 'Hide all', vars: [] },
  { id: 'strike', group: 'Strikes', label: 'Wrong answer (any strike)', sound: true, vars: ['strikes'] },
  { id: 'strike1', group: 'Strikes', label: '1st strike', sound: true, vars: ['strikes'] },
  { id: 'strike2', group: 'Strikes', label: '2nd strike', sound: true, vars: ['strikes'] },
  { id: 'strike3', group: 'Strikes', label: '3rd strike (out)', sound: true, vars: ['strikes'] },
  { id: 'steal', group: 'Strikes', label: 'Steal (round points move to the other team)', vars: ['team', 'teamNumber'] },
  { id: 'stealA', group: 'Strikes', label: 'Team 1 stole the round', vars: ['team', 'teamNumber'] },
  { id: 'stealB', group: 'Strikes', label: 'Team 2 stole the round', vars: ['team', 'teamNumber'] },
  { id: 'round', group: 'Rounds', label: 'Round changed', vars: ['round', 'question'] },
  { id: 'reset', group: 'Rounds', label: 'Round reset', vars: [] },
  { id: 'score', group: 'Rounds', label: 'Board points changed', vars: ['points'] },
  { id: 'answering', group: 'Teams', label: 'Answering team changed', vars: ['team', 'teamNumber', 'teamName'] },
  { id: 'answeringA', group: 'Teams', label: 'Team 1 is now answering', vars: ['team', 'teamNumber', 'teamName'] },
  { id: 'answeringB', group: 'Teams', label: 'Team 2 is now answering', vars: ['team', 'teamNumber', 'teamName'] },
  { id: 'teamScore', group: 'Teams', label: 'A team score changed', vars: ['team', 'teamNumber', 'teamName', 'score'] },
]
const TRIGGER_IDS = new Set(TRIGGERS.map((t) => t.id))

const SAMPLE = {
  team: 'A',
  teamNumber: 1,
  teamName: 'Team 1',
  slot: 3,
  text: 'Good health',
  votes: 32,
  strikes: 2,
  round: 1,
  question: 'Name something people pray for.',
  points: 64,
  score: 120,
}

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
    } else if (typeof arg === 'number' && Number.isInteger(arg) && Math.abs(arg) <= 0x7fffffff && !Object.is(arg, -0)) {
      tags += 'i'
      const b = Buffer.alloc(4)
      b.writeInt32BE(arg)
      parts.push(b)
    } else if (typeof arg === 'number' && Number.isFinite(arg)) {
      tags += 'f'
      const b = Buffer.alloc(4)
      b.writeFloatBE(arg)
      parts.push(b)
    } else if (arg && typeof arg === 'object' && arg.float !== undefined) {
      tags += 'f' // a value typed as 1.0 stays a float even though it's whole
      const b = Buffer.alloc(4)
      b.writeFloatBE(arg.float)
      parts.push(b)
    } else {
      tags += 's'
      parts.push(oscString(arg ?? ''))
    }
  }
  return Buffer.concat([oscString(address), oscString(tags), ...parts])
}

// ------------------------------------------------- mapped cue templates ----

// Characters an OSC address can't contain (they're pattern characters or break it).
const BAD_ADDRESS = /[\s#*,?[\]{}]/

const fill = (text, vars) =>
  String(text).replace(/\{(\w+)\}/g, (m, key) => (vars[key] !== undefined ? String(vars[key]) : m))

// "1 2.5 {slot} 'Go+ Sequence 5' true" -> [1, 2.5 (float), 3, "Go+ Sequence 5", true]
// Quoted values are always text. Unquoted: whole numbers -> int, numbers with a
// decimal point -> float, true/false -> T/F, anything else -> text.
export function parseArgs(template, vars) {
  const out = []
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g
  let m
  while ((m = re.exec(String(template || '')))) {
    if (m[1] !== undefined || m[2] !== undefined) {
      out.push(fill(m[1] ?? m[2], vars))
      continue
    }
    const token = m[3]
    const whole = token.match(/^\{(\w+)\}$/)
    if (whole && typeof vars[whole[1]] === 'number') {
      out.push(vars[whole[1]])
      continue
    }
    const v = fill(token, vars)
    if (/^-?\d+$/.test(v)) out.push(Number(v))
    else if (/^-?\d*\.\d+$/.test(v)) out.push({ float: Number(v) })
    else if (v === 'true' || v === 'false') out.push(v === 'true')
    else out.push(v)
  }
  return out
}

function buildCue(cue, vars) {
  let address = fill(cue.address, vars).trim()
  if (!address.startsWith('/')) address = '/' + address
  if (BAD_ADDRESS.test(address) || address === '/') return null
  return { address, args: parseArgs(cue.args, vars) }
}

// -------------------------------------------------------------- config ----

function cleanConfig(input) {
  const src = input && typeof input === 'object' ? input : {}
  const prefix = '/' + String(src.prefix ?? '/feud').trim().replace(/^\/+|\/+$/g, '')
  const targets = (Array.isArray(src.targets) ? src.targets : [])
    .filter((t) => t && String(t.host || '').trim() && Number(t.port) > 0 && Number(t.port) < 65536)
    .map((t, i) => ({
      name: String(t.name || '').trim().slice(0, 40) || `Target ${i + 1}`,
      host: String(t.host).trim(),
      port: Math.trunc(Number(t.port)),
      enabled: t.enabled !== false,
    }))
  const cues = (Array.isArray(src.cues) ? src.cues : [])
    .filter((c) => c && TRIGGER_IDS.has(c.trigger) && String(c.address || '').trim())
    .map((c) => ({
      trigger: c.trigger,
      target: String(c.target || '*'),
      address: String(c.address).trim().slice(0, 200),
      args: String(c.args ?? '').slice(0, 300),
      note: String(c.note ?? '').slice(0, 80),
      enabled: c.enabled !== false,
    }))
  return {
    enabled: src.enabled !== false,
    prefix: prefix === '/' ? '' : prefix,
    moments: src.moments !== false,
    momentValue: MOMENT_VALUES.includes(src.momentValue) ? src.momentValue : 'press',
    builtIn: src.builtIn !== false,
    targets,
    cues,
  }
}

function loadConfig() {
  try {
    if (!existsSync(CONFIG_PATH) && existsSync(EXAMPLE_PATH) && !process.env.OSC_CONFIG) {
      copyFileSync(EXAMPLE_PATH, CONFIG_PATH)
      console.log(`  OSC: created ${path.basename(CONFIG_PATH)} — set targets and cues at http://localhost:8090/osc`)
    }
    raw = cleanConfig(JSON.parse(readFileSync(CONFIG_PATH, 'utf8')))
    const targets = raw.targets.filter((t) => t.enabled)
    config = {
      enabled: raw.enabled,
      prefix: raw.prefix,
      moments: raw.moments,
      momentValue: raw.momentValue,
      builtIn: raw.builtIn,
      targets,
    }
    const list = targets.map((t) => `${t.name} (${t.host}:${t.port})`).join(', ')
    const mapped = raw.cues.filter((c) => c.enabled).length
    console.log(
      config.enabled && targets.length
        ? `  OSC: sending to ${list}${config.moments ? `, moment cues ${config.prefix}/cue/…` : ''}${config.builtIn ? ', built-in cues' : ''}, ${mapped} custom cue${mapped === 1 ? '' : 's'}`
        : '  OSC: off (no enabled targets in osc.config.json)',
    )
  } catch (err) {
    console.warn(`  OSC: could not read ${path.basename(CONFIG_PATH)} (${err.message}) — OSC is off`)
    config = { ...config, enabled: false }
  }
}

loadConfig()
watchFile(CONFIG_PATH, { interval: 1000 }, loadConfig)

// The full settings, for the /osc page.
export function getOscConfig() {
  return { ...raw, configFile: CONFIG_PATH }
}

// Save settings from the /osc page. Returns the cleaned settings.
export function saveOscConfig(input) {
  const next = cleanConfig(input)
  writeFileSync(CONFIG_PATH, JSON.stringify(next, null, 2) + '\n')
  loadConfig()
  return getOscConfig()
}

// ---------------------------------------------------------------- send ----

const SAFE_PATH = /^[A-Za-z0-9_\-/]+$/

// A short history of what was sent, for the /osc page.
const sentLog = []
const sentListeners = new Set()
export const onOscSent = (fn) => (sentListeners.add(fn), () => sentListeners.delete(fn))
export const oscLog = () => sentLog.slice()

function logSent(entry) {
  const item = {
    t: Date.now(),
    ...entry,
    args: entry.args.map((a) => (a && typeof a === 'object' ? a.float : a)),
  }
  sentLog.unshift(item)
  sentLog.length = Math.min(sentLog.length, 60)
  for (const fn of sentListeners) fn(item)
}

function sendTo(targets, address, args, meta) {
  if (!targets.length) return
  const packet = encode(address, args)
  for (const t of targets) socket.send(packet, t.port, t.host)
  logSent({ address, args, to: targets.map((t) => t.name), ...meta })
}

// sendOsc('strike', 2) -> built-in "/feud/strike" with int 2, to every target.
export function sendOsc(pathPart, ...args) {
  if (!config.enabled || !config.builtIn || !config.targets.length) return
  const clean = String(pathPart).replace(/^\/+/, '')
  if (!SAFE_PATH.test(clean)) return
  sendTo(config.targets, `${config.prefix}/${clean}`, args, { kind: 'built-in' })
}

function targetsFor(cue) {
  return cue.target === '*' ? config.targets : config.targets.filter((t) => t.name === cue.target)
}

export const momentAddress = (trigger) => `${config.prefix || ''}/cue/${trigger}`

// One moment cue: its fixed address, with the value set on the /osc page.
// "press" sends 1.0 then 0.0 a moment later, like a button going down and up,
// which is what most lighting apps expect from a learned OSC button.
function sendMoment(targets, trigger, kind) {
  const address = momentAddress(trigger)
  if (config.momentValue === 'none') return sendTo(targets, address, [], { kind, trigger })
  sendTo(targets, address, [{ float: 1 }], { kind, trigger })
  if (config.momentValue === 'press') {
    const up = encode(address, [{ float: 0 }])
    setTimeout(() => {
      for (const t of targets) socket.send(up, t.port, t.host)
    }, 150)
  }
}

// Press "Send" next to a moment on /osc: sends just that moment's cue, so a
// lighting app in learn mode picks up exactly that address.
export function sendMomentNow(trigger) {
  if (!TRIGGER_IDS.has(trigger)) return { ok: false, error: 'Unknown moment' }
  if (!config.enabled || !config.targets.length) return { ok: false, error: 'No computer to send to: add one under Send to, and switch OSC on' }
  sendMoment(config.targets, trigger, 'learn')
  return { ok: true, address: momentAddress(trigger), value: config.momentValue }
}

// fireCue('strike3', { strikes: 3 }) -> that moment's cue, plus every enabled
// custom message on that trigger.
export function fireCue(trigger, vars = {}) {
  if (!config.enabled) return
  if (config.moments && config.targets.length) sendMoment(config.targets, trigger, 'moment')
  for (const cue of raw.cues) {
    if (cue.trigger !== trigger || !cue.enabled) continue
    const built = buildCue(cue, vars)
    if (built) sendTo(targetsFor(cue), built.address, built.args, { kind: 'mapped', trigger })
  }
}

// Test one mapped cue (even if it is switched off) with sample values.
export function testCue(cue) {
  const clean = cleanConfig({ cues: [cue] }).cues[0]
  if (!clean) return { ok: false, error: 'Pick a trigger and type an address' }
  const built = buildCue(clean, SAMPLE)
  if (!built) return { ok: false, error: 'That address has characters OSC can’t use (space # * , ? [ ] { })' }
  const targets = targetsFor(clean)
  if (!config.enabled || !targets.length) return { ok: false, error: 'No enabled target to send to' }
  sendTo(targets, built.address, built.args, { kind: 'test', trigger: clean.trigger })
  return { ok: true, ...built, args: built.args.map((a) => (a && typeof a === 'object' ? a.float : a)) }
}

// Test one target: sends <prefix>/test 1 to it alone.
export function testTarget(index) {
  const t = raw.targets[index]
  if (!t) return { ok: false, error: 'No such target' }
  sendTo([t], `${config.prefix || ''}/test`, [1], { kind: 'test' })
  return { ok: true }
}

export function oscStatus() {
  return {
    enabled: config.enabled,
    prefix: config.prefix || '/',
    moments: config.moments,
    momentValue: config.momentValue,
    builtIn: config.builtIn,
    targets: config.targets,
    mappedCues: raw.cues.filter((c) => c.enabled).length,
    configFile: CONFIG_PATH,
  }
}

// Every game event goes out on its built-in address with its values, and (for
// events that carry a number) also on a per-value address with no arguments,
// e.g. /feud/reveal 3 "Good Health" 32  and  /feud/reveal/3.
// Apps that can only match an exact address (QLab, Companion triggers) use the
// second form; apps that read arguments (TouchDesigner, Resolume) use the first.
const PER_VALUE = new Set(['reveal', 'hide', 'strike', 'round', 'buzz', 'steal'])

// Game events -> mapped-cue triggers.
function gameTriggers(name, v) {
  switch (name) {
    case 'reveal':
      return [
        ['reveal', { slot: v[0], text: v[1], votes: v[2] }],
        [`reveal${v[0]}`, { slot: v[0], text: v[1], votes: v[2] }],
      ]
    case 'hide':
      return [['hide', { slot: v[0] }]]
    case 'strike':
      return [
        ['strike', { strikes: v[0] }],
        [`strike${Math.min(3, Math.max(1, Number(v[0]) || 1))}`, { strikes: v[0] }],
      ]
    case 'steal': {
      const team = v[0] === 'B' ? 'B' : 'A'
      const vars = { team, teamNumber: v[1] ?? (team === 'A' ? 1 : 2) }
      return [['steal', vars], [`steal${team}`, vars]]
    }
    case 'revealall':
    case 'hideall':
    case 'reset':
      return [[name, {}]]
    case 'round':
      return [['round', { round: v[0], question: v[1] }]]
    case 'score':
      return [['score', { points: v[0] }]]
    default:
      return []
  }
}

// From the game. `sync` marks the catch-up the game sends when it (re)connects:
// built-in cues still go out so other apps catch up, but mapped cues don't,
// so a reconnect never fires a lighting cue by itself.
export function sendGameEvent(event, args = [], { sync = false } = {}) {
  const name = String(event || '')
  if (!SAFE_PATH.test(name)) return
  const values = (Array.isArray(args) ? args : [args]).filter(
    (a) => ['number', 'string', 'boolean'].includes(typeof a),
  )
  sendOsc(name, ...values)
  if (PER_VALUE.has(name) && values.length) sendOsc(`${name}/${values[0]}`)
  if (!sync) for (const [trigger, vars] of gameTriggers(name, values)) fireCue(trigger, vars)
}
