// Hero WebGL: MENA drawn as ~20k "store" dots. Network countries glow red,
// the cursor is a scanner lens, arcs fly out of Dubai, sample field pings pop
// over cities, and on scroll the dots file themselves into a shelf planogram.
import * as THREE from 'three'

const K = 0.1                       // world units per degree
const C = { lon: 30, lat: 11 }      // projection centre
const project = (lat, lon) => new THREE.Vector2((lon - C.lon) * K, (lat - C.lat) * K)

export const CITIES = {
  dubai: { name: 'Dubai, UAE', lat: 25.2048, lon: 55.2708, tz: 'Asia/Dubai' },
  abudhabi: { name: 'Abu Dhabi, UAE', lat: 24.4539, lon: 54.3773, tz: 'Asia/Dubai' },
  sharjah: { name: 'Sharjah, UAE', lat: 25.3463, lon: 55.4209, tz: 'Asia/Dubai' },
  riyadh: { name: 'Riyadh, KSA', lat: 24.7136, lon: 46.6753, tz: 'Asia/Riyadh' },
  jeddah: { name: 'Jeddah, KSA', lat: 21.4858, lon: 39.1925, tz: 'Asia/Riyadh' },
  doha: { name: 'Doha, Qatar', lat: 25.2854, lon: 51.531, tz: 'Asia/Qatar' },
  kuwait: { name: 'Kuwait City', lat: 29.3759, lon: 47.9774, tz: 'Asia/Kuwait' },
  muscat: { name: 'Muscat, Oman', lat: 23.588, lon: 58.3829, tz: 'Asia/Muscat' },
  manama: { name: 'Manama, Bahrain', lat: 26.2285, lon: 50.586, tz: 'Asia/Bahrain' },
  amman: { name: 'Amman, Jordan', lat: 31.9454, lon: 35.9284, tz: 'Asia/Amman' },
  beirut: { name: 'Beirut, Lebanon', lat: 33.8938, lon: 35.5018, tz: 'Asia/Beirut' },
  damascus: { name: 'Damascus, Syria', lat: 33.5138, lon: 36.2765, tz: 'Asia/Damascus' },
  baghdad: { name: 'Baghdad, Iraq', lat: 33.3152, lon: 44.3661, tz: 'Asia/Baghdad' },
  cairo: { name: 'Cairo, Egypt', lat: 30.0444, lon: 31.2357, tz: 'Africa/Cairo' },
  casablanca: { name: 'Casablanca, Morocco', lat: 33.5731, lon: -7.5898, tz: 'Africa/Casablanca' },
  tunis: { name: 'Tunis, Tunisia', lat: 36.8065, lon: 10.1815, tz: 'Africa/Tunis' },
  algiers: { name: 'Algiers, Algeria', lat: 36.7538, lon: 3.0588, tz: 'Africa/Algiers' },
  sanaa: { name: "Sana'a, Yemen", lat: 15.3694, lon: 44.191, tz: 'Asia/Aden' },
  karachi: { name: 'Karachi, Pakistan', lat: 24.8607, lon: 67.0011, tz: 'Asia/Karachi' },
  portlouis: { name: 'Port Louis, Mauritius', lat: -20.1609, lon: 57.5012, tz: 'Indian/Mauritius' },
}

const ARC_TO = ['riyadh', 'doha', 'kuwait', 'muscat', 'manama', 'amman', 'beirut', 'damascus', 'baghdad', 'cairo', 'casablanca', 'tunis', 'algiers', 'sanaa', 'karachi', 'portlouis']

// Sample feed: illustrative of what the reporting app sends, not live data.
const FEED = [
  ['Perfect Store audit', 'doha'], ['Shelf photo uploaded', 'riyadh'], ['Sampling complete', 'dubai'],
  ['Mystery shop scored 92%', 'jeddah'], ['POSM installed', 'kuwait'], ['Planogram corrected', 'muscat'],
  ['OOS alert resolved', 'manama'], ['Cooler audit', 'cairo'], ['Promoter checked in', 'sharjah'],
  ['Dealer survey logged', 'karachi'], ['Price check', 'amman'], ['Display installed', 'casablanca'],
  ['Merchandiser visit', 'abudhabi'], ['Showroom scored 88%', 'riyadh'], ['Secondary display found', 'beirut'],
  ['VIP store audit', 'tunis'], ['Share of shelf: 34%', 'algiers'], ['Fixture check', 'baghdad'],
]

