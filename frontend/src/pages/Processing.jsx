import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../context/SessionContext'
import axios from 'axios'

const STEPS = [
  'Uploading recording',
  'Transcribing with Whisper',
  'Analyzing acoustic signals',
  'Detecting filler words',
  'Scoring confidence language',
  'Generating your report',
]

export default function Processing() {
  const navigate = useNavigate()
  const { audioBlob, sessionConfig, setAnalysisResult } = useSession()
  const [stepIdx, setStepIdx] = useState(0)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!audioBlob) { navigate('/'); return }
    runAnalysis()
    const delays = [0, 2000, 5000, 8000, 10000, 12000]
    const timers = delays.map((d, i) => setTimeout(() => setStepIdx(i), d))
    return () => timers.forEach(clearTimeout)
  }, [])

  async function runAnalysis() {
    try {
      const form = new FormData()
      form.append('audio', audioBlob, 'recording.webm')
      form.append('context', sessionConfig.context)
      form.append('topic', sessionConfig.topic)
      const { data } = await axios.post('/api/analyze', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      })
      setAnalysisResult(data)
      navigate('/results')
    } catch (err) {
      setError(err.response?.data?.detail || 'Analysis failed. Please try again.')
    }
  }

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8">
      <div className="w-full max-w-sm text-center">
        <div className="text-xs text-danger tracking-widest uppercase mb-4">Error</div>
        <h2 className="text-xl font-semibold mb-2">Analysis failed</h2>
        <p className="text-sm text-muted-light mb-8">{error}</p>
        <button onClick={() => navigate('/prepare')} className="btn-primary mx-auto">Try again</button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-4 h-4 bg-accent rounded-sm" />
          <span className="text-sm font-medium">VocalIQ</span>
        </div>

        <h2 className="text-2xl font-semibold tracking-tight mb-1">Analyzing</h2>
        <p className="text-sm text-muted-light mb-10">Usually takes 20–60 seconds.</p>

        <div className="space-y-4">
          {STEPS.map((s, i) => (
            <div key={i} className={`flex items-center gap-3 text-sm transition-all duration-300
              ${i < stepIdx ? 'text-muted' : i === stepIdx ? 'text-text' : 'text-muted'}`}>
              <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 text-xs transition-all
                ${i < stepIdx ? 'border-success/40 bg-success/10 text-success' :
                  i === stepIdx ? 'border-accent/60 bg-accent-dim' : 'border-border'}`}>
                {i < stepIdx ? '✓' : i === stepIdx ? (
                  <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                ) : ''}
              </div>
              {s}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}