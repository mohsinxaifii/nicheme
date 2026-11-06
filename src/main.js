import './css/base.css'
import './css/sections.css'
import './css/pages.css'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { hydrateIcons } from './data/icons.js'
import { initWall } from './modules/wall.js'
import { playIntro } from './modules/intro.js'
import { initTransitions } from './modules/transition.js'
import {
  initNav, initAnchors, initHeroIntro, initCounters, initLogos, initReveals, initForm,
  initSteps, initActiveNav, initBento, initBoard, initGroup, initAccordion, initFooter,
  initLightbox, initCaseGrid, initCountUps, initApply, initArchive,
} from './modules/ui.js'

gsap.registerPlugin(ScrollTrigger)
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
const BASE = import.meta.env.BASE_URL
const page = document.body.dataset.page

hydrateIcons()

let lenis = null
if (!reduced) {
  lenis = new Lenis({ lerp: 0.14, smoothWheel: true })   // a touch quicker than the default: responsive, still smooth
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add(t => lenis.raf(t * 1000))
  gsap.ticker.lagSmoothing(0)
}

// Every init checks for its own elements, so one bundle serves every page.
const ctx = { lenis, reduced }
initTransitions(ctx)
initNav(ctx)
initActiveNav()
initAnchors(ctx)
initCounters(ctx)
initCountUps(ctx)
initWall(ctx)
initLogos(ctx)
initSteps(ctx)
initBento(ctx)
initReveals(ctx)
initForm(ctx)
initBoard(ctx)
initGroup(ctx)
initAccordion()
initLightbox(ctx)
initCaseGrid()
initApply()
initArchive()
initFooter(ctx)

// Sub-page heroes rise in.
if (page !== 'home' && !reduced) {
  gsap.from('.phero .crumbs, .phero .label, .phero__title, .phero__lead, .svh__line, .svh__kicker, .phero__btns, .phero__chips, .csh__pills, .csh__sub, .csh__stats, .milestones', { y: 26, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.06, delay: 0.05 })
  gsap.from('.svh__media, .csh__img, .iconwall, .crh', { opacity: 0, x: 40, duration: 1.3, ease: 'expo.out', delay: 0.15 })
}

if (page === 'home') {
  // Hero: transparent globe that settles on MENA, loaded after first paint.
  const hero = document.querySelector('.hero')
  let globe = null
  // Load the globe during the intro but start it as the curtain lifts, so it
  // doesn't compete with the intro for the CPU and its spin-in is actually seen.
  const globeMod = import('./modules/hero-globe.js')
  const startGlobe = () => {
    if (globe) return
    // wait for a page-transition cover to finish sliding off: the globe's first draws would make it stutter
    if (document.querySelector('.pt.is-on')) return setTimeout(startGlobe, 100)
    globeMod.then(({ initHeroGlobe }) => { globe ||= initHeroGlobe({ root: document.querySelector('[data-globe]'), canvas: document.querySelector('[data-globe-canvas]'), reduced }) })
  }
  gsap.to('.hero__copy', { yPercent: -10, opacity: 0, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: '75% top', scrub: true } })

  // Intro (first visit per session), then the hero animates in.
  lenis?.stop()
  playIntro({
    reduced,
    logoSrc: `${BASE}brand/niche-logo.png`,
    onReveal: () => { lenis?.start(); initHeroIntro(ctx); startGlobe() },
  })
}

// Arriving with a #hash from another page: scroll there once layout settles.
if (location.hash.length > 1 && !location.hash.startsWith('#case/')) {
  addEventListener('load', () => {
    const el = document.querySelector(location.hash)
    if (el) setTimeout(() => (lenis ? lenis.scrollTo(el, { immediate: true }) : el.scrollIntoView()), 100)
  })
}

addEventListener('load', () => ScrollTrigger.refresh())
document.fonts?.ready.then(() => ScrollTrigger.refresh())
