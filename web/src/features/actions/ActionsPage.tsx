import { Button, Chip, FormControl, InputLabel, MenuItem, Paper, Select, Stack, Typography, Box } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useMemo, useState } from 'react'
import { ActionItemEditor, type ActionInput } from './ActionItemEditor'
import type { ActionItem, Meeting, Participant } from '../../types/meeting'

const actionGrid = { gridTemplateColumns: '150px minmax(260px, 3fr) minmax(180px, 2fr) minmax(180px, 1.5fr) minmax(110px, 1fr) 96px' }

export function ActionsPage({ meetings, currentUserId, isGlobalManager, onComplete, onCreateAction, creatingAction = false, onUpdateAction, updatingAction = false }: { meetings: Meeting[]; currentUserId: string | null; isGlobalManager: boolean; onComplete?: (meetingId: string, actionItemId: string) => void; onCreateAction?: (meetingId: string, input: Required<Pick<ActionInput, 'description'>> & Omit<ActionInput, 'description'>) => void; creatingAction?: boolean; onUpdateAction?: (meetingId: string, actionItemId: string, input: Omit<ActionInput, 'description'>) => void; updatingAction?: boolean }) {
  const [filter, setFilter] = useState<'all' | 'open' | 'done'>('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedMeetingId, setSelectedMeetingId] = useState('')
  const [editingAction, setEditingAction] = useState<ActionItem | null>(null)
  const actions = useMemo(() => meetings.flatMap((meeting) => (meeting.summary?.actionItems ?? []).map((action) => ({ ...action, meeting }))).filter((item) => isGlobalManager || item.assigneeUserIds.includes(currentUserId ?? '') || item.assigneeUserId === currentUserId).filter((item) => filter === 'all' || (filter === 'done' ? item.completed : !item.completed)), [meetings, currentUserId, filter, isGlobalManager])

  const selectedMeeting = meetings.find((meeting) => meeting.id === selectedMeetingId) ?? meetings[0]
  const editorParticipants = useMemo<Participant[]>(() => {
    if (!selectedMeeting) return []
    const organizer: Participant = { id: selectedMeeting.id, userId: selectedMeeting.organizerId, displayName: selectedMeeting.organizerEmail ?? 'Toplantı yöneticisi', email: selectedMeeting.organizerEmail ?? 'organizer@meeting.local', canManageMeeting: true, speakerLabel: null, speakerMappingStatus: 'None', speakerConfidence: null }
    return [organizer, ...selectedMeeting.participants].filter((participant, index, all) => all.findIndex((item) => item.userId === participant.userId) === index)
  }, [selectedMeeting])

  return <Stack spacing={4}>
    <Stack direction={{ xs: 'column', md: 'row' }} sx={{ justifyContent: 'space-between', gap: 2, alignItems: { md: 'flex-end' } }}>
      <BoxTitle isGlobalManager={isGlobalManager} />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        {isGlobalManager && onCreateAction && meetings.length > 0 && <>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel id="global-action-meeting-label">Toplantı</InputLabel>
            <Select labelId="global-action-meeting-label" value={selectedMeeting?.id ?? ''} label="Toplantı" onChange={(event) => setSelectedMeetingId(event.target.value)}>
              {meetings.map((meeting) => <MenuItem key={meeting.id} value={meeting.id}>{meeting.title}</MenuItem>)}
            </Select>
          </FormControl>
          <Button variant="contained" onClick={() => setCreateOpen(true)}>＋ Aksiyon ata</Button>
        </>}
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
    </Stack>
    <Paper sx={{ overflow: 'hidden', borderRadius: 4, boxShadow: (theme) => `0 4px 20px 0 ${alpha(theme.palette.primary.main, 0.05)}` }}>
      <Stack sx={{ display: { xs: 'none', md: 'grid' }, ...actionGrid, background: (theme) => `linear-gradient(90deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`, color: 'white', px: 3, py: 2.5, alignItems: 'center' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Durum</Typography>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Görev / Aksiyon</Typography>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Toplantı</Typography>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Sorumlu</Typography>
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
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}><Chip size="small" label={item.completed ? 'Tamamlandı' : 'Açık'} color={item.completed ? 'success' : 'warning'} variant={item.completed ? 'filled' : 'outlined'} sx={{ minWidth: 108, alignSelf: { xs: 'flex-start', md: 'center' }, fontWeight: 600 }} />{!isGlobalManager && !item.completed && onComplete && <Button size="small" variant="outlined" color="success" onClick={() => onComplete(item.meeting.id, item.id)}>Tamamla</Button>}</Stack>
            <Typography sx={{ minWidth: 0, overflowWrap: 'anywhere', textDecoration: item.completed ? 'line-through' : 'none', fontWeight: 500 }}>
              {item.description}
            </Typography>
            <Typography sx={{ minWidth: 0, overflowWrap: 'anywhere' }} color="text.secondary" variant="body2">{item.meeting.title}</Typography>
            <Stack direction="row" spacing={1} sx={{ minWidth: 0, alignItems: 'center', flexWrap: 'wrap' }}>
              <Typography sx={{ minWidth: 0, overflowWrap: 'anywhere', fontWeight: 600 }} variant="body2">{getAssigneeLabel(item.meeting, item.assigneeUserIds, item.assignee)}</Typography>
              {isGlobalManager && onUpdateAction && <Button size="small" variant="outlined" onClick={() => { setSelectedMeetingId(item.meeting.id); setEditingAction(item) }}>Düzenle</Button>}
            </Stack>
            {isGlobalManager && onUpdateAction ? <Button size="small" variant="text" onClick={() => { setSelectedMeetingId(item.meeting.id); setEditingAction(item) }}>{item.dueAt ? new Date(item.dueAt).toLocaleDateString('tr-TR') : 'Tarih yok'}</Button> : <Typography variant="body2" color="text.secondary">{item.dueAt ? new Date(item.dueAt).toLocaleDateString('tr-TR') : 'Tarih yok'}</Typography>}
            {isGlobalManager && onUpdateAction ? <Button size="small" variant="text" onClick={() => { setSelectedMeetingId(item.meeting.id); setEditingAction(item) }}><PriorityChip priority={item.priority} /></Button> : <PriorityChip priority={item.priority} />}
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
    {isGlobalManager && onCreateAction && <ActionItemEditor key={createOpen ? 'create-action' : 'create-closed'} action={null} participants={editorParticipants} open={createOpen && Boolean(selectedMeeting)} saving={creatingAction} includeDescription onClose={() => setCreateOpen(false)} onSave={(input) => { if (!selectedMeeting || !input.description) return; onCreateAction(selectedMeeting.id, { description: input.description, assigneeUserIds: input.assigneeUserIds, dueAt: input.dueAt, priority: input.priority }); setCreateOpen(false) }} />}
    {isGlobalManager && onUpdateAction && <ActionItemEditor key={editingAction?.id ?? 'edit-closed'} action={editingAction} participants={editorParticipants} open={editingAction !== null && Boolean(selectedMeeting)} saving={updatingAction} onClose={() => setEditingAction(null)} onSave={(input) => { if (!editingAction || !selectedMeeting) return; onUpdateAction(selectedMeeting.id, editingAction.id, { assigneeUserIds: input.assigneeUserIds, dueAt: input.dueAt, priority: input.priority }); setEditingAction(null) }} />}
  </Stack>
}

function getAssigneeLabel(meeting: Meeting, assigneeUserIds: string[], fallback: string | null) {
  if (!assigneeUserIds.length) return 'Atanmamış'
  const people = [{ userId: meeting.organizerId, displayName: meeting.organizerEmail ?? 'Toplantı yöneticisi' }, ...meeting.participants]
  const names = assigneeUserIds.map((userId) => people.find((person) => person.userId === userId)?.displayName).filter((name): name is string => Boolean(name))
  return names.length ? names.join(', ') : fallback ?? 'Atanmamış'
}

function PriorityChip({ priority }: { priority: 'Low' | 'Medium' | 'High' | 'low' | 'medium' | 'high' }) { 
  const normalized = priority.toLowerCase(); 
  const labels: Record<string, string> = { high: 'Yüksek', medium: 'Orta', low: 'Düşük' }; 
  const colors: Record<string, 'error' | 'warning' | 'info'> = { high: 'error', medium: 'warning', low: 'info' }; 
  return <Chip size="small" label={labels[normalized]} color={colors[normalized]} variant="outlined" sx={{ borderRadius: 2, fontWeight: 600, borderWidth: 1.5, alignSelf: { xs: 'flex-start', md: 'center' } }} /> 
}

function BoxTitle({ isGlobalManager }: { isGlobalManager: boolean }) { 
  return <Stack>
    <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 0.5 }}>{isGlobalManager ? 'Tüm Aksiyonlar' : 'Aksiyonlarım'}</Typography>
    <Typography variant="body1" color="text.secondary">{isGlobalManager ? 'Tüm toplantılardaki görevleri yönetin ve yeni aksiyonlar atayın.' : 'Toplantılardan çıkan görevleri tek yerden takip edin.'}</Typography>
  </Stack> 
}
