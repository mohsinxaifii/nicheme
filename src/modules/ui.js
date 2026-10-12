import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { groups } from '../data/services.js'
import { icon } from '../data/icons.js'

const $ = (s, r = document) => r.querySelector(s)
const $$ = (s, r = document) => [...r.querySelectorAll(s)]

// ---------------------------------------------------------------- toast
let toastTimer
export function toast(msg) {
  const t = $('[data-toast-el]')
  t.textContent = msg
  t.classList.add('is-on')
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => t.classList.remove('is-on'), 3200)
}

// ---------------------------------------------------------------- nav
export function initNav({ lenis }) {
  const nav = $('[data-nav]')
  const hero = $('.hero')
  let lastY = 0
  const onScroll = y => {
    nav.classList.toggle('is-solid', y > hero.offsetHeight - 80)
    nav.classList.toggle('is-hidden', y > lastY && y > 400 && !document.body.classList.contains('menu-open'))
    lastY = y
  }
  lenis ? lenis.on('scroll', e => onScroll(e.scroll)) : addEventListener('scroll', () => onScroll(scrollY))

  const burger = $('[data-burger]'), menu = $('[data-menu]')
  const setMenu = on => {
    menu.hidden = !on
    burger.setAttribute('aria-expanded', on)
    document.body.classList.toggle('menu-open', on)
    on ? lenis?.stop() : lenis?.start()
  }
  burger.addEventListener('click', () => setMenu(menu.hidden))
  menu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false) })
  $$('[data-toast]').forEach(b => b.addEventListener('click', () => toast(b.dataset.toast)))
}

// ---------------------------------------------------------------- anchors via lenis
export function initAnchors({ lenis }) {
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]')
    if (!a || e.defaultPrevented) return
    const id = a.getAttribute('href')
    if (id.length < 2 || id.startsWith('#case/')) return
    const el = document.querySelector(id)
    if (!el) return
    e.preventDefault()
    lenis ? lenis.scrollTo(el, { duration: 1.2 }) : el.scrollIntoView({ behavior: 'smooth' })
    history.replaceState(null, '', id)
  })
}

// ---------------------------------------------------------------- hero intro
export function initHeroIntro({ reduced }) {
  if (reduced) return
  gsap.from('.hero__title .line > span', { yPercent: 105, duration: 1.2, ease: 'expo.out', stagger: 0.08, delay: 0.1 })
  gsap.from(['.kicker', '.hero__sub', '.hero__ctas'], { opacity: 0, y: 16, duration: 1, ease: 'power3.out', stagger: 0.08, delay: 0.4 })
  gsap.from('.hero__globe', { opacity: 0, duration: 1.6, ease: 'power2.out' })
  gsap.from('.hero__badge', { scale: 0, rotate: -90, duration: 1, ease: 'back.out(1.6)', delay: 0.9, transformOrigin: 'center' })
}

// ---------------------------------------------------------------- counters
export function initCounters({ reduced }) {
  if (reduced) return
  $$('[data-count]').forEach(el => {
    const end = +el.dataset.count, suf = el.dataset.suffix || ''
    const fmt = n => Math.round(n).toLocaleString('en-US') + suf
    const o = { v: 0 }
    el.textContent = fmt(0)
    ScrollTrigger.create({
      trigger: el, start: 'top 90%', once: true,
      onEnter: () => gsap.to(o, { v: end, duration: 1.6, ease: 'power3.out', onUpdate: () => { el.textContent = fmt(o.v) } }),
    })
  })
}

// ---------------------------------------------------------------- services explorer
// Four group tabs, a numbered list and one large panel per service. The list
// auto-advances with a progress bar while in view (pauses on hover, stops on click).
const SVC_ICONS = ['audit', 'mystery', 'research', 'reporting', 'merch', 'ambassador', 'install', 'promo', 'sampling', 'events', 'production', 'logistics', 'digital', 'vehicle']
const GROUP_ICONS = ['dashboard', 'users', 'promo', 'factory']
const SVC_FILTER = ['audits', 'mystery', 'audits', 'audits', 'merch', 'activation', 'install', 'activation', 'activation', 'activation', 'production', 'install', null, null]
const DWELL = 7000

