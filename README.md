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

## Page map

| Section | What it does |
|---|---|
| Intro | Once per session: the MENA map draws itself, the 17 countries light up from Dubai, English/Arabic lines, then the logo. Skippable. |
| Hero | Transparent globe (d3-geo, canvas) that spins in and settles on MENA; drag to rotate, it springs back. 17 countries fill red, sonar pulses, English/Arabic names on hover, live audit chip. |
| About + stats | Bento grid about Niche itself (no client names): stores audited, 23 years with ghost '2003', mini MENA map cycling the 17 countries in English/Arabic, a crowd of people figures, field force, offices. |
| Client logos | 35 logos from the presentation's Client References slides, two rows. |
| Services | Card grid: all 14 services at a glance (icon, name, one line, proof). Hover fades in the photo; click opens a side drawer with photo, description, what's included, CTA and prev/next. |
| Case studies | Tilted 3D wall of the 30 projects drifting sideways, curved network lines linking same-service projects (hover lights a project's network, filters light a service), drag to scrub, popup with gallery. |
| How we work, Reporting, Why | Step line that fills on scroll; real shelf photo with floating report chips; four reasons. |
| Network | WebGL MENA dot map with arcs and pings. |
| Industries, Group, Contact | Icon lists and the enquiry form. |

Assets: `public/work/` (case photos) and `public/logos/` are extracted from *Niche - Company Presentation 2026.pdf*.
Logo: `public/brand/niche-logo.png` from the live nicheme.com. Fonts: Inter Tight, Noto Kufi Arabic (intro).

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
