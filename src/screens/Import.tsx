import { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Tab, Tabs, TextField, Typography } from '@mui/material';
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';
import AutoFixHighRoundedIcon from '@mui/icons-material/AutoFixHighRounded';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import RecipeEditorSheet from '../sheets/RecipeEditorSheet';
import { importFromHtml, importFromJsonLdPayload, importFromText, importFromUrl, type ImportResult } from '../lib/importClient';
import type { RecipeDraft } from '../lib/types';
import type { SharedPayload } from '../lib/shareTarget';
import { useI18n } from '../i18n';
import { isDemo } from '../lib/demo';

type TabKey = 'url' | 'text' | 'html';

export default function Import() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<TabKey>((searchParams.get('tab') as TabKey) || 'url');
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [html, setHtml] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<RecipeDraft | null>(null);
  const [sharedNote, setSharedNote] = useState(false);

  const handleResult = (result: ImportResult) => {
    if (result.ok) {
      setError(null);
      setDraft(result.draft);
      return;
    }
    if (result.reason === 'unavailable') {
      setError(t('import_url_unavailable_demo'));
      setTab('text');
    } else if (result.reason === 'fetch_failed') {
      setError(t('import_url_failed'));
      setTab('text');
    } else {
      setError(t('import_no_recipe'));
    }
  };

  const runUrl = async (value: string) => {
    if (!value.trim()) return;
    setBusy(true);
    setError(null);
    try {
      handleResult(await importFromUrl(value.trim()));
    } finally {
      setBusy(false);
    }
  };

  // Share-target / extension payload arrives via navigation state from App boot.
  useEffect(() => {
    const payload = location.state as SharedPayload | null;
    if (!payload) return;
    setSharedNote(true);
    if (payload.ld) {
      handleResult(importFromJsonLdPayload(payload.ld, payload.url));
      return;
    }
    if (payload.text && payload.text.length > 60) {
      setTab('text');
      setText(payload.text);
      handleResult(importFromText(payload.text));
      return;
    }
    if (payload.url) {
      setTab('url');
      setUrl(payload.url);
      if (!isDemo) runUrl(payload.url);
      else handleResult({ ok: false, reason: 'unavailable' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box>
      <AppHeader title={t('import_title')} back="/" />
      {sharedNote ? (
        <Alert severity="info" sx={{ mx: 2, mb: 1 }}>
          {t('import_shared_loaded')}
        </Alert>
      ) : null}
      <Tabs value={tab} onChange={(_e, v) => setTab(v)} variant="fullWidth" sx={{ px: 1 }}>
        <Tab value="url" label={t('import_tab_url')} />
        <Tab value="text" label={t('import_tab_text')} />
        <Tab value="html" label={t('import_tab_html')} />
      </Tabs>
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {error ? <Alert severity="warning">{error}</Alert> : null}

        {tab === 'url' ? (
          <>
            <TextField
              fullWidth
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={t('import_url_placeholder')}
              dir="ltr"
              type="url"
            />
            <Button
              variant="contained"
              size="large"
              startIcon={busy ? <CircularProgress size={18} color="inherit" /> : <LinkRoundedIcon />}
              disabled={busy || !url.trim()}
              onClick={() => runUrl(url)}
            >
              {busy ? t('importing') : t('import_url_go')}
            </Button>
            {isDemo ? (
              <Typography variant="caption" color="text.secondary">
                {t('import_url_unavailable_demo')}
              </Typography>
            ) : null}
          </>
        ) : null}

        {tab === 'text' ? (
          <>
            <TextField
              fullWidth
              multiline
              minRows={9}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t('import_text_placeholder')}
              inputProps={{ dir: 'auto' }}
            />
            <Button
              variant="contained"
              size="large"
              startIcon={<AutoFixHighRoundedIcon />}
              disabled={!text.trim()}
              onClick={() => handleResult(importFromText(text))}
            >
              {t('import_text_go')}
            </Button>
          </>
        ) : null}

        {tab === 'html' ? (
          <>
            <Typography variant="caption" color="text.secondary">
              {t('import_html_hint')}
            </Typography>
            <TextField
              fullWidth
              multiline
              minRows={9}
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              placeholder={t('import_html_placeholder')}
              dir="ltr"
            />
            <Button
              variant="contained"
              size="large"
              startIcon={<AutoFixHighRoundedIcon />}
              disabled={!html.trim()}
              onClick={() => handleResult(importFromHtml(html, url.trim() || undefined))}
            >
              {t('import_html_go')}
            </Button>
          </>
        ) : null}
      </Box>

      <RecipeEditorSheet
        open={!!draft}
        onClose={() => setDraft(null)}
        draft={draft}
        onSaved={(r) => navigate(`/recipes/${r.id}`)}
      />
    </Box>
  );
}
