// Shared helpers for the LED pages.
import { connectHub } from './hub-client.js'

const params = new URLSearchParams(location.search)
export const param = (name, fallback = null) => params.get(name) ?? fallback

if (param('bg') === 'black') document.documentElement.classList.add('bg-black')

// ---------------------------------------------------------------- fit text ----
// Every .fit element grows to the largest font size that fits inside its parent.
// LED walls have unknown, often extreme sizes (e.g. 1536×128), so nothing uses
// fixed sizes: text is measured against its box on every resize and change.

function fitOne(el) {
  const box = el.parentElement
  const maxW = box.clientWidth * (Number(el.dataset.fitW) || 0.92)
  const maxH = box.clientHeight * (Number(el.dataset.fitH) || 0.86)
  if (!maxW || !maxH) return
  let lo = 4
  let hi = Math.max(8, maxH * 1.6)
  el.style.fontSize = `${hi}px`
  for (let i = 0; i < 18; i++) {
    const mid = (lo + hi) / 2
    el.style.fontSize = `${mid}px`
    const r = el.getBoundingClientRect()
    if (r.width <= maxW && r.height <= maxH) lo = mid
    else hi = mid
  }
  el.style.fontSize = `${Math.floor(lo)}px`
}

export function fitAll(root = document) {
  root.querySelectorAll('.fit').forEach(fitOne)
}

const ro = new ResizeObserver(() => fitAll())
export function watchFit() {
  ro.observe(document.body)
  document.fonts?.ready.then(() => fitAll())
  window.addEventListener('resize', () => fitAll())
}

// --------------------------------------------------------------- set text ----

export function setText(el, value) {
  const text = String(value)
  if (el.textContent === text) return false
  el.textContent = text
  fitOne(el)
  return true
}

// Count a score from its current value to the new one, then pop.
export function setScore(el, value) {
  const target = Number(value) || 0
  const from = Number(el.dataset.value ?? target)
  el.dataset.value = target
  if (from === target) {
    setText(el, target)
    return
  }
  const start = performance.now()
  const dur = Math.min(900, 250 + Math.abs(target - from) * 8)
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  const step = (t) => {
    const k = reduce ? 1 : Math.min(1, (t - start) / dur)
    const eased = 1 - Math.pow(1 - k, 3)
    el.textContent = String(Math.round(from + (target - from) * eased))
    if (k < 1) requestAnimationFrame(step)
    else {
      setText(el, target)
      fitOne(el)
    }
  }
  fitOne(el)
  requestAnimationFrame(step)
  const pop = el.closest('[data-pop]') || el
  pop.classList.remove('pop')
  void pop.offsetWidth
  pop.classList.add('pop')
}

// ------------------------------------------------------------- connection ----

export function connectDisplay(role, onState) {
  const offline = document.createElement('div')
  offline.className = 'offline'
  offline.textContent = 'Hub offline'
  offline.hidden = true
  document.body.append(offline)

  let last = null
  return connectHub({
    hello: { type: 'hello', role },
    onStatus: (up) => (offline.hidden = up),
    onMessage: (msg) => {
      if (msg.type === 'state') {
        last = msg
        onState(msg)
      } else if (msg.type === 'board' && last) {
        last = { ...last, board: msg.board }
        onState(last)
      }
    },
  })
}

// Team id for a station letter (Team A = Station A).
export const teamIds = ['A', 'B']
