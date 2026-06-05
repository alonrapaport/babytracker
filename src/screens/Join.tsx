import { useEffect, useState } from 'react';
import { Box, Button, CircularProgress, Stack, Typography, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';

// Invite links look like:  #/join?baby=<babyId>
// Joining inserts a baby_members row for the current user (allowed by RLS:
// members_insert with user_id = auth.uid()).
export default function JoinScreen() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { session, refreshBabies, setActiveBaby } = useApp();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
  const babyId = params.get('baby') || '';

  useEffect(() => {
    if (!babyId) setError('Invalid invite link');
  }, [babyId]);

  async function join() {
    if (!session?.user?.id || !babyId) return;
    setBusy(true);
    setError('');
    const { error } = await supabase
      .from('baby_members')
      .insert({ baby_id: babyId, user_id: session.user.id, role: 'caregiver' });
    if (error && !error.message.includes('duplicate')) {
      setError(error.message);
      setBusy(false);
      return;
    }
    await refreshBabies();
    await setActiveBaby(babyId);
    navigate('/', { replace: true });
  }

  return (
    <Box sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', p: 4 }}>
      <Stack spacing={3} alignItems="center" textAlign="center">
        <Typography variant="h4">{t('joinFamily')}</Typography>
        <Typography color="text.secondary">{t('joinPrompt')}</Typography>
        {error && <Alert severity="error">{error}</Alert>}
        <Button variant="contained" size="large" onClick={join} disabled={busy || !babyId}>
          {busy ? <CircularProgress size={22} /> : t('join')}
        </Button>
      </Stack>
    </Box>
  );
}
