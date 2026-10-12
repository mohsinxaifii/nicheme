// Case studies: a tilted 3D wall of real project photos that drifts sideways,
// with curved network lines linking projects of the same service. Hover lights
// up a project's network, filters light up a service, click opens the case.
import { cases, SERVICE_LABEL } from '../data/cases.js'
import { photos } from '../data/photos.js'

const BASE = import.meta.env.BASE_URL
const img = (slug, file) => `${BASE}work/${slug}/${file}`
const FEATURED = new Set(['red-bull-perfect-store-audits', 'du-field-force-merchandising', 'labour-camp-carnival-of-games', 'reckitt-retail-audits'])
const FORM_SERVICE = {
  audits: 'Retail & Perfect Store Audits', merch: 'Merchandising & Field Force', mystery: 'Mystery Shopping',
  activation: 'Promotions & Activations', install: 'Fixture Installation, Shelving & Maintenance', production: 'Production, Branding & Advertising',
}

const COLS = 10, ROWS = 3
const CW = 250, CH = 310, GX = 70, GY = 46            // card size and gaps (px, wall space)
const CELLX = CW + GX, CELLY = CH + GY
const SETW = COLS * CELLX                             // width of one loop of the wall

export function initWall({ lenis, reduced }) {
  const section = document.querySelector('#work')
  const stage = section.querySelector('[data-wall3d]')
  const track = section.querySelector('[data-track]')
  const modal = initModal({ lenis })
  let filter = 'all', focus = null

  // grid position of each case: 3 staggered rows
  const pos = cases.map((c, i) => {
    const col = i % COLS, row = Math.floor(i / COLS)
    return { x: col * CELLX + (row % 2) * CELLX / 2, y: row * CELLY }
  })
  // network: link each project to the next one of the same service
  const links = []
  Object.keys(SERVICE_LABEL).forEach(svc => {
    const idx = cases.map((c, i) => c.service === svc ? i : -1).filter(i => i > -1)
    for (let k = 1; k < idx.length; k++) links.push([idx[k - 1], idx[k], svc])
  })
  const curve = (a, b, ox) => {
    const x1 = pos[a].x + CW / 2 + ox, y1 = pos[a].y + CH / 2, x2 = pos[b].x + CW / 2 + ox, y2 = pos[b].y + CH / 2
    const bend = Math.max(80, Math.abs(x2 - x1) * 0.35)
    return `M${x1} ${y1}C${x1 + bend} ${y1 - bend * 0.6} ${x2 - bend} ${y2 + bend * 0.6} ${x2} ${y2}`
  }

  // two copies side by side for a seamless loop
  const H = ROWS * CELLY - GY
  let html = `<svg class="w3__net" width="${SETW * 2 + CELLX}" height="${H}" viewBox="0 0 ${SETW * 2 + CELLX} ${H}" aria-hidden="true">`
  for (const ox of [0, SETW]) for (const [a, b, svc] of links) {
    const d = curve(a, b, ox)
    html += `<path d="${d}" class="w3__line" data-a="${a}" data-b="${b}" data-svc="${svc}"/><path d="${d}" class="w3__flow" pathLength="100" data-a="${a}" data-b="${b}" data-svc="${svc}" style="--o:${(a * 0.37) % 3}s"/>`
  }
  html += '</svg>'
  for (const [copy, ox] of [[0, 0], [1, SETW]]) {
    cases.forEach((c, i) => {
      html += `<button type="button" class="w3__card${FEATURED.has(c.slug) ? ' is-feat' : ''}" data-i="${i}" data-service="${c.service}"
        style="left:${pos[i].x + ox}px;top:${pos[i].y}px" ${copy ? 'aria-hidden="true" tabindex="-1"' : `aria-label="${c.brand}: ${c.title}. ${c.stat} ${c.statLabel}"`}>
        <img src="${img(c.slug, 'cover.webp')}" alt="" loading="lazy" decoding="async">
        <span class="w3__pill">${SERVICE_LABEL[c.service]}</span>
        <span class="w3__stat"><b>${c.stat}</b>${c.statLabel}</span>
        <span class="w3__meta"><b>${c.brand}</b><span>${c.title}</span></span>
        <i class="w3__node" aria-hidden="true"></i>
      </button>`
    })
  }
  track.innerHTML = html
  track.style.width = `${SETW * 2 + CELLX}px`
  track.style.height = `${H}px`
  const cards = [...track.querySelectorAll('.w3__card')]
  const paths = [...track.querySelectorAll('.w3__net path')]

  // highlight a project's network, or a whole service
  function paint() {
    const svc = focus !== null ? cases[focus].service : filter !== 'all' ? filter : null
    track.classList.toggle('is-focus', !!svc)
    const linked = new Set()
    if (focus !== null) {
      linked.add(focus)
      paths.forEach(p => { if (+p.dataset.a === focus || +p.dataset.b === focus) { linked.add(+p.dataset.a); linked.add(+p.dataset.b) } })
    }
    paths.forEach(p => p.classList.toggle('on', !!svc && p.dataset.svc === svc))
    cards.forEach(c => c.classList.toggle('on', !!svc && (focus !== null ? linked.has(+c.dataset.i) || c.dataset.service === svc : c.dataset.service === svc)))
  }
  track.addEventListener('pointerover', e => {
    const c = e.target.closest('.w3__card')
    const i = c ? +c.dataset.i : null
    if (i !== focus) { focus = i; paint() }
  })
  track.addEventListener('pointerleave', () => { focus = null; paint() })
  section.querySelectorAll('[data-filter]').forEach(chip => chip.addEventListener('click', () => {
    filter = chip.dataset.filter
    section.querySelectorAll('[data-filter]').forEach(c => c.classList.toggle('is-on', c === chip))
    paint()
    // bring the first match into view
    if (filter !== 'all') {
      const i = cases.findIndex(c => c.service === filter)
      target = -(pos[i].x - stage.clientWidth * 0.3)
    }
  }))

  // motion: endless drift, drag / horizontal wheel to scrub, slows on hover
  let x = 0, target = 0, speed = reduced ? 0 : 0.35, hovering = false, down = false, moved = 0, lastX = 0
  stage.addEventListener('pointerenter', () => { hovering = true })
  stage.addEventListener('pointerleave', () => { hovering = false })
  stage.addEventListener('pointerdown', e => { down = true; moved = 0; lastX = e.clientX; stage.classList.add('is-drag') })
  addEventListener('pointermove', e => {
    if (!down) return
    const dx = e.clientX - lastX; lastX = e.clientX; moved += Math.abs(dx); target += dx * 1.4
  })
  addEventListener('pointerup', () => { down = false; stage.classList.remove('is-drag') })
  stage.addEventListener('wheel', e => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) { e.preventDefault(); target -= e.deltaX } }, { passive: false })
  track.addEventListener('click', e => {
    const c = e.target.closest('.w3__card')
    if (!c || moved > 6) return
    modal.open(+c.dataset.i, cards[+c.dataset.i], () => cases.map((_, i) => i))
  })
  // keyboard: keep the focused card on screen
  track.addEventListener('focusin', e => {
    const c = e.target.closest('.w3__card'); if (!c) return
    focus = +c.dataset.i; paint()
    target = -(pos[focus].x - stage.clientWidth * 0.35)
  })
  track.addEventListener('focusout', () => { focus = null; paint() })

  let visible = false
  new IntersectionObserver(([e]) => { visible = e.isIntersecting }).observe(stage)
  const loop = () => {
    if (visible && !modal.isOpen()) {
      if (!down) target -= hovering || filter !== 'all' ? 0 : speed + Math.abs(lenis?.velocity || 0) * 0.15
      x += (target - x) * 0.08
      const wrapped = ((x % SETW) + SETW) % SETW - SETW
      track.style.transform = `translate3d(${wrapped}px, 0, 0)`
    }
    requestAnimationFrame(loop)
  }
  loop()

  const m = location.hash.match(/^#case\/(.+)$/)
  if (m) {
    const idx = cases.findIndex(c => c.slug === m[1])
    if (idx > -1) setTimeout(() => modal.open(idx, null, () => cases.map((_, i) => i)), 300)
  }
}

