import { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Typography } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';
import { isDemo } from '../lib/demo';
import * as db from '../lib/db';

export default function Join() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token');
  const { refreshCookbooks, refreshRecipes } = useApp();
  const [state, setState] = useState<'joining' | 'done' | 'fail' | 'demo'>('joining');
  const [cookbookId, setCookbookId] = useState<string | null>(null);

  useEffect(() => {
    if (isDemo) {
      setState('demo');
      return;
    }
    if (!token) {
      setState('fail');
      return;
    }
    db.joinCookbook(token).then(async (id) => {
      if (id) {
        setCookbookId(id);
        await Promise.all([refreshCookbooks(), refreshRecipes()]);
        setState('done');
      } else {
        setState('fail');
      }
    });
  }, [token, refreshCookbooks, refreshRecipes]);

  return (
    <Box>
      <AppHeader title={t('join_title')} back="/" />
      <Box sx={{ px: 3, pt: 4, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
        {state === 'joining' ? (
          <>
            <CircularProgress />
            <Typography>{t('join_joining')}</Typography>
          </>
        ) : null}
        {state === 'done' ? (
          <>
            <Typography sx={{ fontSize: 48 }}>🎉</Typography>
            <Typography variant="h6">{t('join_success')}</Typography>
            <Button variant="contained" onClick={() => navigate(cookbookId ? `/cookbooks/${cookbookId}` : '/cookbooks')}>
              {t('join_go')}
            </Button>
          </>
        ) : null}
        {state === 'fail' ? <Alert severity="error">{t('join_fail')}</Alert> : null}
        {state === 'demo' ? <Alert severity="info">{t('join_demo')}</Alert> : null}
      </Box>
    </Box>
  );
}
