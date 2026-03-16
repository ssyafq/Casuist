"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Check, Lock, ChevronRight, Plus, X } from "lucide-react"

const ALL_DX = [
    "Acute Myocardial Infarction",
    "Unstable Angina",
    "Aortic Dissection",
    "Pulmonary Embolism",
    "Pericarditis",
]

export function ProductMockup() {
    // Auto-loop: phase drives all visual state
    //   0 = only chief complaint visible
    //   1 = history revealed
    //   2 = physical exam revealed
    //   3,4,5 = dx ranked 1,2,3
    //   6 = score animating
    //   7 = grade visible, hold
    const [phase, setPhase] = useState(0)
    const [loopKey, setLoopKey] = useState(0)
    const [displayScore, setDisplayScore] = useState(0)
    const scoreRafRef = useRef(0)

    // User interaction state
    const [userRanked, setUserRanked] = useState<string[]>([])
    const [paused, setPaused] = useState(false)
    const lastInteractionRef = useRef(0)

    // Derived auto state
    const historyVisible = phase >= 1
    const examVisible = phase >= 2
    const autoRankedCount = phase >= 5 ? 3 : phase >= 4 ? 2 : phase >= 3 ? 1 : 0
    const gradeVisible = phase >= 7

    // Score count-up
    const animateScore = useCallback((target: number, ms: number) => {
        const start = performance.now()
        const tick = (now: number) => {
            const p = Math.min((now - start) / ms, 1)
            setDisplayScore(Math.floor(p * target))
            if (p < 1) {
                scoreRafRef.current = requestAnimationFrame(tick)
            }
        }
        scoreRafRef.current = requestAnimationFrame(tick)
    }, [])

    // Auto-loop timer chain
    useEffect(() => {
        if (paused) return

        setPhase(0)
        setDisplayScore(0)

        const ids: ReturnType<typeof setTimeout>[] = []
        const t = (ms: number, fn: () => void) => ids.push(setTimeout(fn, ms))

        t(2000, () => setPhase(1))
        t(4000, () => setPhase(2))
        t(6000, () => setPhase(3))
        t(6500, () => setPhase(4))
        t(7000, () => setPhase(5))
        t(9000, () => { setPhase(6); animateScore(87, 1000) })
        t(10000, () => setPhase(7))
        // Reset: phase→0 triggers CSS transitions out, then restart
        t(12000, () => { setPhase(0); setDisplayScore(0) })
        t(13000, () => setLoopKey(k => k + 1))

        return () => {
            ids.forEach(clearTimeout)
            if (scoreRafRef.current) cancelAnimationFrame(scoreRafRef.current)
        }
    }, [paused, loopKey, animateScore])

    // Resume auto-loop 5s after last interaction
    useEffect(() => {
        if (!paused) return
        const id = setInterval(() => {
            if (Date.now() - lastInteractionRef.current >= 5000) {
                setUserRanked([])
                setPaused(false)
            }
        }, 500)
        return () => clearInterval(id)
    }, [paused])

    // Interaction handlers
    const touch = useCallback(() => {
        lastInteractionRef.current = Date.now()
        setPaused(true)
    }, [])

    const handleRank = useCallback((label: string) => {
        touch()
        setUserRanked(prev => prev.includes(label) ? prev : [...prev, label])
    }, [touch])

    const handleUnrank = useCallback((label: string) => {
        touch()
        setUserRanked(prev => prev.filter(l => l !== label))
    }, [touch])

    // What to render
    const manual = paused
    const ranked = manual ? userRanked : ALL_DX.slice(0, autoRankedCount)
    const unranked = ALL_DX.filter(l => !ranked.includes(l))
    const score = manual ? 0 : displayScore
    const grade = manual ? false : gradeVisible
    const showHistory = manual || historyVisible
    const showExam = manual || examVisible

    return (
        <div className="w-full max-w-[480px] rounded-2xl border border-border/60 bg-white shadow-[0_32px_64px_rgba(0,0,0,0.08)] overflow-hidden select-none">
            {/* Browser chrome */}
            <div className="h-10 bg-muted border-b border-border/50 flex items-center px-4 gap-3">
                <div className="flex gap-1.5">
                    <div className="size-2.5 rounded-full bg-red-400" />
                    <div className="size-2.5 rounded-full bg-amber-400" />
                    <div className="size-2.5 rounded-full bg-emerald-400" />
                </div>
                <div className="mx-auto bg-white rounded-md px-3 py-0.5 text-[10px] text-muted-foreground flex items-center gap-1.5 font-mono">
                    <Lock className="h-2.5 w-2.5" />
                    casuist.med/case/291
                </div>
            </div>

            <div className="p-6 space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-medium text-muted-foreground">Case #291</span>
                        <span className="text-muted-foreground/40">&middot;</span>
                        <span className="font-mono text-[11px] text-[#2E86C1]">Cardiology</span>
                    </div>
                    <span className="font-mono text-sm font-medium text-foreground tabular-nums">02:41</span>
                </div>

                {/* Chief Complaint — always visible */}
                <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-[#2E86C1] mb-1.5">Chief Complaint</p>
                    <p className="text-sm font-medium text-foreground leading-snug">&ldquo;Acute substernal chest pain radiating to left arm, onset 2 hours ago&rdquo;</p>
                </div>

                {/* History — animated reveal */}
                <div
                    className="rounded-lg border border-border/60 p-3.5 transition-all duration-700 ease-out overflow-hidden"
                    style={{
                        opacity: showHistory ? 1 : 0,
                        maxHeight: showHistory ? 160 : 0,
                        paddingTop: showHistory ? 14 : 0,
                        paddingBottom: showHistory ? 14 : 0,
                        marginTop: showHistory ? undefined : 0,
                    }}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-foreground">History of Present Illness</span>
                        <span className="text-[10px] font-mono font-medium text-[#2E86C1] bg-[#2E86C1]/10 px-1.5 py-0.5 rounded">
                            Revealed
                        </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        58 y/o male, sudden onset crushing chest pain at rest. Associated diaphoresis and nausea. PMH: HTN, hyperlipidemia, T2DM. Family hx of MI (father, age 52).
                    </p>
                </div>

                {/* Locked / revealed sections */}
                <div className="flex gap-2">
                    <div
                        className={`flex-1 rounded-lg px-3 py-2.5 flex items-center gap-2 transition-all duration-700 ease-out ${
                            showExam
                                ? "border border-border/60 bg-white opacity-100"
                                : "border border-dashed border-border/80 bg-muted/50 opacity-50"
                        }`}
                    >
                        {showExam ? (
                            <Check className="h-3 w-3 text-[#2E86C1] shrink-0" />
                        ) : (
                            <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
                        )}
                        <span className={`text-[11px] ${showExam ? "text-foreground" : "text-muted-foreground"}`}>Physical Exam</span>
                        {showExam && (
                            <span className="ml-auto text-[9px] font-mono font-medium text-[#2E86C1] bg-[#2E86C1]/10 px-1 py-0.5 rounded">
                                Revealed
                            </span>
                        )}
                    </div>
                    <div className="flex-1 rounded-lg border border-dashed border-border/80 bg-muted/50 px-3 py-2.5 flex items-center gap-2 opacity-50">
                        <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="text-[11px] text-muted-foreground">Lab Results</span>
                    </div>
                </div>

                {/* Differential ranking */}
                <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-[#2E86C1] mb-2">
                        {ranked.length > 0 ? "Your Ranking" : "Select your most likely diagnosis"}
                    </p>
                    <div className="space-y-1.5">
                        {/* Ranked items */}
                        {ranked.map((label, i) => (
                            <button
                                key={label}
                                type="button"
                                onClick={() => manual && handleUnrank(label)}
                                className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs border border-[#2E86C1]/20 bg-white transition-all duration-500 ease-out ${
                                    manual ? "cursor-pointer hover:border-red-300 group" : "cursor-default"
                                }`}
                            >
                                <div className="size-5 rounded-full bg-[#2E86C1] text-white flex items-center justify-center text-[10px] font-mono font-medium shrink-0">
                                    {i + 1}
                                </div>
                                <span className="font-medium text-foreground text-left flex-1">{label}</span>
                                {manual ? (
                                    <X className="h-3 w-3 text-muted-foreground group-hover:text-red-400 transition-colors duration-200 shrink-0" />
                                ) : (
                                    <Check className="h-3 w-3 text-[#2E86C1] shrink-0" />
                                )}
                            </button>
                        ))}

                        {/* Unranked items */}
                        {unranked.map((label) => (
                            <button
                                key={label}
                                type="button"
                                onClick={() => handleRank(label)}
                                className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs border border-border/40 bg-muted/30 cursor-pointer transition-all duration-300 ease-out opacity-50 hover:opacity-80 hover:border-[#2E86C1]/30 group"
                            >
                                <div className="size-5 rounded-full bg-border group-hover:bg-[#2E86C1]/10 text-muted-foreground group-hover:text-[#2E86C1] flex items-center justify-center shrink-0 transition-colors duration-200">
                                    <Plus className="h-2.5 w-2.5" />
                                </div>
                                <span className="text-muted-foreground text-left">{label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Score + submit */}
                <div className="flex items-center justify-between pt-1">
                    <div className="flex items-baseline gap-1">
                        <span className="font-mono text-lg font-medium text-foreground tabular-nums transition-all duration-300">
                            {score}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">/100</span>
                        <span
                            className="ml-1.5 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded transition-opacity duration-500"
                            style={{ opacity: grade ? 1 : 0 }}
                        >
                            A
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-lg bg-[#2E86C1] px-3.5 py-1.5 text-[11px] font-medium text-white">
                        Submit Ranking
                        <ChevronRight className="h-3 w-3" />
                    </div>
                </div>
            </div>
        </div>
    )
}
