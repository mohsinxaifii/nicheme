// Case studies: an endless, draggable wall of clean typographic cards.
// The same cases render as a plain list (accessible fallback + list view).
import { cases, SERVICE_LABEL } from '../data/cases.js'

const FEATURED = new Set(['red-bull-perfect-store-audits', 'du-field-force-merchandising', 'mentos-air-action-sampling', 'labour-camp-carnival-of-games'])
const COLS = 6
const FORM_SERVICE = {
  audits: 'Retail & Perfect Store Audits', merch: 'Merchandising & Field Force', mystery: 'Mystery Shopping',
  activation: 'Promotions & Activations', install: 'Fixture Installation, Shelving & Maintenance', production: 'Production, Branding & Advertising',
}

export function initWall({ lenis, reduced }) {
  const section = document.querySelector('#work')
  const stage = section.querySelector('[data-wall]')
  const plane = section.querySelector('[data-plane]')
  const list = section.querySelector('[data-list]')
  const modal = initModal({ lenis })
  let moved = 0

  const cards = cases.map((c, i) => {
    const el = document.createElement('button')
    el.type = 'button'
    el.className = `card${FEATURED.has(c.slug) ? ' is-feat' : ''}`
    el.setAttribute('aria-label', `${c.brand}: ${c.title}. ${c.stat} ${c.statLabel}. Open case study`)
    el.innerHTML = `
      <span class="card__top"><span>${SERVICE_LABEL[c.service]}</span><span>${c.where}</span></span>
      <span class="card__stat"><b>${c.stat}</b><span>${c.statLabel}</span></span>
      <span><span class="card__brand">${c.brand}</span><span class="card__title">${c.title}</span></span>`
    el.addEventListener('click', e => { if (moved > 6) { e.preventDefault(); return } modal.open(i, el) })
    plane.appendChild(el)
    return { el, c, i, x: 0, y: 0 }
  })

  // list view
  list.innerHTML = cases.map((c, i) => `
    <li data-service="${c.service}"><button type="button" data-open="${i}">
      <span class="n">${String(i + 1).padStart(2, '0')}</span>
      <span class="b">${c.brand}</span>
      <span class="t">${c.title}</span>
      <span class="s">${SERVICE_LABEL[c.service]} · ${c.where}</span>
      <span class="k">${c.stat} ${c.statLabel}</span>
    </button></li>`).join('')
  list.addEventListener('click', e => {
    const b = e.target.closest('[data-open]')
    if (b) modal.open(+b.dataset.open, b)
  })
  const toggle = section.querySelector('[data-view-toggle]')
  toggle.addEventListener('click', () => {
    const on = !section.classList.contains('is-list')
    section.classList.toggle('is-list', on)
    list.hidden = !on
    toggle.setAttribute('aria-pressed', on)
    toggle.textContent = on ? 'Wall view' : 'List view'
    lenis?.resize()
  })

  // filters
  const chips = section.querySelectorAll('[data-filter]')
  chips.forEach(chip => chip.addEventListener('click', () => {
    const f = chip.dataset.filter
    chips.forEach(c => c.classList.toggle('is-on', c === chip))
    cards.forEach(k => k.el.classList.toggle('is-dim', f !== 'all' && k.c.service !== f))
    list.querySelectorAll('li').forEach(li => li.classList.toggle('is-dim', f !== 'all' && li.dataset.service !== f))
    const first = f !== 'all' && cards.find(k => k.c.service === f)
    if (first) { target.x += stage.clientWidth / 2 - (first.x + cw / 2); target.y += stage.clientHeight / 2 - (first.y + ch / 2) }
  }))

  // layout + infinite wrap
  let cw = 300, ch = 360, cellW = 340, cellH = 400, W = 0, H = 0
  function layout() {
    cw = Math.round(Math.min(320, Math.max(240, innerWidth * 0.21)))
    ch = Math.round(cw * 1.2)
    cellW = cw + 24
    cellH = ch + 24
    W = COLS * cellW
    H = Math.ceil(cards.length / COLS) * cellH
    plane.style.setProperty('--cw', `${cw}px`)
    plane.style.setProperty('--ch', `${ch}px`)
  }
  layout()
  addEventListener('resize', layout)

  const offset = { x: 0, y: 0 }, target = { x: -cellW * 0.4, y: -cellH * 0.3 }
  const mod = (n, m) => ((n % m) + m) % m
  function place() {
    for (const k of cards) {
      const col = k.i % COLS, row = Math.floor(k.i / COLS)
      const bx = col * cellW, by = row * cellH + (col % 2) * cellH * 0.5
      k.x = mod(bx + offset.x, W) - cellW
      k.y = mod(by + offset.y, H) - cellH
      k.el.style.transform = `translate3d(${k.x}px, ${k.y}px, 0)`
    }
  }

  // drag with inertia
  let down = false, last = { x: 0, y: 0 }, vel = { x: 0, y: 0 }, pointerType = 'mouse'
  stage.addEventListener('pointerdown', e => {
    down = true; moved = 0; pointerType = e.pointerType
    last = { x: e.clientX, y: e.clientY }; vel = { x: 0, y: 0 }
    stage.classList.add('is-drag')
  })
  addEventListener('pointermove', e => {
    if (!down) return
    const dx = e.clientX - last.x, dy = pointerType === 'mouse' ? e.clientY - last.y : 0
    last = { x: e.clientX, y: e.clientY }
    moved += Math.abs(dx) + Math.abs(dy)
    target.x += dx; target.y += dy
    vel = { x: dx, y: dy }
  })
  const up = () => {
    if (!down) return
    down = false; stage.classList.remove('is-drag')
    target.x += vel.x * 12; target.y += vel.y * 12
  }
  addEventListener('pointerup', up)
  addEventListener('pointercancel', up)
  stage.addEventListener('wheel', e => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) { e.preventDefault(); target.x -= e.deltaX }
  }, { passive: false })
  stage.addEventListener('focusin', e => {
    const k = cards.find(c => c.el === e.target)
    if (!k) return
    if (k.x < 40 || k.x + cw > stage.clientWidth - 40) target.x += stage.clientWidth / 2 - (k.x + cw / 2)
    if (k.y < 20 || k.y + ch > stage.clientHeight - 20) target.y += stage.clientHeight / 2 - (k.y + ch / 2)
  })

  let visible = false
  new IntersectionObserver(([e]) => { visible = e.isIntersecting }).observe(stage)
  const tick = () => {
    if (visible) {
      if (!down && !reduced && !modal.isOpen()) target.x -= 0.2
      offset.x += (target.x - offset.x) * 0.09
      offset.y += (target.y - offset.y) * 0.09
      place()
    }
    requestAnimationFrame(tick)
  }
  place()
  tick()

  const m = location.hash.match(/^#case\/(.+)$/)
  if (m) {
    const idx = cases.findIndex(c => c.slug === m[1])
    if (idx > -1) setTimeout(() => modal.open(idx), 400)
  }
}

