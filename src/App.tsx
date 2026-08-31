import { useEffect, useRef } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import TabBar from './components/TabBar';
import Recipes from './screens/Recipes';
import RecipeDetail from './screens/RecipeDetail';
import CookMode from './screens/CookMode';
import Import from './screens/Import';
import Discover from './screens/Discover';
import Cookbooks from './screens/Cookbooks';
import CookbookDetail from './screens/CookbookDetail';
import Planner from './screens/Planner';
import Grocery from './screens/Grocery';
import Account from './screens/Account';
import Auth from './screens/Auth';
import Join from './screens/Join';
import { useApp } from './context/AppContext';
import { useI18n } from './i18n';
import { isDemo } from './lib/demo';
import { isConfigured } from './lib/supabase';
import { consumeShareTarget } from './lib/shareTarget';

export default function App() {
  const { session, loadingAuth } = useApp();
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const sharedRef = useRef(consumeShareTarget());

  // Android share-sheet / Chrome-extension hand-off -> import screen.
  useEffect(() => {
    if (sharedRef.current && session) {
      const payload = sharedRef.current;
      sharedRef.current = null;
      navigate('/import', { state: payload });
    }
  }, [session, navigate]);

  if (!isConfigured && !isDemo) {
    return (
      <Box sx={{ maxWidth: 520, mx: 'auto', px: 3, pt: 10, textAlign: 'center' }}>
        <Typography sx={{ fontSize: 52 }}>🔌</Typography>
        <Typography variant="h5" sx={{ mb: 1 }}>
          {t('cfg_title')}
        </Typography>
        <Typography color="text.secondary">{t('cfg_body')}</Typography>
      </Box>
    );
  }

  if (loadingAuth) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 14 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!session) {
    return <Auth joinHint={location.pathname === '/join'} />;
  }

  const isCookRoute = /\/cook$/.test(location.pathname);

  return (
    <Box sx={{ maxWidth: 520, mx: 'auto', pb: isCookRoute ? 0 : '92px', minHeight: '100vh' }}>
      <Routes>
        <Route path="/" element={<Recipes />} />
        <Route path="/recipes/:id" element={<RecipeDetail />} />
        <Route path="/recipes/:id/cook" element={<CookMode />} />
        <Route path="/import" element={<Import />} />
        <Route path="/discover" element={<Discover />} />
        <Route path="/cookbooks" element={<Cookbooks />} />
        <Route path="/cookbooks/:id" element={<CookbookDetail />} />
        <Route path="/planner" element={<Planner />} />
        <Route path="/grocery" element={<Grocery />} />
        <Route path="/account" element={<Account />} />
        <Route path="/join" element={<Join />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!isCookRoute ? <TabBar /> : null}
    </Box>
  );
}
