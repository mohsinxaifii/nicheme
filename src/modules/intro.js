// Intro, in two calm beats (~2.7 s): Niche's 17 countries light up outward
// from Dubai (no text over the map), then the map dims and the NICHE logo
// resolves with the line as a tagline beneath it, and the curtain lifts.
// Plays once per session; skippable; off for reduced motion.
//
// Built to stay smooth on ordinary laptops:
//  - index.html covers the page before first paint (html.intro-cover), so the
//    hero never flashes before the intro;
//  - the ~170 surrounding countries are one static layer that only fades in
//    (opacity on its own GPU layer, no per-frame redraw); only the 17 network
//    countries and their city dots animate.
import { gsap } from 'gsap'

const KEY = 'niche-intro-seen'
const TAGLINE = 'The eyes and ears of great brands'
const uncover = () => document.documentElement.classList.remove('intro-cover')

export async function playIntro({ reduced, logoSrc, onReveal = () => {} }) {
  let seen = false
  try { seen = sessionStorage.getItem(KEY) === '1' } catch {}
  if (reduced || seen) { uncover(); onReveal(); return }
  try { sessionStorage.setItem(KEY, '1') } catch {}

  let VIEW, CITIES, COUNTRIES
  try { ({ VIEW, CITIES, COUNTRIES } = await import('../data/mena.js')) } catch { uncover(); onReveal(); return }

  // Frame the network itself (it sits in the top third of the map): Morocco to
  // Pakistan on landscape screens, the Gulf, Levant and Egypt on portrait ones.
  const portrait = innerHeight > innerWidth * 0.9
  const [bx, by, bw, bh] = portrait ? [455, 45, 480, 290] : [15, 15, 945, 345]
  const box = `viewBox="${bx} ${by} ${bw} ${bh}" preserveAspectRatio="xMidYMid meet"`
  const inFrame = ([x, y]) => x >= bx && x <= bx + bw && y >= by && y <= by + bh
  const [dx, dy] = CITIES.dubai
  const cities = Object.entries(CITIES).filter(([, c]) => inFrame(c))

  const el = document.createElement('div')
  el.className = 'intro'
  el.setAttribute('aria-hidden', 'true')
  el.innerHTML = `
    <div class="intro__stage">
      <svg class="intro__base" ${box}>
        <defs>
          <clipPath id="intro-clip"><rect width="${VIEW[0]}" height="${VIEW[1]}"/></clipPath>
          <linearGradient id="intro-fade" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="${VIEW[1]}">
            <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".14" stop-color="#fff"/><stop offset=".8" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
          </linearGradient>
          <mask id="intro-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="${VIEW[0]}" height="${VIEW[1]}"><rect width="${VIEW[0]}" height="${VIEW[1]}" fill="url(#intro-fade)"/></mask>
        </defs>
        <g class="intro__land" clip-path="url(#intro-clip)" mask="url(#intro-mask)">${COUNTRIES.filter(c => !c.net).map(c => `<path d="${c.d}"/>`).join('')}</g>
      </svg>
      <svg class="intro__map" ${box}>
        <g class="intro__land">${COUNTRIES.filter(c => c.net).map(c => `<path d="${c.d}" class="net"/>`).join('')}</g>
        <g class="intro__dots">${cities.map(([k, [x, y]]) => `<circle cx="${x}" cy="${y}" r="${k === 'dubai' ? 7 : 4.5}" class="${k === 'dubai' ? 'hq' : ''}" data-d="${Math.hypot(x - dx, y - dy)}"/>`).join('')}</g>
        <circle class="intro__ring" cx="${dx}" cy="${dy}" r="8"/>
      </svg>
    </div>
    <div class="intro__logo"><img src="${logoSrc}" alt=""><p class="intro__tag">${TAGLINE}</p></div>
    <div class="intro__meta"><span>Dubai · HQ</span><span>MENA · 17 countries</span></div>
    <button class="intro__skip" type="button">Skip</button>`
  document.body.appendChild(el)
  document.documentElement.classList.add('is-intro')
  uncover()

  const map = el.querySelector('.intro__map')
  // Network outlines draw on. Their strokes are non-scaling, so the
  // dash pattern is measured in screen pixels: scale lengths by the map's scale.
  const k = map.getScreenCTM()?.a || 1
  const prime = p => { const l = p.getTotalLength() * k + 2; p.style.strokeDasharray = l; p.style.strokeDashoffset = l }
  // light up outward from Dubai
  const near = list => list.map(e => {
    const b = e.getBBox ? e.getBBox() : null
    return [e, e.dataset.d ? +e.dataset.d : b ? Math.hypot(b.x + b.width / 2 - dx, b.y + b.height / 2 - dy) : 0]
  }).sort((a, b) => a[1] - b[1]).map(x => x[0])
  const net = near([...map.querySelectorAll('.intro__land .net')])
  const dots = near([...map.querySelectorAll('.intro__dots circle')])
  net.forEach(prime)

  return new Promise(resolve => {
    const tl = gsap.timeline({ onComplete: finish })
    // beat 1: the network lights up, nothing on top of it
    tl.fromTo(el.querySelector('.intro__base'), { opacity: 0 }, { opacity: 1, duration: 0.7, ease: 'power1.out' }, 0)
      .to(net, { strokeDashoffset: 0, duration: 0.55, ease: 'power2.out', stagger: { amount: 0.35 } }, 0)
      .to(net, { fillOpacity: 1, duration: 0.4, ease: 'power1.out', stagger: { amount: 0.45 } }, 0.15)
      .from(dots, { scale: 0, transformOrigin: 'center', duration: 0.35, stagger: { amount: 0.4 }, ease: 'back.out(3)' }, 0.25)
      .fromTo(el.querySelector('.intro__ring'), { attr: { r: 8 }, opacity: 0.9 }, { attr: { r: 60 }, opacity: 0, duration: 0.9, ease: 'power2.out', immediateRender: false }, 0.25)
      .from(el.querySelector('.intro__meta'), { opacity: 0, duration: 0.4 }, 0.15)
    // beat 2: the map steps back; logo, then the tagline beneath it
      .to(el.querySelector('.intro__stage'), { opacity: 0.16, scale: 1.04, duration: 0.6, ease: 'power2.inOut' }, 1.05)
      .fromTo(el.querySelector('.intro__logo img'), { opacity: 0, scale: 0.94, filter: 'blur(6px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.5, ease: 'power3.out' }, 1.2)
      .fromTo(el.querySelector('.intro__tag'), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' }, 1.4)
      .call(() => { document.documentElement.classList.remove('is-intro'); onReveal() }, null, 2.1)
      .to(el, { clipPath: 'inset(0 0 100% 0)', duration: 0.7, ease: 'expo.inOut' }, 2.05)

    let revealed = false
    const reveal = onReveal
    onReveal = () => { if (!revealed) { revealed = true; reveal() } }
    function finish() {
      el.remove()
      document.documentElement.classList.remove('is-intro')
      onReveal()
      resolve()
    }
    const skip = () => { tl.progress(1) }
    el.querySelector('.intro__skip').addEventListener('click', skip)
    addEventListener('keydown', function onKey(e) { if (e.key === 'Escape') { removeEventListener('keydown', onKey); skip() } })
  })
}
