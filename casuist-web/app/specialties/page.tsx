'use client'

import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { clearSession } from '@/lib/session'
import { API_BASE } from '@/lib/mock-case'

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
    <div className="bg-background-light text-slate-900 min-h-screen">
      <div className="layout-container flex h-full grow flex-col">
        {/* Navigation */}
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-start py-12 px-6">
          <div className="max-w-4xl w-full">
            {/* Header Section */}
            <div className="text-center mb-12">
              <h1 className="text-slate-900 text-4xl font-black leading-tight tracking-tight mb-3 font-display">Choose a Specialty</h1>
              <p className="text-slate-500 text-lg font-normal">Pick a domain to get a real clinical case</p>
            </div>
            {/* Specialties Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {specialties.map((s) => (
                <button
                  key={s.slug}
                  onClick={() => { clearSession(); router.push(`/case?specialty=${s.slug}`) }}
                  className="flex flex-col items-center p-8 bg-white rounded-xl border-2 border-transparent hover:border-primary hover:shadow-xl transition-all group text-center"
                >
                  <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">{s.emoji}</div>
                  <h3 className="text-slate-900 text-xl font-bold mb-1 font-display">{s.name}</h3>
                  <span className="text-slate-500 text-sm font-medium font-mono">{s.case_count} cases</span>
                </button>
              ))}
              {/* More Options Placeholder */}
              <div className="flex flex-col items-center justify-center p-8 bg-slate-100/50 rounded-xl border-2 border-dashed border-slate-300 opacity-60">
                <span className="material-symbols-outlined text-4xl mb-2">add_circle</span>
                <p className="text-sm font-bold font-display uppercase tracking-wider">More coming soon</p>
              </div>
            </div>
            {/* Secondary Actions */}
            <div className="mt-16 flex items-center justify-center">
              <button
                onClick={handleRandomCase}
                className="flex items-center gap-2 px-6 py-3 bg-white rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors text-sm font-bold shadow-sm"
              >
                <span className="material-symbols-outlined text-lg">shuffle</span>
                Random Case
              </button>
            </div>
          </div>
        </main>
        <footer className="mt-auto py-8 border-t border-slate-200 text-center px-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 max-w-6xl mx-auto">
            <div className="flex items-center gap-2 opacity-60">
              <span className="material-symbols-outlined text-sm">medical_services</span>
              <span className="text-xs font-mono">CASUIST v2.4.0-BETA</span>
            </div>
            <div className="flex gap-6">
              <Link className="text-xs font-medium text-slate-500 hover:text-primary" href="/specialties">Library</Link>
              <span className="text-xs font-medium text-slate-400 cursor-not-allowed">Settings</span>
              <span className="text-xs font-medium text-slate-400 cursor-not-allowed">Help Center</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
