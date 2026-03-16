'use client'

import Navbar from '@/components/Navbar'
import { useSearchParams, useRouter } from 'next/navigation'
import { useState, Suspense } from 'react'
import { calculateScore, type ScoreResult } from '@/lib/scoring'
import { getStudentRanking, getSectionsViewed, getTimeTaken, getCorrectRanking, getCaseContext, clearSession } from '@/lib/session'
import { API_BASE } from '@/lib/mock-case'

function barColor(score: number, max: number): string {
  if (score === 0) return 'bg-slate-300'
  const pct = score / max
  if (pct >= 1) return 'bg-emerald-500'
  if (pct >= 0.5) return 'bg-primary'
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
      <div className="bg-background-light text-slate-900 min-h-screen">
        <div className="layout-container flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1 flex flex-col items-center justify-center px-4">
            <div className="text-center max-w-md">
              <span className="material-symbols-outlined text-6xl text-slate-300 mb-4 block">quiz</span>
              <h1 className="text-2xl font-bold text-text-main mb-2">No case data found</h1>
              <p className="text-slate-500 mb-8">It looks like you haven&apos;t completed a case yet. Start one to see your scorecard.</p>
              <button
                onClick={() => { clearSession(); router.push('/specialties') }}
                className="bg-primary hover:bg-primary/90 text-white font-bold py-3 px-8 rounded-lg transition-all shadow-md"
              >
                Start a Case
              </button>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background-light text-slate-900 min-h-screen">
      <div className="layout-container flex flex-col min-h-screen">
        {/* Navigation */}
        <Navbar />
        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center justify-center py-16 px-4 max-w-5xl mx-auto w-full gap-y-16">
          {/* Main Score Section */}
          <div className="text-center">
            <p className="text-slate-500 font-medium uppercase tracking-widest text-xs mb-2">Case Performance</p>
            <h1 className="text-text-main text-7xl font-bold leading-tight font-display mb-4">
              {scores.total} <span className="text-slate-300">/</span> 100
            </h1>
            <div className="inline-flex items-center justify-center px-6 py-1.5 bg-primary/10 border border-primary/20 text-primary rounded-full text-lg font-bold">
              Grade: {scores.grade}
            </div>
          </div>
          {/* Score Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            {/* Diagnosis Accuracy */}
            <div className="bg-white border border-border-gray p-6 rounded-xl shadow-sm">
              <p className="text-slate-500 text-sm font-medium mb-1">Diagnosis Accuracy</p>
              <p className="text-2xl font-bold text-text-main font-mono">{scores.accuracy_score}/40</p>
              <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full ${barColor(scores.accuracy_score, 40)}`} style={{ width: `${(scores.accuracy_score / 40) * 100}%` }}></div>
              </div>
            </div>
            {/* Ranking Quality */}
            <div className="bg-white border border-border-gray p-6 rounded-xl shadow-sm">
              <p className="text-slate-500 text-sm font-medium mb-1">Ranking Quality</p>
              <p className="text-2xl font-bold text-text-main font-mono">{scores.ranking_score}/30</p>
              <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full ${barColor(scores.ranking_score, 30)}`} style={{ width: `${(scores.ranking_score / 30) * 100}%` }}></div>
              </div>
            </div>
            {/* Info Efficiency */}
            <div className="bg-white border border-border-gray p-6 rounded-xl shadow-sm">
              <p className="text-slate-500 text-sm font-medium mb-1">Info Efficiency</p>
              <p className="text-2xl font-bold text-text-main font-mono">{scores.efficiency_score}/20</p>
              <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full ${barColor(scores.efficiency_score, 20)}`} style={{ width: `${(scores.efficiency_score / 20) * 100}%` }}></div>
              </div>
            </div>
            {/* Speed Bonus */}
            <div className="bg-white border border-border-gray p-6 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <p className="text-slate-500 text-sm font-medium">Speed Bonus</p>
                <p className="text-xs font-mono text-slate-400">
                  {String(Math.floor(timeTaken / 60)).padStart(2, '0')}:{String(timeTaken % 60).padStart(2, '0')}
                </p>
              </div>
              <p className="text-2xl font-bold text-text-main font-mono">{scores.speed_score}/10</p>
              <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full ${barColor(scores.speed_score, 10)}`} style={{ width: `${(scores.speed_score / 10) * 100}%` }}></div>
              </div>
            </div>
          </div>
          {/* AI Feedback Section */}
          <div className="w-full max-w-3xl">
            <button
              onClick={handleShowFeedback}
              disabled={feedbackLoading}
              className="w-full flex items-center justify-between p-6 bg-white border border-border-gray rounded-xl hover:bg-slate-50 transition-colors group disabled:cursor-wait"
            >
              <div className="flex items-center gap-3">
                <span className={`material-symbols-outlined text-primary group-hover:scale-110 transition-transform ${feedbackLoading ? 'animate-spin' : ''}`}>
                  {feedbackLoading ? 'progress_activity' : 'auto_awesome'}
                </span>
                <span className="font-semibold text-text-main">
                  {feedbackLoading ? 'Generating feedback...' : 'See AI Feedback + Citations'}
                </span>
              </div>
              {!feedbackLoading && (
                <span className={`material-symbols-outlined text-slate-400 transition-transform ${showFeedback ? 'rotate-180' : ''}`}>expand_more</span>
              )}
            </button>
            {showFeedback && (
              <div className="mt-2 p-6 bg-white border border-border-gray rounded-xl">
                {feedbackLoading && (
                  <div className="flex items-center justify-center py-8 gap-3 text-slate-500">
                    <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                    <span className="text-sm font-medium">Searching medical literature...</span>
                  </div>
                )}

                {feedbackError && (
                  <div className="flex items-start gap-3 text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">
                    <span className="material-symbols-outlined text-xl shrink-0">error</span>
                    <div>
                      <p className="font-medium text-sm">Feedback unavailable</p>
                      <p className="text-xs mt-1">{feedbackError}</p>
                    </div>
                  </div>
                )}

                {feedbackText && !feedbackLoading && (
                  <div className="prose prose-sm max-w-none text-gray-700">
                    <p className="font-medium text-gray-900 mb-3">Clinical Reasoning Analysis</p>
                    <p className="mb-4 whitespace-pre-line">{feedbackText}</p>

                    {feedbackCitations.length > 0 && (
                      <div className="border-t border-gray-200 pt-3 mt-3">
                        <p className="text-xs font-mono text-gray-500 font-medium mb-2">Citations</p>
                        <ul className="space-y-1 list-none pl-0">
                          {feedbackCitations.map((c) => (
                            <li key={c.pmid} className="text-xs text-gray-500">
                              <span className="font-mono font-medium">[PMID: {c.pmid}]</span>
                              {c.authors && <span> &middot; {c.authors}</span>}
                              {c.title && <span> &mdash; {c.title}</span>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <p className="text-xs text-gray-400 mt-3 italic">
                      Educational purposes only &mdash; not a substitute for clinical training.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          {/* Actions */}
          <div className="flex flex-col items-center gap-8 w-full">
            <button
              onClick={handleNextCase}
              className="bg-primary hover:bg-primary/90 text-white font-bold py-5 px-16 rounded-lg flex items-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-95 text-xl"
            >
              Next Case
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
            <button
              onClick={handleBackToSpecialties}
              className="text-slate-500 hover:text-primary font-medium transition-colors text-sm border-b border-transparent hover:border-primary"
            >
              Back to Specialties
            </button>
          </div>
        </main>
        <footer className="py-10 text-center text-slate-400 text-xs font-mono uppercase tracking-tighter shrink-0">
          CASUIST CLINICAL ENGINE v4.2.0 • FOR EDUCATIONAL PURPOSES ONLY
        </footer>
      </div>
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
