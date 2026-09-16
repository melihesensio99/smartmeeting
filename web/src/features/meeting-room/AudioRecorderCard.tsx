import { Alert, Button, Card, CardContent, FormControl, InputLabel, MenuItem, Select, Stack, Typography } from '@mui/material'
import { useAudioRecorder } from '../../hooks/useAudioRecorder'
import type { Meeting } from '../../types/meeting'

type Props = { meetings: Meeting[]; selectedMeetingId: string; onMeetingChange: (meetingId: string) => void; onRecordingStart: (meetingId: string) => Promise<void>; onAudioReady: (audio: Blob) => void; uploading: boolean; starting: boolean }

export function AudioRecorderCard({ meetings, selectedMeetingId, onMeetingChange, onRecordingStart, onAudioReady, uploading, starting }: Props) {
  const recorder = useAudioRecorder()
  const selectedMeeting = meetings.find((meeting) => meeting.id === selectedMeetingId)
  const stop = async () => { const audio = await recorder.stop(); if (audio) onAudioReady(audio) }
  return <Card sx={{ height: '100%' }}><CardContent><Stack spacing={2}>
    <Typography variant="h6">Canlı toplantı odası</Typography>
    <FormControl fullWidth disabled={recorder.state === 'recording' || uploading}><InputLabel id="meeting-select-label">Toplantı</InputLabel><Select labelId="meeting-select-label" label="Toplantı" value={selectedMeetingId} onChange={(event) => onMeetingChange(event.target.value)}><MenuItem value=""><em>Toplantı seçin</em></MenuItem>{meetings.filter((meeting) => String(meeting.status) === '0').map((meeting) => <MenuItem key={meeting.id} value={meeting.id}>{meeting.title}</MenuItem>)}</Select></FormControl>
    <Typography color="text.secondary">Kayıt tamamlandığında ses dosyası storage’a yüklenir ve Voxtral transkripsiyonu başlar.</Typography>
    {!selectedMeeting && <Alert severity="info">Kayıt başlatmak için planlanmış bir toplantı seçin.</Alert>}
    {recorder.state === 'recording' && <Alert severity="warning">Kayıt devam ediyor</Alert>}
    {uploading && <Alert severity="info">Ses dosyası yükleniyor ve işleme kuyruğa alınıyor…</Alert>}
    {recorder.state === 'recording' ? <Button variant="contained" color="secondary" onClick={() => void stop()}>Kaydı durdur ve gönder</Button> : <Button variant="contained" onClick={() => void (async () => { if (!selectedMeetingId) return; await onRecordingStart(selectedMeetingId); await recorder.start() })()} disabled={!selectedMeeting || uploading || starting}>{starting ? 'Toplantı durumu güncelleniyor…' : 'Kaydı başlat'}</Button>}
  </Stack></CardContent></Card>
}
