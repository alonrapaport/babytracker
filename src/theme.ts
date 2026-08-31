import { createTheme, type Theme } from '@mui/material/styles';

// Light "food" Material-3 palette: warm paper ground, terracotta primary,
// sage secondary — the visual opposite of babytracker's dark surfaces, but
// the same shape/typography language.
export const surfaces = {
  background: '#FBF7F2',
  surface: '#FFFFFF',
  surfaceContainer: '#FFFDFa',
  surfaceContainerHigh: '#F3EDE4',
  outline: '#2B252014',
};

export const accents = {
  terracotta: '#C4552D',
  terracottaDark: '#A84523',
  sage: '#6B8F71',
  cream: '#F6E7D8',
  yolk: '#E9A13B',
} as const;

export const aisleColors: Record<string, string> = {
  produce: '#DFF0DC',
  dairy_eggs: '#FDF3D8',
  meat_fish: '#FBE3DC',
  bakery: '#F3E5D3',
  dry_goods: '#EFE8DB',
  canned: '#E7EDE2',
  frozen: '#E0EEF4',
  spices: '#F7E6D0',
  condiments: '#F1E9DC',
  snacks: '#F9E8E3',
  beverages: '#E4EDF2',
  household: '#EAE8EF',
  other: '#EFECE7',
};

const serif = '"Fraunces", "Heebo", Georgia, serif';
const sans = '"Heebo", "Roboto", system-ui, sans-serif';

export function buildTheme(direction: 'ltr' | 'rtl'): Theme {
  return createTheme({
    direction,
    palette: {
      mode: 'light',
      primary: { main: accents.terracotta, contrastText: '#FFF6EC' },
      secondary: { main: accents.sage, contrastText: '#F4FAF3' },
      background: { default: surfaces.background, paper: surfaces.surface },
      text: { primary: '#2B2520', secondary: '#7A6F63' },
      divider: surfaces.outline,
      success: { main: '#4F7D57' },
      warning: { main: accents.yolk },
    },
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
            backgroundColor: surfaces.surface,
            borderRadius: 22,
            overflow: 'hidden',
            border: `1px solid ${surfaces.outline}`,
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
            backgroundColor: accents.terracotta,
            color: '#fff',
            boxShadow: '0 6px 18px rgba(196,85,45,.35)',
            '&:hover': { backgroundColor: accents.terracottaDark },
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
          root: { color: '#A79B8D', minWidth: 56, '&.Mui-selected': { color: accents.terracotta } },
          label: { fontSize: 11, '&.Mui-selected': { fontSize: 11 } },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: { backgroundColor: surfaces.background, borderRadius: 26 },
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
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 600 },
        },
      },
    },
  });
}
