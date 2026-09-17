import { Checkbox, Chip, Paper, Stack, Typography, Box } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useMemo, useState } from 'react'
import type { Meeting } from '../../types/meeting'

const actionGrid = { gridTemplateColumns: '56px minmax(260px, 3fr) minmax(180px, 2fr) minmax(110px, 1fr) 96px' }

export function ActionsPage({ meetings, currentUserId, isGlobalManager, onComplete }: { meetings: Meeting[]; currentUserId: string | null; isGlobalManager: boolean; onComplete: (meetingId: string, actionItemId: string) => void }) {
  const [filter, setFilter] = useState<'all' | 'open' | 'done'>('all')
  const actions = useMemo(() => meetings.flatMap((meeting) => (meeting.summary?.actionItems ?? []).map((action) => ({ ...action, meeting }))).filter((item) => isGlobalManager || item.assigneeUserId === currentUserId).filter((item) => filter === 'all' || (filter === 'done' ? item.completed : !item.completed)), [meetings, currentUserId, filter, isGlobalManager])

  return <Stack spacing={4}>
    <Stack direction={{ xs: 'column', md: 'row' }} sx={{ justifyContent: 'space-between', gap: 2, alignItems: { md: 'flex-end' } }}>
      <BoxTitle />
      <Stack direction="row" spacing={1.5}>
        <Chip 
          label="Tümü" 
          onClick={() => setFilter('all')} 
          color={filter === 'all' ? 'primary' : 'default'}
          variant={filter === 'all' ? 'filled' : 'outlined'}
          sx={{ borderRadius: 20, px: 2.5, cursor: 'pointer', fontWeight: filter === 'all' ? 600 : 400 }} 
        />
        <Chip 
          label="Açık" 
          onClick={() => setFilter('open')} 
          color={filter === 'open' ? 'warning' : 'default'}
          variant={filter === 'open' ? 'filled' : 'outlined'}
          sx={{ borderRadius: 20, px: 2.5, cursor: 'pointer', fontWeight: filter === 'open' ? 600 : 400 }} 
        />
        <Chip 
          label="Tamamlanan" 
          onClick={() => setFilter('done')} 
          color={filter === 'done' ? 'success' : 'default'}
          variant={filter === 'done' ? 'filled' : 'outlined'}
          sx={{ borderRadius: 20, px: 2.5, cursor: 'pointer', fontWeight: filter === 'done' ? 600 : 400 }} 
        />
      </Stack>
    </Stack>
    <Paper sx={{ overflow: 'hidden', borderRadius: 4, boxShadow: (theme) => `0 4px 20px 0 ${alpha(theme.palette.primary.main, 0.05)}` }}>
      <Stack sx={{ display: { xs: 'none', md: 'grid' }, ...actionGrid, background: (theme) => `linear-gradient(90deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`, color: 'white', px: 3, py: 2.5, alignItems: 'center' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Durum</Typography>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Görev / Aksiyon</Typography>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Toplantı</Typography>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Termin</Typography>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Öncelik</Typography>
      </Stack>
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        {actions.map((item) => (
          <Stack key={`${item.meeting.id}-${item.id}`} direction={{ xs: 'column', md: 'row' }} sx={{ 
            display: { xs: 'flex', md: 'grid' }, 
            ...actionGrid, 
            px: { xs: 2, md: 3 }, 
            py: 2.5, 
            gap: { xs: 1, md: 2 }, 
            borderBottom: 1, 
            borderColor: 'divider', 
            alignItems: { md: 'center' }, 
            minWidth: 0,
            transition: 'background-color 0.2s',
            opacity: item.completed ? 0.75 : 1,
            '&:hover': { bgcolor: (theme) => alpha(theme.palette.primary.main, 0.03) },
            '&:last-child': { borderBottom: 0 }
          }}>
            <Checkbox checked={item.completed} onChange={() => onComplete(item.meeting.id, item.id)} sx={{ alignSelf: { xs: 'flex-start', md: 'center' }, p: { xs: 0, md: 1 } }} color="primary" />
            <Typography sx={{ minWidth: 0, overflowWrap: 'anywhere', textDecoration: item.completed ? 'line-through' : 'none', fontWeight: 500 }}>
              {item.description}
              {item.assignee && <Typography component="span" variant="body2" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>Sorumlu: {item.assignee}</Typography>}
            </Typography>
            <Typography sx={{ minWidth: 0, overflowWrap: 'anywhere' }} color="text.secondary" variant="body2">{item.meeting.title}</Typography>
            <Typography variant="body2" color="text.secondary">{item.dueAt ? new Date(item.dueAt).toLocaleDateString('tr-TR') : 'Tarih yok'}</Typography>
            <PriorityChip priority={item.priority} />
          </Stack>
        ))}
        {actions.length === 0 && (
          <Box sx={{ p: 8, textAlign: 'center' }}>
            <Typography sx={{ fontSize: '3rem', mb: 2, opacity: 0.2 }}>☑</Typography>
            <Typography variant="h6" color="text.secondary" gutterBottom>Görev Bulunamadı</Typography>
            <Typography variant="body2" color="text.secondary">Bu filtreye uygun herhangi bir aksiyon bulunmuyor.</Typography>
          </Box>
        )}
      </Box>
    </Paper>
  </Stack>
}

function PriorityChip({ priority }: { priority: 'Low' | 'Medium' | 'High' | 'low' | 'medium' | 'high' }) { 
  const normalized = priority.toLowerCase(); 
  const labels: Record<string, string> = { high: 'Yüksek', medium: 'Orta', low: 'Düşük' }; 
  const colors: Record<string, 'error' | 'warning' | 'info'> = { high: 'error', medium: 'warning', low: 'info' }; 
  return <Chip size="small" label={labels[normalized]} color={colors[normalized]} variant="outlined" sx={{ borderRadius: 2, fontWeight: 600, borderWidth: 1.5, alignSelf: { xs: 'flex-start', md: 'center' } }} /> 
}

function BoxTitle() { 
  return <Stack>
    <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 0.5 }}>Aksiyonlarım</Typography>
    <Typography variant="body1" color="text.secondary">Toplantılardan çıkan görevleri tek yerden takip edin.</Typography>
  </Stack> 
}
