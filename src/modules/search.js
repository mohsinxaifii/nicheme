// Site search: a command palette opened from the header button, Ctrl/⌘ K or "/".
// The index (services, case studies, projects, pages) is built in the browser from
// the same data files the pages are generated from, built on first intent so the
// first paint never pays for it. Matching is instant: tokens are matched against
// title, subtitle and keywords (word starts score highest), with a fuzzy fallback
// for typos and partial words. Results are real links, so page transitions apply.
import { icon } from '../data/icons.js'
import { allServices } from '../data/services.js'
import { cases, SERVICE_LABEL } from '../data/cases.js'
import { standaloneProjects, projectStat, caseScore, projectScore, caseCover } from '../data/work.js'

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '')
const url = p => BASE + p
const RECENT_KEY = 'niche-search-recent'
const TYPES = [['all', 'All'], ['service', 'Services'], ['case', 'Case studies'], ['page', 'Pages']]
const TYPE_LABEL = { service: 'Service', case: 'Case study', project: 'Project', page: 'Page' }
const GROUP_LABEL = { service: 'Services', case: 'Case studies', project: 'Projects', page: 'Pages' }
const PER_GROUP = 6

const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9%+]+/g, ' ').trim()
const escHtml = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

// ---------------------------------------------------------------- index
let INDEX = null
async function buildIndex() {
  if (INDEX) return INDEX
  const SVC_ICON = { audits: 'audit', merch: 'merch', mystery: 'mystery', research: 'research', activation: 'promo', sampling: 'sampling', events: 'events', reporting: 'reporting', digital: 'digital' }
  const items = []
  const add = it => items.push({ ...it, _t: norm(it.title), _s: norm(it.sub), _k: norm(it.keys) })

  const pages = [
    ['Home', '/', 'Field marketing across MENA', 'home start', 'building'],
    ['About Niche', '/about/', 'Company, history and team since 2003', 'about company who we are history 2003 dubai', 'building'],
    ['Our network', '/about/#network', '17 countries, 20+ offices', 'network offices countries locations map gcc mena', 'globe'],
    ['Industries', '/about/#industries', 'FMCG, beverages, telecom, automotive, retail', 'industries sectors fmcg food beverages spirits telecom electronics automotive retail hypermarkets luxury', 'store'],
    ['Group companies', '/about/#group', 'Niche Star Advertising, Niche Cape Shipping, Connexis', 'group companies niche star advertising cape shipping connexis negt mishkat', 'factory'],
    ['How we work', '/about/#how', 'Brief, deploy, execute, report', 'process how we work steps brief deploy execute report', 'route'],
    ['All services', '/services/', '14 field marketing services', 'services all list', 'dashboard'],
    ['Case studies', '/case-studies/', 'Case studies and projects by service', 'case studies work portfolio clients', 'brief'],
    ['Contact', '/contact/', 'Request a proposal, offices and phone', 'contact proposal quote brief phone email address office directions', 'mail'],
    ['Careers', '/careers/', 'Field, workshop and office roles', 'careers jobs hiring vacancies apply cv work merchandiser auditor promoter', 'users'],
  ]
  pages.forEach(([title, href, sub, keys, ic]) => add({ type: 'page', title, sub, keys, href, icon: ic, rank: 2 }))

  allServices().forEach(s => add({
    type: 'service', title: s.name, sub: s.line, href: `/services/${s.slug}/`, icon: s.icon, thumb: s.photo ? `/${s.photo}` : null,
    keys: [s.group, s.seo, s.included.join(' '), s.body].join(' '), rank: 3,
  }))

  cases.forEach(c => add({
    type: 'case', title: c.brand, sub: [c.title, SERVICE_LABEL[c.service], c.where].filter(Boolean).join(' · '),
    href: `/case-studies/${c.slug}/`, icon: SVC_ICON[c.service], thumb: caseCover(c.slug) ? `/${caseCover(c.slug)}` : null,
    keys: [c.title, SERVICE_LABEL[c.service], c.where, c.challenge, c.did.join(' '), c.result, c.stat, c.statLabel].join(' '), rank: 1 + caseScore(c) / 200,
  }))

  standaloneProjects.forEach(p => {
    const [stat, label] = projectStat(p)
    add({
      type: 'case', title: p.brand, sub: [p.title, p.countries.join(', ')].join(' · '),
      href: `/case-studies/${p.slug}/`, icon: SVC_ICON[p.service], thumb: p.photos.length ? `/projects/${p.slug}/cover.webp` : null,
      keys: [p.title, SERVICE_LABEL[p.service], p.countries.join(' '), p.countries.includes('KSA') ? 'saudi arabia' : '', (p.programmes || []).map(x => x.title).join(' '), stat, label].join(' '), rank: projectScore(p) / 200,
    })
  })
  INDEX = items
  return items
}

