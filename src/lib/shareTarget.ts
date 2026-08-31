// PWA share-target + extension hand-off. With HashRouter, GET params land in
// location.search BEFORE the '#', so we consume them once at boot and strip
// them from the URL.

export type SharedPayload = { url?: string; text?: string; title?: string; ld?: string };

export function consumeShareTarget(): SharedPayload | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const payload: SharedPayload = {};
  for (const key of ['url', 'text', 'title', 'ld'] as const) {
    const v = params.get(key);
    if (v) payload[key] = v;
  }
  if (!payload.url && !payload.text && !payload.ld) return null;

  // Android often shares the link inside `text` — promote it to `url`.
  if (!payload.url && payload.text) {
    const m = payload.text.match(/https?:\/\/\S+/);
    if (m && payload.text.trim() === m[0]) {
      payload.url = m[0];
      delete payload.text;
    }
  }

  const clean = window.location.pathname + window.location.hash;
  window.history.replaceState(null, '', clean || './');
  return payload;
}
