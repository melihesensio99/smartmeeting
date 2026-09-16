import { Alert, Box, Button, Card, CardContent, Divider, Stack, TextField, Typography } from '@mui/material'
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
  savingNotes: boolean
  addingParticipant: boolean
}

export function MeetingDetailPage({ meeting, onComplete, onSaveNotes, onMapSpeaker, onAddParticipant, savingNotes, addingParticipant }: Props) {
  const [note, setNote] = useState(meeting?.notes ?? '')
  const [speakerLabels, setSpeakerLabels] = useState<Record<string, string>>({})
  const participantForm = useForm<AddParticipantInput>({ resolver: zodResolver(addParticipantSchema), defaultValues: { userId: '', displayName: '', email: '' } })
  if (!meeting) return <Alert severity="warning">Toplantı bulunamadı. <Button onClick={() => navigate('/meetings')}>Toplantılara dön</Button></Alert>
  return <Stack spacing={3}>
    <Button sx={{ alignSelf: 'flex-start' }} onClick={() => navigate('/meetings')}>← Toplantılara dön</Button>
    <Stack direction={{ xs: 'column', md: 'row' }} sx={{ justifyContent: 'space-between', gap: 2 }}><Box><Typography variant="h3">{meeting.title}</Typography><Typography color="text.secondary">{new Date(meeting.startsAt).toLocaleString('tr-TR')} · Düzenleyen: {meeting.organizerId}</Typography></Box><Button variant="contained" onClick={() => navigate('/')}>Yeni kayıt başlat</Button></Stack>
    <Card><CardContent><Typography variant="h5">Konuşmacılı transkript</Typography><Typography sx={{ mt: 2, whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>{meeting.transcript ?? 'Transkript henüz hazır değil. Ses kaydı tamamlandığında burada görünecek.'}</Typography></CardContent></Card>
    <Card><CardContent><Typography variant="h5">Katılımcılar ve konuşmacı eşleştirme</Typography><Stack component="form" onSubmit={participantForm.handleSubmit((input) => { onAddParticipant(meeting.id, input); participantForm.reset() })} direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mt: 2, mb: 3 }}><TextField size="small" label="Kullanıcı ID" {...participantForm.register('userId')} error={Boolean(participantForm.formState.errors.userId)} helperText={participantForm.formState.errors.userId?.message} /><TextField size="small" label="Ad soyad" {...participantForm.register('displayName')} error={Boolean(participantForm.formState.errors.displayName)} helperText={participantForm.formState.errors.displayName?.message} /><TextField size="small" label="E-posta" {...participantForm.register('email')} error={Boolean(participantForm.formState.errors.email)} helperText={participantForm.formState.errors.email?.message} /><Button type="submit" variant="contained" disabled={addingParticipant}>{addingParticipant ? 'Ekleniyor…' : 'Katılımcı ekle'}</Button></Stack><Typography color="text.secondary" sx={{ mt: 1, mb: 2 }}>AI yalnızca konuşmacı etiketini üretir. Gerçek katılımcı adını burada kullanıcı onayıyla eşleştirin.</Typography><Stack spacing={2}>{meeting.participants.length ? meeting.participants.map((participant) => <Stack key={participant.id} direction={{ xs: 'column', md: 'row' }} sx={{ gap: 2, alignItems: { md: 'center' } }}><Typography sx={{ minWidth: 180, fontWeight: 700 }}>{participant.displayName}</Typography><TextField size="small" label="Speaker etiketi" placeholder="Speaker 1" value={speakerLabels[participant.id] ?? participant.speakerLabel ?? ''} onChange={(event) => setSpeakerLabels((current) => ({ ...current, [participant.id]: event.target.value }))} /><Button variant="outlined" disabled={!speakerLabels[participant.id]?.trim()} onClick={() => onMapSpeaker(meeting.id, participant.id, speakerLabels[participant.id])}>Eşleştir</Button></Stack>) : <Alert severity="info">Bu toplantıya henüz katılımcı eklenmemiş.</Alert>}</Stack></CardContent></Card>
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}><Card sx={{ flex: 1 }}><CardContent><Typography variant="h5">AI özeti</Typography>{meeting.summary ? <><Typography sx={{ mt: 2 }}>{meeting.summary.overview}</Typography><Divider sx={{ my: 2 }} /><Typography sx={{ fontWeight: 700 }}>Ana kararlar</Typography>{meeting.summary.decisions.map((decision) => <Typography key={decision} sx={{ mt: 1 }}>• {decision}</Typography>)}</> : <Alert sx={{ mt: 2 }} severity="info">Özet hazırlanıyor.</Alert>}</CardContent></Card><Card sx={{ flex: 1 }}><CardContent><Typography variant="h5">Aksiyonlar</Typography>{meeting.summary?.actionItems.map((action) => <Stack key={action.id} direction="row" sx={{ alignItems: 'center' }}><input type="checkbox" checked={action.completed} onChange={() => onComplete(meeting.id, action.id)} /><Typography sx={{ ml: 1, textDecoration: action.completed ? 'line-through' : 'none' }}>{action.description}</Typography></Stack>)}</CardContent></Card></Stack>
    <Card><CardContent><Typography variant="h5">Toplantı notlarım</Typography><TextField fullWidth multiline minRows={4} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Toplantı sırasında veya sonrasında özel notlarınızı yazın..." sx={{ mt: 2 }} /><Button sx={{ mt: 2 }} variant="outlined" disabled={!note.trim() || savingNotes} onClick={() => onSaveNotes(meeting.id, note)}>{savingNotes ? 'Kaydediliyor…' : 'Notu kaydet'}</Button></CardContent></Card>
  </Stack>
}
