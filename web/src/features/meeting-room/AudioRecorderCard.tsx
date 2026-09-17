import { Alert, Box, Button, Card, CardContent, Chip, FormControl, InputLabel, MenuItem, Select, Stack, TextField, Typography } from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import { useAudioRecorder } from '../../hooks/useAudioRecorder'
import { useAudioVisualizer } from '../../hooks/useAudioVisualizer'
import { navigate } from '../../app/navigation'
import type { Meeting } from '../../types/meeting'

type Props = { meetings: Meeting[]; selectedMeetingId: string; onMeetingChange: (meetingId: string) => void; onRecordingStart: (meetingId: string) => Promise<void>; onAudioReady: (audio: Blob) => void; onSaveNotes: (meetingId: string, notes: string) => void; uploading: boolean; starting: boolean; savingNotes: boolean; fixedMeeting?: Meeting; canRecord?: boolean; hideActionButton?: boolean; onRecordingStateChange?: (recording: boolean) => void }

export function AudioRecorderCard({ meetings, selectedMeetingId, onMeetingChange, onRecordingStart, onAudioReady, onSaveNotes, uploading, starting, savingNotes, fixedMeeting, canRecord = true, hideActionButton = false, onRecordingStateChange }: Props) {
  const recorder = useAudioRecorder()
  const levels = useAudioVisualizer(recorder.stream)
  const selectedMeeting = fixedMeeting ?? meetings.find((meeting) => meeting.id === selectedMeetingId)
  const [notes, setNotes] = useState(selectedMeeting?.notes ?? '')
  const handleMeetingChange = (meetingId: string) => {
    onMeetingChange(meetingId)
    setNotes(meetings.find((meeting) => meeting.id === meetingId)?.notes ?? '')
  }
  const stop = useCallback(async () => { const audio = await recorder.stop(); if (audio) onAudioReady(audio) }, [onAudioReady, recorder])
  const start = useCallback(async () => {
    if (!selectedMeetingId || !canRecord) return
    await recorder.start()
    try {
      await onRecordingStart(selectedMeetingId)
    } catch (error) {
      await recorder.stop()
      throw error
    }
  }, [canRecord, onRecordingStart, recorder, selectedMeetingId])
  useEffect(() => {
    onRecordingStateChange?.(recorder.state === 'recording')
  }, [onRecordingStateChange, recorder.state])
  useEffect(() => {
    const toggleRecording = () => {
      if (recorder.state === 'recording') void stop()
      else void start()
    }
    window.addEventListener('smartmeeting-recording-toggle', toggleRecording)
    return () => window.removeEventListener('smartmeeting-recording-toggle', toggleRecording)
  }, [recorder.state, start, stop])
  const duration = [Math.floor(recorder.elapsedSeconds / 3600), Math.floor((recorder.elapsedSeconds % 3600) / 60), recorder.elapsedSeconds % 60].map((value) => value.toString().padStart(2, '0')).join(':')
  return <Card sx={{ height: '100%' }}><CardContent><Stack spacing={2}>
    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 1 }}><Typography variant="h6">Sesli toplantı kaydı</Typography>{selectedMeeting && !fixedMeeting && <Button size="small" variant="outlined" onClick={() => navigate(`/meetings/${selectedMeeting.id}`)}>Canlı odayı aç</Button>}</Stack>
    {fixedMeeting ? <Chip label={`Toplantı: ${selectedMeeting?.title ?? 'Seçilmedi'}`} variant="outlined" sx={{ alignSelf: 'flex-start' }} /> : <FormControl fullWidth disabled={recorder.state === 'recording' || uploading}><InputLabel id="meeting-select-label">Toplantı</InputLabel><Select labelId="meeting-select-label" label="Toplantı" value={selectedMeetingId} onChange={(event) => handleMeetingChange(event.target.value)}><MenuItem value=""><em>Toplantı seçin</em></MenuItem>{meetings.filter((meeting) => ['0', 'Scheduled'].includes(String(meeting.status)) || meeting.id === selectedMeetingId).map((meeting) => <MenuItem key={meeting.id} value={meeting.id}>{meeting.title}</MenuItem>)}</Select></FormControl>}
    <Typography color="text.secondary">Kayıt, toplantı odasına katıldıktan sonra kullanılabilir. Katılımcılar ve kamera/mikrofon bağlantısı canlı oda bölümünden yönetilir.</Typography>
    {selectedMeeting && <Stack spacing={1}><TextField fullWidth multiline minRows={3} label="Canlı toplantı notları" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Toplantı sırasında önemli kararları veya bağlamı yazın..." disabled={uploading} /><Button variant="outlined" onClick={() => onSaveNotes(selectedMeeting.id, notes)} disabled={!notes.trim() || savingNotes}>{savingNotes ? 'Not kaydediliyor…' : 'Notları kaydet'}</Button><Typography variant="caption" color="text.secondary">Bu notlar STT tamamlandıktan sonra AI özetine bağlam olarak dahil edilir.</Typography></Stack>}
    {!selectedMeeting && <Alert severity="info">Kayıt başlatmak için planlanmış bir toplantı seçin.</Alert>}
    {selectedMeeting && !canRecord && <Alert severity="info">Kayıt başlatmak için önce canlı toplantı odasına girin.</Alert>}
    {recorder.state === 'recording' && <Alert severity="warning">Kayıt devam ediyor</Alert>}
    <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 2, p: 2, borderRadius: 2, bgcolor: 'grey.100' }}><Typography variant="h4" sx={{ fontVariantNumeric: 'tabular-nums', letterSpacing: 1 }}>{duration}</Typography><Typography color="text.secondary">Kayıt süresi</Typography></Stack>
    <Stack direction="row" sx={{ height: 72, alignItems: 'center', justifyContent: 'center', gap: 0.5, px: 1, borderRadius: 2, bgcolor: 'primary.dark' }} aria-label="Ses frekans görselleştirmesi">{levels.map((level, index) => <Box key={index} component="span" sx={{ width: 4, height: `${Math.max(8, level * 56)}px`, borderRadius: 1, bgcolor: 'secondary.main', transition: 'height 80ms linear' }} />)}</Stack>
    {uploading && <Alert severity="info">Ses dosyası yükleniyor ve işleme kuyruğa alınıyor…</Alert>}
    {!hideActionButton && (recorder.state === 'recording' ? <Button variant="contained" color="secondary" onClick={() => void stop()}>Kaydı durdur ve gönder</Button> : <Button variant="contained" onClick={() => void start()} disabled={!selectedMeeting || !canRecord || uploading || starting}>{starting ? 'Toplantı durumu güncelleniyor…' : !canRecord && selectedMeeting ? 'Önce odaya girin' : 'Kaydı başlat'}</Button>)}
  </Stack></CardContent></Card>
}
