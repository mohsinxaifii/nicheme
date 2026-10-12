// Static page generator. Builds the shared header (with mega menus) and every
// sub-page from the data files, so all pages stay consistent and linked.
// Used by vite.config.js in both dev and build; generated pages are gitignored.
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { groups, allServices } from '../src/data/services.js'
import { cases, SERVICE_LABEL } from '../src/data/cases.js'
import { photos } from '../src/data/photos.js'
import { icon } from '../src/data/icons.js'

const ROOT = resolve(import.meta.dirname, '..')
const SVCS = allServices()
const svcBy = Object.fromEntries(SVCS.map(s => [s.slug, s]))
const caseBy = Object.fromEntries(cases.map(c => [c.slug, c]))
const PRIMARY = { audits: 'retail-audits', merch: 'merchandising', mystery: 'mystery-shopping', activation: 'promotions-activations', install: 'fixture-installation', production: 'production-posm' }
const FILTERS = [['all', 'All projects'], ['audits', 'Retail audits'], ['merch', 'Merchandising'], ['mystery', 'Mystery shopping'], ['activation', 'Activations & sampling'], ['install', 'Installation'], ['production', 'Production']]
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
const coverOf = s => s.photo || (s.cases[0] ? `${s.cases[0]}/cover.webp` : null)

// ---------------------------------------------------------------- partials
export function header() {
  const mega = `
    <div class="mega" data-mega role="menu">
      <div class="mega__cols">
        ${groups.map((g, gi) => `<div class="mega__col">
          <p class="mega__h">${icon(GROUP_ICONS[gi])}${g.name}</p>
          <ul>${g.services.map(s => `<li><a href="${svcUrl(s)}" data-prev="${s.photo ? `/work/${s.photo}` : ''}" data-line="${esc(s.line)}" data-name="${esc(s.name)}">${icon(s.icon)}<span>${s.name}</span></a></li>`).join('')}</ul>
        </div>`).join('')}
      </div>
      <aside class="mega__feat">
        <div class="mega__img"><img src="/work/${SVCS[0].photo}" alt="" data-mega-img></div>
        <p class="mega__name" data-mega-name>${SVCS[0].name}</p>
        <p class="mega__line" data-mega-line>${SVCS[0].line}</p>
        <a class="mega__all" href="/services/">All 14 services ${icon('arrow')}</a>
      </aside>
    </div>`
  const work = `
    <div class="mega mega--sm" data-mega role="menu">
      <ul class="drop">
        ${FILTERS.map(([k, n]) => `<li><a href="/case-studies/${k === 'all' ? '' : `?s=${k}`}"><span>${n}</span><small>${k === 'all' ? cases.length : cases.filter(c => c.service === k).length}</small></a></li>`).join('')}
      </ul>
      <div class="drop__cards">
        ${['red-bull-perfect-store-audits', 'labour-camp-carnival-of-games', 'dubai-chocolate-carrefour-displays'].map(sl => { const c = caseBy[sl]; return `<a class="dcard" href="${caseUrl(c)}"><img src="${img(sl, 'cover.webp')}" alt="" loading="lazy"><span><b>${c.brand}</b>${c.title}</span></a>` }).join('')}
      </div>
    </div>`
  const about = `
    <div class="mega mega--sm mega--about" data-mega role="menu">
      <ul class="drop drop--icons">
        <li><a href="/about/">${icon('building')}<span>About Niche<small>23 years on the shop floor</small></span></a></li>
        <li><a href="/about/#network">${icon('globe')}<span>Our network<small>17 countries, 20+ offices</small></span></a></li>
        <li><a href="/about/#industries">${icon('store')}<span>Industries<small>Seven sectors we know well</small></span></a></li>
        <li><a href="/about/#group">${icon('factory')}<span>Group companies<small>Production, shipping, tracking</small></span></a></li>
        <li><a href="/about/#how">${icon('route')}<span>How we work<small>Brief to report in four steps</small></span></a></li>
      </ul>
    </div>`
  return `
  <header class="nav" data-nav>
    <div class="nav__bar">
      <a class="logo" href="/"><img src="/brand/niche-logo.png" alt="Niche Marketing Management" width="2030" height="361"></a>
      <nav class="nav__links" aria-label="Main">
        <div class="nav__item" data-item><a class="nav__top" href="/services/" data-nav-key="services" aria-haspopup="true">Services ${chev}</a>${mega}</div>
        <div class="nav__item" data-item><a class="nav__top" href="/case-studies/" data-nav-key="case-studies" aria-haspopup="true">Case studies ${chev}</a>${work}</div>
        <div class="nav__item" data-item><a class="nav__top" href="/about/" data-nav-key="about" aria-haspopup="true">About ${chev}</a>${about}</div>
        <div class="nav__item"><a class="nav__top" href="/contact/" data-nav-key="contact">Contact</a></div>
      </nav>
      <div class="nav__right">
        <button class="nav__lang" type="button" data-toast="The Arabic site is coming with launch." lang="ar">عربي</button>
        <a class="btn btn--red btn--sm" href="/contact/">Get a proposal ${icon('arrow')}</a>
        <button class="nav__burger" type="button" aria-label="Open menu" aria-expanded="false" data-burger><span></span><span></span></button>
      </div>
    </div>
  </header>
  <div class="menu" data-menu hidden>
    <nav aria-label="Mobile">
      <details><summary>Services ${chev}</summary>
        ${groups.map(g => `<p class="menu__h">${g.name}</p><ul>${g.services.map(s => `<li><a href="${svcUrl(s)}">${icon(s.icon)}${s.name}</a></li>`).join('')}</ul>`).join('')}
        <a class="menu__all" href="/services/">All services ${icon('arrow')}</a>
      </details>
      <details><summary>Case studies ${chev}</summary><ul>${FILTERS.map(([k, n]) => `<li><a href="/case-studies/${k === 'all' ? '' : `?s=${k}`}">${n}</a></li>`).join('')}</ul></details>
      <details><summary>About ${chev}</summary><ul><li><a href="/about/">About Niche</a></li><li><a href="/about/#network">Our network</a></li><li><a href="/about/#industries">Industries</a></li><li><a href="/about/#group">Group companies</a></li></ul></details>
      <a href="/contact/" class="menu__link">Contact</a>
      <a href="/contact/" class="menu__cta">Get a proposal ${icon('arrow')}</a>
    </nav>
    <p class="menu__foot">+971 4 297 8868 · info@nicheme.com</p>
  </div>`
}

