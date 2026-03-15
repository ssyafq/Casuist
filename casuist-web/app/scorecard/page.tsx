'use client'

import Navbar from '@/components/Navbar'
import { useSearchParams, useRouter } from 'next/navigation'
import { useState, Suspense } from 'react'
import { calculateScore, type ScoreResult } from '@/lib/scoring'
import { getStudentRanking, getSectionsViewed, getTimeTaken, clearSession } from '@/lib/session'
import { MOCK_CASE } from '@/lib/mock-case'

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

  const [timeTaken] = useState(() => {
    if (typeof window === 'undefined') return 0
    return getTimeTaken()
  })

  const [scores] = useState<ScoreResult>(() => {
    if (typeof window === 'undefined') {
      return { accuracy_score: 0, ranking_score: 0, efficiency_score: 0, speed_score: 0, total: 0, grade: 'D' as const }
    }
    const studentRanking = getStudentRanking()
    const sectionsViewed = getSectionsViewed()
    // If no ranking was submitted (direct navigation), give worst-case defaults
    if (studentRanking.length === 0) {
      return { accuracy_score: 0, ranking_score: 0, efficiency_score: 5, speed_score: 0, total: 5, grade: 'D' as const }
    }
    return calculateScore(MOCK_CASE.correct_ranking, studentRanking, sectionsViewed, timeTaken)
  })

  const handleNextCase = () => {
    clearSession()
    router.push(`/case?specialty=${specialty}`)
  }

  const handleBackToSpecialties = () => {
    clearSession()
    router.push('/specialties')
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
              onClick={() => setShowFeedback(!showFeedback)}
              className="w-full flex items-center justify-between p-6 bg-white border border-border-gray rounded-xl hover:bg-slate-50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">auto_awesome</span>
                <span className="font-semibold text-text-main">See AI Feedback + Citations</span>
              </div>
              <span className={`material-symbols-outlined text-slate-400 transition-transform ${showFeedback ? 'rotate-180' : ''}`}>expand_more</span>
            </button>
            {showFeedback && (
              <div className="mt-2 p-6 bg-white border border-border-gray rounded-xl">
                <div className="prose prose-sm max-w-none text-gray-700">
                  <p className="font-medium text-gray-900 mb-3">Clinical Reasoning Analysis</p>
                  <p className="mb-3">
                    Excellent identification of the primary diagnosis. The presentation of acute substernal chest pain with radiation to the left arm, diaphoresis, and ST-elevation in inferior leads (II, III, aVF) is classic for an <strong>inferior ST-elevation myocardial infarction (STEMI)</strong>.
                  </p>
                  <p className="mb-3">
                    Your differential ranking could be improved. While unstable angina was a reasonable second choice, aortic dissection should have been ranked higher given the severity of pain and hypertension. Consider the &quot;worst-first&quot; approach when ranking differentials.
                  </p>
                  <p className="mb-4">
                    Information gathering was efficient — requesting labs early was the right call given the need for troponin confirmation.
                  </p>
                  <div className="border-t border-gray-200 pt-3 mt-3">
                    <p className="text-xs font-mono text-gray-500 font-medium mb-1">Citations</p>
                    <p className="text-xs text-gray-500">[PMID: 29472585] · [PMID: 31567475] · [PMID: 28527533]</p>
                  </div>
                  <p className="text-xs text-gray-400 mt-3 italic">Educational purposes only — not a substitute for clinical training.</p>
                </div>
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
