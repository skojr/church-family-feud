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

function tone(c, { freq, start, duration, type = 'sine', peak = 0.25 }) {
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  osc.connect(gain).connect(c.destination)
  osc.start(start)
  osc.stop(start + duration + 0.05)
}

export function playReveal() {
  const c = audio()
  if (!c) return
  const t = c.currentTime
  tone(c, { freq: 880, start: t, duration: 0.5 })
  tone(c, { freq: 1318.5, start: t + 0.09, duration: 0.7 })
}

export function playStrike() {
  const c = audio()
  if (!c) return
  const t = c.currentTime
  tone(c, { freq: 110, start: t, duration: 0.8, type: 'sawtooth', peak: 0.2 })
  tone(c, { freq: 116, start: t, duration: 0.8, type: 'square', peak: 0.12 })
}