// home + services page: the 14 cards, each a real link
export function servicesGrid() {
  return groups.map(g => `
    <div class="sg">
      <div class="sg__head"><h3>${g.name}</h3><p>${g.intro}</p></div>
      <ul class="sg__cards">${g.services.map(s => `
        <li><a class="sc" href="${svcUrl(s)}">
          ${s.photo ? `<img class="sc__img" src="/work/${s.photo}" alt="" loading="lazy">` : ''}
          <span class="sc__top">${icon(s.icon, 'ico sc__ico')}${icon('arrow', 'ico sc__arrow')}</span>
          <span class="sc__name">${s.name}</span>
          <span class="sc__line">${s.line}</span>
          <span class="sc__proof">${s.proof ? `<b>${s.proof[0]}</b><small>${s.proof[1]}</small>` : `<small>${s.link ? 'Through Connexis, part of the Niche Group' : 'Supports what happens in store'}</small>`}</span>
        </a></li>`).join('')}
      </ul>
    </div>`).join('')
}

export function cta({ title = 'Need eyes and ears in 17 markets?', text = 'Tell us what you need and where. We reply within one working day with a plan and a price.', href = '/contact/', label = 'Build your brief' } = {}) {
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

const caseCard = c => `
  <li data-service="${c.service}"><a class="cc" href="${caseUrl(c)}">
    <img src="${img(c.slug, 'cover.webp')}" alt="" loading="lazy">
    <span class="cc__pill">${SERVICE_LABEL[c.service]}</span>
    <span class="cc__stat"><b>${c.stat}</b>${c.statLabel}</span>
    <span class="cc__meta"><b>${c.brand}</b><span>${c.title}</span></span>
  </a></li>`

const FAQ = s => [
  ['Which countries do you cover?', 'Our own teams work in 17 countries from 20+ offices: the UAE, Saudi Arabia, Qatar, Kuwait, Oman, Bahrain, Jordan, Lebanon, Syria, Iraq, Egypt, Morocco, Tunisia, Algeria, Yemen, Pakistan and Mauritius.'],
  ['How fast do we see the results?', 'Field staff report from hand-held devices. Our data team in Dubai turns each visit into a report within 24 hours, or on a schedule you agree, with photo evidence.'],
  [`Can we start ${s.name.toLowerCase().includes('vehicle') ? 'small' : 'in one market'}?`, 'Yes. Programmes can start in a single city and grow across the region, with one key contact and centralised billing throughout.'],
  ['How do we get a proposal?', 'Send us a short brief: what you need, where and when. We reply within one working day with a plan and a price.'],
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
  <link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&family=Noto+Kufi+Arabic:wght@500&display=swap" rel="stylesheet">
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
          <h1 class="phero__title">Fourteen ways we put brands <em>on the shelf.</em></h1>
          <p class="phero__lead">Retail intelligence, field execution, consumer engagement and in-house production, run by our own people in 17 countries and reported through one system.</p>
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
            <span class="srow__img">${coverOf(s) ? `<img src="/work/${coverOf(s)}" alt="" loading="lazy">` : icon(s.icon)}</span>
            <span class="srow__body">${icon(s.icon, 'ico srow__ico')}<b>${s.name}</b><span>${s.line}</span>
              ${s.proof ? `<em><strong>${s.proof[0]}</strong> ${s.proof[1]}</em>` : ''}</span>
            <span class="srow__go">${icon('arrow')}</span>
          </a></li>`).join('')}
        </ul>
      </div>
    </section>`).join('')}
    <!--@how-->
    ${cta({ title: 'Not sure which service you need?', text: 'Tell us the problem on the shop floor. We will put together the right mix of services, in the right markets.' })}`
  return shell({ title: 'Services | Retail Audits, Merchandising, Activations in MENA | Niche', desc: 'Fourteen field marketing services across 17 countries: retail audits, mystery shopping, merchandising, activations, sampling, installation, production and more.', path: '/services/', page: 'services', body })
}

function servicePage(s, i) {
  const prev = SVCS[(i - 1 + SVCS.length) % SVCS.length], next = SVCS[(i + 1) % SVCS.length]
  const rel = s.cases.map(sl => caseBy[sl])
  const gallery = rel.flatMap(c => (photos[c.slug] || []).map(([f, w, h]) => ({ c, f, w, h }))).slice(0, 12)
  const siblings = groups[s.gi].services.filter(x => x.slug !== s.slug)
  const hero = s.photo ? `/work/${s.photo}` : coverOf(s) ? `/work/${coverOf(s)}` : null
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
            ${rel.length ? `<a class="btn btn--ghost btn--lg" href="#work">See the work</a>` : s.link ? `<a class="btn btn--ghost btn--lg" href="${s.link}" target="_blank" rel="noopener">Visit Connexis</a>` : ''}
          </div>
        </div>
        <div class="svh__media">
          ${hero ? `<img src="${hero}" alt="${esc(s.name)} by Niche">` : `<div class="svh__art">${icon(s.icon)}</div>`}
          ${s.proof ? `<div class="svh__proof"><b data-countup>${s.proof[0]}</b><span>${s.proof[1]}</span></div>` : ''}
          <div class="svh__chip">${icon('check')}<span><b>Reported within 24 h</b><small>Photo, GPS and time stamps</small></span></div>
        </div>
      </div>
    </section>

    <section class="inc">
      <div class="wrap">
        <div class="section-head"><p class="label">What's included</p><h2 class="h2">Everything we handle for you.</h2><p class="lead">${s.name}, delivered by our own trained teams and reported through one system.</p></div>
        <ul class="inc__grid">${s.included.map((x, k) => `<li style="--k:${k}"><span class="inc__n">${String(k + 1).padStart(2, '0')}</span>${icon('check', 'ico inc__tick')}<b>${x}</b></li>`).join('')}</ul>
      </div>
    </section>

    ${gallery.length ? `
    <section class="field" id="work">
      <div class="wrap">
        <div class="section-head"><p class="label">In the field</p><h2 class="h2">Real work, photographed by our teams.</h2><p class="lead">Every photo below is from a Niche programme. Select one to see it full size.</p></div>
        <div class="masonry" data-lightbox>${gallery.map(g => `<a href="${img(g.c.slug, g.f)}" data-caption="${esc(`${g.c.brand}: ${g.c.title}`)}" style="--ar:${(g.w / g.h).toFixed(3)}"><img src="${img(g.c.slug, g.f)}" alt="${esc(g.c.brand)}" loading="lazy"><span>${g.c.brand}</span></a>`).join('')}</div>
      </div>
    </section>
    <section class="relcases">
      <div class="wrap">
        <div class="section-head section-head--row"><div><p class="label">Case studies</p><h2 class="h2">Programmes we have run.</h2></div><a class="link-more" href="/case-studies/">All case studies ${icon('arrow')}</a></div>
        <ul class="cgrid">${rel.map(caseCard).join('')}</ul>
      </div>
    </section>` : ''}

    <!--@how-->

    <section class="svfaq">
      <div class="wrap svfaq__grid">
        <div class="section-head"><p class="label">Questions</p><h2 class="h2">Good to know.</h2><p class="lead">Anything else? <a href="/contact/?service=${s.slug}">Send us your brief</a>.</p></div>
        ${faq(FAQ(s))}
      </div>
    </section>

    <section class="more">
      <div class="wrap">
        ${siblings.length ? `<p class="label">More in ${s.group}</p><ul class="more__chips">${siblings.map(x => `<li><a href="${svcUrl(x)}">${icon(x.icon)}${x.name}</a></li>`).join('')}<li><a href="/services/">All services ${icon('arrow')}</a></li></ul>` : ''}
        <div class="pn">
          <a class="pn__a" href="${svcUrl(prev)}"><small>← Previous service</small><b>${prev.name}</b></a>
          <a class="pn__a pn__a--next" href="${svcUrl(next)}"><small>Next service →</small><b>${next.name}</b></a>
        </div>
      </div>
    </section>
    ${cta({ title: 'Let\'s plan your programme.', text: `${s.name} in one market or all 17. Tell us what you need and we reply within one working day.`, href: `/contact/?service=${s.slug}`, label: 'Get a proposal' })}`
  return shell({ title: `${s.name} in Dubai, the UAE & MENA | Niche`, desc: `${s.line} ${s.body}`.slice(0, 155), path: svcUrl(s), page: 'service', body })
}

