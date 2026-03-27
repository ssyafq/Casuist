'use client'

import Navbar from '@/components/Navbar'
import InnerNavbar from '@/components/InnerNavbar'
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
      <InnerNavbar />

      {/* Header */}
      <section className="bg-[#f8f8f6]">
        <div className="mx-auto max-w-[1480px] px-8 lg:px-16 pt-32 pb-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-base font-medium uppercase tracking-wider text-[#2E86C1]">Case Library</p>
            <h1 className="mt-5 text-4xl font-medium tracking-tight text-foreground sm:text-5xl">
              Choose a{" "}
              <span className="font-serif italic text-[#2E86C1]">Specialty</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground">
              Pick a domain to get a real clinical case
            </p>
          </div>
        </div>
      </section>

      {/* Specialties Grid */}
      <section className="border-t border-border/50 bg-white">
        <div className="mx-auto max-w-[1480px] px-8 lg:px-16 py-32">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {specialties.map((s) => (
              <button
                key={s.slug}
                onClick={() => { clearSession(); router.push(`/case?specialty=${s.slug}`) }}
                className="flex flex-col items-center rounded-xl border border-border/60 bg-white p-10 transition-all duration-200 hover:shadow-md hover:scale-[1.02] group text-center"
              >
                <div className="text-6xl mb-5 group-hover:scale-110 transition-transform duration-200">{s.emoji}</div>
                <h3 className="text-lg font-medium text-foreground">{s.name}</h3>
                <span className="mt-1.5 font-mono text-base text-muted-foreground">{s.case_count} cases</span>
              </button>
            ))}
            {/* More Options Placeholder */}
            <div className="flex flex-col items-center justify-center p-10 rounded-xl border border-dashed border-border bg-[#f8f8f6]/50">
              <span className="font-mono text-sm font-medium text-muted-foreground uppercase tracking-wider">More coming soon</span>
            </div>
          </div>
        </div>
      </section>

      {/* Random Case CTA */}
      <section className="border-t border-border/50 bg-[#f8f8f6]">
        <div className="mx-auto max-w-[1480px] px-8 lg:px-16 py-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-lg text-muted-foreground">
              Not sure where to start? We&apos;ll pick one for you.
            </p>
            <button
              onClick={handleRandomCase}
              className="mt-8 inline-flex items-center justify-center gap-2.5 rounded-lg border border-foreground/20 bg-transparent px-8 py-4 text-base font-medium text-foreground transition-all duration-200 hover:scale-[1.02] hover:border-foreground/40 hover:shadow-md"
            >
              <Shuffle className="h-5 w-5" />
              Random Case
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-white">
        <div className="mx-auto max-w-[1480px] px-8 lg:px-16 py-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-5">
            <span className="font-mono text-sm text-muted-foreground">CASUIST v2.4.0-BETA</span>
            <div className="flex gap-8">
              <Link className="text-sm font-medium text-muted-foreground hover:text-[#2E86C1] transition-colors duration-200" href="/specialties">Library</Link>
              <span className="text-sm font-medium text-muted-foreground/50 cursor-not-allowed">Settings</span>
              <span className="text-sm font-medium text-muted-foreground/50 cursor-not-allowed">Help Center</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
