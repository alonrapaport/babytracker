import { useState } from 'react';
import { Box, Card, Collapse, Fab, Typography } from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import TimerRoundedIcon from '@mui/icons-material/TimerRounded';
import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import type { GroupDef } from '../data/activities';
import { useI18n } from '../i18n';
import { useApp } from '../context/AppContext';
import { useNow } from '../hooks/useNow';
import { entriesForGroup, groupStatus, entrySummary, byStartDesc, runningEntry } from '../lib/entryHelpers';
import type { Entry } from '../lib/types';

export default function ActivityCard({
  group,
  onAdd,
  onOpenEntry,
}: {
  group: GroupDef;
  onAdd: (group: GroupDef) => void;
  onOpenEntry: (entry: Entry) => void;
}) {
  const { t, lang } = useI18n();
  const { entries } = useApp();
  const now = useNow(1000);
  const [expanded, setExpanded] = useState(false);

  const list = entriesForGroup(entries, group.key).slice().sort(byStartDesc);
  const status = groupStatus(entries, group.key, lang, t, now);
  const running = !!runningEntry(entries, group.key);
  const recent = list.slice(0, 3);
  const older = list.length - recent.length;

  return (
    <Card sx={{ position: 'relative' }}>
      {/* colored header band */}
      <Box sx={{ bgcolor: group.color, px: 2, py: 1, display: 'flex', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ color: '#1c2128', fontWeight: 500 }}>
          {t(group.titleKey)}
        </Typography>
      </Box>

      {/* add / timer FAB overlapping the band */}
      <Fab
        size="medium"
        onClick={() => onAdd(group)}
        sx={{
          position: 'absolute',
          insetInlineEnd: 16,
          top: 8,
          bgcolor: running ? '#E8632A' : undefined,
          '&:hover': { bgcolor: running ? '#cf5320' : undefined },
        }}
      >
        {running ? <TimerRoundedIcon /> : <AddRoundedIcon />}
      </Fab>

      {/* body */}
      <Box sx={{ p: 2 }}>
        {status ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                bgcolor: status.active ? '#E8632A' : group.color,
              }}
            />
            <Typography sx={{ fontSize: 18 }}>{status.text}</Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: 'text.secondary' }}>
            <Typography sx={{ fontSize: 17 }}>{t(group.emptyKey)}</Typography>
          </Box>
        )}

        {list.length > 0 && (
          <>
            <Box
              onClick={() => setExpanded((x) => !x)}
              sx={{
                mt: 1.5,
                pt: 1.5,
                borderTop: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
              }}
            >
              <Typography sx={{ fontWeight: 600 }}>{expanded ? t('showLess') : t('showMore')}</Typography>
              {expanded ? <KeyboardArrowUpRoundedIcon /> : <KeyboardArrowDownRoundedIcon />}
            </Box>
            <Collapse in={expanded}>
              {recent.map((e) => (
                <Box
                  key={e.id}
                  onClick={() => onOpenEntry(e)}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 1.5,
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    cursor: 'pointer',
                  }}
                >
                  <Typography>{entrySummary(e, lang, t)}</Typography>
                  <ChevronLeftRoundedIcon sx={{ transform: 'scaleX(var(--chev,1))', opacity: 0.5 }} />
                </Box>
              ))}
              {older > 0 && (
                <Box sx={{ py: 1.5, borderTop: '1px solid', borderColor: 'divider', color: 'text.secondary' }}>
                  <Typography>{t('entriesBefore', { time: '19:00' })}</Typography>
                </Box>
              )}
            </Collapse>
          </>
        )}
      </Box>
    </Card>
  );
}
