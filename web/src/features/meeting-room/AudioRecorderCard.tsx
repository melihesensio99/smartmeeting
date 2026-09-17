import { Alert, Box, Button, Card, CardContent, Chip, FormControl, InputLabel, MenuItem, Select, Stack, TextField, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useCallback, useEffect, useState } from 'react'
import { useAudioRecorder } from '../../hooks/useAudioRecorder'
import { useAudioVisualizer } from '../../hooks/useAudioVisualizer'
import { navigate } from '../../app/navigation'
import type { Meeting } from '../../types/meeting'

type Props = { meetings: Meeting[]; selectedMeetingId: string; onMeetingChange: (meetingId: string) => void; onRecordingStart: (meetingId: string) => Promise<void>; onAudioReady: (audio: Blob) => void; onSaveNotes: (meetingId: string, notes: string) => void; uploading: boolean; starting: boolean; savingNotes: boolean; fixedMeeting?: Meeting; canRecord?: boolean; hideActionButton?: boolean; compact?: boolean; onRecordingStateChange?: (recording: boolean) => void; onRecordingDurationChange?: (duration: string) => void }

export function AudioRecorderCard({ meetings, selectedMeetingId, onMeetingChange, onRecordingStart, onAudioReady, onSaveNotes, uploading, starting, savingNotes, fixedMeeting, canRecord = true, hideActionButton = false, compact = false, onRecordingStateChange, onRecordingDurationChange }: Props) {
  const recorder = useAudioRecorder()
  const levels = useAudioVisualizer(recorder.stream)
  const isCompact = compact || hideActionButton
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
  useEffect(() => {
    onRecordingDurationChange?.(duration)
  }, [duration, onRecordingDurationChange])
  return <Card sx={{ height: '100%', borderRadius: 4, transition: 'box-shadow 0.3s', '&:hover': { boxShadow: (theme) => `0 8px 24px ${alpha(theme.palette.primary.main, 0.12)}` } }}><CardContent><Stack spacing={3}>
    {!isCompact && <><Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 1 }}><Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>Sesli toplantı kaydı</Typography>{selectedMeeting && !fixedMeeting && <Button size="small" variant="outlined" sx={{ borderRadius: 3 }} onClick={() => navigate(`/meetings/${selectedMeeting.id}`)}>Canlı odayı aç</Button>}</Stack>{fixedMeeting ? <Chip label={`Toplantı: ${selectedMeeting?.title ?? 'Seçilmedi'}`} variant="outlined" sx={{ alignSelf: 'flex-start', borderRadius: 2, fontWeight: 500 }} /> : <FormControl fullWidth disabled={recorder.state === 'recording' || uploading}><InputLabel id="meeting-select-label">Toplantı</InputLabel><Select labelId="meeting-select-label" label="Toplantı" value={selectedMeetingId} sx={{ borderRadius: 3 }} onChange={(event) => handleMeetingChange(event.target.value)}><MenuItem value=""><em>Toplantı seçin</em></MenuItem>{meetings.filter((meeting) => ['0', 'Scheduled'].includes(String(meeting.status)) || meeting.id === selectedMeetingId).map((meeting) => <MenuItem key={meeting.id} value={meeting.id}>{meeting.title}</MenuItem>)}</Select></FormControl>}</>}
    {!isCompact && <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>Kayıt, toplantı odasına katıldıktan sonra kullanılabilir. Katılımcılar ve kamera/mikrofon bağlantısı canlı oda bölümünden yönetilir.</Typography>}
    {selectedMeeting && <Stack spacing={2} sx={isCompact ? { p: 2.5, borderRadius: 4, background: (theme) => `linear-gradient(${theme.palette.background.paper}, ${theme.palette.background.paper}) padding-box, linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.5)}, ${alpha(theme.palette.secondary.main, 0.5)}) border-box`, border: '2px solid transparent' } : undefined}>{isCompact && <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>Canlı toplantı notları</Typography>}<TextField fullWidth multiline minRows={isCompact ? 5 : 3} label={isCompact ? 'Not ekle' : 'Canlı toplantı notları'} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Toplantı sırasında önemli kararları veya bağlamı yazın..." disabled={uploading} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }} /><Button variant="outlined" sx={{ borderRadius: 3, py: 1 }} onClick={() => onSaveNotes(selectedMeeting.id, notes)} disabled={!notes.trim() || savingNotes}>{savingNotes ? 'Not kaydediliyor…' : 'Notları kaydet'}</Button><Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center' }}>Bu notlar STT tamamlandıktan sonra AI özetine bağlam olarak dahil edilir.</Typography></Stack>}
    {!isCompact && !selectedMeeting && <Alert severity="info" sx={{ borderRadius: 3 }}>Kayıt başlatmak için planlanmış bir toplantı seçin.</Alert>}
    {!isCompact && selectedMeeting && !canRecord && <Alert severity="info" sx={{ borderRadius: 3 }}>Kayıt başlatmak için önce canlı toplantı odasına girin.</Alert>}
    {!isCompact && recorder.state === 'recording' && <Alert severity="warning" sx={{ borderRadius: 3 }}>Kayıt devam ediyor</Alert>}
    {!isCompact && <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 2, p: 3, borderRadius: 4, bgcolor: 'primary.dark', color: 'common.white', boxShadow: 'inset 0 2px 12px rgba(0,0,0,0.2)' }}><Typography variant="h3" sx={{ fontFamily: 'monospace', letterSpacing: 2, background: (theme) => `linear-gradient(to right, ${theme.palette.secondary.main}, #fff)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textShadow: '0 2px 10px rgba(255,107,107,0.3)' }}>{duration}</Typography><Typography variant="overline" sx={{ letterSpacing: 1, color: 'grey.400' }}>Kayıt süresi</Typography></Stack>}
    {!isCompact && <Stack direction="row" sx={{ height: 80, alignItems: 'center', justifyContent: 'center', gap: 0.75, px: 2, borderRadius: 4, bgcolor: 'primary.dark', boxShadow: 'inset 0 4px 16px rgba(0,0,0,0.3)' }} aria-label="Ses frekans görselleştirmesi">{levels.map((level, index) => <Box key={index} component="span" sx={{ width: 6, height: `${Math.max(8, level * 64)}px`, borderRadius: 3, background: (theme) => `linear-gradient(to top, ${theme.palette.secondary.main}, ${theme.palette.primary.light})`, transition: 'height 80ms ease-out', boxShadow: (theme) => `0 0 8px ${alpha(theme.palette.secondary.main, level * 0.5)}` }} />)}</Stack>}
    {uploading && <Alert severity="info" sx={{ borderRadius: 3 }}>Ses dosyası yükleniyor ve işleme kuyruğa alınıyor…</Alert>}
    {!hideActionButton && (recorder.state === 'recording' ? <Button variant="contained" color="secondary" size="large" sx={{ borderRadius: 3, py: 1.5, fontWeight: 700 }} onClick={() => void stop()}>Kaydı durdur ve gönder</Button> : <Button variant="contained" size="large" sx={{ borderRadius: 3, py: 1.5, fontWeight: 700 }} onClick={() => void start()} disabled={!selectedMeeting || !canRecord || uploading || starting}>{starting ? 'Toplantı durumu güncelleniyor…' : !canRecord && selectedMeeting ? 'Önce odaya girin' : 'Kaydı başlat'}</Button>)}
  </Stack></CardContent></Card>
}