// ---------------------------------------------------------------- matching
const wordStart = (hay, tok) => hay.startsWith(tok) || hay.includes(' ' + tok)
// edit distance with transpositions, stopped early once it exceeds max
function dist(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1
  let prev2 = null, prev = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]; let low = i
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
      if (prev2 && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) cur[j] = Math.min(cur[j], prev2[j - 2] + 1)
      low = Math.min(low, cur[j])
    }
    if (low > max) return max + 1
    prev2 = prev; prev = cur
  }
  return prev[b.length]
}
// typo-tolerant match of one token against the words of hay: a whole word or the
// start of one (so half-typed words still match), allowing 1 slip (2 for long words)
function fuzzy(hay, tok) {
  if (tok.length < 4) return 0
  const max = tok.length >= 7 ? 2 : 1
  let best = 0
  for (const w of hay.split(' ')) {
    if (w.length < 3) continue
    const d = Math.min(dist(tok, w, max), w.length > tok.length ? dist(tok, w.slice(0, tok.length), max) : max + 1)
    if (d <= max) best = Math.max(best, 4 - d * 1.5)
  }
  return best
}
function scoreItem(it, toks, q) {
  let total = 0
  for (const t of toks) {
    let s = 0
    const inner = t.length >= 4   // short tokens only match at the start of a word ("red" ≠ "delivered")
    if (wordStart(it._t, t)) s = 10
    else if (inner && it._t.includes(t)) s = 6
    else if (wordStart(it._s, t)) s = 5
    else if (inner && it._s.includes(t)) s = 3
    else if (wordStart(it._k, t)) s = 2
    else if (inner && it._k.includes(t)) s = 1
    else s = fuzzy(it._t, t) || fuzzy(it._s, t) * 0.6 || fuzzy(it._k, t) * 0.3
    if (!s) return 0
    total += s
  }
  if (it._t === q) total += 20
  else if (it._t.startsWith(q)) total += 8
  return total + it.rank
}

// wrap the query's tokens in <mark> inside a display string
function highlight(text, toks) {
  const src = String(text), low = src.toLowerCase(), marks = []
  for (const t of toks) {
    if (t.length < 1) continue
    let i = low.indexOf(t)
    while (i > -1) {
      if (t.length >= 4 || i === 0 || !/[a-z0-9]/.test(low[i - 1])) marks.push([i, i + t.length])
      i = low.indexOf(t, i + t.length)
    }
  }
  if (!marks.length) return escHtml(src)
  marks.sort((a, b) => a[0] - b[0])
  let out = '', at = 0
  for (const [a, b] of marks) { if (a < at) continue; out += escHtml(src.slice(at, a)) + '<mark>' + escHtml(src.slice(a, b)) + '</mark>'; at = b }
  return out + escHtml(src.slice(at))
}

const recent = {
  get() { try { return JSON.parse(localStorage.getItem(RECENT_KEY)) || [] } catch { return [] } },
  push(href) { try { localStorage.setItem(RECENT_KEY, JSON.stringify([href, ...this.get().filter(h => h !== href)].slice(0, 5))) } catch {} },
}

