import type { Entry, EntryType, Lang } from './types';
import type { ActivityGroupKey } from '../data/activities';
import { fmtDuration, timeAgo, timeHHMM } from './format';
import type { Dict } from '../i18n/en';

const groupTypes: Record<ActivityGroupKey, EntryType[]> = {
  feed: ['breastfeed', 'bottle', 'solids'],
  pump: ['pump'],
  diaper: ['diaper'],
  sleep: ['sleep'],
  routine: ['routine'],
  growth: ['weight', 'height', 'head', 'milestone'],
  health: ['medical', 'vaccine'],
};

export function entriesForGroup(entries: Entry[], group: ActivityGroupKey): Entry[] {
  const types = groupTypes[group];
  return entries.filter((e) => types.includes(e.type));
}

export function runningSleep(entries: Entry[]): Entry | null {
  return entries.find((e) => e.type === 'sleep' && !e.end_time) ?? null;
}

export function entryDurationSec(e: Entry): number {
  if (e.type === 'breastfeed' || e.type === 'pump') {
    return ((e.data.leftSec as number) || 0) + ((e.data.rightSec as number) || 0);
  }
  if (e.end_time) {
    return (new Date(e.end_time).getTime() - new Date(e.start_time).getTime()) / 1000;
  }
  return 0;
}

// One-line label for a single entry in expanded card / history.
export function entrySummary(e: Entry, lang: Lang, t: (k: keyof Dict, v?: any) => string): string {
  const start = new Date(e.start_time);
  const time = timeHHMM(start);
  const dur = entryDurationSec(e);
  switch (e.type) {
    case 'sleep': {
      if (!e.end_time) return `${time}  ${t('sleeping')}`;
      return `${time} – ${timeHHMM(new Date(e.end_time))}  ·  ${fmtDuration(dur, lang)}`;
    }
    case 'breastfeed': {
      const side = e.data.lastSide ? ` (${e.data.lastSide === 'left' ? t('left') : t('right')})` : '';
      return `${time}  ${fmtDuration(dur, lang)}${side}`;
    }
    case 'pump':
      return `${time}  ${fmtDuration(dur, lang)}`;
    case 'bottle':
      return `${time}  ${e.data.amount ?? ''}${e.data.unit ?? ''}`;
    case 'diaper':
      return `${time}  ${t((e.data.kind as keyof Dict) || 'wet')}${e.data.rash ? ' · 🔴' : ''}`;
    case 'routine':
      return `${time}  ${e.data.routineType ?? ''}`;
    case 'solids':
      return `${time}  ${(e.data.foods as string[] | undefined)?.join(', ') ?? ''}`;
    case 'weight':
    case 'height':
    case 'head':
      return `${time}  ${e.data.value ?? ''}${e.data.unit ?? ''}`;
    case 'milestone':
    case 'medical':
      return `${time}  ${e.data.title ?? ''}`;
    case 'vaccine':
      return `${time}  ${e.data.name ?? ''}`;
    default:
      return time;
  }
}

// Live status line for a group's card (the "Sleeping 9m" / "Woke up 11m ago").
export function groupStatus(
  entries: Entry[],
  group: ActivityGroupKey,
  lang: Lang,
  t: (k: keyof Dict, v?: any) => string,
  now: Date
): { text: string; active: boolean } | null {
  const list = entriesForGroup(entries, group);
  if (group === 'sleep') {
    const run = runningSleep(entries);
    if (run) {
      const sec = (now.getTime() - new Date(run.start_time).getTime()) / 1000;
      return { text: `${t('sleeping')} · ${fmtDuration(sec, lang)}`, active: true };
    }
    const last = list.filter((e) => e.end_time).sort(byStartDesc)[0];
    if (last) {
      return { text: `${t('wokeUp')} · ${timeAgo(new Date(last.end_time!), lang, now)}`, active: false };
    }
    return null;
  }
  const last = list.slice().sort(byStartDesc)[0];
  if (!last) return null;
  return { text: timeAgo(new Date(last.start_time), lang, now), active: false };
}

export function byStartDesc(a: Entry, b: Entry) {
  return new Date(b.start_time).getTime() - new Date(a.start_time).getTime();
}