// ---------------------------------------------------------------------------
function initModal({ lenis }) {
  const el = document.querySelector('[data-modal]')
  const panel = el.querySelector('[data-panel]')
  const q = s => el.querySelector(s)
  const stage = q('[data-gallery-img]'), thumbs = q('[data-gallery-thumbs]')
  let order = [], pos = 0, opener = null, open = false, shot = 0, list = []

  function setShot(n) {
    if (!list.length) return
    shot = (n + list.length) % list.length
    const [file, w, h] = list[shot]
    const c = cases[order[pos]]
    stage.src = img(c.slug, file)
    stage.width = w; stage.height = h
    stage.style.maxWidth = `${Math.max(w, 320)}px`
    stage.alt = `${c.brand}, ${c.title}: photo ${shot + 1} of ${list.length}`
    thumbs.querySelectorAll('button').forEach((b, i) => b.setAttribute('aria-current', i === shot))
  }

  function fill(p) {
    pos = (p + order.length) % order.length
    const i = order[pos], c = cases[i]
    list = photos[c.slug] || []
    thumbs.innerHTML = list.length > 1 ? list.map(([f], k) => `<button type="button" aria-label="Photo ${k + 1}"><img src="${img(c.slug, f)}" alt="" loading="lazy"></button>`).join('') : ''
    setShot(0)
    q('[data-modal-kicker]').textContent = `Case study ${i + 1} of ${cases.length}`
    q('[data-modal-title]').innerHTML = `${c.brand}<small>${c.title}</small>`
    q('[data-modal-pills]').innerHTML = [SERVICE_LABEL[c.service], ...c.where.split(', ')].map(t => `<span>${t}</span>`).join('')
    q('[data-modal-stats]').innerHTML = c.stats.map(([b, s]) => `<div><b>${b}</b><span>${s}</span></div>`).join('')
    q('[data-modal-text]').innerHTML = `
      <h3>Challenge</h3><p>${c.challenge}</p>
      <h3>What we did</h3><ul>${c.did.map(d => `<li>${d}</li>`).join('')}</ul>
      <h3>Result</h3><p>${c.result}</p>`
    panel.scrollTop = 0
    history.replaceState(null, '', `#case/${c.slug}`)
  }

  function show(i, from, getOrder) {
    order = getOrder()
    opener = from
    fill(Math.max(0, order.indexOf(i)))
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

  thumbs.addEventListener('click', e => {
    const b = e.target.closest('button')
    if (b) setShot([...thumbs.children].indexOf(b))
  })
  // swipe between photos on touch screens
  let sx = null
  q('.gallery__stage').addEventListener('pointerdown', e => { sx = e.clientX })
  q('.gallery__stage').addEventListener('pointerup', e => {
    if (sx === null) return
    const dx = e.clientX - sx; sx = null
    if (Math.abs(dx) > 40) setShot(shot + (dx < 0 ? 1 : -1))
  })

  el.addEventListener('click', e => {
    if (e.target.closest('[data-close]')) close()
    if (e.target.closest('[data-close-to-contact]')) {
      const c = cases[order[pos]]
      const msg = document.querySelector('[name="message"]')
      if (msg && !msg.value) msg.value = `We'd like something similar to your ${c.brand} ${c.title} programme.`
      const sel = document.querySelector('[data-service-select]')
      if (sel) sel.value = FORM_SERVICE[c.service]
      close()
    }
  })
  q('[data-prev]').addEventListener('click', () => fill(pos - 1))
  q('[data-next]').addEventListener('click', () => fill(pos + 1))
  document.addEventListener('keydown', e => {
    if (!open) return
    if (e.key === 'Escape') close()
    if (e.key === 'ArrowRight') setShot(shot + 1)
    if (e.key === 'ArrowLeft') setShot(shot - 1)
    if (e.key === 'Tab') {
      const f = [...panel.querySelectorAll('button, a[href]')]
      const first = f[0], last = f[f.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
  })
  return { open: show, close, isOpen: () => open }
}
