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
Generated folders (`services/`, `case-studies/`, `about/`, `contact/`, `careers/`) are gitignored.

| URL | Page |
|---|---|
| `/` | Home: globe hero, stats bento, logos, services, 3D case wall, reporting, brief builder |
| `/services/` | All 14 services: icon wall hero, one sticky section per group |
| `/services/<slug>/` | 14 service pages: hero with photo + proof, what's included, field photo gallery (lightbox), related cases, FAQ, prev/next |
| `/case-studies/` | 3D wall + filterable grid (`?s=audits` etc.) + project archive (`?p=audits#archive`) from the project log, with photo lightboxes |
| `/case-studies/<slug>/` | 52 case pages: stats, challenge / what we did / result, services used, gallery, related, prev/next. Cases without photos show a placeholder |
| `/about/` | Story, milestones, stats, network, industries, group (orbit), how we work |
| `/contact/` | Brief builder (`?service=<slug>` pre-selects), offices board, FAQ |
| `/careers/` | Why Niche, role families (not live vacancies), hiring steps, application form (mailto) |

Header order: Home, About, Services, Case studies, Contact, Careers. Hover mega menus on About, Services and Case studies; mobile menu with accordions.

The English site carries no Arabic text; the `AR` button is a placeholder for the Arabic version.

## Content rules followed

- All case-study figures come from the Niche company profile, via the developer brief. Nothing invented.
- No Apple anywhere. No testimonials until real, approved quotes exist.
- No stock photos: every image comes from the company presentation or the client's project photo folders (Nov 2026, screened: no Apple products, no sideways/blurred shots). Slides with Apple products or the confidential client (DULA, Multibrand, White Fixtures, Confidential) are excluded, as is a du photo showing a phone poster.

## Adding photos later

- Case study: put WebP files in `public/work/<slug>/` (`01.webp`…, plus a square `cover.webp`) and list them in `src/data/photos.js`. The placeholder disappears everywhere.
- Archive project: put files in `public/projects/<slug>/` (`cover.webp` 4:3) and list them in the project's `photos` in `src/data/projects.js`.

## Before launch

- Get original high-res photos from Niche: many PDF images are small (e.g. Red Bull shelves ~200 px).
- Confirm a careers inbox (applications go to info@nicheme.com today; see `initApply` in `src/modules/ui.js`).
- Ask Niche for the logo as SVG (the PNG from the live site is used today).
- Wire the form to a real endpoint (it opens a mailto today). See `initForm` in `src/modules/ui.js`.
- Confirm headcount/countries with management. The live site says 300+ / 14; the profile says 250+ / 17 / 20+ offices. This build uses the profile.
- Arabic version, service pages and case-study pages per the developer brief.
