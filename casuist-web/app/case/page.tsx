'use client'

import Navbar from '@/components/Navbar'
import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect, useRef, Suspense } from 'react'
import { setStartTime, setSectionsViewed, setStudentRanking, setTimeTaken, setCorrectRanking, setCaseContext, getStartTime } from '@/lib/session'
import { type CaseData, API_BASE } from '@/lib/mock-case'

function shuffle(arr: string[]): string[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function CasePageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const specialty = searchParams.get('specialty') || 'cardiology'
  const specialtyLabel = specialty.charAt(0).toUpperCase() + specialty.slice(1)

  // Case data from API
  const [caseData, setCaseData] = useState<CaseData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [revealedSections, setRevealedSections] = useState<Set<string>>(new Set())
  const [countdown, setCountdown] = useState(5)
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Right panel toggle
  const [rightPanel, setRightPanel] = useState<'info' | 'ranking'>('info')

  // Ranking state — initialized after case loads
  const [shuffled, setShuffled] = useState<string[]>([])
  const [ranked, setRanked] = useState<string[]>([])

  // Fetch case from API on mount
  useEffect(() => {
    async function fetchCase() {
      try {
        const res = await fetch(`${API_BASE}/api/case/random?specialty=${specialty}`)
        if (!res.ok) throw new Error(`API error: ${res.status}`)
        const data: CaseData = await res.json()
        setCaseData(data)
        setShuffled(shuffle([...data.differentials]))
        setCorrectRanking(data.correct_ranking)
        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load case')
        setLoading(false)
      }
    }
    fetchCase()
  }, [specialty])

  // 5-second countdown, then start the real timer
  useEffect(() => {
    if (loading) return
    if (countdown > 0) {
      const id = setTimeout(() => setCountdown((c) => c - 1), 1000)
      return () => clearTimeout(id)
    }
    setStartTime()
    timerRef.current = setInterval(() => {
      setElapsed((e) => e + 1)
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [countdown, loading])

  const toggleSection = (key: string) => {
    setRevealedSections((prev) => {
      const next = new Set(prev)
      next.add(key)
      setSectionsViewed(Array.from(next))
      return next
    })
  }

  const pointsUsed = Array.from(revealedSections).reduce((sum, key) => {
    if (key === 'exam') return sum + 2
    if (key === 'labs') return sum + 3
    return sum
  }, 0)

  const handlePick = (dx: string) => setRanked((prev) => [...prev, dx])
  const handleUnpick = (dx: string) => setRanked((prev) => prev.filter((d) => d !== dx))
  const handleReset = () => setRanked([])

  const handleSubmit = () => {
    if (!caseData) return
    const startTime = getStartTime()
    const timeTaken = startTime ? Math.round((Date.now() - startTime) / 1000) : elapsed
    setStudentRanking(ranked)
    setTimeTaken(timeTaken)
    setCaseContext({
      specialty: caseData.specialty,
      correct_diagnosis: caseData.correct_diagnosis,
      chief_complaint: caseData.chief_complaint,
      history: caseData.history,
      exam: revealedSections.has('exam') ? caseData.exam : null,
      labs: revealedSections.has('labs') ? caseData.labs : null,
    })
    router.push(`/scorecard?specialty=${specialty}`)
  }

  const unranked = shuffled.filter((dx) => !ranked.includes(dx))
  const allRanked = caseData ? ranked.length === caseData.differentials.length : false

  // Loading state
  if (loading) {
    return (
      <div className="bg-background-light text-text min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <span className="material-symbols-outlined text-5xl text-primary animate-spin mb-4 block">progress_activity</span>
            <p className="text-lg font-medium text-gray-600">Loading case...</p>
          </div>
        </main>
      </div>
    )
  }

  // Error state
  if (error || !caseData) {
    return (
      <div className="bg-background-light text-text min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <span className="material-symbols-outlined text-5xl text-red-400 mb-4 block">error</span>
            <h1 className="text-xl font-bold text-text mb-2">Failed to load case</h1>
            <p className="text-gray-500 mb-6">{error || 'Unknown error'}</p>
            <p className="text-sm text-gray-400 mb-6">Make sure the API server is running: <code className="bg-gray-100 px-2 py-1 rounded text-xs">uvicorn api.main:app --reload</code></p>
            <button
              onClick={() => router.push('/specialties')}
              className="bg-primary hover:bg-primary/90 text-white font-bold py-3 px-8 rounded-lg transition-all shadow-md"
            >
              Back to Specialties
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="bg-background-light text-text min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex flex-col lg:flex-row overflow-hidden">
        {/* Left panel — case details */}
        <section className="lg:w-[60%] border-r border-border bg-white overflow-y-auto p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3 font-mono text-sm text-gray-500">
              <span className="font-medium text-text">Case #{caseData.case_id}</span>
              <span>·</span>
              <span>{specialtyLabel}</span>
            </div>
            {/* Timer */}
            <div className="flex items-center gap-2">
              {countdown > 0 ? (
                <div className="text-right">
                  <span className="block text-xs text-gray-400 font-medium">Case starts in</span>
                  <span className="font-mono text-2xl font-bold text-primary tabular-nums">
                    {countdown}
                  </span>
                </div>
              ) : (
                <span className="font-mono text-2xl font-bold text-text tabular-nums tracking-tight">
                  {String(Math.floor(elapsed / 60)).padStart(2, '0')}
                  <span className="text-gray-300 mx-0.5">:</span>
                  {String(elapsed % 60).padStart(2, '0')}
                </span>
              )}
            </div>
          </div>
          <div className="mb-10">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Chief Complaint</h2>
            <p className="text-2xl font-bold leading-tight text-text">&quot;{caseData.chief_complaint}&quot;</p>
          </div>
          <div className="space-y-6">
            {/* History - always revealed */}
            <div className="bg-gray-50 rounded-lg p-6 border border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center">
                  <span className="material-symbols-outlined text-primary mr-2">history</span>
                  History of Present Illness
                </h3>
                <span className="text-xs font-medium text-primary bg-blue-50 px-2 py-1 rounded">Revealed</span>
              </div>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{caseData.history}</p>
            </div>

            {/* Physical Exam - toggleable */}
            {revealedSections.has('exam') ? (
              <div className="bg-gray-50 rounded-lg p-6 border border-border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold flex items-center">
                    <span className="material-symbols-outlined text-primary mr-2">accessibility_new</span>
                    Physical Exam
                  </h3>
                  <span className="text-xs font-medium text-primary bg-blue-50 px-2 py-1 rounded">Revealed</span>
                </div>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{caseData.exam}</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg p-6 border border-dashed border-gray-300 opacity-60 flex items-center justify-center min-h-[120px]">
                <div className="text-center">
                  <span className="material-symbols-outlined text-gray-400 mb-2 text-3xl">lock</span>
                  <h3 className="font-medium text-gray-600">Physical Exam details are locked</h3>
                  <p className="text-sm text-gray-500 mt-1">Request this information from the action panel.</p>
                </div>
              </div>
            )}

            {/* Lab Results - toggleable */}
            {revealedSections.has('labs') ? (
              <div className="bg-gray-50 rounded-lg p-6 border border-border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold flex items-center">
                    <span className="material-symbols-outlined text-primary mr-2">science</span>
                    Laboratory Results &amp; Investigations
                  </h3>
                  <span className="text-xs font-medium text-primary bg-blue-50 px-2 py-1 rounded">Revealed</span>
                </div>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{caseData.labs}</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg p-6 border border-dashed border-gray-300 opacity-60 flex items-center justify-center min-h-[120px]">
                <div className="text-center">
                  <span className="material-symbols-outlined text-gray-400 mb-2 text-3xl">lock</span>
                  <h3 className="font-medium text-gray-600">Laboratory Results are locked</h3>
                  <p className="text-sm text-gray-500 mt-1">Request this information from the action panel.</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Right panel — toggles between info and ranking */}
        <section className="lg:w-[40%] bg-background-light overflow-y-auto flex flex-col p-8">

          {rightPanel === 'info' ? (
            /* ── INFO PANEL ── */
            <>
              <div className="mb-8">
                <h2 className="text-xl font-bold text-navy mb-2">What would you like to know?</h2>
                <p className="text-sm text-gray-600">Gather information strategically to formulate your diagnosis. Each request may cost clinical points.</p>
              </div>
              <div className="flex-grow space-y-4">
                {/* History - always done */}
                <button className="w-full text-left bg-white border border-border transition-all rounded-lg p-4 flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-4 group-disabled:text-gray-400">
                      <span className="material-symbols-outlined">history</span>
                    </div>
                    <div>
                      <span className="block font-medium text-gray-900 group-disabled:text-gray-500">Request History</span>
                      <span className="text-xs text-gray-500">Already requested</span>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-green-500">check_circle</span>
                </button>

                {/* Physical Exam */}
                <button
                  onClick={() => toggleSection('exam')}
                  disabled={revealedSections.has('exam')}
                  className="w-full text-left bg-white border border-border hover:border-primary hover:shadow-sm transition-all rounded-lg p-4 flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mr-4 text-primary group-hover:bg-primary group-hover:text-white group-disabled:bg-gray-100 group-disabled:text-gray-400 transition-colors">
                      <span className="material-symbols-outlined">accessibility_new</span>
                    </div>
                    <div>
                      <span className="block font-medium text-gray-900 group-disabled:text-gray-500">Request Physical Exam</span>
                      <span className="text-xs text-gray-500">{revealedSections.has('exam') ? 'Already requested' : 'Vitals, physical findings...'}</span>
                    </div>
                  </div>
                  {revealedSections.has('exam') ? (
                    <span className="material-symbols-outlined text-green-500">check_circle</span>
                  ) : (
                    <span className="text-xs font-mono font-bold text-gray-400 group-hover:text-primary transition-colors">-2 pts</span>
                  )}
                </button>

                {/* Lab Results */}
                <button
                  onClick={() => toggleSection('labs')}
                  disabled={revealedSections.has('labs')}
                  className="w-full text-left bg-white border border-border hover:border-primary hover:shadow-sm transition-all rounded-lg p-4 flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mr-4 text-primary group-hover:bg-primary group-hover:text-white group-disabled:bg-gray-100 group-disabled:text-gray-400 transition-colors">
                      <span className="material-symbols-outlined">science</span>
                    </div>
                    <div>
                      <span className="block font-medium text-gray-900 group-disabled:text-gray-500">Request Lab Results</span>
                      <span className="text-xs text-gray-500">{revealedSections.has('labs') ? 'Already requested' : 'Labs, ECG, imaging, investigations...'}</span>
                    </div>
                  </div>
                  {revealedSections.has('labs') ? (
                    <span className="material-symbols-outlined text-green-500">check_circle</span>
                  ) : (
                    <span className="text-xs font-mono font-bold text-gray-400 group-hover:text-primary transition-colors">-3 pts</span>
                  )}
                </button>
              </div>

              <div className="mt-8 pt-6 border-t border-border">
                <div className="flex items-center justify-between mb-4 text-sm">
                  <span className="text-gray-500">Current Score Potential</span>
                  <span className="font-mono font-bold text-green-600">{100 - pointsUsed}/100</span>
                </div>
                {countdown > 0 ? (
                  <button
                    disabled
                    className="w-full bg-gray-300 text-gray-500 font-bold py-4 px-6 rounded-lg cursor-not-allowed flex items-center justify-center"
                  >
                    Ready to Diagnose
                    <span className="material-symbols-outlined ml-2">lock</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setRightPanel('ranking')}
                    className="w-full bg-primary hover:bg-navy text-white font-bold py-4 px-6 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center"
                  >
                    Ready to Diagnose
                    <span className="material-symbols-outlined ml-2">arrow_forward</span>
                  </button>
                )}
              </div>
            </>
          ) : (
            /* ── RANKING PANEL ── */
            <>
              {/* Header with back arrow */}
              <div className="flex items-center gap-3 mb-8">
                <button
                  onClick={() => setRightPanel('info')}
                  className="w-9 h-9 rounded-full bg-white border border-border flex items-center justify-center text-gray-500 hover:border-primary hover:text-primary transition-colors shrink-0"
                  title="Back to information gathering"
                >
                  <span className="material-symbols-outlined text-xl">arrow_back</span>
                </button>
                <div>
                  <h2 className="text-xl font-bold text-navy">Differential Diagnosis</h2>
                  <p className="text-sm text-gray-600">Rank from most to least likely.</p>
                </div>
              </div>

              {/* Your Ranking */}
              {ranked.length > 0 && (
                <div className="mb-6">
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
                <div className="mb-6">
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

              {/* Submit footer */}
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
                    <>Rank all {caseData.differentials.length} diagnoses to continue</>
                  )}
                </button>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  )
}

export default function CasePage() {
  return (
    <Suspense>
      <CasePageContent />
    </Suspense>
  )
}
