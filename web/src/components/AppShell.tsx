import { AppBar, Box, Button, Divider, Drawer, List, ListItemButton, ListItemText, Toolbar, Typography } from '@mui/material'
import { navigate, type AppRoute } from '../app/navigation'
import { logout } from '../lib/api'

const drawerWidth = 250

export function AppShell({ route, children }: { route: AppRoute; children: React.ReactNode }) {
  const menu = [
    { label: 'Dashboard', path: '/', route: 'dashboard' as const, icon: '▦' },
    { label: 'Toplantılar', path: '/meetings', route: 'meetings' as const, icon: '▣' },
    { label: 'Aksiyonlarım', path: '/actions', route: 'actions' as const, icon: '☑' },
  ]
  return <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}><Toolbar><Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 800 }}>Toplantı Asistanı</Typography><Typography sx={{ mr: 3 }}>{localStorage.getItem('smartmeeting-user') ?? 'Hesabım'}</Typography><Button color="inherit" variant="outlined" onClick={async () => { await logout(); localStorage.removeItem('smartmeeting-user'); navigate('/login') }}>Çıkış Yap</Button></Toolbar></AppBar>
    <Drawer variant="permanent" sx={{ width: drawerWidth, [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box', pt: 8 } }}>
      <List>{menu.map((item) => <ListItemButton key={item.path} selected={route === item.route} onClick={() => navigate(item.path)} sx={{ py: 1.8, borderRight: route === item.route ? '4px solid' : '4px solid transparent', borderColor: 'secondary.main' }}><Typography sx={{ width: 42, fontSize: 24 }}>{item.icon}</Typography><ListItemText primary={<Typography sx={{ fontSize: 18 }}>{item.label}</Typography>} /></ListItemButton>)}</List><Divider />
    </Drawer>
    <Box component="main" sx={{ ml: `${drawerWidth}px`, pt: 11, px: { xs: 2, md: 4 }, pb: 5 }}>{children}</Box>
  </Box>
}
