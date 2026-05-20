import { useNavigate } from 'react-router-dom'
import { Mic, TrendingUp } from 'lucide-react'

// Phase 2 will connect this to Supabase for real session history.
// For now, shows a placeholder state.
export default function Dashboard() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-dark-border">
        <span className="font-syne font-bold text-xl text-brand-purple">VocalIQ</span>
        <button onClick={() => navigate('/prepare')}
          className="flex items-center gap-2 px-4 py-2 bg-brand-purple hover:bg-[#6357e0] rounded-lg text-sm font-syne font-semibold transition-all">
          <Mic size={14} /> New Session
        </button>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="font-syne font-bold text-4xl mb-2">Dashboard</h1>
        <p className="text-muted mb-12">Track your improvement over time.</p>

        {/* Empty state */}
        <div className="bg-dark-surface border border-dark-border rounded-2xl p-16 text-center">
          <TrendingUp size={48} className="text-brand-purple mx-auto mb-4 opacity-40" />
          <h3 className="font-syne font-bold text-xl mb-2">No sessions yet</h3>
          <p className="text-muted text-sm mb-8 max-w-sm mx-auto">
            Complete your first recording and the dashboard will show your scores and progress over time.
          </p>
          <button onClick={() => navigate('/prepare')}
            className="flex items-center gap-2 px-6 py-3 bg-brand-purple hover:bg-[#6357e0] rounded-xl font-syne font-semibold transition-all mx-auto">
            <Mic size={16} /> Start First Session
          </button>
        </div>

        {/* Phase 2 note */}
        <p className="text-xs text-muted text-center mt-8">
          Session history and progress tracking coming in Phase 2 (Supabase integration)
        </p>
      </div>
    </div>
  )
}
