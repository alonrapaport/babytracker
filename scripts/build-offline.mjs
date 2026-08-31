// Packages the file://-compatible build into ONE complete HTML document —
// RecipeBox.html — that runs the whole demo app when opened straight from a
// phone's storage (WhatsApp/email the file to yourself, tap, open in Chrome).
// No hosting, no accounts; data persists in that browser via localStorage.
//
// Usage: VITE_OFFLINE_FILE=1 npx vite build && node scripts/build-offline.mjs
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../dist-offline/', import.meta.url));
const assets = readdirSync(`${dist}assets`);
const jsFiles = assets.filter((f) => f.endsWith('.js'));
const cssFiles = assets.filter((f) => f.endsWith('.css'));
if (jsFiles.length !== 1) {
  throw new Error(`expected exactly 1 js in dist-offline/assets, got: ${assets.join(', ')} — run VITE_OFFLINE_FILE=1 npx vite build first`);
}

const js = readFileSync(`${dist}assets/${jsFiles[0]}`, 'utf8').replace(/<\/script/gi, '<\\/script');
// the IIFE build usually inlines the (tiny) CSS into the JS; keep any emitted file too
const css = cssFiles.length ? readFileSync(`${dist}assets/${cssFiles[0]}`, 'utf8') : '';

const html = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, maximum-scale=1.0, user-scalable=no" />
<meta name="theme-color" content="#FBF7F2" />
<title>RecipeBox</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Roboto:wght@400;500;700&family=Heebo:wght@400;500;600;700&display=swap" rel="stylesheet" />
<style>
${css}
</style>
</head>
<body>
<div id="root"></div>
<script>
${js}
</script>
</body>
</html>
`;

writeFileSync(`${dist}RecipeBox.html`, html);
console.log(`dist-offline/RecipeBox.html written (${Math.round(html.length / 1024)} KB)`);
