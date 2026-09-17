import { Box, Card, CardContent, Chip, IconButton, Stack, Tooltip, Typography } from '@mui/material'
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
  return <Box sx={{ position: 'relative', width: '100%', maxWidth: 560, aspectRatio: '16 / 9', overflow: 'hidden', borderRadius: 2, bgcolor: 'grey.900' }}><video ref={videoRef} autoPlay playsInline muted={muted} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /><Chip size="small" label={label} sx={{ position: 'absolute', left: 8, bottom: 8, bgcolor: 'rgba(0,0,0,.65)', color: 'common.white' }} /></Box>
}

export function MeetingRoomMediaPanel({ localStream, remoteStreams, participants, isMuted, isCameraOff, onToggleMute, onToggleCamera }: Props) {
  const remoteEntries = Object.entries(remoteStreams)
  const levels = useAudioVisualizer(localStream)
  return <Card><CardContent sx={{ p: { xs: 1.5, md: 2 } }}><Stack spacing={1.5}><Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 1 }}><Box><Typography variant="h6">Ekip ve kamera</Typography><Typography variant="body2" color="text.secondary">Toplantıdaki kişileri ve bağlantıları yönetin.</Typography></Box><Chip size="small" label={`${remoteEntries.length + 1} kişi`} color="success" /></Stack><Box sx={{ position: 'relative' }}><Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 1 }}>{localStream && <VideoTile stream={localStream} label={isCameraOff ? 'Siz · Kamera kapalı' : 'Siz'} muted />}{remoteEntries.map(([userId, stream]) => <VideoTile key={userId} stream={stream} label={participants.find((participant) => participant.userId === userId)?.displayName ?? 'Katılımcı'} />)}</Box><Stack direction="row" spacing={0.5} sx={{ position: 'absolute', right: 8, bottom: 8, p: 0.5, borderRadius: 2, bgcolor: 'rgba(20, 12, 40, .82)' }}><Tooltip title={isMuted ? 'Mikrofonu aç' : 'Mikrofonu kapat'}><IconButton size="small" aria-label={isMuted ? 'Mikrofonu aç' : 'Mikrofonu kapat'} onClick={onToggleMute} sx={{ color: 'common.white' }}><span aria-hidden="true">{isMuted ? '🔇' : '🎙️'}</span></IconButton></Tooltip><Tooltip title={isCameraOff ? 'Kamerayı aç' : 'Kamerayı kapat'}><IconButton size="small" aria-label={isCameraOff ? 'Kamerayı aç' : 'Kamerayı kapat'} onClick={() => void onToggleCamera()} sx={{ color: 'common.white' }}><span aria-hidden="true">{isCameraOff ? '📹' : '🎥'}</span></IconButton></Tooltip></Stack></Box><Stack spacing={1}><Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>Canlı ses ve frekans dalgası</Typography><Stack direction="row" sx={{ height: 52, alignItems: 'center', justifyContent: 'center', gap: 0.5, px: 1.5, borderRadius: 2, bgcolor: 'primary.dark' }} aria-label="Canlı ses frekans görselleştirmesi">{levels.map((level, index) => <Box key={index} component="span" sx={{ width: 3, height: `${Math.max(6, level * 38)}px`, borderRadius: 1, bgcolor: 'secondary.main', transition: 'height 80ms linear' }} />)}</Stack></Stack>{remoteEntries.length === 0 && <Typography variant="body2" color="text.secondary">Diğer katılımcılar kameralarını açtığında görüntüleri burada görünecek.</Typography>}</Stack></CardContent></Card>
}
