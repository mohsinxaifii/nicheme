// Generative "field photo" plates, one per service, seeded by slug so each case
// always draws the same picture. Stand-ins until Niche supplies real photos.

const RED = '#E4231B'

export function seedOf(str) {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19) }
  return h >>> 0
}
function rng(seed) {
  let a = seed
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}
const grey = (r, lo = 60, hi = 200) => { const v = Math.round(lo + r() * (hi - lo)); return `rgb(${v},${v},${v})` }

function backdrop(ctx, S, r) {
  const g = ctx.createLinearGradient(0, 0, 0, S)
  g.addColorStop(0, '#3a3a3a'); g.addColorStop(1, '#151515')
  ctx.fillStyle = g; ctx.fillRect(0, 0, S, S)
  // ceiling lights
  ctx.fillStyle = 'rgba(255,255,255,.08)'
  for (let i = 0; i < 4; i++) ctx.fillRect(S * (0.1 + i * 0.24), S * 0.04, S * 0.14, S * 0.012)
}

function shelves(ctx, S, r, { posm = false } = {}) {
  const rows = 4 + Math.floor(r() * 2)
  const top = S * 0.14, bottom = S * 0.92, h = (bottom - top) / rows
  const redRow = Math.floor(r() * rows)
  for (let i = 0; i < rows; i++) {
    const y = top + i * h
    let x = S * 0.05
    const redStart = S * (0.2 + r() * 0.4), redEnd = redStart + S * (0.16 + r() * 0.12)
    while (x < S * 0.95) {
      const w = S * (0.03 + r() * 0.05)
      const bh = h * (0.5 + r() * 0.38)
      const isRed = i === redRow && x > redStart && x < redEnd
      ctx.fillStyle = isRed ? RED : grey(r, 70, 210)
      ctx.fillRect(x, y + h - bh - h * 0.08, w - S * 0.006, bh)
      if (!isRed && r() < 0.3) { ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(x + w * 0.2, y + h - bh * 0.6, w * 0.4, bh * 0.12) }
      x += w
    }
    ctx.fillStyle = '#d6d6d6'; ctx.fillRect(S * 0.03, y + h - h * 0.08, S * 0.94, h * 0.07)
    ctx.fillStyle = '#9a9a9a'; ctx.fillRect(S * 0.03, y + h - h * 0.015, S * 0.94, h * 0.02)
    // shelf price tags
    for (let t = 0; t < 6; t++) { ctx.fillStyle = t % 3 ? '#fff' : '#ffe9e8'; ctx.fillRect(S * (0.07 + t * 0.15), y + h - h * 0.075, S * 0.05, h * 0.05) }
    if (i === redRow) {
      // detection box around the audited facing
      ctx.setLineDash([S * 0.012, S * 0.008]); ctx.strokeStyle = '#fff'; ctx.lineWidth = S * 0.005
      ctx.strokeRect(redStart - S * 0.01, y + h * 0.05, redEnd - redStart + S * 0.06, h * 0.82); ctx.setLineDash([])
      ctx.fillStyle = '#fff'; ctx.fillRect(redStart - S * 0.01, y + h * 0.05 - S * 0.04, S * 0.16, S * 0.04)
      ctx.fillStyle = '#111'; ctx.font = `600 ${S * 0.024}px JetBrains Mono, monospace`
      ctx.fillText('SKU ✓ 100%', redStart, y + h * 0.05 - S * 0.012)
    }
  }
  if (posm) {
    const x = S * (0.25 + r() * 0.5)
    ctx.strokeStyle = '#bbb'; ctx.lineWidth = S * 0.003
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, S * 0.2); ctx.stroke()
    ctx.fillStyle = RED
    ctx.beginPath(); ctx.moveTo(x - S * 0.1, S * 0.2); ctx.lineTo(x + S * 0.1, S * 0.2); ctx.lineTo(x, S * 0.36); ctx.closePath(); ctx.fill()
    ctx.fillStyle = '#fff'; ctx.font = `800 ${S * 0.04}px Inter Tight, sans-serif`; ctx.textAlign = 'center'
    ctx.fillText('NEW', x, S * 0.26); ctx.textAlign = 'left'
  }
}

