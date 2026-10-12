import './css/base.css'
import './css/sections.css'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { hydrateIcons } from './data/icons.js'
import { initWall } from './modules/wall.js'
import { playIntro } from './modules/intro.js'
import {
  initNav, initAnchors, initHeroIntro, initCounters, initServices, initLogos, initReveals, initForm,
  initSteps, initActiveNav, initBento,
} from './modules/ui.js'

gsap.registerPlugin(ScrollTrigger)
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
const BASE = import.meta.env.BASE_URL

hydrateIcons()

let lenis = null
if (!reduced) {
  lenis = new Lenis({ lerp: 0.1, smoothWheel: true })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add(t => lenis.raf(t * 1000))
  gsap.ticker.lagSmoothing(0)
}

const ctx = { lenis, reduced }
initNav(ctx)
initActiveNav()
initAnchors(ctx)
initServices(ctx)
initCounters(ctx)
initWall(ctx)
initLogos(ctx)
initSteps(ctx)
initBento(ctx)
initReveals(ctx)
initForm()

// Hero: tilted vector map of MENA, loaded after first paint.
const hero = document.querySelector('.hero')
requestAnimationFrame(async () => {
  const { initHeroMap } = await import('./modules/hero-map.js')
  initHeroMap({ root: document.querySelector('[data-hero-map]'), reduced })
})
gsap.to('.hero__copy', { yPercent: -10, opacity: 0, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: '75% top', scrub: true } })
gsap.to('.hero__visual', { yPercent: 8, opacity: 0.2, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } })

// Network: the MENA map with live pings, loaded when the section gets close.
const network = document.querySelector('#network')
new IntersectionObserver(async ([e], io) => {
  if (!e.isIntersecting) return
  io.disconnect()
  const { initMap } = await import('./modules/map.js')
  initMap({ canvas: network.querySelector('[data-map]'), pingLayer: network.querySelector('[data-pings]'), reduced })
}, { rootMargin: '600px 0px' }).observe(network)

// Intro (first visit per session), then the hero animates in.
lenis?.stop()
playIntro({
  reduced,
  logoSrc: `${BASE}brand/niche-logo.png`,
  onReveal: () => { lenis?.start(); initHeroIntro(ctx) },
})

addEventListener('load', () => ScrollTrigger.refresh())
document.fonts?.ready.then(() => ScrollTrigger.refresh())
