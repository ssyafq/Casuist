'use client'

import Navbar from '@/components/Navbar'
import { useSearchParams, useRouter } from 'next/navigation'
import { useState, Suspense } from 'react'
import { calculateScore, type ScoreResult } from '@/lib/scoring'
import { getStudentRanking, getSectionsViewed, getTimeTaken, getCorrectRanking, getCaseContext, clearSession } from '@/lib/session'
import { API_BASE } from '@/lib/mock-case'
import { ArrowRight, ChevronDown, Sparkles, Loader2, AlertCircle, ClipboardList } from 'lucide-react'

function barColor(score: number, max: number): string {
  if (score === 0) return 'bg-border'
  const pct = score / max
  if (pct >= 1) return 'bg-emerald-500'
  if (pct >= 0.5) return 'bg-[#2E86C1]'
  return 'bg-amber-500'
}

function ScorecardPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const specialty = searchParams.get('specialty') || 'cardiology'
  const [showFeedback, setShowFeedback] = useState(false)

  // Feedback state
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [feedbackError, setFeedbackError] = useState<string | null>(null)
  const [feedbackText, setFeedbackText] = useState<string | null>(null)
  const [feedbackCitations, setFeedbackCitations] = useState<
    Array<{ pmid: string; title: string; authors: string }>
  >([])

  const [timeTaken] = useState(() => {
    if (typeof window === 'undefined') return 0
    return getTimeTaken()
  })

  const [hasData] = useState(() => {
    if (typeof window === 'undefined') return false
    return getStudentRanking().length > 0
  })

  const [scores] = useState<ScoreResult>(() => {
    if (typeof window === 'undefined' || !hasData) {
      return { accuracy_score: 0, ranking_score: 0, efficiency_score: 0, speed_score: 0, total: 0, grade: 'D' as const }
    }
    const studentRanking = getStudentRanking()
    const sectionsViewed = getSectionsViewed()
    const correctRanking = getCorrectRanking()
    return calculateScore(correctRanking, studentRanking, sectionsViewed, timeTaken)
  })

  const handleNextCase = () => {
    clearSession()
    router.push(`/case?specialty=${specialty}`)
  }

  const handleBackToSpecialties = () => {
    clearSession()
    router.push('/specialties')
  }

  const handleShowFeedback = async () => {
    // If already loaded, just toggle visibility
    if (feedbackText !== null) {
      setShowFeedback(!showFeedback)
      return
    }

    // First click: fetch from API
    setShowFeedback(true)
    setFeedbackLoading(true)
    setFeedbackError(null)

    const caseCtx = getCaseContext()
    if (!caseCtx) {
      setFeedbackError('Case data not available.')
      setFeedbackLoading(false)
      return
    }

    const studentRanking = getStudentRanking()

    try {
      const res = await fetch(`${API_BASE}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          specialty: caseCtx.specialty,
          correct_diagnosis: caseCtx.correct_diagnosis,
          student_top_diagnosis: studentRanking[0] || '',
          chief_complaint: caseCtx.chief_complaint,
          history: caseCtx.history,
          exam: caseCtx.exam,
          labs: caseCtx.labs,
        }),
      })

      if (res.status === 429) {
        setFeedbackError('Rate limit reached. Please wait 60 seconds and try again.')
        setFeedbackLoading(false)
        return
      }
      if (res.status === 503) {
        setFeedbackError('AI feedback service is temporarily unavailable.')
        setFeedbackLoading(false)
        return
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setFeedbackError(body.detail || `Server error (${res.status})`)
        setFeedbackLoading(false)
        return
      }

      const data = await res.json()
      setFeedbackText(data.feedback_text)
      setFeedbackCitations(data.citations ?? [])
    } catch {
      setFeedbackError('Network error. Make sure the API server is running.')
    } finally {
      setFeedbackLoading(false)
    }
  }

  if (!hasData) {
    return (
      <div className="min-h-screen bg-[#f8f8f6]">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center px-6 min-h-[calc(100vh-64px)]">
          <div className="text-center max-w-md">
            <ClipboardList className="h-14 w-14 text-border mx-auto mb-4" />
            <h1 className="text-2xl font-medium tracking-tight text-foreground mb-2">No case data found</h1>
            <p className="text-muted-foreground mb-8">It looks like you haven&apos;t completed a case yet. Start one to see your scorecard.</p>
            <button
              onClick={() => { clearSession(); router.push('/specialties') }}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2E86C1] px-6 py-3 text-sm font-medium text-white shadow-md transition-all duration-200 hover:scale-[1.02] hover:bg-[#2576AB] hover:shadow-lg"
            >
              Start a Case
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f8f6] flex flex-col">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-3xl px-6 pt-10 pb-8 flex flex-col gap-6">
        {/* Score + Grade */}
        <div className="text-center">
          <h1 className="text-4xl font-medium tracking-tight text-foreground">
            <span className="font-mono">{scores.total}</span>
            <span className="text-muted-foreground/40 mx-1">/</span>
            <span className="font-mono text-muted-foreground">100</span>
          </h1>
          <span className="inline-block mt-2 px-4 py-1 bg-[#2E86C1]/10 border border-[#2E86C1]/20 text-[#2E86C1] rounded-full text-sm font-medium">
            Grade: {scores.grade}
          </span>
        </div>

        {/* Breakdown Cards — 2x2 grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border/60 bg-white p-4">
            <p className="text-xs text-muted-foreground mb-1">Diagnosis Accuracy</p>
            <p className="text-lg font-medium text-foreground font-mono">{scores.accuracy_score}/40</p>
            <div className="mt-2 h-1 w-full bg-muted rounded-full overflow-hidden">
              <div className={`h-full ${barColor(scores.accuracy_score, 40)} transition-all duration-500`} style={{ width: `${(scores.accuracy_score / 40) * 100}%` }}></div>
            </div>
          </div>
          <div className="rounded-xl border border-border/60 bg-white p-4">
            <p className="text-xs text-muted-foreground mb-1">Ranking Quality</p>
            <p className="text-lg font-medium text-foreground font-mono">{scores.ranking_score}/30</p>
            <div className="mt-2 h-1 w-full bg-muted rounded-full overflow-hidden">
              <div className={`h-full ${barColor(scores.ranking_score, 30)} transition-all duration-500`} style={{ width: `${(scores.ranking_score / 30) * 100}%` }}></div>
            </div>
          </div>
          <div className="rounded-xl border border-border/60 bg-white p-4">
            <p className="text-xs text-muted-foreground mb-1">Info Efficiency</p>
            <p className="text-lg font-medium text-foreground font-mono">{scores.efficiency_score}/20</p>
            <div className="mt-2 h-1 w-full bg-muted rounded-full overflow-hidden">
              <div className={`h-full ${barColor(scores.efficiency_score, 20)} transition-all duration-500`} style={{ width: `${(scores.efficiency_score / 20) * 100}%` }}></div>
            </div>
          </div>
          <div className="rounded-xl border border-border/60 bg-white p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">Speed Bonus</p>
              <p className="text-[10px] font-mono text-muted-foreground">
                {String(Math.floor(timeTaken / 60)).padStart(2, '0')}:{String(timeTaken % 60).padStart(2, '0')}
              </p>
            </div>
            <p className="text-lg font-medium text-foreground font-mono">{scores.speed_score}/10</p>
            <div className="mt-2 h-1 w-full bg-muted rounded-full overflow-hidden">
              <div className={`h-full ${barColor(scores.speed_score, 10)} transition-all duration-500`} style={{ width: `${(scores.speed_score / 10) * 100}%` }}></div>
            </div>
          </div>
        </div>

        {/* AI Feedback — collapsed by default */}
        <div>
          <button
            onClick={handleShowFeedback}
            disabled={feedbackLoading}
            className="w-full flex items-center justify-between rounded-xl border border-border/60 bg-white px-5 py-4 transition-all duration-200 hover:shadow-md group disabled:cursor-wait"
          >
            <div className="flex items-center gap-2.5">
              {feedbackLoading ? (
                <Loader2 className="h-4 w-4 text-[#2E86C1] animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 text-[#2E86C1] group-hover:scale-110 transition-transform duration-200" />
              )}
              <span className="text-sm font-medium text-foreground">
                {feedbackLoading ? 'Generating feedback...' : 'AI Feedback + Citations'}
              </span>
            </div>
            {!feedbackLoading && (
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${showFeedback ? 'rotate-180' : ''}`} />
            )}
          </button>
          {showFeedback && (
            <div className="mt-2 rounded-xl border border-border/60 bg-white p-5">
              {feedbackLoading && (
                <div className="flex items-center justify-center py-6 gap-2.5 text-muted-foreground">
                  <Loader2 className="h-4 w-4 text-[#2E86C1] animate-spin" />
                  <span className="text-sm">Searching medical literature...</span>
                </div>
              )}

              {feedbackError && (
                <div className="flex items-start gap-3 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Feedback unavailable</p>
                    <p className="text-xs mt-1">{feedbackError}</p>
                  </div>
                </div>
              )}

              {feedbackText && !feedbackLoading && (
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-2">Clinical Reasoning Analysis</p>
                  <p className="mb-4 whitespace-pre-line leading-relaxed">{feedbackText}</p>

                  {feedbackCitations.length > 0 && (
                    <div className="border-t border-border/50 pt-3 mt-3">
                      <p className="text-xs font-mono font-medium text-muted-foreground mb-2">Citations</p>
                      <ul className="space-y-1 list-none pl-0">
                        {feedbackCitations.map((c) => (
                          <li key={c.pmid} className="text-xs text-muted-foreground">
                            <span className="font-mono font-medium">[PMID: {c.pmid}]</span>
                            {c.authors && <span> &middot; {c.authors}</span>}
                            {c.title && <span> &mdash; {c.title}</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground/60 mt-3 italic">
                    Educational purposes only &mdash; not a substitute for clinical training.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col items-center gap-3 pt-2">
          <button
            onClick={handleNextCase}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2E86C1] px-6 py-3 text-sm font-medium text-white shadow-md transition-all duration-200 hover:scale-[1.02] hover:bg-[#2576AB] hover:shadow-lg"
          >
            Next Case
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={handleBackToSpecialties}
            className="text-sm font-medium text-muted-foreground hover:text-[#2E86C1] transition-colors duration-200"
          >
            Back to Specialties
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-6 text-center">
          <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">CASUIST v2.4.0 · FOR EDUCATIONAL PURPOSES ONLY</span>
        </div>
      </footer>
    </div>
  )
}

export default function ScorecardPage() {
  return (
    <Suspense>
      <ScorecardPageContent />
    </Suspense>
  )
}
