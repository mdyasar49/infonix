import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#e11d48', // Vibrant Rose Red (Portfolio Primary)
      light: '#f43f5e',
      dark: '#be123c',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#f97316', // Warm Amber Orange (Portfolio Secondary)
      light: '#fb923c',
      dark: '#ea580c',
      contrastText: '#ffffff',
    },
    info: {
      main: '#00e5ff', // Neon Cyan Accent
      light: '#38bdf8',
      dark: '#0284c7',
    },
    warning: {
      main: '#f59e0b',
    },
    error: {
      main: '#e11d48',
    },
    success: {
      main: '#10b981',
    },
    background: {
      default: '#050507', // Portfolio deep obsidian
      paper: '#0d0d10',   // Portfolio dark surface
    },
    text: {
      primary: '#ffffff',
      secondary: '#9ca3af',
      disabled: '#6b7280',
    },
    divider: 'rgba(255, 255, 255, 0.08)',
  },
  typography: {
    fontFamily: '"Outfit", "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif',
    h4: {
      fontWeight: 800,
      letterSpacing: '-0.02em',
    },
    h5: {
      fontWeight: 700,
      letterSpacing: '-0.015em',
    },
    h6: {
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    subtitle1: {
      fontWeight: 600,
    },
    subtitle2: {
      fontWeight: 500,
    },
    body1: {
      fontSize: '0.95rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.85rem',
      lineHeight: 1.4,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      fontFamily: '"Outfit", sans-serif',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          padding: '8px 20px',
          fontWeight: 600,
          transition: 'all 0.2s ease-in-out',
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #f97316 0%, #e11d48 50%, #c026d3 100%)',
          color: '#ffffff',
          boxShadow: '0 4px 16px rgba(225, 29, 72, 0.35)',
          '&:hover': {
            background: 'linear-gradient(135deg, #fb923c 0%, #f43f5e 50%, #d946ef 100%)',
            boxShadow: '0 6px 22px rgba(225, 29, 72, 0.55)',
            transform: 'translateY(-1px)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'rgba(13, 13, 16, 0.9)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 14,
          transition: 'transform 0.25s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.25s ease, border-color 0.25s ease',
          '&:hover': {
            borderColor: 'rgba(249, 115, 22, 0.35)',
            transform: 'translateY(-3px)',
            boxShadow: '0 12px 28px -8px rgba(0, 0, 0, 0.8), 0 0 16px rgba(225, 29, 72, 0.25)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 8,
          fontFamily: '"Outfit", sans-serif',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#0d0d10',
        },
      },
    },
  },
});

export default theme;
