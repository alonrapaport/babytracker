import { useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, CircularProgress, LinearProgress, Tab, Tabs, TextField, Typography } from '@mui/material';
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';
import AutoFixHighRoundedIcon from '@mui/icons-material/AutoFixHighRounded';
import PhotoCameraRoundedIcon from '@mui/icons-material/PhotoCameraRounded';
import DocumentScannerRoundedIcon from '@mui/icons-material/DocumentScannerRounded';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import RecipeEditorSheet from '../sheets/RecipeEditorSheet';
import { fileToDataUrl } from '../components/PhotoField';
import {
  importFromHtml,
  importFromJsonLdPayload,
  importFromText,
  importFromUrl,
  isSocialPostUrl,
  type ImportResult,
} from '../lib/importClient';
import { recognizePhotos, type OcrProgress } from '../lib/ocr';
import { AUTO_ESTIMATE_MIN_COVERAGE, estimateNutrition } from '../lib/nutrition';
import type { RecipeDraft } from '../lib/types';
import type { SharedPayload } from '../lib/shareTarget';
import { useI18n } from '../i18n';
import { isDemo } from '../lib/demo';

type TabKey = 'url' | 'text' | 'html' | 'photo';

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
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [ocrProgress, setOcrProgress] = useState<OcrProgress | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  // set when a social link was pasted: the caption the user pastes next gets
  // this link attached as the recipe's source ("watch the original")
  const [pendingSourceUrl, setPendingSourceUrl] = useState<string | null>(null);

  const handleResult = (result: ImportResult) => {
    if (result.ok) {
      // ReciMe-style "calories for every recipe": auto-estimate when the
      // source had no nutrition and we understood enough of the ingredients.
      const d = result.draft;
      if (!d.nutrition) {
        const est = estimateNutrition(d.ingredients, d.servings);
        if (est && est.coveragePct >= AUTO_ESTIMATE_MIN_COVERAGE) {
          d.nutrition = { ...est.nutrition, estimated: true };
        }
      }
      setError(null);
      setDraft(d);
      return;
    }
    if (result.reason === 'unavailable') {
      setError(t('import_url_blocked'));
      setTab('text');
    } else if (result.reason === 'fetch_failed') {
      setError(t('import_url_failed'));
      setTab('text');
    } else {
      setError(t('import_no_recipe'));
    }
  };

  const runUrl = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (isSocialPostUrl(trimmed)) {
      // login-walled — the recipe is in the caption; steer to paste and keep
      // the link so the imported recipe still points at the original post
      setPendingSourceUrl(trimmed);
      setError(t('import_url_social'));
      setTab('text');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      handleResult(await importFromUrl(trimmed));
    } finally {
      setBusy(false);
    }
  };

  const runText = (value: string, sourceUrl?: string | null) => {
    const result = importFromText(value);
    const src = sourceUrl ?? pendingSourceUrl;
    if (result.ok && src) {
      result.draft.source_url = src;
      if (!result.draft.source_name) {
        try {
          result.draft.source_name = new URL(src).hostname.replace(/^www\./, '');
        } catch {
          // keep whatever the parser found
        }
      }
    }
    handleResult(result);
  };

  const runOcr = async () => {
    if (!photoFiles.length || busy) return;
    setBusy(true);
    setError(null);
    setOcrProgress({ photo: 1, totalPhotos: photoFiles.length, pct: 0 });
    try {
      const text = await recognizePhotos(photoFiles, setOcrProgress);
      if (!text || text.replace(/\s/g, '').length < 10) {
        setError(t('ocr_failed'));
        return;
      }
      const result = importFromText(text);
      if (result.ok) {
        result.draft.photo_data = await fileToDataUrl(photoFiles[0]);
      }
      setText(text);
      handleResult(result);
    } catch {
      setError(t('ocr_failed'));
    } finally {
      setBusy(false);
      setOcrProgress(null);
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
      if (payload.url) setPendingSourceUrl(payload.url);
      runText(payload.text, payload.url ?? null);
      return;
    }
    if (payload.url) {
      setTab('url');
      setUrl(payload.url);
      runUrl(payload.url);
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
        <Tab value="photo" label={t('import_tab_photo')} />
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
                {t('import_url_demo_note')}
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
              onClick={() => runText(text)}
            >
              {t('import_text_go')}
            </Button>
          </>
        ) : null}

        {tab === 'photo' ? (
          <>
            <Typography variant="caption" color="text.secondary">
              {t('import_photo_hint')}
            </Typography>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => {
                setPhotoFiles(Array.from(e.target.files ?? []));
                e.target.value = '';
              }}
            />
            <Button variant="outlined" startIcon={<PhotoCameraRoundedIcon />} onClick={() => photoInputRef.current?.click()}>
              {t('import_photo_pick')}
              {photoFiles.length ? ` (${photoFiles.length})` : ''}
            </Button>
            {photoFiles.length ? (
              <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto' }}>
                {photoFiles.map((f, i) => (
                  <Box
                    key={i}
                    component="img"
                    src={URL.createObjectURL(f)}
                    alt=""
                    sx={{ height: 84, borderRadius: '10px', border: '1px solid', borderColor: 'divider' }}
                  />
                ))}
              </Box>
            ) : null}
            {ocrProgress ? (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {t('import_photo_progress', { i: ocrProgress.photo, n: ocrProgress.totalPhotos, pct: ocrProgress.pct })}
                </Typography>
                <LinearProgress variant="determinate" value={ocrProgress.pct} sx={{ borderRadius: 2, mt: 0.5 }} />
              </Box>
            ) : null}
            <Button
              variant="contained"
              size="large"
              startIcon={busy ? <CircularProgress size={18} color="inherit" /> : <DocumentScannerRoundedIcon />}
              disabled={busy || !photoFiles.length}
              onClick={runOcr}
            >
              {t('import_photo_go')}
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
