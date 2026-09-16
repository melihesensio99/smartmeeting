import { Alert, Box, Button, Card, CardContent, Chip, Divider, LinearProgress, Stack, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { navigate } from '../../app/navigation'
import { addParticipantSchema, type AddParticipantInput, type Meeting } from '../../types/meeting'

type Props = {
  meeting: Meeting | undefined
  onComplete: (meetingId: string, actionItemId: string) => void
  onSaveNotes: (meetingId: string, notes: string) => void
  onMapSpeaker: (meetingId: string, participantId: string, speakerLabel: string) => void
  onAddParticipant: (meetingId: string, input: AddParticipantInput) => void
  onSendEmail: (meetingId: string) => void
  savingNotes: boolean
  addingParticipant: boolean
  sendingEmail: boolean
}

export function MeetingDetailPage({ meeting, onComplete, onSaveNotes, onMapSpeaker, onAddParticipant, onSendEmail, savingNotes, addingParticipant, sendingEmail }: Props) {
  const [note, setNote] = useState(meeting?.notes ?? '')
  const [speakerLabels, setSpeakerLabels] = useState<Record<string, string>>({})
  const participantForm = useForm<AddParticipantInput>({ resolver: zodResolver(addParticipantSchema), defaultValues: { userId: '', displayName: '', email: '' } })
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
  return <Stack spacing={3}>
    <Button sx={{ alignSelf: 'flex-start' }} onClick={() => navigate('/meetings')}>← Toplantılara dön</Button>
    <Stack direction={{ xs: 'column', md: 'row' }} sx={{ justifyContent: 'space-between', gap: 2 }}><Box><Typography variant="h3">{meeting.title}</Typography><Typography color="text.secondary">{new Date(meeting.startsAt).toLocaleString('tr-TR')} · Düzenleyen: {meeting.organizerId}</Typography></Box><Button variant="contained" onClick={() => navigate('/')}>Yeni kayıt başlat</Button></Stack>
    <Card><CardContent><Stack spacing={1.5}><Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 2 }}><Typography variant="h5">Toplantı işlem durumu</Typography><Chip label={currentStatus.label} color={currentStatus.color} /></Stack><Typography color="text.secondary">{currentStatus.message}</Typography><LinearProgress variant="determinate" value={currentStatus.progress} color={currentStatus.color === 'default' ? 'primary' : currentStatus.color} /></Stack></CardContent></Card>
    <Card><CardContent><Typography variant="h5">Konuşmacılı transkript</Typography><Typography sx={{ mt: 2, whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>{meeting.transcript ?? 'Transkript henüz hazır değil. Ses kaydı tamamlandığında burada görünecek.'}</Typography></CardContent></Card>
    <Card><CardContent><Typography variant="h5">Katılımcılar ve konuşmacı eşleştirme</Typography><Stack component="form" onSubmit={participantForm.handleSubmit((input) => { onAddParticipant(meeting.id, input); participantForm.reset() })} direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mt: 2, mb: 3 }}><TextField size="small" label="Kullanıcı ID" {...participantForm.register('userId')} error={Boolean(participantForm.formState.errors.userId)} helperText={participantForm.formState.errors.userId?.message} /><TextField size="small" label="Ad soyad" {...participantForm.register('displayName')} error={Boolean(participantForm.formState.errors.displayName)} helperText={participantForm.formState.errors.displayName?.message} /><TextField size="small" label="E-posta" {...participantForm.register('email')} error={Boolean(participantForm.formState.errors.email)} helperText={participantForm.formState.errors.email?.message} /><Button type="submit" variant="contained" disabled={addingParticipant}>{addingParticipant ? 'Ekleniyor…' : 'Katılımcı ekle'}</Button></Stack><Typography color="text.secondary" sx={{ mt: 1, mb: 2 }}>AI yalnızca konuşmacı etiketini üretir. Gerçek katılımcı adını burada kullanıcı onayıyla eşleştirin.</Typography><Stack spacing={2}>{meeting.participants.length ? meeting.participants.map((participant) => <Stack key={participant.id} direction={{ xs: 'column', md: 'row' }} sx={{ gap: 2, alignItems: { md: 'center' } }}><Typography sx={{ minWidth: 180, fontWeight: 700 }}>{participant.displayName}</Typography><TextField size="small" label="Speaker etiketi" placeholder="Speaker 1" value={speakerLabels[participant.id] ?? participant.speakerLabel ?? ''} onChange={(event) => setSpeakerLabels((current) => ({ ...current, [participant.id]: event.target.value }))} /><Button variant="outlined" disabled={!speakerLabels[participant.id]?.trim()} onClick={() => onMapSpeaker(meeting.id, participant.id, speakerLabels[participant.id])}>Eşleştir</Button></Stack>) : <Alert severity="info">Bu toplantıya henüz katılımcı eklenmemiş.</Alert>}</Stack></CardContent></Card>
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}><Card sx={{ flex: 1 }}><CardContent><Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}><Typography variant="h5">AI özeti</Typography><Button size="small" variant="outlined" disabled={!meeting.summary || sendingEmail} onClick={() => onSendEmail(meeting.id)}>{sendingEmail ? 'Gönderiliyor…' : 'Katılımcılara e-posta gönder'}</Button></Stack>{meeting.summary ? <><Typography sx={{ mt: 2 }}>{meeting.summary.overview}</Typography><Divider sx={{ my: 2 }} /><Typography sx={{ fontWeight: 700 }}>Ana kararlar</Typography>{meeting.summary.decisions.map((decision) => <Typography key={decision} sx={{ mt: 1 }}>• {decision}</Typography>)}</> : <Alert sx={{ mt: 2 }} severity="info">Özet hazırlanıyor.</Alert>}</CardContent></Card><Card sx={{ flex: 1 }}><CardContent><Typography variant="h5">Aksiyonlar</Typography>{meeting.summary?.actionItems.map((action) => <Stack key={action.id} direction="row" sx={{ alignItems: 'center' }}><input type="checkbox" checked={action.completed} onChange={() => onComplete(meeting.id, action.id)} /><Typography sx={{ ml: 1, textDecoration: action.completed ? 'line-through' : 'none' }}>{action.description}</Typography></Stack>)}</CardContent></Card></Stack>
    <Card><CardContent><Typography variant="h5">Toplantı notlarım</Typography><TextField fullWidth multiline minRows={4} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Toplantı sırasında veya sonrasında özel notlarınızı yazın..." sx={{ mt: 2 }} /><Button sx={{ mt: 2 }} variant="outlined" disabled={!note.trim() || savingNotes} onClick={() => onSaveNotes(meeting.id, note)}>{savingNotes ? 'Kaydediliyor…' : 'Notu kaydet'}</Button></CardContent></Card>
  </Stack>
}