// ---------------------------------------------------------------------------
function initModal({ lenis }) {
  const el = document.querySelector('[data-modal]')
  const panel = el.querySelector('[data-panel]')
  const q = s => el.querySelector(s)
  let idx = 0, opener = null, open = false

  function fill(i) {
    idx = (i + cases.length) % cases.length
    const c = cases[idx]
    q('[data-modal-side]').innerHTML = `<small>${SERVICE_LABEL[c.service]} · ${c.where}</small><div><b>${c.stat}</b><span>${c.statLabel}</span></div>`
    q('[data-modal-kicker]').textContent = `Case study ${idx + 1} of ${cases.length}`
    q('[data-modal-title]').innerHTML = `${c.brand}<small>${c.title}</small>`
    q('[data-modal-stats]').innerHTML = c.stats.map(([b, s]) => `<div><b>${b}</b><span>${s}</span></div>`).join('')
    q('[data-modal-text]').innerHTML = `
      <h3>Challenge</h3><p>${c.challenge}</p>
      <h3>What we did</h3><ul>${c.did.map(d => `<li>${d}</li>`).join('')}</ul>
      <h3>Result</h3><p>${c.result}</p>`
    panel.scrollTop = 0
    history.replaceState(null, '', `#case/${c.slug}`)
  }
  function show(i, from) {
    opener = from || document.activeElement
    fill(i)
    el.hidden = false
    open = true
    lenis?.stop()
    document.documentElement.style.overflow = 'hidden'
    panel.animate([{ opacity: 0, transform: 'translateY(24px)' }, { opacity: 1, transform: 'none' }], { duration: 450, easing: 'cubic-bezier(.2,.7,.1,1)' })
    q('.modal__close').focus()
  }
  function close() {
    if (!open) return
    open = false
    panel.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200 }).onfinish = () => { el.hidden = true }
    lenis?.start()
    document.documentElement.style.overflow = ''
    history.replaceState(null, '', location.pathname + '#work')
    opener?.focus?.({ preventScroll: true })
  }

  el.addEventListener('click', e => {
    if (e.target.closest('[data-close]')) close()
    if (e.target.closest('[data-close-to-contact]')) {
      const c = cases[idx]
      const msg = document.querySelector('[name="message"]')
      if (msg && !msg.value) msg.value = `We'd like something similar to your ${c.brand} ${c.title} programme.`
      const sel = document.querySelector('[data-service-select]')
      if (sel) sel.value = FORM_SERVICE[c.service]
      close()
    }
  })
  q('[data-prev]').addEventListener('click', () => fill(idx - 1))
  q('[data-next]').addEventListener('click', () => fill(idx + 1))
  document.addEventListener('keydown', e => {
    if (!open) return
    if (e.key === 'Escape') close()
    if (e.key === 'ArrowRight') fill(idx + 1)
    if (e.key === 'ArrowLeft') fill(idx - 1)
    if (e.key === 'Tab') {
      const f = [...panel.querySelectorAll('button, a[href]')]
      const first = f[0], lastEl = f[f.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastEl.focus() }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus() }
    }
  })
  return { open: show, close, isOpen: () => open }
}
