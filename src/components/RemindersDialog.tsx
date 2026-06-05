import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  IconButton,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
  Snackbar,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';
import { Row } from './fields';
import { listReminders, upsertReminder } from '../lib/db';
import { requestNotificationPermission, scheduleNapReminder, cancelNapReminder } from '../lib/reminders';
import type { Reminder } from '../lib/types';

export default function RemindersDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, lang } = useI18n();
  const { activeBaby, entries } = useApp();
  const [kind, setKind] = useState<'wakeWindow' | 'fixed'>('wakeWindow');
  const [enabled, setEnabled] = useState(false);
  const [awakeMinutes, setAwakeMinutes] = useState(90);
  const [existing, setExisting] = useState<Reminder | null>(null);
  const [toast, setToast] = useState(false);

  useEffect(() => {
    if (open && activeBaby) {
      listReminders(activeBaby.id).then((rs) => {
        const r = rs[0] ?? null;
        setExisting(r);
        if (r) {
          setKind(r.kind);
          setEnabled(r.enabled);
          setAwakeMinutes(r.config.awakeMinutes ?? 90);
        }
      });
    }
  }, [open, activeBaby]);

  async function save() {
    if (!activeBaby) return;
    const reminder: Reminder = {
      id: existing?.id ?? '',
      baby_id: activeBaby.id,
      kind,
      config: { awakeMinutes },
      enabled,
    };
    await upsertReminder({
      ...(existing?.id ? { id: existing.id } : {}),
      baby_id: activeBaby.id,
      kind,
      config: { awakeMinutes },
      enabled,
    });
    if (enabled) {
      const ok = await requestNotificationPermission();
      if (ok) await scheduleNapReminder(reminder, entries, lang);
    } else {
      await cancelNapReminder();
    }
    setToast(true);
    onClose();
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} fullScreen PaperProps={{ sx: { maxWidth: 520, mx: 'auto', bgcolor: 'background.default' } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1.5, py: 1.5, pt: 'calc(env(safe-area-inset-top) + 12px)' }}>
          <IconButton onClick={onClose}>
            <CloseRoundedIcon />
          </IconButton>
          <Typography variant="h4">{t('reminders')}</Typography>
          <Button onClick={save} sx={{ fontWeight: 700 }}>
            {t('save')}
          </Button>
        </Box>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            {t('napReminder')}
          </Typography>
          <Row label={t('enableReminders')}>
            <Switch checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          </Row>
          <Tabs value={kind === 'wakeWindow' ? 0 : 1} onChange={(_e, v) => setKind(v === 0 ? 'wakeWindow' : 'fixed')} variant="fullWidth" sx={{ my: 2 }}>
            <Tab label={t('wakeWindows')} />
            <Tab label={t('fixedTimes')} />
          </Tabs>
          {kind === 'wakeWindow' && (
            <Stack spacing={1} sx={{ mt: 1 }}>
              <Typography color="text.secondary">{t('awakeMinutes')}</Typography>
              <TextField
                type="number"
                value={awakeMinutes}
                onChange={(e) => setAwakeMinutes(parseInt(e.target.value) || 0)}
                fullWidth
              />
            </Stack>
          )}
        </Box>
      </Dialog>
      <Snackbar open={toast} autoHideDuration={2500} onClose={() => setToast(false)} message={t('reminderSet')} />
    </>
  );
}
