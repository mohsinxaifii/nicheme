import { defineConfig } from 'vite'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { writePages, GENERATED } from './scripts/site.js'

// GitHub Pages serves the site from /nicheme/; everywhere else it lives at the root.
const base = process.env.GITHUB_ACTIONS ? '/nicheme/' : '/'

// Every page is generated from the data files (scripts/site.js) and shares
// partials: <!--@name--> pulls src/partials/name.html or a generated block.
const partial = name => GENERATED[name] ? GENERATED[name]() : readFileSync(resolve('src/partials', `${name}.html`), 'utf8')
const expand = html => {
  for (let i = 0; i < 4 && html.includes('<!--@'); i++) html = html.replace(/<!--@([\w-]+)-->/g, (_, n) => partial(n))
  return html
}

export default defineConfig({
  base,
  plugins: [
    {
      // Page transitions: if we got here through one, cover the page before first
      // paint so the incoming sweep (src/modules/transition.js) starts seamlessly.
      name: 'niche-transition-cover',
      transformIndexHtml: html => html.replace('</head>', `  <script>try{if(sessionStorage.getItem('niche-pt')&&!matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('pt-arrive')}catch(e){}</script>
  <style>html.pt-arrive::before{content:'';position:fixed;inset:0;z-index:2147483647;background:#0A0A0A}</style>
</head>`),
    },
    { name: 'niche-partials', transformIndexHtml: { order: 'pre', handler: expand } },
    {
      // internal links and data attributes written as "/path" get the base prefix
      name: 'niche-base',
      apply: 'build',
      transformIndexHtml: {
        order: 'post',
        handler: html => base === '/' ? html : html
          .replace(/(href|src|data-prev)="\/(?!\/|nicheme\/)/g, `$1="${base}`)
          .replace(/url\('\/(?!nicheme\/)/g, `url('${base}`),
      },
    },
  ],
  build: { rollupOptions: { input: writePages() } },
})
