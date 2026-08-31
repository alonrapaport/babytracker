# RecipeBox — כל המתכונים שלכם במקום אחד 🍲

A Hebrew-first (עברית + English, full RTL) recipe manager modeled on the complete
ReciMe feature set — built as a mobile-first **PWA** with React + Vite + MUI,
backed by **Supabase** (free tier), with a zero-backend **demo mode**.
**No AI anywhere**: recipe import is deterministic parsing (schema.org
structured data + smart text heuristics), so it needs no API keys.

## Features

- **Import from anywhere**
  - **From a URL** — a Supabase Edge Function fetches the page privately and
    extracts the schema.org/Recipe markup (JSON-LD + microdata). Works for
    most recipe sites, Israeli ones included. Without Supabase (demo mode,
    GitHub Pages before setup) it falls back to a public fetch service —
    only the page address is sent to it — and parses fully client-side.
  - **Paste text** — paste an Instagram/TikTok caption or any recipe text; a
    deterministic parser detects Hebrew/English headers (מצרכים / אופן הכנה /
    Ingredients / Directions), bullets, quantities and servings.
  - **Paste HTML** — paste a page's source; parsed fully client-side (no
    server needed at all).
  - **From photos & screenshots** — snap a cookbook page or pick screenshots;
    on-device OCR (tesseract.js WASM, Hebrew + English, no API keys, nothing
    uploaded) reads the text into the same parser. Printed recipes read well;
    handwriting is best-effort.
  - **Android share-sheet** — the installed PWA registers as a share target:
    share a post/page → RecipeBox → import screen.
  - **Chrome extension** (`extension/`) — one click lifts the recipe from the
    current tab into the app.
  - Everything lands in a **prefilled editor**, so anything a parser missed is
    a 5-second manual fix.
- **Recipe cards** — photo, prep/cook/total times, servings, grouped
  ingredients ("לרוטב:"), numbered steps, notes, tags (meal type / cuisine /
  diet / category), favorites, link back to the original Reel/page.
- **Serving scaling** — change servings and every parsed quantity recomputes
  (nice fractions: ½, 1⅓). Unparsed lines are shown verbatim, never corrupted.
- **Unit conversion** — flip a recipe between original / metric / US cups.
- **Cookbooks** — organize recipes into books, and **share a cookbook by
  invite link**: members see its recipes and can add their own (works via a
  secret token + `join_cookbook` RPC).
- **Community (Discover)** — mark a recipe public and it appears in the
  Discover tab for all users of your deployment; search it by dish name or by
  **ingredient** ("מה אפשר להכין עם עגבניות?"), save a copy to your library.
