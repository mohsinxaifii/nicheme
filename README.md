# nicheme.com — homepage concept

"The eyes and ears of great brands across MENA." A from-scratch homepage for
Niche Marketing Management. Plain JS on Vite, Three.js for the hero, GSAP +
Lenis for motion.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # -> dist/
npm run gen:map    # rebuild src/data/map-dots.json from Natural Earth
```

## Pages

All pages are generated at build time by `scripts/site.js` from `src/data/` (services, cases, photos)
and share partials from `src/partials/` via `<!--@name-->` includes (see `vite.config.js`).
Generated folders (`services/`, `case-studies/`, `about/`, `contact/`) are gitignored.

| URL | Page |
|---|---|
| `/` | Home: globe hero, stats bento, logos, services, 3D case wall, network, industries, group, brief builder |
| `/services/` | All 14 services: icon wall hero, one sticky section per group |
| `/services/<slug>/` | 14 service pages: hero with photo + proof, what's included, field photo gallery (lightbox), related cases, FAQ, prev/next |
| `/case-studies/` | 3D wall + filterable grid (`?s=audits` etc.) |
| `/case-studies/<slug>/` | 30 case pages: stats, challenge / what we did / result, services used, gallery, related, prev/next |
| `/about/` | Story, milestones, stats, network, industries, group, how we work |
| `/contact/` | Brief builder (`?service=<slug>` pre-selects), offices board, FAQ |

Header: hover mega menus (Services with live photo preview, Case studies, About); mobile menu with accordions.

## Content rules followed

- All case-study figures come from the Niche company profile, via the developer brief. Nothing invented.
- No Apple anywhere. No testimonials until real, approved quotes exist.
- No stock photos: every image comes from the company presentation. Slides with Apple products or the confidential client (DULA, Multibrand, White Fixtures, Confidential) are excluded, as is a du photo showing a phone poster.

## Before launch

- Get original high-res photos from Niche: many PDF images are small (e.g. Red Bull shelves ~200 px).
- Have an Arabic copywriter check the intro lines in `src/modules/intro.js`.
- Ask Niche for the logo as SVG (the PNG from the live site is used today).
- Wire the form to a real endpoint (it opens a mailto today). See `initForm` in `src/modules/ui.js`.
- Confirm headcount/countries with management. The live site says 300+ / 14; the profile says 250+ / 17 / 20+ offices. This build uses the profile.
- Arabic version, service pages and case-study pages per the developer brief.
