import { connectHub } from '/hub-client.js'

const $ = (s) => document.querySelector(s)
const stationEl = (id) => document.querySelector(`.station[data-station="${id}"]`)

// ------------------------------------------------------------- sound ----
// A synthesized bell, so the hub needs no audio files. A and B ring at
// different pitches, which makes testing by ear easy.
let audio
let soundOn = true
const PITCH = { A: 1046.5, B: 784 }

function ensureAudio() {
  audio ||= new AudioContext()
  if (audio.state === 'suspended') audio.resume()
  updateSoundChip()
}

function bell(station) {
  if (!soundOn || !audio || audio.state !== 'running') return
  const f = PITCH[station] || 880
  const t = audio.currentTime
  const out = audio.createGain()
  out.gain.value = 0.5
  out.connect(audio.destination)
  // Inharmonic partials give it a struck-bell character.
  for (const [ratio, gain, decay] of [
    [1, 1, 2.2],
    [2.76, 0.45, 1.2],
    [5.4, 0.25, 0.6],
    [8.93, 0.12, 0.3],
  ]) {
    const osc = audio.createOscillator()
    const g = audio.createGain()
    osc.frequency.value = f * ratio
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(gain, t + 0.005)
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay)
    osc.connect(g).connect(out)
    osc.start(t)
    osc.stop(t + decay + 0.05)
  }
}

function updateSoundChip() {
  const chip = $('#sound')
  const ready = audio && audio.state === 'running'
  chip.textContent = !ready ? '🔇 Click to enable sound' : soundOn ? '🔔 Sound on (M)' : '🔕 Muted (M)'
}

$('#sound').addEventListener('click', (e) => {
  e.stopPropagation()
  if (audio && audio.state === 'running') soundOn = !soundOn
  ensureAudio()
  updateSoundChip()
})
document.addEventListener('pointerdown', ensureAudio, { once: true })

// --------------------------------------------------------------- hub ----
const hub = connectHub({
  hello: { type: 'hello', role: 'screen', name: 'bell' },
  onStatus(ok) {
    const chip = $('#hub')
    chip.className = `chip ${ok ? 'chip--ok' : 'chip--bad'}`
    chip.lastChild.textContent = ok ? 'Hub connected' : 'Hub offline — reconnecting'
  },
  onMessage(msg) {
    if (msg.type === 'buzz') bell(msg.station)
    if (msg.type === 'state') render(msg)
    if (msg.type === 'stations') renderStations(msg.stations)
  },
})

// ------------------------------------------------------------ render ----
function renderStations(stations) {
  for (const s of Object.values(stations)) {
    const chip = stationEl(s.id).querySelector('.station__status')
    chip.className = `station__status chip ${s.online ? (s.sim ? 'chip--sim' : 'chip--ok') : ''}`
    let text = 'Offline'
    if (s.online && s.sim) text = 'Simulator'
    else if (s.online)
      text = `Online · ${s.ip}${s.rssi != null ? ` · ${s.rssi} dBm` : ''}${s.syncMs != null ? ` · timing ±${s.syncMs} ms` : ' · timing not synced'}`
    chip.querySelector('span').textContent = text
  }
}

function render(state) {
  const { armed, winner, round, presses, events } = state
  document.body.classList.toggle('is-armed', armed)
  document.body.classList.toggle('is-locked', !armed && !winner)
  document.body.classList.toggle('has-winner', Boolean(winner))
  $('#round').textContent = `Round ${round}`

  for (const id of ['A', 'B']) {
    const el = stationEl(id)
    el.classList.toggle('is-winner', winner === id)
    el.classList.toggle('is-loser', Boolean(winner) && winner !== id)
    const p = presses.find((x) => x.station === id)
    el.querySelector('.station__delta').textContent = !p
      ? ''
      : p.counted
        ? 'FIRST!'
        : p.deltaMs != null
          ? `+${p.deltaMs} ms`
          : 'pressed while locked'
  }
  renderStations(state.stations)

  const late = presses.find((p) => !p.counted && p.deltaMs != null)
  if (winner) {
    $('#kicker').textContent = 'Buzzed first'
    $('#title').textContent = `Station ${winner}`
    $('#sub').textContent = late
      ? `Station ${late.station} was ${late.deltaMs} ms behind`
      : 'Press Space to reset'
  } else if (armed) {
    $('#kicker').textContent = 'Armed'
    $('#title').textContent = 'Waiting for a buzz'
    $('#sub').textContent = 'First station to press wins'
  } else {
    $('#kicker').textContent = 'Locked'
    $('#title').textContent = 'Buzzers locked'
    $('#sub').textContent = 'Press Space to arm'
  }

  $('#log').innerHTML = events
    .slice(0, 6)
    .map((e) => `<li class="${e.kind}">${new Date(e.t).toLocaleTimeString()} · ${e.text}</li>`)
    .join('')
}

// ---------------------------------------------------------- controls ----
function act(action, station) {
  ensureAudio()
  if (action === 'fullscreen') {
    if (document.fullscreenElement) document.exitFullscreen()
    else document.documentElement.requestFullscreen()
    return
  }
  hub.send({ type: action, station })
}

document.querySelectorAll('[data-action]').forEach((btn) =>
  btn.addEventListener('click', () => act(btn.dataset.action, btn.dataset.station)),
)

window.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return
  const key = e.key.toLowerCase()
  const map = {
    ' ': ['reset'],
    r: ['reset'],
    l: ['lock'],
    1: ['identify', 'A'],
    2: ['identify', 'B'],
    f: ['fullscreen'],
  }
  if (key === 'm') {
    soundOn = !soundOn
    ensureAudio()
    updateSoundChip()
    return
  }
  if (map[key]) {
    e.preventDefault()
    act(...map[key])
  }
})
