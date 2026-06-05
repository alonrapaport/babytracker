import { useState } from 'react';
import { Box, Dialog, List, ListItemButton, ListItemText, Stack } from '@mui/material';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionOutlined';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import AppHeader, { HeaderIcon } from '../components/AppHeader';
import ActivityCard from '../components/ActivityCard';
import TrackerSheet from '../sheets/TrackerSheet';
import SummaryDialog from '../components/SummaryDialog';
import RemindersDialog from '../components/RemindersDialog';
import { groups, type GroupDef } from '../data/activities';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';
import type { Entry, EntryType } from '../lib/types';
import { runningEntry } from '../lib/entryHelpers';

export default function ActivityScreen() {
  const { t } = useI18n();
  const { entries, refreshEntries } = useApp();
  const [sheet, setSheet] = useState<{ type: EntryType; entry: Entry | null } | null>(null);
  const [picker, setPicker] = useState<GroupDef | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [showReminders, setShowReminders] = useState(false);

  function handleAdd(group: GroupDef) {
    // A running timer (sleep / breastfeed / pump) -> reopen that entry to continue or finalize it.
    const run = runningEntry(entries, group.key);
    if (run) {
      setSheet({ type: run.type, entry: run });
      return;
    }
    if (group.activities.length === 1) {
      setSheet({ type: group.activities[0].type, entry: null });
    } else {
      setPicker(group);
    }
  }

  return (
    <Box>
      <AppHeader
        actions={
          <Stack direction="row" spacing={1}>
            <HeaderIcon onClick={() => setShowReminders(true)}>
              <AccessTimeRoundedIcon />
            </HeaderIcon>
            <HeaderIcon onClick={() => setShowSummary(true)}>
              <DescriptionRoundedIcon />
            </HeaderIcon>
          </Stack>
        }
      />

      <Stack spacing={2} sx={{ px: 2, pt: 1 }}>
        {groups.map((g) => (
          <ActivityCard
            key={g.key}
            group={g}
            onAdd={handleAdd}
            onOpenEntry={(e) => setSheet({ type: e.type, entry: e })}
          />
        ))}
      </Stack>

      {/* activity picker for groups with multiple trackers */}
      <Dialog open={!!picker} onClose={() => setPicker(null)} fullWidth>
        <List sx={{ py: 1 }}>
          {picker?.activities.map((a) => (
            <ListItemButton
              key={a.type}
              onClick={() => {
                setSheet({ type: a.type, entry: null });
                setPicker(null);
              }}
            >
              <ListItemText primary={t(a.labelKey)} primaryTypographyProps={{ fontSize: 18 }} />
            </ListItemButton>
          ))}
        </List>
      </Dialog>

      {sheet && (
        <TrackerSheet
          open
          type={sheet.type}
          entry={sheet.entry}
          onClose={() => setSheet(null)}
          onSaved={refreshEntries}
        />
      )}

      <SummaryDialog open={showSummary} onClose={() => setShowSummary(false)} />
      <RemindersDialog open={showReminders} onClose={() => setShowReminders(false)} />
    </Box>
  );
}
