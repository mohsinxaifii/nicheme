// Everything shown on the 3D wall: the case studies plus every archive project
// that has no case study of its own. Each item has its own page under /case-studies/.
import { cases } from './cases.js'
import { projects } from './projects.js'
import { photos } from './photos.js'

const fmt = n => n.toLocaleString('en-US')
export const standaloneProjects = projects.filter(p => !p.case)
export const projectStat = p => typeof p.stores === 'number'
  ? [fmt(p.stores), p.service === 'research' ? 'outlets' : 'stores']
  : [p.period, '']

export const workItems = [
  ...cases.map(c => ({ slug: c.slug, brand: c.brand, title: c.title, service: c.service, stat: c.stat, statLabel: c.statLabel, cover: photos[c.slug]?.length ? `work/${c.slug}/cover.webp` : null })),
  ...standaloneProjects.map(p => { const [stat, statLabel] = projectStat(p); return { slug: p.slug, brand: p.brand, title: p.title, service: p.service, stat, statLabel, cover: p.photos.length ? `projects/${p.slug}/cover.webp` : null } }),
]
