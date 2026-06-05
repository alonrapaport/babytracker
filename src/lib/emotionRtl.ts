import createCache from '@emotion/cache';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';

// Two Emotion caches: one for LTR (English), one for RTL (Hebrew). We swap the
// active cache when the language changes so MUI styles mirror correctly.
export const ltrCache = createCache({ key: 'mui', stylisPlugins: [prefixer] });
export const rtlCache = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
});

export const cacheFor = (dir: 'ltr' | 'rtl') => (dir === 'rtl' ? rtlCache : ltrCache);
