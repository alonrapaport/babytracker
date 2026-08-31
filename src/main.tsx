import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { CacheProvider } from '@emotion/react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { HashRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { I18nProvider, useI18n } from './i18n';
import { AppProvider } from './context/AppContext';
import { buildTheme } from './theme';
import { cacheFor } from './lib/emotionRtl';

function ThemedApp() {
  const { dir } = useI18n();
  const theme = buildTheme(dir);
  return (
    <CacheProvider value={cacheFor(dir)}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppProvider>
          <HashRouter>
            <App />
          </HashRouter>
        </AppProvider>
      </ThemeProvider>
    </CacheProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <ThemedApp />
    </I18nProvider>
  </StrictMode>
);
