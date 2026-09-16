import { useCallback, useEffect, useRef, useState } from 'react'
type RecorderState = 'idle' | 'recording' | 'stopped'
export function useAudioRecorder() {
  const recorderRef = useRef<MediaRecorder | null>(null); const chunksRef = useRef<Blob[]>([]); const [state, setState] = useState<RecorderState>('idle'); const [stream, setStream] = useState<MediaStream | null>(null); const [elapsedSeconds, setElapsedSeconds] = useState(0)
  useEffect(() => { if (state !== 'recording') return; const timer = window.setInterval(() => setElapsedSeconds((value) => value + 1), 1000); return () => window.clearInterval(timer) }, [state])
  const start = useCallback(async () => { const microphoneStream = await navigator.mediaDevices.getUserMedia({ audio: true }); chunksRef.current = []; const recorder = new MediaRecorder(microphoneStream); recorder.ondataavailable = (event) => { if (event.data.size > 0) chunksRef.current.push(event.data) }; recorder.onstop = () => microphoneStream.getTracks().forEach((track) => track.stop()); recorder.start(); recorderRef.current = recorder; setStream(microphoneStream); setElapsedSeconds(0); setState('recording') }, [])
  const stop = useCallback((): Promise<Blob | null> => new Promise((resolve) => { const recorder = recorderRef.current; if (!recorder) { resolve(null); return } recorder.onstop = () => { setStream(null); setState('stopped'); resolve(new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })) }; recorder.stop(); recorderRef.current = null }), [])
  return { state, stream, elapsedSeconds, start, stop }
}
