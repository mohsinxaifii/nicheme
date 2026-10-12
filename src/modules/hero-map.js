// Hero: a tilted vector map of MENA. Niche's 17 countries fill in red outward
// from Dubai, arcs carry little lights out of the HQ, hovering a country shows
// its name in English and Arabic, and a live audit chip pins itself to cities.
import { VIEW, CITIES, COUNTRIES } from '../data/mena.js'

const S = 10                                  // px per degree in mena.js
const FRAME = { lon: [-14, 74], lat: [5, 41] } // crop
const vx = (FRAME.lon[0] + 18) * S, vy = (44 - FRAME.lat[1]) * S
const vw = (FRAME.lon[1] - FRAME.lon[0]) * S, vh = (FRAME.lat[1] - FRAME.lat[0]) * S

// Names to be checked by Niche's Arabic copywriter before launch.
const NAMES = {
  '784': ['United Arab Emirates', 'الإمارات'], '682': ['Saudi Arabia', 'السعودية'], '634': ['Qatar', 'قطر'],
  '414': ['Kuwait', 'الكويت'], '512': ['Oman', 'عُمان'], '048': ['Bahrain', 'البحرين'], '400': ['Jordan', 'الأردن'],
  '422': ['Lebanon', 'لبنان'], '760': ['Syria', 'سوريا'], '368': ['Iraq', 'العراق'], '818': ['Egypt', 'مصر'],
  '504': ['Morocco', 'المغرب'], '788': ['Tunisia', 'تونس'], '012': ['Algeria', 'الجزائر'], '887': ['Yemen', 'اليمن'],
  '586': ['Pakistan', 'باكستان'], '480': ['Mauritius', 'موريشيوس'],
}
// Sample feed, illustrative of what the reporting app sends.
const FEED = [
  ['Perfect Store audit', 'doha', 'Doha, Qatar'], ['Shelf photo uploaded', 'riyadh', 'Riyadh, KSA'],
  ['Sampling complete', 'dubai', 'Dubai, UAE'], ['POSM installed', 'kuwait', 'Kuwait City'],
  ['Cooler audit', 'cairo', 'Cairo, Egypt'], ['Planogram corrected', 'muscat', 'Muscat, Oman'],
  ['Display installed', 'casablanca', 'Casablanca, Morocco'], ['Dealer survey logged', 'karachi', 'Karachi, Pakistan'],
  ['Price check', 'amman', 'Amman, Jordan'], ['Mystery shop scored 92%', 'manama', 'Manama, Bahrain'],
]