export function initServices({ lenis, reduced }) {
  const root = $('[data-services]')
  if (!root) return
  const BASE = import.meta.env.BASE_URL
  let k = 0
  const all = groups.flatMap((g, gi) => g.services.map(s => ({ ...s, gi, n: k, icon: SVC_ICONS[k], filter: SVC_FILTER[k++] })))

  root.innerHTML = `
    <div class="svx__tabs" role="tablist" aria-label="Service groups">
      ${groups.map((g, gi) => `<button class="svx__tab" role="tab" type="button" data-g="${gi}">
        ${icon(GROUP_ICONS[gi], 'ico svx__tab-ico')}
        <span><b>${g.name}</b><small>${g.intro}</small></span>
        <em>${String(g.services.length).padStart(2, '0')}</em>
      </button>`).join('')}
    </div>
    <div class="svx__body">
      <ol class="svx__list" data-list></ol>
      <article class="svx__panel" data-panel aria-live="polite"></article>
    </div>`

  const tabs = $$('.svx__tab', root), list = $('[data-list]', root), panel = $('[data-panel]', root)
  let group = 0, active = 0, timer = 0, started = 0, auto = !reduced, paused = false, inView = false, raf = 0

  function renderList() {
    tabs.forEach((t, i) => { t.classList.toggle('is-on', i === group); t.setAttribute('aria-selected', i === group) })
    const items = all.filter(s => s.gi === group)
    list.innerHTML = items.map((s, i) => `<li><button type="button" data-n="${s.n}">
      <span class="svx__num">${String(i + 1).padStart(2, '0')}</span>
      ${icon(s.icon)}
      <span class="svx__name">${s.name}</span>
      <i class="svx__bar"><i></i></i>
    </button></li>`).join('')
  }

  function renderPanel(n) {
    const s = all[n]
    active = n
    $$('button', list).forEach(b => b.classList.toggle('is-on', +b.dataset.n === n))
    const media = s.photo
      ? `<img src="${BASE}work/${s.photo}" alt="${s.name} by Niche" loading="lazy">`
      : `<div class="svx__art">${icon(s.icon)}</div>`
    panel.innerHTML = `
      <div class="svx__media">
        ${media}
        ${s.proof ? `<div class="svx__proof"><b data-to="${s.proof[0]}">${s.proof[0]}</b><span>${s.proof[1]}</span></div>` : ''}
      </div>
      <div class="svx__copy">
        <p class="svx__kicker">${icon(s.icon)}${groups[s.gi].name}</p>
        <h3>${s.name}</h3>
        <p class="svx__line">${s.line}</p>
        <p class="svx__text">${s.body}</p>
        <h4>What's included</h4>
        <ul class="svx__inc">${s.included.map(x => `<li>${icon('check')}<span>${x}</span></li>`).join('')}</ul>
        <div class="svx__cta">
          <a class="btn btn--red" href="#contact" data-svc-quote="${s.name}">Get a proposal ${icon('arrow')}</a>
          ${s.filter ? `<a class="svx__link" href="#work" data-filter-to="${s.filter}">See related work ${icon('arrow')}</a>` : ''}
          ${s.link ? `<a class="svx__link" href="${s.link}" target="_blank" rel="noopener">Visit Connexis ${icon('arrow')}</a>` : ''}
        </div>
      </div>`
    if (reduced) return
    // entrance: photo wipes in, proof counts up, checklist ticks one by one
    gsap.fromTo($('.svx__media', panel), { clipPath: 'inset(0 0 0 100%)' }, { clipPath: 'inset(0 0 0 0%)', duration: 0.9, ease: 'expo.out' })
    gsap.fromTo($('.svx__media img, .svx__art', panel), { scale: 1.15 }, { scale: 1, duration: 1.6, ease: 'expo.out' })
    gsap.from($$('.svx__kicker, .svx__copy h3, .svx__line, .svx__text', panel), { y: 18, opacity: 0, duration: 0.6, stagger: 0.06, ease: 'power3.out' })
    gsap.from($$('.svx__inc li', panel), { x: -14, opacity: 0, duration: 0.45, stagger: 0.07, delay: 0.25, ease: 'power3.out' })
    gsap.from($$('.svx__inc .ico', panel), { scale: 0, duration: 0.4, stagger: 0.07, delay: 0.35, ease: 'back.out(3)' })
    const b = $('.svx__proof b', panel)
    if (b) {
      gsap.from($('.svx__proof', panel), { y: 30, opacity: 0, duration: 0.7, delay: 0.3, ease: 'power3.out' })
      const m = b.dataset.to.match(/^([\d,]+)(.*)$/)
      if (m) {
        const end = +m[1].replace(/,/g, ''), suf = m[2], o = { v: 0 }
        gsap.to(o, { v: end, duration: 1.4, delay: 0.3, ease: 'power3.out', onUpdate: () => { b.textContent = Math.round(o.v).toLocaleString('en-US') + suf } })
      }
    }
  }

  function select(n, fromUser) {
    if (fromUser) auto = false
    const s = all[n]
    if (s.gi !== group) { group = s.gi; renderList() }
    renderPanel(n)
    started = performance.now()
  }

  // auto-advance with a progress bar
  function tick(now) {
    const bar = $('.svx__list button.is-on .svx__bar i', root)
    if (auto && inView && !paused) {
      const p = Math.min(1, (now - started) / DWELL)
      if (bar) bar.style.transform = `scaleX(${p})`
      if (p >= 1) select((active + 1) % all.length, false)
    } else if (!auto && bar) bar.style.transform = 'scaleX(1)'
    else if (paused) started = now - (parseFloat(bar?.style.transform.slice(7)) || 0) * DWELL
    raf = requestAnimationFrame(tick)
  }
  new IntersectionObserver(([e]) => { inView = e.isIntersecting; if (inView) started = performance.now() }, { threshold: 0.35 }).observe(root)
  root.addEventListener('pointerenter', () => { paused = true })
  root.addEventListener('pointerleave', () => { paused = false })
  root.addEventListener('focusin', () => { paused = true })

  root.addEventListener('click', e => {
    const tab = e.target.closest('.svx__tab')
    if (tab) { const first = all.find(s => s.gi === +tab.dataset.g); select(first.n, true); return }
    const item = e.target.closest('[data-n]')
    if (item) { select(+item.dataset.n, true); return }
    const q = e.target.closest('[data-svc-quote]')
    if (q) { const sel = $('[data-service-select]'); if (sel) sel.value = q.dataset.svcQuote }
    const f = e.target.closest('[data-filter-to]')
    if (f) document.querySelector(`[data-filter="${f.dataset.filterTo}"]`)?.click()
  })
  // arrow keys move through the list
  list.addEventListener('keydown', e => {
    if (!['ArrowDown', 'ArrowUp'].includes(e.key)) return
    e.preventDefault()
    const btns = $$('button', list), i = btns.findIndex(b => b.classList.contains('is-on'))
    const nb = btns[(i + (e.key === 'ArrowDown' ? 1 : -1) + btns.length) % btns.length]
    nb.focus(); select(+nb.dataset.n, true)
  })

  renderList()
  renderPanel(0)
  started = performance.now()
  if (!reduced) raf = requestAnimationFrame(tick)

  const select$ = $('[data-service-select]')
  if (select$) select$.insertAdjacentHTML('beforeend', all.map(s => `<option>${s.name}</option>`).join(''))
}

