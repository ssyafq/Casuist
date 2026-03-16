"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

const taglines = [
    "Practice real patient cases",
    "Build diagnostic intuition",
    "AI-grounded feedback with citations",
    "607 cases across 5 specialties",
]

export function RotatingTagline() {
    const [index, setIndex] = useState(0)

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % taglines.length)
        }, 3000)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="h-5 overflow-hidden">
            <AnimatePresence mode="wait">
                <motion.span
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="block text-sm font-medium uppercase tracking-wider text-muted-foreground"
                >
                    {taglines[index]}
                </motion.span>
            </AnimatePresence>
        </div>
    )
}
