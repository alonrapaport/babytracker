# Nara Baby — bilingual baby tracker (Hebrew / English)

A mobile-first baby-tracking app inspired by Nara Baby: track feeds (breastfeed,
bottle, pump, solids), diapers, sleep (with a live wake-window timer), routines,
growth & milestones, and health — with caregiver sharing, a Material 3 dark UI,
and full Hebrew (RTL) / English switching. Built with React + Vite + MUI,
backed by **Supabase** (free), and packaged for Android with **Capacitor**.

## Features
- **Activity home** with color-coded Material 3 cards and a live status on each
  card ("Sleeping 9m", "Woke up · 11m ago", "20m ago" …) that updates every second.
- **Trackers:** Breastfeed (left/right timers), Bottle, Pump, Solids, Diaper
  (wet/dirty/dry + rash), Sleep (running timer that survives refresh), Routine
  (+ custom), Weight / Height / Head Size, Milestones, Medical, Vaccine.
- **History** — 24-hour timeline per day with a week selector and a "now" line.
- **Trends** — sleep / feeds / diapers per day + WHO growth-percentile charts.
- **Summary** — Today / Last 24 Hours totals.
- **Reminders** — nap reminders (Wake Windows or Fixed Times) as on-device
  notifications (Capacitor).
- **Family sharing** — invite a partner/caregiver by link; they get full access.
- **CSV export**, multiple babies, units (ml/oz, kg/lb, cm/in).
- **Hebrew RTL by default**, English in one tap (layout mirrors live).

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
   and the private `baby-photos` storage bucket.
5. Email auth is enabled by default. (Optional: turn off "Confirm email" under
   **Authentication → Providers → Email** for faster local testing.)

## 2. Run on the web
```bash
npm install
npm run dev        # http://localhost:5173
```
Sign up, create your baby, and start tracking. Data syncs live via Supabase.

## 3. Build the Android app (Android Studio)
The web app is bundled into a native Android shell with Capacitor, so on-device
nap reminders work even offline.

The `android/` project is already included, so you only need:

```bash
npm run build              # builds dist/
npx cap sync android       # copy web assets + plugins into the android project
npx cap open android       # opens Android Studio
```

(If you ever delete `android/`, regenerate it with `npx cap add android`.)
In Android Studio: **Run ▶** (or **Build → Build APK**) and install the APK on
your phone. The app id is `com.bat.narababy` (see `capacitor.config.ts`).

> Notifications: the first time you enable a reminder, Android asks for
> notification permission. Reminders are scheduled as **local notifications**,
> so they fire on-device without any server.

## Tech
- React + Vite + TypeScript, MUI v6 (Material Design 3 theming), Emotion + RTL.
- Supabase (Postgres, Auth, Realtime, Storage).
- Capacitor (`@capacitor/local-notifications`, `@capacitor/camera`).
- WHO Child Growth Standards reference data (public domain) for growth charts.

## Project layout
```
src/
  screens/    Activity, History, Trends, Shop, Account, Auth, Onboarding, Join
  sheets/     TrackerSheet (all activity forms + timers)
  components/ cards, header, dialogs (Summary, Reminders), fields, photo, tabbar
  lib/        supabase, db (CRUD + realtime), reminders, csv, format, helpers
  i18n/       he + en dictionaries, provider (RTL)
  data/       activities, routines, first foods, WHO growth tables
supabase/schema.sql   run once in the Supabase SQL editor
```
