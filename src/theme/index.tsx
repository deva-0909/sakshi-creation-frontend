import { createTheme } from '@mui/material/styles';

// Design tokens below are the Untitled UI palette this app already draws
// individual colors from ad hoc across pages (see claude/ui-ux-professional-polish-plan.md).
// Centralizing them here means every future `theme.palette.*` reference stays
// in sync, instead of each file re-declaring its own hex literals.
const theme = createTheme({
  palette: {
    primary: {
      main: '#7F56D9',
      light: '#F4F3FF',
      dark: '#53389E',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#F9FAFB',
      light: '#F2F4F7',
      contrastText: '#344054',
    },
    success: {
      main: '#12B76A',
      light: '#ECFDF3',
      dark: '#027A48',
      contrastText: '#ffffff',
    },
    error: {
      main: '#F04438',
      light: '#FEF3F2',
      dark: '#B42318',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#F79009',
      light: '#FFFAEB',
      dark: '#B54708',
      contrastText: '#ffffff',
    },
    info: {
      main: '#2E90FA',
      light: '#EFF8FF',
      dark: '#175CD3',
      contrastText: '#ffffff',
    },
    grey: {
      50: '#F9FAFB',
      100: '#F2F4F7',
      200: '#EAECF0',
      300: '#D0D5DD',
      400: '#98A2B3',
      500: '#667085',
      600: '#475467',
      700: '#344054',
      800: '#1D2939',
      900: '#101828',
    },
    background: {
      default: '#F9FAFB',
      paper: '#ffffff',
    },
    text: {
      primary: '#101828',
      secondary: '#667085',
    },
    divider: '#EAECF0',
  },
  shape: {
    borderRadius: 8,
  },

  typography: {
    fontFamily: 'Inter, Arial, sans-serif',
    fontSize: 14,
    h1: { fontSize: '2.125rem', fontWeight: 800, letterSpacing: '-0.02em' },
    h2: { fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.01em' },
    h3: { fontSize: '1.25rem', fontWeight: 700 },
    h4: { fontSize: '1.125rem', fontWeight: 600 },
    h5: { fontSize: '1rem', fontWeight: 600 },
    h6: { fontSize: '0.9375rem', fontWeight: 600 },
    subtitle1: { fontSize: '0.9375rem', fontWeight: 600, color: '#344054' },
    subtitle2: { fontSize: '0.8125rem', fontWeight: 600, color: '#475467' },
    body1: { fontSize: '0.875rem', fontWeight: 400 },
    body2: { fontSize: '0.8125rem', fontWeight: 400, color: '#475467' },
    button: { fontSize: '0.8125rem', fontWeight: 600, textTransform: 'none' },
    caption: { fontSize: '0.75rem', fontWeight: 500, color: '#667085' },
    overline: { fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.06em' },
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#F9FAFB',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: (themeParam) => ({
          borderRadius: (themeParam.borderRadius as number) * 2,
          boxShadow: '0px 4px 20px rgba(16, 24, 40, 0.05)',
        }),
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        outlined: {
          borderColor: '#EAECF0',
        },
      },
    },
    // Centralizes the table look that themetable/index.tsx previously
    // hardcoded per-instance (see claude/ui-ux-professional-polish-plan.md,
    // Phase J). Existing sx overrides on individual tables still win where
    // present -- this only sets the shared default so any *new* table gets
    // it for free and the values live in one place.
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #EAECF0',
          padding: '10px 12px',
          fontSize: '0.8125rem',
        },
        head: {
          backgroundColor: '#F2F4F7',
          color: '#475467',
          fontWeight: 600,
          fontSize: '0.75rem',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: '#FAFAFF',
          },
        },
      },
    },
    // Status/priority chips: previously every page (e.g. all-orders'
    // PRIORITY_COLOR map) redeclared its own bg/text hex pair per status.
    // These map the standard MUI `color` prop to the same semantic tokens,
    // so a page can use <Chip color="success" /> etc. instead of inline hex.
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          fontSize: '0.75rem',
        },
        // Backgrounds corrected (Phase M) to the shade the app's existing
        // status chips already use consistently everywhere -- #ECFDF3 etc.
        // (the theme's `success.light` background-tint token) is meant for
        // subtle hover/background tints, not a legible chip fill; the
        // stronger #D1FADF-family tone below is what ~40-47 chips across
        // the app were already using before any of this work started, so
        // this is the theme catching up to established convention, not the
        // other way around. Text colors were already correct and unchanged.
        colorSuccess: {
          backgroundColor: '#D1FADF',
          color: '#027A48',
        },
        colorError: {
          backgroundColor: '#FEE4E2',
          color: '#B42318',
        },
        colorWarning: {
          backgroundColor: '#FEF0C7',
          color: '#B54708',
        },
        colorInfo: {
          backgroundColor: '#D1E9FF',
          color: '#175CD3',
        },
        colorDefault: {
          backgroundColor: '#F2F4F7',
          color: '#344054',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: '#ffffff',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#D0D5DD',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#98A2B3',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#7F56D9',
            borderWidth: 1,
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: '#475467',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          boxShadow: '0px 8px 32px rgba(16, 24, 40, 0.12)',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: '1.125rem',
          fontWeight: 700,
          color: '#101828',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#101828',
          fontSize: '0.75rem',
          borderRadius: 6,
        },
      },
    },
  },
});

export default theme;
