import { onMounted, onBeforeUnmount } from 'vue'

type Direction = 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown'

interface Entry {
  el: HTMLElement
  key: string
  _focusListener: () => void
}

// Singleton — one navigation context for the whole TV app
const entries: Entry[] = []
let currentKey: string | null = null
let listenerCount = 0

function center(r: DOMRect) {
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
}

function connectedEntries(): Entry[] {
  return entries.filter(e => e.el.isConnected)
}

function applyFocus(key: string) {
  const entry = entries.find(e => e.key === key)
  if (!entry || !entry.el.isConnected) return

  const prev = entries.find(e => e.key === currentKey)
  if (prev?.el.isConnected) prev.el.classList.remove('focused')

  currentKey = key
  entry.el.classList.add('focused')
  entry.el.focus({ preventScroll: false })
}

function findNextKey(direction: Direction): string | null {
  const active = connectedEntries()
  if (!active.length) return null
  if (!currentKey) return active[0]?.key ?? null

  const current = active.find(e => e.key === currentKey)
  if (!current) return active[0]?.key ?? null

  const cr = current.el.getBoundingClientRect()
  const cc = center(cr)

  const candidates = active.filter(e => {
    if (e.key === currentKey) return false
    const r = e.el.getBoundingClientRect()
    switch (direction) {
      case 'ArrowRight': return r.left   >= cr.right  - 1
      case 'ArrowLeft':  return r.right  <= cr.left   + 1
      case 'ArrowDown':  return r.top    >= cr.bottom - 1
      case 'ArrowUp':    return r.bottom <= cr.top    + 1
    }
  })

  if (!candidates.length) return null

  let bestKey: string | null = null
  let bestScore = Infinity

  for (const c of candidates) {
    const r  = c.el.getBoundingClientRect()
    const mc = center(r)
    let primary: number, secondary: number

    switch (direction) {
      case 'ArrowRight': primary = mc.x - cc.x; secondary = Math.abs(mc.y - cc.y); break
      case 'ArrowLeft':  primary = cc.x - mc.x; secondary = Math.abs(mc.y - cc.y); break
      case 'ArrowDown':  primary = mc.y - cc.y; secondary = Math.abs(mc.x - cc.x); break
      case 'ArrowUp':    primary = cc.y - mc.y; secondary = Math.abs(mc.x - cc.x); break
    }

    // Penalise secondary-axis offset so the "straight" neighbour wins
    const score = primary + secondary * 0.5
    if (score < bestScore) { bestScore = score; bestKey = c.key }
  }

  return bestKey
}

const ARROWS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'])

function onKeyDown(e: KeyboardEvent) {
  // Only handle arrow keys — Enter is handled natively by focused <button> elements.
  // Never call .click() manually: a focused button already fires click on Enter,
  // so a second programmatic click would double-toggle every action.
  if (!ARROWS.has(e.key)) return
  e.preventDefault()
  const nextKey = findNextKey(e.key as Direction)
  if (nextKey) applyFocus(nextKey)
}

export function useArrowNav() {
  onMounted(() => {
    if (listenerCount++ === 0) window.addEventListener('keydown', onKeyDown)
  })

  onBeforeUnmount(() => {
    if (--listenerCount === 0) window.removeEventListener('keydown', onKeyDown)
  })

  function register(el: HTMLElement | null, key: string, autoFocus = false) {
    if (!el) return

    // Remove stale entry with the same key (e.g. component re-render)
    const existing = entries.findIndex(e => e.key === key)
    if (existing >= 0) {
      const old = entries[existing]!
      old.el.removeEventListener('focus', old._focusListener)
      entries.splice(existing, 1)
    }

    // Keep spatial focus in sync when browser focus changes (mouse click, Tab key, etc.)
    const _focusListener = () => {
      if (currentKey === key) return
      const prev = entries.find(e => e.key === currentKey)
      if (prev?.el.isConnected) prev.el.classList.remove('focused')
      currentKey = key
      el.classList.add('focused')
      // Don't call el.focus() here — we're already inside a focus event
    }

    el.addEventListener('focus', _focusListener)
    entries.push({ el, key, _focusListener })

    if (autoFocus || currentKey === null) applyFocus(key)
  }

  function unregister(key: string) {
    const i = entries.findIndex(e => e.key === key)
    if (i >= 0) {
      const entry = entries[i]!
      entry.el.removeEventListener('focus', entry._focusListener)
      entries.splice(i, 1)
    }
    if (currentKey === key) currentKey = null
  }

  // Programmatically focus a registered element by key
  function focusKey(key: string) {
    applyFocus(key)
  }

  return { register, unregister, focusKey }
}
