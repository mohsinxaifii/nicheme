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
  gsap.from('.hero__window', { opacity: 0, y: 40, scale: 0.97, duration: 1.3, ease: 'expo.out', delay: 0.25 })
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

// ---------------------------------------------------------------- services accordion
export function initServices({ lenis }) {
  const root = $('[data-services]')
  if (!root) return
  const ICONS = ['audit', 'mystery', 'research', 'reporting', 'merch', 'ambassador', 'install', 'promo', 'sampling', 'events', 'production', 'logistics', 'digital', 'vehicle']
  let n = 0
  root.innerHTML = groups.map(g => `
    <div class="svc__group">
      <div><h3>${g.name}</h3><p>${g.intro}</p></div>
      <ul class="svc__items">
        ${g.services.map(s => {
          const id = `svc-${++n}`
          return `<li class="svc__item">
            <button class="svc__btn" type="button" aria-expanded="false" aria-controls="${id}"${s.photo ? ` data-preview="${import.meta.env.BASE_URL}work/${s.photo}"` : ''}>
              ${icon(ICONS[n - 1])}
              <span class="svc__name">${s.name}</span>
              <span class="svc__line">${s.line}</span>
              <span class="svc__icon" aria-hidden="true"></span>
            </button>
            <div class="svc__panel" id="${id}" role="region" aria-label="${s.name}">
              <div class="svc__inner"><div class="svc__detail${s.photo ? ' has-photo' : ''}">
                ${s.photo ? `<img class="svc__photo" src="${import.meta.env.BASE_URL}work/${s.photo}" alt="${s.name} by Niche" loading="lazy">` : ''}
                <div>
                  <p>${s.body}</p>
                  ${s.proof ? `<div class="svc__proof"><b>${s.proof[0]}</b><span>${s.proof[1]}</span></div>` : ''}
                  ${s.link ? `<a class="svc__link" href="${s.link}" target="_blank" rel="noopener">Visit Connexis</a>` : ''}
                </div>
                <div><h4>What's included</h4><ul>${s.included.map(i => `<li>${i}</li>`).join('')}</ul></div>
              </div></div>
            </div>
          </li>`
        }).join('')}
      </ul>
    </div>`).join('')

  root.addEventListener('click', e => {
    const btn = e.target.closest('.svc__btn')
    if (!btn) return
    const item = btn.parentElement
    const open = !item.classList.contains('is-open')
    item.classList.toggle('is-open', open)
    btn.setAttribute('aria-expanded', open)
    setTimeout(() => { lenis?.resize(); ScrollTrigger.refresh() }, 480)
  })
  // photo preview that follows the cursor over closed rows
  const prev = document.createElement('div')
  prev.className = 'svc__preview'
  prev.innerHTML = '<img alt="">'
  document.body.appendChild(prev)
  const pimg = prev.firstElementChild
  let px = 0, py = 0, tx = 0, ty = 0, raf = 0
  const follow = () => { px += (tx - px) * 0.18; py += (ty - py) * 0.18; prev.style.transform = `translate(${px}px, ${py}px)`; raf = requestAnimationFrame(follow) }
  root.addEventListener('pointermove', e => {
    const btn = e.target.closest('.svc__btn')
    const on = btn && btn.dataset.preview && !btn.parentElement.classList.contains('is-open')
    tx = e.clientX + 24; ty = e.clientY - 100
    if (on && pimg.getAttribute('src') !== btn.dataset.preview) pimg.src = btn.dataset.preview
    prev.classList.toggle('is-on', !!on)
    if (on && !raf) { px = tx; py = ty; follow() }
  })
  root.addEventListener('pointerleave', () => { prev.classList.remove('is-on'); cancelAnimationFrame(raf); raf = 0 })

  // first service open so visitors see the depth straight away
  root.querySelector('.svc__btn')?.click()

  const select = $('[data-service-select]')
  if (select) select.insertAdjacentHTML('beforeend', groups.flatMap(g => g.services).map(s => `<option>${s.name}</option>`).join(''))
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
  $$('.section-head, .proof__grid, .stats, .svc__group, .steps li, .reporting__grid > *, .why__grid article, .regions > div, .ind li, .group__list li, .form').forEach(el => {
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

// ---------------------------------------------------------------- hero live feed (sample)
const FEED = [
  ['Perfect Store audit', 'Doha · Qatar'], ['Shelf photo uploaded', 'Riyadh · KSA'], ['Sampling complete', 'Dubai Mall · UAE'],
  ['Mystery shop scored 92%', 'Jeddah · KSA'], ['POSM installed', 'Kuwait City'], ['Planogram corrected', 'Muscat · Oman'],
  ['Cooler audit', 'Cairo · Egypt'], ['Promoter checked in', 'Sharjah · UAE'], ['Dealer survey logged', 'Karachi · Pakistan'],
]
export function initHeroFeed({ reduced }) {
  const feed = $('[data-hero-feed]')
  if (!feed || reduced) return
  let i = 0
  const time = () => new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Dubai' }).format(new Date())
  const push = () => {
    if (document.hidden) return
    const [msg, where] = FEED[i++ % FEED.length]
    const el = document.createElement('div')
    el.className = 'ping'
    el.innerHTML = `<span>${msg}<small>${where} · ${time()}</small></span>`
    feed.appendChild(el)
    el.animate([{ opacity: 0, transform: 'translateY(14px) scale(.96)' }, { opacity: 1, transform: 'none' }], { duration: 450, easing: 'cubic-bezier(.2,.7,.1,1)' })
    while (feed.children.length > 1) {
      const old = feed.firstElementChild
      old.animate([{ opacity: 1 }, { opacity: 0, transform: 'translateY(-10px)' }], { duration: 300, fill: 'forwards' }).onfinish = () => old.remove()
      break
    }
  }
  setTimeout(() => { push(); setInterval(push, 2600) }, 1800)
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
