import { AppBar, Box, Button, Divider, Drawer, List, ListItemButton, ListItemText, Stack, Toolbar, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { navigate, type AppRoute } from '../app/navigation'
import { logout } from '../lib/api'
import type { CurrentUser } from '../types/auth'

const drawerWidth = 250

export function AppShell({ route, currentUser, children }: { route: AppRoute; currentUser?: CurrentUser; children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const [liveMeetingId, setLiveMeetingId] = useState(() => localStorage.getItem('smartmeeting-live-room'))
  useEffect(() => {
    const updateLiveRoom = () => setLiveMeetingId(localStorage.getItem('smartmeeting-live-room'))
    window.addEventListener('storage', updateLiveRoom)
    window.addEventListener('smartmeeting-live-room-changed', updateLiveRoom)
    return () => {
      window.removeEventListener('storage', updateLiveRoom)
      window.removeEventListener('smartmeeting-live-room-changed', updateLiveRoom)
    }
  }, [])
  const menu = [
    { label: 'Dashboard', path: '/', route: 'dashboard' as const, icon: '▦' },
    ...(liveMeetingId ? [{ label: 'Canlı toplantı', path: `/meetings/${liveMeetingId}`, route: 'meeting-detail' as const, icon: '●' }] : []),
    { label: currentUser?.isGlobalManager ? 'Tüm Toplantılar' : 'Toplantılar', path: '/meetings', route: 'meetings' as const, icon: '▣' },
    { label: currentUser?.isGlobalManager ? 'Tüm Aksiyonlar' : 'Aksiyonlarım', path: '/my-actions', route: 'actions' as const, icon: '☑' },
  ]
  return <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}><Toolbar><Stack direction="row" spacing={1.5} sx={{ flexGrow: 1, minWidth: 0, alignItems: 'center' }}><Box sx={{ width: 36, height: 36, flexShrink: 0, display: 'grid', placeItems: 'center', borderRadius: 2.5, bgcolor: 'secondary.main', color: 'white', fontWeight: 900, letterSpacing: -1 }}>M</Box><Box sx={{ minWidth: 0 }}><Typography variant="h6" noWrap sx={{ fontWeight: 800, lineHeight: 1 }}>Meeting</Typography><Typography variant="caption" noWrap sx={{ display: 'block', opacity: 0.72 }}>Akıllı toplantı çalışma alanı</Typography></Box></Stack>{currentUser?.isGlobalManager && <Typography color="secondary" sx={{ mr: 3, fontWeight: 700, whiteSpace: 'nowrap' }}>Global Manager</Typography>}<Typography noWrap sx={{ mr: 3, whiteSpace: 'nowrap' }}>{currentUser?.displayName ?? localStorage.getItem('smartmeeting-user') ?? 'Hesabım'}</Typography><Button color="inherit" variant="outlined" sx={{ flexShrink: 0 }} onClick={async () => { await logout(); queryClient.removeQueries({ queryKey: ['current-user'] }); localStorage.removeItem('smartmeeting-user'); localStorage.removeItem('smartmeeting-user-id'); navigate('/login') }}>Çıkış Yap</Button></Toolbar></AppBar>
    <Drawer variant="permanent" sx={{ width: drawerWidth, [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box', pt: 8 } }}>
      <List>{menu.map((item) => <ListItemButton key={item.path} selected={route === item.route} onClick={() => navigate(item.path)} sx={{ py: 1.8, borderRight: route === item.route ? '4px solid' : '4px solid transparent', borderColor: 'secondary.main' }}><Typography sx={{ width: 42, fontSize: 24 }}>{item.icon}</Typography><ListItemText primary={<Typography sx={{ fontSize: 18 }}>{item.label}</Typography>} /></ListItemButton>)}</List><Divider />
    </Drawer>
    <Box component="main" sx={{ ml: `${drawerWidth}px`, pt: 11, px: { xs: 2, md: 4 }, pb: 5 }}>{children}</Box>
  </Box>
}
