import { Button, Card, CardContent, Chip, Stack, TextField, Typography } from '@mui/material'
import { useMemo, useState } from 'react'
import { navigate } from '../../app/navigation'
import type { Meeting } from '../../types/meeting'

export function MeetingsPage({ meetings, canCreateMeetings }: { meetings: Meeting[]; canCreateMeetings: boolean }) {
  const [search, setSearch] = useState('')
  const filtered = useMemo(() => meetings.filter((meeting) => meeting.title.toLocaleLowerCase('tr-TR').includes(search.toLocaleLowerCase('tr-TR'))), [meetings, search])
  return <Stack spacing={3}><Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}><Typography variant="h3">Toplantılar</Typography>{canCreateMeetings && <Button variant="contained" onClick={() => navigate('/')}>＋ Yeni Toplantı</Button>}</Stack><Card><CardContent><TextField fullWidth placeholder="Toplantı başlığı ara..." value={search} onChange={(event) => setSearch(event.target.value)} /></CardContent></Card><Card><CardContent><Stack spacing={0}>{filtered.map((meeting) => <Stack key={meeting.id} direction={{ xs: 'column', md: 'row' }} sx={{ py: 2, gap: 2, alignItems: { md: 'center' }, borderBottom: 1, borderColor: 'divider' }}><Typography sx={{ flex: 2, fontWeight: 700 }}>{meeting.title}</Typography><Typography sx={{ flex: 1 }}>{new Date(meeting.startsAt).toLocaleDateString('tr-TR')}</Typography><Typography sx={{ flex: 1 }}>{new Date(meeting.startsAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</Typography><Chip label={meeting.summary ? 'Onaylandı' : 'Taslak'} color={meeting.summary ? 'success' : 'default'} /><Button variant="outlined" onClick={() => navigate(`/meetings/${meeting.id}`)}>◉ İncele & Not Al</Button></Stack>)}{!filtered.length && <Typography color="text.secondary">Aramanızla eşleşen toplantı bulunamadı.</Typography>}</Stack></CardContent></Card></Stack>
}
