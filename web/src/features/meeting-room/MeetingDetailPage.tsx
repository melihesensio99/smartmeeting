import { Alert, Box, Button, Card, CardContent, Checkbox, Chip, Divider, FormControlLabel, LinearProgress, MenuItem, Select, Stack, Switch, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { navigate } from '../../app/navigation'
import { getApiErrorMessage, searchUsers } from '../../lib/api'
import type { AddParticipantInput, Meeting, UserResponse } from '../../types/meeting'
import type { ActionItem, ActionPriority } from '../../types/meeting'
import { ActionItemEditor } from '../actions/ActionItemEditor'
import { useMeetingRoomPresence } from './useMeetingRoomPresence'
import { MeetingRoomMediaPanel } from './MeetingRoomMediaPanel'
import { AudioRecorderCard } from './AudioRecorderCard'

type Props = {
  meeting: Meeting | undefined
  currentUserId: string | null
  canCompleteMeeting: boolean
  onComplete: (meetingId: string, actionItemId: string) => void
  onCompleteMeeting: (meetingId: string) => void
  onUpdateAction: (meetingId: string, actionItemId: string, input: { assigneeUserId: string | null; dueAt: string | null; priority: ActionPriority }) => void
  onCreateAction: (meetingId: string, input: { description: string; assigneeUserId: string | null; dueAt: string | null; priority: ActionPriority }) => void
  onSaveNotes: (meetingId: string, notes: string) => void
  onRecordingStart: (meetingId: string) => Promise<void>
  onAudioReady: (meetingId: string, audio: Blob) => void
  recordingUploading: boolean
  recordingStarting: boolean
  completingMeeting: boolean
  onMapSpeaker: (meetingId: string, participantId: string, speakerLabel: string) => void
  onConfirmSpeaker: (meetingId: string, participantId: string) => void
  onRejectSpeaker: (meetingId: string, participantId: string) => void
  onAddParticipant: (meetingId: string, input: AddParticipantInput) => void
  onUpdateParticipantPermission: (meetingId: string, participantId: string, canManageMeeting: boolean) => void
  onRemoveParticipant: (meetingId: string, participantId: string) => void
  onLeaveMeeting: (meetingId: string) => void
  onSendEmail: (meetingId: string) => void
  onRetryProcessing: (meetingId: string) => void
  savingNotes: boolean
  addingParticipant: boolean
  updatingParticipantPermission: boolean
  removingParticipant: boolean
  leavingMeeting: boolean
  confirmingSpeaker: boolean
  rejectingSpeaker: boolean
  sendingEmail: boolean
  updatingAction: boolean
  creatingAction: boolean
  retryingProcessing: boolean
  emailSent: boolean
  emailError: string | null
}

export function MeetingDetailPage({ meeting, currentUserId, canCompleteMeeting, onComplete, onCompleteMeeting, onUpdateAction, onCreateAction, onSaveNotes, onRecordingStart, onAudioReady, recordingUploading, recordingStarting, onMapSpeaker, onConfirmSpeaker, onRejectSpeaker, onAddParticipant, onUpdateParticipantPermission, onRemoveParticipant, onLeaveMeeting, onSendEmail, onRetryProcessing, savingNotes, addingParticipant, updatingParticipantPermission, removingParticipant, leavingMeeting, confirmingSpeaker, rejectingSpeaker, sendingEmail, updatingAction, creatingAction, retryingProcessing, completingMeeting, emailSent, emailError }: Props) {
  const [note, setNote] = useState(meeting?.notes ?? '')
  const [speakerLabels, setSpeakerLabels] = useState<Record<string, string>>({})
  const [participantSearch, setParticipantSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null)
  const [grantMeetingManagement, setGrantMeetingManagement] = useState(false)
  const [editingAction, setEditingAction] = useState<ActionItem | null>(null)
  const [creatingActionForm, setCreatingActionForm] = useState(false)
  const users = useQuery({ queryKey: ['users', participantSearch], queryFn: () => searchUsers(participantSearch), enabled: participantSearch.trim().length >= 2 })
  const roomPresence = useMeetingRoomPresence(meeting?.id)
  const effectiveSelectedUser = selectedUser ?? (users.data?.length === 1 ? users.data[0] : null)
  if (!meeting) return <Alert severity="warning">Toplantı bulunamadı. <Button onClick={() => navigate('/meetings')}>Toplantılara dön</Button></Alert>
  const status = String(meeting.status)
  const statusInfo: Record<string, { label: string; color: 'default' | 'warning' | 'info' | 'success' | 'error'; message: string; progress: number }> = {
    '0': { label: 'Planlandı', color: 'default', message: 'Toplantı kaydı başlatılmaya hazır.', progress: 0 },
    '1': { label: 'Kayıt alınıyor', color: 'warning', message: 'Mikrofon kaydı devam ediyor.', progress: 25 },
    '2': { label: 'İşleniyor', color: 'info', message: 'Ses dosyası, transkript ve AI özeti hazırlanıyor.', progress: 70 },
    '3': { label: 'Hazır', color: 'success', message: 'Transkript ve AI özeti hazır.', progress: 100 },
    '4': { label: 'Başarısız', color: 'error', message: 'Toplantı işlenirken bir hata oluştu.', progress: 100 },
    '5': { label: 'İptal edildi', color: 'default', message: 'Toplantı işlemi iptal edildi.', progress: 0 },
    '6': { label: 'Tamamlandı', color: 'success', message: 'Toplantı yöneticisi tarafından sonlandırıldı. Oda yeniden açılamaz.', progress: 100 },
  }
  const statusKey = ({ Scheduled: '0', Recording: '1', Processing: '2', Ready: '3', Failed: '4', Cancelled: '5', Completed: '6' } as Record<string, string>)[status] ?? status
  const currentStatus = statusInfo[statusKey] ?? { label: status, color: 'default' as const, message: 'Toplantı durumu güncelleniyor.', progress: 0 }
  const isOrganizer = currentUserId !== null && currentUserId === meeting.organizerId
  const isRoomManager = canCompleteMeeting || isOrganizer || meeting.participants.some((participant) => participant.userId === currentUserId && participant.canManageMeeting)
  const isCompleted = statusKey === '6'
  return <Stack spacing={3}>
    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}><Button sx={{ alignSelf: 'flex-start' }} onClick={() => navigate('/meetings')}>← Toplantılara dön</Button>{!isOrganizer && <Button color="error" variant="outlined" disabled={leavingMeeting} onClick={() => { if (window.confirm('Bu toplantıdan ayrılmak istediğinizden emin misiniz?')) onLeaveMeeting(meeting.id) }}>{leavingMeeting ? 'Ayrılıyor…' : 'Toplantıdan ayrıl'}</Button>}</Stack>
    <Stack direction={{ xs: 'column', md: 'row' }} sx={{ justifyContent: 'space-between', gap: 2 }}><Box><Typography variant="h3">{meeting.title}</Typography><Typography color="text.secondary">{new Date(meeting.startsAt).toLocaleString('tr-TR')} · Düzenleyen: {meeting.organizerId}</Typography></Box>{!isCompleted && <Button variant="contained" onClick={() => document.getElementById('meeting-recording')?.scrollIntoView({ behavior: 'smooth' })}>Kayıt paneline git</Button>}</Stack>
    <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} sx={{ alignItems: 'stretch' }}>
      <Stack spacing={2} sx={{ flex: 1, minWidth: 0 }}>
        <Card sx={{ border: '1px solid', borderColor: roomPresence.isInRoom ? 'success.main' : 'divider' }}><CardContent><Stack spacing={2}>{roomPresence.isInRoom && <Alert severity="success">● Şu an bu toplantının canlı odasındasınız.</Alert>}{isCompleted && <Alert severity="info">Bu toplantı tamamlandı. Canlı odaya yeniden katılım kapalı.</Alert>}<Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 2 }}><Box><Typography variant="h5">Canlı toplantı odası</Typography><Typography color="text.secondary">Odaya girdiğinizde katılımcıları gerçek zamanlı görebilir, odadan çıktığınızda toplantı günün listesinde kalır.</Typography></Box><Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}><Button variant={roomPresence.isInRoom ? 'outlined' : 'contained'} color={roomPresence.isInRoom ? 'error' : 'primary'} disabled={roomPresence.isConnecting || isCompleted} onClick={() => void (roomPresence.isInRoom ? roomPresence.leaveRoom() : roomPresence.enterRoom())}>{roomPresence.isConnecting ? 'Bağlanıyor…' : roomPresence.isInRoom ? 'Odadan çık' : 'Odaya gir'}</Button>{isRoomManager && !isCompleted && <Button color="error" variant="contained" disabled={completingMeeting || statusKey === '1' || statusKey === '2'} onClick={() => { if (window.confirm('Toplantıyı bitirmek istediğinizden emin misiniz? Bu işlemden sonra odaya tekrar girilemez.')) onCompleteMeeting(meeting.id) }}>{completingMeeting ? 'Bitiriliyor…' : 'Toplantıyı bitir'}</Button>}</Stack></Stack>{roomPresence.error && <Alert severity="error">{roomPresence.error}</Alert>}{roomPresence.isInRoom ? <><Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}><Chip color="success" label={`${roomPresence.participants.length} kişi şu an odada`} />{roomPresence.participants.map((participant) => <Chip key={participant.userId} variant="outlined" label={`${participant.displayName}${participant.isOrganizer ? ' · Yönetici' : ''}`} />)}</Stack><Typography variant="caption" color="text.secondary">Katılımcıların giriş ve çıkışları bu alanda anlık güncellenir.</Typography></> : <Typography variant="body2" color="text.secondary">{isCompleted ? 'Toplantı tamamlandı.' : 'Henüz odaya girmediniz. Odaya girdiğinizde diğer aktif katılımcılar görünür.'}</Typography>}</Stack></CardContent></Card>
        {roomPresence.isInRoom && <MeetingRoomMediaPanel localStream={roomPresence.localStream} remoteStreams={roomPresence.remoteStreams} participants={roomPresence.participants} isMuted={roomPresence.isMuted} isCameraOff={roomPresence.isCameraOff} onToggleMute={roomPresence.toggleMute} onToggleCamera={roomPresence.toggleCamera} />}
      </Stack>
      <Box id="meeting-recording" sx={{ width: { xs: '100%', lg: 360 }, flexShrink: 0 }}><AudioRecorderCard meetings={[meeting]} selectedMeetingId={meeting.id} onMeetingChange={() => undefined} onRecordingStart={onRecordingStart} onAudioReady={(audio) => onAudioReady(meeting.id, audio)} onSaveNotes={onSaveNotes} uploading={recordingUploading} starting={recordingStarting} savingNotes={savingNotes} fixedMeeting={meeting} canRecord={roomPresence.isInRoom} /></Box>
    </Stack>
    <Card><CardContent><Stack spacing={1.5}><Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 2 }}><Typography variant="h5">Toplantı işlem durumu</Typography><Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}><Chip label={currentStatus.label} color={currentStatus.color} />{statusKey === '4' && <Button size="small" variant="contained" color="warning" disabled={retryingProcessing} onClick={() => onRetryProcessing(meeting.id)}>{retryingProcessing ? 'Tekrar deneniyor…' : 'Yeniden işle'}</Button>}</Stack></Stack><Typography color="text.secondary">{currentStatus.message}</Typography><LinearProgress variant="determinate" value={currentStatus.progress} color={currentStatus.color === 'default' ? 'primary' : currentStatus.color} /></Stack></CardContent></Card>
    <Card><CardContent><Typography variant="h5">Konuşmacılı transkript</Typography><Typography sx={{ mt: 2, whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>{meeting.transcript ?? 'Transkript henüz hazır değil. Ses kaydı tamamlandığında burada görünecek.'}</Typography></CardContent></Card>
    <Card><CardContent><Typography variant="h5">Katılımcılar ve konuşmacı eşleştirme</Typography>{isOrganizer && <><Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mt: 2, mb: 1 }}><TextField fullWidth size="small" label="Kayıtlı kullanıcı ara" placeholder="Ad soyad veya e-posta" value={participantSearch} onChange={(event) => { setParticipantSearch(event.target.value); setSelectedUser(null) }} /><Button variant="contained" disabled={!effectiveSelectedUser || addingParticipant} onClick={() => { if (!effectiveSelectedUser) return; const input: AddParticipantInput = { ...effectiveSelectedUser, canManageMeeting: grantMeetingManagement }; onAddParticipant(meeting.id, input); setParticipantSearch(''); setSelectedUser(null); setGrantMeetingManagement(false) }}>{addingParticipant ? 'Ekleniyor…' : 'Katılımcı ekle'}</Button></Stack><FormControlLabel control={<Checkbox checked={grantMeetingManagement} onChange={(event) => setGrantMeetingManagement(event.target.checked)} />} label="Bu katılımcıya toplantı içi yönetim yetkisi ver" />{users.isFetching && <Typography color="text.secondary">Kullanıcılar aranıyor…</Typography>}{users.isError && <Alert severity="error">{getApiErrorMessage(users.error, 'Kullanıcılar getirilemedi.')}</Alert>}{users.data && users.data.length > 0 && <Stack spacing={1} sx={{ mb: 2 }}>{users.data.map((user) => <Button key={user.userId} variant={effectiveSelectedUser?.userId === user.userId ? 'contained' : 'outlined'} onClick={() => setSelectedUser(user)} sx={{ justifyContent: 'flex-start', textAlign: 'left' }}>{effectiveSelectedUser?.userId === user.userId ? '✓ Seçildi · ' : ''}{user.displayName} · {user.email}</Button>)}</Stack>}</>}<Typography color="text.secondary" sx={{ mt: 1, mb: 2 }}>{isOrganizer ? 'Yalnızca sistemde kayıtlı kullanıcılar eklenebilir. Yetkiyi sonradan değiştirebilir veya katılımcıyı çıkarabilirsiniz.' : 'Toplantı sahibi katılımcı ve toplantı içi yetkilerini yönetir. Yetkili katılımcılar kayıt, not, aksiyon ve konuşmacı işlemlerini yönetebilir.'}</Typography><Stack spacing={2}>{meeting.participants.length ? meeting.participants.map((participant) => <Stack key={participant.id} direction={{ xs: 'column', md: 'row' }} sx={{ gap: 2, alignItems: { md: 'center' } }}><Typography sx={{ minWidth: 180, fontWeight: 700 }}>{participant.displayName}{participant.canManageMeeting && <Chip size="small" label="Toplantı yöneticisi" sx={{ ml: 1 }} />}</Typography><Select size="small" displayEmpty value={speakerLabels[participant.id] ?? participant.speakerLabel ?? ''} onChange={(event) => setSpeakerLabels((current) => ({ ...current, [participant.id]: event.target.value }))} sx={{ minWidth: 180 }}><MenuItem value=""><em>Speaker etiketi seçin</em></MenuItem>{Array.from({ length: 8 }, (_, index) => <MenuItem key={index} value={`Speaker ${index + 1}`}>Speaker {index + 1}</MenuItem>)}</Select><Button variant="outlined" disabled={!speakerLabels[participant.id]?.trim()} onClick={() => onMapSpeaker(meeting.id, participant.id, speakerLabels[participant.id])}>Öneriyi kaydet</Button>{participant.speakerMappingStatus === 'PendingConfirmation' && <><Chip size="small" color="warning" label={`Onay bekliyor${participant.speakerConfidence !== null ? ` · %${Math.round(participant.speakerConfidence * 100)}` : ''}`} /><Button size="small" variant="contained" disabled={confirmingSpeaker} onClick={() => onConfirmSpeaker(meeting.id, participant.id)}>Onayla</Button><Button size="small" color="error" disabled={rejectingSpeaker} onClick={() => onRejectSpeaker(meeting.id, participant.id)}>Reddet</Button></>}{participant.speakerMappingStatus === 'Confirmed' && <Chip size="small" color="success" label="Eşleştirme onaylandı" />}{isOrganizer && <><FormControlLabel control={<Switch size="small" checked={participant.canManageMeeting} disabled={updatingParticipantPermission} onChange={(event) => onUpdateParticipantPermission(meeting.id, participant.id, event.target.checked)} />} label="Yönetim" /><Button color="error" size="small" disabled={removingParticipant} onClick={() => onRemoveParticipant(meeting.id, participant.id)}>Çıkar</Button></>}</Stack>) : <Alert severity="info">Bu toplantıya henüz katılımcı eklenmemiş.</Alert>}</Stack></CardContent></Card>
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}><Card sx={{ flex: 1 }}><CardContent><Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}><Typography variant="h5">AI özeti</Typography><Button size="small" variant="outlined" disabled={!meeting.summary || sendingEmail} onClick={() => onSendEmail(meeting.id)}>{sendingEmail ? 'Gönderiliyor…' : 'Katılımcılara e-posta gönder'}</Button></Stack>{meeting.summary ? <><Typography sx={{ mt: 2 }}>{meeting.summary.overview}</Typography><Divider sx={{ my: 2 }} /><Typography sx={{ fontWeight: 700 }}>Ana kararlar</Typography>{meeting.summary.decisions.map((decision) => <Typography key={decision} sx={{ mt: 1 }}>• {decision}</Typography>)}</> : <Alert sx={{ mt: 2 }} severity="info">Özet hazırlanıyor.</Alert>}</CardContent></Card><Card sx={{ flex: 1 }}><CardContent><Typography variant="h5">Aksiyonlar</Typography>{meeting.summary?.actionItems.map((action) => <Stack key={action.id} direction={{ xs: 'column', sm: 'row' }} sx={{ alignItems: { sm: 'center' }, gap: 1, mt: 1 }}><input type="checkbox" checked={action.completed} onChange={() => onComplete(meeting.id, action.id)} /><Typography sx={{ flex: 1, textDecoration: action.completed ? 'line-through' : 'none' }}>{action.description} · {action.assignee ?? 'Atanmamış'} · {action.dueAt ? new Date(action.dueAt).toLocaleDateString('tr-TR') : 'Termin yok'}</Typography><Chip size="small" label={priorityLabel(action.priority)} color={priorityColor(action.priority)} /><Button size="small" onClick={() => setEditingAction(action)}>Düzenle</Button></Stack>)}</CardContent></Card></Stack>
    <Card><CardContent><Typography variant="h5">Toplantı notlarım</Typography><TextField fullWidth multiline minRows={4} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Toplantı sırasında veya sonrasında özel notlarınızı yazın..." sx={{ mt: 2 }} /><Button sx={{ mt: 2 }} variant="outlined" disabled={!note.trim() || savingNotes} onClick={() => onSaveNotes(meeting.id, note)}>{savingNotes ? 'Kaydediliyor…' : 'Notu kaydet'}</Button></CardContent></Card>
    {emailSent && <Alert severity="success">Toplantı özeti katılımcılara e-posta ile gönderildi.</Alert>}
    {emailError && <Alert severity="error">{emailError}</Alert>}
    <Card><CardContent><Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 2 }}><Typography variant="h5">Manuel aksiyon atama</Typography><Button variant="contained" disabled={!meeting.summary} onClick={() => setCreatingActionForm(true)}>Elle aksiyon ata</Button></Stack>{!meeting.summary && <Typography color="text.secondary" sx={{ mt: 1 }}>Manuel aksiyon atamak için AI özetinin hazır olması gerekir.</Typography>}</CardContent></Card>
    <ActionItemEditor key={creatingActionForm ? 'new' : editingAction?.id ?? 'closed'} action={creatingActionForm ? null : editingAction} open={creatingActionForm || editingAction !== null} saving={creatingActionForm ? creatingAction : updatingAction} includeDescription={creatingActionForm} onClose={() => { setCreatingActionForm(false); setEditingAction(null) }} onSave={(input) => { if (creatingActionForm) { if (!input.description) return; onCreateAction(meeting.id, { description: input.description, assigneeUserId: input.assigneeUserId, dueAt: input.dueAt, priority: input.priority }); setCreatingActionForm(false); return } if (!editingAction) return; onUpdateAction(meeting.id, editingAction.id, { assigneeUserId: input.assigneeUserId, dueAt: input.dueAt, priority: input.priority }); setEditingAction(null) }} />
  </Stack>
}

function priorityLabel(priority: ActionPriority) { const normalized = priority.toLowerCase(); return normalized === 'high' ? 'Yüksek' : normalized === 'low' ? 'Düşük' : 'Orta' }
function priorityColor(priority: ActionPriority): 'error' | 'warning' | 'info' { const normalized = priority.toLowerCase(); return normalized === 'high' ? 'error' : normalized === 'low' ? 'info' : 'warning' }
