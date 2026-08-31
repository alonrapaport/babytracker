// End-to-end smoke of the demo build: boots the dev server in demo mode and
// drives the whole app with Playwright — HEBREW FIRST (RTL, import, scaling,
// grocery, planner, cook mode, discover), then re-checks the layout in
// English. Screenshots land in SMOKE_OUT (default ./smoke-shots).
//
// Usage: node scripts/smoke.mjs
import { spawn } from 'node:child_process';
import { existsSync, globSync, mkdirSync, statSync } from 'node:fs';
import { chromium } from 'playwright';

const PORT = 5199;
const BASE = `http://localhost:${PORT}/?demo`;
const OUT = process.env.SMOKE_OUT || 'smoke-shots';
mkdirSync(OUT, { recursive: true });

function findChromium() {
  const candidates = [process.env.PLAYWRIGHT_CHROMIUM_PATH, '/opt/pw-browsers/chromium'].filter(Boolean);
  for (const c of candidates) {
    try {
      if (existsSync(c) && statSync(c).isFile()) return c;
    } catch {
      /* next */
    }
  }
  for (const pattern of [
    '/opt/pw-browsers/chromium-*/chrome-linux/chrome',
    `${process.env.HOME}/.cache/ms-playwright/chromium-*/chrome-linux/chrome`,
  ]) {
    const hits = globSync(pattern);
    if (hits.length) return hits[0];
  }
  return undefined;
}

const HE_CAPTION = `פסטה עגבניות של אמא 🍝
הכי מנחמת שיש

מצרכים:
✅ 400 גרם ספגטי
✅ 4 עגבניות בשלות
✅ 3 שיני שום
✅ רבע כוס שמן זית
✅ חצי כפית סוכר

אופן הכנה:
1. מבשלים את הפסטה במים רותחים.
2. מטגנים שום ומוסיפים עגבניות מגוררות.
3. מתבלים, מערבבים עם הפסטה ומגישים.

ל-4 מנות
#פסטה #איטלקי`;

let server;
let browser;
let failures = 0;
let shot = 0;

const step = async (name, fn) => {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failures++;
    console.error(`  ✗ ${name}: ${String(e).split('\n')[0]}`);
  }
};

async function waitForServer(url, tries = 60) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('dev server did not start');
}

