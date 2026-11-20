let ctx

function audio() {
  if (!ctx) {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return null
    ctx = new Ctx()
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function tone(c, { freq, start, duration, type = 'sine', peak = 0.25, attack = 0.02 }) {
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(peak, start + attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  osc.connect(gain).connect(c.destination)
  osc.start(start)
  osc.stop(start + duration + 0.05)
}

// A struck bell: instant attack, a long ring, and inharmonic overtones that fade faster
// than the note itself.
const BELL_PARTIALS = [
  [1, 1, 1],
  [2, 0.45, 0.6],
  [2.76, 0.3, 0.45],
  [5.4, 0.12, 0.25],
  [8.93, 0.05, 0.15],
]

function bell(c, { freq, start, duration, peak = 0.18 }) {
  for (const [ratio, level, length] of BELL_PARTIALS) {
    tone(c, {
      freq: freq * ratio,
      start,
      duration: duration * length,
      peak: peak * level,
      attack: 0.003,
    })
  }
}

export function playReveal() {
  const c = audio()
  if (!c) return
  const t = c.currentTime
  bell(c, { freq: 880, start: t, duration: 1.2 })
  bell(c, { freq: 1318.5, start: t + 0.09, duration: 1.6 })
}

export function playStrike() {
  const c = audio()
  if (!c) return
  const t = c.currentTime
  tone(c, { freq: 110, start: t, duration: 0.4, type: 'triangle', peak: 0.28 })
  tone(c, { freq: 116, start: t, duration: 0.4, type: 'square', peak: 0.05 })
  tone(c, { freq: 110, start: t, duration: 0.4, type: 'sawtooth', peak: 0.075 })
}

// Steal: a quick rising sweep into a bright major chord.
export function playSteal() {
  const c = audio()
  if (!c) return
  const t = c.currentTime
  const sweep = c.createOscillator()
  const g = c.createGain()
  sweep.type = 'triangle'
  sweep.frequency.setValueAtTime(220, t)
  sweep.frequency.exponentialRampToValueAtTime(880, t + 0.28)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(0.12, t + 0.05)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32)
  sweep.connect(g).connect(c.destination)
  sweep.start(t)
  sweep.stop(t + 0.35)
  for (const [freq, delay] of [[659.25, 0], [830.6, 0.05], [987.8, 0.1], [1318.5, 0.15]]) {
    bell(c, { freq, start: t + 0.3 + delay, duration: 1.3, peak: 0.13 })
  }
}
