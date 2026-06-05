import { createTheme, type Theme } from '@mui/material/styles';

// Nara-inspired activity colors mapped onto a Material 3 dark surface system.
export const activityColors = {
  feed: '#F5C542',
  pump: '#F2A99C',
  diaper: '#EDE6D6',
  sleep: '#BFE0EC',
  routine: '#D9C9EC',
  growth: '#A8D08D',
  health: '#D8D5F0',
} as const;

export const accent = {
  timer: '#E8632A', // active/running timers & stop
  add: '#4A6585', // "+" add buttons
} as const;

// MD3-flavoured dark surface container ramp.
const surfaces = {
  background: '#15181F',
  surface: '#1E2330',
  surfaceContainerLow: '#222736',
  surfaceContainer: '#272D3D',
  surfaceContainerHigh: '#2F3647',
  surfaceVariant: '#3A4154',
  outline: '#48506433',
};

const serif = '"Fraunces", "Heebo", Georgia, serif';
const sans = '"Roboto", "Heebo", system-ui, sans-serif';

export function buildTheme(direction: 'ltr' | 'rtl'): Theme {
  return createTheme({
    direction,
    palette: {
      mode: 'dark',
      primary: { main: '#9FC7DE', contrastText: '#0E1722' },
      secondary: { main: accent.timer, contrastText: '#1A0E08' },
      tertiary: { main: activityColors.routine },
      background: { default: surfaces.background, paper: surfaces.surface },
      text: { primary: '#ECEFF5', secondary: '#A8B0C0' },
      divider: surfaces.outline,
    } as any,
    shape: { borderRadius: 18 },
    typography: {
      fontFamily: sans,
      h1: { fontFamily: serif, fontWeight: 500 },
      h2: { fontFamily: serif, fontWeight: 500 },
      h3: { fontFamily: serif, fontWeight: 500 },
      h4: { fontFamily: serif, fontWeight: 500, letterSpacing: 0 },
      h5: { fontFamily: serif, fontWeight: 500 },
      h6: { fontFamily: serif, fontWeight: 500 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: surfaces.background,
            overscrollBehavior: 'none',
            WebkitTapHighlightColor: 'transparent',
          },
        },
      },
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            backgroundColor: surfaces.surfaceContainer,
            borderRadius: 22,
            overflow: 'hidden',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
          rounded: { borderRadius: 22 },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: { borderRadius: 999, paddingInline: 20, minHeight: 44 },
        },
      },
      MuiFab: {
        styleOverrides: {
          root: {
            backgroundColor: accent.add,
            color: '#fff',
            boxShadow: 'none',
            '&:hover': { backgroundColor: '#3C5570' },
          },
        },
      },
      MuiBottomNavigation: {
        styleOverrides: {
          root: { backgroundColor: surfaces.surface, height: 68 },
        },
      },
      MuiBottomNavigationAction: {
        styleOverrides: {
          root: { color: '#7B8499', '&.Mui-selected': { color: '#9FC7DE' } },
          label: { fontSize: 11, '&.Mui-selected': { fontSize: 11 } },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: { backgroundColor: surfaces.surface, borderRadius: 26 },
        },
      },
      MuiTextField: { defaultProps: { variant: 'filled' } },
      MuiFilledInput: {
        styleOverrides: {
          root: {
            backgroundColor: surfaces.surfaceContainerHigh,
            borderRadius: 14,
            '&:hover': { backgroundColor: surfaces.surfaceContainerHigh },
            '&.Mui-focused': { backgroundColor: surfaces.surfaceContainerHigh },
            '&::before, &::after': { display: 'none' },
          },
        },
      },
      MuiTab: { styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } } },
      MuiToggleButton: {
        styleOverrides: {
          root: { textTransform: 'none', borderRadius: 999, fontWeight: 600 },
        },
      },
    },
  });
}

export const themeSurfaces = surfaces;
