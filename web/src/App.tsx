import { Alert, Box, Button, Dialog, DialogContent, DialogTitle, Grid, Stack, Typography } from '@mui/material'
import { lazy, Suspense, useState } from 'react'
import { meetingIdFromPath, routeFromPath, useAppPath } from './app/navigation'
import { AppShell } from './components/AppShell'
import { useMeetings } from './features/calendar/useMeetings'
import { useMeetingStatus } from './hooks/useMeetingStatus'
import type { CreateMeetingInput } from './types/meeting'
import { getApiErrorMessage } from './lib/api'
import { useCurrentUser } from './features/auth/useCurrentUser'

const ActionsPage = lazy(() => import('./features/actions/ActionsPage').then(({ ActionsPage: page }) => ({ default: page })))
const DashboardPage = lazy(() => import('./features/dashboard/DashboardPage').then(({ DashboardPage: page }) => ({ default: page })))
const LoginPage = lazy(() => import('./features/auth/LoginPage').then(({ LoginPage: page }) => ({ default: page })))
const RegisterPage = lazy(() => import('./features/auth/RegisterPage').then(({ RegisterPage: page }) => ({ default: page })))
const MeetingsPage = lazy(() => import('./features/calendar/MeetingsPage').then(({ MeetingsPage: page }) => ({ default: page })))
const MeetingForm = lazy(() => import('./features/calendar/MeetingForm').then(({ MeetingForm: form }) => ({ default: form })))
const MeetingDetailPage = lazy(() => import('./features/meeting-room/MeetingDetailPage').then(({ MeetingDetailPage: page }) => ({ default: page })))
const AudioRecorderCard = lazy(() => import('./features/meeting-room/AudioRecorderCard').then(({ AudioRecorderCard: card }) => ({ default: card })))

function PageLoading() {
  return <Box sx={{ minHeight: '50vh', display: 'grid', placeItems: 'center' }}><Typography color="text.secondary">Sayfa yükleniyor…</Typography></Box>
}

export function App() {
  const path = useAppPath()
  const route = routeFromPath(path)
  const currentUser = useCurrentUser(route !== 'login' && route !== 'register')
  const { meetings, create, startRecording, upload, retryProcessing, completeAction, updateAction, createAction, updateNotes, mapSpeaker, confirmSpeaker, rejectSpeaker, addParticipant, updateParticipantPermission, removeParticipant, leaveMeeting, sendEmail } = useMeetings()
  useMeetingStatus((meetings.data ?? []).map((meeting) => meeting.id), route !== 'login' && route !== 'register' && currentUser.isSuccess)
  const [open, setOpen] = useState(false)
  const [selectedMeetingId, setSelectedMeetingId] = useState('')
  if (route === 'login') return <Suspense fallback={<PageLoading />}><LoginPage /></Suspense>
  if (route === 'register') return <Suspense fallback={<PageLoading />}><RegisterPage /></Suspense>
  const items = meetings.data ?? []
  const submit = (input: CreateMeetingInput) => create.mutate(input, { onSuccess: () => setOpen(false) })
  const complete = (meetingId: string, actionItemId: string) => completeAction.mutate({ meetingId, actionItemId })
  const uploadAudio = (audio: Blob) => { if (selectedMeetingId) upload.mutate({ meetingId: selectedMeetingId, audio }) }
  let page: React.ReactNode
  if (route === 'dashboard') page = <DashboardPage meetings={items} canCreateMeetings={currentUser.data?.canCreateMeetings ?? false} />
  else if (route === 'meetings') page = <Grid container spacing={3} sx={{ alignItems: 'flex-start' }}><Grid size={{ xs: 12, lg: 8 }}><MeetingsPage meetings={items} canCreateMeetings={currentUser.data?.canCreateMeetings ?? false} onCreateMeeting={() => setOpen(true)} /></Grid><Grid size={{ xs: 12, lg: 4 }}><AudioRecorderCard meetings={items} selectedMeetingId={selectedMeetingId} onMeetingChange={setSelectedMeetingId} onRecordingStart={async (meetingId) => { await startRecording.mutateAsync(meetingId) }} onAudioReady={uploadAudio} onSaveNotes={(meetingId, notes) => updateNotes.mutate({ meetingId, notes })} uploading={upload.isPending} starting={startRecording.isPending} savingNotes={updateNotes.isPending} /></Grid></Grid>
  else if (route === 'actions') page = <ActionsPage meetings={items} onComplete={complete} />
  else page = <MeetingDetailPage meeting={items.find((meeting) => meeting.id === meetingIdFromPath(path))} currentUserId={localStorage.getItem('smartmeeting-user-id')} onComplete={complete} onUpdateAction={(meetingId, actionItemId, input) => updateAction.mutate({ meetingId, actionItemId, ...input })} onCreateAction={(meetingId, input) => createAction.mutate({ meetingId, input })} onSaveNotes={(meetingId, notes) => updateNotes.mutate({ meetingId, notes })} onMapSpeaker={(meetingId, participantId, speakerLabel) => mapSpeaker.mutate({ meetingId, participantId, speakerLabel })} onConfirmSpeaker={(meetingId, participantId) => confirmSpeaker.mutate({ meetingId, participantId })} onRejectSpeaker={(meetingId, participantId) => rejectSpeaker.mutate({ meetingId, participantId })} onAddParticipant={(meetingId, input) => addParticipant.mutate({ meetingId, input })} onUpdateParticipantPermission={(meetingId, participantId, canManageMeeting) => updateParticipantPermission.mutate({ meetingId, participantId, canManageMeeting })} onRemoveParticipant={(meetingId, participantId) => removeParticipant.mutate({ meetingId, participantId })} onLeaveMeeting={(meetingId) => leaveMeeting.mutate(meetingId)} onSendEmail={(meetingId) => sendEmail.mutate(meetingId)} onRetryProcessing={(meetingId) => retryProcessing.mutate(meetingId)} savingNotes={updateNotes.isPending} addingParticipant={addParticipant.isPending} confirmingSpeaker={confirmSpeaker.isPending} rejectingSpeaker={rejectSpeaker.isPending} updatingParticipantPermission={updateParticipantPermission.isPending} removingParticipant={removeParticipant.isPending} leavingMeeting={leaveMeeting.isPending} sendingEmail={sendEmail.isPending} updatingAction={updateAction.isPending} creatingAction={createAction.isPending} retryingProcessing={retryProcessing.isPending} emailSent={sendEmail.isSuccess} emailError={sendEmail.isError ? getApiErrorMessage(sendEmail.error, 'E-posta gönderilemedi.') : null} />
  return <Suspense fallback={<PageLoading />}><AppShell route={route} currentUser={currentUser.data}><Stack spacing={3}>{meetings.isError && <Alert severity="error">{getApiErrorMessage(meetings.error, 'Toplantılar yüklenemedi. API adresini ve backend’i kontrol edin.')}</Alert>}{page}</Stack><Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm"><DialogTitle>Yeni toplantı</DialogTitle><DialogContent sx={{ pt: 2 }}><MeetingForm onSubmit={submit} loading={create.isPending} /></DialogContent></Dialog>{route === 'meetings' && currentUser.data?.canCreateMeetings && <Button onClick={() => setOpen(true)} sx={{ position: 'fixed', right: 32, bottom: 32 }} variant="contained">＋ Yeni Toplantı</Button>}{route === 'dashboard' && <Box sx={{ display: 'none' }} />}</AppShell></Suspense>
}
