import type { Entry, Lang, Reminder } from './types';

// Lazy-load Capacitor's LocalNotifications only when running inside the native
// app. In the browser we fall back to the Web Notifications API.
async function nativeNotifications() {
  try {
    const cap = await import('@capacitor/core');
    if (!cap.Capacitor.isNativePlatform()) return null;
    const mod = await import('@capacitor/local-notifications');
    return mod.LocalNotifications;
  } catch {
    return null;
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  const ln = await nativeNotifications();
  if (ln) {
    const res = await ln.requestPermissions();
    return res.display === 'granted';
  }
  if ('Notification' in window) {
    const p = await Notification.requestPermission();
    return p === 'granted';
  }
  return false;
}

const NAP_ID = 7001;

function napTitle(lang: Lang) {
  return lang === 'he' ? 'תזכורת שינה' : 'Nap reminder';
}
function napBody(lang: Lang) {
  return lang === 'he' ? 'אולי הגיע הזמן לשנת מנוחה 💤' : 'It might be time for a nap 💤';
}

// Compute the next reminder time from the schedule + the last sleep that ended.
export function nextNapTime(reminder: Reminder, entries: Entry[], now = new Date()): Date | null {
  if (!reminder.enabled) return null;
  if (reminder.kind === 'wakeWindow') {
    const mins = reminder.config.awakeMinutes ?? 90;
    const lastSleep = entries
      .filter((e) => e.type === 'sleep' && e.end_time)
      .sort((a, b) => new Date(b.end_time!).getTime() - new Date(a.end_time!).getTime())[0];
    const base = lastSleep ? new Date(lastSleep.end_time!) : now;
    const t = new Date(base.getTime() + mins * 60000);
    return t.getTime() > now.getTime() ? t : new Date(now.getTime() + mins * 60000);
  }
  // fixed times: next "HH:MM" after now
  const times = (reminder.config.times ?? []).slice().sort();
  for (const hm of times) {
    const [h, m] = hm.split(':').map(Number);
    const t = new Date(now);
    t.setHours(h, m, 0, 0);
    if (t.getTime() > now.getTime()) return t;
  }
  if (times.length) {
    const [h, m] = times[0].split(':').map(Number);
    const t = new Date(now);
    t.setDate(t.getDate() + 1);
    t.setHours(h, m, 0, 0);
    return t;
  }
  return null;
}

export async function scheduleNapReminder(reminder: Reminder, entries: Entry[], lang: Lang) {
  const when = nextNapTime(reminder, entries);
  const ln = await nativeNotifications();
  if (ln) {
    await ln.cancel({ notifications: [{ id: NAP_ID }] });
    if (!when) return;
    await ln.schedule({
      notifications: [
        {
          id: NAP_ID,
          title: napTitle(lang),
          body: napBody(lang),
          schedule: { at: when },
        },
      ],
    });
  }
  // (Browser fallback fires only while the tab is open; native is the real path.)
  return when;
}

export async function cancelNapReminder() {
  const ln = await nativeNotifications();
  if (ln) await ln.cancel({ notifications: [{ id: NAP_ID }] });
}
