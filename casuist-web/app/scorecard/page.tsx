'use client'

import Navbar from '@/components/Navbar'
import InnerNavbar from '@/components/InnerNavbar'
import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import { calculateScore, type ScoreResult } from '@/lib/scoring'
import { getStudentRanking, getSectionsViewed, getTimeTaken, getCorrectRanking, getCaseContext, clearSession } from '@/lib/session'
import { API_BASE } from '@/lib/mock-case'
import { ArrowRight, ChevronDown, Sparkles, Loader2, AlertCircle, ClipboardList } from 'lucide-react'

// Returns unique PMIDs in order of first appearance in text
function extractOrderedPmids(text: string): string[] {
  const seen = new Set<string>()
  const order: string[] = []
  for (const m of text.matchAll(/\[PMID:\s*(\d+)\]/g)) {
    if (!seen.has(m[1])) { seen.add(m[1]); order.push(m[1]) }
  }
  return order
}

// Splits text into segments: plain strings and numbered citation markers
type Segment = { type: 'text'; value: string } | { type: 'cite'; num: number; pmid: string }

function parseBodySegments(text: string, pmidOrder: string[]): Segment[] {
  const index = Object.fromEntries(pmidOrder.map((id, i) => [id, i + 1]))
  const parts = text.split(/(\[PMID:\s*\d+\])/g)
  return parts.map((part) => {
    const m = part.match(/\[PMID:\s*(\d+)\]/)
    if (m) return { type: 'cite' as const, num: index[m[1]] ?? 0, pmid: m[1] }
    return { type: 'text' as const, value: part }
  })
}

