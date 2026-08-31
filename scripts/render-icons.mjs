// Renders public/icons/icon.svg to the 192/512 PNGs the PWA manifest needs.
// Usage: node scripts/render-icons.mjs
import { existsSync, readFileSync, statSync, globSync } from 'node:fs';
import { chromium } from 'playwright';

function findChromium() {
  const candidates = [process.env.PLAYWRIGHT_CHROMIUM_PATH, '/opt/pw-browsers/chromium'].filter(Boolean);
  for (const c of candidates) {
    try {
      if (existsSync(c) && statSync(c).isFile()) return c;
    } catch {
      /* keep looking */
    }
  }
  const globs = [
    '/opt/pw-browsers/chromium-*/chrome-linux/chrome',
    `${process.env.HOME}/.cache/ms-playwright/chromium-*/chrome-linux/chrome`,
  ];
  for (const pattern of globs) {
    const hits = globSync(pattern);
    if (hits.length) return hits[0];
  }
  return undefined;
}

const svg = readFileSync(new URL('../public/icons/icon.svg', import.meta.url), 'utf8');
const executablePath = findChromium();
const browser = await chromium.launch({ executablePath });
const page = await browser.newPage();

const targets = [
  { size: 192, out: '../public/icons/icon-192.png' },
  { size: 512, out: '../public/icons/icon-512.png' },
  { size: 128, out: '../extension/icon-128.png' },
];

for (const { size, out } of targets) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<!doctype html><style>*{margin:0}</style><div style="width:${size}px;height:${size}px">${svg.replace(
      '<svg ',
      `<svg width="${size}" height="${size}" `
    )}</div>`
  );
  await page.screenshot({
    path: new URL(out, import.meta.url).pathname,
    omitBackground: true,
    clip: { x: 0, y: 0, width: size, height: size },
  });
  console.log(`${out.split('/').pop()} written`);
}

await browser.close();
