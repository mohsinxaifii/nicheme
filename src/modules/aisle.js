// Hero: a supermarket aisle in WebGL whose shelves are stocked with Niche's real
// case-study photos. The camera glides down the aisle (faster as you scroll),
// photos sit in grayscale fog and come to colour under the cursor, and a click
// opens that case study.
import * as THREE from 'three'
import { cases, SERVICE_LABEL } from '../data/cases.js'

const BASE = import.meta.env.BASE_URL
const ROWS = [-1.55, 0.2, 1.95]         // shelf heights
const SIZE = 1.45                        // photo size (world units)
const STEP = 1.85                        // spacing along the aisle
const COLS = 18                          // photos per row per side
const LEN = COLS * STEP                  // aisle length before it loops
const HALF = 2.7                         // aisle half-width

const tileVert = /* glsl */`
  varying vec2 vUv;
  varying float vDepth;
  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`
const tileFrag = /* glsl */`
  uniform sampler2D uMap;
  uniform float uHas, uHover, uReveal;
  varying vec2 vUv;
  varying float vDepth;
  void main() {
    vec3 tex = texture2D(uMap, vUv).rgb;
    vec3 base = mix(vec3(0.13), tex, uHas);
    float g = dot(base, vec3(0.299, 0.587, 0.114));
    vec3 col = mix(vec3(g) * vec3(1.0, 0.94, 0.92), base, uHover);
    // thin frame
    vec2 e = min(vUv, 1.0 - vUv);
    float frame = 1.0 - step(0.018, min(e.x, e.y));
    col = mix(col, mix(vec3(0.9), vec3(0.894, 0.137, 0.106), uHover), frame);
    float fog = smoothstep(3.5, 26.0, vDepth);
    col = mix(col, vec3(0.039), fog);
    col *= 0.55 + 0.45 * uHover + 0.25 * (1.0 - fog);
    gl_FragColor = vec4(col, uReveal);
  }
`
const fogVert = tileVert
const flatFrag = /* glsl */`
  uniform vec3 uColor;
  uniform float uNear, uFar;
  varying vec2 vUv;
  varying float vDepth;
  void main() {
    float fog = smoothstep(uNear, uFar, vDepth);
    gl_FragColor = vec4(mix(uColor, vec3(0.039), fog), 1.0);
  }
`
const floorFrag = /* glsl */`
  varying vec2 vUv;
  varying float vDepth;
  uniform float uShift;
  void main() {
    float lines = smoothstep(0.96, 1.0, fract(vUv.y * 40.0 + uShift));
    float mid = 1.0 - smoothstep(0.0, 0.004, abs(vUv.x - 0.5));
    vec3 col = vec3(0.06) + lines * 0.05 + mid * vec3(0.5, 0.06, 0.05);
    float fog = smoothstep(2.0, 24.0, vDepth);
    gl_FragColor = vec4(mix(col, vec3(0.039), fog), 1.0);
  }
`

