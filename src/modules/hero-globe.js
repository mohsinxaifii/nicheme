// Hero: a large transparent globe that bleeds off the screen. It spins in and
// settles on MENA; drag to rotate and it springs back. Niche's 17 countries
// fill red outward from Dubai, sonar pulses ripple from each city, hovering a
// country shows its name in English and Arabic, and a live audit chip pins
// itself to the city it mentions.
import { geoOrthographic, geoPath, geoGraticule10, geoContains, geoDistance } from 'd3-geo'
import { feature } from 'topojson-client'
import world from 'world-atlas/countries-110m.json'

const HOME = [-33, -24]          // rotation that faces MENA (lon, lat)
const NETWORK = {
  '784': ['United Arab Emirates', 'الإمارات'], '682': ['Saudi Arabia', 'السعودية'], '634': ['Qatar', 'قطر'],
  '414': ['Kuwait', 'الكويت'], '512': ['Oman', 'عُمان'], '048': ['Bahrain', 'البحرين'], '400': ['Jordan', 'الأردن'],
  '422': ['Lebanon', 'لبنان'], '760': ['Syria', 'سوريا'], '368': ['Iraq', 'العراق'], '818': ['Egypt', 'مصر'],
  '504': ['Morocco', 'المغرب'], '788': ['Tunisia', 'تونس'], '012': ['Algeria', 'الجزائر'], '887': ['Yemen', 'اليمن'],
  '586': ['Pakistan', 'باكستان'], '480': ['Mauritius', 'موريشيوس'],
}
// Arabic names to be checked by Niche's Arabic copywriter before launch.
const CITIES = {
  dubai: [55.27, 25.2], riyadh: [46.68, 24.71], jeddah: [39.19, 21.49], doha: [51.53, 25.29], kuwait: [47.98, 29.38],
  muscat: [58.38, 23.59], manama: [50.59, 26.23], amman: [35.93, 31.95], beirut: [35.5, 33.89], damascus: [36.28, 33.51],
  baghdad: [44.37, 33.32], cairo: [31.24, 30.04], casablanca: [-7.59, 33.57], tunis: [10.18, 36.81], algiers: [3.06, 36.75],
  sanaa: [44.19, 15.37], karachi: [67.0, 24.86], portlouis: [57.5, -20.16],
}
// Sample feed, illustrative of what the reporting app sends.
const FEED = [
  ['Perfect Store audit', 'doha', 'Doha, Qatar'], ['Shelf photo uploaded', 'riyadh', 'Riyadh, KSA'],
  ['Sampling complete', 'dubai', 'Dubai, UAE'], ['POSM installed', 'kuwait', 'Kuwait City'],
  ['Cooler audit', 'cairo', 'Cairo, Egypt'], ['Planogram corrected', 'muscat', 'Muscat, Oman'],
  ['Display installed', 'casablanca', 'Casablanca, Morocco'], ['Dealer survey logged', 'karachi', 'Karachi, Pakistan'],
  ['Price check', 'amman', 'Amman, Jordan'], ['Merchandiser visit', 'portlouis', 'Port Louis, Mauritius'],
]

