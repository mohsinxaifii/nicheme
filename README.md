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

| Section | Idea |
|---|---|
| Hero | WebGL map of MENA in ~20k "store" dots. Niche's 17 countries glow red, arcs fly out of Dubai, the cursor is a scanner lens with a lat/long HUD, sample field pings pop over cities. On scroll the dots file into a shelf planogram. |
| Manifesto | Words light up as you scroll. |
| Proof | Stats as hanging price tags with barcodes; they swing with scroll speed. |
| Services | Horizontal "aisles" with hanging aisle signs, in the brief's priority order. |
| Case studies | Endless, draggable evidence wall of 30 case files (GPS + time stamps, viewfinder). Filters, list view, popup with prev/next, deep links `#case/<slug>`. |
| How we work | Route line draws on scroll through 4 checkpoints. |
| Reporting | Illustrative live dashboard: gauge, alerts, photo evidence feed. |
| Network | 17 countries with live local times. |
| Brief | Contact form styled as an audit sheet; stamps "Received". |
| Footer | Giant wordmark. Type `audit` anywhere for audit mode. |

## Content rules followed

- All case-study figures come from the Niche company profile, via the developer brief. Nothing invented.
- No Apple anywhere. No testimonials until real, approved quotes exist.
- No stock photos. Case art is generated per service (`src/modules/art.js`) as a stand-in.

## Before launch

- Replace the generated case art with real project photos (`drawArt` → `<img>`).
- Swap the typographic logo for the official NICHE SVG.
- Wire the form to a real endpoint (it opens a mailto today). See `initForm` in `src/modules/ui.js`.
- Confirm headcount/countries with management. The live site says 300+ / 14; the profile says 250+ / 17 / 20+ offices. This build uses the profile.
- Arabic version, service pages and case-study pages per the developer brief.
