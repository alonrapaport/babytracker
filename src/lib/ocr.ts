// Photo/screenshot import via classical OCR — tesseract.js running entirely
// in the browser (WASM). No API keys, nothing uploaded: the worker, core and
// Hebrew+English language models are fetched from a CDN on first use and
// cached after that. Printed recipes and screenshots read well; handwriting
// is best-effort (same reality as any OCR).

export type OcrProgress = { photo: number; totalPhotos: number; pct: number };

/** Strips OCR junk lines/prefixes so the text parser gets clean input. */
export function normalizeOcrText(raw: string): string {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.replace(/[ \t]+/g, ' ').trim())
    .map((l) => l.replace(/^[|_~=+*#•·«»°º©®—-]{1,3}\s*/, ''))
    // drop lines with no letters or digits at all ("---", "___")
    .map((l) => (/[\p{L}\p{N}]/u.test(l) ? l : ''));
  // collapse runs of blank lines
  const out: string[] = [];
  for (const l of lines) {
    if (!l && !out[out.length - 1]) continue;
    out.push(l);
  }
  return out.join('\n').trim();
}

export async function recognizePhotos(
  files: File[],
  onProgress?: (p: OcrProgress) => void
): Promise<string> {
  let current = 0;
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('heb+eng', 1, {
    workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/worker.min.js',
    corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@7.0.0',
    logger: (m: { status?: string; progress?: number }) => {
      if (m.status === 'recognizing text' && typeof m.progress === 'number') {
        onProgress?.({ photo: current + 1, totalPhotos: files.length, pct: Math.round(m.progress * 100) });
      }
    },
  });
  try {
    const parts: string[] = [];
    for (current = 0; current < files.length; current++) {
      onProgress?.({ photo: current + 1, totalPhotos: files.length, pct: 0 });
      const { data } = await worker.recognize(files[current]);
      parts.push(data.text);
    }
    return normalizeOcrText(parts.join('\n\n'));
  } finally {
    await worker.terminate();
  }
}
