import { Box, CircularProgress, Typography } from '@mui/material';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useApp } from './context/AppContext';
import { useI18n } from './i18n';
import { isConfigured } from './lib/supabase';
import TabBar from './components/TabBar';
import AuthScreen from './screens/Auth';
import Onboarding from './screens/Onboarding';
import ActivityScreen from './screens/Activity';
import HistoryScreen from './screens/History';
import TrendsScreen from './screens/Trends';
import ShopScreen from './screens/Shop';
import AccountScreen from './screens/Account';
import JoinScreen from './screens/Join';

function Center({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', p: 4, textAlign: 'center' }}>
      {children}
    </Box>
  );
}

export default function App() {
  const { t } = useI18n();
  const { session, loadingAuth, babies } = useApp();
  const location = useLocation();

  if (!isConfigured) {
    return (
      <Center>
        <Box>
          <Typography variant="h5" gutterBottom>
            {t('appName')}
          </Typography>
          <Typography color="text.secondary">{t('configMissing')}</Typography>
        </Box>
      </Center>
    );
  }

  if (loadingAuth) {
    return (
      <Center>
        <CircularProgress />
      </Center>
    );
  }

  const isJoin = location.pathname.startsWith('/join');

  if (!session) {
    // Allow the join landing to render the sign-in prompt with invite context.
    return (
      <Routes>
        <Route path="/join" element={<AuthScreen joinHint />} />
        <Route path="*" element={<AuthScreen />} />
      </Routes>
    );
  }

  if (isJoin) {
    return (
      <Routes>
        <Route path="/join" element={<JoinScreen />} />
      </Routes>
    );
  }

  if (babies.length === 0) {
    return <Onboarding />;
  }

  return (
    <Box sx={{ pb: '76px', minHeight: '100dvh' }}>
      <Routes>
        <Route path="/" element={<ActivityScreen />} />
        <Route path="/history" element={<HistoryScreen />} />
        <Route path="/trends" element={<TrendsScreen />} />
        <Route path="/shop" element={<ShopScreen />} />
        <Route path="/account" element={<AccountScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <TabBar />
    </Box>
  );
}
