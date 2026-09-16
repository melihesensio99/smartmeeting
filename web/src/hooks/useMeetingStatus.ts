import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

export function useMeetingStatus(meetingIds: string[]) {
  const queryClient = useQueryClient()
  const meetingKey = meetingIds.join('|')
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:5080/api'
    const hubUrl = `${apiUrl.replace(/\/api\/?$/, '')}/hubs/meeting-status`
    const connection = new HubConnectionBuilder().withUrl(hubUrl).configureLogging(LogLevel.Warning).withAutomaticReconnect().build()
    connection.on('meetingStatusChanged', () => { void queryClient.invalidateQueries({ queryKey: ['meetings'] }) })
    void connection.start().then(async () => {
      await Promise.all(meetingIds.map((meetingId) => connection.invoke('JoinMeeting', meetingId)))
    }).catch(() => undefined)
    return () => { connection.off('meetingStatusChanged'); void connection.stop() }
  }, [queryClient, meetingKey])
}
