import { useState } from 'react';
import { Alert, Box, Button, TextField, Typography } from '@mui/material';
import { supabase } from '../lib/supabase';
import { useI18n } from '../i18n';

export default function Auth({ joinHint }: { joinHint?: boolean }) {
  const { t } = useI18n();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      if (mode === 'signin') {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) setError(t('auth_error', { msg: err.message }));
      } else {
        const { data, error: err } = await supabase.auth.signUp({ email, password });
        if (err) setError(t('auth_error', { msg: err.message }));
        else if (!data.session) setInfo(t('auth_check_email'));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box sx={{ px: 3, pt: 8, display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 420, mx: 'auto' }}>
      <Typography sx={{ fontSize: 56, textAlign: 'center', lineHeight: 1 }}>🍲</Typography>
      <Typography variant="h4" sx={{ textAlign: 'center' }}>
        {t('auth_title')}
      </Typography>
      <Typography color="text.secondary" sx={{ textAlign: 'center', mb: 1 }}>
        {joinHint ? t('join_hint') : t('auth_subtitle')}
      </Typography>
      {error ? <Alert severity="error">{error}</Alert> : null}
      {info ? <Alert severity="success">{info}</Alert> : null}
      <TextField label={t('auth_email')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" />
      <TextField
        label={t('auth_password')}
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        dir="ltr"
        onKeyDown={(e) => e.key === 'Enter' && submit()}
      />
      <Button variant="contained" size="large" onClick={submit} disabled={busy || !email || !password}>
        {mode === 'signin' ? t('auth_sign_in') : t('auth_sign_up')}
      </Button>
      <Button onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
        {mode === 'signin' ? t('auth_toggle_signup') : t('auth_toggle_signin')}
      </Button>
      <Box sx={{ textAlign: 'center', mt: 2 }}>
        <Typography variant="caption" color="text.secondary">
          {t('auth_demo_hint')}
        </Typography>
        <Button size="small" href="./?demo" sx={{ ms: 1 }}>
          {t('auth_demo_button')}
        </Button>
      </Box>
    </Box>
  );
}
