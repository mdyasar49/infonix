import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#06b6d4', // Vibrant Cyan
      light: '#67e8f9',
      dark: '#0e7490',
      contrastText: '#000000',
    },
    secondary: {
      main: '#8b5cf6', // Electric Purple
      light: '#c084fc',
      dark: '#6d28d9',
    },
    error: {
      main: '#ef4444',
    },
    background: {
      default: '#080c14',
      paper: '#0f172a',
    },
    text: {
      primary: '#f8fafc',
      secondary: '#94a3b8',
    },
    divider: 'rgba(255, 255, 255, 0.08)',
  },
  typography: {
    fontFamily: '"Outfit", "Plus Jakarta Sans", "Roboto", sans-serif',
    h5: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h6: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    subtitle1: {
      fontWeight: 500,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '8px 18px',
          transition: 'all 0.25s ease-in-out',
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
          boxShadow: '0 4px 14px 0 rgba(6, 182, 212, 0.35)',
          '&:hover': {
            background: 'linear-gradient(135deg, #0891b2 0%, #2563eb 100%)',
            boxShadow: '0 6px 20px 0 rgba(6, 182, 212, 0.5)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.07)',
          borderRadius: 16,
          transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
          '&:hover': {
            borderColor: 'rgba(6, 182, 212, 0.4)',
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 24px -10px rgba(6, 182, 212, 0.3)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 8,
        },
      },
    },
  },
});

export default theme;
