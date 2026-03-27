"use client"

import Link from "next/link"
import { useEffect, useState, useRef } from "react"
import { motion, useInView } from "framer-motion"
import Navbar from "@/components/Navbar"
import { ProductMockup } from "@/components/product-mockup"
import { RotatingTagline } from "@/components/rotating-tagline"
import { ArrowRight } from "lucide-react"

// Count-up hook
function useCountUp(end: number, duration: number = 2000) {
    const [count, setCount] = useState(0)
    const ref = useRef<HTMLSpanElement>(null)
    const inView = useInView(ref, { once: true })

    useEffect(() => {
        if (!inView) return

        let startTime: number
        const step = (timestamp: number) => {
            if (!startTime) startTime = timestamp
            const progress = Math.min((timestamp - startTime) / duration, 1)
            setCount(Math.floor(progress * end))
            if (progress < 1) {
                requestAnimationFrame(step)
            }
        }
        requestAnimationFrame(step)
    }, [end, duration, inView])

    return { count, ref }
}

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-[#f8f8f6]">
            <Navbar />

            <main>
                {/* Hero Section */}
                <section className="relative overflow-hidden">
                    <div className="mx-auto max-w-[1480px] px-8 lg:px-16">
                        <div className="grid min-h-screen items-center gap-16 pt-32 pb-20 lg:grid-cols-2 lg:gap-12 lg:pb-0 lg:pt-32">
                            {/* Left Content */}
                            <div className="max-w-2xl">
                                {/* Tag line */}
                                <div className="mb-10 text-base text-muted-foreground">
                                    <RotatingTagline />
                                </div>

                                {/* Headline */}
                                <h1 className="text-5xl font-medium tracking-tight text-foreground sm:text-6xl lg:text-[4.25rem] lg:leading-[1.1]">
                                    <span className="text-balance">Build Diagnostic Intuition with</span>{" "}
                                    <span className="font-serif italic text-[#2E86C1]">Real Patient Cases</span>
                                </h1>

                                {/* Subheadline with animated stats */}
                                <p className="mt-8 text-lg leading-relaxed text-muted-foreground sm:text-xl">
                                    Work through <CountUpStat end={607} /> clinical scenarios across <CountUpStat end={5} /> specialties. Request history, exams, and labs strategically. Get <span className="font-medium text-[#2E86C1]">AI</span>-grounded feedback with PubMed citations.
                                </p>

                                {/* CTAs */}
                                <div className="mt-12 flex flex-wrap items-center gap-5">
                                    <Link
                                        href="/specialties"
                                        className="inline-flex items-center justify-center gap-2.5 rounded-lg bg-[#2E86C1] px-8 py-4 text-base font-medium text-white shadow-md transition-all duration-200 hover:scale-[1.02] hover:bg-[#2576AB] hover:shadow-lg"
                                    >
                                        Start Practicing
                                        <ArrowRight className="h-5 w-5" />
                                    </Link>
                                    <Link
                                        href="#how-it-works"
                                        className="inline-flex items-center justify-center gap-2.5 rounded-lg border border-foreground/20 bg-transparent px-8 py-4 text-base font-medium text-foreground transition-all duration-200 hover:scale-[1.02] hover:border-foreground/40 hover:shadow-md"
                                    >
                                        See how it works
                                    </Link>
                                </div>
                            </div>

                            {/* Right - Product Mockup with float animation */}
                            <div className="relative lg:h-full lg:flex lg:items-center lg:justify-end">
                                <div className="animate-float">
                                    <ProductMockup />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* How It Works */}
                <section id="how-it-works" className="border-t border-border/50 bg-white">
                    <div className="mx-auto max-w-[1480px] px-8 py-32 lg:px-16">
                        <div className="mx-auto max-w-3xl text-center">
                            <p className="text-base font-medium uppercase tracking-wider text-[#2E86C1]">How It Works</p>
                            <h2 className="mt-5 text-4xl font-medium tracking-tight text-foreground sm:text-5xl">
                                Practice like the real thing
                            </h2>
                            <p className="mt-5 text-lg text-muted-foreground">
                                Each case follows a structured clinical workflow with scoring based on diagnostic accuracy,
                                ranking quality, information efficiency, and speed.
                            </p>
                        </div>

                        <div className="mt-20 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
                            {[
                                { step: "01", title: "Read the Chief Complaint", description: "Start with the patient's presenting symptoms and initial context." },
                                { step: "02", title: "Request Information", description: "Strategically gather history, physical exam, or lab results. Efficiency matters." },
                                { step: "03", title: "Rank Differentials", description: "Order 5 possible diagnoses from most to least likely." },
                                { step: "04", title: "Get Feedback", description: "AI-grounded analysis with PubMed citations for learning." },
                            ].map((item, index) => (
                                <WorkflowStep
                                    key={item.step}
                                    step={item.step}
                                    title={item.title}
                                    description={item.description}
                                    index={index}
                                />
                            ))}
                        </div>
                    </div>
                </section>

                {/* Scoring Section */}
                <section className="border-t border-border/50 bg-[#f8f8f6]">
                    <div className="mx-auto max-w-[1480px] px-8 py-32 lg:px-16">
                        <div className="grid gap-16 lg:grid-cols-2 lg:gap-20">
                            <div>
                                <p className="text-base font-medium uppercase tracking-wider text-[#2E86C1]">Scoring</p>
                                <h2 className="mt-5 text-4xl font-medium tracking-tight text-foreground">
                                    Four components,{" "}
                                    <span className="font-serif italic text-[#2E86C1]">weighted by clinical importance</span>
                                </h2>
                                <p className="mt-5 text-lg text-muted-foreground">
                                    Your score reflects real clinical decision-making priorities. Diagnostic accuracy matters most,
                                    but efficiency and speed also count.
                                </p>
                                <Link
                                    href="/specialties"
                                    className="mt-10 inline-flex items-center gap-2.5 text-base font-medium text-[#2E86C1] transition-all duration-200 hover:gap-3"
                                >
                                    Try a case now
                                    <ArrowRight className="h-5 w-5" />
                                </Link>
                            </div>

                            <div className="grid gap-5 sm:grid-cols-2">
                                {[
                                    { points: 40, title: "Diagnosis Accuracy", description: "Is your #1 ranked diagnosis correct?" },
                                    { points: 30, title: "Ranking Quality", description: "How well did you order all five differentials?" },
                                    { points: 20, title: "Info Efficiency", description: "Did you request only what you needed?" },
                                    { points: 10, title: "Speed Bonus", description: "Full marks under 60 seconds." },
                                ].map((item, index) => (
                                    <ScoreCard
                                        key={item.title}
                                        points={item.points}
                                        title={item.title}
                                        description={item.description}
                                        index={index}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="border-t border-border/50 bg-white">
                    <div className="mx-auto max-w-[1480px] px-8 py-32 lg:px-16">
                        <div className="mx-auto max-w-3xl text-center">
                            <h2 className="text-4xl font-medium tracking-tight text-foreground sm:text-5xl">
                                Ready to{" "}
                                <span className="font-serif italic text-[#2E86C1]">sharpen your diagnostic skills</span>?
                            </h2>
                            <p className="mt-5 text-lg text-muted-foreground">
                                Pick a specialty and start your first case. No account required.
                            </p>
                            <Link
                                href="/specialties"
                                className="mt-10 inline-flex items-center justify-center gap-2.5 rounded-lg bg-[#2E86C1] px-10 py-4 text-base font-medium text-white shadow-md transition-all duration-200 hover:scale-[1.02] hover:bg-[#2576AB] hover:shadow-lg"
                            >
                                Choose a Specialty
                                <ArrowRight className="h-5 w-5" />
                            </Link>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    )
}

function CountUpStat({ end }: { end: number }) {
    const { count, ref } = useCountUp(end, 1500)
    return (
        <span ref={ref} className="font-mono font-medium text-foreground">
            {count}
        </span>
    )
}

function WorkflowStep({
    step,
    title,
    description,
    index
}: {
    step: string
    title: string
    description: string
    index: number
}) {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: "-50px" })

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{
                duration: 0.5,
                delay: index * 0.15,
                ease: [0.25, 0.1, 0.25, 1]
            }}
        >
            <span className="font-mono text-sm font-medium text-[#2E86C1]">{step}</span>
            <h3 className="mt-3 text-lg font-medium text-foreground">{title}</h3>
            <p className="mt-2 text-base text-muted-foreground">{description}</p>
        </motion.div>
    )
}

function ScoreCard({
    points,
    title,
    description,
    index
}: {
    points: number
    title: string
    description: string
    index: number
}) {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: "-50px" })

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{
                duration: 0.5,
                delay: index * 0.1,
                ease: [0.25, 0.1, 0.25, 1]
            }}
            className="rounded-xl border border-border/60 bg-white p-6 transition-shadow duration-200 hover:shadow-md"
        >
            <span className="font-mono text-3xl font-medium text-foreground">{points}</span>
            <span className="ml-1.5 font-mono text-base text-muted-foreground">pts</span>
            <h3 className="mt-3 text-base font-medium text-foreground">{title}</h3>
            <p className="mt-1.5 text-base text-muted-foreground">{description}</p>
        </motion.div>
    )
}