function usePubMedTitles(pmids: string[]): Record<string, string | null> {
  const [titles, setTitles] = useState<Record<string, string | null>>({})

  useEffect(() => {
    if (pmids.length === 0) return
    const missing = pmids.filter((id) => !(id in titles))
    if (missing.length === 0) return

    // Mark as loading (null = loading, string = resolved)
    setTitles((prev) => {
      const next = { ...prev }
      missing.forEach((id) => { next[id] = null })
      return next
    })

    fetch(
      `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${missing.join(',')}&retmode=json`
    )
      .then((r) => r.json())
      .then((data) => {
        const resolved: Record<string, string> = {}
        for (const id of missing) {
          const doc = data?.result?.[id]
          resolved[id] = doc?.title ?? `[PMID: ${id}]`
        }
        setTitles((prev) => ({ ...prev, ...resolved }))
      })
      .catch(() => {
        // On error, fall back to PMID label for each
        const fallback: Record<string, string> = {}
        missing.forEach((id) => { fallback[id] = `[PMID: ${id}]` })
        setTitles((prev) => ({ ...prev, ...fallback }))
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pmids.join(',')])

  return titles
}

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

  const [timeTaken] = useState(() => {
    if (typeof window === 'undefined') return 0
    return getTimeTaken()
  })

  const [hasData] = useState(() => {
    if (typeof window === 'undefined') return false
    return getStudentRanking().length > 0
  })

  const pmidOrder = feedbackText ? extractOrderedPmids(feedbackText) : []
  const pubmedTitles = usePubMedTitles(pmidOrder)

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
        <InnerNavbar />
        <main className="flex-1 flex flex-col items-center justify-center px-8 min-h-[calc(100vh-64px)]">
          <div className="text-center max-w-lg">
            <ClipboardList className="h-16 w-16 text-border mx-auto mb-5" />
            <h1 className="text-3xl font-medium tracking-tight text-foreground mb-3">No case data found</h1>
            <p className="text-lg text-muted-foreground mb-10">It looks like you haven&apos;t completed a case yet. Start one to see your scorecard.</p>
            <button
              onClick={() => { clearSession(); router.push('/specialties') }}
              className="inline-flex items-center justify-center gap-2.5 rounded-lg bg-[#2E86C1] px-8 py-4 text-base font-medium text-white shadow-md transition-all duration-200 hover:scale-[1.02] hover:bg-[#2576AB] hover:shadow-lg"
            >
              Start a Case
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f8f6] flex flex-col">
      <Navbar />
      <InnerNavbar />

      <main className="flex-1 mx-auto w-full max-w-4xl px-8 pt-32 pb-10 flex flex-col gap-8">
        {/* Score + Grade */}
        <div className="text-center">
          <h1 className="text-5xl font-medium tracking-tight text-foreground">
            <span className="font-mono">{scores.total}</span>
            <span className="text-muted-foreground/40 mx-1">/</span>
            <span className="font-mono text-muted-foreground">100</span>
          </h1>
          <span className="inline-block mt-3 px-5 py-1.5 bg-[#2E86C1]/10 border border-[#2E86C1]/20 text-[#2E86C1] rounded-full text-base font-medium">
            Grade: {scores.grade}
          </span>
        </div>

        {/* Breakdown Cards — 2x2 grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-border/60 bg-white p-6">
            <p className="text-sm text-muted-foreground mb-1.5">Diagnosis Accuracy</p>
            <p className="text-xl font-medium text-foreground font-mono">{scores.accuracy_score}/40</p>
            <div className="mt-2.5 h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div className={`h-full ${barColor(scores.accuracy_score, 40)} transition-all duration-500`} style={{ width: `${(scores.accuracy_score / 40) * 100}%` }}></div>
            </div>
          </div>
          <div className="rounded-xl border border-border/60 bg-white p-6">
            <p className="text-sm text-muted-foreground mb-1.5">Ranking Quality</p>
            <p className="text-xl font-medium text-foreground font-mono">{scores.ranking_score}/30</p>
            <div className="mt-2.5 h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div className={`h-full ${barColor(scores.ranking_score, 30)} transition-all duration-500`} style={{ width: `${(scores.ranking_score / 30) * 100}%` }}></div>
            </div>
          </div>
          <div className="rounded-xl border border-border/60 bg-white p-6">
            <p className="text-sm text-muted-foreground mb-1.5">Info Efficiency</p>
            <p className="text-xl font-medium text-foreground font-mono">{scores.efficiency_score}/20</p>
            <div className="mt-2.5 h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div className={`h-full ${barColor(scores.efficiency_score, 20)} transition-all duration-500`} style={{ width: `${(scores.efficiency_score / 20) * 100}%` }}></div>
            </div>
          </div>
          <div className="rounded-xl border border-border/60 bg-white p-6">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-sm text-muted-foreground">Speed Bonus</p>
              <p className="text-xs font-mono text-muted-foreground">
                {String(Math.floor(timeTaken / 60)).padStart(2, '0')}:{String(timeTaken % 60).padStart(2, '0')}
              </p>
            </div>
            <p className="text-xl font-medium text-foreground font-mono">{scores.speed_score}/10</p>
            <div className="mt-2.5 h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div className={`h-full ${barColor(scores.speed_score, 10)} transition-all duration-500`} style={{ width: `${(scores.speed_score / 10) * 100}%` }}></div>
            </div>
          </div>
        </div>

        {/* AI Feedback — collapsed by default */}
        <div>
          <button
            onClick={handleShowFeedback}
            disabled={feedbackLoading}
            className="w-full flex items-center justify-between rounded-xl border border-border/60 bg-white px-6 py-5 transition-all duration-200 hover:shadow-md group disabled:cursor-wait"
          >
            <div className="flex items-center gap-3">
              {feedbackLoading ? (
                <Loader2 className="h-5 w-5 text-[#2E86C1] animate-spin" />
              ) : (
                <Sparkles className="h-5 w-5 text-[#2E86C1] group-hover:scale-110 transition-transform duration-200" />
              )}
              <span className="text-base font-medium text-foreground">
                {feedbackLoading ? 'Generating feedback...' : 'AI Feedback + Citations'}
              </span>
            </div>
            {!feedbackLoading && (
              <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${showFeedback ? 'rotate-180' : ''}`} />
            )}
          </button>
          {showFeedback && (
            <div className="mt-2.5 rounded-xl border border-border/60 bg-white p-6">
              {feedbackLoading && (
                <div className="flex items-center justify-center py-8 gap-3 text-muted-foreground">
                  <Loader2 className="h-5 w-5 text-[#2E86C1] animate-spin" />
                  <span className="text-base">Searching medical literature...</span>
                </div>
              )}

              {feedbackError && (
                <div className="flex items-start gap-3 text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-base">Feedback unavailable</p>
                    <p className="text-sm mt-1">{feedbackError}</p>
                  </div>
                </div>
              )}

              {feedbackText && !feedbackLoading && (
                <div className="text-base text-muted-foreground">
                  <p className="font-medium text-foreground text-lg mb-3">Clinical Reasoning Analysis</p>
                  <p className="mb-5 leading-relaxed">
                    {parseBodySegments(feedbackText!, pmidOrder).map((seg, i) =>
                      seg.type === 'text'
                        ? <span key={i}>{seg.value}</span>
                        : <sup key={i} className="font-mono text-[#2E86C1] font-medium">[{seg.num}]</sup>
                    )}
                  </p>

                  {pmidOrder.length > 0 && (
                    <div className="border-t border-border/50 pt-4 mt-4">
                      <p className="text-sm font-mono font-medium text-muted-foreground mb-2.5">Citations</p>
                      <ol className="space-y-1.5 list-none pl-0">
                        {pmidOrder.map((pmid, i) => {
                          const fetched = pubmedTitles[pmid]
                          return (
                            <li key={pmid} className="text-sm text-muted-foreground flex gap-2">
                              <span className="font-mono font-medium text-muted-foreground shrink-0">[{i + 1}]</span>
                              <a
                                href={`https://pubmed.ncbi.nlm.nih.gov/${pmid}/`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#2E86C1] hover:underline"
                              >
                                {fetched ?? `PMID: ${pmid}`}
                              </a>
                            </li>
                          )
                        })}
                      </ol>
                    </div>
                  )}

                  <p className="text-sm text-muted-foreground/60 mt-4 italic">
                    Educational purposes only &mdash; not a substitute for clinical training.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col items-center gap-4 pt-3">
          <button
            onClick={handleNextCase}
            className="inline-flex items-center justify-center gap-2.5 rounded-lg bg-[#2E86C1] px-8 py-4 text-base font-medium text-white shadow-md transition-all duration-200 hover:scale-[1.02] hover:bg-[#2576AB] hover:shadow-lg"
          >
            Next Case
            <ArrowRight className="h-5 w-5" />
          </button>
          <button
            onClick={handleBackToSpecialties}
            className="text-base font-medium text-muted-foreground hover:text-[#2E86C1] transition-colors duration-200"
          >
            Back to Specialties
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-white">
        <div className="mx-auto max-w-[1480px] px-8 py-8 text-center">
          <span className="font-mono text-sm text-muted-foreground uppercase tracking-wider">CASUIST v2.4.0 · FOR EDUCATIONAL PURPOSES ONLY</span>
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
