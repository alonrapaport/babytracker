import type { Lang } from '../types';

/** 'PT1H30M' -> 90, 'PT20M' -> 20, 'P0DT2H' -> 120, garbage -> null */
export function parseIsoDurationMin(s: unknown): number | null {
  if (typeof s === 'number' && Number.isFinite(s)) return Math.round(s);
  if (typeof s !== 'string') return null;
  const m = s
    .trim()
    .match(/^-?P(?:(\d+(?:\.\d+)?)Y)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)W)?(?:(\d+(?:\.\d+)?)D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?$/i);
  if (!m) return null;
  const [, , , weeks, days, hours, mins, secs] = m;
  const total =
    (Number(weeks) || 0) * 7 * 24 * 60 +
    (Number(days) || 0) * 24 * 60 +
    (Number(hours) || 0) * 60 +
    (Number(mins) || 0) +
    (Number(secs) || 0) / 60;
  if (total <= 0) return null;
  return Math.round(total);
}

/** 90 -> '1h 30m' / '1 שע׳ 30 דק׳' */
export function formatMinutes(min: number, lang: Lang): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  const parts: string[] = [];
  if (lang === 'he') {
    if (h) parts.push(`${h} שע׳`);
    if (m || !h) parts.push(`${m} דק׳`);
  } else {
    if (h) parts.push(`${h}h`);
    if (m || !h) parts.push(`${m}m`);
  }
  return parts.join(' ');
}
