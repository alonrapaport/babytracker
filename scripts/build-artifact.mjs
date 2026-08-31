// Packages the demo build into ONE self-contained HTML fragment for hosting
// surfaces that take a single file (e.g. a Claude artifact): inlines the entry
// JS + CSS from dist/, keeps the Google Fonts links, and drops PWA bits
// (manifest/service worker don't run there).
//
// Usage: VITE_DEMO=1 npm run build && node scripts/build-artifact.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
// take the ENTRY chunk from index.html (dynamic-import chunks share the prefix)
const indexHtml = readFileSync(`${dist}index.html`, 'utf8');
const jsFile = indexHtml.match(/<script type="module"[^>]*src="\.\/(assets\/[^"]+\.js)"/)?.[1];
const cssFile = indexHtml.match(/<link rel="stylesheet"[^>]*href="\.\/(assets\/[^"]+\.css)"/)?.[1];
if (!jsFile || !cssFile) throw new Error('run `VITE_DEMO=1 npm run build` first');

const js = readFileSync(`${dist}${jsFile}`, 'utf8').replace(/<\/script/gi, '<\\/script');
const css = readFileSync(`${dist}${cssFile}`, 'utf8');

const html = `<title>RecipeBox</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Roboto:wght@400;500;700&family=Heebo:wght@400;500;600;700&display=swap" rel="stylesheet" />
<style>
${css}
</style>
<div id="root"></div>
<script type="module">
${js}
</script>
`;

writeFileSync(`${dist}recipebox-demo.html`, html);
console.log(`dist/recipebox-demo.html written (${Math.round(html.length / 1024)} KB)`);
