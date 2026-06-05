import { useMemo, useState } from 'react';
import { Box, Card, MenuItem, Stack, TextField, Typography } from '@mui/material';
import AppHeader from '../components/AppHeader';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';
import { addDays, startOfDay, sameDay } from '../lib/format';
import { entryDurationSec } from '../lib/entryHelpers';
import { who, interpBand, type Metric } from '../data/whoGrowth';
import type { Entry } from '../lib/types';

function BarChart({ data, color, unit }: { data: { label: string; value: number }[]; color: string; unit?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const W = 320;
  const H = 140;
  const bw = W / data.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img">
      {data.map((d, i) => {
        const h = (d.value / max) * (H - 30);
        return (
          <g key={i}>
            <rect x={i * bw + bw * 0.2} y={H - 20 - h} width={bw * 0.6} height={h} rx={4} fill={color} />
            <text x={i * bw + bw / 2} y={H - 6} textAnchor="middle" fontSize="9" fill="#A8B0C0">
              {d.label}
            </text>
            {d.value > 0 && (
              <text x={i * bw + bw / 2} y={H - 24 - h} textAnchor="middle" fontSize="9" fill="#ECEFF5">
                {Math.round(d.value)}{unit}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function GrowthChart({ entries, metric, sex, unit }: { entries: Entry[]; metric: Metric; sex: 'boy' | 'girl'; unit: string }) {
  const { activeBaby } = useApp();
  const bands = who[sex][metric];
  const W = 320;
  const H = 200;
  const maxMonth = 24;
  const allVals = bands.flatMap((b) => [b.p3, b.p97]);
  const minV = Math.min(...allVals) * 0.9;
  const maxV = Math.max(...allVals) * 1.05;
  const x = (m: number) => (m / maxMonth) * (W - 30) + 24;
  const y = (v: number) => H - 20 - ((v - minV) / (maxV - minV)) * (H - 30);

  const line = (sel: (b: { p3: number; p50: number; p97: number }) => number) =>
    Array.from({ length: 25 }, (_, m) => `${x(m)},${y(sel(interpBand(bands, m)))}`).join(' ');

  // baby's own data points
  const birth = activeBaby?.birthdate ? new Date(activeBaby.birthdate) : null;
  const points = birth
    ? entries
        .filter((e) => e.type === metric || (metric === 'height' && e.type === 'height') || (metric === 'head' && e.type === 'head'))
        .map((e) => {
          const months = (new Date(e.start_time).getTime() - birth.getTime()) / (1000 * 3600 * 24 * 30.44);
          return { m: months, v: Number(e.data.value) };
        })
        .filter((p) => !isNaN(p.v) && p.m >= 0 && p.m <= maxMonth)
    : [];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img">
      <polyline points={line((b) => b.p97)} fill="none" stroke="#3A4154" strokeWidth="1" />
      <polyline points={line((b) => b.p50)} fill="none" stroke="#6b7488" strokeWidth="1.5" strokeDasharray="4 3" />
      <polyline points={line((b) => b.p3)} fill="none" stroke="#3A4154" strokeWidth="1" />
      {points.map((p, i) => (
        <circle key={i} cx={x(p.m)} cy={y(p.v)} r={4} fill="#A8D08D" />
      ))}
      {points.length > 1 && (
        <polyline points={points.map((p) => `${x(p.m)},${y(p.v)}`).join(' ')} fill="none" stroke="#A8D08D" strokeWidth="2" />
      )}
      <text x={4} y={12} fontSize="9" fill="#A8B0C0">{unit}</text>
    </svg>
  );
}

export default function TrendsScreen() {
  const { t, lang } = useI18n();
  const { entries, activeBaby, units } = useApp();
  const [metric, setMetric] = useState<Metric>('weight');
  const now = new Date();

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(startOfDay(now), i - 6)), []);
  const dow = (d: Date) => d.toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-US', { weekday: 'narrow' });

  const sleepData = days.map((d) => ({
    label: dow(d),
    value:
      entries
        .filter((e) => e.type === 'sleep' && e.end_time && sameDay(new Date(e.start_time), d))
        .reduce((s, e) => s + entryDurationSec(e), 0) / 3600,
  }));
  const feedData = days.map((d) => ({
    label: dow(d),
    value: entries.filter((e) => ['breastfeed', 'bottle', 'solids'].includes(e.type) && sameDay(new Date(e.start_time), d)).length,
  }));
  const diaperData = days.map((d) => ({
    label: dow(d),
    value: entries.filter((e) => e.type === 'diaper' && sameDay(new Date(e.start_time), d)).length,
  }));

  const sex: 'boy' | 'girl' = activeBaby?.sex === 'girl' ? 'girl' : 'boy';
  const metricUnit = metric === 'weight' ? units.weight : units.length;

  return (
    <Box>
      <AppHeader />
      <Stack spacing={2} sx={{ p: 2 }}>
        <Card sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>{t('sleepPerDay')}</Typography>
          <BarChart data={sleepData} color="#BFE0EC" unit={lang === 'he' ? 'ש' : 'h'} />
        </Card>
        <Card sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>{t('feedsPerDay')}</Typography>
          <BarChart data={feedData} color="#F5C542" />
        </Card>
        <Card sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>{t('diapersPerDay')}</Typography>
          <BarChart data={diaperData} color="#EDE6D6" />
        </Card>
        <Card sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6">{t('growthChart', { metric: t(metric === 'weight' ? 'act_weight' : metric === 'height' ? 'act_height' : 'act_head') })}</Typography>
            <TextField select size="small" value={metric} onChange={(e) => setMetric(e.target.value as Metric)} variant="standard">
              <MenuItem value="weight">{t('act_weight')}</MenuItem>
              <MenuItem value="height">{t('act_height')}</MenuItem>
              <MenuItem value="head">{t('act_head')}</MenuItem>
            </TextField>
          </Box>
          <GrowthChart entries={entries} metric={metric} sex={sex} unit={metricUnit} />
          <Typography color="text.secondary" sx={{ fontSize: 12, mt: 1 }}>
            WHO P3 · P50 · P97
          </Typography>
        </Card>
      </Stack>
    </Box>
  );
}
