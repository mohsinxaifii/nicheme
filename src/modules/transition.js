// Page transitions: a red sweep and an ink panel cross the screen along the
// logo's arrow (bottom-left to top-right), naming the destination, then sweep
// off the same way on the next page. Plain multi-page navigation underneath.
import { gsap } from 'gsap'
import { allServices } from '../data/services.js'
import { cases } from '../data/cases.js'

const KEY = 'niche-pt'
const BASE = import.meta.env.BASE_URL
const NAMES = { '': 'Home', services: 'Services', 'case-studies': 'Case studies', about: 'About', contact: 'Contact', careers: 'Careers' }
const SERVICE = Object.fromEntries(allServices().map(s => [s.slug, s.name]))
const CASE = Object.fromEntries(cases.map(c => [c.slug, c.brand]))

// The destination's own name: the page, or for a service / case page, that service or brand.
const nameFor = url => {
  const path = url.pathname.startsWith(BASE) ? url.pathname.slice(BASE.length) : url.pathname.replace(/^\//, '')
  const [top, slug] = path.split('/')
  if (top === 'services' && SERVICE[slug]) return SERVICE[slug]
  if (top === 'case-studies' && CASE[slug]) return CASE[slug]
  return NAMES[top] ?? NAMES['']
}

function mount() {
  const el = document.createElement('div')
  el.className = 'pt'
  el.setAttribute('aria-hidden', 'true')
  el.innerHTML = `<div class="pt__rot"><div class="pt__p pt__p--red"></div><div class="pt__p pt__p--ink"></div></div>
    <div class="pt__label"><img src="${BASE}brand/niche-logo.png" alt=""><b></b></div>`
  document.body.appendChild(el)
  return el
}

export function initTransitions({ reduced }) {
  if (reduced) { try { sessionStorage.removeItem(KEY) } catch {} return }
  const el = mount()
  const red = el.querySelector('.pt__p--red'), ink = el.querySelector('.pt__p--ink')
  const label = el.querySelector('.pt__label'), title = label.querySelector('b')
  const OFF = 105 // yPercent that puts a panel fully off screen along the diagonal

  // Arriving: start covered, then sweep off.
  let arriving = null
  try { arriving = sessionStorage.getItem(KEY); sessionStorage.removeItem(KEY) } catch {}
  if (arriving) {
    title.textContent = arriving
    gsap.set([red, ink], { yPercent: 0 })
    gsap.set(label, { opacity: 1, y: 0 })
    el.classList.add('is-on')
    document.documentElement.classList.remove('pt-arrive')
    // Hold the cover until the new page has settled (fonts in, two quiet frames; at most 1.2 s),
    // so the sweep doesn't fight the page's own start-up work and stutter.
    const go = () => gsap.timeline({ onComplete: () => el.classList.remove('is-on') })
      .to(label, { opacity: 0, y: -24, duration: 0.35, ease: 'power2.in' })
      .to(ink, { yPercent: -OFF, duration: 0.9, ease: 'expo.inOut' }, 0.15)
      .to(red, { yPercent: -OFF, duration: 0.9, ease: 'expo.inOut' }, 0.31)
    let started = false
    const start = () => { if (!started) { started = true; go() } }
    setTimeout(start, 1200)
    Promise.all([document.fonts?.ready, new Promise(r => setTimeout(r, 250))]).then(() => {
      let last = performance.now(), calm = 0
      const check = now => { calm = now - last < 34 ? calm + 1 : 0; last = now; calm >= 2 ? start() : !started && requestAnimationFrame(check) }
      requestAnimationFrame(check)
    })
  } else {
    gsap.set([red, ink], { yPercent: OFF })
  }

  // Leaving: sweep in, then navigate.
  let busy = false
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]')
    if (!a || busy || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    if (a.target && a.target !== '_self' || a.hasAttribute('download')) return
    const url = new URL(a.href, location.href)
    if (url.origin !== location.origin || !/^https?:$/.test(url.protocol)) return
    if (url.pathname === location.pathname && url.search === location.search) return // same page, maybe a #hash
    e.preventDefault()
    busy = true
    const name = nameFor(url)
    try { sessionStorage.setItem(KEY, name) } catch {}
    title.textContent = name
    el.classList.add('is-on')
    gsap.set([red, ink], { yPercent: OFF })
    gsap.set(label, { opacity: 0, y: 24 })
    gsap.timeline({ onComplete: () => location.assign(url.href) })
      .to(red, { yPercent: 0, duration: 0.75, ease: 'expo.inOut' })
      .to(ink, { yPercent: 0, duration: 0.75, ease: 'expo.inOut' }, 0.16)
      .to(label, { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' }, 0.55)
  })

  // Warm the next page while the pointer is on its link.
  const warmed = new Set()
  document.addEventListener('pointerover', e => {
    const a = e.target.closest('a[href]')
    if (!a) return
    const url = new URL(a.href, location.href)
    if (url.origin !== location.origin || url.pathname === location.pathname || warmed.has(url.pathname)) return
    warmed.add(url.pathname)
    const l = document.createElement('link')
    l.rel = 'prefetch'; l.href = url.pathname
    document.head.appendChild(l)
  })

  // Back/forward from the bfcache: the page comes back mid-cover, so clear it.
  addEventListener('pageshow', e => {
    if (!e.persisted) return
    busy = false
    gsap.killTweensOf([red, ink, label])
    gsap.set([red, ink], { yPercent: OFF })
    el.classList.remove('is-on')
    document.documentElement.classList.remove('pt-arrive')
  })
}
