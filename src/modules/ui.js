import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { groups } from '../data/services.js'

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
  gsap.from(['.kicker', '.hero__sub', '.hero__ctas', '.hero__legend'], { opacity: 0, y: 16, duration: 1, ease: 'power3.out', stagger: 0.08, delay: 0.5 })
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
  let n = 0
  root.innerHTML = groups.map(g => `
    <div class="svc__group">
      <div><h3>${g.name}</h3><p>${g.intro}</p></div>
      <ul class="svc__items">
        ${g.services.map(s => {
          const id = `svc-${++n}`
          return `<li class="svc__item">
            <button class="svc__btn" type="button" aria-expanded="false" aria-controls="${id}">
              <span class="svc__name">${s.name}</span>
              <span class="svc__line">${s.line}</span>
              <span class="svc__icon" aria-hidden="true"></span>
            </button>
            <div class="svc__panel" id="${id}" role="region" aria-label="${s.name}">
              <div class="svc__inner"><div class="svc__detail">
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
  // first service open so visitors see the depth straight away
  root.querySelector('.svc__btn')?.click()

  const select = $('[data-service-select]')
  if (select) select.insertAdjacentHTML('beforeend', groups.flatMap(g => g.services).map(s => `<option>${s.name}</option>`).join(''))
}

// ---------------------------------------------------------------- marquee
export function initMarquee({ reduced }) {
  const m = $('[data-marquee]')
  if (!m) return
  m.append(m.firstElementChild.cloneNode(true))
  m.lastElementChild.setAttribute('aria-hidden', 'true')
  if (reduced) return
  let x = 0
  const loop = () => {
    const w = m.firstElementChild.offsetWidth
    x -= 0.5
    if (x <= -w) x += w
    m.style.transform = `translate3d(${x}px,0,0)`
    requestAnimationFrame(loop)
  }
  loop()
}

// ---------------------------------------------------------------- reveals
export function initReveals({ reduced }) {
  if (reduced) return
  $$('.section-head, .about__grid, .stats, .svc__group, .steps li, .why__grid article, .regions > div, .group__list li, .form').forEach(el => {
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