function casesIndex() {
  const work = readFileSync(resolve(ROOT, 'src/partials/work.html'), 'utf8')
  const body = `
    <section class="phero phero--cases">
      <div class="wrap">
        ${crumbs([['Case studies']])}
        <p class="label">Case studies</p>
        <h1 class="phero__title">30 programmes. <em>23 years.</em> 17 countries.</h1>
        <p class="phero__lead">Audits, field forces, mystery shopping, activations, installations and production for the world's great brands. Every number comes from the programme itself.</p>
      </div>
    </section>
    ${work.replace('class="work"', 'class="work work--page"')}
    <section class="allcases" id="all">
      <div class="wrap">
        <div class="section-head section-head--row"><div><p class="label">All projects</p><h2 class="h2">Browse by service.</h2></div></div>
        <div class="chips chips--light" role="group" aria-label="Filter projects" data-grid-filters>${FILTERS.map(([k, n], i) => `<button class="chip${i ? '' : ' is-on'}" type="button" data-gf="${k}">${n}</button>`).join('')}</div>
        <ul class="cgrid" data-cgrid>${cases.map(caseCard).join('')}</ul>
      </div>
    </section>
    ${cta({ title: 'Want results like these?', text: 'Tell us your brief. We reply within one working day with a plan and a price.' })}`
  return shell({ title: 'Case Studies | Field Marketing Work Across MENA | Niche', desc: '30 field marketing programmes across MENA: retail audits, merchandising, mystery shopping, activations, installation and production.', path: '/case-studies/', page: 'cases', body })
}

