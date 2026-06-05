import { useState } from 'react';
import {
  Box,
  Button,
  Stack,
  TextField,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { useI18n } from '../i18n';
import { useApp } from '../context/AppContext';
import { createBaby } from '../lib/db';
import type { Sex } from '../lib/types';
import LanguageToggle from '../components/LanguageToggle';

export default function Onboarding() {
  const { t } = useI18n();
  const { refreshBabies, setActiveBaby } = useApp();
  const [name, setName] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [sex, setSex] = useState<Sex>('other');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!name.trim()) return;
    setBusy(true);
    const baby = await createBaby({
      name: name.trim(),
      birthdate: birthdate || null,
      sex,
    });
    await refreshBabies();
    if (baby) await setActiveBaby(baby.id);
    setBusy(false);
  }

  return (
    <Box sx={{ minHeight: '100dvh', p: 3, pt: 5 }}>
      <Box sx={{ alignSelf: 'flex-end', textAlign: 'end', mb: 2 }}>
        <LanguageToggle />
      </Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        {t('createBaby')}
      </Typography>
      <Stack spacing={2.5}>
        <TextField label={t('babyName')} value={name} onChange={(e) => setName(e.target.value)} fullWidth />
        <TextField
          label={t('birthdate')}
          type="date"
          value={birthdate}
          onChange={(e) => setBirthdate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          fullWidth
        />
        <Box>
          <Typography color="text.secondary" sx={{ mb: 1 }}>
            {t('sex')}
          </Typography>
          <ToggleButtonGroup exclusive value={sex} onChange={(_e, v) => v && setSex(v)} fullWidth>
            <ToggleButton value="girl">{t('girl')}</ToggleButton>
            <ToggleButton value="boy">{t('boy')}</ToggleButton>
            <ToggleButton value="other">{t('other')}</ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <Button variant="contained" size="large" disabled={busy || !name.trim()} onClick={submit}>
          {t('getStarted')}
        </Button>
      </Stack>
    </Box>
  );
}
