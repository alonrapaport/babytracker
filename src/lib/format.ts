import type { Lang } from './types';

export function pad(n: number) {
  return String(n).padStart(2, '0');
}

// "08:45"
export function timeHHMM(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Duration in seconds -> compact "1h 8m" / "8m" / "45s"
export function fmtDuration(totalSec: number, lang: Lang): string {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const u = lang === 'he'
    ? { h: 'ש׳', m: 'ד׳', s: 'שנ׳' }
    : { h: 'h', m: 'm', s: 's' };
  if (h > 0) return `${h}${u.h} ${m}${u.m}`;
  if (m > 0) return `${m}${u.m}`;
  return `${sec}${u.s}`;
}

// "Hh Mm Ss" with subscript-style units for big timer display
export function splitDuration(totalSec: number) {
  const s = Math.max(0, Math.floor(totalSec));
  return {
    h: Math.floor(s / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
  };
}

// Relative "time since" — "20m ago", "1h 5m ago", "now"
export function timeAgo(date: Date, lang: Lang, now = new Date()): string {
  const sec = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (sec < 30) return lang === 'he' ? 'עכשיו' : 'now';
  const dur = fmtDuration(sec, lang);
  return lang === 'he' ? `לפני ${dur}` : `${dur} ago`;
}

export function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// value for <input type="datetime-local"> in local time
export function toLocalInputValue(d: Date) {
  const x = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return x.toISOString().slice(0, 16);
}

export function fromLocalInputValue(v: string) {
  return new Date(v);
}

export function ageString(birthdate: string | null, lang: Lang): string {
  if (!birthdate) return '';
  const b = new Date(birthdate);
  const now = new Date();
  let months = (now.getFullYear() - b.getFullYear()) * 12 + (now.getMonth() - b.getMonth());
  if (now.getDate() < b.getDate()) months -= 1;
  const years = Math.floor(months / 12);
  const remM = months % 12;
  if (lang === 'he') {
    if (years > 0) return `${years} ש׳ ${remM} ח׳`;
    return `${months} חודשים`;
  }
  if (years > 0) return `${years}y ${remM}m`;
  return `${months}mo`;
}