function casePage(c, i) {
  const list = photos[c.slug] || []
  const svcs = servicesForCase(c.slug)
  const prev = cases[(i - 1 + cases.length) % cases.length], next = cases[(i + 1) % cases.length]
  const same = cases.filter(x => x.service === c.service && x.slug !== c.slug).slice(0, 3)
  const body = `
    <section class="phero phero--case">
      <div class="phero__bg" style="background-image:url('${img(c.slug, 'cover.webp')}')"></div>
      <div class="wrap csh">
        <div class="csh__copy">
          ${crumbs([['Case studies', '/case-studies/'], [c.brand]])}
          <ul class="csh__pills"><li><a href="/case-studies/?s=${c.service}">${SERVICE_LABEL[c.service]}</a></li>${c.where.split(', ').map(w => `<li>${icon('pin')}${w}</li>`).join('')}</ul>
          <h1 class="phero__title">${c.brand}</h1>
          <p class="csh__sub">${c.title}</p>
          <dl class="csh__stats">${c.stats.map(([b, s]) => `<div><dt>${s}</dt><dd>${b}</dd></div>`).join('')}</dl>
        </div>
        <figure class="csh__img"><img src="${img(c.slug, list.slice().sort((a, b) => b[1] * b[2] - a[1] * a[2])[0]?.[0] || 'cover.webp')}" alt="${esc(`${c.brand}: ${c.title}`)}"></figure>
      </div>
    </section>

    <section class="story">
      <div class="wrap story__grid">
        <ol class="story__steps">
          <li><span>${icon('brief')}</span><div><p class="label">The challenge</p><p class="story__big">${c.challenge}</p></div></li>
          <li><span>${icon('users')}</span><div><p class="label">What we did</p><ul class="story__did">${c.did.map(d => `<li>${icon('check')}${d}</li>`).join('')}</ul></div></li>
          <li><span>${icon('dashboard')}</span><div><p class="label">The result</p><p class="story__big story__big--red">${c.result}</p></div></li>
        </ol>
        <aside class="story__side">
          <p class="label">Services used</p>
          <ul class="story__svcs">${svcs.map(s => `<li><a href="${svcUrl(s)}">${icon(s.icon)}<span><b>${s.name}</b><small>${s.line}</small></span>${icon('arrow', 'ico story__go')}</a></li>`).join('')}</ul>
          <a class="btn btn--red" href="/contact/?service=${svcs[0]?.slug || ''}">Start a similar project ${icon('arrow')}</a>
        </aside>
      </div>
    </section>

    ${list.length > 1 ? `
    <section class="field field--case">
      <div class="wrap">
        <div class="section-head"><p class="label">Gallery</p><h2 class="h2">From the programme.</h2></div>
        <div class="masonry" data-lightbox>${list.map(([f, w, h]) => `<a href="${img(c.slug, f)}" data-caption="${esc(`${c.brand}: ${c.title}`)}" style="--ar:${(w / h).toFixed(3)}"><img src="${img(c.slug, f)}" alt="${esc(c.brand)}" loading="lazy"></a>`).join('')}</div>
      </div>
    </section>` : ''}

    <section class="more">
      <div class="wrap">
        ${same.length ? `<div class="section-head section-head--row"><div><p class="label">More ${SERVICE_LABEL[c.service].toLowerCase()}</p><h2 class="h2">Related programmes.</h2></div><a class="link-more" href="/case-studies/?s=${c.service}">See all ${icon('arrow')}</a></div><ul class="cgrid cgrid--3">${same.map(caseCard).join('')}</ul>` : ''}
        <div class="pn">
          <a class="pn__a" href="${caseUrl(prev)}"><small>← Previous case</small><b>${prev.brand}</b></a>
          <a class="pn__a pn__a--next" href="${caseUrl(next)}"><small>Next case →</small><b>${next.brand}</b></a>
        </div>
      </div>
    </section>
    ${cta({ title: 'Start a similar project.', href: `/contact/?service=${svcs[0]?.slug || ''}`, label: 'Get a proposal' })}`
  return shell({ title: `${c.brand}: ${c.title} | Niche Case Study`, desc: `${c.challenge} ${c.result}`.slice(0, 155), path: caseUrl(c), page: 'case', body })
}