// ---------------------------------------------------------------- client logos
const LOGOS = [
  ['red-bull', 'Red Bull'], ['unilever', 'Unilever'], ['reckitt', 'Reckitt Benckiser'], ['mars', 'Mars'], ['nestle', 'Nestlé'],
  ['electrolux', 'Electrolux'], ['iffco', 'IFFCO'], ['kraft-heinz', 'Kraft Heinz'], ['general-mills', 'General Mills'],
  ['bosch', 'Bosch'], ['nahdi', 'Nahdi'], ['panda', 'Panda'], ['american-garden', 'American Garden'], ['othaim', 'Othaim Markets'],
  ['extra', 'eXtra'], ['pg', 'P&G'], ['loreal', "L'Oréal"],
  ['du', 'du'], ['intel', 'Intel'], ['hp', 'HP'], ['nissan', 'Nissan'], ['pfizer', 'Pfizer'], ['dabur', 'Dabur'], ['ferrero', 'Ferrero'],
  ['perfetti-van-melle', 'Perfetti Van Melle'], ['colgate-palmolive', 'Colgate-Palmolive'], ['clorox', 'Clorox'], ['zain', 'Zain'],
  ['marico', 'Marico'], ['selpak', 'Selpak'], ['munchbox', 'Munchbox'], ['perfetto', 'Perfetto'], ['alcatel', 'Alcatel'], ['grey', 'Grey'], ['bic', 'BIC'],
]
export function initLogos({ reduced }) {
  const root = $('[data-logos]')
  if (!root) return
  const half = Math.ceil(LOGOS.length / 2)
  const row = list => `<div class="logos__row">${list.map(([f, n]) => `<img src="${import.meta.env.BASE_URL}logos/${f}.webp" alt="${n} logo" loading="lazy" height="60">`).join('')}</div>`
  root.innerHTML = [LOGOS.slice(0, half), LOGOS.slice(half)].map(l => `<div class="logos__track">${row(l)}${row(l).replace('class="logos__row"', 'class="logos__row" aria-hidden="true"')}</div>`).join('')
  if (reduced) return
  const tracks = $$('.logos__track', root).map((t, i) => ({ t, x: i ? -t.firstElementChild.offsetWidth : 0, dir: i ? 1 : -1, paused: false }))
  tracks.forEach(s => {
    s.t.addEventListener('pointerenter', () => { s.paused = true })
    s.t.addEventListener('pointerleave', () => { s.paused = false })
  })
  const loop = () => {
    tracks.forEach(s => {
      const w = s.t.firstElementChild.offsetWidth
      if (!s.paused && w) s.x += s.dir * 0.45
      if (s.x <= -w) s.x += w
      if (s.x > 0) s.x -= w
      s.t.style.transform = `translate3d(${s.x}px,0,0)`
    })
    requestAnimationFrame(loop)
  }
  loop()
}