export function initHeroGlobe({ root, canvas, reduced }) {
  const ctx = canvas.getContext('2d')
  // dots, pulses and labels animate on a light overlay; the globe redraws only when it moves
  const over = document.createElement('canvas')
  over.className = 'hero__globe-over'
  canvas.after(over)
  const octx = over.getContext('2d')
  const countries = feature(world, world.objects.countries).features
  countries.forEach(f => { f.id = String(f.id).padStart(3, '0'); f.net = !!NETWORK[f.id] })
  const land = countries.filter(f => !f.net)
  const net = countries.filter(f => f.net)
  // outlines only, for the far side seen through the globe
  const backLines = { type: 'MultiLineString', coordinates: countries.flatMap(f => (f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates).flat()) }
  const grat = geoGraticule10()
  // reveal order: distance from Dubai
  net.forEach(f => { f.delay = geoDistance(centroidOf(f), CITIES.dubai) * 0.9 })

  const front = geoOrthographic().clipAngle(90).precision(0.8)
  const back = geoOrthographic().clipAngle(null).precision(1.5)
  const pf = geoPath(front, ctx), pb = geoPath(back, ctx)

  const chip = root.querySelector('[data-chip]')
  const tip = root.querySelector('[data-tip]')

  // ---- layout
  let W = 0, H = 0, dpr = 1, R = 300, cx = 0, cy = 0, mobile = false, dirty = true
  function resize() {
    const r = root.getBoundingClientRect()
    W = r.width; H = r.height; mobile = W < 900
    dpr = Math.min(devicePixelRatio, 2)
    for (const c of [canvas, over]) { c.width = W * dpr; c.height = H * dpr; c.style.width = `${W}px`; c.style.height = `${H}px` }
    R = mobile ? W * 0.82 : Math.max(H * 0.64, W * 0.33)
    cx = mobile ? W * 0.36 : W * 0.71
    cy = mobile ? H * 0.34 : H * 0.6
    dirty = true
    for (const p of [front, back]) p.scale(R).translate([cx, cy])
  }
  resize()
  addEventListener('resize', resize)

  // ---- rotation state: spin in, drag, spring home
  const rot = { l: reduced ? HOME[0] : HOME[0] + 220, p: reduced ? HOME[1] : HOME[1] + 18 }
  const vel = { l: 0, p: 0 }
  let dragging = false, last = null, scroll = 0
  const t0 = performance.now()

  canvas.addEventListener('pointerdown', e => {
    dragging = true; last = [e.clientX, e.clientY]
    canvas.setPointerCapture(e.pointerId); canvas.classList.add('is-drag')
  })
  canvas.addEventListener('pointermove', e => {
    const r = canvas.getBoundingClientRect()
    const x = e.clientX - r.left, y = e.clientY - r.top
    if (dragging) {
      const k = 0.22 * (300 / R) * 1.6
      vel.l = (e.clientX - last[0]) * k
      vel.p = e.pointerType === 'mouse' ? -(e.clientY - last[1]) * k : 0
      rot.l += vel.l; rot.p = Math.max(-70, Math.min(40, rot.p + vel.p))
      last = [e.clientX, e.clientY]
      return
    }
    hover(x, y)
  })
  const release = () => { dragging = false; canvas.classList.remove('is-drag') }
  canvas.addEventListener('pointerup', release)
  canvas.addEventListener('pointercancel', release)
  canvas.addEventListener('pointerleave', () => { tip.classList.remove('is-on'); if (hovered) dirty = true; hovered = null })

  // ---- hover a network country
  let hovered = null
  function hover(x, y) {
    const ll = front.invert([x, y])
    const onGlobe = Math.hypot(x - cx, y - cy) < R
    const f = onGlobe && ll ? net.find(c => geoContains(c, ll)) : null
    if (f !== hovered) dirty = true
    hovered = f
    canvas.style.cursor = f ? 'pointer' : 'grab'
    if (f) {
      const [en, ar] = NETWORK[f.id]
      tip.innerHTML = `<b>${en}</b><span lang="ar" dir="rtl">${ar}</span>`
      tip.style.transform = `translate(${x + 14}px, ${y + 14}px)`
      tip.classList.add('is-on')
    } else tip.classList.remove('is-on')
  }

  // ---- live chip
  let feedI = 0, pinned = null
  const time = () => new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Dubai' }).format(new Date())
  function nextChip() {
    if (document.hidden) return
    const [msg, key, where] = FEED[feedIdx()]
    chip.classList.remove('is-on')
    setTimeout(() => {
      pinned = key
      chip.innerHTML = `<span class="ping"><span>${msg}<small>${where} · ${time()}</small></span></span>`
      placeChip()
      chip.classList.add('is-on')
    }, 260)
  }
  const feedIdx = () => feedI++ % FEED.length
  function placeChip() {
    if (!pinned) return
    const c = CITIES[pinned]
    const visible = geoDistance(c, [-rot.l, -rot.p]) < Math.PI / 2 - 0.15
    const [x, y] = front(c) || [0, 0]
    chip.style.left = `${x}px`; chip.style.top = `${y}px`
    chip.classList.toggle('is-left', W - x < 300)
    chip.classList.toggle('is-below', y < 120)
    chip.classList.toggle('is-hidden', !visible)
  }

  // ---- draw
  let visible = true
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) requestAnimationFrame(frame) }).observe(root)

  function frame(now) {
    if (!visible) return
    const t = (now - t0) / 1000

    // spring back to MENA when not dragging, then rest
    if (!dragging) {
      const tl = HOME[0] - scroll * 25, tp = HOME[1] + scroll * 8
      vel.l = vel.l * 0.9 + (tl - rot.l) * 0.012
      vel.p = vel.p * 0.9 + (tp - rot.p) * 0.012
      rot.l += vel.l; rot.p += vel.p
      if (Math.abs(vel.l) + Math.abs(vel.p) > 0.002) dirty = true
    } else dirty = true
    const revealing = !reduced && t < 0.9 + 1.6 + 0.6
    if (dirty || revealing) { drawGlobe(t); dirty = false }
    drawOverlay(t)
    placeChip()
    requestAnimationFrame(frame)
  }

  function drawGlobe(t) {
    front.rotate([rot.l, rot.p]); back.rotate([rot.l, rot.p])
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, W, H)

    // sphere body + rim
    const g = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.1, cx, cy, R)
    g.addColorStop(0, 'rgba(255,255,255,0.05)'); g.addColorStop(1, 'rgba(255,255,255,0.01)')
    ctx.beginPath(); pf({ type: 'Sphere' }); ctx.fillStyle = g; ctx.fill()
    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.stroke()

    // far side, seen through
    ctx.beginPath(); pb(backLines); ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.stroke()

    // red glow behind the region
    const d = front(CITIES.dubai)
    if (d) {
      const gl = ctx.createRadialGradient(d[0], d[1], 0, d[0], d[1], R * 0.6)
      gl.addColorStop(0, 'rgba(228,35,27,0.28)'); gl.addColorStop(1, 'rgba(228,35,27,0)')
      ctx.save(); ctx.beginPath(); pf({ type: 'Sphere' }); ctx.clip()
      ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H); ctx.restore()
    }

    // graticule + land
    ctx.beginPath(); pf(grat); ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.stroke()
    ctx.beginPath(); land.forEach(f => pf(f))
    ctx.fillStyle = 'rgba(255,255,255,0.035)'; ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 0.8; ctx.stroke()

    // network countries fill in from Dubai
    for (const f of net) {
      const a = reduced ? 1 : Math.max(0, Math.min(1, (t - 0.9 - f.delay) / 0.6))
      if (a <= 0) continue
      ctx.beginPath(); pf(f)
      ctx.fillStyle = f === hovered ? `rgba(255,70,60,${a})` : `rgba(228,35,27,${0.92 * a})`
      ctx.fill()
      ctx.strokeStyle = `rgba(255,255,255,${0.4 * a})`; ctx.lineWidth = 0.8; ctx.stroke()
    }

  }

  function drawOverlay(t) {
    octx.setTransform(dpr, 0, 0, dpr, 0, 0)
    octx.clearRect(0, 0, W, H)
    const ctx = octx
    // cities: dots + sonar pulses
    for (const [k, c] of Object.entries(CITIES)) {
      if (geoDistance(c, [-rot.l, -rot.p]) > Math.PI / 2 - 0.05) continue
      const [x, y] = front(c)
      const hq = k === 'dubai'
      if (!reduced) {
        for (const off of [0, 2.4]) {
          const ph = ((t + off - geoDistance(c, CITIES.dubai) * 1.5) % 4.8 + 4.8) % 4.8 / 4.8
          if (t < 1.4) continue
          ctx.beginPath(); ctx.arc(x, y, 4 + ph * (hq ? 46 : 30), 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(255,255,255,${0.5 * (1 - ph)})`; ctx.lineWidth = 1; ctx.stroke()
        }
      }
      ctx.beginPath(); ctx.arc(x, y, hq ? 5.5 : k === pinned ? 5 : 3.2, 0, Math.PI * 2)
      ctx.fillStyle = k === pinned && !hq ? '#E4231B' : '#fff'; ctx.fill()
      if (hq) { ctx.lineWidth = 3; ctx.strokeStyle = '#E4231B'; ctx.stroke() }
      if (hq) {
        ctx.font = '600 14px "Inter Tight", sans-serif'; ctx.fillStyle = '#fff'
        ctx.fillText('Dubai', x + 12, y + 18)
        ctx.font = '500 13px "Noto Kufi Arabic", sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.7)'
        ctx.fillText('دبي', x + 58, y + 18)
      }
    }
  }
  requestAnimationFrame(frame)
  setTimeout(() => { nextChip(); if (!reduced) setInterval(nextChip, 3000) }, reduced ? 0 : 2600)

  return { setScroll(v) { scroll = v } }
}

function centroidOf(f) {
  const ring = (f.geometry.type === 'Polygon' ? f.geometry.coordinates : f.geometry.coordinates.sort((a, b) => b[0].length - a[0].length)[0])[0]
  let x = 0, y = 0
  for (const [lon, lat] of ring) { x += lon; y += lat }
  return [x / ring.length, y / ring.length]
}