function showroom(ctx, S, r) {
  ctx.fillStyle = '#202020'; ctx.fillRect(0, 0, S, S)
  // floor perspective
  ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = S * 0.002
  const vx = S * (0.4 + r() * 0.2), vy = S * 0.42
  for (let i = -8; i <= 8; i++) { ctx.beginPath(); ctx.moveTo(vx, vy); ctx.lineTo(vx + i * S * 0.18, S); ctx.stroke() }
  for (let i = 1; i < 8; i++) { const y = vy + (S - vy) * Math.pow(i / 8, 1.8); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(S, y); ctx.stroke() }
  // windows
  for (let i = 0; i < 5; i++) { ctx.fillStyle = `rgba(255,255,255,${0.05 + r() * 0.08})`; ctx.fillRect(S * (0.04 + i * 0.19), S * 0.08, S * 0.16, S * 0.3) }
  // car-ish silhouettes
  for (let i = 0; i < 2; i++) {
    const cx = S * (0.28 + i * 0.44), cy = S * (0.66 + i * 0.06), w = S * 0.36
    ctx.fillStyle = i ? RED : grey(r, 120, 190)
    ctx.beginPath()
    ctx.moveTo(cx - w / 2, cy); ctx.quadraticCurveTo(cx - w * 0.38, cy - w * 0.2, cx - w * 0.15, cy - w * 0.24)
    ctx.lineTo(cx + w * 0.18, cy - w * 0.24); ctx.quadraticCurveTo(cx + w * 0.36, cy - w * 0.14, cx + w / 2, cy - w * 0.04)
    ctx.lineTo(cx + w / 2, cy + w * 0.05); ctx.lineTo(cx - w / 2, cy + w * 0.05); ctx.closePath(); ctx.fill()
    ctx.fillStyle = '#111'
    for (const k of [-0.3, 0.3]) { ctx.beginPath(); ctx.arc(cx + w * k, cy + w * 0.05, w * 0.07, 0, 7); ctx.fill() }
  }
  // magnifier
  const mx = S * (0.55 + r() * 0.2), my = S * (0.32 + r() * 0.15), mr = S * 0.13
  ctx.strokeStyle = '#fff'; ctx.lineWidth = S * 0.018
  ctx.beginPath(); ctx.arc(mx, my, mr, 0, 7); ctx.stroke()
  ctx.lineWidth = S * 0.03; ctx.strokeStyle = RED
  ctx.beginPath(); ctx.moveTo(mx + mr * 0.7, my + mr * 0.7); ctx.lineTo(mx + mr * 1.5, my + mr * 1.5); ctx.stroke()
  ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.arc(mx, my, mr * 0.9, 0, 7); ctx.fill()
  ctx.fillStyle = '#fff'; ctx.font = `700 ${S * 0.06}px Inter Tight, sans-serif`; ctx.textAlign = 'center'
  ctx.fillText(`${80 + Math.floor(r() * 18)}%`, mx, my + S * 0.02); ctx.textAlign = 'left'
}

function kiosk(ctx, S, r) {
  backdrop(ctx, S, r)
  ctx.fillStyle = '#2a2a2a'; ctx.fillRect(0, S * 0.62, S, S * 0.38)
  const kx = S * (0.3 + r() * 0.2), kw = S * 0.38
  // canopy + counter
  ctx.fillStyle = RED; ctx.fillRect(kx, S * 0.2, kw, S * 0.09)
  for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? '#fff' : RED; ctx.beginPath(); ctx.arc(kx + kw * (i + 0.5) / 6, S * 0.29, kw / 12, 0, Math.PI); ctx.fill() }
  ctx.fillStyle = '#ddd'; ctx.fillRect(kx + kw * 0.06, S * 0.29, S * 0.01, S * 0.24); ctx.fillRect(kx + kw * 0.92, S * 0.29, S * 0.01, S * 0.24)
  ctx.fillStyle = RED; ctx.fillRect(kx, S * 0.5, kw, S * 0.18)
  ctx.fillStyle = '#fff'; ctx.font = `800 ${S * 0.045}px Inter Tight, sans-serif`; ctx.textAlign = 'center'
  ctx.fillText('TRY ME', kx + kw / 2, S * 0.61); ctx.textAlign = 'left'
  // crowd
  for (let i = 0; i < 26; i++) {
    const x = r() * S, y = S * (0.7 + r() * 0.26), s = S * (0.03 + (y / S - 0.7) * 0.08)
    ctx.fillStyle = r() < 0.12 ? RED : grey(r, 90, 220)
    ctx.beginPath(); ctx.arc(x, y - s * 1.6, s * 0.7, 0, 7); ctx.fill()
    ctx.beginPath(); ctx.ellipse(x, y, s, s * 1.1, 0, Math.PI, 0); ctx.fill()
  }
  // confetti
  for (let i = 0; i < 40; i++) { ctx.fillStyle = r() < 0.5 ? RED : '#fff'; ctx.save(); ctx.translate(r() * S, r() * S * 0.5); ctx.rotate(r() * 3); ctx.fillRect(0, 0, S * 0.012, S * 0.006); ctx.restore() }
}

