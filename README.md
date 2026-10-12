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
| Hero | WebGL map of MENA in ~20k dots. Niche's 17 countries in red, arcs from Dubai, a soft cursor lens. On scroll the dots settle into a shelf grid. |
| About | Company summary and six key figures. |
| Services | All 14 services in 4 groups, each expandable with a description, what's included and a proof figure (`src/data/services.js`). |
| Case studies | Draggable wall of 30 case cards, filters, list view, detail popup with deep links `#case/<slug>`. |
| How we work / Why Niche | Four steps; four reasons with proof. |
| Network, Group, Contact | Countries by region, group companies, enquiry form. |

Logo: `public/brand/niche-logo.png`, taken from the live nicheme.com. Fonts: Inter Tight.

## Content rules followed

- All case-study figures come from the Niche company profile, via the developer brief. Nothing invented.
- No Apple anywhere. No testimonials until real, approved quotes exist.
- No stock photos. Case cards are typographic until real project photos arrive.

## Before launch

- Add real project photos to the case cards and popup.
- Ask Niche for the logo as SVG (the PNG from the live site is used today).
- Wire the form to a real endpoint (it opens a mailto today). See `initForm` in `src/modules/ui.js`.
- Confirm headcount/countries with management. The live site says 300+ / 14; the profile says 250+ / 17 / 20+ offices. This build uses the profile.
- Arabic version, service pages and case-study pages per the developer brief.
