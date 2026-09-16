import { useCallback, useRef, useState } from 'react'
type RecorderState = 'idle' | 'recording' | 'stopped'
export function useAudioRecorder() {
  const recorderRef = useRef<MediaRecorder | null>(null); const chunksRef = useRef<Blob[]>([]); const [state, setState] = useState<RecorderState>('idle')
  const start = useCallback(async () => { const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); chunksRef.current = []; const recorder = new MediaRecorder(stream); recorder.ondataavailable = (event) => { if (event.data.size > 0) chunksRef.current.push(event.data) }; recorder.onstop = () => stream.getTracks().forEach((track) => track.stop()); recorder.start(); recorderRef.current = recorder; setState('recording') }, [])
  const stop = useCallback((): Promise<Blob | null> => new Promise((resolve) => { const recorder = recorderRef.current; if (!recorder) { resolve(null); return } recorder.onstop = () => { setState('stopped'); resolve(new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })) }; recorder.stop(); recorderRef.current = null }), [])
  return { state, start, stop }
}
