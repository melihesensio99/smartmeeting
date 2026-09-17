import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    primary: { main: '#3B246B', dark: '#241640', light: '#6D52A5', contrastText: '#FFFFFF' },
    secondary: { main: '#FF6B6B', dark: '#D94C59', light: '#FF9A98', contrastText: '#FFFFFF' },
    info: { main: '#4F8CFF' },
    success: { main: '#2BB673' },
    warning: { main: '#F4B942' },
    background: { default: '#F8F7FC', paper: '#FFFFFF' },
    text: { primary: '#242238', secondary: '#6E6A86' },
  },
  typography: { fontFamily: 'Inter, Arial, sans-serif', h3: { fontWeight: 800, letterSpacing: '-0.03em' }, h4: { fontWeight: 800 }, h5: { fontWeight: 750 }, h6: { fontWeight: 700 } },
  shape: { borderRadius: 18 },
  components: {
    MuiAppBar: { styleOverrides: { root: { background: 'linear-gradient(110deg, #241640 0%, #3B246B 55%, #5A3B8D 100%)' } } },
    MuiCard: { styleOverrides: { root: { boxShadow: '0 12px 32px rgba(59, 36, 107, 0.09)' } } },
    MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: { root: { borderRadius: 12, textTransform: 'none', fontWeight: 700 } } },
    MuiChip: { styleOverrides: { root: { fontWeight: 650 } } },
  },
})
