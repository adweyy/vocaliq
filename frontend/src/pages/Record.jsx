import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../context/SessionContext'
import { Square } from 'lucide-react'

export default function Record() {
  const navigate = useNavigate()
  const { setAudioBlob } = useSession()
  const [seconds, setSeconds] = useState(0)
  const [bars, setBars] = useState(Array(48).fill(2))

  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const analyzerRef = useRef(null)
  const animFrameRef = useRef(null)
  const timerRef = useRef(null)
  const streamRef = useRef(null)

  useEffect(() => { startRecording(); return () => stopAll() }, [])

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      const analyzer = audioCtx.createAnalyser()
      analyzer.fftSize = 128
      analyzerRef.current = analyzer
      audioCtx.createMediaStreamSource(stream).connect(analyzer)

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : ''

      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : {})
      mediaRecorderRef.current = mr
      chunksRef.current = []
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' })
        setAudioBlob(blob)
        navigate('/processing')
      }
      mr.start(100)
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000)
      drawWaveform()
    } catch {
      alert('Microphone access denied.')
      navigate('/prepare')
    }
  }

  function drawWaveform() {
    if (!analyzerRef.current) return
    const data = new Uint8Array(analyzerRef.current.frequencyBinCount)
    analyzerRef.current.getByteFrequencyData(data)
    setBars(Array.from({ length: 48 }, (_, i) => {
      const val = data[Math.floor((i / 48) * data.length)] / 255
      return Math.max(2, Math.floor(val * 64))
    }))
    animFrameRef.current = requestAnimationFrame(drawWaveform)
  }

  function stopAll() {
    clearInterval(timerRef.current)
    cancelAnimationFrame(animFrameRef.current)
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
  }

  function handleStop() {
    stopAll()
    if (mediaRecorderRef.current?.state !== 'inactive') mediaRecorderRef.current.stop()
  }

  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8 bg-bg">
      <div className="w-full max-w-lg text-center">

        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" />
          <span className="text-xs text-danger tracking-widest uppercase font-medium">Recording</span>
        </div>

        <div className="font-mono text-6xl font-medium text-text mb-14 tracking-tight">
          {fmt(seconds)}
        </div>

        <div className="flex items-center justify-center gap-0.5 h-16 mb-14">
          {bars.map((h, i) => (
            <div key={i}
              style={{ height: `${h}px`, transition: 'height 0.06s ease', opacity: 0.6 + (h / 64) * 0.4 }}
              className="w-1 rounded-full bg-accent"
            />
          ))}
        </div>

        <p className="text-xs text-muted mb-10">
          Speak clearly. Pause naturally. Stop when done.
        </p>

        <button onClick={handleStop}
          className="flex items-center gap-2 px-6 py-2.5 border border-danger/40 text-danger text-sm font-medium rounded hover:bg-danger/5 transition-all mx-auto">
          <Square size={14} fill="currentColor" /> Stop recording
        </button>

        {seconds < 10 && (
          <p className="text-xs text-muted mt-6">Recommended minimum: 30 seconds</p>
        )}
      </div>
    </div>
  )
}