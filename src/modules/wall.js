// Case studies: a bento grid of real project photos (grayscale at rest, colour
// on hover), filters, "show all", and a popup with a photo gallery.
import { cases, SERVICE_LABEL } from '../data/cases.js'
import { photos } from '../data/photos.js'

const BASE = import.meta.env.BASE_URL
const img = (slug, file) => `${BASE}work/${slug}/${file}`
const FEATURED = new Set(['red-bull-perfect-store-audits', 'du-field-force-merchandising', 'labour-camp-carnival-of-games', 'reckitt-retail-audits'])
const FIRST = 18
const FORM_SERVICE = {
  audits: 'Retail & Perfect Store Audits', merch: 'Merchandising & Field Force', mystery: 'Mystery Shopping',
  activation: 'Promotions & Activations', install: 'Fixture Installation, Shelving & Maintenance', production: 'Production, Branding & Advertising',
}

export function initWall({ lenis }) {
  const section = document.querySelector('#work')
  const grid = section.querySelector('[data-grid]')
  const more = section.querySelector('[data-more]')
  const modal = initModal({ lenis })
  let filter = 'all', expanded = false

  grid.innerHTML = cases.map((c, i) => `
    <li class="tile-wrap${FEATURED.has(c.slug) ? ' is-feat' : ''}" data-i="${i}" data-service="${c.service}">
      <a class="tile" href="#case/${c.slug}" data-open="${i}">
        <img src="${img(c.slug, 'cover.webp')}" alt="${c.brand}: ${c.title}" loading="lazy" decoding="async">
        <span class="tile__wash" aria-hidden="true"></span>
        <span class="tile__pill">${SERVICE_LABEL[c.service]}</span>
        <span class="tile__body">
          <span class="tile__stat"><b>${c.stat}</b> ${c.statLabel}</span>
          <span class="tile__brand">${c.brand}</span>
          <span class="tile__title">${c.title}</span>
        </span>
      </a>
    </li>`).join('')

  grid.addEventListener('click', e => {
    const a = e.target.closest('[data-open]')
    if (!a) return
    e.preventDefault()
    modal.open(+a.dataset.open, a, () => visibleIndexes())
  })

  const items = [...grid.children]
  function visibleIndexes() { return items.filter(li => !li.hidden).map(li => +li.dataset.i) }
  function apply() {
    let shown = 0
    items.forEach(li => {
      const match = filter === 'all' || li.dataset.service === filter
      const show = match && (expanded || filter !== 'all' || shown < FIRST)
      if (show) shown++
      li.hidden = !show
    })
    more.hidden = expanded || filter !== 'all'
    items.filter(li => !li.hidden).forEach((li, k) => li.animate(
      [{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }],
      { duration: 500, delay: Math.min(k, 12) * 30, easing: 'cubic-bezier(.2,.7,.1,1)', fill: 'backwards' }))
    lenis?.resize()
  }
  section.querySelectorAll('[data-filter]').forEach(chip => chip.addEventListener('click', () => {
    filter = chip.dataset.filter
    section.querySelectorAll('[data-filter]').forEach(c => c.classList.toggle('is-on', c === chip))
    apply()
  }))
  more.addEventListener('click', () => { expanded = true; apply() })
  apply()

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
  return { open: show, close }
}
