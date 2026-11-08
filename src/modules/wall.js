// Case studies: a tilted 3D wall of real project photos, with curved network
// lines linking projects of the same service. The wall is always an endless
// loop drifting right to left, two rows of equal cards on every tab. "All"
// shows every case study; any other pill shows only that service's projects,
// repeated to fill the rows and the screen. Hover slows the drift; on "All" it
// also lights up the project's network. Click opens the case.
import { SERVICE_LABEL } from '../data/cases.js'
import { workItems as cases } from '../data/work.js'
import { icon } from '../data/icons.js'

const BASE = import.meta.env.BASE_URL
const FEATURED = new Set(['red-bull-perfect-store-audits', 'mentos-air-action-sampling', 'william-grant-mystery-shopping', 'reckitt-retail-audits'])
const href = c => `${BASE}case-studies/${c.slug}/`

const ROWS = 2
const SVC_ICON = { audits: 'audit', merch: 'merch', mystery: 'mystery', research: 'research', activation: 'promo', sampling: 'sampling', events: 'events', reporting: 'reporting', digital: 'digital', production: 'production', install: 'install' }
const CW = 340, CH = 422, GX = 84, GY = 56            // card size and gaps (px, wall space); keep in step with .w3__card in sections.css
const CELLX = CW + GX, CELLY = CH + GY

const caseIndex = slug => cases.findIndex(c => c.slug === slug)

