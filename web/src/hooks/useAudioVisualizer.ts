import { useEffect, useState } from 'react'

const BAR_COUNT = 32

export function useAudioVisualizer(stream: MediaStream | null): number[] {
  const [levels, setLevels] = useState<number[]>(() => Array.from({ length: BAR_COUNT }, () => 0.08))

  useEffect(() => {
    if (!stream) {
      setLevels(Array.from({ length: BAR_COUNT }, () => 0.08))
      return
    }

    const audioContext = new AudioContext()
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 128
    analyser.smoothingTimeConstant = 0.75
    const source = audioContext.createMediaStreamSource(stream)
    source.connect(analyser)
    const data = new Uint8Array(analyser.frequencyBinCount)
    let animationFrame = 0

    const update = () => {
      analyser.getByteFrequencyData(data)
      const nextLevels = Array.from({ length: BAR_COUNT }, (_, index) => {
        const start = Math.floor(index * data.length / BAR_COUNT)
        const end = Math.max(start + 1, Math.floor((index + 1) * data.length / BAR_COUNT))
        const total = data.slice(start, end).reduce((sum, value) => sum + value, 0)
        return Math.max(0.08, Math.min(1, total / ((end - start) * 255)))
      })
      setLevels(nextLevels)
      animationFrame = window.requestAnimationFrame(update)
    }

    update()
    return () => { window.cancelAnimationFrame(animationFrame); source.disconnect(); analyser.disconnect(); void audioContext.close() }
  }, [stream])

  return levels
}
