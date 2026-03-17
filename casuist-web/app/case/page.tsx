'use client'

import Navbar from '@/components/Navbar'
import InnerNavbar from '@/components/InnerNavbar'
import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect, useRef, Suspense } from 'react'
import { setStartTime, setSectionsViewed, setStudentRanking, setTimeTaken, setCorrectRanking, setCaseContext, getStartTime } from '@/lib/session'
import { type CaseData, API_BASE } from '@/lib/mock-case'
import { ArrowRight, ArrowLeft, Lock, CheckCircle, Plus, X, RotateCcw, Loader2, AlertCircle, FileText, Activity, FlaskConical } from 'lucide-react'

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
      <div className="min-h-screen bg-[#f8f8f6] flex flex-col">
        <Navbar />
        <InnerNavbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-10 w-10 text-[#2E86C1] animate-spin mx-auto mb-4" />
            <p className="text-base font-medium text-muted-foreground">Loading case...</p>
          </div>
        </main>
      </div>
    )
  }

  // Error state
  if (error || !caseData) {
    return (
      <div className="min-h-screen bg-[#f8f8f6] flex flex-col">
        <Navbar />
        <InnerNavbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h1 className="text-xl font-medium tracking-tight text-foreground mb-2">Failed to load case</h1>
            <p className="text-muted-foreground mb-6">{error || 'Unknown error'}</p>
            <p className="text-sm text-muted-foreground/70 mb-6">Make sure the API server is running: <code className="bg-white border border-border/60 px-2 py-1 rounded text-xs font-mono">uvicorn api.main:app --reload</code></p>
            <button
              onClick={() => router.push('/specialties')}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2E86C1] px-6 py-3 text-sm font-medium text-white shadow-md transition-all duration-200 hover:scale-[1.02] hover:bg-[#2576AB] hover:shadow-lg"
            >
              Back to Specialties
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
      <main className="flex-grow flex flex-col lg:flex-row overflow-hidden pt-24">
        {/* Left panel — case details */}
        <section className="lg:w-[60%] border-r border-border/50 bg-white overflow-y-auto p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3 font-mono text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Case #{caseData.case_id}</span>
              <span>&middot;</span>
              <span>{specialtyLabel}</span>
            </div>
            {/* Timer */}
            <div className="flex items-center gap-2">
              {countdown > 0 ? (
                <div className="text-right">
                  <span className="block text-xs text-muted-foreground font-medium">Case starts in</span>
                  <span className="font-mono text-2xl font-medium text-[#2E86C1] tabular-nums">
                    {countdown}
                  </span>
                </div>
              ) : (
                <span className="font-mono text-2xl font-medium text-foreground tabular-nums tracking-tight">
                  {String(Math.floor(elapsed / 60)).padStart(2, '0')}
                  <span className="text-border mx-0.5">:</span>
                  {String(elapsed % 60).padStart(2, '0')}
                </span>
              )}
            </div>
          </div>
          <div className="mb-10">
            <p className="text-sm font-medium uppercase tracking-wider text-[#2E86C1] mb-3">Chief Complaint</p>
            <p className="text-2xl font-medium leading-tight tracking-tight text-foreground">&quot;{caseData.chief_complaint}&quot;</p>
          </div>
          <div className="space-y-6">
            {/* History - always revealed */}
            <div className="rounded-xl border border-border/60 bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[#2E86C1]" />
                  History of Present Illness
                </h3>
                <span className="text-xs font-mono font-medium text-[#2E86C1] bg-[#2E86C1]/10 px-2.5 py-1 rounded-md">Revealed</span>
              </div>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{caseData.history}</p>
            </div>

            {/* Physical Exam - toggleable */}
            {revealedSections.has('exam') ? (
              <div className="rounded-xl border border-border/60 bg-white p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-foreground flex items-center gap-2">
                    <Activity className="h-4 w-4 text-[#2E86C1]" />
                    Physical Exam
                  </h3>
                  <span className="text-xs font-mono font-medium text-[#2E86C1] bg-[#2E86C1]/10 px-2.5 py-1 rounded-md">Revealed</span>
                </div>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{caseData.exam}</p>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-[#f8f8f6]/50 p-6 opacity-60 flex items-center justify-center min-h-[120px]">
                <div className="text-center">
                  <Lock className="h-7 w-7 text-muted-foreground mx-auto mb-2" />
                  <h3 className="font-medium text-muted-foreground">Physical Exam details are locked</h3>
                  <p className="text-sm text-muted-foreground/70 mt-1">Request this information from the action panel.</p>
                </div>
              </div>
            )}

            {/* Lab Results - toggleable */}
            {revealedSections.has('labs') ? (
              <div className="rounded-xl border border-border/60 bg-white p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-foreground flex items-center gap-2">
                    <FlaskConical className="h-4 w-4 text-[#2E86C1]" />
                    Laboratory Results &amp; Investigations
                  </h3>
                  <span className="text-xs font-mono font-medium text-[#2E86C1] bg-[#2E86C1]/10 px-2.5 py-1 rounded-md">Revealed</span>
                </div>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{caseData.labs}</p>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-[#f8f8f6]/50 p-6 opacity-60 flex items-center justify-center min-h-[120px]">
                <div className="text-center">
                  <Lock className="h-7 w-7 text-muted-foreground mx-auto mb-2" />
                  <h3 className="font-medium text-muted-foreground">Laboratory Results are locked</h3>
                  <p className="text-sm text-muted-foreground/70 mt-1">Request this information from the action panel.</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Right panel — toggles between info and ranking */}
        <section className="lg:w-[40%] bg-[#f8f8f6] overflow-y-auto flex flex-col p-8">

          {rightPanel === 'info' ? (
            /* ── INFO PANEL ── */
            <>
              <div className="mb-8">
                <h2 className="text-xl font-medium tracking-tight text-foreground mb-2">What would you like to know?</h2>
                <p className="text-sm text-muted-foreground">Gather information strategically to formulate your diagnosis. Each request may cost clinical points.</p>
              </div>
              <div className="flex-grow space-y-4">
                {/* History - always done */}
                <button className="w-full text-left rounded-xl border border-border/60 bg-white p-4 flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed transition-shadow duration-200" disabled>
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mr-4 group-disabled:text-muted-foreground">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="block font-medium text-foreground group-disabled:text-muted-foreground">Request History</span>
                      <span className="text-xs text-muted-foreground">Already requested</span>
                    </div>
                  </div>
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                </button>

                {/* Physical Exam */}
                <button
                  onClick={() => toggleSection('exam')}
                  disabled={revealedSections.has('exam')}
                  className="w-full text-left rounded-xl border border-border/60 bg-white p-4 flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md hover:scale-[1.01]"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-[#2E86C1]/10 flex items-center justify-center mr-4 text-[#2E86C1] group-hover:bg-[#2E86C1] group-hover:text-white group-disabled:bg-muted group-disabled:text-muted-foreground transition-colors duration-200">
                      <Activity className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="block font-medium text-foreground group-disabled:text-muted-foreground">Request Physical Exam</span>
                      <span className="text-xs text-muted-foreground">{revealedSections.has('exam') ? 'Already requested' : 'Vitals, physical findings...'}</span>
                    </div>
                  </div>
                  {revealedSections.has('exam') ? (
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <span className="text-xs font-mono font-medium text-muted-foreground group-hover:text-[#2E86C1] transition-colors duration-200">-2 pts</span>
                  )}
                </button>

                {/* Lab Results */}
                <button
                  onClick={() => toggleSection('labs')}
                  disabled={revealedSections.has('labs')}
                  className="w-full text-left rounded-xl border border-border/60 bg-white p-4 flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md hover:scale-[1.01]"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-[#2E86C1]/10 flex items-center justify-center mr-4 text-[#2E86C1] group-hover:bg-[#2E86C1] group-hover:text-white group-disabled:bg-muted group-disabled:text-muted-foreground transition-colors duration-200">
                      <FlaskConical className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="block font-medium text-foreground group-disabled:text-muted-foreground">Request Lab Results</span>
                      <span className="text-xs text-muted-foreground">{revealedSections.has('labs') ? 'Already requested' : 'Labs, ECG, imaging, investigations...'}</span>
                    </div>
                  </div>
                  {revealedSections.has('labs') ? (
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <span className="text-xs font-mono font-medium text-muted-foreground group-hover:text-[#2E86C1] transition-colors duration-200">-3 pts</span>
                  )}
                </button>
              </div>

              <div className="mt-8 pt-6 border-t border-border/50">
                <div className="flex items-center justify-between mb-4 text-sm">
                  <span className="text-muted-foreground">Current Score Potential</span>
                  <span className="font-mono font-medium text-emerald-600">{100 - pointsUsed}/100</span>
                </div>
                {countdown > 0 ? (
                  <button
                    disabled
                    className="w-full rounded-lg bg-border text-muted-foreground font-medium py-4 px-6 cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    Ready to Diagnose
                    <Lock className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => setRightPanel('ranking')}
                    className="w-full rounded-lg bg-[#2E86C1] text-white font-medium py-4 px-6 shadow-md transition-all duration-200 hover:scale-[1.02] hover:bg-[#2576AB] hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    Ready to Diagnose
                    <ArrowRight className="h-4 w-4" />
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
                  className="w-9 h-9 rounded-full bg-white border border-border/60 flex items-center justify-center text-muted-foreground hover:border-[#2E86C1] hover:text-[#2E86C1] transition-colors duration-200 shrink-0"
                  title="Back to information gathering"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div>
                  <h2 className="text-xl font-medium tracking-tight text-foreground">Differential Diagnosis</h2>
                  <p className="text-sm text-muted-foreground">Rank from most to least likely.</p>
                </div>
              </div>

              {/* Your Ranking */}
              {ranked.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium uppercase tracking-wider text-[#2E86C1]">Your Ranking</p>
                    <button
                      onClick={handleReset}
                      className="text-xs font-medium text-muted-foreground hover:text-red-500 transition-colors duration-200 flex items-center gap-1"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Reset
                    </button>
                  </div>
                  <div className="space-y-2">
                    {ranked.map((dx, i) => (
                      <button
                        key={dx}
                        onClick={() => handleUnpick(dx)}
                        className="w-full text-left rounded-xl border border-[#2E86C1]/30 bg-white p-4 flex items-center group hover:border-red-300 transition-colors duration-200"
                      >
                        <div className="w-8 h-8 rounded-full bg-[#2E86C1] text-white flex items-center justify-center font-medium text-sm font-mono mr-4 shrink-0">
                          {i + 1}
                        </div>
                        <span className="font-medium text-foreground flex-1">{dx}</span>
                        <X className="h-4 w-4 text-border group-hover:text-red-400 transition-colors duration-200" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Available Options */}
              {unranked.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-3">
                    {ranked.length === 0 ? 'Select your most likely diagnosis' : `Select #${ranked.length + 1}`}
                  </p>
                  <div className="space-y-2">
                    {unranked.map((dx) => (
                      <button
                        key={dx}
                        onClick={() => handlePick(dx)}
                        className="w-full text-left rounded-xl border border-border/60 bg-white p-4 flex items-center group transition-all duration-200 hover:shadow-md hover:scale-[1.01]"
                      >
                        <div className="w-8 h-8 rounded-full bg-muted group-hover:bg-[#2E86C1]/10 flex items-center justify-center mr-4 shrink-0 transition-colors duration-200">
                          <Plus className="h-4 w-4 text-muted-foreground group-hover:text-[#2E86C1] transition-colors duration-200" />
                        </div>
                        <span className="font-medium text-foreground">{dx}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit footer */}
              <div className="mt-auto pt-6 border-t border-border/50">
                <button
                  onClick={handleSubmit}
                  disabled={!allRanked}
                  className="w-full rounded-lg bg-[#2E86C1] disabled:bg-border disabled:text-muted-foreground disabled:cursor-not-allowed text-white font-medium py-4 px-6 shadow-md transition-all duration-200 hover:scale-[1.02] hover:bg-[#2576AB] hover:shadow-lg flex items-center justify-center gap-2"
                >
                  {allRanked ? (
                    <>
                      Submit Ranking
                      <ArrowRight className="h-4 w-4" />
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
