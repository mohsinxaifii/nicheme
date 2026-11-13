// Hero: a large transparent globe that bleeds off the screen. It spins in and
// settles on MENA, then drifts slowly around it; drag to rotate and it springs back. Niche's 17 countries
// fill red outward from Dubai, hovering a country lights it up and, on desktop, shows its name by the cursor.
import { geoOrthographic, geoPath, geoGraticule10, geoContains, geoDistance } from 'd3-geo'
import { feature } from 'topojson-client'
import world from 'world-atlas/countries-110m.json'

const HOME = [-33, -24]          // rotation that faces MENA (lon, lat)
const NETWORK = {
  '784': 'United Arab Emirates', '682': 'Saudi Arabia', '634': 'Qatar', '414': 'Kuwait', '512': 'Oman', '048': 'Bahrain',
  '400': 'Jordan', '422': 'Lebanon', '760': 'Syria', '368': 'Iraq', '818': 'Egypt', '504': 'Morocco', '788': 'Tunisia',
  '012': 'Algeria', '887': 'Yemen', '586': 'Pakistan', '480': 'Mauritius',
}
const DUBAI = [55.27, 25.2]

export function initHeroGlobe({ root, canvas, reduced }) {
  const ctx = canvas.getContext('2d')
  const countries = feature(world, world.objects.countries).features
  countries.forEach(f => { f.id = String(f.id).padStart(3, '0'); f.net = !!NETWORK[f.id] })
  const land = countries.filter(f => !f.net)
  const net = countries.filter(f => f.net)
  // outlines only, for the far side seen through the globe
  const backLines = { type: 'MultiLineString', coordinates: countries.flatMap(f => (f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates).flat()) }
  const grat = geoGraticule10()
  // reveal order: distance from Dubai
  net.forEach(f => { f.delay = geoDistance(centroidOf(f), DUBAI) * 0.9 })

  // coarser adaptive resampling: invisible at this size, far cheaper per redraw
  const front = geoOrthographic().clipAngle(90).precision(2)
  const back = geoOrthographic().clipAngle(null).precision(4)
  const pf = geoPath(front, ctx), pb = geoPath(back, ctx)

  // ---- layout
  const rtl = document.documentElement.dir === 'rtl'
  let W = 0, H = 0, dpr = 1, R = 300, cx = 0, cy = 0, mobile = false, dirty = true
  function resize() {
    const r = root.getBoundingClientRect()
    W = r.width; H = r.height; mobile = W < 900
    dpr = Math.min(devicePixelRatio, 2)
    for (const c of [canvas]) { c.width = W * dpr; c.height = H * dpr; c.style.width = `${W}px`; c.style.height = `${H}px` }
    R = mobile ? W * 0.82 : Math.max(H * 0.64, W * 0.33)
    // The hero copy sits on the reading side, so the globe is offset to the other
    // one. Mirror the offset in RTL; the map itself is never flipped.
    const f = mobile ? 0.36 : 0.71
    cx = W * (rtl ? 1 - f : f)
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
    if (e.pointerType === 'mouse' && !mobile) hover(x, y)
  })
  const release = () => { dragging = false; canvas.classList.remove('is-drag') }
  canvas.addEventListener('pointerup', release)
  canvas.addEventListener('pointercancel', release)
  canvas.addEventListener('pointerleave', () => { if (hovered) dirty = true; hovered = null })

  // ---- hover a network country
  let hovered = null, mouse = [0, 0]
  function hover(x, y) {
    if (hovered && (x !== mouse[0] || y !== mouse[1])) dirty = true   // label follows the cursor
    mouse = [x, y]
    const ll = front.invert([x, y])
    const onGlobe = Math.hypot(x - cx, y - cy) < R
    const f = onGlobe && ll ? net.find(c => geoContains(c, ll)) : null
    if (f !== hovered) dirty = true
    hovered = f
  }

  // ---- draw
  // one draw loop only: it stops off-screen and restarts once when the globe comes back
  let visible = true, looping = false
  const start = () => { if (!looping) { looping = true; requestAnimationFrame(frame) } }
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) start() }).observe(root)

  let lastNow = 0
  function frame(now) {
    if (!visible) { looping = false; lastNow = 0; return }
    const t = (now - t0) / 1000
    // time-based: the spring settles in the same time on a slow machine as a fast one
    const k = lastNow ? Math.min(4, (now - lastNow) / 16.667) : 1
    lastNow = now

    // spring back to MENA when not dragging, then drift slowly back and forth around it
    if (!dragging) {
      // drift eases in after the spin-in settles; a ~50s sway of ±8° lon, ±2° lat
      const ease = reduced ? 0 : Math.min(1, Math.max(0, (t - 3.5) / 4))
      const sway = t * (Math.PI * 2 / 50)
      const tl = HOME[0] + Math.sin(sway) * 8 * ease, tp = HOME[1] + Math.sin(sway * 0.7) * 2 * ease
      const damp = Math.pow(0.9, k)
      vel.l = vel.l * damp + (tl - rot.l) * 0.012 * k
      vel.p = vel.p * damp + (tp - rot.p) * 0.012 * k
      rot.l += vel.l * k; rot.p += vel.p * k
      if (Math.abs(vel.l) + Math.abs(vel.p) > 0.01 || Math.abs(tl - rot.l) + Math.abs(tp - rot.p) > 0.05) dirty = true
    } else dirty = true
    const revealing = !reduced && t < 0.9 + 1.6 + 0.6
    if (dirty || revealing) { drawGlobe(t); dirty = false }
    requestAnimationFrame(frame)
  }

  function drawGlobe(t) {
    front.rotate([rot.l, rot.p]); back.rotate([rot.l, rot.p])
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, W, H)

    // sphere body + rim
    const g = ctx.createRadialGradient(cx + (rtl ? 1 : -1) * R * 0.3, cy - R * 0.35, R * 0.1, cx, cy, R)
    g.addColorStop(0, 'rgba(255,255,255,0.05)'); g.addColorStop(1, 'rgba(255,255,255,0.01)')
    ctx.beginPath(); pf({ type: 'Sphere' }); ctx.fillStyle = g; ctx.fill()
    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.stroke()

    // far side, seen through
    ctx.beginPath(); pb(backLines); ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.stroke()

    // red glow behind the region
    const d = front(DUBAI)
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
      // dashed borders on the network countries
      ctx.setLineDash([3, 3]); ctx.lineCap = 'round'
      ctx.strokeStyle = `rgba(255,255,255,${0.55 * a})`; ctx.lineWidth = 0.9; ctx.stroke()
    }
    ctx.setLineDash([]); ctx.lineCap = 'butt'

    // country name by the cursor (desktop hover only)
    if (hovered && !dragging) {
      const name = NETWORK[hovered.id]
      ctx.font = `500 13px ${getComputedStyle(root).fontFamily}`
      const tw = ctx.measureText(name).width, pw = tw + 20, ph = 28
      let x = mouse[0] + (rtl ? -16 - pw : 16), y = mouse[1] - ph - 10
      x = Math.max(4, Math.min(W - pw - 4, x)); y = Math.max(4, y)
      ctx.beginPath(); ctx.roundRect(x, y, pw, ph, 6)
      ctx.fillStyle = 'rgba(10,10,10,0.88)'; ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1; ctx.stroke()
      ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left'
      ctx.fillText(name, x + 10, y + ph / 2 + 0.5)
    }

  }

  start()

  return { setScroll() {} }   // kept for callers; scrolling no longer turns the globe
}

function centroidOf(f) {
  const ring = (f.geometry.type === 'Polygon' ? f.geometry.coordinates : f.geometry.coordinates.sort((a, b) => b[0].length - a[0].length)[0])[0]
  let x = 0, y = 0
  for (const [lon, lat] of ring) { x += lon; y += lat }
  return [x / ring.length, y / ring.length]
}
