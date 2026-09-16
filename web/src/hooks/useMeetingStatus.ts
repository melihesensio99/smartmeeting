import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

export function useMeetingStatus() {
  const queryClient = useQueryClient()
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:5080/api'
    const hubUrl = `${apiUrl.replace(/\/api\/?$/, '')}/hubs/meeting-status`
    const connection = new HubConnectionBuilder().withUrl(hubUrl).configureLogging(LogLevel.Warning).withAutomaticReconnect().build()
    connection.on('meetingStatusChanged', () => { void queryClient.invalidateQueries({ queryKey: ['meetings'] }) })
    void connection.start()
    return () => { connection.off('meetingStatusChanged'); void connection.stop() }
  }, [queryClient])
}
