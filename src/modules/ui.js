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
  const hero = $('.hero, .phero')
  let lastY = 0
  const onScroll = y => {
    nav.classList.toggle('is-solid', y > (hero ? hero.offsetHeight - 80 : 40))
    nav.classList.toggle('is-hidden', y > lastY && y > 400 && !document.body.classList.contains('menu-open') && !nav.classList.contains('is-open'))
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

// service icons in the order of src/data/services.js (used by the brief builder)
const SVC_ICONS = ['audit', 'mystery', 'research', 'reporting', 'merch', 'ambassador', 'install', 'promo', 'sampling', 'events', 'production', 'logistics', 'digital', 'vehicle']

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
  $$('.section-head, .proof__grid, .bt, .sg, .steps li, .reporting__grid > *, .why__grid article, .net__facts, .acc, .gcards li, .orbit, .brief, .srow, .inc__grid li, .cgrid li, .story__steps > li, .story__side, .faq details, .pn, .more__chips, .milestones li, .masonry a').forEach(el => {
    gsap.from(el, { y: 30, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' } })
  })
}

// ---------------------------------------------------------------- contact: brief builder
const SHORT = ['Retail audits', 'Mystery shopping', 'Market research', 'Real-time reporting', 'Merchandising', 'Brand ambassadors', 'Fixtures & installation', 'Promotions & activations', 'Product sampling', 'Events & roadshows', 'Production & POSM', 'Logistics', 'Digital marketing', 'Vehicle tracking']
const GCC = ['784', '682', '634', '414', '512', '048']
const NAMES = Object.fromEntries(COUNTRY_LIST().map(([id, en]) => [id, en]))
function COUNTRY_LIST() {
  return [['784', 'UAE'], ['682', 'KSA'], ['634', 'Qatar'], ['414', 'Kuwait'], ['512', 'Oman'], ['048', 'Bahrain'], ['400', 'Jordan'], ['422', 'Lebanon'], ['760', 'Syria'], ['368', 'Iraq'], ['818', 'Egypt'], ['504', 'Morocco'], ['788', 'Tunisia'], ['012', 'Algeria'], ['887', 'Yemen'], ['586', 'Pakistan'], ['480', 'Mauritius']]
}
const listText = a => a.length < 2 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`

export async function initForm({ reduced } = {}) {
  const form = $('[data-form]')
  if (!form) return
  const full = groups.flatMap(g => g.services.map(s => s.name))
  const icons = SVC_ICONS
  const svcPicked = new Set(), where = new Set()

  // 1. service chips
  const chipsEl = $('[data-svc-chips]', form)
  chipsEl.innerHTML = SHORT.map((n, i) => `<button type="button" class="chip2" data-svc="${i}" aria-pressed="false">${icon(icons[i])}${n}</button>`).join('')
  const setSvc = (i, on) => {
    on ? svcPicked.add(i) : svcPicked.delete(i)
    const b = chipsEl.querySelector(`[data-svc="${i}"]`)
    b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on)
    update()
  }
  chipsEl.addEventListener('click', e => { const b = e.target.closest('[data-svc]'); if (b) setSvc(+b.dataset.svc, !svcPicked.has(+b.dataset.svc)) })
  addEventListener('niche:service', e => { const i = full.indexOf(e.detail); if (i > -1) setSvc(i, true) })

  // 2. map picker
  const pick = $('[data-pick]', form)
  const { COUNTRIES, CITIES } = await import('../data/mena.js')
  pick.innerHTML = `<svg viewBox="40 30 880 330">${COUNTRIES.map(c => c.net
      ? `<path d="${c.d}" class="net" data-id="${c.id}"><title>${NAMES[c.id]}</title></path>`
      : `<path d="${c.d}"/>`).join('')}
    <circle cx="${CITIES.manama[0]}" cy="${CITIES.manama[1]}" r="7" class="net dot" data-id="048"><title>Bahrain</title></circle>
    <circle cx="${CITIES.portlouis[0]}" cy="${CITIES.portlouis[1] - 0}" r="9" class="net dot" data-id="480"><title>Mauritius</title></circle></svg>
    <span class="pick__tip" data-pick-tip></span>`
  const tip = $('[data-pick-tip]', pick)
  const paint = () => $$('.net', pick).forEach(p => p.classList.toggle('is-on', where.has(p.dataset.id)))
  const toggle = id => { where.has(id) ? where.delete(id) : where.add(id); paint(); update() }
  pick.addEventListener('click', e => { const p = e.target.closest('.net'); if (p) toggle(p.dataset.id) })
  pick.addEventListener('pointermove', e => {
    const p = e.target.closest('.net'), r = pick.getBoundingClientRect()
    tip.textContent = p ? NAMES[p.dataset.id] : ''
    tip.classList.toggle('is-on', !!p)
    tip.style.transform = `translate(${e.clientX - r.left + 12}px, ${e.clientY - r.top - 30}px)`
  })
  pick.addEventListener('pointerleave', () => tip.classList.remove('is-on'))
  $$('[data-quick]', form).forEach(b => b.addEventListener('click', () => {
    where.clear()
    if (b.dataset.quick === 'gcc') GCC.forEach(id => where.add(id))
    if (b.dataset.quick === 'all') COUNTRY_LIST().forEach(([id]) => where.add(id))
    paint(); update()
  }))

  // summary + progress
  const sum = $('[data-sum]', form), list = $('[data-pick-list]', form)
  const bars = $$('[data-step-bar]', form)
  function update() {
    const svcs = [...svcPicked].sort((a, b) => a - b).map(i => SHORT[i])
    const places = COUNTRY_LIST().filter(([id]) => where.has(id)).map(([, n]) => n)
    list.textContent = places.length ? (places.length === 17 ? 'All 17 countries' : listText(places)) : 'No countries yet'
    const svcTxt = svcs.length ? listText(svcs).toLowerCase().replace(/^./, c => c.toUpperCase()) : 'Field marketing'
    sum.innerHTML = svcs.length || places.length
      ? `<b>${svcTxt}</b> in <b>${places.length ? (places.length === 17 ? 'all 17 countries' : listText(places)) : 'your markets'}</b>.`
      : 'Pick a service and a country to start your brief.'
    const who = ['name', 'company', 'email'].every(n => form.elements[n].value.trim())
    ;[svcs.length > 0, places.length > 0, who].forEach((ok, i) => bars[i].classList.toggle('is-on', ok))
  }
  form.addEventListener('input', update)
  // ?service=<slug> from service and case pages pre-selects a chip
  const want = new URLSearchParams(location.search).get('service')
  if (want) {
    const { allServices } = await import('../data/services.js')
    const hit = allServices().find(x => x.slug === want)
    if (hit) setSvc(full.indexOf(hit.name), true)
  }

  // rotating word in the headline
  const rot = $('[data-rot]')
  if (rot && !reduced) {
    const words = ['shelves.', 'showrooms.', 'promoters.', 'stores.', 'brand.']
    let k = 0
    setInterval(() => {
      const old = rot.firstElementChild, nw = document.createElement('span')
      nw.textContent = words[++k % words.length]
      rot.appendChild(nw)
      old.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateY(-100%)', opacity: 0 }], { duration: 500, easing: 'cubic-bezier(.6,0,.2,1)' }).onfinish = () => old.remove()
      nw.animate([{ transform: 'translateY(100%)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 500, easing: 'cubic-bezier(.6,0,.2,1)' })
    }, 2200)
  }

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
    const svcs = [...svcPicked].map(i => full[i]).join(', ') || 'Not specified'
    const places = COUNTRY_LIST().filter(([id]) => where.has(id)).map(([, n]) => n).join(', ') || 'Not specified'
    const body = `Name: ${fd.get('name')}\nCompany: ${fd.get('company')}\nEmail: ${fd.get('email')}\nPhone: ${fd.get('phone')}\nServices: ${svcs}\nCountries: ${places}\n\n${fd.get('message')}`
    toast('Thank you. Opening your email app to send the brief.')
    const done = $('[data-done]', form)
    if (done) { done.hidden = false; done.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 400 }) }
    // TODO: swap for the real endpoint (CRM / email service) before launch.
    setTimeout(() => { location.href = `mailto:info@nicheme.com?subject=${encodeURIComponent(`Brief: ${svcs}`)}&body=${encodeURIComponent(body)}` }, 700)
  })
  update()
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

// ---------------------------------------------------------------- nav: current page + mega menus
// Menus open on hover (with a short grace period so the pointer can travel),
// on focus for keyboard users, and on tap for touch screens.
export function initActiveNav() {
  const page = document.body.dataset.page
  const key = { services: 'services', service: 'services', cases: 'case-studies', case: 'case-studies', about: 'about', contact: 'contact' }[page]
  if (key) $(`[data-nav-key="${key}"]`)?.classList.add('is-active')

  const nav = $('[data-nav]')
  const items = $$('[data-item]')
  let timer = 0
  const open = item => {
    clearTimeout(timer)
    items.forEach(i => i.classList.toggle('is-open', i === item))
    nav.classList.toggle('is-open', !!item)
  }
  const closeSoon = () => { clearTimeout(timer); timer = setTimeout(() => open(null), 180) }
  items.forEach(item => {
    item.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') open(item) })
    item.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') closeSoon() })
    item.addEventListener('focusin', () => open(item))
    item.addEventListener('focusout', e => { if (!item.contains(e.relatedTarget)) closeSoon() })
    // touch: first tap opens the menu, second tap follows the link
    item.querySelector('.nav__top').addEventListener('click', e => {
      if (matchMedia('(hover: none)').matches && !item.classList.contains('is-open')) { e.preventDefault(); open(item) }
    })
  })
  addEventListener('keydown', e => { if (e.key === 'Escape') open(null) })

  // services mega menu: preview follows the hovered service
  const mega = $('[data-mega]')
  if (mega) {
    const im = $('[data-mega-img]'), nm = $('[data-mega-name]'), ln = $('[data-mega-line]')
    mega.addEventListener('pointerover', e => {
      const a = e.target.closest('a[data-name]')
      if (!a || nm.textContent === a.dataset.name) return
      nm.textContent = a.dataset.name; ln.textContent = a.dataset.line
      if (a.dataset.prev) { im.src = a.dataset.prev; im.parentElement.classList.remove('is-empty') } else im.parentElement.classList.add('is-empty')
      im.animate([{ opacity: 0, transform: 'scale(1.06)' }, { opacity: 1, transform: 'none' }], { duration: 400, easing: 'cubic-bezier(.2,.7,.1,1)' })
    })
  }
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

// ---------------------------------------------------------------- network board
// 17 tiles grouped by region: each shows the country's own outline, its name in
// English and Arabic, and a live local clock.
const REGIONS = [
  ['GCC', [['784', 'United Arab Emirates', 'الإمارات', 'Asia/Dubai', 'Dubai · HQ'], ['682', 'Saudi Arabia', 'السعودية', 'Asia/Riyadh', 'Riyadh'], ['634', 'Qatar', 'قطر', 'Asia/Qatar', 'Doha'], ['414', 'Kuwait', 'الكويت', 'Asia/Kuwait', 'Kuwait City'], ['512', 'Oman', 'عُمان', 'Asia/Muscat', 'Muscat'], ['048', 'Bahrain', 'البحرين', 'Asia/Bahrain', 'Manama']]],
  ['Levant & Iraq', [['400', 'Jordan', 'الأردن', 'Asia/Amman', 'Amman'], ['422', 'Lebanon', 'لبنان', 'Asia/Beirut', 'Beirut'], ['760', 'Syria', 'سوريا', 'Asia/Damascus', 'Damascus'], ['368', 'Iraq', 'العراق', 'Asia/Baghdad', 'Baghdad']]],
  ['North Africa', [['818', 'Egypt', 'مصر', 'Africa/Cairo', 'Cairo'], ['504', 'Morocco', 'المغرب', 'Africa/Casablanca', 'Casablanca'], ['788', 'Tunisia', 'تونس', 'Africa/Tunis', 'Tunis'], ['012', 'Algeria', 'الجزائر', 'Africa/Algiers', 'Algiers']]],
  ['Asia & beyond', [['887', 'Yemen', 'اليمن', 'Asia/Aden', "Sana'a"], ['586', 'Pakistan', 'باكستان', 'Asia/Karachi', 'Karachi'], ['480', 'Mauritius', 'موريشيوس', 'Indian/Mauritius', 'Port Louis']]],
]
function bbox(d) {
  const n = d.match(/-?\d+(\.\d+)?/g).map(Number)
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9
  for (let i = 0; i < n.length - 1; i += 2) { x0 = Math.min(x0, n[i]); x1 = Math.max(x1, n[i]); y0 = Math.min(y0, n[i + 1]); y1 = Math.max(y1, n[i + 1]) }
  return [x0, y0, x1 - x0, y1 - y0]
}
export async function initBoard({ reduced }) {
  const root = $('[data-board]')
  if (!root) return
  const { COUNTRIES } = await import('../data/mena.js')
  const shapes = Object.fromEntries(COUNTRIES.filter(c => c.net).map(c => [c.id, c.d]))
  const shape = id => {
    const d = shapes[id]
    if (!d) return '<svg viewBox="0 0 40 40" class="tile__shape"><circle cx="20" cy="20" r="6"/><circle cx="20" cy="20" r="14" class="ring"/></svg>'
    const [x, y, w, h] = bbox(d), pad = Math.max(w, h) * 0.08
    return `<svg viewBox="${x - pad} ${y - pad} ${w + pad * 2} ${h + pad * 2}" class="tile__shape"><path d="${d}"/></svg>`
  }
  root.innerHTML = REGIONS.map(([name, list]) => `
    <div class="region"><h3>${name}<small>${list.length}</small></h3>
      <ul>${list.map(([id, en, ar, tz, city]) => `<li class="tile${id === '784' ? ' tile--hq' : ''}">
        ${shape(id)}
        <span class="tile__name"><b>${en}</b><span lang="ar" dir="rtl">${ar}</span></span>
        <span class="tile__meta"><span>${city}</span><b data-clock="${tz}">--:--</b></span>
      </li>`).join('')}</ul>
    </div>`).join('')
  if (!reduced) {
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      gsap.from($$('.tile', root), { y: 24, opacity: 0, duration: 0.6, stagger: 0.035, ease: 'power3.out' })
      gsap.from($$('.tile__shape path, .tile__shape circle', root), { scale: 0.6, transformOrigin: 'center', opacity: 0, duration: 0.8, stagger: 0.035, ease: 'back.out(2)', delay: 0.1 })
    }, { threshold: 0.15 })
    io.observe(root)
  }
  startClocks()
}

// ---------------------------------------------------------------- clocks (board + footer)
let clocksOn = false
export function startClocks() {
  if (clocksOn) return
  clocksOn = true
  const fmts = {}
  const tick = () => {
    const now = new Date()
    $$('[data-clock]').forEach(el => {
      const tz = el.dataset.clock || 'Asia/Dubai'
      try { el.textContent = (fmts[tz] ||= new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: tz })).format(now) } catch {}
    })
  }
  tick(); setInterval(tick, 15000)
}

// ---------------------------------------------------------------- industries accordion
export function initAccordion() {
  const root = $('[data-acc]')
  if (!root) return
  const items = $$('li', root)
  const set = li => items.forEach(x => x.classList.toggle('is-on', x === li))
  items.forEach(li => {
    li.addEventListener('pointerenter', () => { if (matchMedia('(hover: hover)').matches) set(li) })
    li.querySelector('button').addEventListener('click', () => set(li))
    li.querySelector('button').addEventListener('focus', () => set(li))
  })
}

// ---------------------------------------------------------------- footer
// The big logo is a grey outline; a spotlight under the cursor reveals it in red.
export function initFooter({ reduced }) {
  const spot = $('[data-spot]')
  if (spot) {
    let tx = 50, ty = 50, x = 50, y = 50, r = 0, tr = 0, raf = 0
    const loop = () => {
      x += (tx - x) * 0.15; y += (ty - y) * 0.15; r += (tr - r) * 0.12
      spot.style.setProperty('--mx', `${x}%`); spot.style.setProperty('--my', `${y}%`); spot.style.setProperty('--r', `${r}px`)
      raf = Math.abs(tr - r) > 0.5 || Math.abs(tx - x) > 0.1 ? requestAnimationFrame(loop) : 0
    }
    const kick = () => { if (!raf) raf = requestAnimationFrame(loop) }
    spot.addEventListener('pointermove', e => {
      const b = spot.getBoundingClientRect()
      tx = (e.clientX - b.left) / b.width * 100; ty = (e.clientY - b.top) / b.height * 100; tr = 260; kick()
    })
    spot.addEventListener('pointerleave', () => { tr = 0; kick() })
    // touch / no hover: slowly sweep the light across once in view
    if (!matchMedia('(hover: hover)').matches && !reduced) {
      new IntersectionObserver(([e], io) => { if (!e.isIntersecting) return; io.disconnect(); tr = 9999; kick() }).observe(spot)
    }
  }
  $$('[data-copy]').forEach(b => b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = 'Copied'; toast('Email copied.') } catch { toast(b.dataset.copy) }
    setTimeout(() => { b.textContent = 'Copy' }, 1800)
  }))
  if (reduced) return
  gsap.from('.foot__say', { yPercent: 40, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.foot', start: 'top 80%' } })
  gsap.from('.foot__mail', { y: 30, opacity: 0, duration: 1, delay: 0.15, ease: 'power3.out', scrollTrigger: { trigger: '.foot', start: 'top 80%' } })
}

// ---------------------------------------------------------------- lightbox
export function initLightbox({ lenis }) {
  const groups = $$('[data-lightbox]')
  if (!groups.length) return
  const box = document.createElement('div')
  box.className = 'lb'
  box.hidden = true
  box.innerHTML = '<button class="lb__x" type="button" aria-label="Close">✕</button><button class="lb__nav lb__nav--p" type="button" aria-label="Previous">←</button><figure><img alt=""><figcaption></figcaption></figure><button class="lb__nav lb__nav--n" type="button" aria-label="Next">→</button>'
  document.body.appendChild(box)
  const im = $('img', box), cap = $('figcaption', box)
  let list = [], i = 0
  const show = n => { i = (n + list.length) % list.length; const a = list[i]; im.src = a.href; cap.textContent = `${a.dataset.caption || ''}  ·  ${i + 1} / ${list.length}`; im.animate([{ opacity: 0, transform: 'scale(.97)' }, { opacity: 1, transform: 'none' }], { duration: 300 }) }
  const close = () => { box.hidden = true; lenis?.start(); document.documentElement.style.overflow = '' }
  groups.forEach(g => g.addEventListener('click', e => {
    const a = e.target.closest('a'); if (!a) return
    e.preventDefault(); list = $$('a', g); box.hidden = false; lenis?.stop(); document.documentElement.style.overflow = 'hidden'; show(list.indexOf(a))
  }))
  box.addEventListener('click', e => { if (e.target === box || e.target.closest('.lb__x')) close() })
  $('.lb__nav--p', box).addEventListener('click', () => show(i - 1))
  $('.lb__nav--n', box).addEventListener('click', () => show(i + 1))
  addEventListener('keydown', e => { if (box.hidden) return; if (e.key === 'Escape') close(); if (e.key === 'ArrowRight') show(i + 1); if (e.key === 'ArrowLeft') show(i - 1) })
}

// ---------------------------------------------------------------- case grid filters (case studies page)
export function initCaseGrid() {
  const grid = $('[data-cgrid]'), bar = $('[data-grid-filters]')
  if (!grid || !bar) return
  const set = k => {
    $$('[data-gf]', bar).forEach(b => b.classList.toggle('is-on', b.dataset.gf === k))
    $$('li', grid).forEach(li => { li.hidden = k !== 'all' && li.dataset.service !== k })
    $$('li:not([hidden])', grid).forEach((li, n) => li.animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: 450, delay: Math.min(n, 10) * 30, fill: 'backwards' }))
    const u = new URL(location); k === 'all' ? u.searchParams.delete('s') : u.searchParams.set('s', k); history.replaceState(null, '', u)
  }
  bar.addEventListener('click', e => { const b = e.target.closest('[data-gf]'); if (b) set(b.dataset.gf) })
  const q = new URLSearchParams(location.search).get('s')
  if (q && $(`[data-gf="${q}"]`, bar)) { set(q); setTimeout(() => $('#all')?.scrollIntoView(), 300) }
}

// ---------------------------------------------------------------- count-up on proof figures like "20,000+"
export function initCountUps({ reduced }) {
  if (reduced) return
  $$('[data-countup]').forEach(el => {
    const m = el.textContent.match(/^([\d,]+)(.*)$/)
    if (!m) return
    const end = +m[1].replace(/,/g, ''), suf = m[2], o = { v: 0 }
    el.textContent = `0${suf}`
    gsap.to(o, { v: end, duration: 1.6, delay: 0.4, ease: 'power3.out', onUpdate: () => { el.textContent = Math.round(o.v).toLocaleString('en-US') + suf } })
  })
}