export function initWall({ lenis, reduced }) {
  const section = document.querySelector('#work')
  if (!section?.querySelector('[data-wall3d]')) return
  const stage = section.querySelector('[data-wall3d]')
  const track = section.querySelector('[data-track]')
  const chips = [...section.querySelectorAll('[data-filter]')]
  const hint = section.querySelector('.w3__hint')
  if (hint && !matchMedia('(hover: hover)').matches) hint.lastChild.textContent = 'Drag to explore · tap a project to open it'

  // ---- layout + markup for a set of projects
  let list = [], pos = new Map(), setW = 0, copies = 2, cards = [], paths = [], focus = null
  function build(filter) {
    list = cases.map((c, i) => i).filter(i => filter === 'all' || cases[i].service === filter)
    // workItems is already ordered by content: photo cards first, placeholders last
    // every tab: same rows, same card size; small sets repeat to fill the rows
    const rows = ROWS
    const cols = Math.ceil(list.length / rows)
    const slot = k => { const col = k % cols, row = Math.floor(k / cols); return { x: col * CELLX + (row % 2) * CELLX / 2, y: row * CELLY } }
    pos = new Map(list.map((ci, k) => [ci, slot(k)]))
    // a short last row would leave the same hole on every loop: fill it with the set's first cards
    const fill = list.slice(0, rows * cols - list.length).map((ci, j) => ({ ci, p: slot(list.length + j), dup: true }))
    const items = [...list.map(ci => ({ ci, p: pos.get(ci), dup: false })), ...fill]
    setW = cols * CELLX
    copies = copiesNeeded()

    // network: link each project to the next one of the same service
    // network. Single-service tabs: each card to the next one. "All": the same neighbour chain,
    // plus vertical links where a card sits over a same-service card in the other row. (Linking
    // all same-service cards there made long curves that flew out of the section.)
    const links = []
    if (filter === 'all') {
      for (let k = 1; k < list.length; k++) links.push([list[k - 1], list[k], cases[list[k]].service])
      for (const a of list) for (const b of list) {
        const A = pos.get(a), B = pos.get(b)
        if (A.y < B.y && Math.abs(A.x - B.x) <= CELLX * 0.6 && cases[a].service === cases[b].service) links.push([a, b, cases[a].service])
      }
    } else Object.keys(SERVICE_LABEL).forEach(svc => {
      const idx = list.filter(i => cases[i].service === svc)
      for (let k = 1; k < idx.length; k++) links.push([idx[k - 1], idx[k], svc])
    })
    const curve = (a, b, ox) => {
      const A = pos.get(a), B = pos.get(b)
      const x1 = A.x + CW / 2 + ox, y1 = A.y + CH / 2, x2 = B.x + CW / 2 + ox, y2 = B.y + CH / 2
      const bend = Math.max(80, Math.abs(x2 - x1) * 0.35)
      return `M${x1} ${y1}C${x1 + bend} ${y1 - bend * 0.6} ${x2 - bend} ${y2 + bend * 0.6} ${x2} ${y2}`
    }

    // copies side by side, enough to cover the (tilted) stage plus one set, for a seamless loop
    const offsets = Array.from({ length: copies }, (_, k) => k * setW)
    const W = setW * copies + CELLX, H = rows * CELLY - GY
    let html = `<svg class="w3__net" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true">`
    for (const ox of offsets) for (const [a, b, svc] of links) {
      const d = curve(a, b, ox)
      html += `<path d="${d}" class="w3__line" data-a="${a}" data-b="${b}" data-svc="${svc}"/><path d="${d}" class="w3__flow" pathLength="100" data-a="${a}" data-b="${b}" data-svc="${svc}" style="--o:${(a * 0.37) % 3}s"/>`
    }
    html += '</svg>'
    offsets.forEach((ox, copy) => items.forEach(({ ci: i, p, dup }) => {
      const c = cases[i]
      const pic = !!c.cover
      html += `<a href="${href(c)}" draggable="false" class="w3__card${FEATURED.has(c.slug) ? ' is-feat' : ''}${pic ? '' : ' w3__card--empty'}" data-i="${i}" data-service="${c.service}"
        style="left:${p.x + ox}px;top:${p.y}px" ${copy || dup ? 'aria-hidden="true" tabindex="-1"' : `aria-label="${c.brand}: ${c.title}. ${c.stat} ${c.statLabel}"`}>
        ${pic ? `<img src="${BASE}${c.cover}" alt="" loading="lazy" decoding="async" draggable="false">` : `<span class="w3__ph" aria-hidden="true">${icon(SVC_ICON[c.service])}</span>`}
        <span class="w3__pill">${SERVICE_LABEL[c.service]}</span>
        <span class="w3__stat"><b>${c.stat}</b>${c.statLabel}</span>
        <span class="w3__meta"><b>${c.brand}</b><span>${c.title}</span></span>
        <i class="w3__node" aria-hidden="true"></i>
      </a>`
    }))
    track.innerHTML = html
    track.style.width = `${W}px`
    track.style.height = `${H}px`
    cards = [...track.querySelectorAll('.w3__card')]
    paths = [...track.querySelectorAll('.w3__net path')]
    focus = null
    paint()
  }

  // ---- hover: light up a project's network
  function paint() {
    // the network highlight only means something on "All" (a filtered wall is one service)
    const svc = focus !== null && filter === 'all' ? cases[focus].service : null
    track.classList.toggle('is-focus', !!svc)
    const linked = new Set()
    if (focus !== null) {
      linked.add(focus)
      paths.forEach(p => { if (+p.dataset.a === focus || +p.dataset.b === focus) { linked.add(+p.dataset.a); linked.add(+p.dataset.b) } })
    }
    paths.forEach(p => p.classList.toggle('on', !!svc && p.dataset.svc === svc))
    cards.forEach(c => c.classList.toggle('on', !!svc && (linked.has(+c.dataset.i) || c.dataset.service === svc)))
  }
  // Hovering a card only lifts that card (CSS), on every tab. The old "light up the
  // whole category" highlight on All was removed: it restyled every card on each move.

  // how many copies of a set fill the stage (the plane is tilted and scaled on small screens)
  // The track's left edge always stays at least OFF px left of the plane (the tilted view shows
  // a little left of the plane's own edge), so the screen is covered edge to edge at every point
  // in the loop. Copies: just enough to also cover the right edge, as each copy is a full set of cards.
  const OFF = () => 2400 / (matchMedia('(max-width: 900px)').matches ? 0.66 : 1)
  function copiesNeeded() {
    const visible = stage.clientWidth / (matchMedia('(max-width: 900px)').matches ? 0.66 : 1) * 1.8
    return Math.max(2, Math.ceil((setW + OFF() + visible) / setW))
  }

  // ---- filters
  let filter = 'all', swapping = 0
  function setFilter(f, instant) {
    if (f === filter && !instant) return
    filter = f
    chips.forEach(c => { const on = c.dataset.filter === f; c.classList.toggle('is-on', on); c.setAttribute('aria-pressed', on) })
    // the network highlight only exists on "All": say so in the hint
    if (hint) hint.lastChild.textContent = !matchMedia('(hover: hover)').matches ? 'Drag to explore · tap a project to open it' : 'Drag to explore · select a project to open it'
    const swap = () => {
      build(f)
      x = target = 0
      track.style.transform = `translate3d(${x}px, 0, 0)`
      track.classList.remove('is-out')
    }
    clearTimeout(swapping)
    if (instant || reduced) return swap()
    track.classList.add('is-out')
    swapping = setTimeout(swap, 280)
  }
  chips.forEach(chip => chip.addEventListener('click', () => setFilter(chip.dataset.filter)))

  // ---- motion: always drifting right to left; hover slows it, drag / horizontal wheel scrubs
  let x = 0, target = 0, speed = reduced ? 0 : 0.35, hovering = false, down = false, moved = 0, lastX = 0, vel = 0
  stage.addEventListener('pointerenter', () => { hovering = true })
  stage.addEventListener('pointerleave', () => { hovering = false })
  let downCard = null
  stage.addEventListener('pointerdown', e => { down = true; moved = 0; vel = 0; lastX = e.clientX; target = x; downCard = e.target.closest('.w3__card'); stage.classList.add('is-drag') })
  addEventListener('pointermove', e => {
    if (!down) return
    const dx = e.clientX - lastX; lastX = e.clientX; moved += Math.abs(dx); target += dx * 1.4; vel = vel * 0.5 + dx * 1.4 * 0.5
  })
  // release: carry on with a little momentum
  addEventListener('pointerup', () => { if (!down) return; down = false; if (moved > 6) target += vel * 12; stage.classList.remove('is-drag') })
  stage.addEventListener('wheel', e => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) { e.preventDefault(); target -= e.deltaX } }, { passive: false })
  // a wider window may need more copies to keep the loop seamless
  let rsz = 0
  addEventListener('resize', () => { clearTimeout(rsz); rsz = setTimeout(() => { if (copiesNeeded() > copies) build(filter) }, 200) })
  // cards are real links; a drag must not open one
  // A click (not a drag) opens the card it started on, even if the drifting wall
  // moved a different card under the pointer by the time the button came up.
  track.addEventListener('click', e => {
    const c = e.target.closest('.w3__card')
    if (moved > 6) { if (c) e.preventDefault(); return }
    if (downCard && c !== downCard) { e.preventDefault(); const d = downCard; downCard = null; d.click() }
  })
  track.addEventListener('dragstart', e => e.preventDefault())
  // keyboard: keep the focused card on screen
  // only for keyboard focus: a mouse click also focuses the link, and must not move the wall
  track.addEventListener('focusin', e => {
    const c = e.target.closest('.w3__card'); if (!c || !document.documentElement.classList.contains('kbd') || c.tabIndex < 0) return
    target = -(pos.get(focus).x - stage.clientWidth * 0.35)
  })

  let visible = false
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; stage.classList.toggle('is-live', visible) }).observe(stage)
  const tick = () => {
    if (visible) {
      if (!down) target -= hovering ? speed * 0.2 : speed + Math.abs(lenis?.velocity || 0) * 0.15
      x += (target - x) * (down ? 0.5 : 0.08)   // follow the finger/mouse while dragging, glide otherwise
      const tx = ((x % setW) + setW) % setW - setW - OFF()   // always in [-setW - OFF, -OFF)
      track.style.transform = `translate3d(${tx}px, 0, 0)`
    }
    requestAnimationFrame(tick)
  }

  // default: All. On the case studies page, ?s=<service> opens the wall filtered.
  const want = new URLSearchParams(location.search).get('s')
  setFilter(chips.some(c => c.dataset.filter === want) ? want : 'all', true)
  tick()

  // old deep links (#case/<slug>) now have their own pages
  const m = location.hash.match(/^#case\/(.+)$/)
  if (m && caseIndex(m[1]) > -1) location.replace(`${BASE}case-studies/${m[1]}/`)
}
