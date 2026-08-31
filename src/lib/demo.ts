// Demo mode lets the app run with no backend — used for the public GitHub
// Pages preview and local development without a Supabase project. Triggered by
// the VITE_DEMO build flag or a `demo` marker in the URL.
export const isDemo: boolean =
  import.meta.env.VITE_DEMO === '1' ||
  (typeof window !== 'undefined' && window.location.href.toLowerCase().includes('demo'));
