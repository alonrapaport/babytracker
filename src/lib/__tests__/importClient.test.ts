import { afterEach, describe, expect, it, vi } from 'vitest';
import { importFromUrl } from '../importClient';
// eslint-disable-next-line import/no-unresolved
import simpleHtml from '../parse/__tests__/fixtures/simple.html?raw';

// In tests Supabase is unconfigured, so importFromUrl exercises the public
// fetch-service fallback path.

afterEach(() => vi.unstubAllGlobals());

describe('importFromUrl (public-service fallback)', () => {
  it('fetches through a public service and parses client-side', async () => {
    const calls: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        calls.push(String(input));
        return new Response(simpleHtml, { status: 200 });
      })
    );
    const res = await importFromUrl('https://example.com/pancakes');
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.draft.title).toBe('Fluffy Pancakes');
      expect(res.draft.source_url).toBe('https://example.com/pancakes');
    }
    expect(calls[0]).toContain('allorigins');
    expect(calls[0]).toContain(encodeURIComponent('https://example.com/pancakes'));
  });

  it('tries the second service when the first fails', async () => {
    const calls: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        calls.push(String(input));
        if (calls.length === 1) throw new Error('down');
        return new Response(simpleHtml, { status: 200 });
      })
    );
    const res = await importFromUrl('https://example.com/pancakes');
    expect(res.ok).toBe(true);
    expect(calls).toHaveLength(2);
    expect(calls[1]).toContain('corsproxy');
  });

  it('reports unavailable when every service is blocked', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('blocked');
      })
    );
    const res = await importFromUrl('https://example.com/x');
    expect(res).toEqual({ ok: false, reason: 'unavailable' });
  });
});
