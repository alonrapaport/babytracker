import { useState } from 'react';
import { Box, Dialog, IconButton, Tab, Tabs, Typography, Stack } from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import RestaurantRoundedIcon from '@mui/icons-material/RestaurantRounded';
import BabyChangingStationRoundedIcon from '@mui/icons-material/BabyChangingStationRounded';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';
import { entryDurationSec } from '../lib/entryHelpers';
import { fmtDuration, startOfDay } from '../lib/format';

export default function SummaryDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, lang } = useI18n();
  const { entries } = useApp();
  const [tab, setTab] = useState(0);

  const since = tab === 0 ? startOfDay(new Date()) : new Date(Date.now() - 24 * 3600 * 1000);
  const inRange = entries.filter((e) => new Date(e.start_time) >= since);

  const sleeps = inRange.filter((e) => e.type === 'sleep' && e.end_time);
  const sleepSec = sleeps.reduce((s, e) => s + entryDurationSec(e), 0);
  const feeds = inRange.filter((e) => ['breastfeed', 'bottle', 'solids'].includes(e.type));
  const diapers = inRange.filter((e) => e.type === 'diaper');

  const rows = [
    { show: sleeps.length > 0, Icon: DarkModeRoundedIcon, color: '#BFE0EC', title: t('act_sleep'), count: sleeps.length, sub: t('totalSleep', { dur: fmtDuration(sleepSec, lang) }) },
    { show: feeds.length > 0, Icon: RestaurantRoundedIcon, color: '#F5C542', title: t('group_feed'), count: feeds.length, sub: t('count_feed', { n: feeds.length }) },
    { show: diapers.length > 0, Icon: BabyChangingStationRoundedIcon, color: '#EDE6D6', title: t('group_diaper'), count: diapers.length, sub: t('count_diaper', { n: diapers.length }) },
  ].filter((r) => r.show);

  return (
    <Dialog open={open} onClose={onClose} fullScreen PaperProps={{ sx: { maxWidth: 520, mx: 'auto', bgcolor: 'background.default' } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1.5, py: 1.5, pt: 'calc(env(safe-area-inset-top) + 12px)' }}>
        <IconButton onClick={onClose}>
          <CloseRoundedIcon />
        </IconButton>
        <Typography variant="h4">{t('summary')}</Typography>
        <Box sx={{ width: 40 }} />
      </Box>
      <Tabs value={tab} onChange={(_e, v) => setTab(v)} variant="fullWidth" sx={{ px: 2 }}>
        <Tab label={t('today')} />
        <Tab label={t('last24h')} />
      </Tabs>
      <Box sx={{ p: 2 }}>
        {rows.length === 0 ? (
          <Typography color="text.secondary" sx={{ mt: 4, textAlign: 'center' }}>
            {t('noData')}
          </Typography>
        ) : (
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            {rows.map((r) => (
              <Box key={r.title} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ width: 44, height: 44, borderRadius: '50%', bgcolor: r.color, display: 'grid', placeItems: 'center', color: '#1c2128' }}>
                  <r.Icon />
                </Box>
                <Box>
                  <Typography variant="h6">
                    {r.title} <Box component="span" sx={{ bgcolor: '#BFE0EC', color: '#1c2128', px: 1, borderRadius: 1, fontSize: 14 }}>{r.count}</Box>
                  </Typography>
                  <Typography color="text.secondary">{r.sub}</Typography>
                </Box>
              </Box>
            ))}
          </Stack>
        )}
      </Box>
    </Dialog>
  );
}
