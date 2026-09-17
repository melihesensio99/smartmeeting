import { Alert, Box, Button, Card, CardContent, Checkbox, Chip, Divider, FormControlLabel, LinearProgress, MenuItem, Select, Stack, Switch, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { navigate } from '../../app/navigation'
import { getApiErrorMessage, searchUsers } from '../../lib/api'
import type { AddParticipantInput, Meeting, UserResponse } from '../../types/meeting'
import type { ActionItem, ActionPriority } from '../../types/meeting'
import { ActionItemEditor } from '../actions/ActionItemEditor'

type Props = {
  meeting: Meeting | undefined
  currentUserId: string | null
  onComplete: (meetingId: string, actionItemId: string) => void
  onUpdateAction: (meetingId: string, actionItemId: string, input: { assigneeUserId: string | null; dueAt: string | null; priority: ActionPriority }) => void
  onSaveNotes: (meetingId: string, notes: string) => void
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
  retryingProcessing: boolean
  emailSent: boolean
  emailError: string | null
}

export function MeetingDetailPage({ meeting, currentUserId, onComplete, onUpdateAction, onSaveNotes, onMapSpeaker, onConfirmSpeaker, onRejectSpeaker, onAddParticipant, onUpdateParticipantPermission, onRemoveParticipant, onLeaveMeeting, onSendEmail, onRetryProcessing, savingNotes, addingParticipant, updatingParticipantPermission, removingParticipant, leavingMeeting, confirmingSpeaker, rejectingSpeaker, sendingEmail, updatingAction, retryingProcessing, emailSent, emailError }: Props) {
  const [note, setNote] = useState(meeting?.notes ?? '')
  const [speakerLabels, setSpeakerLabels] = useState<Record<string, string>>({})
  const [participantSearch, setParticipantSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null)
  const [grantMeetingManagement, setGrantMeetingManagement] = useState(false)
  const [editingAction, setEditingAction] = useState<ActionItem | null>(null)
  const users = useQuery({ queryKey: ['users', participantSearch], queryFn: () => searchUsers(participantSearch), enabled: participantSearch.trim().length >= 2 })
  if (!meeting) return <Alert severity="warning">Toplantı bulunamadı. <Button onClick={() => navigate('/meetings')}>Toplantılara dön</Button></Alert>
  const status = String(meeting.status)
  const statusInfo: Record<string, { label: string; color: 'default' | 'warning' | 'info' | 'success' | 'error'; message: string; progress: number }> = {
    '0': { label: 'Planlandı', color: 'default', message: 'Toplantı kaydı başlatılmaya hazır.', progress: 0 },
    '1': { label: 'Kayıt alınıyor', color: 'warning', message: 'Mikrofon kaydı devam ediyor.', progress: 25 },
    '2': { label: 'İşleniyor', color: 'info', message: 'Ses dosyası, transkript ve AI özeti hazırlanıyor.', progress: 70 },
    '3': { label: 'Hazır', color: 'success', message: 'Transkript ve AI özeti hazır.', progress: 100 },
    '4': { label: 'Başarısız', color: 'error', message: 'Toplantı işlenirken bir hata oluştu.', progress: 100 },
    '5': { label: 'İptal edildi', color: 'default', message: 'Toplantı işlemi iptal edildi.', progress: 0 },
  }
  const currentStatus = statusInfo[status] ?? { label: status, color: 'default' as const, message: 'Toplantı durumu güncelleniyor.', progress: 0 }
  const isOrganizer = currentUserId !== null && currentUserId === meeting.organizerId
  return <Stack spacing={3}>
    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}><Button sx={{ alignSelf: 'flex-start' }} onClick={() => navigate('/meetings')}>← Toplantılara dön</Button>{!isOrganizer && <Button color="error" variant="outlined" disabled={leavingMeeting} onClick={() => { if (window.confirm('Bu toplantıdan ayrılmak istediğinizden emin misiniz?')) onLeaveMeeting(meeting.id) }}>{leavingMeeting ? 'Ayrılıyor…' : 'Toplantıdan ayrıl'}</Button>}</Stack>
    <Stack direction={{ xs: 'column', md: 'row' }} sx={{ justifyContent: 'space-between', gap: 2 }}><Box><Typography variant="h3">{meeting.title}</Typography><Typography color="text.secondary">{new Date(meeting.startsAt).toLocaleString('tr-TR')} · Düzenleyen: {meeting.organizerId}</Typography></Box><Button variant="contained" onClick={() => navigate('/')}>Yeni kayıt başlat</Button></Stack>
    <Card><CardContent><Stack spacing={1.5}><Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 2 }}><Typography variant="h5">Toplantı işlem durumu</Typography><Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}><Chip label={currentStatus.label} color={currentStatus.color} />{status === '4' && <Button size="small" variant="contained" color="warning" disabled={retryingProcessing} onClick={() => onRetryProcessing(meeting.id)}>{retryingProcessing ? 'Tekrar deneniyor…' : 'Yeniden işle'}</Button>}</Stack></Stack><Typography color="text.secondary">{currentStatus.message}</Typography><LinearProgress variant="determinate" value={currentStatus.progress} color={currentStatus.color === 'default' ? 'primary' : currentStatus.color} /></Stack></CardContent></Card>
    <Card><CardContent><Typography variant="h5">Konuşmacılı transkript</Typography><Typography sx={{ mt: 2, whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>{meeting.transcript ?? 'Transkript henüz hazır değil. Ses kaydı tamamlandığında burada görünecek.'}</Typography></CardContent></Card>
    <Card><CardContent><Typography variant="h5">Katılımcılar ve konuşmacı eşleştirme</Typography>{isOrganizer && <><Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mt: 2, mb: 1 }}><TextField fullWidth size="small" label="Kayıtlı kullanıcı ara" placeholder="Ad soyad veya e-posta" value={participantSearch} onChange={(event) => { setParticipantSearch(event.target.value); setSelectedUser(null) }} /><Button variant="contained" disabled={!selectedUser || addingParticipant} onClick={() => { if (!selectedUser) return; const input: AddParticipantInput = { ...selectedUser, canManageMeeting: grantMeetingManagement }; onAddParticipant(meeting.id, input); setParticipantSearch(''); setSelectedUser(null); setGrantMeetingManagement(false) }}>{addingParticipant ? 'Ekleniyor…' : 'Katılımcı ekle'}</Button></Stack><FormControlLabel control={<Checkbox checked={grantMeetingManagement} onChange={(event) => setGrantMeetingManagement(event.target.checked)} />} label="Bu katılımcıya toplantı içi yönetim yetkisi ver" />{users.isFetching && <Typography color="text.secondary">Kullanıcılar aranıyor…</Typography>}{users.isError && <Alert severity="error">{getApiErrorMessage(users.error, 'Kullanıcılar getirilemedi.')}</Alert>}{users.data && users.data.length > 0 && <Stack spacing={1} sx={{ mb: 2 }}>{users.data.map((user) => <Button key={user.userId} variant={selectedUser?.userId === user.userId ? 'contained' : 'outlined'} onClick={() => setSelectedUser(user)} sx={{ justifyContent: 'flex-start', textAlign: 'left' }}>{user.displayName} · {user.email}</Button>)}</Stack>}</>}<Typography color="text.secondary" sx={{ mt: 1, mb: 2 }}>{isOrganizer ? 'Yalnızca sistemde kayıtlı kullanıcılar eklenebilir. Yetkiyi sonradan değiştirebilir veya katılımcıyı çıkarabilirsiniz.' : 'Toplantı sahibi katılımcı ve toplantı içi yetkilerini yönetir. Yetkili katılımcılar kayıt, not, aksiyon ve konuşmacı işlemlerini yönetebilir.'}</Typography><Stack spacing={2}>{meeting.participants.length ? meeting.participants.map((participant) => <Stack key={participant.id} direction={{ xs: 'column', md: 'row' }} sx={{ gap: 2, alignItems: { md: 'center' } }}><Typography sx={{ minWidth: 180, fontWeight: 700 }}>{participant.displayName}{participant.canManageMeeting && <Chip size="small" label="Toplantı yöneticisi" sx={{ ml: 1 }} />}</Typography><Select size="small" displayEmpty value={speakerLabels[participant.id] ?? participant.speakerLabel ?? ''} onChange={(event) => setSpeakerLabels((current) => ({ ...current, [participant.id]: event.target.value }))} sx={{ minWidth: 180 }}><MenuItem value=""><em>Speaker etiketi seçin</em></MenuItem>{Array.from({ length: 8 }, (_, index) => <MenuItem key={index} value={`Speaker ${index + 1}`}>Speaker {index + 1}</MenuItem>)}</Select><Button variant="outlined" disabled={!speakerLabels[participant.id]?.trim()} onClick={() => onMapSpeaker(meeting.id, participant.id, speakerLabels[participant.id])}>Öneriyi kaydet</Button>{participant.speakerMappingStatus === 'PendingConfirmation' && <><Chip size="small" color="warning" label={`Onay bekliyor${participant.speakerConfidence !== null ? ` · %${Math.round(participant.speakerConfidence * 100)}` : ''}`} /><Button size="small" variant="contained" disabled={confirmingSpeaker} onClick={() => onConfirmSpeaker(meeting.id, participant.id)}>Onayla</Button><Button size="small" color="error" disabled={rejectingSpeaker} onClick={() => onRejectSpeaker(meeting.id, participant.id)}>Reddet</Button></>}{participant.speakerMappingStatus === 'Confirmed' && <Chip size="small" color="success" label="Eşleştirme onaylandı" />}{isOrganizer && <><FormControlLabel control={<Switch size="small" checked={participant.canManageMeeting} disabled={updatingParticipantPermission} onChange={(event) => onUpdateParticipantPermission(meeting.id, participant.id, event.target.checked)} />} label="Yönetim" /><Button color="error" size="small" disabled={removingParticipant} onClick={() => onRemoveParticipant(meeting.id, participant.id)}>Çıkar</Button></>}</Stack>) : <Alert severity="info">Bu toplantıya henüz katılımcı eklenmemiş.</Alert>}</Stack></CardContent></Card>
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}><Card sx={{ flex: 1 }}><CardContent><Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}><Typography variant="h5">AI özeti</Typography><Button size="small" variant="outlined" disabled={!meeting.summary || sendingEmail} onClick={() => onSendEmail(meeting.id)}>{sendingEmail ? 'Gönderiliyor…' : 'Katılımcılara e-posta gönder'}</Button></Stack>{meeting.summary ? <><Typography sx={{ mt: 2 }}>{meeting.summary.overview}</Typography><Divider sx={{ my: 2 }} /><Typography sx={{ fontWeight: 700 }}>Ana kararlar</Typography>{meeting.summary.decisions.map((decision) => <Typography key={decision} sx={{ mt: 1 }}>• {decision}</Typography>)}</> : <Alert sx={{ mt: 2 }} severity="info">Özet hazırlanıyor.</Alert>}</CardContent></Card><Card sx={{ flex: 1 }}><CardContent><Typography variant="h5">Aksiyonlar</Typography>{meeting.summary?.actionItems.map((action) => <Stack key={action.id} direction={{ xs: 'column', sm: 'row' }} sx={{ alignItems: { sm: 'center' }, gap: 1, mt: 1 }}><input type="checkbox" checked={action.completed} onChange={() => onComplete(meeting.id, action.id)} /><Typography sx={{ flex: 1, textDecoration: action.completed ? 'line-through' : 'none' }}>{action.description} · {action.assignee ?? 'Atanmamış'} · {action.dueAt ? new Date(action.dueAt).toLocaleDateString('tr-TR') : 'Termin yok'}</Typography><Chip size="small" label={priorityLabel(action.priority)} color={priorityColor(action.priority)} /><Button size="small" onClick={() => setEditingAction(action)}>Düzenle</Button></Stack>)}</CardContent></Card></Stack>
    <Card><CardContent><Typography variant="h5">Toplantı notlarım</Typography><TextField fullWidth multiline minRows={4} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Toplantı sırasında veya sonrasında özel notlarınızı yazın..." sx={{ mt: 2 }} /><Button sx={{ mt: 2 }} variant="outlined" disabled={!note.trim() || savingNotes} onClick={() => onSaveNotes(meeting.id, note)}>{savingNotes ? 'Kaydediliyor…' : 'Notu kaydet'}</Button></CardContent></Card>
    {emailSent && <Alert severity="success">Toplantı özeti katılımcılara e-posta ile gönderildi.</Alert>}
    {emailError && <Alert severity="error">{emailError}</Alert>}
    <ActionItemEditor key={editingAction?.id ?? 'closed'} action={editingAction} open={editingAction !== null} saving={updatingAction} onClose={() => setEditingAction(null)} onSave={(input) => { if (!editingAction) return; onUpdateAction(meeting.id, editingAction.id, input); setEditingAction(null) }} />
  </Stack>
}

function priorityLabel(priority: ActionPriority) { const normalized = priority.toLowerCase(); return normalized === 'high' ? 'Yüksek' : normalized === 'low' ? 'Düşük' : 'Orta' }
function priorityColor(priority: ActionPriority): 'error' | 'warning' | 'info' { const normalized = priority.toLowerCase(); return normalized === 'high' ? 'error' : normalized === 'low' ? 'info' : 'warning' }
