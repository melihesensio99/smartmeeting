import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr'
import { useCallback, useEffect, useRef, useState } from 'react'

export type MeetingRoomParticipant = {
  userId: string
  displayName: string
  isOrganizer: boolean
  joinedAt: string
}

type RoomSignal = { fromUserId: string; signalType: 'offer' | 'answer' | 'ice'; payload: string }
type RoomPresenceEvent = MeetingRoomParticipant[]

function getHubUrl() {
  const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:5080/api'
  return `${apiUrl.replace(/\/api\/?$/, '')}/hubs/meeting-status`
}

export function useMeetingRoomPresence(meetingId: string | undefined) {
  const [participants, setParticipants] = useState<MeetingRoomParticipant[]>([])
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({})
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [isInRoom, setIsInRoom] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isCameraOff, setIsCameraOff] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const connectionRef = useRef<HubConnection | null>(null)
  const peersRef = useRef<Record<string, RTCPeerConnection>>({})
  const localStreamRef = useRef<MediaStream | null>(null)

  const sendSignal = useCallback(async (targetUserId: string, signalType: RoomSignal['signalType'], payload: RTCSessionDescriptionInit | RTCIceCandidateInit) => {
    const connection = connectionRef.current
    if (!connection || !meetingId) return
    await connection.invoke('SendWebRtcSignal', meetingId, targetUserId, signalType, JSON.stringify(payload)).catch(() => undefined)
  }, [meetingId])

  const closePeer = useCallback((userId: string) => {
    peersRef.current[userId]?.close()
    delete peersRef.current[userId]
    setRemoteStreams((current) => {
      const next = { ...current }
      delete next[userId]
      return next
    })
  }, [])

  const createPeer = useCallback((userId: string) => {
    const existing = peersRef.current[userId]
    if (existing) return existing
    const peer = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
    localStreamRef.current?.getTracks().forEach((track) => peer.addTrack(track, localStreamRef.current as MediaStream))
    peer.onicecandidate = (event) => { if (event.candidate) void sendSignal(userId, 'ice', event.candidate.toJSON()) }
    peer.ontrack = (event) => {
      const [stream] = event.streams
      if (stream) setRemoteStreams((current) => ({ ...current, [userId]: stream }))
    }
    peersRef.current[userId] = peer
    return peer
  }, [sendSignal])

  const leaveRoom = useCallback(async () => {
    const connection = connectionRef.current
    connectionRef.current = null
    Object.keys(peersRef.current).forEach(closePeer)
    localStreamRef.current?.getTracks().forEach((track) => track.stop())
    localStreamRef.current = null
    setLocalStream(null)
    setParticipants([])
    setRemoteStreams({})
    setIsInRoom(false)
    if (!connection) return
    if (connection.state === HubConnectionState.Connected && meetingId) await connection.invoke('LeaveRoom', meetingId).catch(() => undefined)
    await connection.stop().catch(() => undefined)
  }, [closePeer, meetingId])

  const enterRoom = useCallback(async () => {
    if (!meetingId || connectionRef.current) return
    setIsConnecting(true)
    setError(null)
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    } catch {
      setError('Mikrofon ve kamera erişimi verilemedi. Tarayıcı izinlerini kontrol edin.')
      setIsConnecting(false)
      return
    }
    localStreamRef.current = stream
    setLocalStream(stream)
    const connection = new HubConnectionBuilder().withUrl(getHubUrl()).withAutomaticReconnect().configureLogging(LogLevel.Warning).build()
    connectionRef.current = connection
    connection.on('roomPresenceChanged', (snapshot: RoomPresenceEvent) => setParticipants(snapshot))
    connection.on('roomParticipantLeft', ({ userId }: { userId: string }) => closePeer(userId))
    connection.on('roomParticipantJoined', async ({ userId }: { userId: string }) => {
      const peer = createPeer(userId)
      const offer = await peer.createOffer()
      await peer.setLocalDescription(offer)
      await sendSignal(userId, 'offer', offer)
    })
    connection.on('webrtcSignal', async ({ fromUserId, signalType, payload }: RoomSignal) => {
      const peer = createPeer(fromUserId)
      const signal = JSON.parse(payload) as RTCSessionDescriptionInit & RTCIceCandidateInit
      if (signalType === 'offer') {
        await peer.setRemoteDescription(signal)
        const answer = await peer.createAnswer()
        await peer.setLocalDescription(answer)
        await sendSignal(fromUserId, 'answer', answer)
      } else if (signalType === 'answer') {
        await peer.setRemoteDescription(signal)
      } else {
        await peer.addIceCandidate(signal)
      }
    })
    try {
      await connection.start()
      const snapshot = await connection.invoke<RoomPresenceEvent>('JoinRoom', meetingId)
      setParticipants(snapshot)
      setIsInRoom(true)
    } catch {
      await leaveRoom()
      setError('Toplantı odasına bağlanılamadı. Yetkinizi ve API bağlantısını kontrol edin.')
    } finally {
      setIsConnecting(false)
    }
  }, [closePeer, createPeer, leaveRoom, meetingId, sendSignal])

  const toggleMute = useCallback(() => {
    const nextMuted = !isMuted
    localStreamRef.current?.getAudioTracks().forEach((track) => { track.enabled = !nextMuted })
    setIsMuted(nextMuted)
  }, [isMuted])

  const toggleCamera = useCallback(async () => {
    if (!localStreamRef.current?.getVideoTracks().length) {
      try {
        const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true })
        const [cameraTrack] = cameraStream.getVideoTracks()
        if (!cameraTrack || !localStreamRef.current) return
        localStreamRef.current.addTrack(cameraTrack)
        Object.values(peersRef.current).forEach((peer) => peer.addTrack(cameraTrack, localStreamRef.current as MediaStream))
        setLocalStream(new MediaStream(localStreamRef.current.getTracks()))
        setIsCameraOff(false)
      } catch {
        setError('Kamera erişimi verilemedi. Kamera kapalı şekilde devam edebilirsiniz.')
      }
      return
    }
    const nextCameraOff = !isCameraOff
    localStreamRef.current?.getVideoTracks().forEach((track) => { track.enabled = !nextCameraOff })
    setIsCameraOff(nextCameraOff)
  }, [isCameraOff])

  useEffect(() => () => { void leaveRoom() }, [leaveRoom])

  return { participants, localStream, remoteStreams, isInRoom, isConnecting, isMuted, isCameraOff, error, enterRoom, leaveRoom, toggleMute, toggleCamera }
}
