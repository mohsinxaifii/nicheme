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
import { AR, AR_GROUPS, AR_SERVICES, AR_SERVICE_LABEL } from '../src/data/ar.js'

const ROOT = resolve(import.meta.dirname, '..')
// Canonical origin, used for canonical links, og:url and the sitemap. No trailing slash.
export const SITE = 'https://nicheme.com'

// ---------------------------------------------------------------- language
// The generator runs once per language. Arabic covers the home page, the services
// index, the 14 service pages, about, contact and careers; case studies stay in
// English, so Arabic pages link straight to the English URL for those.
let LANG = 'en'
export const isAr = () => LANG === 'ar'
// t('English') -> the Arabic string when building /ar/, otherwise the English one.
const t = s => LANG === 'ar' ? (AR[s] ?? s) : s
// A page that exists in Arabic gets the /ar prefix; everything else stays English.
const AR_ROUTE = /^\/$|^\/services\/([a-z0-9-]+\/)?$|^\/(about|contact|careers)\/$/
const L = p => LANG === 'ar' && AR_ROUTE.test(p.split(/[?#]/)[0]) ? '/ar' + (p === '/' ? '/' : p) : p
// A service with its Arabic name, line, body and included list merged over the English.
// AR_SERVICES.proof is normally just the Arabic label (s.proof[0], the number, reads
// fine untranslated); a few services have a non-numeric proof[0] ("Census", "Break-fix")
// that needs its own Arabic word, so AR_SERVICES.proof may be the full [number, label] pair.
const sv = s => LANG === 'ar' && AR_SERVICES[s.slug]
  ? { ...s, ...AR_SERVICES[s.slug], proof: s.proof && (Array.isArray(AR_SERVICES[s.slug].proof) ? AR_SERVICES[s.slug].proof : [s.proof[0], AR_SERVICES[s.slug].proof || s.proof[1]]) }
  : s
const grp = g => LANG === 'ar' && AR_GROUPS[g.name] ? { ...g, ...AR_GROUPS[g.name] } : g
const svcLabel = k => LANG === 'ar' ? (AR_SERVICE_LABEL[k] || SERVICE_LABEL[k]) : SERVICE_LABEL[k]

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
// Meta descriptions: cut at the last whole word within the limit, never mid-word
// ("Castrol's distri…"). Arabic has no spaces between some particles and the next
// word, so this applies to both; space-splitting still finds the nearest break.
const clip = (s, n = 155) => {
  s = String(s).trim()
  if (s.length <= n) return s
  const cut = s.slice(0, n), sp = cut.lastIndexOf(' ')
  return (sp > n * 0.6 ? cut.slice(0, sp) : cut).trim()
}
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
          <p class="mega__h">${icon(GROUP_ICONS[gi])}${grp(g).name}</p>
          <ul>${g.services.map(x => sv(x)).map((s, k) => `<li><a href="${L(svcUrl(g.services[k]))}" data-prev="${s.photo ? `/${s.photo}` : ''}" data-line="${esc(s.line)}" data-name="${esc(s.name)}">${icon(s.icon)}<span>${s.name}</span></a></li>`).join('')}</ul>
        </div>`).join('')}
      </div>
      <aside class="mega__feat">
        <div class="mega__img"><img src="/${SVCS[0].photo}" alt="" data-mega-img></div>
        <p class="mega__name" data-mega-name>${sv(SVCS[0]).name}</p>
        <p class="mega__line" data-mega-line>${sv(SVCS[0]).line}</p>
        <a class="mega__all" href="${L('/services/')}">${t('All 14 services')} ${icon('arrow')}</a>
      </aside>
    </div>`
  const work = `
    <div class="mega mega--sm" data-mega role="menu">
      <ul class="drop">
        ${FILTERS.map(([k, n]) => `<li><a href="/case-studies/${k === 'all' ? '' : `?s=${k}`}"><span>${k === 'all' ? t('All case studies') : svcLabel(k)}</span><small>${countOf(k)}</small></a></li>`).join('')}
      </ul>
      <div class="drop__cards">
        ${['red-bull-perfect-store-audits', 'mentos-air-action-sampling', 'william-grant-mystery-shopping'].map(sl => { const c = caseBy[sl]; return `<a class="dcard" href="${caseUrl(c)}"><img src="/${caseCover(sl)}" alt="" loading="lazy"><span><b>${c.brand}</b>${c.title}</span></a>` }).join('')}
      </div>
    </div>`
  const about = `
    <div class="mega mega--sm mega--about" data-mega role="menu">
      <ul class="drop drop--icons">
        <li><a href="${L('/about/')}">${icon('building')}<span>${t('About Niche')}<small>${t('Field marketing since 2003')}</small></span></a></li>
        <li><a href="${L('/about/')}#network">${icon('globe')}<span>${t('Our network')}<small>${t('17 countries, 20+ offices')}</small></span></a></li>
        <li><a href="${L('/about/')}#industries">${icon('store')}<span>${t('Industries')}<small>${t('Sectors we work in')}</small></span></a></li>
        <li><a href="${L('/about/')}#group">${icon('factory')}<span>${t('Group companies')}<small>${t('Production, shipping, tracking')}</small></span></a></li>
        <li><a href="${L('/about/')}#how">${icon('route')}<span>${t('How we work')}<small>${t('Brief to report in four steps')}</small></span></a></li>
      </ul>
    </div>`
  return `
  <header class="nav" data-nav>
    <div class="nav__bar">
      <a class="logo" href="${L('/')}"><img src="/brand/niche-logo.png" alt="Niche Marketing Management" width="2030" height="361"></a>
      <nav class="nav__links" aria-label="${t('Main')}">
        <div class="nav__item"><a class="nav__top" href="${L('/')}" data-nav-key="home">${t('Home')}</a></div>
        <div class="nav__item" data-item><a class="nav__top" href="${L('/about/')}" data-nav-key="about" aria-haspopup="true">${t('About')} ${chev}</a>${about}</div>
        <div class="nav__item" data-item><a class="nav__top" href="${L('/services/')}" data-nav-key="services" aria-haspopup="true">${t('Services')} ${chev}</a>${mega}</div>
        <div class="nav__item" data-item><a class="nav__top" href="/case-studies/" data-nav-key="case-studies" aria-haspopup="true">${t('Case studies')} ${chev}</a>${work}</div>
        <div class="nav__item"><a class="nav__top" href="${L('/contact/')}" data-nav-key="contact">${t('Contact')}</a></div>
        <div class="nav__item"><a class="nav__top" href="${L('/careers/')}" data-nav-key="careers">${t('Careers')}</a></div>
      </nav>
      <div class="nav__right">
        <button class="nav__search" type="button" data-search-open aria-label="${t('Search the site')}" aria-keyshortcuts="Control+K Meta+K /">${icon('search')}<span class="nav__search-txt">${t('Search')}</span><kbd data-search-key>Ctrl K</kbd></button>
        <a class="nav__lang" href="${LANG === 'ar' ? '/' : '/ar/'}" data-lang-switch="${LANG === 'ar' ? 'en' : 'ar'}" aria-label="${LANG === 'ar' ? 'Switch to English' : t('Switch to Arabic')}" hreflang="${LANG === 'ar' ? 'en' : 'ar'}">${icon('globe')}<span>${LANG === 'ar' ? 'EN' : 'AR'}</span></a>
        <a class="btn btn--red btn--sm" href="${L('/contact/')}">${t('Get a proposal')} ${icon('arrow')}</a>
        <button class="nav__burger" type="button" aria-label="${t('Open menu')}" aria-expanded="false" data-burger><span></span><span></span></button>
      </div>
    </div>
  </header>
  <div class="menu" data-menu hidden>
    <nav aria-label="${t('Mobile')}">
      <button type="button" class="menu__search" data-search-open>${icon('search')}<span>${t('Search the site')}</span></button>
      <a href="${L('/')}" class="menu__link">${t('Home')}</a>
      <details><summary>${t('About')} ${chev}</summary><ul><li><a href="${L('/about/')}">${t('About Niche')}</a></li><li><a href="${L('/about/')}#network">${t('Our network')}</a></li><li><a href="${L('/about/')}#industries">${t('Industries')}</a></li><li><a href="${L('/about/')}#group">${t('Group companies')}</a></li></ul></details>
      <details><summary>${t('Services')} ${chev}</summary>
        ${groups.map(g => `<p class="menu__h">${grp(g).name}</p><ul>${g.services.map(s => `<li><a href="${L(svcUrl(s))}">${icon(s.icon)}${sv(s).name}</a></li>`).join('')}</ul>`).join('')}
        <a class="menu__all" href="${L('/services/')}">${t('All services')} ${icon('arrow')}</a>
      </details>
      <details><summary>${t('Case studies')} ${chev}</summary><ul>${FILTERS.map(([k]) => `<li><a href="/case-studies/${k === 'all' ? '' : `?s=${k}`}">${k === 'all' ? t('All case studies') : svcLabel(k)}</a></li>`).join('')}</ul></details>
      <a href="${L('/contact/')}" class="menu__link">${t('Contact')}</a>
      <a href="${L('/careers/')}" class="menu__link">${t('Careers')}</a>
      <a href="${L('/contact/')}" class="menu__cta">${t('Get a proposal')} ${icon('arrow')}</a>
    </nav>
    <p class="menu__foot">+971 4 297 8868 · info@nicheme.com<br>${t('B Block, M Floor, Al Dalal Building, 11A St, Al Khabaisi, Deira, Dubai')}</p>
  </div>`
}

// home + services page: the 14 cards, each a real link
export function servicesGrid() {
  return groups.map(g => `
    <div class="sg">
      <div class="sg__head"><h3>${grp(g).name}</h3><p>${grp(g).intro}</p></div>
      <ul class="sg__cards">${g.services.map(raw => { const s = sv(raw); return `
        <li><a class="sc" href="${L(svcUrl(raw))}">
          ${s.photo ? `<img class="sc__img" src="/${s.photo}" alt="" loading="lazy">` : ''}
          <span class="sc__top">${icon(s.icon, 'ico sc__ico')}${icon('arrow', 'ico sc__arrow')}</span>
          <span class="sc__name">${s.name}</span>
          <span class="sc__line">${s.line}</span>
          <span class="sc__proof">${s.proof ? `<b>${s.proof[0]}</b><small>${s.proof[1]}</small>` : `<small>${s.link ? t('Through Connexis, part of the Niche Group') : t('Supports what happens in store')}</small>`}</span>
        </a></li>` }).join('')}
      </ul>
    </div>`).join('')
}

export function cta({ title = t('Discuss your requirements with our team.'), text = t('Tell us what you need and where. We reply within one working day with a plan and a price.'), href = L('/contact/'), label = t('Build your brief') } = {}) {
  return `
    <section class="cta">
      <div class="wrap cta__in">
        <svg class="cta__mark" viewBox="0 0 40 40" aria-hidden="true"><path d="M8 32 32 8M12 8h20v20"/></svg>
        <div><h2 class="cta__title">${title}</h2><p>${text}</p></div>
        <div class="cta__btns"><a class="btn btn--light btn--lg" href="${href}">${label} ${icon('arrow')}</a><a class="cta__tel" href="tel:+97142978868">${icon('call')}+971 4 297 8868</a></div>
      </div>
    </section>`
}

const crumbs = list => `<nav class="crumbs" aria-label="${t('Breadcrumb')}"><a href="${L('/')}">${t('Home')}</a>${list.map(([n, u]) => u ? `<span>/</span><a href="${L(u)}">${n}</a>` : `<span>/</span><b>${n}</b>`).join('')}</nav>`

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

const FAQ = s => LANG === 'ar' ? [
  ['ما الدول التي تغطونها؟', 'تعمل فرقنا في 17 دولة من أكثر من 20 مكتباً: الإمارات والسعودية وقطر والكويت وعُمان والبحرين والأردن ولبنان وسوريا والعراق ومصر والمغرب وتونس والجزائر واليمن وباكستان وموريشيوس.'],
  ['ما سرعة رفع البيانات الميدانية؟', 'يرسل الفريق الميداني التقارير من أجهزة محمولة. ويسلّم فريق البيانات لدينا في دبي تقرير كل زيارة، مع إثبات مصوَّر، خلال 24 ساعة أو وفق جدول متفق عليه.'],
  ['هل يمكن البدء في سوق واحد؟', 'نعم. يمكن أن تبدأ البرامج في مدينة واحدة ثم تتوسع في المنطقة، مع نقطة تواصل واحدة وفوترة مركزية.'],
  ['كيف نطلب عرض سعر؟', 'أرسلوا طلباً موجزاً يحدد الخدمة والأسواق والتوقيت. نردّ خلال يوم عمل واحد بخطة عمل مقترحة والتسعير.'],
] : [
  ['Which countries do you cover?', 'Our own teams work in 17 countries from 20+ offices: the UAE, Saudi Arabia, Qatar, Kuwait, Oman, Bahrain, Jordan, Lebanon, Syria, Iraq, Egypt, Morocco, Tunisia, Algeria, Yemen, Pakistan and Mauritius.'],
  ['How quickly is field data reported?', 'Field staff submit reports from hand-held devices. Our Dubai-based data team delivers each visit report, with photo evidence, within 24 hours or on an agreed schedule.'],
  [`Can we start ${s.name.toLowerCase().includes('vehicle') ? 'small' : 'in one market'}?`, 'Yes. Programmes can begin in a single city and expand across the region, with one account contact and centralised billing.'],
  ['How do we request a proposal?', 'Send a short brief outlining the service, markets and timing. We respond within one working day with a proposed approach and pricing.'],
]
const faq = list => `<div class="faq">${list.map(([q, a], i) => `<details${i === 0 ? ' open' : ''}><summary><span>${q}</span><i class="faq__plus"></i></summary><p>${a}</p></details>`).join('')}</div>`

// ---------------------------------------------------------------- pages
// A partial reference; on /ar/ pages it points at the Arabic copy of that partial.
const P = n => LANG === 'ar' ? `<!--@ar-${n}-->` : `<!--@${n}-->`

function shell({ title, desc, path, page, body, head = '' }) {
  const ar = LANG === 'ar'
  // hreflang: only pages that exist in both languages advertise an alternate.
  const alt = AR_ROUTE.test(path.split(/[?#]/)[0]) ? `
  <link rel="alternate" hreflang="en" href="${SITE}${path}">
  <link rel="alternate" hreflang="ar" href="${SITE}/ar${path}">
  <link rel="alternate" hreflang="x-default" href="${SITE}${path}">` : ''
  return `<!doctype html>
<html lang="${ar ? 'ar' : 'en'}"${ar ? ' dir="rtl"' : ''}>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <meta name="description" content="${esc(desc)}">
  <meta name="theme-color" content="#0A0A0A">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="canonical" href="${SITE}${ar ? '/ar' : ''}${path}">${alt}
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${SITE}${ar ? '/ar' : ''}${path}">
  <meta property="og:site_name" content="${ar ? 'نيتش لإدارة التسويق' : 'Niche Marketing Management'}">
  <meta property="og:locale" content="${ar ? 'ar_AE' : 'en_US'}">
  <meta property="og:image" content="${SITE}/brand/og.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Niche Marketing Management — field marketing across the Middle East and North Africa">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(desc)}">
  <meta name="twitter:image" content="${SITE}/brand/og.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700${ar ? '&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700' : ''}&display=swap" rel="stylesheet">${head}
</head>
<body data-page="${page}">
  <a class="skip" href="#main">${t('Skip to content')}</a>
  ${P('header')}
  <main id="main">
${body}
  </main>
  ${P('footer')}
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
          ${crumbs([[t('Services')]])}
          <p class="label">${t('Services')}</p>
          <h1 class="phero__title">${LANG === 'ar' ? 'التسويق الميداني و<em>خدمات التجزئة.</em>' : 'Field marketing and <em>retail services.</em>'}</h1>
          <p class="phero__lead">${t('Fourteen services across retail intelligence, field execution, consumer engagement and production, delivered by Niche staff in 17 countries and reported through one system.')}</p>
          <ul class="phero__chips"><li><b>14</b>${t('services')}</li><li><b>4</b>${t('groups')}</li><li><b>17</b>${t('countries')}</li><li><b>24 h</b>${t('reporting')}</li></ul>
        </div>
        <div class="iconwall" aria-label="${t('All services')}">
          ${SVCS.map((raw, i) => { const s = sv(raw); return `<a href="${L(svcUrl(raw))}" style="--i:${i}" title="${esc(s.name)}">${icon(s.icon)}<span>${s.name}</span></a>` }).join('')}
        </div>
      </div>
    </section>
    ${groups.map((g, gi) => `
    <section class="sgroup${gi % 2 ? ' sgroup--alt' : ''}" id="${g.name.toLowerCase().replace(/[^a-z]+/g, '-')}">
      <div class="wrap sgroup__grid">
        <div class="sgroup__side">
          <span class="sgroup__num">0${gi + 1}</span>
          <p class="label">${icon(GROUP_ICONS[gi])} ${g.services.length} ${t('services')}</p>
          <h2 class="h2">${grp(g).name}</h2>
          <p class="lead">${grp(g).intro}</p>
        </div>
        <ul class="sgroup__list">${g.services.map(raw => { const s = sv(raw); return `
          <li><a class="srow" href="${L(svcUrl(raw))}">
            <span class="srow__img">${coverOf(raw) ? `<img src="/${coverOf(raw)}" alt="" loading="lazy">` : icon(s.icon)}</span>
            <span class="srow__body">${icon(s.icon, 'ico srow__ico')}<b>${s.name}</b><span>${s.line}</span>
              ${s.proof ? `<em><strong>${s.proof[0]}</strong> ${s.proof[1]}</em>` : ''}</span>
            <span class="srow__go">${icon('arrow')}</span>
          </a></li>` }).join('')}
        </ul>
      </div>
    </section>`).join('')}
    ${P('how')}
    <section class="svfaq">
      <div class="wrap svfaq__grid">
        <div class="section-head"><p class="label">${t('Questions')}</p><h2 class="h2">${t('Frequently asked questions.')}</h2><p class="lead">${t('For anything else,')} <a href="${L('/contact/')}">${t('contact our team')}</a>.</p></div>
        ${faq(FAQ({ name: '' }))}
      </div>
    </section>
    ${cta({ title: t('Need help choosing a service?'), text: t('Describe your objectives and markets, and our team will recommend a suitable combination of services.') })}`
  return shell({
    title: LANG === 'ar' ? 'خدمات التسويق الميداني في دبي والإمارات والمنطقة | نيتش لإدارة التسويق' : 'Field Marketing Services in Dubai, UAE & MENA | Niche Marketing Management',
    desc: LANG === 'ar' ? 'خدمات التسويق الميداني في 17 دولة: تدقيق التجزئة، والتسوق الخفي، والتسويق داخل المتاجر، وأبحاث السوق، والعروض الترويجية، وتوزيع العينات، وتركيب التجهيزات، وإنتاج مواد نقاط البيع، والخدمات اللوجستية.' : 'Field marketing services in 17 countries: retail audits, mystery shopping, merchandising, market research, promotions, sampling, fixture installation, POSM production and logistics.',
    path: '/services/', page: 'services', body })
}

// service page strip: how many more programmes of this kind are on record
// Takes the exact same relAll list the page's own "View all N" count is built from,
// so the two numbers on one page can never disagree (they used to: this used to
// recompute its own count from raw project-log rows, a different, larger universe
// than the case-study pages relAll counts). Shown only for the services that
// historically had it, to avoid adding a new section to every service page at once.
function trackRecord(s, svcKey, relAll) {
  if (!PROJECT_FOR_SERVICE[s.slug] || !svcKey || relAll.length < 5) return ''  // a short list undersells; the archive still has them
  const brands = [...new Set(relAll.map(c => c.brand))]
  return `
    <section class="track">
      <div class="wrap track__in">
        <div><p class="label">${t('Track record')}</p><h2 class="track__title">${LANG === 'ar' ? `${relAll.length} دراسة حالة في ${svcLabel(svcKey)}.` : `${relAll.length} ${SERVICE_LABEL[svcKey].toLowerCase()} case studies.`}</h2></div>
        <ul class="track__brands">${brands.map(b => `<li>${b}</li>`).join('')}</ul>
        <a class="link-more" href="/case-studies/?s=${svcKey}">${t('View all projects')} ${icon('arrow')}</a>
      </div>
    </section>`
}

function servicePage(raw, i) {
  const s = sv(raw)
  const prev = sv(SVCS[(i - 1 + SVCS.length) % SVCS.length]), next = sv(SVCS[(i + 1) % SVCS.length])
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
          ${crumbs([[t('Services'), '/services/'], [s.name]])}
          <p class="svh__kicker">${icon(s.icon)}${grp(groups[raw.gi]).name}</p>
          <h1 class="phero__title">${s.name}</h1>
          <p class="svh__line">${s.line}</p>
          <p class="phero__lead">${s.body}</p>
          <div class="phero__btns">
            <a class="btn btn--red btn--lg" href="${L('/contact/')}?service=${s.slug}">${t('Get a proposal')} ${icon('arrow')}</a>
            ${relAll.length ? `<a class="btn btn--ghost btn--lg" href="#work">${t('View case studies')}</a>` : ''}
            ${s.link ? `<a class="btn btn--ghost btn--lg" href="${s.link}" target="_blank" rel="noopener">${s.linkLabel || t('Visit website')} ${icon('arrow')}</a>` : ''}
          </div>
        </div>
        <div class="svh__media">
          ${hero ? `<img src="${hero}" alt="${esc(s.name)} by Niche">` : `<div class="svh__art">${icon(s.icon)}</div>`}
        </div>
      </div>
    </section>

    <section class="inc">
      <div class="wrap">
        <div class="section-head"><p class="label">${t("What's included")}</p><h2 class="h2">${t('Scope of service.')}</h2></div>
        <ul class="inc__grid">${s.included.map((x, k) => `<li style="--k:${k}"><span class="inc__n">${String(k + 1).padStart(2, '0')}</span>${icon('check', 'ico inc__tick')}<b>${x}</b></li>`).join('')}</ul>
      </div>
    </section>

    ${gallery.length ? `
    <section class="infield" id="photos">
      <div class="wrap">
        <div class="section-head"><p class="label">${t('In the field')}</p><h2 class="h2">${t('Project photography.')}</h2><p class="lead">${t('All photographs are taken from Niche Group projects and operations.')}</p></div>
        <div class="masonry masonry--static">${gallery.map(g => `<figure style="--ar:${(g.w / g.h).toFixed(3)}"><img src="/${g.src}" alt="${esc(`${g.c.brand}: ${g.c.title}`)}" loading="lazy"><figcaption>${g.c.brand}</figcaption></figure>`).join('')}</div>
      </div>
    </section>` : ''}
    ${relAll.length ? `
    <section class="relcases" id="work">
      <div class="wrap">
        <div class="section-head section-head--row"><div><p class="label">${t('Case studies')}</p><h2 class="h2">${t('Related case studies.')}</h2></div><a class="link-more" href="/case-studies/">${t('All case studies')} ${icon('arrow')}</a></div>
        <ul class="cgrid">${relAll.slice(0, 9).map(caseCard).join('')}</ul>${relAll.length > 9 ? `<a class="link-more relcases__all" href="/case-studies/?s=${svcKey}">${LANG === 'ar' ? `عرض جميع دراسات الحالة الـ${relAll.length} في ${s.name}` : `View all ${relAll.length} ${s.name.toLowerCase()} case studies`} ${icon('arrow')}</a>` : ''}
      </div>
    </section>` : ''}
    ${trackRecord(s, svcKey, relAll)}

    <section class="more">
      <div class="wrap">
        ${siblings.length ? `<p class="label">${t('More in')} ${grp(groups[raw.gi]).name}</p><ul class="more__chips">${siblings.map(x => `<li><a href="${L(svcUrl(x))}">${icon(x.icon)}${sv(x).name}</a></li>`).join('')}<li><a href="${L('/services/')}">${t('All services')} ${icon('arrow')}</a></li></ul>` : ''}
        <div class="pn">
          <a class="pn__a" href="${L(svcUrl(prev))}"><small>${LANG === 'ar' ? 'الخدمة السابقة →' : '← Previous service'}</small><b>${prev.name}</b></a>
          <a class="pn__a pn__a--next" href="${L(svcUrl(next))}"><small>${LANG === 'ar' ? '← الخدمة التالية' : 'Next service →'}</small><b>${next.name}</b></a>
        </div>
      </div>
    </section>
    ${cta({
      title: LANG === 'ar' ? `اطلبوا عرض سعر لخدمة ${s.name}.` : `Request a proposal for ${s.name.toLowerCase()}.`,
      // Vehicle tracking is a single-market Connexis product, not a service we run
      // across the network, so it doesn't get the "all 17 countries" line.
      text: s.slug === 'vehicle-tracking'
        ? t('We respond within one working day.')
        : t('Available in a single market or across all 17 countries. We respond within one working day.'),
      href: `${L('/contact/')}?service=${s.slug}`, label: t('Get a proposal') })}`
  return shell({
    title: LANG === 'ar' ? `${s.seo || s.name} في دبي والإمارات والمنطقة | نيتش` : `${s.seo || s.name} in Dubai, UAE & MENA | Niche`,
    desc: s.meta || clip(`${s.line} ${s.body}`), path: svcUrl(raw), page: 'service', body })
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
  return shell({ title: `${c.brand}: ${c.title} | Niche Case Study`, desc: clip(`${c.challenge} ${c.result}`), path: caseUrl(c), page: 'case', body })
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
  return shell({ title: `${p.brand}: ${p.title} | Niche Case Study`, desc: clip(projectLead(p)), path: `/case-studies/${p.slug}/`, page: 'case', body })
}

function aboutPage() {
  const body = `
    <section class="phero phero--about">
      <span class="phero__ghost" aria-hidden="true">2003</span>
      <div class="wrap">
        ${crumbs([[t('About')]])}
        <p class="label">${t('About Niche')}</p>
        <h1 class="phero__title">${LANG === 'ar' ? 'شركة تسويق ميداني، <em>تأسست عام 2003.</em>' : 'A field marketing company, <em>established in 2003.</em>'}</h1>
        <p class="phero__lead">${t('Niche Marketing Management is a privately owned field marketing company, founded and headquartered in Dubai. Our trained staff provide retail audits, merchandising, promotions and installation services for brands across the Middle East, North Africa and Asia.')}</p>
        <ol class="milestones">
          <li><b>2003</b><span>${t('Founded in Dubai')}</span></li>
          <li><b>17</b><span>${t('Countries in the network')}</span></li>
          <li><b>20+</b><span>${t('Operational offices')}</span></li>
          <li><b>250+</b><span>${t('People on the team')}</span></li>
          <li><b>${t('Today')}</b><span>${t('One contact across MENA')}</span></li>
        </ol>
      </div>
    </section>
    ${P('proof')}
    ${P('why')}
    ${P('network')}
    ${P('industries')}
    ${P('group')}
    ${P('how')}
    ${P('clients')}
    ${cta()}`
  return shell({
    title: LANG === 'ar' ? 'عن نيتش لإدارة التسويق | شركة تسويق ميداني في دبي' : 'About Niche Marketing Management | Field Marketing Company in Dubai',
    desc: LANG === 'ar' ? 'نيتش لإدارة التسويق شركة تسويق ميداني مملوكة ملكية خاصة، تأسست في دبي عام 2003، ويعمل بها أكثر من 250 موظفاً وأكثر من 20 مكتباً في 17 دولة.' : 'Niche Marketing Management is a privately owned field marketing company founded in Dubai in 2003, with 250+ staff and 20+ offices in 17 countries.',
    path: '/about/', page: 'about', body })
}

function contactPage() {
  const body = `
    <h1 class="sr-only">${LANG === 'ar' ? 'اتصل بنيتش لإدارة التسويق' : 'Contact Niche Marketing Management'}</h1>
    ${P('contact')}
    <section class="offices">
      <div class="wrap">
        <div class="hq">
          <div class="hq__map"><iframe src="https://www.google.com/maps?q=25.269051,55.332878&amp;z=17&amp;output=embed" title="Map: Niche head office, Al Dalal Building, 11A St, Al Khabaisi, Deira, Dubai" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe></div>
          <div class="hq__card">
            <p class="label">${t('Head office')}</p>
            <h2 class="hq__title">${t('Dubai head office.')}</h2>
            <p class="hq__addr">${LANG === 'ar' ? 'بلوك B، الطابق الميزانين، بناية الدلال<br>شارع 11A، الخبيصي، ديرة<br>دبي، الإمارات العربية المتحدة<br>ص.ب 81605' : 'B Block, M Floor, Al Dalal Building<br>11A St, Al Khabaisi, Deira<br>Dubai, United Arab Emirates<br>PO Box 81605'}</p>
            <ul class="hq__list">
              <li>${icon('call')}<a href="tel:+97142978868">+971 4 297 8868</a></li>
              <li>${icon('mail')}<a href="mailto:info@nicheme.com">info@nicheme.com</a></li>
              <li>${icon('clock')}<span>${LANG === 'ar' ? 'الساعة الآن <b data-clock="Asia/Dubai">--:--</b> في دبي' : `It's <b data-clock="Asia/Dubai">--:--</b> in Dubai`}</span></li>
            </ul>
            <a class="btn btn--red" href="https://www.google.com/maps/dir/?api=1&amp;destination=25.269051,55.332878" target="_blank" rel="noopener">${t('Get directions')} ${icon('arrow')}</a>
          </div>
        </div>
        <div class="section-head section-head--row"><div><p class="label">${t('Offices')}</p><h2 class="h2">${t('Regional offices.')}</h2></div><a class="link-more" href="${L('/about/')}#network">${t('About our network')} ${icon('arrow')}</a></div>
        <div class="board" data-board></div>
      </div>
    </section>
    <section class="svfaq">
      <div class="wrap svfaq__grid">
        <div class="section-head"><p class="label">${t('Questions')}</p><h2 class="h2">${t('Frequently asked questions.')}</h2><p class="lead">${LANG === 'ar' ? `أو تصفحوا <a href="${L('/services/')}">خدماتنا</a> و<a href="/case-studies/">دراسات الحالة</a>.` : `Or browse our <a href="/services/">services</a> and <a href="/case-studies/">case studies</a>.`}</p></div>
        ${faq(FAQ({ name: '' }))}
      </div>
    </section>`
  return shell({
    title: LANG === 'ar' ? 'اتصل بنيتش لإدارة التسويق | دبي، الإمارات' : 'Contact Niche Marketing Management | Dubai, UAE',
    desc: LANG === 'ar' ? 'تواصلوا مع نيتش لإدارة التسويق في دبي لطلب عرض سعر للتسويق الميداني. نردّ خلال يوم عمل واحد. ‎+971 4 297 8868 · info@nicheme.com' : 'Contact Niche Marketing Management in Dubai to request a field marketing proposal. We respond within one working day. +971 4 297 8868 · info@nicheme.com',
    path: '/contact/', page: 'contact', body })
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
// A first-pass privacy notice: what the two forms collect, why, who else sees it,
// and how to ask about it. Written to be honest about the current setup (Web3Forms
// relays submissions by email; there is no CRM or ad tracking on the site yet).
// Needs a legal read before launch — this is a starting point, not signed-off copy.
function privacyPage() {
  const body = `
    <section class="phero">
      <div class="wrap">
        ${crumbs([['Privacy']])}
        <p class="label">Privacy</p>
        <h1 class="phero__title">Privacy notice.</h1>
        <p class="phero__lead">Last updated ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}. This notice explains what personal data this website collects, why, and how to reach us about it.</p>
      </div>
    </section>
    <section class="svfaq">
      <div class="wrap privacy">
        <h2 class="h2">What we collect</h2>
        <p>When you submit the proposal brief or a job application on this site, we collect the details you enter: your name, company (for a brief), email address, phone number, the services or role you are interested in, the countries or markets involved, and anything you write in the message field. The careers form also collects a LinkedIn or CV link if you provide one. We do not collect this data unless you submit one of these forms.</p>
        <h2 class="h2">How it is used</h2>
        <p>We use this information only to respond to your enquiry or application: to prepare a proposal, to get in touch about a role, or to answer a question. We do not sell this data, and we do not use it for marketing unrelated to your enquiry.</p>
        <h2 class="h2">Who sees it</h2>
        <p>Submissions are delivered by email to the relevant Niche team using Web3Forms, a third-party form-delivery service that relays the submission from your browser to our inbox. Web3Forms processes the data only to deliver that one email; see <a href="https://web3forms.com/privacy" target="_blank" rel="noopener">their privacy policy</a> for how they handle it in transit. No other third party receives this data.</p>
        <h2 class="h2">Recruitment fees</h2>
        <p>Niche never asks applicants to pay a fee, deposit or any form of payment at any stage of recruitment. If anyone contacts you claiming to represent Niche and asks for payment, it is not us &mdash; please report it and contact us directly at the address below to verify.</p>
        <h2 class="h2">How long we keep it</h2>
        <p>We keep enquiry and application data for as long as reasonably needed to respond to you and, for applications, to consider you for a suitable role. You can ask us to delete your data at any time using the contact details below.</p>
        <h2 class="h2">Your rights</h2>
        <p>You can ask us what data we hold about you, ask us to correct or delete it, or withdraw consent for us to hold it, by emailing <a href="mailto:info@nicheme.com">info@nicheme.com</a>.</p>
        <h2 class="h2">Cookies and browser storage</h2>
        <p>This site does not use advertising or tracking cookies. It stores a small amount of data in your browser (such as whether you have seen the intro animation, or your chosen filters) to make the site work smoothly; this stays on your device and is never sent to us.</p>
        <h2 class="h2">Contact</h2>
        <p>Niche Marketing Management, B Block, M Floor, Al Dalal Building, 11A St, Al Khabaisi, Deira, Dubai, UAE. <a href="mailto:info@nicheme.com">info@nicheme.com</a> &middot; <a href="tel:+97142978868">+971 4 297 8868</a>.</p>
      </div>
    </section>`
  return shell({ title: 'Privacy Notice | Niche Marketing Management', desc: 'What personal data the Niche Marketing Management website collects through its forms, how it is used, and how to contact us about it.', path: '/privacy/', page: 'privacy', body })
}

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
          ${crumbs([[t('Careers')]])}
          <p class="label">${t('Careers')}</p>
          <h1 class="phero__title">${LANG === 'ar' ? 'وظائف في <em>التسويق الميداني.</em>' : 'Careers in <em>field marketing.</em>'}</h1>
          <p class="phero__lead">${t('Niche employs 250+ staff directly across 17 countries, in field, workshop and office roles, including our Dubai-based reporting team.')}</p>
          <div class="phero__btns">
            <a class="btn btn--red btn--lg" href="#apply">${t('Apply now')} ${icon('arrow')}</a>
            <a class="btn btn--ghost btn--lg" href="#roles">${t('See the roles')}</a>
          </div>
        </div>
        <div class="crh" aria-hidden="true">
          <img class="crh__a" src="/work/mentos-air-action-sampling/06.webp" alt="">
          <img class="crh__b" src="/work/gorilla-energy-promotion-logistics/03.webp" alt="">
          <img class="crh__c" src="/work/gorilla-energy-promotion-logistics/01.webp" alt="">
          <div class="crh__chip crh__chip--red"><b>250+</b><span>${t('people, employed directly')}</span></div>
          <div class="crh__chip"><b>17</b><span>${t('countries to work in')}</span></div>
        </div>
      </div>
    </section>

    <section class="perks">
      <div class="wrap">
        <div class="section-head"><p class="label">${t('Why Niche')}</p><h2 class="h2">${t('Working at Niche.')}</h2></div>
        <ul class="perks__grid">
          <li>${icon('users')}<b>${t('Employed by Niche')}</b><p>${t('Field staff are employed by Niche directly, not through a third-party agency.')}</p></li>
          <li>${icon('globe')}<b>${t('17 countries, 20+ offices')}</b><p>${t('Opportunities across our markets in the Gulf, North Africa and Pakistan.')}</p></li>
          <li>${icon('brief')}<b>${t('Training provided')}</b><p>${t('Each project begins with training on the brand, the outlets and the reporting app.')}</p></li>
          <li>${icon('calendar')}<b>${t('Since 2003')}</b><p>${t('A privately owned company, founded and headquartered in Dubai.')}</p></li>
        </ul>
      </div>
    </section>

    <section class="roles" id="roles">
      <div class="wrap">
        <div class="section-head section-head--row"><div><p class="label">${t('Roles')}</p><h2 class="h2">${t('Roles we recruit for.')}</h2></div><p class="roles__note">${t('Vacancies depend on current projects. Select a role and country, and we will keep your CV on file for suitable openings.')}</p></div>
        <ul class="roles__grid">${ROLES.map(([ic, name, where, line], i) => `
          <li><a class="role" href="#apply" data-role="${esc(name)}" style="--k:${i}">
            <span class="role__top">${icon(ic, 'ico role__ico')}<em>${t(where)}</em></span>
            <b>${t(name)}</b><span class="role__line">${t(line)}</span>
            <span class="role__go">${t('Apply')} ${icon('arrow')}</span>
          </a></li>`).join('')}
        </ul>
      </div>
    </section>

    <section class="how how--careers" id="how">
      <div class="wrap">
        <div class="section-head"><p class="label">${t('How hiring works')}</p><h2 class="h2">${t('Recruitment process.')}</h2></div>
        <div class="steps__line" aria-hidden="true"><i data-steps-fill></i></div>
        <ol class="steps">
          <li><span>01</span>${icon('mail', 'step__ico')}<h3>${t('Apply')}</h3><p>${t('Send your details and CV. Tell us the role and the country.')}</p></li>
          <li><span>02</span>${icon('call', 'step__ico')}<h3>${t('Meet us')}</h3><p>${t('A call or a meeting with the team in your country.')}</p></li>
          <li><span>03</span>${icon('brief', 'step__ico')}<h3>${t('Training')}</h3><p>${t('The brand, the outlets, the standards and the reporting app.')}</p></li>
          <li><span>04</span>${icon('store', 'step__ico')}<h3>${t('In the field')}</h3><p>${t('Your first assignment, supported by a supervisor.')}</p></li>
        </ol>
      </div>
    </section>

    <section class="apply" id="apply" aria-labelledby="apply-title">
      <div class="wrap apply__grid">
        <div class="apply__intro">
          <p class="label">${t('Apply')}</p>
          <h2 id="apply-title" class="h2">${t('Send us your CV.')}</h2>
          <p class="lead">${t('Fill in the form below. Share a LinkedIn or CV link if you have one, and we will take it from there.')}</p>
          <ul class="contact__direct">
            <li><a href="mailto:info@nicheme.com?subject=Careers"><i data-icon="mail"></i><span><small>${t('Email')}</small>info@nicheme.com</span></a></li>
            <li><a href="tel:+97142978868"><i data-icon="call"></i><span><small>${t('Head office')}</small>+971 4 297 8868</span></a></li>
          </ul>
        </div>
        <form class="brief apply__form" data-apply novalidate>
          <input type="checkbox" name="botcheck" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
          <div class="form__row">
            <label class="field"><input name="name" autocomplete="name" required placeholder=" "><span>${t('Full name')}</span></label>
            <label class="field"><input name="email" type="email" autocomplete="email" required placeholder=" "><span>${t('Email')}</span></label>
          </div>
          <div class="form__row">
            <label class="field"><input name="phone" type="tel" autocomplete="tel" placeholder=" "><span>${t('Phone (optional)')}</span></label>
            <label class="field field--select"><select name="country" required><option value="" selected disabled></option>${COUNTRIES17.map(c => `<option>${t(c)}</option>`).join('')}</select><span>${t('Country')}</span></label>
          </div>
          <div class="form__row">
            <label class="field field--select"><select name="role" required><option value="" selected disabled></option>${ROLES.map(r => `<option>${t(r[1])}</option>`).join('')}<option>${t('Something else')}</option></select><span>${t('Role')}</span></label>
            <label class="field"><input name="link" type="url" placeholder=" "><span>${t('LinkedIn or CV link (optional)')}</span></label>
          </div>
          <label class="field"><textarea name="message" rows="3" placeholder=" "></textarea><span>${t('Languages, experience, when you can start')}</span></label>
          <div class="brief__foot">
            <p class="brief__sum">${t('We read every application and reply if there is a fit.')}</p>
            <button class="btn btn--red btn--lg" type="submit">${t('Send application')} <i data-icon="arrow"></i></button>
          </div>
          <div class="form__done" data-done hidden><i data-icon="check"></i><b>${t('Application sent')}</b><span>${t('We have it on file and will reach out if there is a fit.')}</span></div>
          <p class="brief__legal">${t('Niche never charges a fee at any stage of recruitment.')} ${LANG === 'ar' ? 'بإرسال هذا الطلب، فإنكم توافقون على' : 'By applying, you agree to our'} <a href="/privacy/">${t('privacy notice')}</a>${LANG === 'ar' ? ' الخاص بنا.' : '.'}</p>
        </form>
      </div>
    </section>`
  return shell({
    title: LANG === 'ar' ? 'الوظائف | وظائف التسويق الميداني في دبي والإمارات والمنطقة | نيتش' : 'Careers | Field Marketing Jobs in Dubai, UAE & MENA | Niche',
    desc: LANG === 'ar' ? 'وظائف التسويق الميداني لدى نيتش لإدارة التسويق: مسوّقون داخل المتاجر، ومدققو تجزئة، ومتسوقون خفيون، ومروّجون، ومشرفون، ووظائف مكتبية في 17 دولة.' : 'Field marketing jobs at Niche Marketing Management: merchandisers, retail auditors, mystery shoppers, promoters, supervisors and office roles in 17 countries.',
    path: '/careers/', page: 'careers', body })
}

// ---------------------------------------------------------------- Arabic home
// Mirrors index.html section for section, with the Arabic partials. The hero and
// the two section heads are written out here because the English ones live in
// index.html rather than in a partial.
function arHome() {
  const head = `
  <script>try{if(!sessionStorage.getItem('niche-intro-seen')&&!matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.classList.add('intro-cover');setTimeout(function(){document.documentElement.classList.remove('intro-cover')},4000)}}catch(e){}</script>
  <style>html.intro-cover::after{content:'';position:fixed;inset:0;z-index:2147483646;background:#0A0A0A}</style>`
  const body = `
    <section class="hero" id="top" aria-labelledby="hero-title">
      <div class="hero__copy">
        <p class="kicker"><span class="kicker__dot"></span>التسويق الميداني في الشرق الأوسط وشمال أفريقيا</p>
        <h1 id="hero-title" class="hero__title">
          <span class="line"><span>التسويق الميداني</span></span>
          <span class="line"><span>وخدمات التجزئة</span></span>
          <span class="line"><span>في <em>المنطقة.</em></span></span>
        </h1>
        <p class="hero__sub">تدقيق التجزئة، والتسويق داخل المتاجر، والتسوق الخفي، والعروض الترويجية في 17 دولة، مع بيانات ميدانية تُرفع خلال 24 ساعة.</p>
        <div class="hero__ctas">
          <a class="btn btn--red btn--lg" href="/ar/contact/">اطلب عرض سعر <i data-icon="arrow"></i></a>
          <a class="btn btn--ghost btn--lg" href="/case-studies/">تصفح دراسات الحالة</a>
        </div>
      </div>
      <div class="hero__globe" data-globe>
        <canvas data-globe-canvas aria-hidden="true"></canvas>
        <div class="hmap__chip" data-chip aria-hidden="true"></div>
        <div class="hmap__tip" data-tip aria-hidden="true"></div>
      </div>
      <svg class="hero__badge" viewBox="0 0 120 120" aria-hidden="true">
        <defs><path id="badge-path" d="M60 60m-45 0a45 45 0 1 1 90 0a45 45 0 1 1-90 0"/></defs>
        <circle cx="60" cy="60" r="59" class="hero__badge-bg"/>
        <g class="hero__badge-ring"><text><textPath href="#badge-path" textLength="280" lengthAdjust="spacing">FIELD MARKETING · SINCE 2003 ·</textPath></text></g>
        <path class="hero__badge-arrow" d="M51 69 69 51M55 51h14v14"/>
      </svg>
      <p class="hero__drag" aria-hidden="true"><span></span>حرّك الكرة الأرضية</p>
    </section>

    ${P('proof')}
    ${P('clients')}

    <section class="services" id="services" aria-labelledby="services-title">
      <div class="wrap">
        <div class="section-head">
          <p class="label">الخدمات</p>
          <h2 id="services-title" class="h2">خدمات التسويق الميداني.</h2>
          <p class="lead">أربع عشرة خدمة ضمن أربع مجموعات، ينفذها موظفو نيتش وتُرفع تقاريرها عبر نظام واحد. اختاروا خدمة للاطلاع على نطاقها وصورها ودراسات الحالة المرتبطة بها.</p>
        </div>
        <div class="sgrid">${P('services-grid')}</div>
        <a class="link-more" href="/ar/services/">عرض الخدمات الأربع عشرة <i data-icon="arrow"></i></a>
      </div>
    </section>

    ${P('work')}
    ${P('reporting')}
    ${P('contact')}`
  return shell({
    title: 'شركة تسويق ميداني في دبي والإمارات والمنطقة | نيتش لإدارة التسويق',
    desc: 'تقدّم نيتش لإدارة التسويق خدمات تدقيق التجزئة والتسويق داخل المتاجر والتسوق الخفي وأبحاث السوق والعروض الترويجية في الإمارات والسعودية و17 دولة في المنطقة منذ 2003.',
    path: '/', page: 'home', body, head })
}

// ---------------------------------------------------------------- sitemap
// Written to public/sitemap.xml (copied to dist/ by Vite) from the same page list
// the build uses, so it can never drift from what actually ships.
function writeSitemap(paths) {
  // Arabic pages rank just under their English equivalent.
  const priority = raw => {
    const ar = raw.startsWith('/ar/'), p = ar ? raw.slice(3) : raw
    const base = p === '/' ? 1.0
      : /^\/services\/$|^\/case-studies\/$/.test(p) ? 0.9
      : /^\/services\//.test(p) ? 0.8
      : /^\/(about|contact)\/$/.test(p) ? 0.7
      : /^\/case-studies\//.test(p) ? 0.6
      : p === '/careers/' ? 0.5 : 0.2
    return (ar ? Math.max(0.1, base - 0.1) : base).toFixed(1)
  }
  const today = new Date().toISOString().slice(0, 10)
  const urls = ['/', ...paths].map(p => `  <url>
    <loc>${SITE}${p}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p === '/' || p === '/ar/' || p === '/case-studies/' ? 'weekly' : 'monthly'}</changefreq>
    <priority>${priority(p)}</priority>
  </url>`).join('\n')
  writeFileSync(resolve(ROOT, 'public/sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`)
}

// ---------------------------------------------------------------- write
export function writePages() {
  for (const d of ['services', 'case-studies', 'about', 'contact', 'careers', 'credits', 'privacy', 'ar']) rmSync(resolve(ROOT, d), { recursive: true, force: true })
  LANG = 'en'
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
    ['privacy/index.html', privacyPage()],
  ]
  // Arabic: the same generators run again with LANG = 'ar' and write under /ar/.
  // The Arabic home page is assembled from the ar- partials, like the English one.
  LANG = 'ar'
  out.push(
    ['ar/index.html', arHome()],
    ['ar/services/index.html', servicesIndex()],
    ...SVCS.map((s, i) => [`ar/services/${s.slug}/index.html`, servicePage(s, i)]),
    ['ar/about/index.html', aboutPage()],
    ['ar/contact/index.html', contactPage()],
    ['ar/careers/index.html', careersPage()],
  )
  LANG = 'en'
  writeSitemap(out.map(([file]) => '/' + file.replace(/index\.html$/, '')))
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

// Partials Vite expands into the pages. The ar- variants render the same block in
// Arabic: writePages() has already finished by the time Vite asks for these, so each
// one sets the language around its own call.
const inAr = fn => (...a) => { LANG = 'ar'; try { return fn(...a) } finally { LANG = 'en' } }
export const GENERATED = {
  header, 'services-grid': servicesGrid, cta: () => cta(), 'work-chips': workChips,
  'ar-header': inAr(header),
  'ar-services-grid': inAr(servicesGrid),
  'ar-cta': inAr(() => cta()),
  'ar-work-chips': inAr(workChips),
}
export { existsSync }
