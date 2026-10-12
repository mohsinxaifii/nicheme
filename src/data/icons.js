// Line icons, 24×24, drawn for this site. Stroke follows currentColor.
const P = {
  audit: '<path d="M9 4h6v3H9z"/><path d="M7 5.5H5.5v15h13v-15H17"/><path d="m9 13 2 2 4-4"/>',
  mystery: '<circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/><path d="M7.5 10.5s1.2-2 3-2 3 2 3 2-1.2 2-3 2-3-2-3-2z"/>',
  research: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  reporting: '<rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M9 15l2-2.5 2 1.5 2.5-3.5"/><path d="M11 18.5h2"/>',
  merch: '<path d="M3 4v16M21 4v16M3 9h18M3 15h18"/><path d="M6 9V6.5h2.5V9M11 9V5.5h3V9M7 15v-3h3v3M13 15v-2h4v2"/>',
  ambassador: '<circle cx="12" cy="7" r="3.5"/><path d="M5 21c0-4 3-6.5 7-6.5s7 2.5 7 6.5"/><path d="m12 15.5 1.2 2.3-1.2 2.7-1.2-2.7z"/>',
  install: '<path d="M14.5 6.5a4 4 0 0 0 5 5l-9 9a2.1 2.1 0 0 1-3-3l9-9a4 4 0 0 1-2-2z"/><path d="M14.5 6.5 17 4l3 3-2.5 2.5"/>',
  promo: '<path d="M4 10v4a1 1 0 0 0 1 1h2l8 4V5L7 9H5a1 1 0 0 0-1 1z"/><path d="M18.5 9.5a3.5 3.5 0 0 1 0 5"/><path d="m7.5 15 1.5 5h2.5L10 15.8"/>',
  sampling: '<path d="M6 8h12l-1.5 12.5h-9z"/><path d="M5 5h14v3H5z"/><path d="M12 3v2"/>',
  events: '<path d="M2.5 20 12 4l9.5 16z"/><path d="M12 4v16M8.5 20 12 13l3.5 7"/>',
  production: '<path d="M6 9V3.5h12V9"/><rect x="3" y="9" width="18" height="8" rx="1.5"/><path d="M6.5 14h11v6.5h-11z"/>',
  logistics: '<path d="M2.5 6h11v10h-11z"/><path d="M13.5 9.5h4l3.5 3.5v3h-7.5"/><circle cx="6.5" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
  digital: '<rect x="2.5" y="4" width="19" height="12.5" rx="1.5"/><path d="M8 20.5h8M12 16.5v4"/><path d="m10 8.5 4 2-4 2z"/>',
  vehicle: '<path d="M12 21s6.5-6 6.5-11a6.5 6.5 0 1 0-13 0c0 5 6.5 11 6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.7 5.6 3.7 9S14.5 18.4 12 21c-2.5-2.6-3.7-5.6-3.7-9S9.5 5.6 12 3z"/>',
  building: '<path d="M4 21V5.5L13 3v18M13 9h7v12M2.5 21h19"/><path d="M7.5 8h2M7.5 12h2M7.5 16h2M16 13h1.5M16 17h1.5"/>',
  users: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.5 2.6-5.5 6-5.5s6 2 6 5.5"/><path d="M15.5 4.9a3.2 3.2 0 0 1 0 6.2M18 14.8c2 .7 3 2.4 3 5.2"/>',
  store: '<path d="M3.5 9.5 5 4h14l1.5 5.5"/><path d="M3.5 9.5a2.8 2.8 0 0 0 5.6 0 2.8 2.8 0 0 0 5.6 0 2.8 2.8 0 0 0 5.6 0"/><path d="M5 12v8.5h14V12M10 20.5v-5h4v5"/>',
  route: '<circle cx="6" cy="18" r="2.2"/><circle cx="18" cy="6" r="2.2"/><path d="M8 18h7.5a3 3 0 0 0 0-6h-7a3 3 0 0 1 0-6H16"/>',
  brief: '<path d="M6 3h8.5L19 7.5V21H6z"/><path d="M14 3v5h5M9 12h6M9 16h6"/>',
  camera: '<path d="M3.5 8.5h3.5l1.8-2.5h6.4L17 8.5h3.5v11h-17z"/><circle cx="12" cy="13.5" r="3.5"/>',
  dashboard: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 20V9"/><path d="m11 16 2.5-3 2 1.5 2.5-3"/>',
  handshake: '<path d="m2.5 11.5 4-4 3 1 3-2 5 5-4 4"/><path d="m21.5 11.5-4-4"/><path d="m8.5 12.5 3 3M10.5 10.5l3.5 3.5M6.5 14.5l2 2"/>',
  receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  factory: '<path d="M3 21V11l5 3V11l5 3V7l8 4v10z"/><path d="M7 17.5h2M12 17.5h2M17 17.5h1"/>',
  basket: '<path d="M3 10h18l-2 10.5H5z"/><path d="m8 10 3-6M16 10l-3-6M9 14v3M12 14v3M15 14v3"/>',
  bottle: '<path d="M10 2.5h4v4l1.5 2.5v12.5h-7V9L10 6.5z"/><path d="M8.5 13h7"/>',
  phone: '<rect x="6.5" y="2.5" width="11" height="19" rx="2.2"/><path d="M11 18.5h2"/>',
  car: '<path d="M4 16.5V12l2-5h12l2 5v4.5z"/><path d="M4 12h16"/><circle cx="7.5" cy="16.5" r="1.8"/><circle cx="16.5" cy="16.5" r="1.8"/>',
  cart: '<path d="M2.5 4H5l2.5 11.5h11L21 7H6.2"/><circle cx="9" cy="19.5" r="1.4"/><circle cx="17" cy="19.5" r="1.4"/>',
  media: '<rect x="2.5" y="5" width="19" height="12" rx="1.5"/><path d="M8 21h8"/><path d="M6.5 12h4M6.5 9h7"/>',
  diamond: '<path d="M7 4h10l4 5-9 11L3 9z"/><path d="M3 9h18M9.5 4 8 9l4 11 4-11-1.5-5"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 7 8.5-7"/>',
  call: '<path d="M5 4h4l1.5 4.5-2.5 1.5a12 12 0 0 0 6 6l1.5-2.5L20 15v4a1.5 1.5 0 0 1-1.5 1.5C10.5 20 4 13.5 3.5 5.5A1.5 1.5 0 0 1 5 4z"/>',
  pin: '<path d="M12 21s6.5-6 6.5-11a6.5 6.5 0 1 0-13 0c0 5 6.5 11 6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
  arrow: '<path d="M7 17 17 7M9 7h8v8"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
}

export const icon = (name, cls = 'ico') =>
  `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || ''}</svg>`

// Fill every <i data-icon="name"></i> placeholder in the static HTML.
export function hydrateIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach(el => { el.outerHTML = icon(el.dataset.icon, el.className || 'ico') })
}
