import { Box, Button, Card, CardContent, Chip, Stack, Typography } from '@mui/material'
import { useEffect, useRef } from 'react'
import { useAudioVisualizer } from '../../hooks/useAudioVisualizer'
import type { MeetingRoomParticipant } from './useMeetingRoomPresence'

type Props = { localStream: MediaStream | null; remoteStreams: Record<string, MediaStream>; participants: MeetingRoomParticipant[]; isMuted: boolean; isCameraOff: boolean; onToggleMute: () => void; onToggleCamera: () => void | Promise<void> }

function VideoTile({ stream, label, muted }: { stream: MediaStream; label: string; muted?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    const videoElement = videoRef.current
    if (videoElement) videoElement.srcObject = stream
    return () => { if (videoElement) videoElement.srcObject = null }
  }, [stream])
  return <Box sx={{ position: 'relative', minHeight: 180, overflow: 'hidden', borderRadius: 2, bgcolor: 'grey.900' }}><video ref={videoRef} autoPlay playsInline muted={muted} style={{ width: '100%', height: '100%', minHeight: 180, objectFit: 'cover' }} /><Chip size="small" label={label} sx={{ position: 'absolute', left: 8, bottom: 8, bgcolor: 'rgba(0,0,0,.65)', color: 'common.white' }} /></Box>
}

export function MeetingRoomMediaPanel({ localStream, remoteStreams, participants, isMuted, isCameraOff, onToggleMute, onToggleCamera }: Props) {
  const remoteEntries = Object.entries(remoteStreams)
  const levels = useAudioVisualizer(localStream)
  return <Card><CardContent><Stack spacing={2}><Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 1 }}><Box><Typography variant="h5">Ekip ve kamera alanı</Typography><Typography variant="body2" color="text.secondary">Toplantıdaki kişileri, kamera ve mikrofon bağlantılarını buradan yönetin.</Typography></Box><Stack direction="row" spacing={1}><Button size="small" variant="outlined" onClick={onToggleMute}>{isMuted ? 'Mikrofonu aç' : 'Mikrofonu kapat'}</Button><Button size="small" variant="outlined" onClick={() => void onToggleCamera()}>{isCameraOff ? 'Kamerayı aç' : 'Kamerayı kapat'}</Button></Stack></Stack><Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 1.5 }}>{localStream && <VideoTile stream={localStream} label={isCameraOff ? 'Siz · Kamera kapalı' : 'Siz'} muted />}{remoteEntries.map(([userId, stream]) => <VideoTile key={userId} stream={stream} label={participants.find((participant) => participant.userId === userId)?.displayName ?? 'Katılımcı'} />)}</Box><Stack spacing={1}><Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>Canlı ses ve frekans dalgası</Typography><Stack direction="row" sx={{ height: 64, alignItems: 'center', justifyContent: 'center', gap: 0.5, px: 1.5, borderRadius: 2, bgcolor: 'primary.dark' }} aria-label="Canlı ses frekans görselleştirmesi">{levels.map((level, index) => <Box key={index} component="span" sx={{ width: 4, height: `${Math.max(8, level * 48)}px`, borderRadius: 1, bgcolor: 'secondary.main', transition: 'height 80ms linear' }} />)}</Stack></Stack>{remoteEntries.length === 0 && <Typography variant="body2" color="text.secondary">Diğer katılımcılar kameralarını açtığında görüntüleri burada görünecek.</Typography>}</Stack></CardContent></Card>
}
