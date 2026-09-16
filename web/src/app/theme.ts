import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    primary: { main: '#173B57', dark: '#102A3D', light: '#3B6079', contrastText: '#FFFFFF' },
    secondary: { main: '#18A999', dark: '#11796E', light: '#62CBBE', contrastText: '#FFFFFF' },
    warning: { main: '#E76F51' },
    background: { default: '#F3F7F8', paper: '#FFFFFF' },
  },
  typography: { fontFamily: 'Inter, Arial, sans-serif', h3: { fontWeight: 800, letterSpacing: '-0.03em' }, h4: { fontWeight: 800 }, h5: { fontWeight: 750 }, h6: { fontWeight: 700 } },
  shape: { borderRadius: 18 },
  components: { MuiCard: { styleOverrides: { root: { boxShadow: '0 10px 30px rgba(23, 59, 87, 0.08)' } } }, MuiButton: { defaultProps: { disableElevation: true } } },
})