// ---------------------------------------------------------------- reveals
export function initReveals({ reduced }) {
  if (reduced) return
  $$('.section-head, .proof__grid, .bt, .svx__tabs, .steps li, .reporting__grid > *, .why__grid article, .regions > div, .ind li, .group__list li, .form').forEach(el => {
    gsap.from(el, { y: 30, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' } })
  })
}

// ---------------------------------------------------------------- form
export function initForm() {
  const form = $('[data-form]')
  if (!form) return
  form.addEventListener('submit', e => {
    e.preventDefault()
    let ok = true
    $$('[required]', form).forEach(i => {
      const bad = !i.value.trim() || (i.type === 'email' && !/^\S+@\S+\.\S+$/.test(i.value))
      i.closest('.field').classList.toggle('is-bad', bad)
      if (bad) ok = false
    })
    if (!ok) { toast('Please add your name, company and work email.'); form.querySelector('.is-bad input')?.focus(); return }
    const fd = new FormData(form)
    const body = `Name: ${fd.get('name')}\nCompany: ${fd.get('company')}\nEmail: ${fd.get('email')}\nPhone: ${fd.get('phone')}\nService: ${fd.get('service') || 'Not specified'}\nMarkets: ${fd.get('markets') || 'Not specified'}\n\n${fd.get('message')}`
    toast('Thank you. Opening your email app to send the brief.')
    // TODO: swap for the real endpoint (CRM / email service) before launch.
    setTimeout(() => { location.href = `mailto:info@nicheme.com?subject=${encodeURIComponent(`Brief: ${fd.get('service') || 'New enquiry'}`)}&body=${encodeURIComponent(body)}` }, 700)
  })
}

// ---------------------------------------------------------------- steps progress line
export function initSteps({ reduced }) {
  const fill = $('[data-steps-fill]'), steps = $$('.steps li')
  if (!fill) return
  if (reduced) { fill.style.transform = 'none'; steps.forEach(s => s.classList.add('is-on')); return }
  ScrollTrigger.create({
    trigger: '.steps', start: 'top 80%', end: 'bottom 55%', scrub: 0.5,
    onUpdate: st => {
      fill.style.transform = `scaleX(${st.progress})`
      steps.forEach((s, i) => s.classList.toggle('is-on', st.progress >= i / steps.length + 0.02))
    },
  })
}

// ---------------------------------------------------------------- nav: highlight current section
export function initActiveNav() {
  const links = $$('.nav__links a')
  const map = new Map(links.map(a => [a.getAttribute('href').slice(1), a]))
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    const a = map.get(e.target.id)
    if (a && e.isIntersecting) { links.forEach(l => l.classList.remove('is-active')); a.classList.add('is-active') }
  }), { rootMargin: '-45% 0px -50% 0px' })
  map.forEach((_, id) => { const el = document.getElementById(id); if (el) io.observe(el) })
}

// ---------------------------------------------------------------- bento stats
export function initBento({ reduced }) {
  const people = $('[data-people]')
  if (people) people.innerHTML = '<i></i>'.repeat(250)
  const dots = people ? [...people.children] : []
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return
    e.target.classList.add('is-in')
    io.unobserve(e.target)
    if (e.target.classList.contains('bt--people')) {
      if (reduced) { dots.forEach(d => d.classList.add('on')); return }
      let k = 0
      const t = setInterval(() => { for (let n = 0; n < 8 && k < dots.length; n++) dots[k++].classList.add('on'); if (k >= dots.length) clearInterval(t) }, 30)
    }
  }), { threshold: 0.35 })
  $$('.bt').forEach(b => io.observe(b))
}
