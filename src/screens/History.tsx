import { useState } from 'react';
import { Box, Typography } from '@mui/material';
import AppHeader from '../components/AppHeader';
import TrackerSheet from '../sheets/TrackerSheet';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';
import { useNow } from '../hooks/useNow';
import { typeColor } from '../data/activities';
import { entrySummary } from '../lib/entryHelpers';
import { addDays, sameDay, startOfDay } from '../lib/format';
import type { Entry } from '../lib/types';

const HOUR_PX = 56;

export default function HistoryScreen() {
  const { t, lang } = useI18n();
  const { entries } = useApp();
  const now = useNow(60000);
  const [day, setDay] = useState<Date>(() => startOfDay(new Date()));
  const [sheet, setSheet] = useState<Entry | null>(null);

  const week = Array.from({ length: 7 }, (_, i) => addDays(startOfDay(now), i - 6));
  const dayEntries = entries.filter((e) => sameDay(new Date(e.start_time), day));

  const fmtDow = (d: Date) => d.toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-US', { weekday: 'short' });

  return (
    <Box>
      <AppHeader />
      {/* week day selector */}
      <Box sx={{ display: 'flex', borderBottom: '1px solid', borderColor: 'divider' }}>
        {week.map((d) => {
          const active = sameDay(d, day);
          return (
            <Box
              key={d.toISOString()}
              onClick={() => setDay(d)}
              sx={{
                flex: 1,
                textAlign: 'center',
                py: 1,
                cursor: 'pointer',
                bgcolor: active ? 'primary.main' : 'transparent',
                color: active ? 'primary.contrastText' : 'text.primary',
              }}
            >
              <Typography sx={{ fontSize: 12, opacity: 0.8 }}>{fmtDow(d)}</Typography>
              <Typography sx={{ fontWeight: 700 }}>{d.getDate()}</Typography>
            </Box>
          );
        })}
      </Box>

      {/* 24h timeline */}
      <Box sx={{ position: 'relative', mt: 1, px: 2 }}>
        <Box sx={{ position: 'relative', height: HOUR_PX * 24 }}>
          {Array.from({ length: 9 }, (_, i) => i * 3).map((h) => (
            <Box key={h} sx={{ position: 'absolute', top: h * HOUR_PX, left: 0, right: 0, borderTop: '1px dashed', borderColor: 'divider' }}>
              <Typography sx={{ position: 'absolute', top: -10, fontSize: 12, color: 'text.secondary' }}>
                {String(h).padStart(2, '0')}
              </Typography>
            </Box>
          ))}
          {/* now line */}
          {sameDay(day, now) && (
            <Box
              sx={{
                position: 'absolute',
                top: (now.getHours() + now.getMinutes() / 60) * HOUR_PX,
                left: 0,
                right: 0,
                borderTop: '2px solid #E8632A',
              }}
            />
          )}
          {/* entries */}
          {dayEntries.map((e) => {
            const d = new Date(e.start_time);
            const top = (d.getHours() + d.getMinutes() / 60) * HOUR_PX;
            const end = e.end_time ? new Date(e.end_time) : null;
            const height = end
              ? Math.max(18, ((end.getTime() - d.getTime()) / 3600000) * HOUR_PX)
              : 26;
            return (
              <Box
                key={e.id}
                onClick={() => setSheet(e)}
                sx={{
                  position: 'absolute',
                  top,
                  insetInlineStart: 36,
                  insetInlineEnd: 8,
                  height,
                  bgcolor: typeColor[e.type],
                  color: '#1c2128',
                  borderRadius: 2,
                  px: 1,
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: 13,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  boxShadow: 1,
                }}
              >
                <Typography noWrap sx={{ fontSize: 13 }}>
                  {entrySummary(e, lang, t)}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>

      {sheet && (
        <TrackerSheet open type={sheet.type} entry={sheet} onClose={() => setSheet(null)} onSaved={() => setSheet(null)} />
      )}
    </Box>
  );
}
