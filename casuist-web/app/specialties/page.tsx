'use client'

import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { clearSession } from '@/lib/session'
import { API_BASE } from '@/lib/mock-case'
import { ArrowRight, Shuffle } from 'lucide-react'

interface SpecialtyInfo {
  slug: string
  name: string
  emoji: string
  case_count: number
}

// Fallback if API is down
const FALLBACK_SPECIALTIES: SpecialtyInfo[] = [
  { slug: 'cardiology', name: 'Cardiology', emoji: '\uD83E\uDEC0', case_count: 0 },
  { slug: 'respiratory', name: 'Respiratory', emoji: '\uD83E\uDEC1', case_count: 0 },
  { slug: 'neurology', name: 'Neurology', emoji: '\uD83E\uDDE0', case_count: 0 },
  { slug: 'endocrinology', name: 'Endocrinology', emoji: '\u2697\uFE0F', case_count: 0 },
  { slug: 'gastroenterology', name: 'Gastroenterology', emoji: '\uD83D\uDD2C', case_count: 0 },
]

export default function SpecialtiesPage() {
  const router = useRouter()
  const [specialties, setSpecialties] = useState<SpecialtyInfo[]>(FALLBACK_SPECIALTIES)

  useEffect(() => {
    async function fetchSpecialties() {
      try {
        const res = await fetch(`${API_BASE}/api/specialties`)
        if (res.ok) {
          const data: SpecialtyInfo[] = await res.json()
          setSpecialties(data)
        }
      } catch {
        // Keep fallback
      }
    }
    fetchSpecialties()
  }, [])

  const handleRandomCase = () => {
    clearSession()
    const random = specialties[Math.floor(Math.random() * specialties.length)]
    router.push(`/case?specialty=${random.slug}`)
  }

  return (
    <div className="min-h-screen bg-[#f8f8f6]">
      <Navbar />

      {/* Header */}
      <section className="bg-[#f8f8f6]">
        <div className="mx-auto max-w-7xl px-6 lg:px-12 pt-24 pb-16">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium uppercase tracking-wider text-[#2E86C1]">Case Library</p>
            <h1 className="mt-4 text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
              Choose a{" "}
              <span className="font-serif italic text-[#2E86C1]">Specialty</span>
            </h1>
            <p className="mt-4 text-muted-foreground">
              Pick a domain to get a real clinical case
            </p>
          </div>
        </div>
      </section>

      {/* Specialties Grid */}
      <section className="border-t border-border/50 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-12 py-24">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {specialties.map((s) => (
              <button
                key={s.slug}
                onClick={() => { clearSession(); router.push(`/case?specialty=${s.slug}`) }}
                className="flex flex-col items-center rounded-xl border border-border/60 bg-white p-8 transition-all duration-200 hover:shadow-md hover:scale-[1.02] group text-center"
              >
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-200">{s.emoji}</div>
                <h3 className="font-medium text-foreground">{s.name}</h3>
                <span className="mt-1 font-mono text-sm text-muted-foreground">{s.case_count} cases</span>
              </button>
            ))}
            {/* More Options Placeholder */}
            <div className="flex flex-col items-center justify-center p-8 rounded-xl border border-dashed border-border bg-[#f8f8f6]/50">
              <span className="font-mono text-xs font-medium text-muted-foreground uppercase tracking-wider">More coming soon</span>
            </div>
          </div>
        </div>
      </section>

      {/* Random Case CTA */}
      <section className="border-t border-border/50 bg-[#f8f8f6]">
        <div className="mx-auto max-w-7xl px-6 lg:px-12 py-16">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-muted-foreground">
              Not sure where to start? We&apos;ll pick one for you.
            </p>
            <button
              onClick={handleRandomCase}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg border border-foreground/20 bg-transparent px-6 py-3 text-sm font-medium text-foreground transition-all duration-200 hover:scale-[1.02] hover:border-foreground/40 hover:shadow-md"
            >
              <Shuffle className="h-4 w-4" />
              Random Case
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-12 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <span className="font-mono text-xs text-muted-foreground">CASUIST v2.4.0-BETA</span>
            <div className="flex gap-6">
              <Link className="text-xs font-medium text-muted-foreground hover:text-[#2E86C1] transition-colors duration-200" href="/specialties">Library</Link>
              <span className="text-xs font-medium text-muted-foreground/50 cursor-not-allowed">Settings</span>
              <span className="text-xs font-medium text-muted-foreground/50 cursor-not-allowed">Help Center</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
