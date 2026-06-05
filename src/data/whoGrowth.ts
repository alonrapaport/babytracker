// WHO Child Growth Standards — approximate P3 / P50 / P97 reference anchors,
// 0–24 months, by sex. Public-domain reference data; values are interpolated
// between anchor months for charting. Units: weight kg, length cm, head cm.

export type Sex = 'boy' | 'girl';
export type Metric = 'weight' | 'height' | 'head';
export type Band = { month: number; p3: number; p50: number; p97: number };

type Table = Record<Sex, Record<Metric, Band[]>>;

export const who: Table = {
  boy: {
    weight: [
      { month: 0, p3: 2.5, p50: 3.3, p97: 4.3 },
      { month: 1, p3: 3.4, p50: 4.5, p97: 5.7 },
      { month: 2, p3: 4.3, p50: 5.6, p97: 7.0 },
      { month: 3, p3: 5.0, p50: 6.4, p97: 7.9 },
      { month: 4, p3: 5.6, p50: 7.0, p97: 8.6 },
      { month: 6, p3: 6.4, p50: 7.9, p97: 9.7 },
      { month: 9, p3: 7.1, p50: 8.9, p97: 10.9 },
      { month: 12, p3: 7.7, p50: 9.6, p97: 11.8 },
      { month: 18, p3: 8.8, p50: 10.9, p97: 13.7 },
      { month: 24, p3: 9.7, p50: 12.2, p97: 15.3 },
    ],
    height: [
      { month: 0, p3: 46.1, p50: 49.9, p97: 53.7 },
      { month: 3, p3: 57.3, p50: 61.4, p97: 65.5 },
      { month: 6, p3: 63.3, p50: 67.6, p97: 71.9 },
      { month: 9, p3: 67.5, p50: 72.0, p97: 76.5 },
      { month: 12, p3: 71.0, p50: 75.7, p97: 80.5 },
      { month: 18, p3: 76.9, p50: 82.3, p97: 87.7 },
      { month: 24, p3: 81.7, p50: 87.8, p97: 93.9 },
    ],
    head: [
      { month: 0, p3: 32.4, p50: 34.5, p97: 36.6 },
      { month: 3, p3: 38.1, p50: 40.5, p97: 42.9 },
      { month: 6, p3: 40.9, p50: 43.3, p97: 45.8 },
      { month: 9, p3: 42.5, p50: 45.0, p97: 47.5 },
      { month: 12, p3: 43.5, p50: 46.1, p97: 48.6 },
      { month: 18, p3: 44.7, p50: 47.4, p97: 50.0 },
      { month: 24, p3: 45.5, p50: 48.3, p97: 51.0 },
    ],
  },
  girl: {
    weight: [
      { month: 0, p3: 2.4, p50: 3.2, p97: 4.2 },
      { month: 1, p3: 3.2, p50: 4.2, p97: 5.5 },
      { month: 2, p3: 3.9, p50: 5.1, p97: 6.6 },
      { month: 3, p3: 4.5, p50: 5.8, p97: 7.5 },
      { month: 4, p3: 5.0, p50: 6.4, p97: 8.2 },
      { month: 6, p3: 5.7, p50: 7.3, p97: 9.3 },
      { month: 9, p3: 6.5, p50: 8.2, p97: 10.5 },
      { month: 12, p3: 7.0, p50: 8.9, p97: 11.5 },
      { month: 18, p3: 8.1, p50: 10.2, p97: 13.2 },
      { month: 24, p3: 9.0, p50: 11.5, p97: 14.8 },
    ],
    height: [
      { month: 0, p3: 45.4, p50: 49.1, p97: 52.9 },
      { month: 3, p3: 55.6, p50: 59.8, p97: 64.0 },
      { month: 6, p3: 61.2, p50: 65.7, p97: 70.3 },
      { month: 9, p3: 65.3, p50: 70.1, p97: 75.0 },
      { month: 12, p3: 68.9, p50: 74.0, p97: 79.2 },
      { month: 18, p3: 74.9, p50: 80.7, p97: 86.5 },
      { month: 24, p3: 80.0, p50: 86.4, p97: 92.9 },
    ],
    head: [
      { month: 0, p3: 31.9, p50: 33.9, p97: 35.9 },
      { month: 3, p3: 37.1, p50: 39.5, p97: 42.0 },
      { month: 6, p3: 39.9, p50: 42.2, p97: 44.6 },
      { month: 9, p3: 41.2, p50: 43.5, p97: 45.9 },
      { month: 12, p3: 42.2, p50: 44.9, p97: 47.3 },
      { month: 18, p3: 43.5, p50: 46.2, p97: 48.6 },
      { month: 24, p3: 44.4, p50: 47.2, p97: 49.5 },
    ],
  },
};

// Linear interpolation of a percentile band at an arbitrary month.
export function interpBand(bands: Band[], month: number): { p3: number; p50: number; p97: number } {
  if (month <= bands[0].month) return bands[0];
  const last = bands[bands.length - 1];
  if (month >= last.month) return last;
  for (let i = 0; i < bands.length - 1; i++) {
    const a = bands[i];
    const b = bands[i + 1];
    if (month >= a.month && month <= b.month) {
      const f = (month - a.month) / (b.month - a.month);
      return {
        p3: a.p3 + (b.p3 - a.p3) * f,
        p50: a.p50 + (b.p50 - a.p50) * f,
        p97: a.p97 + (b.p97 - a.p97) * f,
      };
    }
  }
  return last;
}
