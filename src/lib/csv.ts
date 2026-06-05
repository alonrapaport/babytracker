import type { Entry } from './types';

function esc(v: unknown): string {
  const s = v === null || v === undefined ? '' : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

// Flatten entries into a CSV string for the "Export Data" feature.
export function entriesToCsv(entries: Entry[], babyName: string): string {
  const header = ['baby', 'type', 'start_time', 'end_time', 'data'];
  const rows = entries.map((e) => [
    babyName,
    e.type,
    e.start_time,
    e.end_time ?? '',
    JSON.stringify(e.data ?? {}),
  ]);
  return [header, ...rows].map((r) => r.map(esc).join(',')).join('\n');
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
