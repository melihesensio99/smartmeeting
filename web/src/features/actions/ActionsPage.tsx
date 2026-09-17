import { Checkbox, Chip, Paper, Stack, Typography } from '@mui/material'
import { useMemo, useState } from 'react'
import type { Meeting } from '../../types/meeting'

const actionGrid = { gridTemplateColumns: '56px minmax(260px, 3fr) minmax(180px, 2fr) minmax(110px, 1fr) 96px' }

export function ActionsPage({ meetings, currentUserId, isGlobalManager, onComplete }: { meetings: Meeting[]; currentUserId: string | null; isGlobalManager: boolean; onComplete: (meetingId: string, actionItemId: string) => void }) {
  const [filter, setFilter] = useState<'all' | 'open' | 'done'>('all')
  const actions = useMemo(() => meetings.flatMap((meeting) => (meeting.summary?.actionItems ?? []).map((action) => ({ ...action, meeting }))).filter((item) => isGlobalManager || item.assigneeUserId === currentUserId).filter((item) => filter === 'all' || (filter === 'done' ? item.completed : !item.completed)), [meetings, currentUserId, filter, isGlobalManager])

  return <Stack spacing={3}>
    <Stack direction={{ xs: 'column', md: 'row' }} sx={{ justifyContent: 'space-between', gap: 2 }}><BoxTitle /><Stack direction="row" spacing={1}><Chip label="Tümü" onClick={() => setFilter('all')} color={filter === 'all' ? 'primary' : 'default'} /><Chip label="Açık" onClick={() => setFilter('open')} color={filter === 'open' ? 'warning' : 'default'} /><Chip label="Tamamlanan" onClick={() => setFilter('done')} color={filter === 'done' ? 'success' : 'default'} /></Stack></Stack>
    <Paper sx={{ overflow: 'hidden' }}>
      <Stack sx={{ display: { xs: 'none', md: 'grid' }, ...actionGrid, bgcolor: 'primary.main', color: 'white', px: 3, py: 2, alignItems: 'center' }}><Typography>Durum</Typography><Typography>Görev / Aksiyon</Typography><Typography>Toplantı</Typography><Typography>Termin</Typography><Typography>Öncelik</Typography></Stack>
      {actions.map((item) => <Stack key={`${item.meeting.id}-${item.id}`} direction={{ xs: 'column', md: 'row' }} sx={{ display: { xs: 'flex', md: 'grid' }, ...actionGrid, px: { xs: 2, md: 3 }, py: 2, gap: { xs: 1, md: 2 }, borderBottom: 1, borderColor: 'divider', alignItems: { md: 'center' }, minWidth: 0 }}><Checkbox checked={item.completed} onChange={() => onComplete(item.meeting.id, item.id)} sx={{ alignSelf: { xs: 'flex-start', md: 'center' } }} /><Typography sx={{ minWidth: 0, overflowWrap: 'anywhere', textDecoration: item.completed ? 'line-through' : 'none' }}>{item.description}{item.assignee && <Typography component="span" color="text.secondary"> · Sorumlu: {item.assignee}</Typography>}</Typography><Typography sx={{ minWidth: 0, overflowWrap: 'anywhere' }} color="text.secondary">{item.meeting.title}</Typography><Typography>{item.dueAt ? new Date(item.dueAt).toLocaleDateString('tr-TR') : 'Tarih yok'}</Typography><PriorityChip priority={item.priority} /></Stack>)}
      {actions.length === 0 && <Typography sx={{ p: 4 }} color="text.secondary">Bu filtrede aksiyon bulunmuyor.</Typography>}
    </Paper>
  </Stack>
}

function PriorityChip({ priority }: { priority: 'Low' | 'Medium' | 'High' | 'low' | 'medium' | 'high' }) { const normalized = priority.toLowerCase(); const labels: Record<string, string> = { high: 'Yüksek', medium: 'Orta', low: 'Düşük' }; const colors: Record<string, 'error' | 'warning' | 'info'> = { high: 'error', medium: 'warning', low: 'info' }; return <Chip size="small" label={labels[normalized]} color={colors[normalized]} /> }
function BoxTitle() { return <Stack><Typography variant="h3">Aksiyonlarım</Typography><Typography color="text.secondary">Toplantılardan çıkan görevleri tek yerden takip edin.</Typography></Stack> }
