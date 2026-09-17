import { createTheme, alpha } from '@mui/material/styles'

const primaryMain = '#3B246B'
const primaryDark = '#241640'
const primaryLight = '#6D52A5'
const secondaryMain = '#FF6B6B'

export const theme = createTheme({
  palette: {
    primary: { main: primaryMain, dark: primaryDark, light: primaryLight, contrastText: '#FFFFFF' },
    secondary: { main: secondaryMain, dark: '#D94C59', light: '#FF9A98', contrastText: '#FFFFFF' },
    info: { main: '#4F8CFF' },
    success: { main: '#2BB673' },
    warning: { main: '#F4B942' },
    background: { default: '#F8F7FC', paper: '#FFFFFF' },
    text: { primary: '#242238', secondary: '#6E6A86' },
    divider: alpha('#3B246B', 0.08),
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h3: { fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.2 },
    h4: { fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.25 },
    h5: { fontWeight: 750, letterSpacing: '-0.01em', lineHeight: 1.3 },
    h6: { fontWeight: 700, lineHeight: 1.35 },
    subtitle1: { fontWeight: 600, letterSpacing: '0.01em' },
    subtitle2: { fontWeight: 600, fontSize: '0.8125rem', letterSpacing: '0.02em', textTransform: 'uppercase' as const },
    body1: { lineHeight: 1.6 },
    body2: { lineHeight: 1.55 },
    caption: { lineHeight: 1.5, letterSpacing: '0.01em' },
    overline: { fontWeight: 700, letterSpacing: '0.08em', lineHeight: 2 },
  },
  shape: { borderRadius: 16 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*, *::before, *::after': { boxSizing: 'border-box' },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: `linear-gradient(115deg, ${primaryDark} 0%, ${primaryMain} 50%, #5A3B8D 100%)`,
          boxShadow: `0 4px 24px ${alpha(primaryDark, 0.28)}`,
          backdropFilter: 'blur(12px)',
        },
      },
    },
    MuiCard: {
      defaultProps: { variant: 'outlined' as const },
      styleOverrides: {
        root: {
          border: `1px solid ${alpha(primaryMain, 0.08)}`,
          boxShadow: `0 2px 12px ${alpha(primaryMain, 0.06)}`,
          transition: 'box-shadow 0.25s ease, transform 0.25s ease, border-color 0.25s ease',
          '&:hover': {
            boxShadow: `0 8px 32px ${alpha(primaryMain, 0.12)}`,
          },
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none' as const,
          fontWeight: 700,
          letterSpacing: '0.01em',
          transition: 'all 0.2s ease',
          position: 'relative' as const,
          overflow: 'hidden' as const,
        },
        contained: {
          boxShadow: `0 2px 8px ${alpha(primaryMain, 0.2)}`,
          '&:hover': {
            boxShadow: `0 4px 16px ${alpha(primaryMain, 0.3)}`,
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': {
            borderWidth: '1.5px',
            backgroundColor: alpha(primaryMain, 0.04),
          },
        },
        sizeLarge: {
          padding: '12px 28px',
          fontSize: '1rem',
        },
        sizeMedium: {
          padding: '8px 20px',
        },
        sizeSmall: {
          padding: '5px 14px',
          fontSize: '0.8125rem',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined' as const,
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            transition: 'box-shadow 0.2s ease',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: primaryLight,
            },
            '&.Mui-focused': {
              boxShadow: `0 0 0 3px ${alpha(primaryMain, 0.12)}`,
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderWidth: '2px',
            },
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
          boxShadow: `0 24px 64px ${alpha(primaryDark, 0.2)}, 0 8px 24px ${alpha(primaryDark, 0.12)}`,
        },
        root: {
          '& .MuiBackdrop-root': {
            backdropFilter: 'blur(6px)',
            backgroundColor: alpha(primaryDark, 0.32),
          },
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontWeight: 800,
          fontSize: '1.25rem',
          paddingBottom: 8,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 650,
          borderRadius: 10,
          transition: 'all 0.2s ease',
        },
        sizeSmall: {
          fontSize: '0.75rem',
          height: 26,
        },
        outlined: {
          borderWidth: '1.5px',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: `linear-gradient(180deg, #FAFAFF 0%, #F3F1FA 100%)`,
          borderRight: `1px solid ${alpha(primaryMain, 0.08)}`,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: '0 12px 12px 0',
          marginRight: 12,
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: alpha(primaryMain, 0.06),
          },
          '&.Mui-selected': {
            backgroundColor: alpha(primaryMain, 0.08),
            '&:hover': {
              backgroundColor: alpha(primaryMain, 0.12),
            },
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontWeight: 500,
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          height: 8,
          borderRadius: 4,
          backgroundColor: alpha(primaryMain, 0.08),
        },
        bar: {
          borderRadius: 4,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        outlined: {
          border: `1px solid ${alpha(primaryMain, 0.1)}`,
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: alpha(primaryMain, 0.08),
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          '& .MuiSwitch-switchBase.Mui-checked': {
            color: primaryMain,
          },
          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
            backgroundColor: primaryMain,
          },
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: alpha(primaryMain, 0.4),
          '&.Mui-checked': {
            color: '#2BB673',
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 8,
          fontSize: '0.75rem',
          fontWeight: 600,
          backgroundColor: alpha(primaryDark, 0.92),
          boxShadow: `0 4px 12px ${alpha(primaryDark, 0.2)}`,
        },
      },
    },
    MuiCardActionArea: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          transition: 'background-color 0.2s ease',
        },
      },
    },
  },
})
