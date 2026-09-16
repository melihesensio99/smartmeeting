import { useCallback, useRef, useState } from 'react'
type RecorderState = 'idle' | 'recording' | 'stopped'
export function useAudioRecorder() {
  const recorderRef = useRef<MediaRecorder | null>(null); const chunksRef = useRef<Blob[]>([]); const [state, setState] = useState<RecorderState>('idle')
  const start = useCallback(async () => { const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); chunksRef.current = []; const recorder = new MediaRecorder(stream); recorder.ondataavailable = (event) => { if (event.data.size > 0) chunksRef.current.push(event.data) }; recorder.onstop = () => stream.getTracks().forEach((track) => track.stop()); recorder.start(); recorderRef.current = recorder; setState('recording') }, [])
  const stop = useCallback(() => { const recorder = recorderRef.current; if (!recorder) return null; recorder.stop(); recorderRef.current = null; setState('stopped'); return new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' }) }, [])
  return { state, start, stop }
}