- **Grocery list** — add a recipe (scaled) and duplicates merge automatically,
  converting compatible units (cup + tbsp, ק"ג + גרם); grouped by supermarket
  **aisle** (Hebrew+English keyword auto-assignment, 13 aisles) or by recipe;
  **custom aisles**; quick-add parses "2 כוסות קמח"; check off, clear, share
  the list as text to WhatsApp.
- **Meal planner** — Sunday-first week with breakfast/lunch/dinner/snack
  slots, plus a **month view**; one tap adds a day's or a whole week's
  ingredients to the grocery list (the thing ReciMe doesn't do 😉).
- **Cook mode** — full-screen step-by-step with check-off, an ingredients
  drawer, and a screen wake-lock so the phone stays on with floury hands.
- **Nutrition for every recipe** — imported from the source page when
  available; otherwise a built-in offline estimator (~120 staple foods, he+en,
  USDA-style values with densities and unit weights) computes per-serving
  calories/protein/carbs/fat, clearly labeled משוער/approximate. Imports
  auto-estimate; a "חישוב ערכים משוער" button does it in the editor.
- **Watch the original** — recipes imported from YouTube play the source video
  inline on the recipe page (Instagram/TikTok link out — they block embeds).
- **Share & backup** — share any recipe as formatted text (Web Share API /
  clipboard); export/import your entire library as JSON.
- **PWA** — installable on the home screen, offline app shell, Hebrew RTL
  manifest.

**Non-goals** (deliberately): no paywall, no cloud AI (photo import uses
classical on-device OCR instead), no grocery-delivery ordering (share the
list as text instead), no native iOS build (see Capacitor note below).

> **Want it live on your phone in 5 free minutes?** Follow the bilingual
> checklist in [`SETUP.md`](SETUP.md) — repo → free GitHub Pages URL →
> Add to Home Screen, with optional free Supabase sync.

## Try it with zero accounts: one file on your phone

`npm run build:offline` produces **`dist-offline/RecipeBox.html`** — the whole
app in a single file that opens straight from a phone's storage (send it to
yourself on WhatsApp/email → open → choose Chrome). No hosting, no logins;
runs the seeded demo and keeps your changes in that browser. Save the file
once (e.g. to Downloads) and keep opening that same copy so the data sticks.

## Try it in 10 seconds (demo mode, no backend)

```bash
npm install
npm run dev        # http://localhost:5173/?demo
```

Demo mode (`?demo` in the URL, or a `VITE_DEMO=1` build) runs entirely on
localStorage with seeded Hebrew + English recipes — imports, grocery, planner
and Discover all work offline. Reset it from the Account tab.

## 1. One-time Supabase setup (free)

1. Create a free project at <https://supabase.com>.
2. In **Project Settings → API**, copy the **Project URL** and the **anon
   public** key.
3. Copy `.env.example` to `.env` and paste those two values:
   ```
   VITE_SUPABASE_URL=https://your-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
4. Open **SQL Editor**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql),
   and **Run**. This creates the tables, Row-Level Security policies, realtime,
   the `join_cookbook` RPC, and the private `recipe-photos` storage bucket.
5. Email auth is enabled by default. (Optional: turn off "Confirm email" under
   **Authentication → Providers → Email** for faster local testing.)
6. **URL import** needs the Edge Function once per project
   ([Supabase CLI](https://supabase.com/docs/guides/cli)):
   ```bash
   supabase functions deploy import-recipe
   ```
   Until it's deployed the app still imports via paste-text / paste-HTML /
   the extension. (The function's parsers are synced copies of `src/lib/parse`
   — after changing those, run `npm run sync:edge` and redeploy.)

## 2. Run on the web

```bash
npm install
npm run dev        # http://localhost:5173
```

Sign up, import your first recipe, and everything syncs live via Supabase
across your devices.

## 3. Chrome extension (desktop clipping)

1. Open `chrome://extensions`, enable **Developer mode**, click **Load
   unpacked**, pick the [`extension/`](extension) folder.
2. In the extension's options, set your app URL (dev server or deployed site).
3. On any recipe page, click the RecipeBox toolbar button.

## 4. Install as an app + Android share-sheet

Serve the app over HTTPS (GitHub Pages / any static host), open it in Chrome
on your phone → **Add to Home Screen**. Once installed, RecipeBox appears in
the Android share sheet: share an Instagram post or a recipe page straight
into the import screen. (Share-target requires the installed PWA on HTTPS.)

## 5. Deploy the demo to GitHub Pages

[`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml)
builds a `VITE_DEMO=1` demo (runs the tests first) and publishes `dist/` to
GitHub Pages on every push.

> **Private repo caveat:** GitHub Pages on a private repository requires
> GitHub Pro/Team. Either upgrade, make the repo public (the demo build
> contains no secrets — the anon key isn't baked into demo builds), or deploy
> `dist/` to any static host (Netlify/Vercel/Cloudflare Pages).

## Tests & scripts

```bash
npm test               # vitest — parsers (he+en), scaling, conversion, grocery merge, demo store
npm run typecheck      # strict tsc
npm run build          # production build + PWA service worker
npm run smoke          # Playwright end-to-end of the demo (Hebrew first, then English)
npm run sync:edge      # re-copy shared parsers into the edge function
node scripts/render-icons.mjs   # regenerate PNG icons from the SVG
```

## Android (Capacitor) — optional follow-up

The app is Capacitor-ready (same setup as the babytracker app): `npm i
@capacitor/core @capacitor/cli && npx cap init && npx cap add android`, then
`npm run build && npx cap sync android` and build the APK in Android Studio.

## Project layout

```
src/
  screens/     Recipes, RecipeDetail, CookMode, Import, Discover, Cookbooks,
               CookbookDetail, Planner, Grocery, Account, Auth, Join
  sheets/      RecipeEditor, AddToGrocery, CookbookPicker, RecipePicker
  components/  cards, photo placeholders, ingredient list, tab bar, header…
  lib/         db (Supabase/demo facade), demoStore, importClient, scale,
               convert, grocery merge, share, export/import, wake lock
  lib/parse/   ingredient / jsonld / microdata / text / duration parsers (+tests)
  data/        units (he+en), aisles (he+en), tags, demo seed recipes
  i18n/        he (default, RTL) + en dictionaries
supabase/      schema.sql (run once) + functions/import-recipe (deploy once)
extension/     MV3 Chrome clipper
scripts/       render-icons, sync-edge, smoke (Playwright)
```