// ---------------------------------------------------------------- UI
export function initSearch({ lenis, reduced }) {
  const triggers = [...document.querySelectorAll('[data-search-open]')]
  if (!triggers.length) return
  if (/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) document.querySelectorAll('[data-search-key]').forEach(k => { k.textContent = '⌘K' })
  let el, input, list, chips, foot, open = false, type = 'all', rows = [], active = 0, lastFocus = null

  // load the index on first intent so opening feels instant
  const warm = () => { buildIndex() }
  triggers.forEach(t => { t.addEventListener('pointerenter', warm, { once: true }); t.addEventListener('focus', warm, { once: true }) })
  ;(window.requestIdleCallback || (f => setTimeout(f, 2500)))(warm)

  function mount() {
    el = document.createElement('div')
    el.className = 'srch'
    el.setAttribute('data-lenis-prevent', '')   // let the results list scroll natively; Lenis owns the page wheel otherwise
    el.hidden = true
    el.innerHTML = `
      <div class="srch__scrim" data-srch-close></div>
      <div class="srch__panel" role="dialog" aria-modal="true" aria-label="Search the site">
        <div class="srch__bar">
          ${icon('search', 'ico srch__glass')}
          <input class="srch__input" type="search" placeholder="Search services, case studies, brands, countries…" autocomplete="off" spellcheck="false"
            role="combobox" aria-expanded="true" aria-controls="srch-list" aria-autocomplete="list">
          <button type="button" class="srch__esc" data-srch-close aria-label="Close search">Esc</button>
        </div>
        <div class="srch__chips" role="tablist" aria-label="Filter results">${TYPES.map(([k, n], i) => `<button type="button" role="tab" class="srch__chip${i ? '' : ' is-on'}" data-type="${k}" aria-selected="${!i}">${n}<small></small></button>`).join('')}</div>
        <div class="srch__list" id="srch-list" role="listbox" aria-label="Results"></div>
        <div class="srch__foot"><span><kbd>↑</kbd><kbd>↓</kbd> navigate</span><span><kbd>↵</kbd> open</span><span><kbd>Tab</kbd> filter</span><span class="srch__count" aria-live="polite"></span></div>
      </div>`
    document.body.appendChild(el)
    input = el.querySelector('.srch__input')
    list = el.querySelector('.srch__list')
    chips = [...el.querySelectorAll('.srch__chip')]
    foot = el.querySelector('.srch__count')

    el.addEventListener('click', e => { if (e.target.closest('[data-srch-close]')) close() })
    chips.forEach(c => c.addEventListener('click', () => { setType(c.dataset.type); input.focus() }))
    let raf = 0
    input.addEventListener('input', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(render) })
    input.addEventListener('keydown', onKey)
    list.addEventListener('pointermove', e => { const r = e.target.closest('.srch__row'); if (r && +r.dataset.k !== active) setActive(+r.dataset.k, false) })
    list.addEventListener('click', e => { const r = e.target.closest('.srch__row'); if (r) recent.push(r.getAttribute('href')); if (r) setTimeout(close, 0) })
    // keep focus inside the dialog
    el.addEventListener('keydown', e => { if (e.key === 'Tab' && document.activeElement !== input) { e.preventDefault(); input.focus() } })
  }

  function setType(k) {
    type = k
    chips.forEach(c => { const on = c.dataset.type === k; c.classList.toggle('is-on', on); c.setAttribute('aria-selected', on) })
    render()
  }

  function onKey(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(Math.min(rows.length - 1, active + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(Math.max(0, active - 1)) }
    else if (e.key === 'Enter') { e.preventDefault(); const r = rows[active]; if (r) r.click() }
    else if (e.key === 'Escape') { e.preventDefault(); if (input.value) { input.value = ''; render() } else close() }
    else if (e.key === 'Tab') { e.preventDefault(); const i = TYPES.findIndex(t => t[0] === type); setType(TYPES[(i + (e.shiftKey ? TYPES.length - 1 : 1)) % TYPES.length][0]) }
  }

  function setActive(k, scroll = true) {
    rows[active]?.classList.remove('is-active')
    rows[active]?.setAttribute('aria-selected', 'false')
    active = k
    const r = rows[active]
    if (!r) return
    r.classList.add('is-active'); r.setAttribute('aria-selected', 'true')
    input.setAttribute('aria-activedescendant', r.id)
    if (scroll) r.scrollIntoView({ block: 'nearest' })
  }

  const row = (it, k, toks) => `
    <a class="srch__row" role="option" id="srch-o${k}" data-k="${k}" href="${url(it.href)}" aria-selected="false">
      <span class="srch__thumb${it.thumb ? '' : ' srch__thumb--ico'}">${it.thumb ? `<img src="${url(it.thumb)}" alt="" loading="lazy" decoding="async">` : icon(it.icon || 'arrow')}</span>
      <span class="srch__txt"><b>${highlight(it.title, toks)}</b><small>${highlight(it.sub, toks)}</small></span>
      <span class="srch__type">${TYPE_LABEL[it.type]}</span>
      ${icon('arrow', 'ico srch__go')}
    </a>`

  function render() {
    if (!INDEX) { list.innerHTML = '<p class="srch__empty">Loading…</p>'; buildIndex().then(render); return }
    const q = norm(input.value), toks = q ? q.split(' ') : []
    let html = '', k = 0, total = 0
    const counts = { all: 0, service: 0, case: 0, project: 0, page: 0 }

    if (!q) {
      // empty state: recent visits, then a short list of starting points
      const by = Object.fromEntries(INDEX.map(it => [url(it.href), it]))
      const rec = recent.get().map(h => by[h]).filter(Boolean).filter(it => type === 'all' || it.type === type)
      const pool = INDEX.filter(it => type === 'all' || it.type === type)
      const start = type === 'all'
        ? [...pool.filter(it => it.type === 'service').slice(0, 4), ...pool.filter(it => it.type === 'case').sort((a, b) => b.rank - a.rank).slice(0, 3), ...pool.filter(it => it.type === 'page' && ['/contact/', '/case-studies/'].includes(it.href))]
        : pool.slice().sort((a, b) => b.rank - a.rank).slice(0, 8)
      if (rec.length) html += `<p class="srch__h">Recently opened</p>` + rec.map(it => row(it, k++, [])).join('')
      html += `<p class="srch__h">${type === 'all' ? 'Suggested' : GROUP_LABEL[type]}</p>` + start.filter(it => !rec.includes(it)).map(it => row(it, k++, [])).join('')
      chips.forEach(c => { c.querySelector('small').textContent = '' })
      foot.textContent = `${INDEX.length} items`
    } else {
      const hits = []
      for (const it of INDEX) { const s = scoreItem(it, toks, q); if (s) { hits.push([s, it]); counts[it.type]++; counts.all++ } }
      hits.sort((a, b) => b[0] - a[0])
      chips.forEach(c => { c.querySelector('small').textContent = counts[c.dataset.type] || '' })
      const shown = hits.filter(([, it]) => type === 'all' || it.type === type)
      total = shown.length
      if (!total) {
        html = `<div class="srch__empty"><b>No results for “${escHtml(input.value.trim())}”</b><span>Try a brand, a service or a country, for example “mystery shopping” or “Kuwait”.</span><a class="srch__row srch__row--cta" id="srch-o0" data-k="0" href="${url('/contact/')}" role="option">${icon('mail', 'ico')}<span class="srch__txt"><b>Ask our team instead</b><small>Contact Niche Marketing Management</small></span>${icon('arrow', 'ico srch__go')}</a></div>`
      } else if (type === 'all') {
        // groups ordered by their best hit
        const groups = {}
        for (const [, it] of shown) (groups[it.type] ||= []).push(it)
        for (const g of Object.keys(groups)) {
          const more = groups[g].length - PER_GROUP
          html += `<p class="srch__h">${GROUP_LABEL[g]}${more > 0 ? `<button type="button" class="srch__more" data-more="${g}">+${more} more</button>` : ''}</p>`
          html += groups[g].slice(0, PER_GROUP).map(it => row(it, k++, toks)).join('')
        }
      } else {
        html = shown.map(([, it]) => row(it, k++, toks)).join('')
      }
      foot.textContent = total ? `${total} result${total === 1 ? '' : 's'}` : ''
    }
    list.innerHTML = html
    list.querySelectorAll('[data-more]').forEach(b => b.addEventListener('click', () => { setType(b.dataset.more); input.focus() }))
    rows = [...list.querySelectorAll('.srch__row')]
    active = 0
    list.scrollTop = 0
    setActive(0, false)
  }

  function show() {
    if (open) return
    if (!el) mount()
    open = true
    lastFocus = document.activeElement
    el.hidden = false
    document.documentElement.classList.add('srch-open')
    lenis?.stop()
    requestAnimationFrame(() => el.classList.add('is-on'))
    input.value = ''
    setType('all')
    input.focus({ preventScroll: true })
  }
  function close() {
    if (!open) return
    open = false
    el.classList.remove('is-on')
    document.documentElement.classList.remove('srch-open')
    lenis?.start()
    setTimeout(() => { if (!open) el.hidden = true }, reduced ? 0 : 260)
    lastFocus?.focus?.({ preventScroll: true })
  }

  triggers.forEach(t => t.addEventListener('click', e => { e.preventDefault(); document.querySelector('[data-menu]:not([hidden])') && document.querySelector('[data-burger]')?.click(); show() }))
  addEventListener('keydown', e => {
    const typing = /^(input|textarea|select)$/i.test(e.target.tagName) || e.target.isContentEditable
    if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) { e.preventDefault(); open ? close() : show() }
    else if (e.key === '/' && !typing && !open) { e.preventDefault(); show() }
  })
  // returning with the back button: make sure the palette is closed
  addEventListener('pageshow', () => close())
}
