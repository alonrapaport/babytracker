# RecipeBox — מדריך הקמה חינמי ב-5 דקות · Free 5-minute setup

הכל בחינם. שלב 1 מספיק לחוויה המלאה במכשיר אחד; שלב 2 מוסיף חשבונות וסנכרון בין מכשירים.

---

## 🇮🇱 עברית

### שלב 1 — אתר חי + התקנה על הטלפון (דקה אחת, חינם)

1. ☐ היכנסו אל <https://github.com/new> וצרו רפוזיטורי חדש:
   שם **`recipebox`**, נראוּת **Public** (נדרש כדי ש-GitHub Pages יהיה חינמי. אין בקוד שום סוד).
2. ☐ ודאו שלאפליקציית Claude יש גישה לרפו החדש (claude.ai ← Settings ← Connectors ← GitHub), וכתבו לי "הרפו מוכן" — אני אדחוף את הקוד ואשגיח על הפריסה עד שהיא ירוקה.
   (לחלופין, מכל מחשב עם git:)
   ```bash
   git clone -b claude/new-app-recime-features-nb5tbq https://github.com/alonrapaport/babytracker recipebox
   cd recipebox && git branch -m main
   git remote set-url origin https://github.com/alonrapaport/recipebox.git
   git push -u origin main
   ```
3. ☐ תוך כ-2 דקות ה-Action "Deploy to GitHub Pages" מפרסם את האתר בכתובת:
   **`https://alonrapaport.github.io/recipebox/`**
4. ☐ פתחו את הכתובת בכרום בטלפון ← תפריט ⋮ ← **הוספה למסך הבית**.
   מעכשיו RecipeBox נפתח כמו אפליקציה, עובד גם בלי רשת, ומופיע ב**תפריט השיתוף** של אנדרואיד — שתפו קישור מכל אפליקציה ← RecipeBox ← מסך הייבוא.

מה עובד כבר בשלב הזה: ייבוא מקישור (דרך שירות ציבורי), הדבקת כתוביות, קריאת תמונות (OCR), ספרי מתכונים, רשימת קניות, תכנון שבועי/חודשי, מצב בישול, ערכים תזונתיים — הנתונים נשמרים במכשיר, עם גיבוי/שחזור JSON מהחשבון.

### שלב 2 — חשבונות וסנכרון בין מכשירים (5 דקות, חינם, אופציונלי)

1. ☐ צרו פרויקט חינמי ב-<https://supabase.com> (Free tier: 500MB — הרבה מעבר לשימוש אישי).
2. ☐ ב-**SQL Editor** הדביקו את כל התוכן של [`supabase/schema.sql`](supabase/schema.sql) ולחצו **Run** (פעם אחת).
3. ☐ ב-**Project Settings ← API** העתיקו את **Project URL** ואת **anon public key**.
4. ☐ ברפו ב-GitHub: **Settings ← Secrets and variables ← Actions ← New repository secret**, והוסיפו שניים:
   `VITE_SUPABASE_URL` ו-`VITE_SUPABASE_ANON_KEY`.
5. ☐ הריצו שוב את ה-Action (Actions ← Deploy to GitHub Pages ← Run workflow) — או כתבו לי ואעשה זאת.

אותה כתובת בדיוק הופכת עכשיו לאפליקציה המלאה: הרשמה, סנכרון בין הטלפון והמחשב, ספרי מתכונים משותפים בקישור הזמנה, ומסך "גלו" משותף. הדמו המיידי נשאר זמין ב-`?demo` בסוף הכתובת.

(רשות: פריסת פונקציית הייבוא הפרטית — `supabase functions deploy import-recipe` — משפרת פרטיות ואמינות של ייבוא מקישור; בלעדיה הייבוא עובד דרך השירות הציבורי.)

---

## 🇬🇧 English

### Step 1 — Live site + install on your phone (1 minute, free)

1. ☐ Go to <https://github.com/new> and create a repo named **`recipebox`**, visibility **Public** (required for free GitHub Pages; the code contains no secrets).
2. ☐ Make sure the Claude GitHub app can access the new repo (claude.ai → Settings → Connectors → GitHub) and tell me "repo is ready" — I'll push the code and babysit the deploy until it's green. (Or push it yourself with the commands above.)
3. ☐ Within ~2 minutes the "Deploy to GitHub Pages" action publishes the site at **`https://alonrapaport.github.io/recipebox/`**.
4. ☐ Open it in Chrome on your phone → ⋮ menu → **Add to Home Screen**. RecipeBox now opens like an app, works offline, and appears in Android's **share sheet** — share a link from any app → RecipeBox → import screen.

Everything works at this stage (URL import via a public fetch service, caption paste, photo OCR, cookbooks, grocery, planner, cook mode, nutrition); data lives on the device with JSON backup/restore from the Account tab.

### Step 2 — Accounts & cross-device sync (5 minutes, free, optional)

1. ☐ Create a free project at <https://supabase.com>.
2. ☐ In the **SQL Editor**, paste all of [`supabase/schema.sql`](supabase/schema.sql) and **Run** once.
3. ☐ From **Project Settings → API** copy the **Project URL** and **anon public key**.
4. ☐ In the GitHub repo: **Settings → Secrets and variables → Actions**, add two secrets: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
5. ☐ Re-run the deploy action (or ask me to).

The same URL now serves the full app: sign-up, sync across devices, shared cookbooks via invite links, and the shared Discover feed. The instant demo stays available at `?demo`.

(Optional: `supabase functions deploy import-recipe` gives URL import a private server-side fetcher; without it, imports use the public service.)
