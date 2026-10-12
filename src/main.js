import './css/base.css'
import './css/sections.css'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { initWall } from './modules/wall.js'
import { initNav, initAnchors, initHeroIntro, initCounters, initServices, initMarquee, initReveals, initForm } from './modules/ui.js'

gsap.registerPlugin(ScrollTrigger)
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches

let lenis = null
if (!reduced) {
  lenis = new Lenis({ lerp: 0.1, smoothWheel: true })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add(t => lenis.raf(t * 1000))
  gsap.ticker.lagSmoothing(0)
}

const ctx = { lenis, reduced }
initNav(ctx)
initAnchors(ctx)
initHeroIntro(ctx)
initServices(ctx)
initCounters(ctx)
initWall(ctx)
initMarquee(ctx)
initReveals(ctx)
initForm()

// Hero map loads after first paint so the H1 stays the LCP element.
const hero = document.querySelector('.hero')
requestAnimationFrame(async () => {
  const { initMap } = await import('./modules/map.js')
  const map = await initMap({ canvas: document.querySelector('[data-map]'), reduced })
  ScrollTrigger.create({
    trigger: hero, start: 'top top', end: 'bottom top',
    onUpdate: s => map.setScroll(Math.min(1, s.progress * 1.6)),
  })
  gsap.to('.hero__copy', { yPercent: -12, opacity: 0, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: '70% top', scrub: true } })
})

addEventListener('load', () => ScrollTrigger.refresh())
document.fonts?.ready.then(() => ScrollTrigger.refresh())