const vert = /* glsl */`
  attribute vec3 aGrid;
  attribute float aFlag;
  attribute float aRand;
  attribute float aBlock;
  uniform float uTime, uMorph, uIntro, uScale, uSize, uLensOn;
  uniform vec3 uMouse;
  uniform vec2 uDubai;
  uniform vec4 uPings[6];
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float d = distance(position.xy, uDubai);
    float intro = smoothstep(d * 0.11, d * 0.11 + 0.5, uIntro);
    float m = smoothstep(aRand * 0.45, aRand * 0.45 + 0.55, uMorph);
    vec3 p = mix(position, aGrid, m);

    float wave = smoothstep(0.92, 1.0, sin(d * 3.2 - uTime * 1.8)) * (1.0 - m);
    float lens = (1.0 - smoothstep(0.0, 0.9, distance(p.xy, uMouse.xy))) * uLensOn * (1.0 - m);

    float ping = 0.0;
    for (int i = 0; i < 6; i++) {
      float age = uTime - uPings[i].z;
      if (age > 0.0 && age < 2.6) {
        float fade = 1.0 - age / 2.6;
        float pd = distance(p.xy, uPings[i].xy);
        ping += (1.0 - smoothstep(0.0, 0.05, abs(pd - age * 0.38))) * fade;
        ping += (1.0 - smoothstep(0.0, 0.12, pd)) * fade;
      }
    }
    ping *= (1.0 - m);

    p.z += lens * 0.28 + wave * 0.05 * aFlag + ping * 0.1;
    p.z += (1.0 - intro) * 1.5 * (aRand - 0.5);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    float s = uSize * (0.75 + aFlag * 0.45 + lens * 1.5 + ping * 1.0 + wave * 0.2);
    s = mix(s, uSize * 1.05, m);
    gl_PointSize = s * uScale / -mv.z * intro;

    vec3 grey = vec3(0.33);
    vec3 red = vec3(0.894, 0.137, 0.106);
    vec3 col = mix(grey, red, aFlag);
    col = mix(col, vec3(1.0), clamp(lens * 0.9 + ping, 0.0, 1.0));
    vec3 shelf = mix(vec3(0.42), red, aBlock);
    shelf = mix(shelf, vec3(0.92), step(0.94, aRand) * (1.0 - aBlock));
    vColor = mix(col, shelf, m);
    vAlpha = intro * mix(0.5 + 0.5 * aFlag + lens * 0.5 + ping, 0.95, m);
  }
`

const frag = /* glsl */`
  varying vec3 vColor;
  varying float vAlpha;
  uniform float uMorph;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float circle = 1.0 - smoothstep(0.38, 0.5, length(c));
    float square = 1.0 - smoothstep(0.44, 0.5, max(abs(c.x), abs(c.y)));
    float a = mix(circle, square, smoothstep(0.6, 1.0, uMorph)) * vAlpha;
    if (a < 0.01) discard;
    gl_FragColor = vec4(vColor, a);
  }
`

const arcVert = /* glsl */`
  attribute float aT;
  attribute float aIdx;
  uniform float uDraw, uTime, uMorph;
  varying float vA;
  void main() {
    float start = aIdx * 0.045;
    float drawn = step(aT, clamp((uDraw - start) / 0.5, 0.0, 1.0));
    float pulse = 1.0 - smoothstep(0.0, 0.12, abs(aT - fract(uTime * 0.28 + aIdx * 0.173)));
    vA = drawn * (0.22 + pulse * 0.78) * (1.0 - uMorph);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const arcFrag = /* glsl */`
  varying float vA;
  void main() { if (vA < 0.01) discard; gl_FragColor = vec4(0.894, 0.137, 0.106, vA); }
