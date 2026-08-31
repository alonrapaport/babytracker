// On toolbar click: lift the page's schema.org Recipe JSON-LD and open the
// RecipeBox import screen with it. Falls back to sending just the URL when the
// page has no (or oversized) JSON-LD — the app then imports via its server
// function or the paste tabs.

const DEFAULT_BASE = 'http://localhost:5173/';
const MAX_PAYLOAD = 30 * 1024; // keep the URL well under browser limits

function collectJsonLd() {
  const blocks = [...document.querySelectorAll('script[type="application/ld+json"]')].map(
    (s) => s.textContent || ''
  );
  return { blocks, url: location.href };
}

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id || !/^https?:/.test(tab.url || '')) return;
  const { baseUrl } = await chrome.storage.sync.get({ baseUrl: DEFAULT_BASE });
  const base = (baseUrl || DEFAULT_BASE).replace(/\/+$/, '') + '/';

  let payload = null;
  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: collectJsonLd,
    });
    payload = result?.result ?? null;
  } catch (e) {
    // page blocks injection (chrome://, web store, PDFs) — fall back to URL only
  }

  const params = new URLSearchParams();
  const recipeBlock = payload?.blocks?.find((b) => /"Recipe"/.test(b));
  if (recipeBlock && recipeBlock.length < MAX_PAYLOAD) {
    params.set('ld', recipeBlock);
    params.set('url', payload.url);
  } else {
    params.set('url', payload?.url || tab.url || '');
  }
  chrome.tabs.create({ url: `${base}?${params.toString()}#/import` });
});
