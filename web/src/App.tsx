import { Alert, Box, CircularProgress, Dialog, DialogContent, DialogTitle, Fab, Stack, Typography } from '@mui/material'
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

function PageLoading() {
  return (
    <Box sx={{ minHeight: '50vh', display: 'grid', placeItems: 'center' }}>
      <Stack spacing={2} sx={{ alignItems: 'center' }}>
        <CircularProgress size={36} thickness={4} sx={{ color: 'primary.light' }} />
        <Typography color="text.secondary" sx={{ fontWeight: 500 }}>Sayfa yükleniyor…</Typography>
      </Stack>
    </Box>
  )
}

export function App() {
  const path = useAppPath()
  const route = routeFromPath(path)
  const currentUser = useCurrentUser(route !== 'login' && route !== 'register')
  const { meetings, create, startRecording, complete: completeMeetingMutation, upload, retryProcessing, completeAction, updateAction, createAction, updateNotes, mapSpeaker, confirmSpeaker, rejectSpeaker, addParticipant, updateParticipantPermission, removeParticipant, leaveMeeting, sendEmail } = useMeetings()
  useMeetingStatus((meetings.data ?? []).map((meeting) => meeting.id), route !== 'login' && route !== 'register' && currentUser.isSuccess)
  const [open, setOpen] = useState(false)
  if (route === 'login') return <Suspense fallback={<PageLoading />}><LoginPage /></Suspense>
  if (route === 'register') return <Suspense fallback={<PageLoading />}><RegisterPage /></Suspense>
  const items = meetings.data ?? []
  const submit = (input: CreateMeetingInput) => create.mutate(input, { onSuccess: () => setOpen(false) })
  const complete = (meetingId: string, actionItemId: string) => completeAction.mutate({ meetingId, actionItemId })
  let page: React.ReactNode
  if (route === 'dashboard') page = <DashboardPage meetings={items} canCreateMeetings={currentUser.data?.canCreateMeetings ?? false} />
  else if (route === 'meetings') page = <MeetingsPage meetings={items} canCreateMeetings={currentUser.data?.canCreateMeetings ?? false} onCreateMeeting={() => setOpen(true)} />
  else if (route === 'actions') page = <ActionsPage meetings={items} currentUserId={currentUser.data?.userId ?? null} isGlobalManager={currentUser.data?.isGlobalManager ?? false} onComplete={complete} />
  else page = <MeetingDetailPage meeting={items.find((meeting) => meeting.id === meetingIdFromPath(path))} currentUserId={localStorage.getItem('smartmeeting-user-id')} canCompleteMeeting={currentUser.data?.isGlobalManager ?? false} onComplete={complete} onCompleteMeeting={(meetingId) => completeMeetingMutation.mutate(meetingId)} onUpdateAction={(meetingId, actionItemId, input) => updateAction.mutate({ meetingId, actionItemId, ...input })} onCreateAction={(meetingId, input) => createAction.mutate({ meetingId, input })} onSaveNotes={(meetingId, notes) => updateNotes.mutate({ meetingId, notes })} onRecordingStart={async (meetingId) => { await startRecording.mutateAsync(meetingId) }} onAudioReady={(meetingId, audio) => upload.mutate({ meetingId, audio })} recordingUploading={upload.isPending} recordingStarting={startRecording.isPending} onMapSpeaker={(meetingId, participantId, speakerLabel) => mapSpeaker.mutate({ meetingId, participantId, speakerLabel })} onConfirmSpeaker={(meetingId, participantId) => confirmSpeaker.mutate({ meetingId, participantId })} onRejectSpeaker={(meetingId, participantId) => rejectSpeaker.mutate({ meetingId, participantId })} onAddParticipant={(meetingId, input) => addParticipant.mutate({ meetingId, input })} onUpdateParticipantPermission={(meetingId, participantId, canManageMeeting) => updateParticipantPermission.mutate({ meetingId, participantId, canManageMeeting })} onRemoveParticipant={(meetingId, participantId) => removeParticipant.mutate({ meetingId, participantId })} onLeaveMeeting={(meetingId) => leaveMeeting.mutate(meetingId)} onSendEmail={(meetingId) => sendEmail.mutate(meetingId)} onRetryProcessing={(meetingId) => retryProcessing.mutate(meetingId)} savingNotes={updateNotes.isPending} addingParticipant={addParticipant.isPending} confirmingSpeaker={confirmSpeaker.isPending} rejectingSpeaker={rejectSpeaker.isPending} updatingParticipantPermission={updateParticipantPermission.isPending} removingParticipant={removeParticipant.isPending} leavingMeeting={leaveMeeting.isPending} sendingEmail={sendEmail.isPending} updatingAction={updateAction.isPending} creatingAction={createAction.isPending} retryingProcessing={retryProcessing.isPending} completingMeeting={completeMeetingMutation.isPending} emailSent={sendEmail.isSuccess} emailError={sendEmail.isError ? getApiErrorMessage(sendEmail.error, 'E-posta gönderilemedi.') : null} />
  return <Suspense fallback={<PageLoading />}><AppShell route={route} currentUser={currentUser.data}><Stack spacing={3} sx={{ animation: 'sm-fade-in 0.4s ease' }}>{meetings.isError && <Alert severity="error">{getApiErrorMessage(meetings.error, 'Toplantılar yüklenemedi. API adresini ve backend\'i kontrol edin.')}</Alert>}{page}</Stack><Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm" slotProps={{ backdrop: { sx: { backgroundColor: 'rgba(20, 12, 45, 0.32)', backdropFilter: 'blur(6px)' } } }}><DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}><Box sx={{ width: 32, height: 32, borderRadius: 2, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg, #FF6B6B, #FF9A98)', color: 'white', fontSize: 16, fontWeight: 900 }}>＋</Box>Yeni toplantı</DialogTitle><DialogContent sx={{ pt: 2 }}><MeetingForm onSubmit={submit} loading={create.isPending} /></DialogContent></Dialog>{route === 'meetings' && currentUser.data?.canCreateMeetings && <Fab onClick={() => setOpen(true)} color="secondary" variant="extended" sx={{ position: 'fixed', right: 32, bottom: 32, px: 3, py: 1, fontWeight: 700, fontSize: '0.95rem', textTransform: 'none', boxShadow: '0 6px 20px rgba(255, 107, 107, 0.35)', transition: 'all 0.25s ease', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 10px 28px rgba(255, 107, 107, 0.45)' } }}>＋ Yeni Toplantı</Fab>}{route === 'dashboard' && <Box sx={{ display: 'none' }} />}</AppShell></Suspense>
}