`

export async function initMap({ canvas, pingLayer, hud, reduced }) {
  let renderer
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' })
  } catch {
    canvas.remove()
    return { setScroll() {} }
  }
  const { default: data } = await import('../data/map-dots.json')
  const dots = data.dots
  const N = dots.length

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100)
  const group = new THREE.Group()
  scene.add(group)

  // ---- points
  const pos = new Float32Array(N * 3)
  const grid = new Float32Array(N * 3)
  const flag = new Float32Array(N)
  const rand = new Float32Array(N)
  const block = new Float32Array(N)

  // Planogram target: dots sorted west→east fill shelf columns top→bottom.
  const order = dots.map((d, i) => i).sort((a, b) => dots[a][0] - dots[b][0] || dots[b][1] - dots[a][1])
  const COLS = 170, ROWS = Math.ceil(N / COLS), SHELF = 13
  const gx = 9.4 / COLS, gy = 0.046, shelfGap = 0.14
  const shelves = Math.ceil(ROWS / SHELF)
  const totalH = ROWS * gy + (shelves - 1) * shelfGap
  const hash = n => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s) }

  order.forEach((i, k) => {
    const col = Math.floor(k / ROWS), row = k % ROWS
    const shelf = Math.floor(row / SHELF)
    grid[i * 3] = -4.7 + col * gx
    grid[i * 3 + 1] = totalH / 2 - row * gy - shelf * shelfGap
    grid[i * 3 + 2] = 0
    const facing = Math.floor(col / 9) + shelf * 31
    block[i] = hash(facing) < 0.16 ? 1 : 0
  })
  dots.forEach(([lon, lat, f], i) => {
    const p = project(lat / 10, lon / 10)
    pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = 0
    flag[i] = f
    rand[i] = Math.random()
  })

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setAttribute('aGrid', new THREE.BufferAttribute(grid, 3))
  geo.setAttribute('aFlag', new THREE.BufferAttribute(flag, 1))
  geo.setAttribute('aRand', new THREE.BufferAttribute(rand, 1))
  geo.setAttribute('aBlock', new THREE.BufferAttribute(block, 1))

  const dubai = project(CITIES.dubai.lat, CITIES.dubai.lon)
  const uniforms = {
    uTime: { value: 0 }, uMorph: { value: 0 }, uIntro: { value: reduced ? 2 : 0 },
    uScale: { value: 1 }, uSize: { value: 0.024 }, uLensOn: { value: 0 },
    uMouse: { value: new THREE.Vector3(99, 99, 0) }, uDubai: { value: dubai },
    uPings: { value: Array.from({ length: 6 }, () => new THREE.Vector4(0, 0, -99, 0)) },
  }
  const mat = new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms, transparent: true, depthWrite: false })
  group.add(new THREE.Points(geo, mat))

  // ---- arcs out of Dubai
  const SEG = 72
  const arcPos = [], arcT = [], arcIdx = []
  ARC_TO.forEach((key, idx) => {
    const c = CITIES[key], b = project(c.lat, c.lon)
    const dist = dubai.distanceTo(b)
    const mid = new THREE.Vector3((dubai.x + b.x) / 2, (dubai.y + b.y) / 2, 0.25 + dist * 0.22)
    const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(dubai.x, dubai.y, 0), mid, new THREE.Vector3(b.x, b.y, 0))
    const pts = curve.getPoints(SEG)
    for (let s = 0; s < SEG; s++) {
      arcPos.push(pts[s].x, pts[s].y, pts[s].z, pts[s + 1].x, pts[s + 1].y, pts[s + 1].z)
      arcT.push(s / SEG, (s + 1) / SEG)
      arcIdx.push(idx, idx)
    }
  })
  const arcGeo = new THREE.BufferGeometry()
  arcGeo.setAttribute('position', new THREE.Float32BufferAttribute(arcPos, 3))
  arcGeo.setAttribute('aT', new THREE.Float32BufferAttribute(arcT, 1))
  arcGeo.setAttribute('aIdx', new THREE.Float32BufferAttribute(arcIdx, 1))
  const arcUniforms = { uDraw: { value: reduced ? 2 : 0 }, uTime: uniforms.uTime, uMorph: uniforms.uMorph }
  group.add(new THREE.LineSegments(arcGeo, new THREE.ShaderMaterial({ vertexShader: arcVert, fragmentShader: arcFrag, uniforms: arcUniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })))

  // ---- layout
  let W = 1, H = 1, mobile = false
  let baseTilt = -0.42
  function resize() {
    W = canvas.clientWidth; H = canvas.clientHeight
    mobile = W < 900
    baseTilt = mobile ? -0.18 : -0.42
    const dpr = Math.min(window.devicePixelRatio, 2)
    renderer.setPixelRatio(dpr)
    renderer.setSize(W, H, false)
    camera.aspect = W / H
    const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
    const wantW = mobile ? 8.6 : 9.6 / 0.66
    const wantH = mobile ? 7.4 : 6.6 / 0.92
    camera.position.z = Math.max(wantW / camera.aspect, wantH) / (2 * t)
    camera.updateProjectionMatrix()
    group.position.set(mobile ? 0.6 : 2.3, mobile ? 3.9 : 0.15, 0)
    uniforms.uScale.value = (H / 2) * camera.projectionMatrix.elements[5] * dpr
  }
  resize()
  window.addEventListener('resize', resize)

  // ---- pointer → plane
  const ray = new THREE.Raycaster()
  const ndc = new THREE.Vector2()
  const plane = new THREE.Plane()
  const hit = new THREE.Vector3()
  const mouseTarget = new THREE.Vector3(99, 99, 0)
  let tiltX = 0, tiltY = 0, lensTarget = 0
  const hero = canvas.parentElement
  hero.addEventListener('pointermove', e => {
    const r = canvas.getBoundingClientRect()
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
    tiltX = ndc.y; tiltY = ndc.x
    ray.setFromCamera(ndc, camera)
    group.updateMatrixWorld()
    plane.setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 0, 1).transformDirection(group.matrixWorld), group.getWorldPosition(new THREE.Vector3()))
    if (ray.ray.intersectPlane(plane, hit)) {
      group.worldToLocal(hit)
      mouseTarget.copy(hit)
      lensTarget = e.pointerType === 'mouse' ? 1 : 0
      updateHud(hit)
    }
  })
  hero.addEventListener('pointerleave', () => { lensTarget = 0 })

  function updateHud(p) {
    if (!hud) return
    const lat = p.y / K + C.lat, lon = p.x / K + C.lon
    hud.coord.textContent = `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'} ${Math.abs(lon).toFixed(2)}°${lon >= 0 ? 'E' : 'W'}`
    let best = null, bd = 1e9
    for (const c of Object.values(CITIES)) {
      const d = Math.hypot(c.lat - lat, c.lon - lon)
      if (d < bd) { bd = d; best = c }
    }
    hud.region.textContent = bd < 4 ? best.name : bd < 9 ? `Near ${best.name}` : 'Scanning…'
  }

  // ---- pings
  let pingSlot = 0, feedIdx = Math.floor(Math.random() * FEED.length)
  const tmp = new THREE.Vector3()
  function fmtTime(tz) {
    try { return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: tz }).format(new Date()) } catch { return '' }
  }
  function ping() {
    if (uniforms.uMorph.value > 0.25 || document.hidden) return
    const [msg, key] = FEED[feedIdx++ % FEED.length]
    const c = CITIES[key], p = project(c.lat, c.lon)
    uniforms.uPings.value[pingSlot++ % 6].set(p.x, p.y, uniforms.uTime.value, 1)
    if (!pingLayer) return
    tmp.set(p.x, p.y, 0.05)
    group.localToWorld(tmp).project(camera)
    const x = (tmp.x * 0.5 + 0.5) * W, y = (-tmp.y * 0.5 + 0.5) * H
    if (x < 20 || x > W - 200 || y < 90 || y > H - 40) return
    if (!mobile && x < W * 0.42) return
    const el = document.createElement('div')
    el.className = 'ping'
    el.innerHTML = `<span>${msg}<small>${c.name} · ${fmtTime(c.tz)}</small></span>`
    el.style.transform = `translate(${x + 10}px, ${y - 46}px)`
    pingLayer.appendChild(el)
    el.animate([{ opacity: 0, scale: '.6' }, { opacity: 1, scale: '1' }], { duration: 380, easing: 'cubic-bezier(.34,1.56,.64,1)' })
    setTimeout(() => {
      el.animate([{ opacity: 1 }, { opacity: 0, translate: '0 -8px' }], { duration: 300, fill: 'forwards' }).onfinish = () => el.remove()
    }, 2300)
  }

  // ---- loop
  let visible = true, scroll = 0, raf = 0
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) loop() }).observe(hero)
  const clock = new THREE.Clock()
  let introStart = performance.now()

  function loop() {
    raf = 0
    if (!visible) return
    const t = clock.getElapsedTime()
    uniforms.uTime.value = t
    if (!reduced) {
      const it = (performance.now() - introStart) / 1000
      uniforms.uIntro.value = Math.min(it / 1.6, 2)
      arcUniforms.uDraw.value = Math.max(0, (it - 0.9) / 1.4)
    }
    uniforms.uMouse.value.lerp(mouseTarget, 0.12)
    uniforms.uLensOn.value += (lensTarget - uniforms.uLensOn.value) * 0.08
    uniforms.uMorph.value += (scroll - uniforms.uMorph.value) * 0.1

    const m = uniforms.uMorph.value
    const tx = baseTilt + (reduced ? 0 : tiltX * 0.06) + m * 0.42
    const ty = (reduced ? 0 : -tiltY * 0.08) * (1 - m)
    group.rotation.x += (tx - group.rotation.x) * 0.06
    group.rotation.y += (ty - group.rotation.y) * 0.06
    group.position.z = m * 0.6

    renderer.render(scene, camera)
    raf = requestAnimationFrame(loop)
  }
  group.rotation.x = baseTilt
  loop()

  if (!reduced) {
    setTimeout(() => { ping(); setInterval(ping, 2400) }, 2600)
  }

  return {
    setScroll(v) { scroll = v; if (reduced) { uniforms.uMorph.value = v } },
  }
}
