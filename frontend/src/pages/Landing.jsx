import { useNavigate } from 'react-router-dom'
import { ArrowRight, Mic } from 'lucide-react'

const METRICS = [
  { label: 'Pace & WPM', desc: 'Ideal range detection' },
  { label: 'Filler words', desc: 'Per-minute frequency' },
  { label: 'Pitch variation', desc: 'Monotone detection' },
  { label: 'Confidence score', desc: 'Language analysis' },
  { label: 'Volume consistency', desc: 'Trailing off detection' },
  { label: 'Clarity index', desc: 'Sentence structure' },
  { label: 'Pause quality', desc: 'Strategic vs nervous' },
  { label: 'Vocabulary', desc: 'Type-token ratio' },
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-accent rounded-sm" />
          <span className="text-sm font-medium tracking-tight">VocalIQ</span>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/dashboard')} className="text-xs text-muted hover:text-text transition-colors">Dashboard</button>
          <button onClick={() => navigate('/prepare')} className="btn-primary text-xs py-2 px-4">Get started</button>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-8">
            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span className="text-xs text-muted-light tracking-widest uppercase font-medium">AI Speech Analysis</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-semibold tracking-tight leading-tight mb-6 text-text">
            Sound like you<br /><span className="text-accent">mean it.</span>
          </h1>

          <p className="text-base text-muted-light leading-relaxed mb-10 max-w-md mx-auto">
            Record a speech. VocalIQ measures 8 parameters — pace, fillers, pitch, confidence — and tells you exactly where you're losing the room.
          </p>

          <div className="flex items-center justify-center gap-3">
            <button onClick={() => navigate('/prepare')} className="btn-primary">
              <Mic size={15} /> Start recording <ArrowRight size={14} />
            </button>
            <button onClick={() => navigate('/dashboard')} className="btn-ghost">
              View dashboard
            </button>
          </div>
        </div>

        <div className="mt-24 w-full max-w-3xl mx-auto">
          <p className="label mb-5">What gets measured</p>
          <div className="grid grid-cols-4 gap-px bg-border rounded-lg overflow-hidden border border-border">
            {METRICS.map((m) => (
              <div key={m.label} className="bg-surface px-4 py-4">
                <div className="text-xs font-medium text-text mb-1">{m.label}</div>
                <div className="text-xs text-muted">{m.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 mb-8 text-xs text-muted">
          Built with Whisper AI + librosa — runs fully on your machine
        </div>
      </main>
    </div>
  )
}