import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../context/SessionContext'
import { Mic, Check, ChevronRight, ArrowLeft } from 'lucide-react'

const STEPS = ['Environment', 'Context', 'Topic', 'Ready']

const CONTEXTS = [
  { id: 'interview', label: 'Job Interview', desc: 'Q&A style, measured pace' },
  { id: 'sales', label: 'Sales Pitch', desc: 'Persuasion & confidence' },
  { id: 'presentation', label: 'Presentation', desc: 'Structure & clarity' },
  { id: 'public_speaking', label: 'Public Speaking', desc: 'Energy & authority' },
]

const CHECKLIST = [
  "Quiet room, minimal background noise",
  "Microphone close — within arm's reach",
  'Browser microphone permission enabled',
  "No distractions — you're focused",
]

export default function Prepare() {
  const navigate = useNavigate()
  const { sessionConfig, setSessionConfig } = useSession()
  const [step, setStep] = useState(0)
  const [checks, setChecks] = useState([false, false, false, false])
  const [micOk, setMicOk] = useState(null)
  const [countdown, setCountdown] = useState(30)
  const [counting, setCounting] = useState(false)

  async function testMic() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(t => t.stop())
      setMicOk(true)
      setChecks(prev => { const c = [...prev]; c[2] = true; return c })
    } catch {
      setMicOk(false)
    }
  }

  useEffect(() => {
    if (step === 3) { setCounting(true); setCountdown(30) }
  }, [step])

  useEffect(() => {
    if (!counting) return
    if (countdown === 0) { navigate('/record'); return }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [counting, countdown, navigate])

  const allChecked = checks.every(Boolean)

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-border">
        <button onClick={() => step > 0 ? setStep(s => s - 1) : navigate('/')}
          className="flex items-center gap-1.5 text-xs text-muted hover:text-text transition-colors">
          <ArrowLeft size={14} /> Back
        </button>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-accent rounded-sm" />
          <span className="text-sm font-medium">VocalIQ</span>
        </div>
        <span className="text-xs text-muted font-mono">{step + 1}/{STEPS.length}</span>
      </nav>

      <div className="flex border-b border-border">
        {STEPS.map((s, i) => (
          <div key={s} className={`flex-1 py-3 text-center text-xs font-medium tracking-widest uppercase transition-all
            ${i === step ? 'text-accent border-b border-accent' : i < step ? 'text-muted-light' : 'text-muted'}`}>
            {s}
          </div>
        ))}
      </div>

      <div className="flex-1 flex items-center justify-center px-8 py-16">
        <div className="w-full max-w-md">

          {step === 0 && (
            <div>
              <p className="label mb-3">Step 1</p>
              <h2 className="text-2xl font-semibold tracking-tight mb-1">Set up your space</h2>
              <p className="text-sm text-muted-light mb-8">Good audio quality = accurate analysis.</p>

              <div className="space-y-2 mb-6">
                {CHECKLIST.map((item, i) => (
                  <button key={i} onClick={() => setChecks(prev => { const c = [...prev]; c[i] = !c[i]; return c })}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-lg border text-left transition-all text-sm
                      ${checks[i] ? 'border-accent/30 bg-accent-dim text-text' : 'border-border bg-surface text-muted-light hover:text-text'}`}>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all
                      ${checks[i] ? 'border-accent bg-accent' : 'border-border'}`}>
                      {checks[i] && <Check size={10} className="text-bg" strokeWidth={3} />}
                    </div>
                    {item}
                  </button>
                ))}
              </div>

              <div className={`flex items-center justify-between p-3.5 rounded-lg border mb-6 transition-all
                ${micOk ? 'border-success/30 bg-success/5' : 'border-border bg-surface'}`}>
                <div>
                  <div className="text-xs font-medium text-text mb-0.5">Microphone test</div>
                  <div className="text-xs text-muted">
                    {micOk === null && 'Click to verify your mic is working'}
                    {micOk === true && 'Microphone detected'}
                    {micOk === false && 'Not detected — check browser permissions'}
                  </div>
                </div>
                <button onClick={testMic}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all
                    ${micOk ? 'bg-success/10 text-success border border-success/20' : 'bg-surface2 text-muted-light border border-border hover:text-text'}`}>
                  <Mic size={12} /> Test
                </button>
              </div>

              <button onClick={() => setStep(1)} disabled={!allChecked}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-accent text-bg text-sm font-medium rounded disabled:bg-surface2 disabled:text-muted disabled:cursor-not-allowed transition-all hover:bg-white">
                Continue <ChevronRight size={15} />
              </button>
            </div>
          )}

          {step === 1 && (
            <div>
              <p className="label mb-3">Step 2</p>
              <h2 className="text-2xl font-semibold tracking-tight mb-1">What are you practicing?</h2>
              <p className="text-sm text-muted-light mb-8">Tailor the analysis to your context.</p>
              <div className="grid grid-cols-2 gap-2 mb-6">
                {CONTEXTS.map(c => (
                  <button key={c.id} onClick={() => setSessionConfig(prev => ({ ...prev, context: c.id }))}
                    className={`p-4 rounded-lg border text-left transition-all
                      ${sessionConfig.context === c.id ? 'border-accent/40 bg-accent-dim' : 'border-border bg-surface hover:border-muted'}`}>
                    <div className={`text-sm font-medium mb-1 ${sessionConfig.context === c.id ? 'text-accent' : 'text-text'}`}>{c.label}</div>
                    <div className="text-xs text-muted">{c.desc}</div>
                  </button>
                ))}
              </div>
              <button onClick={() => setStep(2)}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-accent text-bg text-sm font-medium rounded transition-all hover:bg-white">
                Continue <ChevronRight size={15} />
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <p className="label mb-3">Step 3</p>
              <h2 className="text-2xl font-semibold tracking-tight mb-1">What's your topic?</h2>
              <p className="text-sm text-muted-light mb-8">Gives the AI context to evaluate relevance.</p>
              <textarea
                value={sessionConfig.topic}
                onChange={e => setSessionConfig(prev => ({ ...prev, topic: e.target.value }))}
                placeholder={
                  sessionConfig.context === 'interview' ? 'e.g. Tell me about yourself' :
                  sessionConfig.context === 'sales' ? 'e.g. Pitching a SaaS tool to a startup founder' :
                  sessionConfig.context === 'presentation' ? 'e.g. Q3 performance review' :
                  'e.g. Why young people should care about climate'
                }
                rows={4}
                className="w-full bg-surface2 border border-border rounded-lg px-4 py-3 text-sm text-text placeholder-muted outline-none focus:border-muted-light transition-colors resize-none mb-3"
              />
              <button onClick={() => setStep(3)}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-accent text-bg text-sm font-medium rounded transition-all hover:bg-white mb-2">
                Continue <ChevronRight size={15} />
              </button>
              <button onClick={() => setStep(3)} className="w-full py-2 text-xs text-muted hover:text-text transition-colors">
                Skip
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="text-center">
              <p className="label mb-3">Step 4</p>
              <h2 className="text-2xl font-semibold tracking-tight mb-1">Get ready to speak</h2>
              <p className="text-sm text-muted-light mb-8">Recording will start automatically.</p>
              <div className="flex items-center justify-center w-32 h-32 mx-auto rounded-full bg-accent/10 border border-accent/20 mb-8">
                <span className="text-4xl font-semibold font-mono text-accent">{countdown}s</span>
              </div>
              <button onClick={() => navigate('/record')}
                className="w-full py-2.5 bg-accent text-bg text-sm font-medium rounded transition-all hover:bg-white">
                Start Now
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}