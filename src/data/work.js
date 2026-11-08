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


// Content richness: cards with photos first (more photos first), then by how many
// details they carry; bare placeholder cards go last. Used to order every list.
const casePhotos = c => photos[c.slug]?.length || 0
const projectPhotos = p => p.photos.length || photos[p.case]?.length || 0
export const caseScore = c => (casePhotos(c) ? 100 + casePhotos(c) : 0) + 3 + (c.where ? 2 : 0) + (c.stats?.length || 0) * 0.5 + (c.did?.length || 0) * 0.1
export const projectScore = p => (projectPhotos(p) ? 100 + projectPhotos(p) : 0) + (p.case ? 3 : 0) + (typeof p.stores === 'number' ? 2 : 0) + p.countries.length * 0.1
export const byScore = score => (a, b) => score(b) - score(a)
export const casesByContent = cases.slice().sort(byScore(caseScore))
export const projectsByContent = projects.slice().sort(byScore(projectScore))

export const workItems = [
  ...cases.map(c => ({ slug: c.slug, brand: c.brand, title: c.title, service: c.service, stat: c.stat, statLabel: c.statLabel, score: caseScore(c), cover: photos[c.slug]?.length ? `work/${c.slug}/cover.webp` : null })),
  ...standaloneProjects.map(p => { const [stat, statLabel] = projectStat(p); return { slug: p.slug, brand: p.brand, title: p.title, service: p.service, stat, statLabel, score: projectScore(p), cover: p.photos.length ? `projects/${p.slug}/cover.webp` : null } }),
].sort((a, b) => b.score - a.score)
