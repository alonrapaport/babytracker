import { Box, Typography } from '@mui/material';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import AppHeader from '../components/AppHeader';
import { useI18n } from '../i18n';

export default function ShopScreen() {
  const { t } = useI18n();
  return (
    <Box>
      <AppHeader />
      <Box sx={{ display: 'grid', placeItems: 'center', textAlign: 'center', mt: 10, color: 'text.secondary', gap: 2 }}>
        <StorefrontRoundedIcon sx={{ fontSize: 64, opacity: 0.5 }} />
        <Typography variant="h6">{t('shopSoon')}</Typography>
      </Box>
    </Box>
  );
}