function blueprint(ctx, S, r, { fsu = false } = {}) {
  ctx.fillStyle = '#1c1c1c'; ctx.fillRect(0, 0, S, S)
  ctx.strokeStyle = 'rgba(255,255,255,.07)'; ctx.lineWidth = 1
  for (let i = 0; i <= 20; i++) { const p = (i / 20) * S; ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, S); ctx.moveTo(0, p); ctx.lineTo(S, p); ctx.stroke() }
  const cx = S * 0.5, cy = S * 0.56, a = S * 0.2
  const iso = (x, y, z) => [cx + (x - y) * a * 0.87, cy + (x + y) * a * 0.5 - z * a]
  const box = (x, y, z, w, d, h, top, left, right) => {
    const P = (px, py, pz) => iso(x + px, y + py, z + pz)
    const face = (pts, c) => { ctx.fillStyle = c; ctx.beginPath(); pts.forEach(([px, py], i) => i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = S * 0.002; ctx.stroke() }
    face([P(0, 0, h), P(w, 0, h), P(w, d, h), P(0, d, h)], top)
    face([P(0, d, 0), P(w, d, 0), P(w, d, h), P(0, d, h)], left)
    face([P(w, 0, 0), P(w, d, 0), P(w, d, h), P(w, 0, h)], right)
  }
  if (fsu) {
    box(-0.4, -0.4, 0, 0.8, 0.8, 1.3, '#555', '#333', '#444')
    for (let i = 0; i < 4; i++) box(-0.42, -0.42, 0.2 + i * 0.27, 0.84, 0.84, 0.03, '#ddd', '#999', '#bbb')
    box(-0.42, -0.42, 1.3, 0.84, 0.84, 0.3, RED, '#a51912', '#c51f17')
  } else {
    const n = 2 + Math.floor(r() * 3)
    for (let i = 0; i < n; i++) {
      const h = 0.4 + r() * 1.1
      box(-1 + i * 0.75, -0.3, 0, 0.6, 0.6, h, i === 1 ? RED : '#4a4a4a', i === 1 ? '#a51912' : '#2c2c2c', i === 1 ? '#c51f17' : '#3a3a3a')
    }
  }
  ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.font = `500 ${S * 0.022}px JetBrains Mono, monospace`
  ctx.fillText(`W ${1200 + Math.floor(r() * 1800)} · H ${1800 + Math.floor(r() * 600)} · D ${400 + Math.floor(r() * 400)} mm`, S * 0.06, S * 0.95)
}

function grain(ctx, S, r) {
  const n = Math.floor(S * 1.4)
  for (let i = 0; i < n; i++) { ctx.fillStyle = `rgba(255,255,255,${r() * 0.07})`; ctx.fillRect(r() * S, r() * S, 1.5, 1.5) }
  const v = ctx.createRadialGradient(S / 2, S / 2, S * 0.3, S / 2, S / 2, S * 0.75)
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.55)')
  ctx.fillStyle = v; ctx.fillRect(0, 0, S, S)
}

export function drawArt(canvas, { service, slug }, size = 600) {
  const S = size
  canvas.width = S; canvas.height = S
  const ctx = canvas.getContext('2d')
  const r = rng(seedOf(slug))
  switch (service) {
    case 'audits': backdrop(ctx, S, r); shelves(ctx, S, r); break
    case 'merch': backdrop(ctx, S, r); shelves(ctx, S, r, { posm: true }); break
    case 'mystery': showroom(ctx, S, r); break
    case 'activation': kiosk(ctx, S, r); break
    case 'install': blueprint(ctx, S, r); break
    case 'production': blueprint(ctx, S, r, { fsu: true }); break
    default: backdrop(ctx, S, r); shelves(ctx, S, r)
  }
  grain(ctx, S, r)
}

const fmtCoord = (lat, lon) =>
  `${Math.abs(lat).toFixed(4)}°${lat >= 0 ? 'N' : 'S'} ${Math.abs(lon).toFixed(4)}°${lon >= 0 ? 'E' : 'W'}`

export function geoStamp([lat, lon], slug) {
  const r = rng(seedOf(slug + 't'))
  const jitter = () => (r() - 0.5) * 0.08
  const h = String(8 + Math.floor(r() * 11)).padStart(2, '0'), m = String(Math.floor(r() * 60)).padStart(2, '0')
  return {
    coord: fmtCoord(lat + jitter(), lon + jitter()),
    time: `${h}:${m}:${String(Math.floor(r() * 60)).padStart(2, '0')}`,
  }
}
