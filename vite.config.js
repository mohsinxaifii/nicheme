import { defineConfig } from 'vite'

// Relative base so the build works on any GitHub Pages path
// (https://<user>.github.io/<repo>/) and on a custom domain later.
export default defineConfig({
  base: './',
})
