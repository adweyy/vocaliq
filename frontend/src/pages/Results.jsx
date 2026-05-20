import { useSession } from '../context/SessionContext'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { Download, RotateCcw, LayoutDashboard } from 'lucide-react'
import axios from 'axios'

const SCORE_LABELS = {
  pace: 'Pace',
  pause_quality: 'Pauses',
  volume_consistency: 'Volume',
  pitch_variation: 'Pitch',
  filler_control: 'Fillers',
  confidence_language: 'Confidence',
  clarity: 'Clarity',
  vocabulary: 'Vocabulary',
}

function scoreColor(s) {
  if (s >= 75) return '#3DCC7E'
  if (s >= 50) return '#E8FF6B'
  return '#FF4444'
}

function ScoreRow({ label, value }) {
  const color = scoreColor(value)
  return (
    <div className="flex items-center gap-4 py-3 border-b border-border last:border-0">
      <span className="text-xs text-muted-light w-28 flex-shrink-0">{label}</span>
      <div className="flex-1 h-px bg-surface2 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="text-xs font-mono font-medium w-10 text-right" style={{ color }}>{value}</span>
    </div>
  )
}

function OverallRing({ score }) {
  const color = scoreColor(score)
  const r = 52
  const circ = 2 * Math.PI * r
  return (
    <div className="relative w-32 h-32">
      <svg className="-rotate-90 w-full h-full" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#222227" strokeWidth="8" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${circ * score / 100} ${circ}`} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono font-semibold text-3xl text-text">{score}</span>
        <span className="text-xs text-muted">/100</span>
      </div>
    </div>
  )
}

