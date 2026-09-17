import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr'
import { useCallback, useEffect, useRef, useState } from 'react'

export type MeetingRoomParticipant = {
  userId: string
  displayName: string
  isOrganizer: boolean
  joinedAt: string
}

type RoomPresenceEvent = MeetingRoomParticipant[]

function getHubUrl() {
  const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:5080/api'
  return `${apiUrl.replace(/\/api\/?$/, '')}/hubs/meeting-status`
}

export function useMeetingRoomPresence(meetingId: string | undefined) {
  const [participants, setParticipants] = useState<MeetingRoomParticipant[]>([])
  const [isInRoom, setIsInRoom] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const connectionRef = useRef<HubConnection | null>(null)

  const leaveRoom = useCallback(async () => {
    const connection = connectionRef.current
    connectionRef.current = null
    setIsInRoom(false)
    setParticipants([])
    if (!connection) return
    if (connection.state === HubConnectionState.Connected && meetingId) {
      await connection.invoke('LeaveRoom', meetingId).catch(() => undefined)
    }
    await connection.stop().catch(() => undefined)
  }, [meetingId])

  const enterRoom = useCallback(async () => {
    if (!meetingId || connectionRef.current) return
    setIsConnecting(true)
    setError(null)
    const connection = new HubConnectionBuilder()
      .withUrl(getHubUrl())
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build()

    const onPresenceChanged = (snapshot: RoomPresenceEvent) => setParticipants(snapshot)
    connection.on('roomPresenceChanged', onPresenceChanged)
    connectionRef.current = connection

    try {
      await connection.start()
      const snapshot = await connection.invoke<RoomPresenceEvent>('JoinRoom', meetingId)
      setParticipants(snapshot)
      setIsInRoom(true)
    } catch {
      connection.off('roomPresenceChanged', onPresenceChanged)
      connectionRef.current = null
      await connection.stop().catch(() => undefined)
      setError('Toplantı odasına girilemedi. Yetkinizi ve API bağlantısını kontrol edin.')
    } finally {
      setIsConnecting(false)
    }
  }, [meetingId])

  useEffect(() => () => {
    void leaveRoom()
  }, [leaveRoom])

  return { participants, isInRoom, isConnecting, error, enterRoom, leaveRoom }
}
