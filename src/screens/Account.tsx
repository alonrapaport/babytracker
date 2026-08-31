import { useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  Divider,
  Snackbar,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import FileUploadRoundedIcon from '@mui/icons-material/FileUploadRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import AppHeader from '../components/AppHeader';
import LanguageToggle from '../components/LanguageToggle';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';
import { isDemo } from '../lib/demo';
import { isConfigured } from '../lib/supabase';
import * as db from '../lib/db';
import { exportLibrary, importLibrary } from '../lib/exportImport';

export default function Account() {
  const { t } = useI18n();
  const app = useApp();
  const { profile, unitSystem, setUnitSystem, setDisplayName, signOut, refreshRecipes, refreshCookbooks, refreshPlans, refreshGrocery } = app;
  const [name, setName] = useState(profile?.display_name ?? '');
  const [snack, setSnack] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const status = isDemo ? t('supabase_demo') : isConfigured ? t('supabase_ok') : t('supabase_missing');

  const onImportFile = async (file: File) => {
    try {
      const { added } = await importLibrary(file);
      await Promise.all([refreshRecipes(), refreshCookbooks(), refreshPlans()]);
      setSnack(t('import_library_done', { n: added }));
    } catch {
      setSnack('⚠️');
    }
  };

  return (
    <Box sx={{ pb: 3 }}>
      <AppHeader title={t('account_title')} />
      <Box sx={{ px: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Alert severity={isDemo ? 'info' : isConfigured ? 'success' : 'warning'}>{status}</Alert>

        <Card sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label={t('display_name')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => name.trim() && setDisplayName(name.trim())}
            inputProps={{ dir: 'auto' }}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography>{t('language')}</Typography>
            <LanguageToggle />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography>{t('unit_system')}</Typography>
            <ToggleButtonGroup exclusive size="small" value={unitSystem} onChange={(_e, v) => v && setUnitSystem(v)}>
              <ToggleButton value="original">{t('units_original')}</ToggleButton>
              <ToggleButton value="metric">{t('units_metric')}</ToggleButton>
              <ToggleButton value="us">{t('units_us')}</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Card>

        <Card sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Button
            startIcon={<FileDownloadRoundedIcon />}
            onClick={() =>
              exportLibrary({
                recipes: app.libraryRecipes,
                cookbooks: app.cookbooks,
                cookbookRecipes: app.cookbookRecipes,
                plans: app.plans,
              })
            }
          >
            {t('export_library')}
          </Button>
          <Button startIcon={<FileUploadRoundedIcon />} onClick={() => fileRef.current?.click()}>
            {t('import_library')}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImportFile(f);
              e.target.value = '';
            }}
          />
        </Card>

        {isDemo ? (
          <Button
            color="warning"
            startIcon={<RestartAltRoundedIcon />}
            onClick={() => {
              db.resetDemo();
              Promise.all([refreshRecipes(), refreshCookbooks(), refreshPlans(), refreshGrocery()]);
            }}
          >
            {t('demo_reset')}
          </Button>
        ) : (
          <Button color="inherit" startIcon={<LogoutRoundedIcon />} onClick={signOut}>
            {t('sign_out')}
          </Button>
        )}

        <Divider />
        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
          {t('about_line')}
        </Typography>
      </Box>
      <Snackbar open={!!snack} autoHideDuration={2500} onClose={() => setSnack(null)} message={snack} />
    </Box>
  );
}