export function initAisle({ canvas, label, reduced }) {
  let renderer
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' }) }
  catch { canvas.remove(); return { setScroll() {} } }
  renderer.setClearColor(0x0a0a0a, 1)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 60)
  const world = new THREE.Group()
  scene.add(world)

  // ---- photos on both walls
  const loader = new THREE.TextureLoader()
  const textures = cases.map(c => {
    const t = loader.load(`${BASE}work/${c.slug}/cover.webp`, () => { mats.filter(m => m.userData.ci === cases.indexOf(c)).forEach(m => { m.uniforms.uHas.value = 1 }) })
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 4
    return t
  })
  const geo = new THREE.PlaneGeometry(SIZE, SIZE)
  const mats = []
  const tiles = []
  let n = 0
  for (const side of [-1, 1]) {
    ROWS.forEach((y, r) => {
      for (let i = 0; i < COLS; i++) {
        const ci = (n * 7 + r * 3) % cases.length; n++
        const mat = new THREE.ShaderMaterial({
          vertexShader: tileVert, fragmentShader: tileFrag, transparent: true,
          uniforms: { uMap: { value: textures[ci] }, uHas: { value: 0 }, uHover: { value: 0 }, uReveal: { value: reduced ? 1 : 0 } },
        })
        mat.userData.ci = ci
        const m = new THREE.Mesh(geo, mat)
        m.position.set(side * HALF, y, -i * STEP - (r % 2) * STEP * 0.5)
        m.rotation.y = -side * Math.PI / 2 * 0.92
        m.userData = { ci, target: 0, delay: i * 0.05 + r * 0.08 + (side > 0 ? 0.04 : 0) }
        world.add(m); mats.push(mat); tiles.push(m)
      }
    })
  }

  // ---- shelves: red edges under each row, ceiling light strips, floor
  const strip = (w, h, d, color, near = 3, far = 26) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d),
    new THREE.ShaderMaterial({ vertexShader: fogVert, fragmentShader: flatFrag, uniforms: { uColor: { value: new THREE.Color(color) }, uNear: { value: near }, uFar: { value: far } } }))
  for (const side of [-1, 1]) {
    ROWS.forEach(y => {
      const s = strip(0.5, 0.07, LEN * 2, 0xE4231B)
      s.position.set(side * (HALF + 0.05), y - SIZE / 2 - 0.08, -LEN / 2)
      world.add(s)
    })
  }
  const lights = []
  for (let i = 0; i < 12; i++) {
    const l = strip(1.4, 0.03, 0.5, 0xf2f2f2, 2, 30)
    l.position.set(0, 3.4, -i * 3.2)
    world.add(l); lights.push(l)
  }
  const floorMat = new THREE.ShaderMaterial({ vertexShader: fogVert, fragmentShader: floorFrag, uniforms: { uShift: { value: 0 } } })
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(HALF * 2, LEN * 2), floorMat)
  floor.rotation.x = -Math.PI / 2
  floor.position.set(0, -2.55, -LEN / 2)
  world.add(floor)

  // ---- layout
  let W = 1, H = 1, mobile = false
  function resize() {
    W = canvas.clientWidth; H = canvas.clientHeight
    mobile = W < 900
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    renderer.setSize(W, H, false)
    camera.aspect = W / H
    camera.fov = mobile ? 70 : 58
    // push the vanishing point to the right on desktop so the headline has room
    if (!mobile) camera.setViewOffset(W * 1.5, H, 0, 0, W, H)
    else camera.clearViewOffset()
    camera.updateProjectionMatrix()
  }
  resize()
  addEventListener('resize', resize)

  // ---- interaction
  const ray = new THREE.Raycaster()
  const ndc = new THREE.Vector2(9, 9)
  let hovered = null, mx = 0, my = 0
  canvas.parentElement.addEventListener('pointermove', e => {
    const r = canvas.getBoundingClientRect()
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
    mx = ndc.x; my = ndc.y
    if (label) label.style.transform = `translate(${e.clientX - r.left + 16}px, ${e.clientY - r.top + 16}px)`
  })
  canvas.parentElement.addEventListener('pointerleave', () => { ndc.set(9, 9) })
  canvas.addEventListener('click', () => {
    if (hovered) dispatchEvent(new CustomEvent('niche:open-case', { detail: cases[hovered.userData.ci].slug }))
  })

  // ---- loop
  let visible = true, scroll = 0, z = 0, speed = reduced ? 0 : 0.012
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) requestAnimationFrame(loop) }).observe(canvas)
  const t0 = performance.now()
  const camPos = new THREE.Vector3(0, 0.15, 6)

  function loop() {
    if (!visible) return
    const t = (performance.now() - t0) / 1000

    // intro glide + idle drift + scroll push
    const intro = reduced ? 1 : Math.min(1, t / 2.4)
    const ease = 1 - Math.pow(1 - intro, 3)
    z -= speed + scroll * 0.09
    camPos.set(mx * 0.35, 0.15 + my * 0.22, 6 - ease * 5.2)
    camera.position.lerp(camPos, 0.08)
    camera.rotation.set(my * 0.05, -mx * 0.09, 0)

    // loop the aisle: wrap photos that pass behind the camera
    world.position.z = -z
    for (const m of tiles) {
      const wz = m.position.z + world.position.z
      if (wz > camera.position.z + 2) m.position.z -= LEN
      else if (wz < camera.position.z - LEN + 2) m.position.z += LEN
      const reveal = reduced ? 1 : Math.min(1, Math.max(0, (t - 0.3 - m.userData.delay) / 0.6))
      m.material.uniforms.uReveal.value = reveal
    }
    for (const l of lights) {
      const wz = l.position.z + world.position.z
      if (wz > camera.position.z + 2) l.position.z -= 12 * 3.2
    }
    floorMat.uniforms.uShift.value = -z / (LEN * 2) * 40

    // hover
    ray.setFromCamera(ndc, camera)
    const hit = ray.intersectObjects(tiles, false)[0]
    const h = hit && hit.distance < 14 ? hit.object : null
    if (h !== hovered) {
      hovered = h
      canvas.style.cursor = h ? 'pointer' : ''
      if (label) {
        label.classList.toggle('is-on', !!h)
        if (h) { const c = cases[h.userData.ci]; label.innerHTML = `<b>${c.brand}</b><span>${SERVICE_LABEL[c.service]} · ${c.stat} ${c.statLabel}</span>` }
      }
    }
    for (const m of tiles) {
      const u = m.material.uniforms.uHover
      u.value += ((m === hovered ? 1 : 0) - u.value) * 0.12
    }
    speed += ((hovered ? 0.002 : reduced ? 0 : 0.012) - speed) * 0.05

    renderer.render(scene, camera)
    requestAnimationFrame(loop)
  }
  loop()

  return { setScroll(v) { scroll = v } }
}
