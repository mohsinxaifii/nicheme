// Static page generator. Builds the shared header (with mega menus) and every
// sub-page from the data files, so all pages stay consistent and linked.
// Used by vite.config.js in both dev and build; generated pages are gitignored.
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { groups, allServices } from '../src/data/services.js'
import { cases, SERVICE_LABEL, SERVICE_SLUG } from '../src/data/cases.js'
import { photos } from '../src/data/photos.js'
import { projects } from '../src/data/projects.js'
import { icon } from '../src/data/icons.js'
import { workItems, standaloneProjects, projectStat, casesByContent, projectsByContent, caseScore, projectScore, byScore, caseGallery, caseCover } from '../src/data/work.js'

const ROOT = resolve(import.meta.dirname, '..')
const SVCS = allServices()
const svcBy = Object.fromEntries(SVCS.map(s => [s.slug, s]))
const caseBy = Object.fromEntries(cases.map(c => [c.slug, c]))
const PRIMARY = SERVICE_SLUG
// filters follow the client's project folders; a service with no work yet is left out
const FILTERS = [['all', 'All case studies'], ...Object.entries(SERVICE_LABEL).filter(([k]) => workItems.some(w => w.service === k))]
const countOf = k => k === 'all' ? workItems.length : workItems.filter(w => w.service === k).length
// icon for a case or project with no photo yet (placeholder until photos are added)
const SVC_ICON = { audits: 'audit', merch: 'merch', mystery: 'mystery', research: 'research', activation: 'promo', sampling: 'sampling', events: 'events', reporting: 'reporting', digital: 'digital', production: 'production', install: 'install' }
const hasPhotos = slug => !!caseCover(slug)
// archive projects per service page
const PROJECT_FOR_SERVICE = { 'retail-audits': 'audits', 'mystery-shopping': 'mystery', 'market-research': 'research' }
const fmt = n => typeof n === 'number' ? n.toLocaleString('en-US') : n
const GROUP_ICONS = ['dashboard', 'users', 'promo', 'factory']
const esc = s => String(s).replace(/&(?!amp;|#)/g, '&amp;').replace(/"/g, '&quot;')
const img = (slug, f) => `/work/${slug}/${f}`
const svcUrl = s => `/services/${s.slug}/`
const caseUrl = c => `/case-studies/${c.slug}/`
const chev = '<svg class="chev" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5"/></svg>'

export const servicesForCase = slug => {
  const c = caseBy[slug]
  const list = SVCS.filter(s => s.cases.includes(slug))
  const p = svcBy[PRIMARY[c.service]]
  return p && !list.includes(p) ? [p, ...list] : list
}
const coverOf = s => s.photo || ((c => c ? caseCover(c) : null)(s.cases.find(hasPhotos)))

// ---------------------------------------------------------------- partials
export function header() {
  const mega = `
    <div class="mega" data-mega role="menu">
      <div class="mega__cols">
        ${groups.map((g, gi) => `<div class="mega__col">
          <p class="mega__h">${icon(GROUP_ICONS[gi])}${g.name}</p>
          <ul>${g.services.map(s => `<li><a href="${svcUrl(s)}" data-prev="${s.photo ? `/${s.photo}` : ''}" data-line="${esc(s.line)}" data-name="${esc(s.name)}">${icon(s.icon)}<span>${s.name}</span></a></li>`).join('')}</ul>
        </div>`).join('')}
      </div>
      <aside class="mega__feat">
        <div class="mega__img"><img src="/${SVCS[0].photo}" alt="" data-mega-img></div>
        <p class="mega__name" data-mega-name>${SVCS[0].name}</p>
        <p class="mega__line" data-mega-line>${SVCS[0].line}</p>
        <a class="mega__all" href="/services/">All 14 services ${icon('arrow')}</a>
      </aside>
    </div>`
  const work = `
    <div class="mega mega--sm" data-mega role="menu">
      <ul class="drop">
        ${FILTERS.map(([k, n]) => `<li><a href="/case-studies/${k === 'all' ? '' : `?s=${k}`}"><span>${n}</span><small>${countOf(k)}</small></a></li>`).join('')}
      </ul>
      <div class="drop__cards">
        ${['red-bull-perfect-store-audits', 'mentos-air-action-sampling', 'william-grant-mystery-shopping'].map(sl => { const c = caseBy[sl]; return `<a class="dcard" href="${caseUrl(c)}"><img src="/${caseCover(sl)}" alt="" loading="lazy"><span><b>${c.brand}</b>${c.title}</span></a>` }).join('')}
      </div>
    </div>`
  const about = `
    <div class="mega mega--sm mega--about" data-mega role="menu">
      <ul class="drop drop--icons">
        <li><a href="/about/">${icon('building')}<span>About Niche<small>Field marketing since 2003</small></span></a></li>
        <li><a href="/about/#network">${icon('globe')}<span>Our network<small>17 countries, 20+ offices</small></span></a></li>
        <li><a href="/about/#industries">${icon('store')}<span>Industries<small>Sectors we work in</small></span></a></li>
        <li><a href="/about/#group">${icon('factory')}<span>Group companies<small>Production, shipping, tracking</small></span></a></li>
        <li><a href="/about/#how">${icon('route')}<span>How we work<small>Brief to report in four steps</small></span></a></li>
      </ul>
    </div>`
  return `
  <header class="nav" data-nav>
    <div class="nav__bar">
      <a class="logo" href="/"><img src="/brand/niche-logo.png" alt="Niche Marketing Management" width="2030" height="361"></a>
      <nav class="nav__links" aria-label="Main">
        <div class="nav__item"><a class="nav__top" href="/" data-nav-key="home">Home</a></div>
        <div class="nav__item" data-item><a class="nav__top" href="/about/" data-nav-key="about" aria-haspopup="true">About ${chev}</a>${about}</div>
        <div class="nav__item" data-item><a class="nav__top" href="/services/" data-nav-key="services" aria-haspopup="true">Services ${chev}</a>${mega}</div>
        <div class="nav__item" data-item><a class="nav__top" href="/case-studies/" data-nav-key="case-studies" aria-haspopup="true">Case studies ${chev}</a>${work}</div>
        <div class="nav__item"><a class="nav__top" href="/contact/" data-nav-key="contact">Contact</a></div>
        <div class="nav__item"><a class="nav__top" href="/careers/" data-nav-key="careers">Careers</a></div>
      </nav>
      <div class="nav__right">
        <button class="nav__search" type="button" data-search-open aria-label="Search the site" aria-keyshortcuts="Control+K Meta+K /">${icon('search')}<span class="nav__search-txt">Search</span><kbd data-search-key>Ctrl K</kbd></button>
        <button class="nav__lang" type="button" data-toast="The Arabic site is coming with launch." aria-label="Switch to Arabic (coming soon)">${icon('globe')}<span>AR</span></button>
        <a class="btn btn--red btn--sm" href="/contact/">Get a proposal ${icon('arrow')}</a>
        <button class="nav__burger" type="button" aria-label="Open menu" aria-expanded="false" data-burger><span></span><span></span></button>
      </div>
    </div>
  </header>
  <div class="menu" data-menu hidden>
    <nav aria-label="Mobile">
      <button type="button" class="menu__search" data-search-open>${icon('search')}<span>Search the site</span></button>
      <a href="/" class="menu__link">Home</a>
      <details><summary>About ${chev}</summary><ul><li><a href="/about/">About Niche</a></li><li><a href="/about/#network">Our network</a></li><li><a href="/about/#industries">Industries</a></li><li><a href="/about/#group">Group companies</a></li></ul></details>
      <details><summary>Services ${chev}</summary>
        ${groups.map(g => `<p class="menu__h">${g.name}</p><ul>${g.services.map(s => `<li><a href="${svcUrl(s)}">${icon(s.icon)}${s.name}</a></li>`).join('')}</ul>`).join('')}
        <a class="menu__all" href="/services/">All services ${icon('arrow')}</a>
      </details>
      <details><summary>Case studies ${chev}</summary><ul>${FILTERS.map(([k, n]) => `<li><a href="/case-studies/${k === 'all' ? '' : `?s=${k}`}">${n}</a></li>`).join('')}</ul></details>
      <a href="/contact/" class="menu__link">Contact</a>
      <a href="/careers/" class="menu__link">Careers</a>
      <a href="/contact/" class="menu__cta">Get a proposal ${icon('arrow')}</a>
    </nav>
    <p class="menu__foot">+971 4 297 8868 · info@nicheme.com<br>B Block, M Floor, Al Dalal Building, 11A St, Al Khabaisi, Deira, Dubai</p>
  </div>`
}

// home + services page: the 14 cards, each a real link
export function servicesGrid() {
  return groups.map(g => `
    <div class="sg">
      <div class="sg__head"><h3>${g.name}</h3><p>${g.intro}</p></div>
      <ul class="sg__cards">${g.services.map(s => `
        <li><a class="sc" href="${svcUrl(s)}">
          ${s.photo ? `<img class="sc__img" src="/${s.photo}" alt="" loading="lazy">` : ''}
          <span class="sc__top">${icon(s.icon, 'ico sc__ico')}${icon('arrow', 'ico sc__arrow')}</span>
          <span class="sc__name">${s.name}</span>
          <span class="sc__line">${s.line}</span>
          <span class="sc__proof">${s.proof ? `<b>${s.proof[0]}</b><small>${s.proof[1]}</small>` : `<small>${s.link ? 'Through Connexis, part of the Niche Group' : 'Supports what happens in store'}</small>`}</span>
        </a></li>`).join('')}
      </ul>
    </div>`).join('')
}

export function cta({ title = 'Discuss your requirements with our team.', text = 'Tell us what you need and where. We reply within one working day with a plan and a price.', href = '/contact/', label = 'Build your brief' } = {}) {
  return `
    <section class="cta">
      <div class="wrap cta__in">
        <svg class="cta__mark" viewBox="0 0 40 40" aria-hidden="true"><path d="M8 32 32 8M12 8h20v20"/></svg>
        <div><h2 class="cta__title">${title}</h2><p>${text}</p></div>
        <div class="cta__btns"><a class="btn btn--light btn--lg" href="${href}">${label} ${icon('arrow')}</a><a class="cta__tel" href="tel:+97142978868">${icon('call')}+971 4 297 8868</a></div>
      </div>
    </section>`
}

const crumbs = list => `<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a>${list.map(([n, u]) => u ? `<span>/</span><a href="${u}">${n}</a>` : `<span>/</span><b>${n}</b>`).join('')}</nav>`

// One card and one ordered list for everything on the case studies page: written-up
// case studies and project-log entries are the same thing to a visitor.
const workBy = Object.fromEntries(workItems.map(w => [w.slug, w]))
const caseCard = c => { const w = workBy[c.slug]; return `
  <li data-service="${w.service}"><a class="cc${w.cover ? '' : ' cc--empty'}" href="/case-studies/${w.slug}/">
    ${w.cover ? `<img src="/${w.cover}" alt="" loading="lazy">` : `<span class="cc__ph" aria-hidden="true">${icon(SVC_ICON[w.service])}</span>`}
    <span class="cc__pill">${SERVICE_LABEL[w.service]}</span>
    <span class="cc__stat"><b>${w.stat}</b>${w.statLabel}</span>
    <span class="cc__meta"><b>${w.brand}</b><span>${w.title}</span></span>
  </a></li>` }
const workIndex = slug => workItems.findIndex(w => w.slug === slug)
const prevNext = slug => { const i = workIndex(slug), n = workItems.length; return [workItems[(i - 1 + n) % n], workItems[(i + 1) % n]] }
// Related case studies: same category, a different mix on every page. The order is seeded
// by the page's slug, so each page is stable between builds but pages don't all repeat the
// same three. Cards with photos are picked before placeholders.
const seeded = str => { let h = 2166136261; for (const ch of str) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return (h >>> 0) / 4294967296 }
const relatedWork = (slug, service) => workItems.filter(w => w.service === service && w.slug !== slug)
  .map(w => [(w.cover ? 0 : 1) + seeded(slug + '|' + w.slug), w]).sort((a, b) => a[0] - b[0]).slice(0, 3).map(x => x[1])

const FAQ = s => [
  ['Which countries do you cover?', 'Our own teams work in 17 countries from 20+ offices: the UAE, Saudi Arabia, Qatar, Kuwait, Oman, Bahrain, Jordan, Lebanon, Syria, Iraq, Egypt, Morocco, Tunisia, Algeria, Yemen, Pakistan and Mauritius.'],
  ['How quickly is field data reported?', 'Field staff submit reports from hand-held devices. Our Dubai-based data team delivers each visit report, with photo evidence, within 24 hours or on an agreed schedule.'],
  [`Can we start ${s.name.toLowerCase().includes('vehicle') ? 'small' : 'in one market'}?`, 'Yes. Programmes can begin in a single city and expand across the region, with one account contact and centralised billing.'],
  ['How do we request a proposal?', 'Send a short brief outlining the service, markets and timing. We respond within one working day with a proposed approach and pricing.'],
]
const faq = list => `<div class="faq">${list.map(([q, a], i) => `<details${i === 0 ? ' open' : ''}><summary><span>${q}</span><i class="faq__plus"></i></summary><p>${a}</p></details>`).join('')}</div>`

// ---------------------------------------------------------------- pages
function shell({ title, desc, path, page, body }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <meta name="description" content="${esc(desc)}">
  <meta name="theme-color" content="#0A0A0A">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="canonical" href="https://nicheme.com${path}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:type" content="website">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body data-page="${page}">
  <a class="skip" href="#main">Skip to content</a>
  <!--@header-->
  <main id="main">
${body}
  </main>
  <!--@footer-->
  <div class="toast" data-toast-el role="status" aria-live="polite"></div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
`
}

function servicesIndex() {
  const body = `
    <section class="phero phero--services">
      <div class="wrap phero__grid">
        <div>
          ${crumbs([['Services']])}
          <p class="label">Services</p>
          <h1 class="phero__title">Field marketing and <em>retail services.</em></h1>
          <p class="phero__lead">Fourteen services across retail intelligence, field execution, consumer engagement and production, delivered by Niche staff in 17 countries and reported through one system.</p>
          <ul class="phero__chips"><li><b>14</b>services</li><li><b>4</b>groups</li><li><b>17</b>countries</li><li><b>24 h</b>reporting</li></ul>
        </div>
        <div class="iconwall" aria-label="All services">
          ${SVCS.map((s, i) => `<a href="${svcUrl(s)}" style="--i:${i}" title="${esc(s.name)}">${icon(s.icon)}<span>${s.name}</span></a>`).join('')}
        </div>
      </div>
    </section>
    ${groups.map((g, gi) => `
    <section class="sgroup${gi % 2 ? ' sgroup--alt' : ''}" id="${g.name.toLowerCase().replace(/[^a-z]+/g, '-')}">
      <div class="wrap sgroup__grid">
        <div class="sgroup__side">
          <span class="sgroup__num">0${gi + 1}</span>
          <p class="label">${icon(GROUP_ICONS[gi])} ${g.services.length} services</p>
          <h2 class="h2">${g.name}</h2>
          <p class="lead">${g.intro}</p>
        </div>
        <ul class="sgroup__list">${g.services.map(s => `
          <li><a class="srow" href="${svcUrl(s)}">
            <span class="srow__img">${coverOf(s) ? `<img src="/${coverOf(s)}" alt="" loading="lazy">` : icon(s.icon)}</span>
            <span class="srow__body">${icon(s.icon, 'ico srow__ico')}<b>${s.name}</b><span>${s.line}</span>
              ${s.proof ? `<em><strong>${s.proof[0]}</strong> ${s.proof[1]}</em>` : ''}</span>
            <span class="srow__go">${icon('arrow')}</span>
          </a></li>`).join('')}
        </ul>
      </div>
    </section>`).join('')}
    <!--@how-->
    <section class="svfaq">
      <div class="wrap svfaq__grid">
        <div class="section-head"><p class="label">Questions</p><h2 class="h2">Frequently asked questions.</h2><p class="lead">For anything else, <a href="/contact/">contact our team</a>.</p></div>
        ${faq(FAQ({ name: '' }))}
      </div>
    </section>
    ${cta({ title: 'Need help choosing a service?', text: 'Describe your objectives and markets, and our team will recommend a suitable combination of services.' })}`
  return shell({ title: 'Field Marketing Services in Dubai, UAE & MENA | Niche Marketing Management', desc: 'Field marketing services in 17 countries: retail audits, mystery shopping, merchandising, market research, promotions, sampling, fixture installation, POSM production and logistics.', path: '/services/', page: 'services', body })
}

// service page strip: how many more programmes of this kind are on record
function trackRecord(s) {
  const key = PROJECT_FOR_SERVICE[s.slug]
  const list = key ? projects.filter(p => p.service === key) : []
  if (list.length < 5) return ''              // a short list undersells; the archive still has them
  const brands = [...new Set(list.map(p => p.brand))]
  return `
    <section class="track">
      <div class="wrap track__in">
        <div><p class="label">Track record</p><h2 class="track__title">${list.length} ${SERVICE_LABEL[key].toLowerCase()} case studies.</h2></div>
        <ul class="track__brands">${brands.map(b => `<li>${b}</li>`).join('')}</ul>
        <a class="link-more" href="/case-studies/?s=${key}">View all projects ${icon('arrow')}</a>
      </div>
    </section>`
}

function servicePage(s, i) {
  const prev = SVCS[(i - 1 + SVCS.length) % SVCS.length], next = SVCS[(i + 1) % SVCS.length]
  const rel = s.cases.map(sl => caseBy[sl]).filter(Boolean).sort((a, b) => workIndex(a.slug) - workIndex(b.slug))   // same order as the case studies page
  const svcKey = Object.keys(PRIMARY).find(k => PRIMARY[k] === s.slug)
  const relAll = [...rel, ...(svcKey ? workItems.filter(w => w.service === svcKey && !rel.some(c => c.slug === w.slug)) : [])]
  // photos from every related case study and archive project, taken in turn (one from each, then
  // the next round) so no single programme fills the strip
  const key = Object.keys(PRIMARY).find(k => PRIMARY[k] === s.slug)
  const sources = [
    ...(s.gallery ? [{ c: { brand: s.gallery.by, title: s.name }, list: s.gallery.photos.map(([f, w, h]) => [`${s.gallery.dir}/${f}`, w, h]) }] : []),
    ...rel.map(c => ({ c, list: caseGallery(c.slug) })),
    ...(key ? projectsByContent.filter(p => p.service === key && !p.case && p.photos.length).map(p => ({ c: p, list: p.photos.map(([f, w, h]) => [`projects/${p.slug}/${f}`, w, h]) })) : []),
  ].filter(x => x.list.length)
  const gallery = []
  for (let round = 0; gallery.length < 12 && sources.some(x => x.list[round]); round++)
    for (const { c, list } of sources) if (list[round] && gallery.length < 12) gallery.push({ c, src: list[round][0], w: list[round][1], h: list[round][2] })
  const siblings = groups[s.gi].services.filter(x => x.slug !== s.slug)
  const hero = s.photo ? `/${s.photo}` : coverOf(s) ? `/${coverOf(s)}` : null
  const body = `
    <section class="phero phero--svc">
      <div class="wrap svh">
        <div class="svh__copy">
          ${crumbs([['Services', '/services/'], [s.name]])}
          <p class="svh__kicker">${icon(s.icon)}${s.group}</p>
          <h1 class="phero__title">${s.name}</h1>
          <p class="svh__line">${s.line}</p>
          <p class="phero__lead">${s.body}</p>
          <div class="phero__btns">
            <a class="btn btn--red btn--lg" href="/contact/?service=${s.slug}">Get a proposal ${icon('arrow')}</a>
            ${relAll.length ? `<a class="btn btn--ghost btn--lg" href="#work">View case studies</a>` : ''}
            ${s.link ? `<a class="btn btn--ghost btn--lg" href="${s.link}" target="_blank" rel="noopener">${s.linkLabel || 'Visit website'} ${icon('arrow')}</a>` : ''}
          </div>
        </div>
        <div class="svh__media">
          ${hero ? `<img src="${hero}" alt="${esc(s.name)} by Niche">` : `<div class="svh__art">${icon(s.icon)}</div>`}
        </div>
      </div>
    </section>

    <section class="inc">
      <div class="wrap">
        <div class="section-head"><p class="label">What's included</p><h2 class="h2">Scope of service.</h2><p class="lead">${s.name}, delivered by trained Niche staff and reported through one system.</p></div>
        <ul class="inc__grid">${s.included.map((x, k) => `<li style="--k:${k}"><span class="inc__n">${String(k + 1).padStart(2, '0')}</span>${icon('check', 'ico inc__tick')}<b>${x}</b></li>`).join('')}</ul>
      </div>
    </section>

    ${gallery.length ? `
    <section class="infield" id="photos">
      <div class="wrap">
        <div class="section-head"><p class="label">In the field</p><h2 class="h2">Project photography.</h2><p class="lead">All photographs are taken from Niche Group projects and operations.</p></div>
        <div class="masonry masonry--static">${gallery.map(g => `<figure style="--ar:${(g.w / g.h).toFixed(3)}"><img src="/${g.src}" alt="${esc(`${g.c.brand}: ${g.c.title}`)}" loading="lazy"><figcaption>${g.c.brand}</figcaption></figure>`).join('')}</div>
      </div>
    </section>` : ''}
    ${relAll.length ? `
    <section class="relcases" id="work">
      <div class="wrap">
        <div class="section-head section-head--row"><div><p class="label">Case studies</p><h2 class="h2">Related case studies.</h2></div><a class="link-more" href="/case-studies/">All case studies ${icon('arrow')}</a></div>
        <ul class="cgrid">${relAll.slice(0, 9).map(caseCard).join('')}</ul>${relAll.length > 9 ? `<a class="link-more relcases__all" href="/case-studies/?s=${svcKey}">View all ${relAll.length} ${s.name.toLowerCase()} case studies ${icon('arrow')}</a>` : ''}
      </div>
    </section>` : ''}
    ${trackRecord(s)}

    <section class="more">
      <div class="wrap">
        ${siblings.length ? `<p class="label">More in ${s.group}</p><ul class="more__chips">${siblings.map(x => `<li><a href="${svcUrl(x)}">${icon(x.icon)}${x.name}</a></li>`).join('')}<li><a href="/services/">All services ${icon('arrow')}</a></li></ul>` : ''}
        <div class="pn">
          <a class="pn__a" href="${svcUrl(prev)}"><small>← Previous service</small><b>${prev.name}</b></a>
          <a class="pn__a pn__a--next" href="${svcUrl(next)}"><small>Next service →</small><b>${next.name}</b></a>
        </div>
      </div>
    </section>
    ${cta({ title: `Request a proposal for ${s.name.toLowerCase()}.`, text: 'Available in a single market or across all 17 countries. We respond within one working day.', href: `/contact/?service=${s.slug}`, label: 'Get a proposal' })}`
  return shell({ title: `${s.seo || s.name} in Dubai, UAE & MENA | Niche`, desc: s.meta || `${s.line} ${s.body}`.slice(0, 155), path: svcUrl(s), page: 'service', body })
}

function casesIndex() {
  const work = readFileSync(resolve(ROOT, 'src/partials/work.html'), 'utf8')
  const body = `
    <section class="phero phero--cases">
      <div class="wrap">
        ${crumbs([['Case studies']])}
        <p class="label">Case studies</p>
        <h1 class="phero__title">Field marketing <em>case studies.</em></h1>
        <p class="phero__lead">${workItems.length} case studies covering retail audits, merchandising, mystery shopping, market research, activations, installation, production and logistics. All figures are taken from the projects themselves.</p>
      </div>
    </section>
    ${work.replace('class="work"', 'class="work work--page"')}
    <section class="allcases" id="all">
      <div class="wrap">
        <div class="section-head section-head--row"><div><p class="label">All case studies</p><h2 class="h2">Filter by service.</h2></div></div>
        <div class="chips chips--light" role="group" aria-label="Filter case studies" data-grid-filters>${FILTERS.map(([k, n], i) => `<button class="chip${i ? '' : ' is-on'}" type="button" data-gf="${k}">${i ? n : 'All case studies'}</button>`).join('')}</div>
        <ul class="cgrid" data-cgrid>${workItems.map(caseCard).join('')}</ul>
      </div>
    </section>
    ${cta({ title: 'Planning a similar project?', text: 'Share your brief and we will respond within one working day with a proposed approach and pricing.' })}`
  return shell({ title: 'Field Marketing Case Studies | UAE, Saudi Arabia & MENA | Niche', desc: `${workItems.length} field marketing case studies: retail audits, mystery shopping, research, merchandising, activations, installation, production and logistics.`, path: '/case-studies/', page: 'cases', body })
}

function casePage(c, i) {
  const list = caseGallery(c.slug)
  const svcs = servicesForCase(c.slug)
  const [prev, next] = prevNext(c.slug)
  const same = relatedWork(c.slug, c.service)
  const body = `
    <section class="phero phero--case">
      ${caseCover(c.slug) ? `<div class="phero__bg" style="background-image:url('/${caseCover(c.slug)}')"></div>` : ''}
      <div class="wrap csh">
        <div class="csh__copy">
          ${crumbs([['Case studies', '/case-studies/'], [c.brand]])}
          <ul class="csh__pills"><li><a href="/case-studies/?s=${c.service}">${SERVICE_LABEL[c.service]}</a></li>${c.where ? c.where.split(', ').map(w => `<li>${icon('pin')}${w}</li>`).join('') : ''}</ul>
          <h1 class="phero__title">${c.brand}</h1>
          <p class="csh__sub">${c.title}</p>
          <p class="csh__lead">${c.challenge}</p>
          <dl class="csh__stats">${c.stats.map(([b, s]) => `<div><dt>${s}</dt><dd>${b}</dd></div>`).join('')}</dl>
          <div class="phero__btns">
            <a class="btn btn--red btn--lg" href="/contact/?service=${svcs[0]?.slug || ''}">Request a proposal ${icon('arrow')}</a>
            ${list.length > 1 ? `<a class="btn btn--ghost btn--lg" href="#gallery">View project photos</a>` : `<a class="btn btn--ghost btn--lg" href="#story">Scope of work</a>`}
          </div>
        </div>
        ${c.leadStock
          ? `<figure class="csh__img csh__img--stock"><img src="/${c.leadStock}" alt="${esc(`${c.brand}: ${c.title}`)}"></figure>`
          : list.length
          ? `<figure class="csh__img${c.service === 'digital' || list[0][1] / list[0][2] < 0.8 || list[0][1] / list[0][2] > 1.5 ? ' csh__img--fit' : ''}" style="--ar:${(list[0][1] / list[0][2]).toFixed(3)}"><img src="/${list[0][0]}" alt="${esc(`${c.brand}: ${c.title}`)}"></figure>`
          : c.stockCover ? `<figure class="csh__img csh__img--stock"><img src="/${c.stockCover}" alt="${esc(SERVICE_LABEL[c.service])}"></figure>`
          : `<figure class="csh__img csh__img--empty" aria-hidden="true">${icon(SVC_ICON[c.service])}<span>${SERVICE_LABEL[c.service]}</span></figure>`}
      </div>
    </section>

    <section class="story" id="story">
      <div class="wrap story__grid">
        <ol class="story__steps">
          <li><span>${icon('users')}</span><div><p class="label">What we did</p><ul class="story__did">${c.did.map(d => `<li>${icon('check')}${d}</li>`).join('')}</ul></div></li>
          <li><span>${icon('dashboard')}</span><div><p class="label">The result</p><p class="story__big story__big--red">${c.result}</p></div></li>
        </ol>
        <aside class="story__side">
          <p class="label">Services used</p>
          <ul class="story__svcs">${svcs.map(s => `<li><a href="${svcUrl(s)}">${icon(s.icon)}<span><b>${s.name}</b><small>${s.line}</small></span>${icon('arrow', 'ico story__go')}</a></li>`).join('')}</ul>
          <a class="btn btn--red" href="/contact/?service=${svcs[0]?.slug || ''}">Request a proposal ${icon('arrow')}</a>
        </aside>
      </div>
    </section>

    ${list.length > 1 ? `
    <section class="infield infield--case" id="gallery">
      <div class="wrap">
        <div class="section-head"><p class="label">Gallery</p><h2 class="h2">Project photos.</h2></div>
        <div class="masonry masonry--static">${list.map(([src, w, h]) => `<figure style="--ar:${(w / h).toFixed(3)}"><img src="/${src}" alt="${esc(`${c.brand}: ${c.title}`)}" loading="lazy"></figure>`).join('')}</div>
      </div>
    </section>` : ''}

    <section class="more">
      <div class="wrap">
        ${same.length ? `<div class="section-head section-head--row"><div><p class="label">More ${SERVICE_LABEL[c.service].toLowerCase()}</p><h2 class="h2">Related case studies.</h2></div><a class="link-more" href="/case-studies/?s=${c.service}">See all ${icon('arrow')}</a></div><ul class="cgrid cgrid--3">${same.map(caseCard).join('')}</ul>` : ''}
        <div class="pn">
          <a class="pn__a" href="${caseUrl(prev)}"><small>← Previous case study</small><b>${prev.brand}</b></a>
          <a class="pn__a pn__a--next" href="${caseUrl(next)}"><small>Next case study →</small><b>${next.brand}</b></a>
        </div>
      </div>
    </section>
    ${cta({ title: 'Planning a similar project?', href: `/contact/?service=${svcs[0]?.slug || ''}`, label: 'Get a proposal' })}`
  return shell({ title: `${c.brand}: ${c.title} | Niche Case Study`, desc: `${c.challenge} ${c.result}`.slice(0, 155), path: caseUrl(c), page: 'case', body })
}

// Plain-English intro for a project page, e.g. "Niche carried out retail audits for Vega
// across 100 stores in the UAE."
const PLACE = { UAE: 'the UAE', KSA: 'Saudi Arabia' }
const listText = a => a.length < 2 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`
const projectLead = p => {
  let what = (p.title.charAt(0).toLowerCase() + p.title.slice(1)).replace(/ & /g, ' and ')
  if (/\baudit$|\bsurvey$/.test(what)) what = 'a ' + what   // singular: "a retail audit"
  const where = listText(p.countries.map(c => PLACE[c] || c))
  const scope = p.programmes ? ` through ${p.programmes.length} programmes` : typeof p.stores === 'number' ? ` across ${fmt(p.stores)} ${p.service === 'research' ? 'outlets' : 'stores'}` : ''
  return `Niche carried out ${what} for ${p.brand}${scope} in ${where}.`
}
// An archive project without a case study: the facts from the project log and its photos.
function projectPage(p, i) {
  const list = standaloneProjects
  const [prev, next] = prevNext(p.slug)
  const svc = svcBy[PRIMARY[p.service]]
  const same = relatedWork(p.slug, p.service)
  const cap = esc(`${p.brand}: ${p.title}`)
  const pimg = f => `/projects/${p.slug}/${f}`
  const [stat, statLabel] = projectStat(p)
  const big = p.photos[0]   // 01 is the hand-picked lead photo
  const body = `
    <section class="phero phero--case">
      ${p.photos.length ? `<div class="phero__bg" style="background-image:url('${pimg('cover.webp')}')"></div>` : p.stockCover ? `<div class="phero__bg" style="background-image:url('/${p.stockCover}')"></div>` : ''}
      <div class="wrap csh">
        <div class="csh__copy">
          ${crumbs([['Case studies', '/case-studies/'], [p.brand]])}
          <ul class="csh__pills"><li><a href="/case-studies/?s=${p.service}">${SERVICE_LABEL[p.service]}</a></li>${p.countries.map(w => `<li>${icon('pin')}${w}</li>`).join('')}</ul>
          <h1 class="phero__title">${p.brand}</h1>
          <p class="csh__sub">${p.title}</p>
          <p class="csh__lead">${projectLead(p)}</p>
          <dl class="csh__stats">${p.programmes || typeof p.stores === 'number' ? `<div><dt>${statLabel}</dt><dd>${stat}</dd></div>` : ''}<div><dt>countries</dt><dd>${p.countries.length}</dd></div></dl>
          <div class="phero__btns">
            <a class="btn btn--red btn--lg" href="/contact/?service=${svc?.slug || ''}">Request a proposal ${icon('arrow')}</a>
            ${p.photos.length > 1 ? `<a class="btn btn--ghost btn--lg" href="#gallery">View project photos</a>` : svc ? `<a class="btn btn--ghost btn--lg" href="${svcUrl(svc)}">About ${svc.name.toLowerCase()}</a>` : ''}
          </div>
        </div>
        ${big
          ? `<figure class="csh__img"><img src="${pimg(big[0])}" alt="${cap}"></figure>`
          : p.stockCover ? `<figure class="csh__img csh__img--stock"><img src="/${p.stockCover}" alt="${esc(SERVICE_LABEL[p.service])}"></figure>`
          : `<figure class="csh__img csh__img--empty" aria-hidden="true">${icon(SVC_ICON[p.service])}<span>${SERVICE_LABEL[p.service]}</span></figure>`}
      </div>
    </section>

    <section class="story">
      <div class="wrap story__grid">
        <ol class="story__steps">
          <li><span>${icon('pin')}</span><div><p class="label">Markets</p><p class="story__big">${p.countries.join(', ')}</p></div></li>
          <li><span>${icon('brief')}</span><div><p class="label">Service</p><p class="story__big">${svc ? svc.line : SERVICE_LABEL[p.service]}</p></div></li>
        </ol>
        <aside class="story__side">
          <p class="label">Service</p>
          <ul class="story__svcs">${svc ? `<li><a href="${svcUrl(svc)}">${icon(svc.icon)}<span><b>${svc.name}</b><small>${svc.line}</small></span>${icon('arrow', 'ico story__go')}</a></li>` : ''}</ul>
          <a class="btn btn--red" href="/contact/?service=${svc?.slug || ''}">Request a proposal ${icon('arrow')}</a>
        </aside>
      </div>
    </section>

    ${p.photos.length > 1 ? `
    <section class="infield infield--case" id="gallery">
      <div class="wrap">
        <div class="section-head"><p class="label">Gallery</p><h2 class="h2">Project photos.</h2></div>
        <div class="masonry masonry--static">${p.photos.map(([f, w, h]) => `<figure style="--ar:${(w / h).toFixed(3)}"><img src="${pimg(f)}" alt="${cap}" loading="lazy"></figure>`).join('')}</div>
      </div>
    </section>` : ''}

    <section class="more">
      <div class="wrap">
        ${same.length ? `<div class="section-head section-head--row"><div><p class="label">More ${SERVICE_LABEL[p.service].toLowerCase()}</p><h2 class="h2">Related case studies.</h2></div><a class="link-more" href="/case-studies/?s=${p.service}">See all ${icon('arrow')}</a></div><ul class="cgrid cgrid--3">${same.map(caseCard).join('')}</ul>` : ''}
        <div class="pn">
          <a class="pn__a" href="/case-studies/${prev.slug}/"><small>← Previous case study</small><b>${prev.brand}</b></a>
          <a class="pn__a pn__a--next" href="/case-studies/${next.slug}/"><small>Next case study →</small><b>${next.brand}</b></a>
        </div>
      </div>
    </section>
    ${cta({ title: 'Planning a similar project?', href: `/contact/?service=${svc?.slug || ''}`, label: 'Get a proposal' })}`
  return shell({ title: `${p.brand}: ${p.title} | Niche Case Study`, desc: projectLead(p).slice(0, 155), path: `/case-studies/${p.slug}/`, page: 'case', body })
}

function aboutPage() {
  const body = `
    <section class="phero phero--about">
      <span class="phero__ghost" aria-hidden="true">2003</span>
      <div class="wrap">
        ${crumbs([['About']])}
        <p class="label">About Niche</p>
        <h1 class="phero__title">A field marketing company, <em>established in 2003.</em></h1>
        <p class="phero__lead">Niche Marketing Management is a privately owned field marketing company, founded and headquartered in Dubai. Our trained staff provide retail audits, merchandising, promotions and installation services for brands across the Middle East, North Africa and Asia.</p>
        <ol class="milestones">
          <li><b>2003</b><span>Founded in Dubai</span></li>
          <li><b>17</b><span>Countries in the network</span></li>
          <li><b>20+</b><span>Operational offices</span></li>
          <li><b>250+</b><span>People on the team</span></li>
          <li><b>Today</b><span>One contact across MENA</span></li>
        </ol>
      </div>
    </section>
    <!--@proof-->
    <!--@why-->
    <!--@network-->
    <!--@industries-->
    <!--@group-->
    <!--@how-->
    <!--@clients-->
    ${cta()}`
  return shell({ title: 'About Niche Marketing Management | Field Marketing Company in Dubai', desc: 'Niche Marketing Management is a privately owned field marketing company founded in Dubai in 2003, with 250+ staff and 20+ offices in 17 countries.', path: '/about/', page: 'about', body })
}

function contactPage() {
  const body = `
    <!--@contact-->
    <section class="offices">
      <div class="wrap">
        <div class="hq">
          <div class="hq__map"><iframe src="https://www.google.com/maps?q=25.269051,55.332878&amp;z=17&amp;output=embed" title="Map: Niche head office, Al Dalal Building, 11A St, Al Khabaisi, Deira, Dubai" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe></div>
          <div class="hq__card">
            <p class="label">Head office</p>
            <h2 class="hq__title">Dubai head office.</h2>
            <p class="hq__addr">B Block, M Floor, Al Dalal Building<br>11A St, Al Khabaisi, Deira<br>Dubai, United Arab Emirates<br>PO Box 81605</p>
            <ul class="hq__list">
              <li>${icon('call')}<a href="tel:+97142978868">+971 4 297 8868</a></li>
              <li>${icon('mail')}<a href="mailto:info@nicheme.com">info@nicheme.com</a></li>
              <li>${icon('clock')}<span>It's <b data-clock="Asia/Dubai">--:--</b> in Dubai</span></li>
            </ul>
            <a class="btn btn--red" href="https://www.google.com/maps/dir/?api=1&amp;destination=25.269051,55.332878" target="_blank" rel="noopener">Get directions ${icon('arrow')}</a>
          </div>
        </div>
        <div class="section-head section-head--row"><div><p class="label">Offices</p><h2 class="h2">Regional offices.</h2></div><a class="link-more" href="/about/#network">About our network ${icon('arrow')}</a></div>
        <div class="board" data-board></div>
      </div>
    </section>
    <section class="svfaq">
      <div class="wrap svfaq__grid">
        <div class="section-head"><p class="label">Questions</p><h2 class="h2">Frequently asked questions.</h2><p class="lead">Or browse our <a href="/services/">services</a> and <a href="/case-studies/">case studies</a>.</p></div>
        ${faq(FAQ({ name: '' }))}
      </div>
    </section>`
  return shell({ title: 'Contact Niche Marketing Management | Dubai, UAE', desc: 'Contact Niche Marketing Management in Dubai to request a field marketing proposal. We respond within one working day. +971 4 297 8868 · info@nicheme.com', path: '/contact/', page: 'contact', body })
}

// Role families we hire for. Not live vacancies: openings follow the programmes.
export const ROLES = [
  ['merch', 'Merchandiser', 'Field', 'Maintain stock levels, facings and planogram compliance in assigned stores.'],
  ['audit', 'Retail auditor', 'Field', 'Record availability, pricing and displays, and submit visit reports with photos.'],
  ['mystery', 'Mystery shopper', 'Field', 'Visit stores and showrooms as a customer and evaluate the service provided.'],
  ['ambassador', 'Brand ambassador / promoter', 'Field', 'Represent client brands in store, at events and during sampling campaigns.'],
  ['route', 'Field supervisor', 'Field', 'Supervise field teams, check work quality and manage route schedules.'],
  ['install', 'Installation & production crew', 'Workshop', 'Produce and install displays, fixtures and POSM made in-house.'],
  ['dashboard', 'Data & reporting analyst', 'Office', 'Prepare client reports from field data within 24 hours.'],
  ['handshake', 'Account & project manager', 'Office', 'Plan projects with clients and manage delivery across markets.'],
]
const COUNTRIES17 = ['United Arab Emirates', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Oman', 'Bahrain', 'Jordan', 'Lebanon', 'Syria', 'Iraq', 'Egypt', 'Morocco', 'Tunisia', 'Algeria', 'Yemen', 'Pakistan', 'Mauritius']

// Attribution for openly licensed photos (CC BY / BY-SA). The licences require a credit;
// it lives here, linked from the footer, instead of on the images themselves.
function creditsPage() {
  const list = cases.filter(c => c.stockCredit)
  const body = `
    <section class="phero">
      <div class="wrap">
        ${crumbs([['Image credits']])}
        <p class="label">Image credits</p>
        <h1 class="phero__title">Image credits.</h1>
        <p class="phero__lead">Some case study images are used under Creative Commons licences.</p>
      </div>
    </section>
    <section class="svfaq">
      <div class="wrap">
        <ul class="credits">${list.map(c => `<li><b>${c.brand}</b><span><a href="${c.stockCredit[1]}" target="_blank" rel="noopener">${c.stockCredit[0]}</a></span></li>`).join('')}</ul>
      </div>
    </section>`
  return shell({ title: 'Image Credits | Niche', desc: 'Credits for images used under Creative Commons licences.', path: '/credits/', page: 'credits', body })
}

function careersPage() {
  const body = `
    <section class="phero phero--careers">
      <div class="wrap phero__grid">
        <div>
          ${crumbs([['Careers']])}
          <p class="label">Careers</p>
          <h1 class="phero__title">Careers in <em>field marketing.</em></h1>
          <p class="phero__lead">Niche employs 250+ staff directly across 17 countries, in field, workshop and office roles, including our Dubai-based reporting team.</p>
          <div class="phero__btns">
            <a class="btn btn--red btn--lg" href="#apply">Apply now ${icon('arrow')}</a>
            <a class="btn btn--ghost btn--lg" href="#roles">See the roles</a>
          </div>
        </div>
        <div class="crh" aria-hidden="true">
          <img class="crh__a" src="/work/mentos-air-action-sampling/06.webp" alt="">
          <img class="crh__b" src="/work/gorilla-energy-promotion-logistics/03.webp" alt="">
          <img class="crh__c" src="/work/gorilla-energy-promotion-logistics/01.webp" alt="">
          <div class="crh__chip crh__chip--red"><b>250+</b><span>people, employed directly</span></div>
          <div class="crh__chip"><b>17</b><span>countries to work in</span></div>
        </div>
      </div>
    </section>

    <section class="perks">
      <div class="wrap">
        <div class="section-head"><p class="label">Why Niche</p><h2 class="h2">Working at Niche.</h2></div>
        <ul class="perks__grid">
          <li>${icon('users')}<b>Employed by Niche</b><p>Field staff are employed by Niche directly, not through a third-party agency.</p></li>
          <li>${icon('globe')}<b>17 countries, 20+ offices</b><p>Opportunities across our markets in the Gulf, North Africa and Pakistan.</p></li>
          <li>${icon('brief')}<b>Training provided</b><p>Each project begins with training on the brand, the outlets and the reporting app.</p></li>
          <li>${icon('calendar')}<b>Since 2003</b><p>A privately owned company, founded and headquartered in Dubai.</p></li>
        </ul>
      </div>
    </section>

    <section class="roles" id="roles">
      <div class="wrap">
        <div class="section-head section-head--row"><div><p class="label">Roles</p><h2 class="h2">Roles we recruit for.</h2></div><p class="roles__note">Vacancies depend on current projects. Select a role and country, and we will keep your CV on file for suitable openings.</p></div>
        <ul class="roles__grid">${ROLES.map(([ic, name, where, line], i) => `
          <li><a class="role" href="#apply" data-role="${esc(name)}" style="--k:${i}">
            <span class="role__top">${icon(ic, 'ico role__ico')}<em>${where}</em></span>
            <b>${name}</b><span class="role__line">${line}</span>
            <span class="role__go">Apply ${icon('arrow')}</span>
          </a></li>`).join('')}
        </ul>
      </div>
    </section>

    <section class="how how--careers" id="how">
      <div class="wrap">
        <div class="section-head"><p class="label">How hiring works</p><h2 class="h2">Recruitment process.</h2></div>
        <div class="steps__line" aria-hidden="true"><i data-steps-fill></i></div>
        <ol class="steps">
          <li><span>01</span>${icon('mail', 'step__ico')}<h3>Apply</h3><p>Send your details and CV. Tell us the role and the country.</p></li>
          <li><span>02</span>${icon('call', 'step__ico')}<h3>Meet us</h3><p>A call or a meeting with the team in your country.</p></li>
          <li><span>03</span>${icon('brief', 'step__ico')}<h3>Training</h3><p>The brand, the outlets, the standards and the reporting app.</p></li>
          <li><span>04</span>${icon('store', 'step__ico')}<h3>In the field</h3><p>Your first assignment, supported by a supervisor.</p></li>
        </ol>
      </div>
    </section>

    <section class="apply" id="apply" aria-labelledby="apply-title">
      <div class="wrap apply__grid">
        <div class="apply__intro">
          <p class="label">Apply</p>
          <h2 id="apply-title" class="h2">Send us your CV.</h2>
          <p class="lead">Fill in the form and your email app opens with everything ready. Attach your CV before you send it.</p>
          <ul class="contact__direct">
            <li><a href="mailto:info@nicheme.com?subject=Careers"><i data-icon="mail"></i><span><small>Email</small>info@nicheme.com</span></a></li>
            <li><a href="tel:+97142978868"><i data-icon="call"></i><span><small>Head office</small>+971 4 297 8868</span></a></li>
          </ul>
        </div>
        <form class="brief apply__form" data-apply novalidate>
          <div class="form__row">
            <label class="field"><input name="name" autocomplete="name" required placeholder=" "><span>Full name</span></label>
            <label class="field"><input name="email" type="email" autocomplete="email" required placeholder=" "><span>Email</span></label>
          </div>
          <div class="form__row">
            <label class="field"><input name="phone" type="tel" autocomplete="tel" placeholder=" "><span>Phone (optional)</span></label>
            <label class="field field--select"><select name="country" required><option value="" selected disabled></option>${COUNTRIES17.map(c => `<option>${c}</option>`).join('')}</select><span>Country</span></label>
          </div>
          <div class="form__row">
            <label class="field field--select"><select name="role" required><option value="" selected disabled></option>${ROLES.map(r => `<option>${r[1]}</option>`).join('')}<option>Something else</option></select><span>Role</span></label>
            <label class="field"><input name="link" type="url" placeholder=" "><span>LinkedIn or CV link (optional)</span></label>
          </div>
          <label class="field"><textarea name="message" rows="3" placeholder=" "></textarea><span>Languages, experience, when you can start</span></label>
          <div class="brief__foot">
            <p class="brief__sum">We read every application and reply if there is a fit.</p>
            <button class="btn btn--red btn--lg" type="submit">Send application <i data-icon="arrow"></i></button>
          </div>
          <div class="form__done" data-done hidden><i data-icon="check"></i><b>Application ready</b><span>Your email app is opening. Attach your CV, then send.</span></div>
        </form>
      </div>
    </section>`
  return shell({ title: 'Careers | Field Marketing Jobs in Dubai, UAE & MENA | Niche', desc: 'Field marketing jobs at Niche Marketing Management: merchandisers, retail auditors, mystery shoppers, promoters, supervisors and office roles in 17 countries.', path: '/careers/', page: 'careers', body })
}

// ---------------------------------------------------------------- write
export function writePages() {
  for (const d of ['services', 'case-studies', 'about', 'contact', 'careers', 'credits']) rmSync(resolve(ROOT, d), { recursive: true, force: true })
  const out = [
    ['services/index.html', servicesIndex()],
    ...SVCS.map((s, i) => [`services/${s.slug}/index.html`, servicePage(s, i)]),
    ['case-studies/index.html', casesIndex()],
    ...cases.map((c, i) => [`case-studies/${c.slug}/index.html`, casePage(c, i)]),
    ...standaloneProjects.map((p, i) => [`case-studies/${p.slug}/index.html`, projectPage(p, i)]),
    ['about/index.html', aboutPage()],
    ['contact/index.html', contactPage()],
    ['careers/index.html', careersPage()],
    ['credits/index.html', creditsPage()],
  ]
  const inputs = { main: resolve(ROOT, 'index.html') }
  for (const [file, html] of out) {
    const p = resolve(ROOT, file)
    mkdirSync(dirname(p), { recursive: true })
    writeFileSync(p, html)
    inputs[file.replace(/\/index\.html$/, '').replace(/\//g, '_')] = p
  }
  return inputs
}

const workChips = () => `<div class="chips" role="group" aria-label="Filter projects">${FILTERS.map(([k, n], i) => `<button class="chip${i ? '' : ' is-on'}" type="button" data-filter="${k}" aria-pressed="${!i}">${i ? n : 'All'}</button>`).join('')}</div>`

export const GENERATED = { header, 'services-grid': servicesGrid, cta: () => cta(), 'work-chips': workChips }
export { existsSync }
