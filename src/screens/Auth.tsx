import { useState } from 'react';
import { Box, Button, Stack, TextField, Typography, Alert, Link } from '@mui/material';
import ChildCareRoundedIcon from '@mui/icons-material/ChildCareRounded';
import { supabase } from '../lib/supabase';
import { useI18n } from '../i18n';
import LanguageToggle from '../components/LanguageToggle';

export default function AuthScreen({ joinHint = false }: { joinHint?: boolean }) {
  const { t } = useI18n();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  async function submit() {
    setBusy(true);
    setError('');
    setInfo('');
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setInfo(t('checkEmail'));
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e) {
      setError((e as Error).message || t('authError'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', p: 3, pt: 6 }}>
      <Box sx={{ alignSelf: 'flex-end' }}>
        <LanguageToggle />
      </Box>
      <Stack spacing={1} alignItems="center" sx={{ mt: 4, mb: 4 }}>
        <Box
          sx={{
            width: 84,
            height: 84,
            borderRadius: '50%',
            bgcolor: '#DCEAF4',
            display: 'grid',
            placeItems: 'center',
            color: '#3E6A86',
          }}
        >
          <ChildCareRoundedIcon sx={{ fontSize: 52 }} />
        </Box>
        <Typography variant="h4">{t('appName')}</Typography>
        <Typography color="text.secondary">{t('welcome')}</Typography>
      </Stack>

      {joinHint && <Alert severity="info" sx={{ mb: 2 }}>{t('joinPrompt')}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {info && <Alert severity="success" sx={{ mb: 2 }}>{info}</Alert>}

      <Stack spacing={2}>
        <TextField
          label={t('email')}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          fullWidth
        />
        <TextField
          label={t('password')}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          fullWidth
        />
        <Button
          variant="contained"
          size="large"
          onClick={submit}
          disabled={busy || !email || !password}
        >
          {mode === 'signup' ? t('signUp') : t('signIn')}
        </Button>
        <Link
          component="button"
          underline="hover"
          color="text.secondary"
          onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}
          sx={{ alignSelf: 'center' }}
        >
          {mode === 'signup' ? t('haveAccount') : t('noAccount')}
        </Link>
      </Stack>
    </Box>
  );
}