export function initHeroMap({ root, reduced }) {
  const [dx, dy] = CITIES.dubai
  const net = COUNTRIES.filter(c => c.net)
  const pct = (x, y) => [((x - vx) / vw) * 100, ((y - vy) / vh) * 100]

  // graticule every 10°
  let grid = ''
  for (let lon = -10; lon <= 70; lon += 10) grid += `M${(lon + 18) * S} ${vy}V${vy + vh}`
  for (let lat = 10; lat <= 40; lat += 10) grid += `M${vx} ${(44 - lat) * S}H${vx + vw}`

  const arcs = Object.entries(CITIES).filter(([k]) => k !== 'dubai' && k !== 'portlouis').map(([, [x, y]]) => {
    const mx = (dx + x) / 2, my = Math.min(dy, y) - Math.hypot(x - dx, y - dy) * 0.28
    return `M${dx} ${dy}Q${mx} ${my} ${x} ${y}`
  })

  root.innerHTML = `
    <div class="hmap__tilt">
      <svg class="hmap__svg" viewBox="${vx} ${vy} ${vw} ${vh}" aria-hidden="true">
        <defs>
          <linearGradient id="hmap-red" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E4231B"/><stop offset="1" stop-color="#9E1610"/></linearGradient>
          <radialGradient id="hmap-glow"><stop offset="0" stop-color="#E4231B" stop-opacity=".55"/><stop offset="1" stop-color="#E4231B" stop-opacity="0"/></radialGradient>
        </defs>
        <path class="hmap__grid" d="${grid}"/>
        <circle cx="${dx}" cy="${dy}" r="220" fill="url(#hmap-glow)" class="hmap__glow"/>
        <g class="hmap__land">${COUNTRIES.filter(c => !c.net).map(c => `<path d="${c.d}"/>`).join('')}</g>
        <g class="hmap__net">${net.map(c => {
          const d = Math.hypot(...centroid(c.d).map((v, i) => v - [dx, dy][i]))
          return `<path d="${c.d}" data-id="${c.id}" style="--d:${(d / 900).toFixed(2)}s"/>`
        }).join('')}</g>
        <g class="hmap__arcs">${arcs.map((d, i) => `<path d="${d}" class="base"/><path d="${d}" class="light" pathLength="100" style="--i:${i}"/>`).join('')}</g>
        <g class="hmap__cities">${Object.entries(CITIES).filter(([k]) => k !== 'portlouis').map(([k, [x, y]]) =>
          `<circle cx="${x}" cy="${y}" r="${k === 'dubai' ? 5.5 : 3.2}" data-city="${k}" class="${k === 'dubai' ? 'hq' : ''}"/>`).join('')}
          <circle cx="${dx}" cy="${dy}" r="6" class="ring"/><circle cx="${dx}" cy="${dy}" r="6" class="ring ring--2"/>
        </g>
      </svg>
      <span class="hmap__hq" style="left:${pct(dx, dy)[0]}%;top:${pct(dx, dy)[1]}%"><b>Dubai</b><span lang="ar">دبي</span></span>
    </div>
    <div class="hmap__chip" data-chip></div>
    <div class="hmap__tip" data-tip></div>`

  const tilt = root.querySelector('.hmap__tilt')
  const tip = root.querySelector('[data-tip]')
  const chip = root.querySelector('[data-chip]')

  // hover a network country: names in English and Arabic
  root.querySelectorAll('.hmap__net path').forEach(p => {
    p.addEventListener('pointerenter', () => {
      const [en, ar] = NAMES[p.dataset.id] || []
      if (!en) return
      tip.innerHTML = `<b>${en}</b><span lang="ar" dir="rtl">${ar}</span>`
      tip.classList.add('is-on')
    })
    p.addEventListener('pointerleave', () => tip.classList.remove('is-on'))
  })
  root.addEventListener('pointermove', e => {
    const r = root.getBoundingClientRect()
    tip.style.transform = `translate(${e.clientX - r.left + 14}px, ${e.clientY - r.top + 14}px)`
    if (reduced) return
    const h = root.getBoundingClientRect()
    const nx = (e.clientX - h.left) / h.width - 0.5, ny = (e.clientY - h.top) / h.height - 0.5
    tilt.style.setProperty('--rx', `${18 - ny * 8}deg`)
    tilt.style.setProperty('--ry', `${nx * 10}deg`)
  })
  root.addEventListener('pointerleave', () => { tilt.style.setProperty('--rx', '18deg'); tilt.style.setProperty('--ry', '0deg') })

  // live chip pinned to the city it mentions
  let i = 0
  const time = () => new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Dubai' }).format(new Date())
  const show = () => {
    if (document.hidden) return
    const [msg, key, where] = FEED[i++ % FEED.length]
    const dot = root.querySelector(`[data-city="${key}"]`)
    if (!dot) return
    root.querySelectorAll('.hmap__cities .is-ping').forEach(c => c.classList.remove('is-ping'))
    dot.classList.add('is-ping')
    chip.classList.remove('is-on')
    setTimeout(() => {
      const r = root.getBoundingClientRect(), d = dot.getBoundingClientRect()
      const x = d.left + d.width / 2 - r.left, y = d.top + d.height / 2 - r.top
      chip.style.left = `${x}px`; chip.style.top = `${y}px`
      // keep the chip inside the visible part of the hero
      const room = Math.min(innerWidth, r.right) - (r.left + x)
      chip.classList.toggle('is-left', room < 260)
      chip.innerHTML = `<span class="ping"><span>${msg}<small>${where} · ${time()}</small></span></span>`
      chip.classList.add('is-on')
    }, 260)
  }
  root.classList.add('is-ready')
  if (!reduced) setTimeout(() => { show(); setInterval(show, 2800) }, 1600)
  else show()
}

function centroid(d) {
  const nums = d.match(/-?\d+(\.\d+)?/g).map(Number)
  let x = 0, y = 0, n = 0
  for (let k = 0; k < nums.length - 1; k += 2) { x += nums[k]; y += nums[k + 1]; n++ }
  return [x / n, y / n]
}
