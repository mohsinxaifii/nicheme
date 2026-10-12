// Samples a dot grid over MENA land from Natural Earth (world-atlas) and writes
// src/data/map-dots.json. Each dot: [lon*10, lat*10, flag] where flag = 1 when the
// dot sits inside one of Niche's 17 network countries.
import { readFileSync, writeFileSync } from 'node:fs'
import { feature } from 'topojson-client'

const topo = JSON.parse(readFileSync(new URL('../node_modules/world-atlas/countries-50m.json', import.meta.url)))
const countries = feature(topo, topo.objects.countries).features

const NETWORK = new Set(['784', '682', '634', '414', '512', '048', '400', '422', '760', '368', '818', '504', '788', '012', '887', '586', '480'])
const BOUNDS = { lon: [-18, 78], lat: [-22, 44] }
const STEP = 0.42

const polys = countries.map(f => {
  const g = f.geometry
  const rings = g.type === 'Polygon' ? [g.coordinates] : g.coordinates
  let minX = 180, minY = 90, maxX = -180, maxY = -90
  for (const p of rings) for (const [x, y] of p[0]) {
    minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y)
  }
  return { id: String(f.id).padStart(3, '0'), rings, bbox: [minX, minY, maxX, maxY] }
}).filter(c => c.bbox[2] > BOUNDS.lon[0] && c.bbox[0] < BOUNDS.lon[1] && c.bbox[3] > BOUNDS.lat[0] && c.bbox[1] < BOUNDS.lat[1])

function inRing(x, y, ring) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j]
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}
function countryAt(x, y) {
  for (const c of polys) {
    const [a, b, d, e] = c.bbox
    if (x < a || x > d || y < b || y > e) continue
    for (const poly of c.rings) {
      if (inRing(x, y, poly[0]) && !poly.slice(1).some(h => inRing(x, y, h))) return c.id
    }
  }
  return null
}

const dots = []
for (let lat = BOUNDS.lat[0]; lat <= BOUNDS.lat[1]; lat += STEP) {
  for (let lon = BOUNDS.lon[0]; lon <= BOUNDS.lon[1]; lon += STEP) {
    const id = countryAt(lon, lat)
    if (id) dots.push([Math.round(lon * 10), Math.round(lat * 10), NETWORK.has(id) ? 1 : 0])
  }
}
// Bahrain and Mauritius are smaller than the grid: plant a few dots by hand.
for (const [lon, lat] of [[50.55, 26.1], [50.6, 26.2], [50.5, 25.95], [57.55, -20.2], [57.6, -20.35], [57.5, -20.05]]) {
  dots.push([Math.round(lon * 10), Math.round(lat * 10), 1])
}

writeFileSync(new URL('../src/data/map-dots.json', import.meta.url), JSON.stringify({ bounds: BOUNDS, dots }))
console.log(`${dots.length} dots, ${dots.filter(d => d[2]).length} in network`)
