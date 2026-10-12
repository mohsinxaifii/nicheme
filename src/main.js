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
  initSteps, initActiveNav, initBento, initBoard, initAccordion, initFooter,
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

// Hero: transparent globe that settles on MENA, loaded after first paint.
const hero = document.querySelector('.hero')
let globe = null
requestAnimationFrame(async () => {
  const { initHeroGlobe } = await import('./modules/hero-globe.js')
  globe = initHeroGlobe({ root: document.querySelector('[data-globe]'), canvas: document.querySelector('[data-globe-canvas]'), reduced })
})
ScrollTrigger.create({ trigger: hero, start: 'top top', end: 'bottom top', onUpdate: s => globe?.setScroll(s.progress) })
gsap.to('.hero__copy', { yPercent: -10, opacity: 0, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: '75% top', scrub: true } })

initBoard(ctx)
initAccordion()
initFooter(ctx)

// Intro (first visit per session), then the hero animates in.
lenis?.stop()
playIntro({
  reduced,
  logoSrc: `${BASE}brand/niche-logo.png`,
  onReveal: () => { lenis?.start(); initHeroIntro(ctx) },
})

addEventListener('load', () => ScrollTrigger.refresh())
document.fonts?.ready.then(() => ScrollTrigger.refresh())