function aboutPage() {
  const body = `
    <section class="phero phero--about">
      <span class="phero__ghost" aria-hidden="true">2003</span>
      <div class="wrap">
        ${crumbs([['About']])}
        <p class="label">About Niche</p>
        <h1 class="phero__title">The eyes and ears of great brands, <em>since 2003.</em></h1>
        <p class="phero__lead">Niche Marketing Management is a privately owned field marketing company, founded and headquartered in Dubai. Our own trained teams audit, merchandise, promote and install for brands across the Middle East, North Africa and Asia.</p>
        <ol class="milestones">
          <li><b>2003</b><span>Founded in Dubai</span></li>
          <li><b>17</b><span>Countries in the network</span></li>
          <li><b>20+</b><span>Operational offices</span></li>
          <li><b>250+</b><span>People on the team</span></li>
          <li><b>Today</b><span>One partner for MENA</span></li>
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
  return shell({ title: 'About Niche Marketing Management | Field Marketing in MENA since 2003', desc: 'Privately owned field marketing company founded in Dubai in 2003. 250+ people, 20+ offices, 17 countries across MENA and Asia.', path: '/about/', page: 'about', body })
}

function contactPage() {
  const body = `
    <!--@contact-->
    <section class="offices">
      <div class="wrap">
        <div class="section-head section-head--row"><div><p class="label">Offices</p><h2 class="h2">Wherever you need us.</h2></div><a class="link-more" href="/about/#network">About our network ${icon('arrow')}</a></div>
        <div class="board" data-board></div>
      </div>
    </section>
    <section class="svfaq">
      <div class="wrap svfaq__grid">
        <div class="section-head"><p class="label">Questions</p><h2 class="h2">Before you send a brief.</h2><p class="lead">Or browse our <a href="/services/">services</a> and <a href="/case-studies/">case studies</a>.</p></div>
        ${faq(FAQ({ name: '' }))}
      </div>
    </section>`
  return shell({ title: 'Contact Niche | Get a Field Marketing Proposal', desc: 'Send a brief to Niche Marketing Management in Dubai. We reply within one working day with a plan and a price. +971 4 297 8868 · info@nicheme.com', path: '/contact/', page: 'contact', body })
}

// ---------------------------------------------------------------- write
export function writePages() {
  for (const d of ['services', 'case-studies', 'about', 'contact']) rmSync(resolve(ROOT, d), { recursive: true, force: true })
  const out = [
    ['services/index.html', servicesIndex()],
    ...SVCS.map((s, i) => [`services/${s.slug}/index.html`, servicePage(s, i)]),
    ['case-studies/index.html', casesIndex()],
    ...cases.map((c, i) => [`case-studies/${c.slug}/index.html`, casePage(c, i)]),
    ['about/index.html', aboutPage()],
    ['contact/index.html', contactPage()],
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

export const GENERATED = { header, 'services-grid': servicesGrid, cta: () => cta() }
export { existsSync }
