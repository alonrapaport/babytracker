import type { Baby, Entry, EntryType, Profile, Reminder } from './types';

// In-memory store backing demo mode. Seeded with a baby "bat" and a handful of
// realistic entries spread across today, so the preview looks alive.
const DEMO_USER = 'demo-user';
const DEMO_BABY = 'demo-baby';

function iso(hour: number, min = 0): string {
  const d = new Date();
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
}

let idSeq = 1;
const nid = (p: string) => `${p}-${idSeq++}`;

export const demoProfile: Profile = {
  id: DEMO_USER,
  display_name: 'Demo',
  language: 'he',
  units: { volume: 'ml', weight: 'kg', length: 'cm' },
  active_baby_id: DEMO_BABY,
};

export const demoBabies: Baby[] = [
  {
    id: DEMO_BABY,
    name: 'bat',
    birthdate: (() => {
      const d = new Date();
      d.setMonth(d.getMonth() - 5);
      return d.toISOString().slice(0, 10);
    })(),
    sex: 'girl',
    photo_path: null,
    owner_id: DEMO_USER,
    created_at: new Date().toISOString(),
  },
];

function mk(type: EntryType, start: string, end: string | null, data: Record<string, unknown>): Entry {
  return {
    id: nid(type),
    baby_id: DEMO_BABY,
    type,
    start_time: start,
    end_time: end,
    data,
    created_by: DEMO_USER,
    created_at: start,
    updated_at: start,
  };
}

export let demoEntries: Entry[] = [
  mk('sleep', iso(8, 45), iso(9, 13), {}),
  mk('breastfeed', iso(9, 20), iso(9, 38), { leftSec: 600, rightSec: 480, lastSide: 'right', notes: '' }),
  mk('diaper', iso(9, 40), null, { kind: 'wet', rash: false }),
  mk('bottle', iso(11, 5), null, { amount: 120, unit: 'ml', contents: 'formula' }),
  mk('sleep', iso(12, 30), iso(14, 0), {}),
  mk('diaper', iso(14, 10), null, { kind: 'dirty', rash: false }),
  mk('weight', iso(7, 0), null, { value: 7.2, unit: 'kg' }),
  mk('routine', iso(16, 0), null, { routineType: 'Tummy time' }),
];

let listeners: (() => void)[] = [];
function emit() {
  listeners.forEach((fn) => fn());
}

export const demoApi = {
  subscribe(fn: () => void) {
    listeners.push(fn);
    return () => {
      listeners = listeners.filter((l) => l !== fn);
    };
  },
  listEntries(): Entry[] {
    return demoEntries
      .slice()
      .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
  },
  createEntry(input: { type: EntryType; start_time: string; end_time?: string | null; data?: Record<string, unknown> }): Entry {
    const e = mk(input.type, input.start_time, input.end_time ?? null, input.data ?? {});
    demoEntries = [e, ...demoEntries];
    emit();
    return e;
  },
  updateEntry(id: string, patch: Partial<Entry>) {
    demoEntries = demoEntries.map((e) => (e.id === id ? { ...e, ...patch } : e));
    emit();
  },
  deleteEntry(id: string) {
    demoEntries = demoEntries.filter((e) => e.id !== id);
    emit();
  },
  createBaby(input: { name: string; birthdate: string | null; sex: string | null }): Baby {
    const b: Baby = {
      id: nid('baby'),
      name: input.name,
      birthdate: input.birthdate,
      sex: (input.sex as Baby['sex']) ?? null,
      photo_path: null,
      owner_id: DEMO_USER,
      created_at: new Date().toISOString(),
    };
    demoBabies.push(b);
    emit();
    return b;
  },
  reminders: [] as Reminder[],
};
