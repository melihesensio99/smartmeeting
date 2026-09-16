import { Alert, Box, Button, Card, CardContent, Dialog, DialogContent, DialogTitle, Grid, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import { meetingIdFromPath, routeFromPath, useAppPath } from './app/navigation'
import { AppShell } from './components/AppShell'
import { ActionsPage } from './features/actions/ActionsPage'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { LoginPage } from './features/auth/LoginPage'
import { MeetingsPage } from './features/calendar/MeetingsPage'
import { MeetingForm } from './features/calendar/MeetingForm'
import { useMeetings } from './features/calendar/useMeetings'
import { MeetingDetailPage } from './features/meeting-room/MeetingDetailPage'
import { AudioRecorderCard } from './features/meeting-room/AudioRecorderCard'
import { useMeetingStatus } from './hooks/useMeetingStatus'
import type { CreateMeetingInput } from './types/meeting'

export function App() {
  const path = useAppPath()
  const route = routeFromPath(path)
  const { meetings, create, upload, completeAction, updateNotes, mapSpeaker, addParticipant, sendEmail } = useMeetings()
  useMeetingStatus()
  const [open, setOpen] = useState(false)
  const [selectedMeetingId, setSelectedMeetingId] = useState('')
  if (route === 'login') return <LoginPage />
  const items = meetings.data ?? []
  const submit = (input: CreateMeetingInput) => create.mutate(input, { onSuccess: () => setOpen(false) })
  const complete = (meetingId: string, actionItemId: string) => completeAction.mutate({ meetingId, actionItemId })
  const uploadAudio = (audio: Blob) => { if (selectedMeetingId) upload.mutate({ meetingId: selectedMeetingId, audio }) }
  let page: React.ReactNode
  if (route === 'dashboard') page = <DashboardPage meetings={items} />
  else if (route === 'meetings') page = <MeetingsPage meetings={items} />
  else if (route === 'actions') page = <ActionsPage meetings={items} onComplete={complete} />
  else page = <MeetingDetailPage meeting={items.find((meeting) => meeting.id === meetingIdFromPath(path))} onComplete={complete} onSaveNotes={(meetingId, notes) => updateNotes.mutate({ meetingId, notes })} onMapSpeaker={(meetingId, participantId, speakerLabel) => mapSpeaker.mutate({ meetingId, participantId, speakerLabel })} onAddParticipant={(meetingId, input) => addParticipant.mutate({ meetingId, input })} onSendEmail={(meetingId) => sendEmail.mutate(meetingId)} savingNotes={updateNotes.isPending} addingParticipant={addParticipant.isPending} sendingEmail={sendEmail.isPending} />
  return <AppShell route={route}><Stack spacing={3}>{meetings.isError && <Alert severity="error">Toplantılar yüklenemedi. API adresini ve backend’i kontrol edin.</Alert>}{page}{route === 'meetings' && <Card><CardContent><Typography variant="h6">Sesli toplantı kaydı</Typography><Typography color="text.secondary" sx={{ mb: 2 }}>Planlanmış bir toplantı seçerek kayıt başlatın.</Typography><Grid container spacing={2}><Grid size={{ xs: 12, md: 5 }}><AudioRecorderCard meetings={items} selectedMeetingId={selectedMeetingId} onMeetingChange={setSelectedMeetingId} onAudioReady={uploadAudio} uploading={upload.isPending} /></Grid></Grid></CardContent></Card>}</Stack><Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm"><DialogTitle>Yeni toplantı</DialogTitle><DialogContent sx={{ pt: 2 }}><MeetingForm onSubmit={submit} loading={create.isPending} /></DialogContent></Dialog>{route === 'meetings' && <Button onClick={() => setOpen(true)} sx={{ position: 'fixed', right: 32, bottom: 32 }} variant="contained">＋ Yeni Toplantı</Button>}{route === 'dashboard' && <Box sx={{ display: 'none' }} />}</AppShell>
}
