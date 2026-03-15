'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { MOCK_CASE } from '@/lib/mock-case'
import { getStartTime, setStudentRanking, setTimeTaken } from '@/lib/session'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function DiagnosePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const specialty = searchParams.get('specialty') || 'cardiology'
  const specialtyLabel = specialty.charAt(0).toUpperCase() + specialty.slice(1)

  const [shuffled] = useState(() => shuffle(MOCK_CASE.differentials))
  const [ranked, setRanked] = useState<string[]>([])
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Continue the timer from the case page's start time
  useEffect(() => {
    const startTime = getStartTime()
    if (startTime) {
      setElapsed(Math.round((Date.now() - startTime) / 1000))
    }
    timerRef.current = setInterval(() => {
      const st = getStartTime()
      if (st) {
        setElapsed(Math.round((Date.now() - st) / 1000))
      }
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const unranked = shuffled.filter((d) => !ranked.includes(d))
  const allRanked = ranked.length === MOCK_CASE.differentials.length

  const handlePick = (dx: string) => {
    setRanked((prev) => [...prev, dx])
  }

  const handleUnpick = (dx: string) => {
    setRanked((prev) => prev.filter((r) => r !== dx))
  }

  const handleReset = () => {
    setRanked([])
  }

  const handleSubmit = () => {
    const startTime = getStartTime()
    const elapsed = startTime ? Math.round((Date.now() - startTime) / 1000) : 999
    setStudentRanking(ranked)
    setTimeTaken(elapsed)
    router.push(`/scorecard?specialty=${specialty}`)
  }

  return (
    <div className="bg-background-light text-text min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex flex-col lg:flex-row overflow-hidden">
        {/* Left Panel — Case Context */}
        <section className="lg:w-[40%] border-r border-border bg-white overflow-y-auto p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3 font-mono text-sm text-gray-500">
              <span className="font-medium text-text">Case #{MOCK_CASE.case_id}</span>
              <span>·</span>
              <span>{specialtyLabel}</span>
            </div>
            <span className="font-mono text-2xl font-bold text-text tabular-nums tracking-tight">
              {String(Math.floor(elapsed / 60)).padStart(2, '0')}
              <span className="text-gray-300 mx-0.5">:</span>
              {String(elapsed % 60).padStart(2, '0')}
            </span>
          </div>

          <div className="mb-8">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Chief Complaint</h2>
            <p className="text-xl font-bold leading-tight text-text">&quot;{MOCK_CASE.chief_complaint}&quot;</p>
          </div>

          <div className="flex space-x-8 mb-8 pb-6 border-b border-border">
            <div>
              <span className="block text-xs text-gray-500 uppercase font-bold mb-1">Age</span>
              <span className="font-medium">58 years</span>
            </div>
            <div>
              <span className="block text-xs text-gray-500 uppercase font-bold mb-1">Gender</span>
              <span className="font-medium">Male</span>
            </div>
            <div>
              <span className="block text-xs text-gray-500 uppercase font-bold mb-1">Setting</span>
              <span className="font-medium">Emergency Department</span>
            </div>
          </div>

          <div className="bg-blue-50 border border-primary/20 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary text-lg">info</span>
              <span className="text-sm font-bold text-primary">How to rank</span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Click each diagnosis in order of likelihood. Click your <strong>most likely</strong> diagnosis first, then your second most likely, and so on. Click a ranked item to undo it.
            </p>
          </div>
        </section>

        {/* Right Panel — Ranking Interaction */}
        <section className="lg:w-[60%] bg-background-light overflow-y-auto flex flex-col p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-navy mb-1">Differential Diagnosis</h2>
            <p className="text-sm text-gray-600">Rank all 5 diagnoses from most likely to least likely.</p>
          </div>

          {/* Your Ranking */}
          {ranked.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Your Ranking</h3>
                <button
                  onClick={handleReset}
                  className="text-xs font-medium text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">restart_alt</span>
                  Reset
                </button>
              </div>
              <div className="space-y-2">
                {ranked.map((dx, i) => (
                  <button
                    key={dx}
                    onClick={() => handleUnpick(dx)}
                    className="w-full text-left bg-white border border-primary/30 rounded-lg p-4 flex items-center group hover:border-red-300 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm font-mono mr-4 shrink-0">
                      {i + 1}
                    </div>
                    <span className="font-medium text-gray-900 flex-1">{dx}</span>
                    <span className="material-symbols-outlined text-gray-300 group-hover:text-red-400 transition-colors text-lg">close</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Available Options */}
          {unranked.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
                {ranked.length === 0 ? 'Select your most likely diagnosis' : `Select #${ranked.length + 1}`}
              </h3>
              <div className="space-y-2">
                {unranked.map((dx) => (
                  <button
                    key={dx}
                    onClick={() => handlePick(dx)}
                    className="w-full text-left bg-white border border-border hover:border-primary hover:shadow-sm transition-all rounded-lg p-4 flex items-center group"
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-primary/10 flex items-center justify-center mr-4 shrink-0 transition-colors">
                      <span className="material-symbols-outlined text-gray-400 group-hover:text-primary text-lg transition-colors">add</span>
                    </div>
                    <span className="font-medium text-gray-900">{dx}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="mt-auto pt-6 border-t border-border">
            <button
              onClick={handleSubmit}
              disabled={!allRanked}
              className="w-full bg-primary hover:bg-navy disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center"
            >
              {allRanked ? (
                <>
                  Submit Ranking
                  <span className="material-symbols-outlined ml-2">arrow_forward</span>
                </>
              ) : (
                <>
                  Rank all {MOCK_CASE.differentials.length} diagnoses to continue
                </>
              )}
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}

export default function DiagnosePage() {
  return (
    <Suspense>
      <DiagnosePageContent />
    </Suspense>
  )
}
