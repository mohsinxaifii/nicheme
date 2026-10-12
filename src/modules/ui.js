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

// ---------------------------------------------------------------- services: card grid + drawer
// All 14 services at a glance (icon, name, one line, proof). Hover fades in the
// photo; click opens a drawer with the full description and what's included.
const SVC_ICONS = ['audit', 'mystery', 'research', 'reporting', 'merch', 'ambassador', 'install', 'promo', 'sampling', 'events', 'production', 'logistics', 'digital', 'vehicle']
const SVC_FILTER = ['audits', 'mystery', 'audits', 'audits', 'merch', 'activation', 'install', 'activation', 'activation', 'activation', 'production', 'install', null, null]

export function initServices({ lenis }) {
  const root = $('[data-services]')
  if (!root) return
  const BASE = import.meta.env.BASE_URL
  let k = 0
  const all = groups.flatMap((g, gi) => g.services.map(s => ({ ...s, gi, n: k, icon: SVC_ICONS[k], filter: SVC_FILTER[k++] })))

  root.innerHTML = groups.map((g, gi) => `
    <div class="sg">
      <div class="sg__head"><h3>${g.name}</h3><p>${g.intro}</p></div>
      <ul class="sg__cards">${all.filter(s => s.gi === gi).map(s => `
        <li><button class="sc" type="button" data-n="${s.n}" aria-haspopup="dialog">
          ${s.photo ? `<img class="sc__img" src="${BASE}work/${s.photo}" alt="" loading="lazy">` : ''}
          <span class="sc__top">${icon(s.icon, 'ico sc__ico')}${icon('arrow', 'ico sc__arrow')}</span>
          <span class="sc__name">${s.name}</span>
          <span class="sc__line">${s.line}</span>
          <span class="sc__proof">${s.proof ? `<b>${s.proof[0]}</b><small>${s.proof[1]}</small>` : `<small>${s.link ? 'Through Connexis, part of the Niche Group' : 'Supports what happens in store'}</small>`}</span>
        </button></li>`).join('')}
      </ul>
    </div>`).join('')

  // ---- drawer
  const drawer = document.createElement('div')
  drawer.className = 'drawer'
  drawer.hidden = true
  drawer.innerHTML = `<div class="drawer__backdrop" data-x></div>
    <aside class="drawer__panel" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
      <button class="drawer__close" type="button" data-x aria-label="Close">✕</button>
      <div class="drawer__body" data-body></div>
      <div class="drawer__nav"><button type="button" data-step="-1">← Previous</button><span data-count></span><button type="button" data-step="1">Next →</button></div>
    </aside>`
  document.body.appendChild(drawer)
  const panel = $('.drawer__panel', drawer), body = $('[data-body]', drawer)
  let cur = 0, opener = null

  function fill(n) {
    cur = (n + all.length) % all.length
    const s = all[cur]
    body.innerHTML = `
      <div class="drawer__media">${s.photo ? `<img src="${BASE}work/${s.photo}" alt="${s.name} by Niche">` : `<div class="drawer__art">${icon(s.icon)}</div>`}
        ${s.proof ? `<p class="drawer__proof"><b>${s.proof[0]}</b>${s.proof[1]}</p>` : ''}</div>
      <p class="drawer__kicker">${icon(s.icon)}${groups[s.gi].name}</p>
      <h3 id="drawer-title">${s.name}</h3>
      <p class="drawer__line">${s.line}</p>
      <p class="drawer__text">${s.body}</p>
      <h4>What's included</h4>
      <ul class="drawer__inc">${s.included.map(x => `<li>${icon('check')}${x}</li>`).join('')}</ul>
      <div class="drawer__cta">
        <a class="btn btn--red" href="#contact" data-quote="${s.name}">Get a proposal ${icon('arrow')}</a>
        ${s.filter ? `<a class="drawer__link" href="#work" data-filter-to="${s.filter}">See related work</a>` : ''}
        ${s.link ? `<a class="drawer__link" href="${s.link}" target="_blank" rel="noopener">Visit Connexis</a>` : ''}
      </div>`
    $('[data-count]', drawer).textContent = `${cur + 1} / ${all.length}`
    panel.scrollTop = 0
    gsap.from($$('.drawer__body > *', drawer), { y: 16, opacity: 0, duration: 0.5, stagger: 0.04, ease: 'power3.out' })
  }
  function open(n, from) {
    opener = from
    fill(n)
    drawer.hidden = false
    lenis?.stop()
    document.documentElement.style.overflow = 'hidden'
    panel.animate([{ transform: 'translateX(100%)' }, { transform: 'none' }], { duration: 500, easing: 'cubic-bezier(.2,.7,.1,1)' })
    $('.drawer__close', drawer).focus()
  }
  function close() {
    if (drawer.hidden) return
    panel.animate([{ transform: 'none' }, { transform: 'translateX(100%)' }], { duration: 300, easing: 'ease-in' }).onfinish = () => { drawer.hidden = true }
    lenis?.start()
    document.documentElement.style.overflow = ''
    opener?.focus({ preventScroll: true })
  }

  root.addEventListener('click', e => { const c = e.target.closest('.sc'); if (c) open(+c.dataset.n, c) })
  drawer.addEventListener('click', e => {
    if (e.target.closest('[data-x]')) close()
    const st = e.target.closest('[data-step]'); if (st) fill(cur + +st.dataset.step)
    const q = e.target.closest('[data-quote]')
    if (q) { const sel = $('[data-service-select]'); if (sel) sel.value = q.dataset.quote; close() }
    const f = e.target.closest('[data-filter-to]')
    if (f) { close(); document.querySelector(`[data-filter="${f.dataset.filterTo}"]`)?.click() }
  })
  document.addEventListener('keydown', e => {
    if (drawer.hidden) return
    if (e.key === 'Escape') close()
    if (e.key === 'ArrowRight') fill(cur + 1)
    if (e.key === 'ArrowLeft') fill(cur - 1)
    if (e.key === 'Tab') {
      const f = $$('button, a[href]', panel), a = f[0], z = f[f.length - 1]
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus() }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus() }
    }
  })

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
  $$('.section-head, .proof__grid, .bt, .sg, .steps li, .reporting__grid > *, .why__grid article, .regions > div, .ind li, .group__list li, .form').forEach(el => {
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
// Countries: a mini MENA map that lights each network country in turn with its
// English and Arabic name. People: a crowd of figures that steps in row by row.
const COUNTRY_NAMES = [
  ['784', 'United Arab Emirates', 'الإمارات'], ['682', 'Saudi Arabia', 'السعودية'], ['634', 'Qatar', 'قطر'],
  ['414', 'Kuwait', 'الكويت'], ['512', 'Oman', 'عُمان'], ['048', 'Bahrain', 'البحرين'], ['400', 'Jordan', 'الأردن'],
  ['422', 'Lebanon', 'لبنان'], ['760', 'Syria', 'سوريا'], ['368', 'Iraq', 'العراق'], ['818', 'Egypt', 'مصر'],
  ['504', 'Morocco', 'المغرب'], ['788', 'Tunisia', 'تونس'], ['012', 'Algeria', 'الجزائر'], ['887', 'Yemen', 'اليمن'],
  ['586', 'Pakistan', 'باكستان'], ['480', 'Mauritius', 'موريشيوس'],
]
const PERSON = '<path d="M12 11.2a4.1 4.1 0 1 0 0-8.2 4.1 4.1 0 0 0 0 8.2zM3.5 24c0-5.2 3.8-9.4 8.5-9.4s8.5 4.2 8.5 9.4z"/>'

export async function initBento({ reduced }) {
  // crowd: 3 rows, back rows smaller and dimmer
  const crowd = $('[data-crowd]')
  if (crowd) {
    const rows = [[7, .72, .3], [7, .86, .55], [6, 1, 1]]
    crowd.innerHTML = rows.map(([n, sc, op], r) => `<div class="crowd__row" style="--s:${sc};--o:${op}">${Array.from({ length: n }, (_, i) =>
      `<svg viewBox="0 0 24 24" class="${r === 2 && i === 2 ? 'is-red' : ''}" style="--d:${(r * 0.18 + i * 0.04).toFixed(2)}s">${PERSON}</svg>`).join('')}</div>`).join('')
  }

  // countries: mini map + cycling names
  const cmap = $('[data-cmap]'), cname = $('[data-cname]')
  let order = []
  if (cmap) {
    const { COUNTRIES, CITIES } = await import('../data/mena.js')
    const x0 = 40, y0 = 30, w = 880, h = 330                 // crop: Morocco to Pakistan
    cmap.innerHTML = `<svg viewBox="${x0} ${y0} ${w} ${h}">${COUNTRIES.map(c => `<path d="${c.d}" ${c.net ? `class="net" data-id="${c.id}"` : ''}/>`).join('')}
      <circle cx="${CITIES.portlouis[0]}" cy="${CITIES.portlouis[1]}" r="9" class="net dot" data-id="480"/>
      <circle cx="${CITIES.manama[0]}" cy="${CITIES.manama[1]}" r="6" class="net dot" data-id="048"/></svg>`
    order = COUNTRY_NAMES.map(([id, en, ar]) => ({ en, ar, els: $$(`[data-id="${id}"]`, cmap) }))
  }
  let ci = 0, cycle = 0
  const step = () => {
    if (!order.length) return
    order.forEach(o => o.els.forEach(e => e.classList.remove('is-on')))
    const o = order[ci++ % order.length]
    o.els.forEach(e => e.classList.add('is-on'))
    cname.innerHTML = `<b>${o.en}</b><span lang="ar" dir="rtl">${o.ar}</span>`
    if (!reduced) cname.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 350, easing: 'cubic-bezier(.2,.7,.1,1)' })
  }

  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.target.classList.contains('bt--countries')) {
      clearInterval(cycle)
      if (e.isIntersecting) { step(); if (!reduced) cycle = setInterval(step, 1700) }
    }
    if (e.isIntersecting) e.target.classList.add('is-in')
  }), { threshold: 0.35 })
  $$('.bt').forEach(b => io.observe(b))
}