export default function Results() {
  const navigate = useNavigate()
  const { analysisResult, sessionConfig } = useSession()

  useEffect(() => { if (!analysisResult) navigate('/') }, [analysisResult, navigate])
  if (!analysisResult) return null

  const { scores, transcript, duration, word_count, text_metrics } = analysisResult
  const overall = scores?.overall ?? 0
  const sub_scores = scores?.sub_scores ?? {}
  const wpm = scores?.wpm ?? 0
  const tips = scores?.tips ?? []

  const radarData = Object.entries(sub_scores).map(([key, val]) => ({
    subject: SCORE_LABELS[key] || key, score: val,
  }))

  const fillerWords = text_metrics?.fillers?.highlighted_words || []
  const mins = Math.floor(duration / 60)
  const secs = Math.round(duration % 60)

  async function downloadPDF() {
    try {
      const res = await axios.post('/api/generate-pdf', analysisResult, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url; a.download = 'vocaliq_report.pdf'; a.click()
      URL.revokeObjectURL(url)
    } catch { alert('PDF generation failed.') }
  }

  const verdict = overall >= 80 ? 'Excellent' : overall >= 65 ? 'Good' : overall >= 50 ? 'Developing' : 'Needs work'

  return (
    <div className="min-h-screen pb-20">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-border sticky top-0 bg-bg/95 backdrop-blur z-10">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-accent rounded-sm" />
          <span className="text-sm font-medium">VocalIQ</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="text-xs text-muted hover:text-text transition-colors flex items-center gap-1.5">
            <LayoutDashboard size={13} /> Dashboard
          </button>
          <button onClick={() => navigate('/prepare')} className="text-xs text-muted hover:text-text transition-colors flex items-center gap-1.5">
            <RotateCcw size={13} /> New session
          </button>
          <button onClick={downloadPDF} className="btn-primary text-xs py-2 px-4">
            <Download size={13} /> PDF report
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-8 pt-12">
        <div className="mb-10">
          <p className="label mb-2">
            {sessionConfig.context.replace('_', ' ')} · {mins > 0 ? `${mins}m ` : ''}{secs}s · {word_count} words · {wpm} WPM
          </p>
          <h1 className="text-4xl font-semibold tracking-tight">Your results</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="card p-6 flex items-center gap-6">
            <OverallRing score={overall} />
            <div>
              <p className="label mb-2">Overall score</p>
              <div className="text-xl font-semibold text-text mb-1">{verdict}</div>
              <div className="text-xs text-muted-light leading-relaxed">
                {overall >= 80 ? 'Strong across all dimensions.'
                  : overall >= 65 ? 'Solid foundation with clear areas to improve.'
                  : overall >= 50 ? 'Keep practicing — the gap is closable.'
                  : 'Focus on the coaching tips below.'}
              </div>
            </div>
          </div>

          <div className="card p-6">
            <p className="label mb-4">Skills radar</p>
            <ResponsiveContainer width="100%" height={180}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#222227" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#5A5A6E', fontSize: 9, fontFamily: 'Inter' }} />
                <Radar dataKey="score" stroke="#E8FF6B" fill="#E8FF6B" fillOpacity={0.12} strokeWidth={1.5} />
                <Tooltip contentStyle={{ background: '#131315', border: '1px solid #222227', borderRadius: 6, fontSize: 11 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6 mb-4">
          <p className="label mb-4">Detailed scores</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
            {Object.entries(sub_scores).map(([key, val]) => (
              <ScoreRow key={key} label={SCORE_LABELS[key] || key} value={val} />
            ))}
          </div>
        </div>

        {tips.length > 0 && (
          <div className="card p-6 mb-4">
            <p className="label mb-4">Coaching</p>
            <div className="space-y-2">
              {tips.map((tip, i) => (
                <div key={i} className="flex gap-4 p-4 bg-surface2 rounded-lg border border-border">
                  <div className="text-xs font-medium text-accent w-24 flex-shrink-0 pt-0.5">{tip.category}</div>
                  <div className="text-xs text-muted-light leading-relaxed">{tip.message}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card p-6 mb-4 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <p className="label">Transcript</p>
            <span className="flex items-center gap-1.5 text-xs text-muted">
              <span className="w-2 h-2 rounded-sm bg-danger/30 border border-danger/40 inline-block" />
              Filler word
            </span>
          </div>
          <div className="text-sm leading-7 text-muted-light break-words whitespace-pre-wrap overflow-hidden font-mono">
            {fillerWords.length > 0
              ? fillerWords.map((w, i) => (
                  <span key={i}>
                    {w.is_filler
                      ? <mark className="bg-danger/15 text-danger rounded px-0.5 not-italic">{w.word}</mark>
                      : <span className="mr-1">{w.word}</span>}
                  </span>
                ))
              : transcript}
          </div>

          {text_metrics?.fillers?.top_fillers?.length > 0 && (
            <div className="mt-5 pt-5 border-t border-border">
              <p className="text-xs text-muted mb-3">Most used fillers</p>
              <div className="flex flex-wrap gap-2">
                {text_metrics.fillers.top_fillers.map(f => (
                  <span key={f.word} className="px-2.5 py-1 rounded border border-danger/20 bg-danger/5 text-danger text-xs font-mono">
                    "{f.word}" ×{f.count}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {text_metrics?.confidence && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="card p-5">
              <p className="label mb-4">Strong phrases</p>
              {text_metrics.confidence.strong_examples?.length > 0
                ? text_metrics.confidence.strong_examples.map((e, i) => (
                    <div key={i} className="text-xs text-success mb-2 font-mono">+ "{e}"</div>
                  ))
                : <div className="text-xs text-muted">None detected</div>}
            </div>
            <div className="card p-5">
              <p className="label mb-4">Weak phrases</p>
              {text_metrics.confidence.weak_examples?.length > 0
                ? text_metrics.confidence.weak_examples.map((e, i) => (
                    <div key={i} className="text-xs text-danger/70 mb-2 font-mono">- "{e}"</div>
                  ))
                : <div className="text-xs text-muted">None detected — great.</div>}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={downloadPDF} className="flex-1 btn-primary justify-center">
            <Download size={15} /> Download PDF
          </button>
          <button onClick={() => navigate('/prepare')} className="flex-1 btn-ghost justify-center">
            <RotateCcw size={15} /> Practice again
          </button>
        </div>
      </div>
    </div>
  )
}