import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  Dialog,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Snackbar,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import AppHeader from '../components/AppHeader';
import BabyAvatar from '../components/BabyAvatar';
import LanguageToggle from '../components/LanguageToggle';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';
import { createBaby, listEntries } from '../lib/db';
import { entriesToCsv, downloadCsv } from '../lib/csv';
import type { Units } from '../lib/types';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        {title}
      </Typography>
      <Card sx={{ p: 1.5 }}>{children}</Card>
    </Box>
  );
}

export default function AccountScreen() {
  const { t } = useI18n();
  const { babies, activeBaby, setActiveBaby, units, setUnits, signOut } = useApp();
  const { refreshBabies } = useApp();
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [toast, setToast] = useState('');

  const inviteLink = activeBaby
    ? `${window.location.origin}${window.location.pathname}#/join?baby=${activeBaby.id}`
    : '';

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setToast(t('copied'));
    } catch {
      setToast(inviteLink);
    }
  }

  async function addBaby() {
    if (!newName.trim()) return;
    const b = await createBaby({ name: newName.trim(), birthdate: null, sex: 'other' });
    await refreshBabies();
    if (b) await setActiveBaby(b.id);
    setNewName('');
    setAddOpen(false);
  }

  async function exportCsv() {
    if (!activeBaby) return;
    const entries = await listEntries(activeBaby.id);
    downloadCsv(`${activeBaby.name}-nara.csv`, entriesToCsv(entries, activeBaby.name));
  }

  const setUnit = (k: keyof Units, v: string) => setUnits({ ...units, [k]: v } as Units);

  return (
    <Box>
      <AppHeader />
      <Box sx={{ p: 2 }}>
        <Section title={t('babies')}>
          <List disablePadding>
            {babies.map((b) => (
              <ListItemButton key={b.id} onClick={() => setActiveBaby(b.id)} sx={{ borderRadius: 2 }}>
                <BabyAvatar baby={b} size={40} />
                <ListItemText primary={b.name} sx={{ ml: 1.5 }} />
                {activeBaby?.id === b.id && <CheckRoundedIcon color="primary" />}
              </ListItemButton>
            ))}
          </List>
          <Button startIcon={<AddRoundedIcon />} onClick={() => setAddOpen(true)} sx={{ mt: 1 }}>
            {t('addBaby')}
          </Button>
        </Section>

        <Section title={t('family')}>
          <Typography color="text.secondary" sx={{ mb: 1 }}>
            {t('inviteLink')}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField value={inviteLink} size="small" fullWidth InputProps={{ readOnly: true }} />
            <IconButton onClick={copyInvite}>
              <ContentCopyRoundedIcon />
            </IconButton>
          </Stack>
        </Section>

        <Section title={t('language')}>
          <LanguageToggle size="medium" />
        </Section>

        <Section title={t('units')}>
          <Stack spacing={1.5}>
            <UnitRow label={t('act_bottle')} value={units.volume} options={['ml', 'oz']} onChange={(v) => setUnit('volume', v)} />
            <UnitRow label={t('act_weight')} value={units.weight} options={['kg', 'lb']} onChange={(v) => setUnit('weight', v)} />
            <UnitRow label={t('act_height')} value={units.length} options={['cm', 'in']} onChange={(v) => setUnit('length', v)} />
          </Stack>
        </Section>

        <Section title={t('exportData')}>
          <Button startIcon={<DownloadRoundedIcon />} onClick={exportCsv}>
            {t('exportCsv')}
          </Button>
        </Section>

        <Button fullWidth color="inherit" startIcon={<LogoutRoundedIcon />} onClick={signOut} sx={{ mt: 1, color: 'text.secondary' }}>
          {t('signOut')}
        </Button>
      </Box>

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} fullWidth>
        <Box sx={{ p: 3 }}>
          <Typography variant="h5" sx={{ mb: 2 }}>
            {t('addBaby')}
          </Typography>
          <TextField label={t('babyName')} value={newName} onChange={(e) => setNewName(e.target.value)} fullWidth autoFocus />
          <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 2 }}>
            <Button onClick={() => setAddOpen(false)}>{t('cancel')}</Button>
            <Button variant="contained" onClick={addBaby} disabled={!newName.trim()}>
              {t('add')}
            </Button>
          </Stack>
        </Box>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={2500} onClose={() => setToast('')} message={toast} />
    </Box>
  );
}

function UnitRow({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Typography>{label}</Typography>
      <ToggleButtonGroup exclusive size="small" value={value} onChange={(_e, v) => v && onChange(v)}>
        {options.map((o) => (
          <ToggleButton key={o} value={o}>
            {o}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
}
