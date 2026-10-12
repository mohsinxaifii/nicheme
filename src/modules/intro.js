// Intro: the MENA map draws itself, Niche's 17 countries light up from Dubai,
// one English/Arabic line shows, then the NICHE logo resolves and the curtain
// lifts (~2.6 s). Plays once per session; skippable; off for reduced motion.
import { gsap } from 'gsap'

const KEY = 'niche-intro-seen'
// Arabic lines to be checked by Niche's Arabic copywriter before launch.
const LINES = [
  ['The eyes and ears of great brands', 'عيون وآذان العلامات التجارية الكبرى'],
]

export async function playIntro({ reduced, logoSrc, onReveal = () => {} }) {
  let seen = false
  try { seen = sessionStorage.getItem(KEY) === '1' } catch {}
  if (reduced || seen) { onReveal(); return }
  try { sessionStorage.setItem(KEY, '1') } catch {}

  const { VIEW, CITIES, COUNTRIES } = await import('../data/mena.js')
  const [W, H] = VIEW
  const el = document.createElement('div')
  el.className = 'intro'
  el.setAttribute('aria-hidden', 'true')
  el.innerHTML = `
    <svg class="intro__map" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">
      <g class="intro__land">${COUNTRIES.map(c => `<path d="${c.d}" class="${c.net ? 'net' : ''}"/>`).join('')}</g>
      <g class="intro__arcs">${Object.entries(CITIES).filter(([k]) => k !== 'dubai').map(([, [x, y]]) => {
        const [dx, dy] = CITIES.dubai, mx = (dx + x) / 2, my = Math.min(dy, y) - Math.hypot(x - dx, y - dy) * 0.25
        return `<path d="M${dx} ${dy}Q${mx} ${my} ${x} ${y}"/>`
      }).join('')}</g>
      <g class="intro__dots">${Object.entries(CITIES).map(([k, [x, y]]) => `<circle cx="${x}" cy="${y}" r="${k === 'dubai' ? 7 : 4.5}" class="${k === 'dubai' ? 'hq' : ''}"/>`).join('')}</g>
      <circle class="intro__ring" cx="${CITIES.dubai[0]}" cy="${CITIES.dubai[1]}" r="8"/>
    </svg>
    <div class="intro__lines">${LINES.map(([en, ar]) => `<p><span class="en">${en}</span><span class="ar" lang="ar" dir="rtl">${ar}</span></p>`).join('')}</div>
    <div class="intro__logo"><img src="${logoSrc}" alt=""></div>
    <div class="intro__meta"><span>Dubai · دبي</span><span>MENA · الشرق الأوسط وشمال أفريقيا</span></div>
    <button class="intro__skip" type="button">Skip</button>`
  document.body.appendChild(el)
  document.documentElement.classList.add('is-intro')

  const land = el.querySelectorAll('.intro__land path')
  land.forEach(p => { const l = p.getTotalLength(); p.style.strokeDasharray = l; p.style.strokeDashoffset = l })
  const arcs = el.querySelectorAll('.intro__arcs path')
  arcs.forEach(p => { const l = p.getTotalLength(); p.style.strokeDasharray = l; p.style.strokeDashoffset = l })
  const lines = el.querySelectorAll('.intro__lines p')

  return new Promise(resolve => {
    const tl = gsap.timeline({ onComplete: finish })
    tl.to(land, { strokeDashoffset: 0, duration: 0.8, ease: 'power2.inOut', stagger: { amount: 0.25, from: 'random' } }, 0)
      .to(el.querySelectorAll('.intro__land .net'), { fillOpacity: 1, duration: 0.35, stagger: { amount: 0.3, from: 'end' } }, 0.45)
      .from(el.querySelectorAll('.intro__dots circle'), { scale: 0, transformOrigin: 'center', duration: 0.3, stagger: 0.015, ease: 'back.out(3)' }, 0.5)
      .to(arcs, { strokeDashoffset: 0, duration: 0.45, stagger: 0.015, ease: 'power2.out' }, 0.55)
      .fromTo(el.querySelector('.intro__ring'), { attr: { r: 8 }, opacity: 0.9 }, { attr: { r: 60 }, opacity: 0, duration: 0.9, ease: 'power2.out' }, 0.5)
      .from(el.querySelector('.intro__meta'), { opacity: 0, duration: 0.4 }, 0.2)
      .fromTo(lines[0], { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' }, 0.35)
      .to(lines[0], { opacity: 0, y: -14, duration: 0.25, ease: 'power2.in' }, 1.25)
      .to(el.querySelector('.intro__map'), { opacity: 0.2, scale: 1.06, duration: 0.6, ease: 'power2.inOut' }, 1.2)
      .fromTo(el.querySelector('.intro__logo'), { opacity: 0, scale: 0.94, filter: 'blur(6px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.45, ease: 'power3.out' }, 1.35)
      .call(() => { document.documentElement.classList.remove('is-intro'); onReveal() }, null, 1.95)
      .to(el, { clipPath: 'inset(0 0 100% 0)', duration: 0.7, ease: 'expo.inOut' }, 1.9)

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