try {
  console.log('starting vite dev server…');
  server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], {
    cwd: new URL('..', import.meta.url).pathname,
    stdio: 'ignore',
    env: { ...process.env, VITE_DEMO: '1' },
  });
  await waitForServer(`http://localhost:${PORT}/`);

  browser = await chromium.launch({ executablePath: findChromium() });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));

  const snap = async (name) => {
    shot++;
    await page.screenshot({ path: `${OUT}/${String(shot).padStart(2, '0')}-${name}.png`, fullPage: false });
  };
  // bottom-nav tab by label (scoped: role-name matching is substring-based)
  const tab = (label) => page.locator('.MuiBottomNavigation-root').getByRole('button', { name: label });

  console.log('— Hebrew flow —');
  await page.goto(BASE, { waitUntil: 'networkidle' });
  // fresh demo data every run
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });

  await step('boots RTL with seeded Hebrew grid', async () => {
    await page.getByText('שקשוקה קלאסית').first().waitFor({ timeout: 15000 });
    const dir = await page.evaluate(() => document.documentElement.dir);
    if (dir !== 'rtl') throw new Error(`dir=${dir}`);
    await snap('recipes-he');
  });

  await step('search finds by Hebrew ingredient', async () => {
    await page.getByPlaceholder(/חיפוש מתכון/).fill('עדשים');
    await page.getByText('מרק עדשים כתומות').first().waitFor({ timeout: 5000 });
    await page.getByPlaceholder(/חיפוש מתכון/).fill('');
  });

  await step('scales שקשוקה 2→4 servings ("4 ביצים")', async () => {
    await page.getByText('שקשוקה קלאסית').first().click();
    await page.getByText('2 ביצים').first().waitFor({ timeout: 8000 });
    await page.getByLabel('increase').click();
    await page.getByLabel('increase').click();
    await page.getByText('4 ביצים').first().waitFor({ timeout: 5000 });
    await snap('detail-scaled-he');
  });

  await step('converts units to metric (2 כפות ×2 → 60 מ״ל)', async () => {
    await page.getByRole('button', { name: 'מטרי', exact: true }).click();
    await page.getByText(/60 מ״ל/).first().waitFor({ timeout: 5000 });
    await page.getByRole('button', { name: 'מקורי', exact: true }).click();
  });

  await step('adds scaled recipe to the grocery list', async () => {
    await page.getByRole('button', { name: 'הוספה לרשימת קניות' }).click();
    await page.getByRole('button', { name: /הוספת \d+ פריטים/ }).click();
    await page.getByText('נוסף לרשימת הקניות').waitFor({ timeout: 5000 });
  });

  await step('grocery groups by aisle in Hebrew', async () => {
    await tab('קניות').click();
    await page.getByText('ירקות ופירות').first().waitFor({ timeout: 8000 });
    await page.getByText('תבלינים').first().waitFor({ timeout: 5000 });
    await snap('grocery-he');
  });

  await step('quick-add parses "2 כוסות קמח"', async () => {
    await page.getByPlaceholder(/הוסיפו פריט/).fill('2 כוסות קמח');
    await page.getByPlaceholder(/הוסיפו פריט/).press('Enter');
    await page.getByText(/2 כוסות? קמח|2 כוס קמח/).first().waitFor({ timeout: 5000 });
  });

  await step('planner shows Sunday-first Hebrew week', async () => {
    await tab('תכנון').click();
    await page.getByText(/ראשון ·/).first().waitFor({ timeout: 8000 });
    await snap('planner-week-he');
  });

  await step('planner month view renders', async () => {
    await page.getByRole('button', { name: 'חודש', exact: true }).click();
    await page.getByText('א׳').first().waitFor({ timeout: 5000 });
    await snap('planner-month-he');
    await page.getByRole('button', { name: 'שבוע', exact: true }).click();
    await page.getByText(/ראשון ·/).first().waitFor({ timeout: 5000 });
  });

  await step('add-day-to-grocery from the planner', async () => {
    await page.getByRole('button', { name: 'הוספת היום לקניות' }).first().click();
    await page.getByText('נוסף לרשימת הקניות').waitFor({ timeout: 5000 });
  });

  await step('imports a Hebrew Instagram caption', async () => {
    await tab('מתכונים').click();
    await page.getByLabel('הוספה').click();
    await page.getByText('הדבקת טקסט או HTML').click();
    await page.getByPlaceholder(/הדביקו כתובית/).fill(HE_CAPTION);
    await snap('import-he');
    await page.getByRole('button', { name: 'פענוח הטקסט' }).click();
    await page.getByText('הייבוא נראה שלם', { exact: false }).waitFor({ timeout: 5000 });
    const title = await page.getByLabel('שם המתכון').inputValue();
    if (!title.includes('פסטה עגבניות')) throw new Error(`title="${title}"`);
    await snap('import-editor-he');
    await page.getByRole('button', { name: 'שמירה' }).click();
    await page.getByText('400 גרם ספגטי').first().waitFor({ timeout: 8000 });
  });

  await step('auto-estimates nutrition on import (משוער)', async () => {
    await page.getByText('ערכים תזונתיים', { exact: false }).first().waitFor({ timeout: 5000 });
    await page.getByText('משוער').first().waitFor({ timeout: 5000 });
    await page.getByText('קלוריות').first().waitFor({ timeout: 5000 });
    await snap('nutrition-estimated-he');
  });

  await step('YouTube source embeds an inline player', async () => {
    await page.getByLabel('עריכה').click();
    await page.getByLabel('קישור מקור').fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    await page.getByRole('button', { name: 'שמירה' }).click();
    await page.locator('iframe[src*="youtube-nocookie"]').waitFor({ timeout: 8000 });
  });

  await step('cook mode: steps, check-off, navigation', async () => {
    await page.getByRole('button', { name: 'מצב בישול' }).click();
    await page.getByText(/שלב 1 מתוך 3/).waitFor({ timeout: 5000 });
    await snap('cook-he');
    await page.getByRole('button', { name: 'סיום', exact: true }).click();
    await page.getByText(/שלב 2 מתוך 3/).waitFor({ timeout: 5000 });
    await page.getByRole('checkbox').first().check();
    await page.getByLabel('סגירה').click();
  });

  await step('photo (OCR) import tab renders', async () => {
    await tab('מתכונים').click();
    await page.getByLabel('הוספה').click();
    await page.getByText('הדבקת טקסט או HTML').click();
    await page.getByRole('tab', { name: 'מתמונה' }).click();
    await page.getByRole('button', { name: 'בחירת תמונות' }).waitFor({ timeout: 5000 });
    const goDisabled = await page.getByRole('button', { name: 'קריאת הטקסט מהתמונות' }).isDisabled();
    if (!goDisabled) throw new Error('OCR button should be disabled without photos');
  });

  await step('discover: community feed + ingredient search + save copy', async () => {
    await tab('גלו').click();
    await page.getByText('חומוס ביתי קטיפתי').first().waitFor({ timeout: 8000 });
    await page.getByPlaceholder(/חיפוש לפי מנה/).fill('עגבניות');
    await page.getByText('סלט ירקות קצוץ').first().waitFor({ timeout: 5000 });
    await snap('discover-he');
    await page.getByText('סלט ירקות קצוץ').first().click();
    await page.getByRole('button', { name: 'שמירה למתכונים שלי' }).click();
    await page.getByText('נשמר למתכונים שלכם!').waitFor({ timeout: 5000 });
  });

  console.log('— English flow —');
  await step('language toggle mirrors the layout to LTR', async () => {
    await tab('חשבון').click();
    await page.getByRole('button', { name: 'English', exact: true }).click();
    await page.getByText('Account', { exact: true }).first().waitFor({ timeout: 5000 });
    const dir = await page.evaluate(() => document.documentElement.dir);
    if (dir !== 'ltr') throw new Error(`dir=${dir}`);
    await tab('Recipes').click();
    await page.getByText('Fluffy Pancakes').first().waitFor({ timeout: 5000 });
    await snap('recipes-en');
  });

  await step('English recipe scales fractions (1½ → 3 cups flour)', async () => {
    await page.getByText('Fluffy Pancakes').first().click();
    await page.getByText('1½ cups flour').first().waitFor({ timeout: 5000 });
    await page.getByLabel('increase').click();
    await page.getByLabel('increase').click();
    await page.getByLabel('increase').click();
    await page.getByLabel('increase').click();
    await page.getByText('3 cups flour').first().waitFor({ timeout: 5000 });
    await snap('detail-en');
  });

  await step('no uncaught page errors', async () => {
    const real = pageErrors.filter((e) => !/ResizeObserver/.test(e));
    if (real.length) throw new Error(real[0]);
  });

  console.log(failures ? `\nSMOKE FAILED — ${failures} step(s) failed` : '\nSMOKE PASSED — all steps green');
} finally {
  await browser?.close().catch(() => undefined);
  server?.kill('SIGTERM');
}
process.exit(failures ? 1 : 0);
